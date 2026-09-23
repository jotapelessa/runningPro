/**
 * @graph-entity RunWalkEngine
 * @module runWalkEngine
 * @depends-on RunnerState, RunWalkInterval, VdotReadiness
 * @description Motor fisiológico de prescrição do método Caminha-Corre (Run-Walk)
 * e cálculo do índice de prontidão mecânica rumo ao VDOT formal de Jack Daniels.
 */

import { DailyWorkout, RunWalkInterval, RunnerState, TrainingPlan, TrainingWeek, VdotReadiness } from '../types';

export interface RunWalkWeekConfig {
  weekNumber: number;
  phase: string;
  focus: string;
  interval: RunWalkInterval;
  totalDurationMin: number;
  totalRunTimeMin: number;
  totalWalkTimeMin: number;
  estimatedVolumeKm: number;
}

export const RUN_WALK_SCHEDULE: RunWalkWeekConfig[] = [
  {
    weekNumber: 1,
    phase: 'Semana 1: Adaptação Musculoesquelética Inicial',
    focus: '5 min aquecimento caminhando + 10 blocos de 1 min trote leve / 2 min caminhada + 5 min desaquecimento.',
    interval: {
      reps: 10,
      runDurationSec: 60,
      walkDurationSec: 120,
      targetRpe: 6,
      targetKarvonenZone: 'Z2',
      warmupWalkSec: 300,
      cooldownWalkSec: 300,
      cues: {
        runText: 'Trote muito suave — ritmo em que você consegue soltar frases curtas (RPE 6/10)',
        walkText: 'Caminhada rápida e firme de recuperação para baixar os batimentos'
      }
    },
    totalDurationMin: 40,
    totalRunTimeMin: 10,
    totalWalkTimeMin: 30, // 20m intervalado + 10m aquec/desaq
    estimatedVolumeKm: 3.5
  },
  {
    weekNumber: 2,
    phase: 'Semana 2: Consolidação dos Blocos de Trote',
    focus: '5 min aquec. + 8 blocos de 1 min 30s trote leve / 2 min caminhada + 5 min desaquecimento.',
    interval: {
      reps: 8,
      runDurationSec: 90,
      walkDurationSec: 120,
      targetRpe: 6,
      targetKarvonenZone: 'Z2',
      warmupWalkSec: 300,
      cooldownWalkSec: 300,
      cues: {
        runText: 'Trote suave e cadência curta, aterrissando embaixo do corpo (RPE 6/10)',
        walkText: 'Caminhada ativa com respiração profunda'
      }
    },
    totalDurationMin: 38,
    totalRunTimeMin: 12,
    totalWalkTimeMin: 26,
    estimatedVolumeKm: 3.7
  },
  {
    weekNumber: 3,
    phase: 'Semana 3: Equilíbrio 1:1 Trote e Caminhada',
    focus: '5 min aquec. + 7 blocos de 2 min trote leve / 2 min caminhada + 5 min desaquecimento.',
    interval: {
      reps: 7,
      runDurationSec: 120,
      walkDurationSec: 120,
      targetRpe: 6.5,
      targetKarvonenZone: 'Z2',
      warmupWalkSec: 300,
      cooldownWalkSec: 300,
      cues: {
        runText: 'Sustente o trote contínuo de 2 minutos sem pressa, foco na postura ereta',
        walkText: 'Caminhada moderada de recuperação ativa'
      }
    },
    totalDurationMin: 38,
    totalRunTimeMin: 14,
    totalWalkTimeMin: 24,
    estimatedVolumeKm: 3.9
  },
  {
    weekNumber: 4,
    phase: 'Semana 4: Domínio Aeróbico & Transição',
    focus: '5 min aquec. + 6 blocos de 2 min 30s trote leve / 1 min 30s caminhada + 5 min desaquecimento.',
    interval: {
      reps: 6,
      runDurationSec: 150,
      walkDurationSec: 90,
      targetRpe: 6.5,
      targetKarvonenZone: 'Z2',
      warmupWalkSec: 300,
      cooldownWalkSec: 300,
      cues: {
        runText: 'Trote firme e confortável de 2m30s. Se faltar o ar, reduza a passada!',
        walkText: 'Caminhada de recuperação'
      }
    },
    totalDurationMin: 34,
    totalRunTimeMin: 15,
    totalWalkTimeMin: 19,
    estimatedVolumeKm: 3.8
  }
];

const DAY_NAMES = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

/**
 * Gera a planilha de treinamento focada no método Caminha-Corre
 * @param athleteName Nome do atleta
 * @param trainingDaysPerWeek Número de dias semanais (ex: 3)
 * @param customActiveDays Dias específicos escolhidos pelo atleta (0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sáb, 6=Dom). Padrão [0, 2, 4] para Seg/Qua/Sex ou [1, 3, 5] para Ter/Qui/Sáb.
 */
export function generateRunWalkPlan(
  athleteName: string = 'Atleta em Transição',
  trainingDaysPerWeek: number = 3,
  customActiveDays?: number[]
): TrainingPlan {
  const defaultDays = trainingDaysPerWeek <= 3 ? [0, 2, 4] : [0, 1, 3, 4]; // Seg/Qua/Sex padrão inicial se não especificado
  const targetActiveDays = (customActiveDays && customActiveDays.length > 0) ? customActiveDays : defaultDays;

  const weeks: TrainingWeek[] = RUN_WALK_SCHEDULE.map((cfg) => {
    const days: DailyWorkout[] = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const isActive = targetActiveDays.includes(dayIdx);

      const workoutId = `rw-w${cfg.weekNumber}-d${dayIdx}`;
      if (isActive) {
        days.push({
          id: workoutId,
          dayIndex: dayIdx,
          dayName: DAY_NAMES[dayIdx],
          type: 'E',
          title: `Caminha-Corre (${cfg.totalRunTimeMin}m Trote / ${cfg.totalWalkTimeMin}m Caminhada)`,
          description: cfg.focus,
          totalKm: cfg.estimatedVolumeKm,
          durationMinutes: cfg.totalDurationMin,
          tss: 15 + (cfg.weekNumber * 2),
          warmup: '5 min de caminhada em ritmo moderado a firme',
          mainBlock: cfg.focus,
          cooldown: '5 min de caminhada leve para desaquecimento',
          completed: false,
          notes: `Meta de esforço moderado (RPE 6/10). Trote suave onde consiga falar frases curtas. Não force ritmo de tiro!`
        });
      } else {
        days.push({
          id: workoutId,
          dayIndex: dayIdx,
          dayName: DAY_NAMES[dayIdx],
          type: 'REST',
          title: dayIdx === 0 || dayIdx === 6 ? 'Descanso Total / Recuperação' : 'Descanso Ativo ou Mobilidade',
          description: 'Regeneração das articulações e fortalecimento das fáscias musculares.',
          totalKm: 0,
          durationMinutes: 0,
          tss: 0,
          warmup: '',
          mainBlock: 'Repouso e recuperação passiva ou caminhada livre leve.',
          cooldown: '',
          completed: false,
          notes: 'A adaptação física de tendões e ossos ocorre no repouso.'
        });
      }
    }

    return {
      weekNumber: cfg.weekNumber,
      phase: cfg.phase,
      phaseCode: 'base',
      focus: cfg.focus,
      totalKm: cfg.estimatedVolumeKm * (trainingDaysPerWeek <= 3 ? 3 : 4),
      targetTss: 40 + (cfg.weekNumber * 5),
      days
    };
  });

  return {
    id: `plan-runwalk-${Date.now()}`,
    name: 'Planilha de Transição Segura: Método Caminha-Corre',
    athleteName,
    createdAt: new Date().toISOString(),
    vdot: 30, // Marcador base simbólico
    targetGoal: 'base',
    weeklyFrequency: (trainingDaysPerWeek <= 3 ? 3 : 4) as any,
    weeks
  };
}


/**
 * Calcula a prontidão para o VDOT com base no histórico do atleta
 */
export function calculateVdotReadiness(runnerState: RunnerState): VdotReadiness {
  const isSedentary = runnerState.level === 'sedentary_transition' || runnerState.activityProfile === 'sedentary';
  
  // Se já for intermediário ou avançado ou tiver marcado VDOT calibrado
  if (!isSedentary && (runnerState.currentVdot || 0) >= 30 && runnerState.isCalibrated) {
    return {
      currentStage: 'vdot_ready',
      stageTitle: 'Atleta Apto para o Motor VDOT',
      readinessPercentage: 100,
      completedRunWalkWeeks: 4,
      continuousRunRecordSec: 1800,
      targetContinuousMeters: 3000,
      painFreeDaysStreak: 14,
      unlockedVdot: true,
      coachRecommendation: 'Você possui sustentação aeróbica para testes formais de VDOT e treinos contínuos com zonas de ritmo Jack Daniels.'
    };
  }

  // Avaliação do estágio inicial
  const weeksDone = Math.min(4, Math.max(0, runnerState.weeksActive || 1));
  const hasActiveSeverePain = (runnerState.pains || []).some(p => !p.resolved && (p.severity === 'moderate' || p.severity === 'severe'));

  let readinessScore = 20 + (weeksDone * 15);
  if (hasActiveSeverePain) {
    readinessScore = Math.max(10, readinessScore - 30);
  }

  const continuousRecordSec = (runnerState.weeksActive || 0) > 3 ? 600 : 150; // Estimativa progressiva

  let stage: 'mechanical_adaptation' | 'aerobic_base' | 'vdot_ready' = 'mechanical_adaptation';
  let stageTitle = 'Adaptação Musculoesquelética';
  let coachRecommendation = 'Foque no método Caminha-Corre (10x 1m trote / 2m caminhada). Proteja suas articulações antes de pensar em velocidade.';

  if (weeksDone >= 3 && !hasActiveSeverePain) {
    stage = 'aerobic_base';
    stageTitle = 'Consolidação de Base Aeróbica';
    coachRecommendation = 'Seus tendões estão se adaptando muito bem! Continue os blocos até conseguir trotar 15 a 20 minutos contínuos sem dor.';
  }

  return {
    currentStage: stage,
    stageTitle,
    readinessPercentage: Math.min(95, Math.max(15, readinessScore)),
    completedRunWalkWeeks: weeksDone,
    continuousRunRecordSec: continuousRecordSec,
    targetContinuousMeters: 3000,
    painFreeDaysStreak: hasActiveSeverePain ? 0 : 7,
    unlockedVdot: false,
    coachRecommendation
  };
}
