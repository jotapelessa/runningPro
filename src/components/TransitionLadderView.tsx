import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  HeartHandshake, 
  Flame, 
  Clock, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RunnerState, AdaptationMilestone } from '../types';
import { calculateVdotReadiness } from '../lib/runWalkEngine';

interface TransitionLadderViewProps {
  runnerState: RunnerState;
  onUpdateRunnerState: (updatedFields: Partial<RunnerState>) => void;
  onOpenAthleteModal: () => void;
}

export const TransitionLadderView: React.FC<TransitionLadderViewProps> = ({
  runnerState,
  onUpdateRunnerState,
  onOpenAthleteModal
}) => {
  const readiness = calculateVdotReadiness(runnerState);

  // Marcos da Escada de Transição Biológica
  const milestones: AdaptationMilestone[] = [
    {
      id: 'm1_consistency',
      order: 1,
      title: 'Marco 1: Consistência & Zero Lesões',
      subtitle: 'Completar 2 semanas seguidas no método Caminha-Corre (Run-Walk) sem dores articulares ou periostite (canelite).',
      targetMetric: '2 Semanas',
      currentMetric: `${runnerState.weeksActive || 1} Semanas`,
      completed: (runnerState.weeksActive || 1) >= 2,
      badgeIcon: 'ShieldCheck',
      unlockedVdotBenefit: 'Remodelação fascial e tendínea'
    },
    {
      id: 'm2_500m',
      order: 2,
      title: 'Marco 2: Primeiro Trote Contínuo de 500m',
      subtitle: 'Sustentar 500 metros contínuos (aprox. 3 a 4 minutos de trote leve) sem parar para caminhar e sem falta de ar intensa (RPE ≤ 6/10).',
      targetMetric: '500m contínuos',
      currentMetric: (runnerState.weeksActive || 1) >= 3 ? '500m' : '250m',
      completed: (runnerState.weeksActive || 1) >= 3,
      badgeIcon: 'Zap',
      unlockedVdotBenefit: 'Eficiência mecânica de trote'
    },
    {
      id: 'm3_1500m',
      order: 3,
      title: 'Marco 3: Base Aeróbica de 1.500m a 2.000m',
      subtitle: 'Completar 1,5 km a 2,0 km contínuos de trote leve sem paradas, mantendo cadência confortável (~160 a 170 spm).',
      targetMetric: '1.500m contínuos',
      currentMetric: (runnerState.weeksActive || 1) >= 4 ? '1.500m' : '750m',
      completed: (runnerState.weeksActive || 1) >= 4,
      badgeIcon: 'Flame',
      unlockedVdotBenefit: 'Capacitação mitocondrial periférica'
    },
    {
      id: 'm4_3000m_graduation',
      order: 4,
      title: 'Marco 4 (Final): Teste Contínuo de 3.000m & Desbloqueio VDOT',
      subtitle: 'Completar 3.000 metros de corrida contínua sem parar. Este tempo determinará seu primeiro VDOT formal de Jack Daniels!',
      targetMetric: '3.000m contínuos',
      currentMetric: readiness.unlockedVdot ? '3.000m' : 'Em treino',
      completed: !!readiness.unlockedVdot,
      badgeIcon: 'Trophy',
      unlockedVdotBenefit: 'Desbloqueio de todas as projeções VDOT (5k a 42k)'
    }
  ];

  const [testTimeMin, setTestTimeMin] = useState<string>('21');
  const [testTimeSec, setTestTimeSec] = useState<string>('00');
  const [showGraduationForm, setShowGraduationForm] = useState<boolean>(false);

  // Ação de Graduação: quando o usuário completa os 3km contínuos
  const handleCompleteGraduation = () => {
    const mins = parseInt(testTimeMin) || 20;
    const secs = parseInt(testTimeSec) || 0;
    const totalSec = (mins * 60) + secs;

    // Calcular um VDOT aproximado para 3000m usando fórmula simplificada de Jack Daniels
    // Ex: 3000m em 20:00 -> VDOT ~ 33; em 22:00 -> VDOT ~ 30
    let estimatedVdot = 31.0;
    if (totalSec <= 15 * 60) estimatedVdot = 42.0;
    else if (totalSec <= 18 * 60) estimatedVdot = 36.0;
    else if (totalSec <= 21 * 60) estimatedVdot = 32.0;
    else if (totalSec <= 24 * 60) estimatedVdot = 29.0;
    else estimatedVdot = 27.0;

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
    });

    onUpdateRunnerState({
      level: 'beginner',
      activityProfile: 'beginner',
      currentVdot: estimatedVdot,
      isCalibrated: true,
      trainingDays: runnerState.trainingDays || 4,
      targetGoal: '5k',
      prRecords: {
        ...(runnerState.prRecords || {}),
        '3000m': totalSec
      }
    });

    alert(`🎉 PARABÉNS! Você se graduou com sucesso para o motor VDOT!\nSeu VDOT inicial calibrado é ${estimatedVdot.toFixed(1)}.\nTodas as previsões de prova (5k, 10k, 21k, 42k) e a Periodização de 8 Semanas agora estão liberadas!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Explicação da transição */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0E1B13] to-emerald-950/60 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-white font-heading">
                Escada de Evolução & Transição para o VDOT
              </span>
              <span className="text-[10px] uppercase font-mono-data bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                Fase de Adaptação Ativa
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Como você está na fase de <strong>Adaptação Musculoesquelética</strong> (intercalando trote e caminhada), projetar tempos de Meia Maratona ou Maratona agora seria perigoso e desproporcional. 
              Aqui está sua <strong>Escada Biológica Realista</strong>: conquiste cada degrau para fortalecer articulações e pulmões até a graduação oficial para o VDOT de Jack Daniels!
            </p>
          </div>
        </div>

        <div className="bg-[#050505]/80 p-3.5 rounded-xl border border-emerald-500/30 min-w-[180px] text-center">
          <span className="text-[10px] text-slate-400 font-mono-data block">PRONTIDÃO PARA O VDOT</span>
          <span className="text-2xl font-black font-mono-data text-emerald-400 block mt-0.5">
            {readiness.readinessPercentage}%
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-500" 
              style={{ width: `${readiness.readinessPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Coach Advice Card */}
      <div className="telemetry-card rounded-2xl p-4 border border-white/10 bg-[#121214] flex items-center gap-3">
        <HeartHandshake className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-slate-300">
          <strong className="text-emerald-300">Conselho do Treinador:</strong> {readiness.coachRecommendation}
        </p>
      </div>

      {/* The 4 Milestones Ladder */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase font-mono-data text-slate-400 tracking-wider flex items-center gap-2">
          <span>Degraus Rumo à Corrida Contínua</span>
          <span className="text-xs text-emerald-400 font-bold">• 4 Níveis Progressivos</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone, idx) => {
            const isLast = idx === milestones.length - 1;
            const progress = milestone.completed ? 100 : (idx === 0 ? 50 : (idx === 1 ? 30 : 15));

            return (
              <div
                key={milestone.id}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  milestone.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : isLast
                      ? 'bg-gradient-to-br from-[#121214] via-[#1a140d] to-[#121214] border-amber-500/40 shadow-md'
                      : 'bg-[#0E0E11] border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[10px] font-mono-data uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      {milestone.targetMetric}
                    </span>
                    {milestone.completed ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 font-mono-data">
                        <CheckCircle2 className="w-4 h-4" /> Concluído
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono-data">
                        <Circle className="w-3.5 h-3.5" /> Atual: {milestone.currentMetric}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white font-heading mb-1.5">
                    {milestone.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {milestone.subtitle}
                  </p>
                  {milestone.unlockedVdotBenefit && (
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>{milestone.unlockedVdotBenefit}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[#050505] rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full transition-all duration-300 ${milestone.completed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {isLast && (
                    <div className="mt-3">
                      {!showGraduationForm ? (
                        <button
                          onClick={() => setShowGraduationForm(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs font-heading flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                        >
                          <Flame className="w-4 h-4 fill-black" />
                          <span>Já consigo correr 3km contínuos? Registrar Teste</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-[#0A0A0C] border border-amber-500/30 rounded-xl space-y-3 animate-fadeIn">
                          <span className="text-xs font-bold text-amber-300 block">
                            Tempo total no teste de 3.000m (3 km):
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-400 block mb-0.5">Minutos</label>
                              <input
                                type="number"
                                min="10"
                                max="40"
                                value={testTimeMin}
                                onChange={(e) => setTestTimeMin(e.target.value)}
                                className="w-full bg-[#141416] border border-white/10 rounded-lg p-2 text-white font-mono-data font-bold text-sm text-center"
                              />
                            </div>
                            <span className="text-white font-bold mt-4">:</span>
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-400 block mb-0.5">Segundos</label>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={testTimeSec}
                                onChange={(e) => setTestTimeSec(e.target.value)}
                                className="w-full bg-[#141416] border border-white/10 rounded-lg p-2 text-white font-mono-data font-bold text-sm text-center"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCompleteGraduation}
                              className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-heading cursor-pointer transition-all"
                            >
                              Confirmar & Desbloquear VDOT
                            </button>
                            <button
                              onClick={() => setShowGraduationForm(false)}
                              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
        <p>
          <strong>Importante sobre a fisiologia:</strong> Não tenha pressa em pular etapas. O sistema cardiovascular evolui em semanas, mas tendões e ossos levam de 6 a 12 meses para remodelar densidade contra o impacto do peso corporal. Respeite cada semana do método Run-Walk!
        </p>
      </div>
    </div>
  );
};
