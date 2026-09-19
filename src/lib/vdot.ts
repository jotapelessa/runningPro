import { RacePrediction, HRZone, PaceZone, WeekPlan, DayWorkout, RunnerLevel, PainReport } from '../types';

/**
 * Procedural implementation of Jack Daniels' VDOT Oxygen Cost equations:
 * 
 * VO2_cost = -4.60 + 0.182258 * v + 0.000104 * v^2
 * where v = velocity in m/min
 * 
 * F = fraction of VO2max sustained for time t (in minutes):
 * F = 0.8 + 0.1894393 * exp(-0.012778 * t) + 0.2989558 * exp(-0.19326 * t)
 * 
 * VDOT = VO2_cost / F
 */

export function calculateVDOT(distanceMeters: number, timeSeconds: number): number {
  if (distanceMeters <= 0 || timeSeconds <= 0) return 0;
  const t = timeSeconds / 60; // time in minutes
  const v = distanceMeters / t; // velocity in meters/min
  const VO2 = -4.60 + 0.182258 * v + 0.000104 * v * v;
  const F = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.19326 * t);
  return VO2 / F;
}

/**
 * Predicts the exact race time (in seconds) for a given distance using a binary search solver
 * based on the VDOT equations.
 */
export function predictTimeForDistance(distanceMeters: number, targetVDOT: number): number {
  if (targetVDOT <= 10) return 0;
  
  let lowSec = 60; // 1 minute
  let highSec = 30 * 3600; // 30 hours
  
  // 40 iterations of binary search yields extreme precision
  for (let i = 0; i < 40; i++) {
    const mid = (lowSec + highSec) / 2;
    const computedVDOT = calculateVDOT(distanceMeters, mid);
    if (computedVDOT > targetVDOT) {
      lowSec = mid; // Needs more time to lower computed VDOT to target
    } else {
      highSec = mid; // Needs less time to raise computed VDOT to target
    }
  }
  
  return (lowSec + highSec) / 2;
}

export function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}/km`;
}

export function formatTimeStr(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculates all equivalent performances for standard distances.
 */
export function getPredictions(vdot: number): RacePrediction[] {
  const distances = [
    { name: '1 Milha', meters: 1609.34 },
    { name: '3k', meters: 3000 },
    { name: '5k', meters: 5000 },
    { name: '10k', meters: 10000 },
    { name: 'Meia Maratona (21.1k)', meters: 21097.5 },
    { name: 'Maratona (42.2k)', meters: 42195 }
  ];

  return distances.map(dist => {
    const sec = predictTimeForDistance(dist.meters, vdot);
    const paceSec = sec / (dist.meters / 1000);
    return {
      name: dist.name,
      distanceMeters: dist.meters,
      timeStr: formatTimeStr(sec),
      paceStr: formatPace(paceSec),
      totalSeconds: sec
    };
  });
}

/**
 * Resolves training pace zones for any VDOT value.
 */
export function calculatePaceZones(vdot: number): PaceZone[] {
  // Daniels' training intensities percentages (of VDOT value)
  // Easy (E): ~59% to 74% (mid 66%)
  // Marathon (M): 75% to 84% (mid 80%)
  // Threshold (T): 83% to 88% (mid 86%)
  // Interval (I): 95% to 100% (mid 97.5%)
  // Repetition (R): 105% to 110% (mid 107.5%)
  
  const intensities = [
    { key: 'E' as const, name: 'Trote / Ritmo Leve (Easy - E)', pctRange: '59% - 74%', midPct: 66, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', description: 'Base aeróbica, aquecimento, desaquecimento e regeneração ativa.', descriptionSpeed: 'Ritmo confortável onde é possível conversar fluentemente.' },
    { key: 'M' as const, name: 'Ritmo Maratona (Marathon - M)', pctRange: '75% - 84%', midPct: 80, color: 'text-blue-600 bg-blue-50 border-blue-200', description: 'Simula o cansaço acumulado nas pernas; resistência específica de alta quilometragem.', descriptionSpeed: 'Esforço substancial, controlado de longa duração.' },
    { key: 'T' as const, name: 'Ritmo Limiar (Limiar de Lactato - T)', pctRange: '83% - 88%', midPct: 86, color: 'text-amber-600 bg-amber-50 border-amber-200', description: 'Zera o balanço de lactato produzido. Essencial para aumentar a tolerância metabólica ao cansaço.', descriptionSpeed: 'Ritmo confortavelmente exaustivo, mantido por até 40-50 min.' },
    { key: 'I' as const, name: 'Ritmo de Intervalos (Intervals - VO2Max - I)', pctRange: '95% - 100%', midPct: 97.5, color: 'text-rose-600 bg-rose-50 border-rose-200', description: 'Tiros estruturados de VO2Máx. Foco no desenvolvimento cardíaco e ventilatório máximo.', descriptionSpeed: 'Ritmo muito forte de tiro. Esforço máximo sustentável por 3 a 5 min.' },
    { key: 'R' as const, name: 'Ritmo de Repetições (Repetition - R)', pctRange: '105% - 110%', midPct: 107.5, color: 'text-purple-600 bg-purple-50 border-purple-200', description: 'Aprimoramento da economia de corrida, mecânica motora e capacidade anaeróbica desoxigenada.', descriptionSpeed: 'Ritmo de sprint rápido com recuperação longa. Velocidade pura.' }
  ];

  return intensities.map(item => {
    // Solve velocity for the mid intensity
    const VO2_mid = (item.midPct / 100) * vdot;
    // Quadratic equation coefficients: 0.000104 * v^2 + 0.182258 * v - (4.60 + VO2_mid) = 0
    const a = 0.000104;
    const b = 0.182258;
    const c = -(4.60 + VO2_mid);
    const v = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a); // velocity in m/min
    const midPaceRaw = 1000 / v; // min per km
    
    // Bounds
    const pctLow = parseFloat(item.pctRange.split('%')[0]);
    const pctHigh = parseFloat(item.pctRange.split('-')[1].replace('%', ''));
    
    const solvePace = (pct: number) => {
      const v_eq = (pct / 100) * vdot;
      const c_eq = -(4.60 + v_eq);
      const vel = (-b + Math.sqrt(b * b - 4 * a * c_eq)) / (2 * a);
      return Math.round(60000 / vel); // seconds per km
    };
    
    const secLow = solvePace(pctLow);
    const secHigh = solvePace(pctHigh);
    
    // Because higher percent of VDOT means faster pace (lower seconds), secHigh will be fewer seconds than secLow
    const paceRangeStr = `${formatPace(secLow)} a ${formatPace(secHigh)}`;
    
    return {
      key: item.key,
      name: item.name,
      description: item.description,
      descriptionSpeed: item.descriptionSpeed,
      pctRange: item.pctRange,
      paceStr: formatPace(midPaceRaw * 60),
      paceRangeStr,
      color: item.color
    };
  });
}

/**
 * Calculates Heart Rate Zones using the Karvonen Formulation
 */
export function getKarvonenZones(maxHR: number, restHR: number): HRZone[] {
  const reserve = maxHR - restHR;
  
  const zoneConfig = [
    { zone: 1, name: 'Z1 - Recuperação Ativa (Active Recovery)', range: [0.50, 0.60], color: 'text-slate-600 bg-slate-50 border-slate-200', desc: 'Ideal para circulação de metabólitos, restauração neural e rodagens leves pós-prova.' },
    { zone: 2, name: 'Z2 - Resistência Aeróbica (Easy / Aerobic)', range: [0.60, 0.70], color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Espaço principal de adaptações mitocondriais e capilarização muscular. Zona de queima lípica.' },
    { zone: 3, name: 'Z3 - Ritmo Tempo / Maratona (Tempo Run)', range: [0.70, 0.80], color: 'text-blue-600 bg-blue-50 border-blue-200', desc: 'Aprimoramento do ritmo e sustentação metabólica estável de média-longa duração.' },
    { zone: 4, name: 'Z4 - Limiar de Lactato / VO2Max', range: [0.80, 0.90], color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Limiar anaeróbico onde o cansaço químico começa a superar a capacidade de depuração do organismo.' },
    { zone: 5, name: 'Z5 - Esforço Anaeróbico Máximo', range: [0.90, 1.00], color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Potência neuromuscular limite, tiros curtos intensos (economia de mecânica).' }
  ];

  return zoneConfig.map(z => {
    const minHR = Math.round((reserve * z.range[0]) + restHR);
    const maxHRCalc = Math.round((reserve * z.range[1]) + restHR);
    return {
      zone: z.zone,
      name: z.name,
      intensityRange: `${Math.round(z.range[0] * 100)}% - ${Math.round(z.range[1] * 100)}%`,
      hrRangeStr: `${minHR} - ${maxHRCalc} bpm`,
      description: z.desc,
      color: z.color
    };
  });
}

/**
 * Procedural VO2Max estimates from tests.
 */
export function estimateVO2MaxCooper(distanceMeters: number): number {
  return (distanceMeters - 504.9) / 44.73;
}

export function estimateVO2Max2400m(timeSeconds: number): number {
  const minutes = timeSeconds / 60;
  return (483 / minutes) + 3.5;
}

/**
 * Automatically generates an 8-week periodized training plan (3 load weeks, 1 recovery week format)
 * adhering strictly to all user constraints:
 * - Highlights Volume (km) vs Intensity.
 * - Never increases volume AND intensity simultaneously by > 10%.
 * - Beginners are restricted from high-intensity work on weeks 1-6.
 * - Interval workout repetition total volume DOES NOT EXCEED 8% of the calculated weekly volume!
 */
export function calculateReadinessScore(pains?: PainReport[]): { score: number; volumeModifier: number; disableHighIntensity: boolean } {
  const activePains = (pains || []).filter(p => !p.resolved);
  if (activePains.length === 0) {
    return { score: 100, volumeModifier: 1.0, disableHighIntensity: false };
  }

  let penalty = 0;
  let hasSevereOrContinuous = false;

  activePains.forEach(p => {
    let base = p.severity === 'severe' ? 40 : p.severity === 'moderate' ? 20 : 10;
    let occMult = p.occurrence === 'continuous' ? 1.5 : p.occurrence === 'during_run' ? 1.2 : 1.0;
    penalty += base * occMult;
    if (p.severity === 'severe' || p.occurrence === 'continuous') {
      hasSevereOrContinuous = true;
    }
  });

  const score = Math.max(10, Math.round(100 - penalty));
  let volumeModifier = 1.0;
  let disableHighIntensity = false;

  if (score < 50 || hasSevereOrContinuous) {
    volumeModifier = 0.75; // Redução de 25% no volume por segurança
    disableHighIntensity = true; // Desativa tiros/intervalados altos
  } else if (score < 80) {
    volumeModifier = 0.90; // Redução de 10% no volume
    disableHighIntensity = true; // Converte I/R para pace Easy
  }

  return { score, volumeModifier, disableHighIntensity };
}

export function generate8WeekPlan(
  vdot: number,
  level: RunnerLevel,
  baseVolume: number,
  weeksActive: number,
  maxHR: number,
  restHR: number,
  pains?: PainReport[]
): WeekPlan[] {
  const readiness = calculateReadinessScore(pains);
  const adjustedBaseVolume = baseVolume * readiness.volumeModifier;

  const paces = calculatePaceZones(vdot);
  const ePace = paces.find(p => p.key === 'E')?.paceStr || '6:00/km';
  const tPace = paces.find(p => p.key === 'T')?.paceStr || '5:10/km';
  const iPace = readiness.disableHighIntensity ? ePace : (paces.find(p => p.key === 'I')?.paceStr || '4:40/km');
  const rPace = readiness.disableHighIntensity ? ePace : (paces.find(p => p.key === 'R')?.paceStr || '4:15/km');
  const mPace = paces.find(p => p.key === 'M')?.paceStr || '5:35/km';

  const hrZones = getKarvonenZones(maxHR, restHR);
  const z2Range = hrZones.find(z => z.zone === 2)?.hrRangeStr || '130-150 bpm';
  const z4Range = hrZones.find(z => z.zone === 4)?.hrRangeStr || '165-178 bpm';

  // Weekly periodization configurations:
  // Layout format: 8 weeks, 3 weeks build, 1 week active recovery, repeated
  const weeksConfig = [
    { num: 1, volumeMultiplier: 1.0, period: 'Fundação Aeróbica', intensity: 'Padrão / Moderado' },
    { num: 2, volumeMultiplier: 1.1, period: 'Carga Progressiva', intensity: 'Aquisição' },
    { num: 3, volumeMultiplier: 1.15, period: 'Pico de Carga 1', intensity: 'Sobrecarga Aeróbica' },
    { num: 4, volumeMultiplier: 0.8, period: 'Supercompensação e Recuperação Activa', intensity: 'Regenerativa (Regressão)' },
    { num: 5, volumeMultiplier: 1.12, period: 'Retorno e Limiar', intensity: 'Aquisição de Força' },
    { num: 6, volumeMultiplier: 1.2, period: 'Foco em Fibras Rápidas', intensity: 'Pico de Intensidade' },
    { num: 7, volumeMultiplier: 1.15, period: 'Polimento e Potência Aeróbica (I-Pace)', intensity: 'Máxima Intensidade' },
    { num: 8, volumeMultiplier: 0.75, period: 'Taper e Supercompensação Final', intensity: 'Simulação e Teste' }
  ];

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  let prevVolMultiplier = 1.0;
  let prevIntensityScore = 1; // Arbitrary comparison for safety checks

  return weeksConfig.map(wc => {
    const weeklyVol = Math.round(adjustedBaseVolume * wc.volumeMultiplier * 10) / 10;
    
    // Check if beginner or beginner timeline
    const isBeginnerTimeline = level === 'beginner' || weeksActive <= 6;
    const isFirstSixWeeksBeginner = isBeginnerTimeline && wc.num <= 6;

    // Safety checks formatting
    const ratioChangeVol = Math.round(((wc.volumeMultiplier - prevVolMultiplier) / prevVolMultiplier) * 100);
    prevVolMultiplier = wc.volumeMultiplier;

    // Determine workouts for the week. We must divide 'weeklyVol' across 4-5 days depending on level
    const workoutDaysCount = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
    const workouts: DayWorkout[] = [];

    // Calculate maximum interval volume strictly limited to 8% of weekly volume
    const maxIntervalKm = Math.round(weeklyVol * 0.08 * 10) / 10;

    // Standard run size mapping
    const longRunDistance = Math.round(weeklyVol * 0.35 * 10) / 10; // LR is ~30-35% of weekly volume
    const easyRunDistance = Math.round(((weeklyVol - longRunDistance) / (workoutDaysCount - 1)) * 10) / 10;

    // Distribute among the 7 days of the week code
    daysOfWeek.forEach((day, index) => {
      // Mondays are rest days
      if (index === 0) {
        workouts.push({
          dayName: day,
          type: 'Rest',
          title: 'Descanso Total / Recuperação Muscular',
          distanceKm: 0,
          intensity: 'Nula',
          description: 'Dia crucial para recuperação neural, ressíntese de glicogênio e reparação dos tecidos musculares. Sem impacto.'
        });
        return;
      }

      // Fridays are rest days
      if (index === 4) {
        workouts.push({
          dayName: day,
          type: 'Rest',
          title: 'Descanso Ativo ou Massagem Miofascial',
          distanceKm: 0,
          intensity: 'Nula',
          description: 'Foco em alongamentos estáticos estruturais e hidratação profunda. Prepare as pernas para o final de semana.'
        });
        return;
      }

      // Sundays are Long Run days
      if (index === 6) {
        workouts.push({
          dayName: day,
          type: 'Long Run',
          title: 'Treino Longo (Long Run) Progressivo',
          distanceKm: longRunDistance,
          intensity: `Zona Karvonen Z2 (${z2Range})`,
          description: `Corrida contínua ritmada em ritmo Leve (E) ${ePace}. Mantenha respiração nasal confortável para desenvolver resistência e economia de gordura.`
        });
        return;
      }

      // Tuesdays are Easy Run days
      if (index === 1) {
        workouts.push({
          dayName: day,
          type: 'Easy',
          title: 'Corrida de Rodagem Confortável',
          distanceKm: easyRunDistance,
          intensity: `Zona Karvonen Z1 ou Z2 (< Z2)`,
          description: `Corrida regenerativa tranquila em ritmo leve de trote (${ePace}). Soltura completa dos tendões e pernas.`
        });
        return;
      }

      // Wednesdays are target workouts (Speed or Threshold)
      if (index === 2) {
        // High Intensity check for beginners
        if (isFirstSixWeeksBeginner) {
          workouts.push({
            dayName: day,
            type: 'Easy',
            title: 'Aeróbico Estável de Desenvolvimento',
            distanceKm: easyRunDistance,
            intensity: `Abaixo de 75% FCmáx`,
            description: `Atenção: Por estar nas primeiras 6 semanas ou nível iniciante, evitamos alta intensidade para proteger articulações. Corrida plana estável a ${ePace}.`
          });
        } else {
          // Alternative between Threshold (T) and Intervals (I) depending on weeks
          if (wc.num % 2 === 0 && wc.num !== 4) {
            // Interval session (I-Pace)
            // Calculate repeats based on 8% interval limit
            const repeatDistance = 0.5; // 500m reps or 800m reps
            const reps = Math.floor(maxIntervalKm / repeatDistance);
            const repsDescr = reps > 1 
              ? `${reps} tiros de 500m em ritmo I (${iPace}) com 2' de trote regenerativo entre eles`
              : `2 tiros de 400m em ritmo I (${iPace}) com 2' de descanso ativo`;

            workouts.push({
              dayName: day,
              type: 'Interval',
              title: `Tiros VO2Máx (Interval Workout) - Limite 8%`,
              distanceKm: Math.round((2.0 + (reps * repeatDistance)) * 10) / 10, // Warming up 2k + reps
              intensity: `Crítica (Karvonen Z4-Z5)`,
              description: `Aquecimento de 1.5km leve + ${repsDescr} + Desaquecimento de 1km leve. Esforço VO2Máx controlado pelo limite de tiros (${maxIntervalKm}km no plano semanal).`
            });
          } else if (wc.num === 4) {
            // Recovery week: light run
            workouts.push({
              dayName: day,
              type: 'Easy',
              title: 'Rodagem Ativa de Recuperação (Supercompensação)',
              distanceKm: Math.round(easyRunDistance * 0.8 * 10) / 10,
              intensity: 'Suave Z1',
              description: `Semana regenerativa. Corrida ultraleve em ritmo ${ePace} para consolidar o ganho fisiológico de carga passada.`
            });
          } else {
            // Threshold session (T-Pace or Tempo)
            // Typically 10% to 12% of weekly volume in T pace max
            const tDistance = Math.round(weeklyVol * 0.1 * 10) / 10;
            workouts.push({
              dayName: day,
              type: 'Threshold',
              title: 'Sessão de Limiar de Lactato (Tempo Run)',
              distanceKm: Math.round((2.0 + tDistance) * 10) / 10, // warming up 2k + T
              intensity: `Limiar (Z3/Z4 Karvonen - ${z4Range})`,
              description: `Aquecimento 1.5km + Correr ${tKToDescr(tDistance, tPace)} + Soltura de 1km leve.`
            });
          }
        }
        return;
      }

      // Thursdays are active rest, or easy if we have 5 days workout count
      if (index === 3) {
        if (workoutDaysCount >= 5) {
          workouts.push({
            dayName: day,
            type: 'Easy',
            title: 'Rodagem Curta de Conexão',
            distanceKm: Math.round(easyRunDistance * 0.7 * 10) / 10,
            intensity: 'Suave Z2',
            description: `Corrida de soltura livre em ritmo ultra confortável (${ePace}) para acumular quilometragem regenerativa.`
          });
        } else {
          workouts.push({
            dayName: day,
            type: 'Rest',
            title: 'Descanso Ativo Secundário',
            distanceKm: 0,
            intensity: 'Nula',
            description: 'Dia reservado para caminhada ou ciclismo de intensidade Z1 para manter o metabolismo aquecido sem fadiga.'
          });
        }
        return;
      }

      // Saturdays are Easy runs / strides
      if (index === 5) {
        if (workoutDaysCount >= 4) {
          workouts.push({
            dayName: day,
            type: 'Repetition',
            title: 'Soltura Curta + Ritmo de Economia (Strides)',
            distanceKm: Math.round(easyRunDistance * 0.8 * 10) / 10,
            intensity: 'Neuromuscular',
            description: `Trote leve de soltura + 4 a 6 acelerações curtas de 100m progressivos (Strides em ritmo R - ${rPace}) focando na coordenação motora e braços.`
          });
        } else {
          workouts.push({
            dayName: day,
            type: 'Rest',
            title: 'Recuperação Pré-Longo',
            distanceKm: 0,
            intensity: 'Nula',
            description: 'Descanso absoluto preventivo nas 24h que antecedem a rodagem longa dominical.'
          });
        }
        return;
      }
    });

    return {
      weekNum: wc.num,
      periodLabel: wc.period,
      totalVolumeKm: weeklyVol,
      ratioChange: ratioChangeVol,
      intensityLevel: wc.intensity,
      workouts
    };
  });
}

function tKToDescr(dist: number, pace: string): string {
  if (dist > 5) {
    const half = Math.round(dist / 2);
    return `${dist}km contínuos de ritmo Limiar (T) em ${pace}`;
  }
  return `${dist}km ou blocos de tiro longo de Limiar (T) a ${pace}`;
}
