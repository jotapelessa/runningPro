import { DistanceType, PaceZoneItem, RaceDistanceInfo, RacePrediction, HeartRateZone, EnvironmentalAdjustment } from '../types';

export const STANDARD_DISTANCES: RaceDistanceInfo[] = [
  { id: '400m', name: '400 Metros', shortName: '400m', meters: 400, category: 'track' },
  { id: '800m', name: '800 Metros', shortName: '800m', meters: 800, category: 'track' },
  { id: '1500m', name: '1.500 Metros', shortName: '1500m', meters: 1500, category: 'track' },
  { id: '1mile', name: '1 Milha', shortName: '1 Milha', meters: 1609.34, category: 'track' },
  { id: '3000m', name: '3.000 Metros', shortName: '3k', meters: 3000, category: 'track' },
  { id: '2miles', name: '2 Milhas', shortName: '2 Milhas', meters: 3218.68, category: 'track' },
  { id: '5k', name: '5 Quilômetros', shortName: '5k', meters: 5000, category: 'short_road' },
  { id: '10k', name: '10 Quilômetros', shortName: '10k', meters: 10000, category: 'short_road' },
  { id: '15k', name: '15 Quilômetros', shortName: '15k', meters: 15000, category: 'short_road' },
  { id: '10miles', name: '10 Milhas', shortName: '10 Milhas', meters: 16093.4, category: 'long_road' },
  { id: 'half_marathon', name: 'Meia Maratona (21.1k)', shortName: '21.1k', meters: 21097.5, category: 'long_road' },
  { id: '30k', name: '30 Quilômetros', shortName: '30k', meters: 30000, category: 'long_road' },
  { id: 'marathon', name: 'Maratona (42.195k)', shortName: '42.2k', meters: 42195, category: 'long_road' },
  { id: '50k', name: '50 Quilômetros (Ultra)', shortName: '50k', meters: 50000, category: 'ultra' }
];

/**
 * Calculates Oxygen cost VO2 (ml/kg/min) for a running velocity v (meters/minute)
 */
export function calculateVO2(velocityMetersPerMin: number): number {
  const v = velocityMetersPerMin;
  return -4.60 + (0.182258 * v) + (0.000104 * v * v);
}

/**
 * Calculates fraction of VO2max sustainable for a race duration t (in minutes)
 */
export function calculatePctVO2Max(timeMinutes: number): number {
  const t = timeMinutes;
  return 0.80 + (0.1894393 * Math.exp(-0.012778 * t)) + (0.2989558 * Math.exp(-0.1932605 * t));
}

/**
 * Computes exact Jack Daniels VDOT from race distance (meters) and time (seconds)
 */
export function calculateVDOT(distanceMeters: number, timeSeconds: number): number {
  if (distanceMeters <= 0 || timeSeconds <= 0) return 30;
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes; // m/min
  const vo2 = calculateVO2(velocity);
  const pctVO2 = calculatePctVO2Max(timeMinutes);
  const vdot = vo2 / pctVO2;
  return Math.max(15, Math.min(85, Math.round(vdot * 100) / 100));
}

/**
 * Solves velocity (m/min) given a target VO2 cost
 */
export function velocityFromVO2(targetVO2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.60 + targetVO2);
  const discriminant = b * b - (4 * a * c);
  if (discriminant < 0) return 100;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

/**
 * Predicts race time in seconds for a target distance given VDOT
 */
export function predictRaceTime(distanceMeters: number, vdot: number): number {
  if (distanceMeters <= 0 || vdot <= 10) return 0;
  
  let low = 0.3; // 18 seconds
  let high = 1500; // 25 hours
  let bestTime = (distanceMeters / 250); // initial guess

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const velocity = distanceMeters / mid;
    const vo2 = calculateVO2(velocity);
    const pct = calculatePctVO2Max(mid);
    const calculatedVdot = vo2 / pct;

    if (calculatedVdot < vdot) {
      // mid time was too slow -> need faster time (smaller mid)
      high = mid;
    } else {
      low = mid;
    }
    bestTime = mid;
  }

  return Math.round(bestTime * 60);
}

/**
 * Formats seconds into hh:mm:ss or mm:ss
 */
export function formatTime(seconds: number, forceHours: boolean = false): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0 || forceHours) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats pace in seconds/km into "m:ss/km"
 */
export function formatPace(secondsPerKm: number): string {
  if (isNaN(secondsPerKm) || secondsPerKm <= 0) return '-:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  if (s === 60) {
    return `${m + 1}:00`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Converts pace seconds/km to split for a given distance in meters
 */
export function getSplitForMeters(paceSecondsPerKm: number, meters: number): string {
  const timeSec = (paceSecondsPerKm * meters) / 1000;
  return formatTime(timeSec);
}

/**
 * Generates all 5 Jack Daniels Training Paces (E, M, T, I, R)
 */
export function calculateTrainingPaces(vdot: number, maxHr: number = 185, restingHr: number = 55): PaceZoneItem[] {
  // Percentage ranges of VO2max for Jack Daniels zones
  // E: 62% to 72% (Center ~67%)
  // M: 80% to 84% (Center ~82%)
  // T: 86% to 90% (Center ~88%)
  // I: 95% to 100% (Center ~97.5%)
  // R: 105% to 110% (Center ~107.5%)

  const calculatePaceFromPct = (pct: number) => {
    const targetVO2 = vdot * pct;
    const v = velocityFromVO2(targetVO2); // m/min
    return (60000 / v); // sec/km
  };

  const getBpmRange = (minPct: number, maxPct: number, useKarvonen: boolean = true): [number, number] => {
    if (useKarvonen && restingHr > 0 && maxHr > restingHr) {
      const hrr = maxHr - restingHr;
      const minBpm = Math.round(restingHr + (minPct * hrr));
      const maxBpm = Math.round(restingHr + (maxPct * hrr));
      return [minBpm, maxBpm];
    }
    return [Math.round(maxHr * minPct), Math.round(maxHr * maxPct)];
  };

  // E Zone (Easy / Rodagem / Regenerativo)
  const paceESlow = calculatePaceFromPct(0.60);
  const paceEFast = calculatePaceFromPct(0.72);
  const paceECenter = (paceESlow + paceEFast) / 2;

  // M Zone (Marathon / Ritmo de Maratona)
  const paceMSlow = calculatePaceFromPct(0.79);
  const paceMFast = calculatePaceFromPct(0.85);
  const paceMCenter = (paceMSlow + paceMFast) / 2;

  // T Zone (Threshold / Limiar de Lactato)
  const paceTSlow = calculatePaceFromPct(0.86);
  const paceTFast = calculatePaceFromPct(0.90);
  const paceTCenter = (paceTSlow + paceTFast) / 2;

  // I Zone (Interval / VO2max)
  const paceISlow = calculatePaceFromPct(0.95);
  const paceIFast = calculatePaceFromPct(1.00);
  const paceICenter = (paceISlow + paceIFast) / 2;

  // R Zone (Repetition / Velocidade e Economia)
  const paceRSlow = calculatePaceFromPct(1.05);
  const paceRFast = calculatePaceFromPct(1.12);
  const paceRCenter = (paceRSlow + paceRFast) / 2;

  const zones: PaceZoneItem[] = [
    {
      key: 'E',
      name: 'Easy / Recuperação',
      subname: 'Ritmo Confortável & Rodagem',
      color: 'emerald',
      accentColor: '#10B981',
      description: 'Volume aeróbico base, regeneração celular, capilarização muscular e queima de gordura.',
      hrPercentRange: '65% - 79% FCmax',
      hrBpmRange: getBpmRange(0.65, 0.79),
      paceSecondsPerKm: paceECenter,
      paceMinSecondsPerKm: paceEFast,
      paceMaxSecondsPerKm: paceESlow,
      formattedPaceKm: `${formatPace(paceEFast)} - ${formatPace(paceESlow)}/km`,
      formattedPaceMile: `${formatPace(paceEFast * 1.60934)} - ${formatPace(paceESlow * 1.60934)}/mi`,
      splits: {
        m400: `${getSplitForMeters(paceEFast, 400)} - ${getSplitForMeters(paceESlow, 400)}`,
        m1000: `${formatPace(paceEFast)} - ${formatPace(paceESlow)}`,
        m1600: `${getSplitForMeters(paceEFast, 1600)} - ${getSplitForMeters(paceESlow, 1600)}`
      },
      purpose: 'Construção da base mitocondrial e aumento do débito cardíaco sem estresse mecânico excessivo.'
    },
    {
      key: 'M',
      name: 'Marathon / Ritmo Maratona',
      subname: 'Sustentação Aeróbica Estável',
      color: 'cyan',
      accentColor: '#00F0FF',
      description: 'Ritmo específico de prova para 42k. Adaptação neuromuscular e eficiência no consumo de glicogênio.',
      hrPercentRange: '80% - 87% FCmax',
      hrBpmRange: getBpmRange(0.80, 0.87),
      paceSecondsPerKm: paceMCenter,
      paceMinSecondsPerKm: paceMFast,
      paceMaxSecondsPerKm: paceMSlow,
      formattedPaceKm: `${formatPace(paceMFast)} - ${formatPace(paceMSlow)}/km`,
      formattedPaceMile: `${formatPace(paceMFast * 1.60934)} - ${formatPace(paceMSlow * 1.60934)}/mi`,
      splits: {
        m400: `${getSplitForMeters(paceMFast, 400)} - ${getSplitForMeters(paceMSlow, 400)}`,
        m1000: `${formatPace(paceMFast)} - ${formatPace(paceMSlow)}`,
        m1600: `${getSplitForMeters(paceMFast, 1600)} - ${getSplitForMeters(paceMSlow, 1600)}`
      },
      purpose: 'Treinos longos com blocos em ritmo alvo de maratona e controle de fadiga progressiva.'
    },
    {
      key: 'T',
      name: 'Threshold / Limiar de Lactato',
      subname: 'Tempo Run & Ritmo de Meia',
      color: 'amber',
      accentColor: '#F59E0B',
      description: 'Ritmo "confortavelmente duro". Eleva o limiar anaeróbio e atrasa o acúmulo de íons H+ no sangue.',
      hrPercentRange: '88% - 92% FCmax',
      hrBpmRange: getBpmRange(0.88, 0.92),
      paceSecondsPerKm: paceTCenter,
      paceMinSecondsPerKm: paceTFast,
      paceMaxSecondsPerKm: paceTSlow,
      formattedPaceKm: `${formatPace(paceTFast)} - ${formatPace(paceTSlow)}/km`,
      formattedPaceMile: `${formatPace(paceTFast * 1.60934)} - ${formatPace(paceTSlow * 1.60934)}/mi`,
      splits: {
        m400: `${getSplitForMeters(paceTFast, 400)} - ${getSplitForMeters(paceTSlow, 400)}`,
        m800: `${getSplitForMeters(paceTFast, 800)} - ${getSplitForMeters(paceTSlow, 800)}`,
        m1000: `${formatPace(paceTFast)} - ${formatPace(paceTSlow)}`,
        m1200: `${getSplitForMeters(paceTFast, 1200)} - ${getSplitForMeters(paceTSlow, 1200)}`
      },
      purpose: 'Aumentar a velocidade em que o lactato é depurado pelo fígado e músculos. Treinos de 20-40 min ou Cruise Intervals.'
    },
    {
      key: 'I',
      name: 'Interval / VO2 Máximo',
      subname: 'Potência Aeróbica Máxima',
      color: 'rose',
      accentColor: '#F43F5E',
      description: 'Esforço intenso no teto aeróbico (95-100% VO2max). Estimula o aumento do consumo máximo de O2.',
      hrPercentRange: '93% - 98% FCmax',
      hrBpmRange: getBpmRange(0.93, 0.98),
      paceSecondsPerKm: paceICenter,
      paceMinSecondsPerKm: paceIFast,
      paceMaxSecondsPerKm: paceISlow,
      formattedPaceKm: `${formatPace(paceIFast)} - ${formatPace(paceISlow)}/km`,
      formattedPaceMile: `${formatPace(paceIFast * 1.60934)} - ${formatPace(paceISlow * 1.60934)}/mi`,
      splits: {
        m400: getSplitForMeters(paceICenter, 400),
        m800: getSplitForMeters(paceICenter, 800),
        m1000: getSplitForMeters(paceICenter, 1000),
        m1200: getSplitForMeters(paceICenter, 1200)
      },
      purpose: 'Tiros de 3 a 5 minutos (ex: 800m a 1200m) com intervalo de descanso ativo igual ou ligeiramente menor que o tempo de tiro.'
    },
    {
      key: 'R',
      name: 'Repetition / Velocidade e Economia',
      subname: 'Biomecânica & Recrutamento Neuromuscular',
      color: 'purple',
      accentColor: '#A855F7',
      description: 'Esforço supra-aeróbico anaeróbico. Foco na cadência rápida, mecânica de passada relaxada e economia de corrida.',
      hrPercentRange: '> 98% FCmax (Anaeróbio)',
      hrBpmRange: [Math.round(maxHr * 0.96), maxHr],
      paceSecondsPerKm: paceRCenter,
      paceMinSecondsPerKm: paceRFast,
      paceMaxSecondsPerKm: paceRSlow,
      formattedPaceKm: `${formatPace(paceRFast)} - ${formatPace(paceRSlow)}/km`,
      formattedPaceMile: `${formatPace(paceRFast * 1.60934)} - ${formatPace(paceRSlow * 1.60934)}/mi`,
      splits: {
        m200: getSplitForMeters(paceRCenter, 200),
        m300: getSplitForMeters(paceRCenter, 300),
        m400: getSplitForMeters(paceRCenter, 400),
        m600: getSplitForMeters(paceRCenter, 600)
      },
      purpose: 'Tiros curtos (200m a 400m) com recuperação total (2x a 3x o tempo de tiro). Não visa acúmulo de fadiga, mas sim fluidez mecânica.'
    }
  ];

  return zones;
}

/**
 * Calculates Heart Rate 5 Zones (Z1 - Z5)
 */
export function calculateHeartRateZones(maxHr: number = 185, restingHr: number = 55): HeartRateZone[] {
  const hrr = Math.max(0, maxHr - restingHr);
  
  const getKarvonen = (minPct: number, maxPct: number) => {
    return {
      min: Math.round(restingHr + (minPct * hrr)),
      max: Math.round(restingHr + (maxPct * hrr))
    };
  };

  const z1 = getKarvonen(0.50, 0.60);
  const z2 = getKarvonen(0.60, 0.70);
  const z3 = getKarvonen(0.70, 0.80);
  const z4 = getKarvonen(0.80, 0.90);
  const z5 = getKarvonen(0.90, 1.00);

  return [
    {
      zone: 1,
      name: 'Z1 — Regenerativo & Aquecimento',
      pctRange: '50% - 60% HRR',
      bpmMin: z1.min,
      bpmMax: z1.max,
      color: '#64748B',
      description: 'Aquecimento, desaquecimento e regeneração após provas ou treinos fortes.',
      targetVdotZone: 'Abaixo de E'
    },
    {
      zone: 2,
      name: 'Z2 — Aeróbico Fundamental (Base)',
      pctRange: '60% - 70% HRR',
      bpmMin: z2.min,
      bpmMax: z2.max,
      color: '#10B981',
      description: 'A zona chave da resistência. Desenvolvimento mitocondrial, oxidação lipídica e segurança estrutural.',
      targetVdotZone: 'Pace E (Easy)'
    },
    {
      zone: 3,
      name: 'Z3 — Ritmo Moderado & Tempo',
      pctRange: '70% - 80% HRR',
      bpmMin: z3.min,
      bpmMax: z3.max,
      color: '#00F0FF',
      description: 'Zona de transição aeróbica, treinos no ritmo de maratona e rodagens firmes.',
      targetVdotZone: 'Pace M (Maratona)'
    },
    {
      zone: 4,
      name: 'Z4 — Limiar de Lactato (Anaeróbio)',
      pctRange: '80% - 90% HRR',
      bpmMin: z4.min,
      bpmMax: z4.max,
      color: '#F59E0B',
      description: 'Ponto de equilíbrio entre produção e remoção de ácido lático. Treinos contínuos de 20-40m.',
      targetVdotZone: 'Pace T (Threshold)'
    },
    {
      zone: 5,
      name: 'Z5 — Potência Máxima & VO2max',
      pctRange: '90% - 100% HRR',
      bpmMin: z5.min,
      bpmMax: maxHr,
      color: '#EF4444',
      description: 'Esforço máximo de tiro intervalado e sprints finais de prova.',
      targetVdotZone: 'Paces I & R'
    }
  ];
}

/**
 * Generates race predictions for all standard distances
 */
export function generateRacePredictions(
  vdot: number,
  userPrs: Partial<Record<DistanceType, number>> = {}
): RacePrediction[] {
  return STANDARD_DISTANCES.map((d) => {
    const predictedSec = predictRaceTime(d.meters, vdot);
    const paceSecPerKm = (predictedSec / d.meters) * 1000;
    const speedKmh = (d.meters / 1000) / (predictedSec / 3600);
    const prSec = userPrs[d.id];
    const delta = prSec ? (predictedSec - prSec) : undefined;

    return {
      distanceId: d.id,
      name: d.name,
      meters: d.meters,
      predictedTimeSeconds: predictedSec,
      formattedTime: formatTime(predictedSec, d.meters >= 15000),
      paceSecondsPerKm: paceSecPerKm,
      formattedPaceKm: formatPace(paceSecPerKm),
      speedKmh: Math.round(speedKmh * 10) / 10,
      userPrSeconds: prSec,
      deltaSeconds: delta
    };
  });
}

/**
 * Calculates environmental adjustment (Heat, Humidity, Altitude)
 * Based on empirical endurance physiology adjustments:
 * - Ideal temp: 10-15°C. Above 15°C, pace drops ~0.3% - 0.7% per °C depending on humidity.
 * - Altitude: Above 1000m, VO2max drops ~1.5% per 500m.
 */
export function calculateEnvironmentalAdjustment(
  vdot: number,
  tempC: number = 20,
  humidityPct: number = 60,
  altitudeM: number = 500
): EnvironmentalAdjustment {
  let tempPenaltyPct = 0;
  if (tempC > 15) {
    const excess = tempC - 15;
    const humidityFactor = 1 + (Math.max(0, humidityPct - 50) / 100);
    tempPenaltyPct = excess * 0.45 * humidityFactor;
  }

  let altPenaltyPct = 0;
  if (altitudeM > 800) {
    altPenaltyPct = ((altitudeM - 800) / 500) * 1.4;
  }

  const totalPaceSlowdownPct = tempPenaltyPct + altPenaltyPct;
  // Effective VDOT is lower under harsh conditions
  const adjustedVdot = Math.max(15, vdot * (1 - (totalPaceSlowdownPct / 100)));

  return {
    temperatureC: tempC,
    humidityPct: humidityPct,
    altitudeMeters: altitudeM,
    paceAdjustmentPct: Math.round(totalPaceSlowdownPct * 10) / 10,
    adjustedVdot: Math.round(adjustedVdot * 10) / 10
  };
}
