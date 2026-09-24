import { RunnerState, TrainingPlan, UserActivity } from '../types';
import { calculateTrainingPaces, calculateHeartRateZones } from './vdotCalculator';

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
  const maxHr = runner.maxHr || 185;
  const restingHr = runner.restingHr || 55;
  
  const hrZonesArray = calculateHeartRateZones(maxHr, restingHr);
  const pacesList = calculateTrainingPaces(runner.currentVdot);
  
  const getPace = (key: string) => pacesList.find(p => p.key === key)?.formattedPaceKm || 'N/A';
  const getZone = (z: number) => hrZonesArray.find(hz => hz.zone === z) || { bpmMin: 0, bpmMax: 0 };

  let md = `---
type: athlete-profile
date: ${dateStr}
vdot: ${runner.currentVdot}
maxHr: ${maxHr}
restingHr: ${restingHr}
---

# PaceLab Athlete Profile: ${runner.name}

## Fisiologia Atual
- **VDOT Atual:** ${runner.currentVdot}
- **Frequência Cardíaca Máxima:** ${maxHr} bpm
- **Frequência Cardíaca de Repouso:** ${restingHr} bpm

## Ritmos de Treino (Paces)
- **Fácil (E):** ${getPace('E')}
- **Maratona (M):** ${getPace('M')}
- **Limiar (T):** ${getPace('T')}
- **Intervalado (I):** ${getPace('I')}
- **Repetição (R):** ${getPace('R')}

## Zonas de Frequência Cardíaca (Karvonen)
- **Z1 (Recuperação):** ${getZone(1).bpmMin}-${getZone(1).bpmMax} bpm
- **Z2 (Base/Aeróbico):** ${getZone(2).bpmMin}-${getZone(2).bpmMax} bpm
- **Z3 (Tempo/Sub-Limiar):** ${getZone(3).bpmMin}-${getZone(3).bpmMax} bpm
- **Z4 (Limiar/VO2):** ${getZone(4).bpmMin}-${getZone(4).bpmMax} bpm
- **Z5 (Anaeróbico):** ${getZone(5).bpmMin}-${getZone(5).bpmMax} bpm

## Histórico Recente de Atividades (${activities.length} treinos)
`;

  const recentActivities = [...activities].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 10); // Last 10

  for (const act of recentActivities) {
    const actDate = new Date(act.date).toLocaleDateString();
    const distanceKm = (act.distanceMeters / 1000).toFixed(2);
    md += `- **[[${actDate}]]**: ${act.title} | ${distanceKm}km | ${act.durationSeconds}s | HR Médio: ${act.avgHr || 'N/A'}\n`;
  }

  md += `\n## Plano Atual: ${plan.name}
- **Meta:** ${plan.targetGoal}
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
  const maxHr = runner.maxHr || 185;
  const restingHr = runner.restingHr || 55;
  
  const hrZonesArray = calculateHeartRateZones(maxHr, restingHr);
  const pacesList = calculateTrainingPaces(runner.currentVdot);

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
        max: maxHr,
        resting: restingHr
      },
      paces: pacesList,
      zones: hrZonesArray
    },
    plan: {
      name: plan.name,
      targetGoal: plan.targetGoal
    },
    activities: activities.map(a => ({
      id: a.id,
      name: a.title,
      date: a.date,
      distanceMeters: a.distanceMeters,
      durationSeconds: a.durationSeconds,
      avgHr: a.avgHr,
      maxHr: a.maxHr,
      vdotEstimate: a.vdot
    }))
  };

  return JSON.stringify(payload, null, 2);
}
