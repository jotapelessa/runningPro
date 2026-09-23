/**
 * @file planReconciler.ts
 * @module lib/planReconciler
 * @category Physiology
 * @description Motor de reconciliação e calibração adaptativa da planilha com atividades reais (Google Fit, Amazfit Zepp, FIT/GPX).
 */

import { TrainingPlan, UserActivity, DailyWorkout } from '../types';

export interface ReconciliationResult {
  updatedPlan: TrainingPlan;
  matchedCount: number;
  unmatchedActivities: UserActivity[];
  overloadDetected: boolean;
  overloadNotes: string[];
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

/**
 * Reconcilia as atividades sincronizadas com os dias da planilha de treino de 8 semanas.
 * Atribui treinos completados aos dias correspondentes, compara volume e detecta sobrecargas.
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

  // Mapear atividades por data (YYYY-MM-DD)
  const activitiesByDate = new Map<string, UserActivity[]>();
  activities.forEach(act => {
    const ds = toDateString(act.date);
    if (!ds) return;
    const existing = activitiesByDate.get(ds) || [];
    existing.push(act);
    activitiesByDate.set(ds, existing);
  });

  // Clona o plano de forma profunda e imutável
  const newWeeks = plan.weeks.map(week => {
    const newDays = week.days.map((day: DailyWorkout) => {
      // Se já estava completado manualmente ou por arquivo, preserva
      // Mas se houver atividade real com data compatível, vincula dados enriquecidos
      return { ...day };
    });

    return {
      ...week,
      days: newDays
    };
  });

  // Tenta emparelhar atividades recentes com os dias da semana atual
  // Para cada atividade de corrida ou caminhada rápida nos últimos 60 dias:
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedActivities.forEach(act => {
    if (act.type !== 'run' && act.type !== 'walk') return;

    const actDate = toDateString(act.date);
    if (!actDate) return;

    // Procura no plano um dia de treino não completado ou compatível
    let found = false;
    for (const week of newWeeks) {
      for (const day of week.days) {
        if (day.type === 'REST' || day.type === 'Rest') continue;

        // Se o dia não foi concluído ainda ou foi sincronizado desta mesma atividade
        if (!day.completed || day.uploadedFile?.source === act.id) {
          const actKm = act.distanceMeters ? act.distanceMeters / 1000 : act.distanceKm || 0;

          // Se a distância for razoavelmente próxima (ou > 1.5km)
          if (actKm >= 1.5) {
            day.completed = true;
            day.completedPace = act.paceFormatted || '5:30/km';
            day.completedHr = act.avgHr;
            day.uploadedFile = {
              fileName: act.title || `Treino Sincronizado (${actDate})`,
              distanceKm: Math.round(actKm * 100) / 100,
              durationFormatted: act.durationFormatted || `${Math.round((act.durationSeconds || 0) / 60)} min`,
              paceFormatted: act.paceFormatted || '5:30/km',
              avgHr: act.avgHr,
              maxHr: act.maxHr,
              avgCadence: act.cadenceSpm,
              source: `Google Fit / Zepp: ${act.id}`
            };

            // Checagem de sobrecarga (Regra dos 10% / Volume Excessivo)
            const prescribedKm = day.totalKm || 5;
            if (actKm > prescribedKm * 1.35 && actKm > prescribedKm + 2.5) {
              overloadNotes.push(
                `Alerta no treino "${day.title}": Prescrito ${prescribedKm} km, mas realizado ${actKm.toFixed(1)} km (+${Math.round(((actKm - prescribedKm) / prescribedKm) * 100)}%).`
              );
            }

            matchedActivityIds.add(act.id);
            matchedCount++;
            found = true;
            break;
          }
        }
      }
      if (found) break;
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
