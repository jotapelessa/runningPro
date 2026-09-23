import { RunnerState, ParsedWorkout, MultiWorkoutTelemetrySummary, DistanceType } from '../types';
import { calculateVDOT, calculateTrainingPaces, calculateHeartRateZones, formatPace } from './vdotCalculator';

export interface AthletePrescriptionResult {
  // Diagnóstico
  bmi: number;
  bmiClassification: string;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  adjustedVo2max: number;
  vdot: number;
  fitnessLevelName: string;
  fitnessPercentileAgeGender: number; // 0-100
  injuryRiskLevel: 'Baixo' | 'Moderado' | 'Elevado';
  injuryRiskFactors: string[];

  // Prescrição de Treino
  recommendedWeeklyFrequency: number;
  safeWeeklyVolumeKm: number;
  safeLongRunKm: number;
  trainingPhase: string;
  trainingPhaseDescription: string;
  polarizedRatio: string; // ex: "85% Fácil / 15% Moderado-Intenso"
  structureType: 'walk_run_progression' | 'aerobic_base_building' | 'polarized_daniels' | 'high_performance';
  
  // Orientações Clínicas e Fisiológicas
  actionableGuidance: string[];
  keyWorkoutsSuggested: Array<{
    title: string;
    zone: string;
    description: string;
    targetPace: string;
  }>;
}

export function computeAthletePrescription(
  athlete: Partial<RunnerState>,
  telemetryInput?: ParsedWorkout | MultiWorkoutTelemetrySummary | null
): AthletePrescriptionResult {
  const isMultiSummary = telemetryInput && 'totalWorkouts' in telemetryInput;
  const multiSummary = isMultiSummary ? (telemetryInput as MultiWorkoutTelemetrySummary) : null;
  const singleWorkout = !isMultiSummary && telemetryInput ? (telemetryInput as ParsedWorkout) : null;

  const age = athlete.age || 32;
  const gender = athlete.gender === 'F' || athlete.gender === 'female' ? 'female' : 'male';
  const weightKg = athlete.weightKg || athlete.weight || 70;
  const heightCm = athlete.heightCm || athlete.height || 175;
  const heightM = heightCm / 100;
  const isSedentary = athlete.level === 'beginner' && (athlete.weeksActive || 0) <= 4;
  const weeksActive = athlete.weeksActive || (isSedentary ? 0 : 8);
  const trainingDays = athlete.trainingDays || (isSedentary ? 3 : 4);
  const restingHr = athlete.restHR || athlete.restingHr || (isSedentary ? 72 : 58);
  
  // BMI calculation
  const bmi = heightM > 0 ? Math.round((weightKg / (heightM * heightM)) * 10) / 10 : 22.5;
  let bmiClassification = 'Peso Saudável (Eutrofia)';
  let bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal';
  if (bmi < 18.5) {
    bmiClassification = 'Abaixo do Peso';
    bmiCategory = 'underweight';
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    bmiClassification = 'Peso Normal / Ideal';
    bmiCategory = 'normal';
  } else if (bmi >= 25 && bmi <= 29.9) {
    bmiClassification = 'Sobrepeso (Atenção ao impacto articular)';
    bmiCategory = 'overweight';
  } else {
    bmiClassification = 'Obesidade (Priorizar baixo impacto e caminhada-corrida)';
    bmiCategory = 'obese';
  }

  // Determine baseline VDOT
  let baseVdot = 35.0;

  if (multiSummary && multiSummary.compositeVdot > 0) {
    baseVdot = multiSummary.compositeVdot;
  } else if (singleWorkout && singleWorkout.vdot > 0) {
    baseVdot = singleWorkout.vdot;
  } else if (athlete.currentVdot && athlete.currentVdot > 0) {
    baseVdot = athlete.currentVdot;
  } else {
    // Estimativa fisiológica inicial baseada em idade, sedentarismo e FC de repouso
    if (isSedentary) {
      baseVdot = gender === 'female' ? 26.5 : 29.5;
      if (age > 40) baseVdot -= (age - 40) * 0.15;
      if (bmi > 25) baseVdot -= (bmi - 25) * 0.4;
    } else {
      baseVdot = gender === 'female' ? 36.0 : 41.0;
      if (weeksActive >= 12) baseVdot += 3;
      if (weeksActive >= 24) baseVdot += 2;
      if (age > 35) baseVdot -= (age - 35) * 0.2;
    }
  }

  baseVdot = Math.max(18, Math.min(80, Math.round(baseVdot * 10) / 10));

  // Max HR estimation Tanaka (208 - 0.7 * age) or Gellish (207 - 0.7 * age)
  const maxHr = multiSummary?.maxHrOverall || singleWorkout?.maxHR || athlete.macHR || athlete.maxHr || Math.round(208 - (0.7 * age));

  // Training Paces
  const zoneList = calculateTrainingPaces(baseVdot, maxHr, restingHr);
  const paceE = zoneList.find(z => z.key === 'E') || zoneList[0];
  const paceT = zoneList.find(z => z.key === 'T') || zoneList[2];
  const paceI = zoneList.find(z => z.key === 'I') || zoneList[3];

  // Injury Risk Analysis
  const injuryRiskFactors: string[] = [];
  let riskScore = 0;

  if (bmi >= 27) {
    riskScore += 2;
    injuryRiskFactors.push(`IMC elevado (${bmi}): maior sobrecarga nas articulações do joelho e tornozelo.`);
  }
  if (isSedentary || weeksActive < 4) {
    riskScore += 2;
    injuryRiskFactors.push('Sedentarismo / Histórico recente < 4 semanas: tendões e ossos ainda sem adaptação mecânica.');
  }
  if (trainingDays > 4 && weeksActive < 8) {
    riskScore += 1;
    injuryRiskFactors.push('Frequência alta para fase de adaptação: risco de canelite e fascite plantar.');
  }
  if (athlete.injuries && athlete.injuries.trim().length > 3) {
    riskScore += 2;
    injuryRiskFactors.push(`Histórico prévio de dor relatado: "${athlete.injuries}".`);
  }

  const injuryRiskLevel: 'Baixo' | 'Moderado' | 'Elevado' = 
    riskScore >= 4 ? 'Elevado' : riskScore >= 2 ? 'Moderado' : 'Baixo';

  // Safe Weekly Volume & Long Run Prescription
  let safeWeeklyVolumeKm = 18;
  let safeLongRunKm = 5;

  if (isSedentary || weeksActive <= 4) {
    safeWeeklyVolumeKm = Math.min(18, trainingDays * 4);
    safeLongRunKm = Math.min(5, safeWeeklyVolumeKm * 0.35);
  } else if (weeksActive <= 12) {
    safeWeeklyVolumeKm = Math.min(30, Math.max(20, trainingDays * 6));
    safeLongRunKm = Math.min(9, safeWeeklyVolumeKm * 0.33);
  } else if (weeksActive <= 24) {
    safeWeeklyVolumeKm = Math.min(45, Math.max(28, trainingDays * 8));
    safeLongRunKm = Math.min(14, safeWeeklyVolumeKm * 0.33);
  } else {
    safeWeeklyVolumeKm = Math.min(70, Math.max(40, trainingDays * 10));
    safeLongRunKm = Math.min(24, safeWeeklyVolumeKm * 0.32);
  }

  // Adjust dynamically if multi-session real telemetry is present
  if (multiSummary) {
    if (multiSummary.detectedWeeklyVolumeKm > 0) {
      safeWeeklyVolumeKm = Math.max(safeWeeklyVolumeKm, Math.round(multiSummary.detectedWeeklyVolumeKm * 1.1));
    }
    if (multiSummary.longestRunKm > 0) {
      safeLongRunKm = Math.max(safeLongRunKm, Math.round(multiSummary.longestRunKm * 10) / 10);
    }
  }

  safeWeeklyVolumeKm = Math.round(safeWeeklyVolumeKm);
  safeLongRunKm = Math.round(safeLongRunKm * 10) / 10;

  // Training Phase & Structure
  let trainingPhase = 'Fase 1: Adaptação Anatômica & Base Aeróbica';
  let trainingPhaseDescription = 'Foco em adaptação osteoarticular, fortalecimento de tendões e criação de capilarização mitocondrial em Z1/Z2.';
  let polarizedRatio = '90% Zona Fácil (Z1/Z2) / 10% Ritmo Controlado';
  let structureType: 'walk_run_progression' | 'aerobic_base_building' | 'polarized_daniels' | 'high_performance' = 'aerobic_base_building';

  if (isSedentary || weeksActive <= 4 || bmi >= 30) {
    trainingPhase = 'Fase 1: Condicionamento Inicial (Caminhada-Corrida)';
    trainingPhaseDescription = 'Transição gradual de impacto. Intercalação de corrida leve com caminhada para proteção articular.';
    polarizedRatio = '95% Fácil & Regenerativo / 5% Strides';
    structureType = 'walk_run_progression';
  } else if (weeksActive <= 12) {
    trainingPhase = 'Fase 2: Construção de Resistência Aeróbica (Base Jack Daniels)';
    trainingPhaseDescription = 'Aumento progressivo de volume em Easy Pace (Zona E), fortalecendo o músculo cardíaco e capacidade enzimática.';
    polarizedRatio = '85% Zona Fácil / 15% Ritmo de Limiar (Threshold)';
    structureType = 'aerobic_base_building';
  } else if (weeksActive <= 24) {
    trainingPhase = 'Fase 3: Desenvolvimento de Limiar de Lactato & Eficiência';
    trainingPhaseDescription = 'Sessões de Threshold (Zona T) e Tiros I (VO2máx) para elevar a velocidade sustentada sem fadiga precoce.';
    polarizedRatio = '80% Zona Fácil / 20% Ritmos de Qualidade (T + I)';
    structureType = 'polarized_daniels';
  } else {
    trainingPhase = 'Fase 4: Polimento Específico de Prova & Alta Performance';
    trainingPhaseDescription = 'Treinos em ritmo específico de prova (Marathon Pace / 10k), tiros de repetição R para economia de corrida e longões progressivos.';
    polarizedRatio = '75% Zona Fácil / 25% Qualidade Especifica';
    structureType = 'high_performance';
  }

  // Fitness Level Classification
  let fitnessLevelName = 'Iniciante';
  let fitnessPercentileAgeGender = 40;
  if (baseVdot < 35) {
    fitnessLevelName = 'Iniciante / Adaptação';
    fitnessPercentileAgeGender = 35;
  } else if (baseVdot < 42) {
    fitnessLevelName = 'Intermediário Base';
    fitnessPercentileAgeGender = 55;
  } else if (baseVdot < 50) {
    fitnessLevelName = 'Intermediário Avançado';
    fitnessPercentileAgeGender = 75;
  } else if (baseVdot < 58) {
    fitnessLevelName = 'Avançado / Competitivo';
    fitnessPercentileAgeGender = 90;
  } else {
    fitnessLevelName = 'Sub-Elite / Alta Performance';
    fitnessPercentileAgeGender = 98;
  }

  // Actionable Guidance Points
  const actionableGuidance: string[] = [];

  if (isSedentary || weeksActive < 6) {
    actionableGuidance.push(`Nunca ultrapasse ${safeWeeklyVolumeKm} km por semana nas primeiras 4 semanas (Regra dos 10% de progressão).`);
    actionableGuidance.push(`Mantenha 80-90% de todo o tempo em Easy Pace (${paceE.formattedPaceKm}) onde você consegue conversar confortavelmente.`);
    actionableGuidance.push('Inclua 2 sessões semanais de fortalecimento de membros inferiores (panturrilhas, glúteo médio e core).');
  } else {
    actionableGuidance.push(`Seu ritmo de rodagem regenerativa e longa (Easy) ideal é de ${paceE.formattedPaceKm}.`);
    actionableGuidance.push(`Para treinos de Limiar de Lactato (Threshold), mantenha o ritmo em ${paceT.formattedPaceKm}.`);
    actionableGuidance.push(`Para tiros curtos de VO2máx (400m a 1000m), execute no ritmo de Interval (${paceI.formattedPaceKm}).`);
  }

  if (bmi >= 26) {
    actionableGuidance.push('Mantenha uma cadência de passos alta (175 a 185 SPM) para reduzir o pico de força vertical nos joelhos.');
  }

  const keyWorkoutsSuggested = [
    {
      title: 'Rodagem Fácil (Easy Run)',
      zone: 'Zona E (Jack Daniels)',
      description: 'Desenvolve leito capilar e adaptação mitocondrial com mínimo estresse de fadiga.',
      targetPace: paceE.formattedPaceKm
    },
    {
      title: 'Treino de Limiar (Threshold / Tempo Run)',
      zone: 'Zona T (Jack Daniels)',
      description: 'Aumenta a velocidade que você consegue sustentar antes do acúmulo exponencial de lactato.',
      targetPace: paceT.formattedPaceKm
    },
    {
      title: 'Tiros de VO2máx (Interval)',
      zone: 'Zona I (Jack Daniels)',
      description: 'Estimula a captação máxima de oxigênio pelo sistema cardiopulmonar.',
      targetPace: paceI.formattedPaceKm
    }
  ];

  return {
    bmi,
    bmiClassification,
    bmiCategory,
    adjustedVo2max: baseVdot,
    vdot: baseVdot,
    fitnessLevelName,
    fitnessPercentileAgeGender,
    injuryRiskLevel,
    injuryRiskFactors,
    recommendedWeeklyFrequency: trainingDays,
    safeWeeklyVolumeKm,
    safeLongRunKm,
    trainingPhase,
    trainingPhaseDescription,
    polarizedRatio,
    structureType,
    actionableGuidance,
    keyWorkoutsSuggested
  };
}
