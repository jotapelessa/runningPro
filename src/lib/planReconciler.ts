import { TrainingPlan, UserActivity, DailyWorkout, RunnerState } from '../types';
import { calculateVDOT } from './vdotCalculator';

export interface ReconciliationResult {
  updatedPlan: TrainingPlan;
  matchedCount: number;
  unmatchedActivities: UserActivity[];
  overloadDetected: boolean;
  overloadNotes: string[];
}

export interface CalibrationResult {
  updatedRunnerState: Partial<RunnerState>;
  calibrated: boolean;
  notes: string[];
}

/**
 * Normaliza datas para YYYY-MM-DD
 */
function toDateString(d: string | Date): string {
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

const WEEKDAY_NAMES_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

/**
 * Analisa as atividades reais do Intervals.icu e calibra os parâmetros fisiológicos do atleta:
 * - Volume semanal real acumulado (km/semana)
 * - Cadência média observada
 * - VDOT estimado se houver teste ou corrida contínua relevante (> 2km)
 * - Frequência cardíaca média/máxima
 */
export function calibrateRunnerFromActivities(
  currentState: RunnerState,
  activities: UserActivity[]
): CalibrationResult {
  if (!activities || activities.length === 0) {
    return {
      updatedRunnerState: {},
      calibrated: false,
      notes: []
    };
  }

  const notes: string[] = [];
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const recentActivities = activities.filter(a => {
    const t = new Date(a.date).getTime();
    return !isNaN(t) && (now - t) <= thirtyDaysMs && a.source === 'intervals';
  });

  if (recentActivities.length === 0) {
    return {
      updatedRunnerState: {},
      calibrated: false,
      notes: []
    };
  }

  // 1. Calcular volume da semana atual (últimos 7 dias)
  const last7DaysActs = recentActivities.filter(a => (now - new Date(a.date).getTime()) <= sevenDaysMs);
  const weeklyKmFromFit = Math.round(last7DaysActs.reduce((acc, a) => acc + (a.distanceKm || 0), 0) * 10) / 10;

  // 2. Média de cadência dos treinos com dados
  const cadenceValues = recentActivities
    .map(a => a.cadenceSpm)
    .filter((c): c is number => typeof c === 'number' && c > 120 && c < 220);
  const avgCadence = cadenceValues.length > 0
    ? Math.round(cadenceValues.reduce((sum, c) => sum + c, 0) / cadenceValues.length)
    : undefined;

  // 3. Frequência Cardíaca Máxima observada
  const hrValues = recentActivities
    .map(a => a.maxHr || a.avgHr)
    .filter((h): h is number => typeof h === 'number' && h > 100 && h < 220);
  const peakHr = hrValues.length > 0 ? Math.max(...hrValues) : undefined;

  // 4. Melhor VDOT observado em corridas válidas (>= 1.5km)
  const runningActivities = recentActivities.filter(a => a.type === 'run' && a.distanceMeters >= 1500 && a.durationSeconds >= 300);
  let bestVdot: number | undefined;

  runningActivities.forEach(act => {
    const actVdot = act.vdot || calculateVDOT(act.distanceMeters, act.durationSeconds);
    if (actVdot > 20 && actVdot < 85) {
      if (!bestVdot || actVdot > bestVdot) {
        bestVdot = Math.round(actVdot * 10) / 10;
      }
    }
  });

  const updates: Partial<RunnerState> = {};

  if (weeklyKmFromFit > 0 && weeklyKmFromFit !== currentState.weeklyVolume) {
    updates.weeklyVolume = weeklyKmFromFit;
    notes.push(`Volume semanal calibrado para ${weeklyKmFromFit} km com base nas atividades sincronizadas.`);
  }

  if (avgCadence && (!currentState.cadenceSpm || Math.abs(currentState.cadenceSpm - avgCadence) >= 3)) {
    updates.cadenceSpm = avgCadence;
    notes.push(`Cadência média calibrada para ${avgCadence} ppm.`);
  }

  if (peakHr && (!currentState.maxHr || peakHr > currentState.maxHr)) {
    updates.maxHr = peakHr;
    updates.macHR = peakHr;
    notes.push(`Frequência Cardíaca Máxima observada atualizada para ${peakHr} bpm.`);
  }

  // Calibrar VDOT se o atleta ainda não estava calibrado ou se o VDOT do relógio foi mais preciso
  if (bestVdot && (!currentState.isCalibrated || currentState.currentVdot === 0 || !currentState.currentVdot)) {
    updates.currentVdot = bestVdot;
    updates.currentVo2max = bestVdot;
    updates.isCalibrated = true;
    updates.calibrationSource = 'Intervals.icu (Telemetria Real)';
    notes.push(`VDOT calibrado automaticamente para ${bestVdot} a partir de corrida recente.`);
  } else if (!currentState.isCalibrated && recentActivities.length > 0) {
    updates.isCalibrated = true;
    updates.calibrationSource = 'Intervals.icu';
  }

  return {
    updatedRunnerState: updates,
    calibrated: Object.keys(updates).length > 0,
    notes
  };
}

/**
 * Reconcilia as atividades sincronizadas com os dias da planilha de treino de 8 semanas.
 * Atribui treinos completados aos dias da semana correspondentes, compara volume e adapta
 * dinamicamente a carga dos treinos subsequentes para evitar overtraining.
 */
export function reconcilePlanWithActivities(
  plan: TrainingPlan,
  activities: UserActivity[]
): ReconciliationResult {
  if (!plan || !plan.weeks || !activities || activities.length === 0) {
    return {
      updatedPlan: plan,
      matchedCount: 0,
      unmatchedActivities: activities || [],
      overloadDetected: false,
      overloadNotes: []
    };
  }

  let matchedCount = 0;
  const matchedActivityIds = new Set<string>();
  const overloadNotes: string[] = [];

  // Clona o plano de forma profunda e imutável
  const newWeeks = plan.weeks.map(week => ({
    ...week,
    days: week.days.map((day: DailyWorkout) => ({ ...day }))
  }));

  // Ordena atividades: mais recentes primeiro e apenas do Intervals.icu
  const sortedActivities = [...activities]
    .filter(a => a.source === 'intervals')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sortedActivities.forEach(act => {
    if (act.type !== 'run' && act.type !== 'walk' && act.type !== 'other') return;

    const actDate = toDateString(act.date);
    if (!actDate) return;

    const actDateObj = new Date(act.date);
    const dayOfWeekIndex = actDateObj.getDay(); // 0 = Domingo, 1 = Segunda, ...
    const dayOfWeekName = WEEKDAY_NAMES_PT[dayOfWeekIndex];

    const actKm = act.distanceMeters ? act.distanceMeters / 1000 : act.distanceKm || 0;

    let matched = false;

    // 1. Prioridade: Emparelhar com o dia da semana correspondente na semana ativa (Semana 1)
    for (const week of newWeeks) {
      // Tenta primeiro o dia exato da semana (ex: 'Quarta-feira')
      const targetDay = week.days.find(d => 
        (d.dayName?.toLowerCase().includes(dayOfWeekName.toLowerCase()) || 
         dayOfWeekName.toLowerCase().includes(d.dayName?.toLowerCase() || '')) &&
        (!d.completed || d.uploadedFile?.source?.includes(act.id))
      );

      if (targetDay && (actKm >= 1.0 || act.durationSeconds >= 600)) {
        targetDay.completed = true;
        targetDay.completedPace = act.paceFormatted && act.paceFormatted !== '--:--' ? act.paceFormatted : `${act.paceSecondsPerKm}s/km`;
        targetDay.completedHr = act.avgHr;
        targetDay.uploadedFile = {
          fileName: act.title || `Treino Sincronizado (${actDate})`,
          distanceKm: Math.round(actKm * 100) / 100,
          durationFormatted: act.durationFormatted || `${Math.round((act.durationSeconds || 0) / 60)} min`,
          paceFormatted: act.paceFormatted && act.paceFormatted !== '--:--' ? act.paceFormatted : '6:00/km',
          avgHr: act.avgHr,
          maxHr: act.maxHr,
          avgCadence: act.cadenceSpm,
          source: `Intervals.icu: ${act.id}`
        };

        // Adaptação fisiológica: verificar sobrecarga
        const prescribedKm = targetDay.totalKm || 5;
        if (actKm > prescribedKm * 1.3 && actKm > prescribedKm + 2.0) {
          overloadNotes.push(
            `Sobrecarga detectada em ${targetDay.dayName}: realizado ${actKm.toFixed(1)} km (prescrito ${prescribedKm} km). O treino seguinte foi ajustado em -15% para recuperação aeróbica.`
          );

          // Ajuste regenerativo no dia seguinte do plano
          const nextDayIndex = week.days.findIndex(d => d.id === targetDay.id) + 1;
          if (nextDayIndex < week.days.length) {
            const nextDay = week.days[nextDayIndex];
            if (nextDay && nextDay.type !== 'REST' && !nextDay.completed) {
              nextDay.totalKm = Math.max(3, Math.round(nextDay.totalKm * 0.85 * 10) / 10);
              nextDay.notes = (nextDay.notes || '') + ' [Ajustado automaticamente: volume reduzido devido a sobrecarga no treino anterior].';
            }
          }
        }

        matchedActivityIds.add(act.id);
        matchedCount++;
        matched = true;
        break;
      }
    }

    // 2. Fallback: Se não encontrou o dia exato da semana, preenche o primeiro dia vago da semana
    if (!matched && (actKm >= 1.5 || act.durationSeconds >= 900)) {
      for (const week of newWeeks) {
        const fallbackDay = week.days.find(d => d.type !== 'REST' && !d.completed);
        if (fallbackDay) {
          fallbackDay.completed = true;
          fallbackDay.completedPace = act.paceFormatted || '6:00/km';
          fallbackDay.completedHr = act.avgHr;
          fallbackDay.uploadedFile = {
            fileName: act.title || `Treino Sincronizado (${actDate})`,
            distanceKm: Math.round(actKm * 100) / 100,
            durationFormatted: act.durationFormatted || `${Math.round((act.durationSeconds || 0) / 60)} min`,
            paceFormatted: act.paceFormatted || '6:00/km',
            avgHr: act.avgHr,
            maxHr: act.maxHr,
            avgCadence: act.cadenceSpm,
            source: `Intervals.icu: ${act.id}`
          };
          matchedActivityIds.add(act.id);
          matchedCount++;
          break;
        }
      }
    }
  });

  const unmatchedActivities = activities.filter(a => !matchedActivityIds.has(a.id));

  return {
    updatedPlan: {
      ...plan,
      weeks: newWeeks
    },
    matchedCount,
    unmatchedActivities,
    overloadDetected: overloadNotes.length > 0,
    overloadNotes
  };
}

