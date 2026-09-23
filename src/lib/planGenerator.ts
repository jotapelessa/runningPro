import { DailyWorkout, TrainingPlan, TrainingWeek } from '../types';
import { calculateTrainingPaces, formatPace } from './vdotCalculator';

const DAY_NAMES = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

export function generateEightWeekPlan(
  athleteName: string = 'Atleta PaceLab',
  vdot: number = 45,
  targetGoal: '5k' | '10k' | '21k' | '42k' | 'base' = '10k',
  weeklyFrequency: 3 | 4 | 5 | 6 = 4
): TrainingPlan {
  const paces = calculateTrainingPaces(vdot);
  const pE = paces.find(p => p.key === 'E')!;
  const pM = paces.find(p => p.key === 'M')!;
  const pT = paces.find(p => p.key === 'T')!;
  const pI = paces.find(p => p.key === 'I')!;
  const pR = paces.find(p => p.key === 'R')!;

  const paceEStr = `${formatPace(pE.paceMinSecondsPerKm)}-${formatPace(pE.paceMaxSecondsPerKm)}/km`;
  const paceMStr = `${formatPace(pM.paceSecondsPerKm)}/km`;
  const paceTStr = `${formatPace(pT.paceSecondsPerKm)}/km`;
  const paceIStr = `${formatPace(pI.paceSecondsPerKm)}/km`;
  const paceRStr = `${formatPace(pR.paceSecondsPerKm)}/km`;

  // Multiplier based on distance goal
  const distMultipliers = {
    '5k': { baseKm: 28, longRunMax: 12 },
    '10k': { baseKm: 38, longRunMax: 16 },
    '21k': { baseKm: 48, longRunMax: 20 },
    '42k': { baseKm: 62, longRunMax: 28 },
    'base': { baseKm: 32, longRunMax: 14 },
  }[targetGoal];

  const weeks: TrainingWeek[] = [];

  const phasesConfig: Array<{
    week: number;
    phase: string;
    phaseCode: 'base' | 'threshold' | 'vo2max' | 'taper' | 'race';
    focus: string;
    volMultiplier: number;
  }> = [
    { week: 1, phase: 'Fase 1: Fundação & Adaptação', phaseCode: 'base', focus: 'Calibração dos ritmos fisiológicos, rodagem leve Z2 e acelerações neuromusculares (strides).', volMultiplier: 0.80 },
    { week: 2, phase: 'Fase 1: Consolidação da Base', phaseCode: 'base', focus: 'Aumento gradual do volume aeróbico, reforço da capilarização e estabilização de cadência.', volMultiplier: 0.90 },
    { week: 3, phase: 'Fase 2: Introdução ao Limiar (T)', phaseCode: 'threshold', focus: 'Cruise Intervals no Limiar de Lactato (Pace T) e treino longo progressivo.', volMultiplier: 0.95 },
    { week: 4, phase: 'Fase 2: Expansão de Limiar & Economia', phaseCode: 'threshold', focus: 'Tempo Run contínuo sustentado no Pace T e repetições curtas (Pace R) para economia.', volMultiplier: 1.00 },
    { week: 5, phase: 'Fase 3: Potência Aeróbica (VO2max)', phaseCode: 'vo2max', focus: 'Tiros intervalados clássicos no Pace I com recuperação ativa. Maior exigência cardiovascular.', volMultiplier: 1.05 },
    { week: 6, phase: 'Fase 3: Pico & Simulado Específico', phaseCode: 'vo2max', focus: 'Treino chave de choque da periodização, simulado específico de prova e longo com bloco M.', volMultiplier: 1.10 },
    { week: 7, phase: 'Fase 4: Polimento Inicial (Tapering)', phaseCode: 'taper', focus: 'Redução de 30% do volume total para regeneração do glicogênio, mantendo a intensidade afiada.', volMultiplier: 0.70 },
    { week: 8, phase: 'Fase 5: Semana da Prova / Reavaliação', phaseCode: 'race', focus: 'Polimento final com treinos curtos de ativação neuromuscular e o Grande Dia da Prova/Teste VDOT.', volMultiplier: 0.55 },
  ];

  phasesConfig.forEach((cfg) => {
    const weekKmTarget = Math.round(distMultipliers.baseKm * cfg.volMultiplier * (weeklyFrequency / 4));
    const days: DailyWorkout[] = [];

    // Construct schedule for 7 days
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dayName = DAY_NAMES[dayIdx];
      let workout: DailyWorkout;

      // Determine active days based on frequency:
      // 3x: Terça(1), Quinta(3), Sábado/Domingo(5 ou 6)
      // 4x: Terça(1), Quarta(2), Quinta(3), Sábado(5)
      // 5x: Terça(1), Quarta(2), Quinta(3), Sexta(4), Sábado(5)
      // 6x: Seg(0), Ter(1), Qua(2), Qui(3), Sex(4), Sab(5)

      let isActive = false;
      if (weeklyFrequency === 3) isActive = [1, 3, 5].includes(dayIdx);
      else if (weeklyFrequency === 4) isActive = [1, 2, 4, 5].includes(dayIdx);
      else if (weeklyFrequency === 5) isActive = [1, 2, 3, 4, 5].includes(dayIdx);
      else if (weeklyFrequency === 6) isActive = [0, 1, 2, 3, 4, 5].includes(dayIdx);

      const workoutId = `w${cfg.week}-d${dayIdx}`;

      if (!isActive) {
        // Rest or Cross Training
        workout = {
          id: workoutId,
          dayIndex: dayIdx,
          dayName,
          title: dayIdx === 0 ? 'Descanso Total & Recuperação Celular' : 'Descanso Ativo ou Mobilidade',
          type: 'REST',
          durationMinutes: 0,
          totalKm: 0,
          tss: 0,
          warmup: 'Nenhum aquecimento de corrida necessário.',
          mainBlock: 'Dia livre para descanso total. Recomendado: 15-20 min de mobilidade articular, liberação miofascial ou sono de qualidade.',
          cooldown: 'Hidratação adequada e nutrição rica em proteínas e antioxidantes.',
          notes: 'A supercompensação ocorre durante o descanso. Respeite o repouso!',
          completed: false
        };
      } else {
        // Active training day assignment
        if (dayIdx === 5 || (weeklyFrequency === 3 && dayIdx === 5)) {
          // LONG RUN (Sábado)
          const longKm = Math.min(
            distMultipliers.longRunMax,
            Math.round(weekKmTarget * 0.35 * (cfg.volMultiplier))
          );
          
          if (cfg.week === 8) {
            // RACE DAY!
            const raceDistance = {
              '5k': 5,
              '10k': 10,
              '21k': 21.1,
              '42k': 42.2,
              'base': 10
            }[targetGoal];

            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `🔥 DIA DA PROVA ALVO / TESTE VDOT (${targetGoal.toUpperCase()})`,
              type: 'TEST',
              durationMinutes: Math.round(raceDistance * (pT.paceSecondsPerKm / 60)),
              totalKm: raceDistance + 3,
              tss: 120,
              warmup: `15 min leve @ ${paceEStr} + 4x 80m acelerações progressivas + 5 min de concentração.`,
              mainBlock: `Execução da prova alvo de ${raceDistance} km com estratégia de Pacing calibrada. Mantenha foco absoluto nos splits calculados!`,
              cooldown: '10 min de trote regenerativo leve + hidratação imediata com eletrólitos e carboidratos.',
              notes: 'Confie no processo das 8 semanas. Boa prova!',
              completed: false
            };
          } else {
            const hasProgression = cfg.week >= 4 && cfg.week <= 6;
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Treino Longo Aeróbico (${longKm} km)`,
              type: hasProgression ? 'M' : 'E',
              durationMinutes: Math.round(longKm * (pE.paceSecondsPerKm / 60)),
              totalKm: longKm,
              tss: Math.round(longKm * 5.5),
              warmup: `Primeiros 2 km muito fáceis em Z1/Z2 baixo @ ${paceEStr}.`,
              mainBlock: hasProgression 
                ? `${longKm - 4} km estáveis em Z2 @ ${paceEStr} + últimos 4 km progressivos finalizando no Pace M (${paceMStr}).`
                : `${longKm} km contínuos em Z2 pura @ ${paceEStr}. Foco em respiração nasal/ritmada e hidratação a cada 20 min.`,
              cooldown: 'Caminhada de 3 min + alongamento dinâmico.',
              notes: 'Treino de grande adaptação metabólica e queima lipídica.',
              completed: false
            };
          }
        } else if (dayIdx === 1 || (weeklyFrequency === 3 && dayIdx === 1)) {
          // QUALIDADE 1 (Intervalados / Limiar na Terça)
          if (cfg.phaseCode === 'base') {
            const reps = cfg.week === 1 ? 6 : 8;
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Rodagem Aeróbica + ${reps}x Strides Neuromusculares`,
              type: 'R',
              durationMinutes: 45,
              totalKm: 7,
              tss: 45,
              warmup: `2 km em ritmo E @ ${paceEStr} + drills educativos (skipping, anfersen).`,
              mainBlock: `5 km ritmo confortável E @ ${paceEStr} + ${reps} acelerações de 100m (Pace R: ${paceRStr}) com 1 min de caminhada entre elas.`,
              cooldown: '1 km de trote suave e solto.',
              notes: 'Os strides melhoram a mecânica de corrida e cadência sem gerar fadiga ácida.',
              completed: false
            };
          } else if (cfg.phaseCode === 'threshold') {
            const reps = cfg.week === 3 ? '4x 1.500m' : '3x 2.000m';
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Cruise Intervals no Limiar (Pace T)`,
              type: 'T',
              durationMinutes: 50,
              totalKm: 8.5,
              tss: 65,
              warmup: `2 km aquecimento leve @ ${paceEStr} + 3 acelerações de 60m.`,
              mainBlock: `${reps} @ Pace T (${paceTStr}) com 90 segundos de trote leve de recuperação entre cada bloco.`,
              cooldown: '1.5 km trote regenerativo em Z1.',
              notes: 'Mantenha o ritmo cravado! Não acelere além do Pace T para não entrar em acidose precoce.',
              completed: false
            };
          } else if (cfg.phaseCode === 'vo2max') {
            const series = cfg.week === 5 ? '5x 1000m' : '6x 800m';
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Tiros de Potência VO2max (Pace I)`,
              type: 'I',
              durationMinutes: 55,
              totalKm: 9,
              tss: 78,
              warmup: `2.5 km aquecimento progressivo @ ${paceEStr} + 4x 80m strides.`,
              mainBlock: `${series} @ Pace I (${paceIStr}) com intervalo ativo de 2min30s em trote leve Z1.`,
              cooldown: '1.5 km soltura regenerativa bem lenta.',
              notes: 'Treino de teto fisiológico. Exija a capacidade pulmonar mantendo a postura ereta.',
              completed: false
            };
          } else {
            // Taper
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Polimento & Manutenção de Ritmo`,
              type: 'T',
              durationMinutes: 35,
              totalKm: 5.5,
              tss: 35,
              warmup: `2 km trote leve @ ${paceEStr}.`,
              mainBlock: `3x 1000m @ Pace T (${paceTStr}) com 2 min de recuperação ativa.`,
              cooldown: '1 km trote bem suave.',
              notes: 'Mantendo o sistema neuromuscular estimulado sem desgastar a musculatura.',
              completed: false
            };
          }
        } else if (dayIdx === 3 || (weeklyFrequency === 3 && dayIdx === 3)) {
          // QUALIDADE 2 ou Rodagem Moderada (Quinta)
          const kmEasy = Math.round(weekKmTarget * 0.22);
          if (cfg.phaseCode === 'threshold' || cfg.phaseCode === 'vo2max') {
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Tempo Run Contínuo (${Math.min(6, kmEasy)} km @ Pace T/M)`,
              type: 'T',
              durationMinutes: 45,
              totalKm: kmEasy + 2,
              tss: 55,
              warmup: `2 km em ritmo E @ ${paceEStr}.`,
              mainBlock: `20 a 25 min contínuos entre Pace M (${paceMStr}) e Pace T (${paceTStr}). Sensação de esforço 7-8/10.`,
              cooldown: '1.5 km desaquecimento leve.',
              notes: 'Treino chave para criar tolerância psicológica e fisiológica ao ritmo forte sustentado.',
              completed: false
            };
          } else {
            workout = {
              id: workoutId,
              dayIndex: dayIdx,
              dayName,
              title: `Rodagem Regenerativa Estruturada (${kmEasy} km)`,
              type: 'E',
              durationMinutes: Math.round(kmEasy * (pE.paceSecondsPerKm / 60)),
              totalKm: kmEasy,
              tss: Math.round(kmEasy * 4),
              warmup: '1 km de início bem calmo.',
              mainBlock: `${kmEasy} km contínuos e confortáveis em Z2 @ ${paceEStr}.`,
              cooldown: '5 min de caminhada + mobilidade de quadril.',
              notes: 'Controle rigoroso da frequência cardíaca na Z2.',
              completed: false
            };
          }
        } else {
          // Rodagem Leve / Recuperação Ativa (Quarta / Sexta / Seg)
          const recKm = Math.max(4, Math.round(weekKmTarget * 0.16));
          workout = {
            id: workoutId,
            dayIndex: dayIdx,
            dayName,
            title: `Rodagem Leve Z2 / Regenerativo (${recKm} km)`,
            type: 'E',
            durationMinutes: Math.round(recKm * (pE.paceSecondsPerKm / 60)),
            totalKm: recKm,
            tss: Math.round(recKm * 3.5),
            warmup: 'Início progressivo e relaxado.',
            mainBlock: `${recKm} km em ritmo puramente conversacional @ ${paceEStr}.`,
            cooldown: 'Alongamento suave.',
            notes: 'Mantenha a sensação de facilidade durante todo o trajeto.',
            completed: false
          };
        }
      }

      days.push(workout);
    }

    const totalActualKm = days.reduce((sum, d) => sum + d.totalKm, 0);
    const totalTss = days.reduce((sum, d) => sum + d.tss, 0);

    weeks.push({
      weekNumber: cfg.week,
      phase: cfg.phase,
      phaseCode: cfg.phaseCode,
      focus: cfg.focus,
      totalKm: Math.round(totalActualKm * 10) / 10,
      targetTss: totalTss,
      days
    });
  });

  return {
    id: `plan-${Date.now()}`,
    name: `Planilha PaceLab 8 Semanas — Alvo ${targetGoal.toUpperCase()} (VDOT ${vdot})`,
    athleteName,
    vdot,
    targetGoal,
    weeklyFrequency,
    createdAt: new Date().toISOString(),
    weeks
  };
}
