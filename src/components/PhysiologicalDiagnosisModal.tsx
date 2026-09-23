import React from 'react';
import { 
  X, 
  Sparkles, 
  Activity, 
  Flame, 
  Trophy, 
  CalendarCheck, 
  Gauge, 
  Heart, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { ParsedWorkout, RunnerState, AppTab } from '../types';
import { 
  calculateTrainingPaces, 
  calculateHeartRateZones, 
  generateRacePredictions,
  formatPace,
  formatTime 
} from '../lib/vdotCalculator';

interface PhysiologicalDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: ParsedWorkout;
  runnerState: RunnerState;
  onNavigateTab: (tab: AppTab) => void;
}

export const PhysiologicalDiagnosisModal: React.FC<PhysiologicalDiagnosisModalProps> = ({
  isOpen,
  onClose,
  workout,
  runnerState,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const vdot = workout.vdot || runnerState.currentVdot || 45.0;
  const maxHr = workout.maxHR || runnerState.macHR || runnerState.maxHr || 188;
  const restingHr = runnerState.restHR || runnerState.restingHr || 55;

  const paces = calculateTrainingPaces(vdot, maxHr, restingHr);
  const hrZones = calculateHeartRateZones(maxHr, restingHr);
  const predictions = generateRacePredictions(vdot);

  // Determine athlete level based on Jack Daniels VDOT
  const getAthleteClassification = (v: number) => {
    if (v < 35) return { label: 'Iniciante / Adaptação Aeróbica', color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/30' };
    if (v < 45) return { label: 'Intermediário (Base Sólida)', color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30' };
    if (v < 55) return { label: 'Avançado (Performance Competitiva)', color: 'text-[#FF4E00]', badge: 'bg-[#FF4E00]/10 border-[#FF4E00]/30' };
    if (v < 65) return { label: 'Sub-Elite / Regional', color: 'text-purple-400', badge: 'bg-purple-500/10 border-purple-500/30' };
    return { label: 'Elite / Alto Rendimento Nacional', color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30' };
  };

  const levelInfo = getAthleteClassification(vdot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="modal-physiological-diagnosis"
        className="relative w-full max-w-3xl bg-[#0A0A0A] border border-[#FF4E00]/40 rounded-2xl shadow-2xl shadow-black overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A0E08] via-[#0A0A0A] to-[#1A0E08] border-b border-[#FF4E00]/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] shadow-lg shadow-[#FF4E00]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
                  Diagnóstico da Condição Física Atual
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded font-mono-data flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  CALIBRADO VIA GPX
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono-data">
                Arquivo: <span className="text-slate-200">{workout.fileName}</span> ({workout.distanceKm.toFixed(2)}km em {workout.durationFormatted})
              </p>
            </div>
          </div>

          <button
            id="btn-close-diagnosis-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Hero: VDOT & VO2max card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#18110D] to-[#0A0A0A] p-4 rounded-xl border border-[#FF4E00]/30 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono-data flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#FF4E00]" />
                Jack Daniels VDOT
              </div>
              <div className="text-3xl font-black text-[#FF4E00] font-heading">
                {vdot.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-400">
                Índice de eficiência biomecânica e potência aeróbia
              </div>
            </div>

            <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono-data flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                VO2máx Estimado
              </div>
              <div className="text-3xl font-black text-cyan-400 font-heading">
                {vdot.toFixed(1)} <span className="text-xs font-normal text-slate-400">ml/kg/min</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Capacidade cardiorrespiratória máxima
              </div>
            </div>

            <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono-data flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Classificação Atlética
              </div>
              <div className={`text-sm sm:text-base font-bold font-heading ${levelInfo.color} pt-1`}>
                {levelInfo.label}
              </div>
              <div className="text-[10px] text-slate-400">
                {workout.avgHR ? `FC Média: ${workout.avgHR} bpm • Max: ${workout.maxHR || maxHr} bpm` : 'Padrão fisiológico calibrado'}
              </div>
            </div>
          </div>

          {/* Section 1: Ritmos de Treino Jack Daniels Calibrados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono-data">
                <Gauge className="w-4 h-4 text-[#FF4E00]" />
                Seus Novos Ritmos de Treino Jack Daniels
              </h4>
              <span className="text-[11px] text-slate-400">Paces exatos calculados</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {paces.map((p) => (
                <div 
                  key={p.key}
                  className="bg-[#121214] p-3 rounded-xl border border-white/10 hover:border-white/20 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-black font-mono-data text-black"
                      style={{ backgroundColor: p.accentColor }}
                    >
                      Pace {p.key}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[70px]">
                      {p.name.split('/')[0]}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white font-mono-data">
                    {p.formattedPaceKm}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {p.subname}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Previsões de Tempo em Prova */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono-data">
                <Trophy className="w-4 h-4 text-amber-400" />
                Previsões Científicas de Prova com seu VDOT {vdot.toFixed(1)}
              </h4>
              <span className="text-[11px] text-slate-400">Fórmula de Daniels & Gilbert</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {predictions.filter(pr => ['5k', '10k', 'half_marathon', 'marathon'].includes(pr.distanceId)).map((pred) => (
                <div key={pred.distanceId} className="bg-[#121214] p-3.5 rounded-xl border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-slate-300 font-heading">
                    {pred.name.split(' ')[0]}
                  </div>
                  <div className="text-xl font-extrabold text-[#FF4E00] font-mono-data">
                    {pred.formattedTime}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono-data">
                    Pace: {pred.formattedPaceKm}/km
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Zonas Cardíacas Karvonen */}
          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono-data">
              <Heart className="w-4 h-4 text-rose-500" />
              Zonas de Frequência Cardíaca Karvonen (HRR)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              {hrZones.map((z) => (
                <div key={z.zone} className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="font-bold flex items-center gap-1.5" style={{ color: z.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }}></span>
                    Z{z.zone}
                  </div>
                  <div className="text-sm font-bold text-white font-mono-data">
                    {z.bpmMin} - {z.bpmMax} <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {z.name.split('—')[1]?.trim() || z.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Planilha Atualizada Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#1A1410] to-[#121214] border border-[#FF4E00]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] flex-shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Planilha de 8 Semanas Atualizada Automaticamente</div>
                <div className="text-slate-400">Todos os treinos de rodagem, limiar e tiros foram ajustados para suas novas parciais.</div>
              </div>
            </div>

            <button
              id="btn-goto-planilha-from-diagnosis"
              onClick={() => {
                onClose();
                onNavigateTab('planilha');
              }}
              className="px-4 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shadow-md shadow-[#FF4E00]/20"
            >
              <span>Ver Minha Planilha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#121214] border-t border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF4E00]" />
            Dados fisiológicos salvos com sucesso no seu perfil local.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-goto-zonas-from-diagnosis"
              onClick={() => {
                onClose();
                onNavigateTab('zonas');
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5 text-[#FF4E00]" />
              Ver Tabela de Zonas
            </button>

            <button
              id="btn-confirm-diagnosis-close"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#FF4E00]/25"
            >
              Concluir & Explorar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
