import { RunnerState, TrainingPlan, UserActivity } from '../types';

/**
 * Formats a runner's physiology and recent data into a Markdown string
 * optimized for Obsidian / Logseq / Personal Knowledge Management systems.
 */
export function exportToObsidianMarkdown(
  runner: RunnerState,
  plan: TrainingPlan,
  activities: UserActivity[]
): string {
  const dateStr = new Date().toISOString().split('T')[0];
  let md = `---
type: athlete-profile
date: ${dateStr}
vdot: ${runner.currentVdot}
maxHr: ${runner.maxHr}
restingHr: ${runner.restingHr}
---

# PaceLab Athlete Profile: ${runner.name}

## Fisiologia Atual
- **VDOT Atual:** ${runner.currentVdot}
- **Frequência Cardíaca Máxima:** ${runner.maxHr} bpm
- **Frequência Cardíaca de Repouso:** ${runner.restingHr} bpm
- **Lactate Threshold Estimado:** ${runner.lactateThresholdHr} bpm

## Ritmos de Treino (Paces)
- **Fácil (E):** ${runner.paces.easy}
- **Maratona (M):** ${runner.paces.marathon}
- **Limiar (T):** ${runner.paces.threshold}
- **Intervalado (I):** ${runner.paces.interval}
- **Repetição (R):** ${runner.paces.repetition}

## Zonas de Frequência Cardíaca (Karvonen)
- **Z1 (Recuperação):** ${runner.hrZones.z1.min}-${runner.hrZones.z1.max} bpm
- **Z2 (Base/Aeróbico):** ${runner.hrZones.z2.min}-${runner.hrZones.z2.max} bpm
- **Z3 (Tempo/Sub-Limiar):** ${runner.hrZones.z3.min}-${runner.hrZones.z3.max} bpm
- **Z4 (Limiar/VO2):** ${runner.hrZones.z4.min}-${runner.hrZones.z4.max} bpm
- **Z5 (Anaeróbico):** ${runner.hrZones.z5.min}-${runner.hrZones.z5.max} bpm

## Histórico Recente de Atividades (${activities.length} treinos)
`;

  const recentActivities = [...activities].sort((a, b) => 
    new Date(b.startDateLocal).getTime() - new Date(a.startDateLocal).getTime()
  ).slice(0, 10); // Last 10

  for (const act of recentActivities) {
    const actDate = new Date(act.startDateLocal).toLocaleDateString();
    const distanceKm = (act.distance / 1000).toFixed(2);
    md += `- **[[${actDate}]]**: ${act.name} | ${distanceKm}km | ${act.movingTime}s | HR Médio: ${act.averageHeartrate || 'N/A'}\n`;
  }

  md += `\n## Plano Atual: ${plan.goalRace}
- **Data da Prova:** ${plan.raceDate}
- **Meta:** ${plan.targetPace} min/km
`;

  return md;
}

/**
 * Formats data into a structured JSON for Graphify or API consumption.
 */
export function exportToGraphifyJson(
  runner: RunnerState,
  plan: TrainingPlan,
  activities: UserActivity[]
): string {
  const payload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: "3.6",
      source: "PaceLab VDOT",
    },
    athlete: {
      name: runner.name,
      vdot: runner.currentVdot,
      heartRate: {
        max: runner.maxHr,
        resting: runner.restingHr,
        threshold: runner.lactateThresholdHr
      },
      paces: runner.paces,
      zones: runner.hrZones
    },
    plan: {
      goalRace: plan.goalRace,
      date: plan.raceDate,
      targetPace: plan.targetPace,
    },
    activities: activities.map(a => ({
      id: a.id,
      name: a.name,
      date: a.startDateLocal,
      distanceMeters: a.distance,
      durationSeconds: a.movingTime,
      avgHr: a.averageHeartrate,
      maxHr: a.maxHeartrate,
      vdotEstimate: a.estimatedVdot
    }))
  };

  return JSON.stringify(payload, null, 2);
}
