import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Share2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Heart, 
  Flame, 
  Gauge, 
  Layers, 
  Sparkles, 
  Zap,
  Activity as ActivityIcon,
  Award,
  Footprints,
  Info,
  Instagram
} from 'lucide-react';
import { UserActivity } from '../types';
import { ActivityHudMap } from './ActivityHudMap';
import { StoryStudioModal } from './StoryStudioModal';
import { formatPace, formatTime } from '../lib/vdotCalculator';

interface ActivityDetailModalProps {
  activity: UserActivity | null;
  onClose: () => void;
  allActivities: UserActivity[];
  onDeleteActivity?: (id: string) => void;
  athleteName?: string;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  onClose,
  allActivities,
  onDeleteActivity,
  athleteName = 'Atleta PaceLab'
}) => {
  const [isStoryStudioOpen, setIsStoryStudioOpen] = useState(false);

  if (!activity) return null;

  // Calculate 7-day and 30-day user averages for comparison
  const now = new Date(activity.date).getTime();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  const activities7d = allActivities.filter(a => {
    const t = new Date(a.date).getTime();
    return t >= sevenDaysAgo && t <= now && a.type === activity.type;
  });

  const activities30d = allActivities.filter(a => {
    const t = new Date(a.date).getTime();
    return t >= thirtyDaysAgo && t <= now && a.type === activity.type;
  });

  const avgDistance7d = activities7d.length > 0
    ? activities7d.reduce((acc, a) => acc + a.distanceKm, 0) / activities7d.length
    : activity.distanceKm;

  const avgPace7dSec = activities7d.length > 0
    ? activities7d.reduce((acc, a) => acc + a.paceSecondsPerKm, 0) / activities7d.length
    : activity.paceSecondsPerKm;

  const avgDistance30d = activities30d.length > 0
    ? activities30d.reduce((acc, a) => acc + a.distanceKm, 0) / activities30d.length
    : activity.distanceKm;

  const avgPace30dSec = activities30d.length > 0
    ? activities30d.reduce((acc, a) => acc + a.paceSecondsPerKm, 0) / activities30d.length
    : activity.paceSecondsPerKm;

  const diffPace7d = Math.round(avgPace7dSec - activity.paceSecondsPerKm);
  const diffDist7d = Math.round((activity.distanceKm - avgDistance7d) * 10) / 10;

  const diffPace30d = Math.round(avgPace30dSec - activity.paceSecondsPerKm);
  const diffDist30d = Math.round((activity.distanceKm - avgDistance30d) * 10) / 10;

  const splits = activity.splits || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#0e0e11] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#121216] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF4E00]/20 border border-[#FF4E00]/40 text-[#FF4E00]">
              <ActivityIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading truncate max-w-md">
                HUD de Telemetria • {activity.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-data">
                <span>{new Date(activity.date).toLocaleDateString('pt-BR')} às {new Date(activity.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span className="text-[#FF4E00]">{activity.sourceLabel || activity.source}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStoryStudioOpen(true)}
              className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
              title="Gerar arte 9:16 para Instagram Stories"
            >
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">Gerar Story (9:16)</span>
            </button>

            {onDeleteActivity && (
              <button
                onClick={() => {
                  if (confirm('Deseja realmente remover esta atividade do histórico?')) {
                    onDeleteActivity(activity.id);
                    onClose();
                  }
                }}
                title="Excluir Atividade"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-white/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Fechar"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Map & Overlaid HUD */}
          <ActivityHudMap activity={activity} />

          {/* VDOT & Efficiency Rating Strip */}
          {activity.vdot && activity.vdot > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#18110D] via-[#121214] to-[#18110D] border border-[#FF4E00]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FF4E00]/20 text-[#FF4E00]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-data uppercase text-slate-400">PONTUAÇÃO FISIOLÓGICA VDOT:</span>
                    <span className="text-lg font-black font-mono-data text-[#FF4E00]">{activity.vdot.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    O desempenho deste treino reflete uma capacidade aeróbia equivalente a uma prova de 10k em {formatTime(Math.round(2700 * (45 / activity.vdot)))}.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono-data text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold">
                  EFICIÊNCIA CALCULADA
                </span>
              </div>
            </div>
          )}

          {/* Comparison vs 7-Day and 30-Day Baselines */}
          <div className="telemetry-card rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-white font-heading font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-[#FF4E00]" />
              <span>Comparativo com as Médias do Próprio Usuário</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-data">
              {/* 7 Days Comparison */}
              <div className="bg-[#121214] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="uppercase text-[10px] font-bold">MÉDIA DOS ÚLTIMOS 7 DIAS</span>
                  <span className="text-slate-300">{activities7d.length} treinos</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Distância Média: <strong>{avgDistance7d.toFixed(1)} km</strong></span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    diffDist7d >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {diffDist7d >= 0 ? `+${diffDist7d} km` : `${diffDist7d} km`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Pace Médio: <strong>{formatPace(avgPace7dSec)}/km</strong></span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    diffPace7d >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {diffPace7d >= 0 ? `${diffPace7d}s mais rápido` : `${Math.abs(diffPace7d)}s mais suave`}
                  </span>
                </div>
              </div>

              {/* 30 Days Comparison */}
              <div className="bg-[#121214] p-3.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="uppercase text-[10px] font-bold">MÉDIA DOS ÚLTIMOS 30 DIAS</span>
                  <span className="text-slate-300">{activities30d.length} treinos</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Distância Média: <strong>{avgDistance30d.toFixed(1)} km</strong></span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    diffDist30d >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {diffDist30d >= 0 ? `+${diffDist30d} km` : `${diffDist30d} km`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Pace Médio: <strong>{formatPace(avgPace30dSec)}/km</strong></span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    diffPace30d >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {diffPace30d >= 0 ? `${diffPace30d}s mais rápido` : `${Math.abs(diffPace30d)}s mais suave`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Splits (Parciais Km a Km) Table */}
          {splits.length > 0 && (
            <div className="telemetry-card rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-heading font-bold text-sm">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>Parciais Quilômetro a Quilômetro (Splits)</span>
                </div>
                <span className="text-xs font-mono-data text-slate-400">
                  {splits.length} Parciais Registradas
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#050505]">
                <table className="w-full text-left text-xs font-mono-data border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#121214] text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">KM</th>
                      <th className="py-2.5 px-3">PACE DO KM</th>
                      <th className="py-2.5 px-3">DURAÇÃO</th>
                      <th className="py-2.5 px-3">FC MÉDIA</th>
                      <th className="py-2.5 px-3">ELEVAÇÃO</th>
                      <th className="py-2.5 px-3 font-sans">PROGRESSÃO VISUAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {splits.map((s) => {
                      const paceRatio = Math.max(0.3, Math.min(1.0, 300 / s.paceSeconds));
                      return (
                        <tr key={s.km} className="hover:bg-white/[0.02] text-slate-300">
                          <td className="py-2.5 px-3 font-bold text-white font-sans">KM {s.km}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">{s.paceFormatted}/km</td>
                          <td className="py-2.5 px-3 text-slate-300">{formatTime(s.durationSeconds)}</td>
                          <td className="py-2.5 px-3 text-rose-400">{s.avgHr ? `${s.avgHr} bpm` : '--'}</td>
                          <td className="py-2.5 px-3 text-cyan-400">{s.elevationDiffM ? `+${s.elevationDiffM}m` : '0m'}</td>
                          <td className="py-2.5 px-3 w-40">
                            <div className="w-full bg-[#121214] h-2 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-[#FF4E00] h-full rounded-full"
                                style={{ width: `${Math.round(paceRatio * 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Call to Action for Instagram Stories */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-purple-950/40 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/50">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Compartilhar Treino no Instagram Stories
                </h4>
                <p className="text-xs text-slate-400">
                  Gere imagem estática ou vídeo animado 9:16 (1080×1920) com traçado progressivo da rota e telemetria.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsStoryStudioOpen(true)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Gerador de Stories (9:16)</span>
            </button>
          </div>
        </div>

        {/* Story Studio Modal */}
        <StoryStudioModal
          isOpen={isStoryStudioOpen}
          onClose={() => setIsStoryStudioOpen(false)}
          activity={activity}
          athleteName={athleteName}
        />
      </div>
    </div>
  );
};
