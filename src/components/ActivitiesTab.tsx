import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity as ActivityIcon, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Calendar, 
  Compass, 
  TrendingUp, 
  Footprints, 
  Clock, 
  Gauge, 
  Heart, 
  Flame, 
  Navigation, 
  Layers, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Zap,
  Globe,
  Award,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UploadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserActivity, ActivityFilter, RunnerState } from '../types';
import { 
  deduplicateOrMergeActivity 
} from '../lib/activitiesStorage';
import { parseUniversalWorkoutFile } from '../lib/workoutParser';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ManualActivityModal } from './ManualActivityModal';
import { formatPace, formatTime } from '../lib/vdotCalculator';

interface ActivitiesTabProps {
  runnerState: RunnerState;
  activities: UserActivity[];
  onUpdateActivities: (activities: UserActivity[]) => void;
  onOpenAthleteModal: () => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  runnerState,
  activities,
  onUpdateActivities,
  onOpenAthleteModal
}) => {
  // Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // File upload state for direct activity GPX / FIT enrichment
  const [uploadingActivityId, setUploadingActivityId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filters & Modal State
  const [filters, setFilters] = useState<ActivityFilter>({
    type: 'all',
    source: 'all',
    period: 'all',
    searchQuery: ''
  });
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Handle direct GPS / FIT upload for an individual activity
  const handleUploadGpsForActivity = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingActivityId) return;

    try {
      const parsed = await parseUniversalWorkoutFile(file);
      
      const updatedList: UserActivity[] = activities.map(act => {
        if (act.id !== uploadingActivityId) return act;

        const newRoute = parsed.routePoints && parsed.routePoints.length >= 2 
          ? parsed.routePoints.map(p => ({
              lat: p.lat,
              lng: p.lng,
              ele: p.ele,
              time: p.time,
              hr: p.hr,
              speed: p.speed
            }))
          : act.route;

        return {
          ...act,
          route: newRoute,
          splits: (parsed.splits as any) || act.splits,
          elevationGainMeters: parsed.elevationGainMeters || act.elevationGainMeters,
          cadenceSpm: parsed.avgCadence ?? act.cadenceSpm,
          avgHr: parsed.avgHR ?? act.avgHr,
          maxHr: parsed.maxHR ?? act.maxHr,
          vdot: parsed.vdot || act.vdot,
          notes: act.notes 
            ? `${act.notes} • GPS anexado: ${file.name}` 
            : `Arquivo GPS anexado: ${file.name}`
        };
      });

      onUpdateActivities(updatedList);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      setSyncFeedback({
        message: `Arquivo "${file.name}" anexado com sucesso à atividade! Rota GPS e métricas atualizadas.`,
        type: 'success'
      });
    } catch (err: any) {
      alert(`Erro ao ler arquivo: ${err.message || err}`);
    } finally {
      setUploadingActivityId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Trigger Intervals.icu Sync
  const handleSyncIntervals = async () => {
    if (!runnerState.intervalsApiKey) {
      setSyncFeedback({
        message: 'Por favor, configure sua API Key do Intervals.icu no painel do Atleta primeiro.',
        type: 'info'
      });
      setTimeout(() => setSyncFeedback(null), 5000);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const { fetchIntervalsActivities, mapIntervalsToUserActivity } = await import('../lib/intervalsIcu');
      
      // O Intervals.icu espera datas locais no formato YYYY-MM-DDTHH:MM:SS ou apenas YYYY-MM-DD
      // Evitamos o 'Z' do toISOString() para não causar problemas de fuso horário que escondem treinos recentes
      const now = new Date();
      
      const newestDate = new Date(now);
      newestDate.setDate(newestDate.getDate() + 1);
      
      const oldestDate = new Date(now);
      oldestDate.setDate(oldestDate.getDate() - 30);

      // Usando formato de string local ajustada para YYYY-MM-DD
      const formatLocalISO = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}T23:59:59`; // Intervals aceita sem 'Z' como hora local do atleta
      };

      const newest = formatLocalISO(newestDate);
      
      // Para o oldest, a hora inicial do dia
      const oldest = `${oldestDate.getFullYear()}-${String(oldestDate.getMonth() + 1).padStart(2, '0')}-${String(oldestDate.getDate()).padStart(2, '0')}T00:00:00`;

      const intervalsActivities = await fetchIntervalsActivities(
        runnerState.intervalsAthleteId || '', 
        runnerState.intervalsApiKey, 
        oldest, 
        newest
      );

      let addedCount = 0;
      let mergedCount = 0;
      let currentList = [...activities];

      for (const act of intervalsActivities) {
        const mapped = mapIntervalsToUserActivity(act);
        const res = deduplicateOrMergeActivity(currentList, mapped);
        if (res.action === 'merged') {
          mergedCount++;
        } else if (res.action === 'inserted') {
          addedCount++;
        }
        currentList = res.updatedList;
      }

      onUpdateActivities(currentList);

      if (addedCount > 0 || mergedCount > 0) {
        setSyncFeedback({
          message: `Sincronização concluída: ${addedCount} nova(s) atividade(s) do Intervals.icu e ${mergedCount} mesclada(s).`,
          type: 'success'
        });
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 }
        });
      } else {
        setSyncFeedback({
          message: 'Tudo atualizado! Nenhuma nova atividade pendente no Intervals.icu.',
          type: 'info'
        });
      }

    } catch (err: any) {
      console.error('Error syncing Intervals.icu:', err);
      setSyncFeedback({
        message: err.message || 'Erro ao sincronizar com Intervals.icu.',
        type: 'info' // Using info style for error to match existing toast styles
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Save manual activity
  const handleSaveManualActivity = (newAct: UserActivity) => {
    const res = deduplicateOrMergeActivity(activities, newAct);
    onUpdateActivities(res.updatedList);
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 }
    });
  };

  // Delete activity
  const handleDeleteActivity = (id: string) => {
    const next = activities.filter(a => a.id !== id);
    onUpdateActivities(next);
  };

  // Filter and sort activities (chronological: newest first)
  const filteredActivities = useMemo(() => {
    const now = Date.now();
    return activities
      .filter(item => {
        // Type filter
        if (filters.type !== 'all' && item.type !== filters.type) {
          return false;
        }

        // Source filter
        if (filters.source === 'manual' && item.source !== 'manual') {
          return false;
        }

        // Period filter
        if (filters.period !== 'all') {
          const itemTime = new Date(item.date).getTime();
          if (filters.period === 'week') {
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (now - itemTime > oneWeek) return false;
          } else if (filters.period === 'month') {
            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            if (now - itemTime > oneMonth) return false;
          } else if (filters.period === 'year') {
            const oneYear = 365 * 24 * 60 * 60 * 1000;
            if (now - itemTime > oneYear) return false;
          }
        }

        // Search query filter
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          const matchSource = item.sourceLabel?.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchSource) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, filters]);

  // Aggregate stats across all activities
  const stats = useMemo(() => {
    const totalCount = activities.length;
    const totalDistKm = activities.reduce((acc, a) => acc + a.distanceKm, 0);
    const totalSec = activities.reduce((acc, a) => acc + a.durationSeconds, 0);
    const totalCalories = activities.reduce((acc, a) => acc + (a.calories || 0), 0);
    const avgPaceSec = totalDistKm > 0 ? Math.round(totalSec / totalDistKm) : 0;

    return {
      totalCount,
      totalDistKm: Math.round(totalDistKm * 10) / 10,
      totalHours: Math.floor(totalSec / 3600),
      totalMinutes: Math.floor((totalSec % 3600) / 60),
      totalCalories,
      avgPaceFormatted: avgPaceSec > 0 ? formatPace(avgPaceSec) : '--:--'
    };
  }, [activities]);

  return (
    <div className="space-y-6 animate-fadeIn">


      {/* Aggregate KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-data">
        <div className="telemetry-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Navigation className="w-3 h-3 text-[#FF4E00]" />
            <span>VOLUME TOTAL</span>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalDistKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>TEMPO EM MOVIMENTO</span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats.totalHours}h {stats.totalMinutes}m
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Gauge className="w-3 h-3 text-emerald-400" />
            <span>PACE MÉDIO GLOBAL</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.avgPaceFormatted} <span className="text-xs font-normal text-slate-400">/km</span>
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>CALORIAS TOTAIS</span>
          </div>
          <div className="text-2xl font-black text-orange-400">
            {stats.totalCalories.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span>
          </div>
        </div>
      </div>

      {/* Intervals.icu Synchronizer Strip */}
      <div className="telemetry-card rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 text-[#FF4E00] flex-shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white font-heading">
                Integração Automática com Intervals.icu
              </span>
              <span className={`text-[10px] font-mono-data px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                runnerState.intervalsApiKey
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-950/80 text-slate-400 border border-slate-700/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${runnerState.intervalsApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {runnerState.intervalsApiKey ? 'CONECTADO & SEGURO' : 'AGUARDANDO CONFIGURAÇÃO'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sincroniza Strava, Garmin, Coros, Zepp via Intervals.icu • Deduplicação inteligente de treinos ativada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {!runnerState.intervalsApiKey && (
            <button
              type="button"
              onClick={onOpenAthleteModal}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold font-mono-data border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition-all cursor-pointer whitespace-nowrap"
            >
              Configurar Intervals.icu
            </button>
          )}

          <button
            onClick={handleSyncIntervals}
            disabled={isSyncing || !runnerState.intervalsApiKey}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono-data uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              isSyncing || !runnerState.intervalsApiKey
                ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                : 'bg-[#FF4E00] hover:bg-[#E03E00] text-white shadow-md shadow-[#FF4E00]/25'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Intervals</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs animate-fadeIn ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            : 'bg-blue-950/60 border-blue-500/40 text-blue-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="telemetry-card rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Buscar por título ou observação..."
              className="w-full bg-[#121214] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4E00]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Type selector */}
            <div className="flex items-center gap-1 bg-[#121214] border border-white/10 p-1 rounded-xl">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'run', label: 'Corridas' },
                { id: 'walk', label: 'Caminhadas' },
                { id: 'trail', label: 'Trilha' },
                { id: 'other', label: 'Treino Geral' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilters(prev => ({ ...prev, type: t.id as any }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-data transition-all cursor-pointer ${
                    filters.type === t.id
                      ? 'bg-[#FF4E00] text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Period Dropdown */}
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
              className="bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono-data text-[11px]"
            >
              <option value="all">Todo o Período</option>
              <option value="week">Últimos 7 Dias</option>
              <option value="month">Últimos 30 Dias</option>
              <option value="year">Este Ano</option>
            </select>

            {/* Source Dropdown */}
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value as any }))}
              className="bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-white font-mono-data text-[11px]"
            >
              <option value="all">Todas as Origens</option>
              <option value="manual">Apenas Manuais</option>
              <option value="intervals">Apenas Intervals.icu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Cards Chronological List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-3">
          {filteredActivities.map((act) => {
            const hasGps = act.route && act.route.length >= 2;
            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className="telemetry-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-[#FF4E00]/50 transition-all cursor-pointer group shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Side: Type Icon, Title, Date, Source */}
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl border flex-shrink-0 transition-transform group-hover:scale-105 ${
                    act.type === 'walk'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                      : act.type === 'other'
                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-400'
                      : 'bg-[#FF4E00]/10 border-[#FF4E00]/30 text-[#FF4E00]'
                  }`}>
                    {act.type === 'walk' ? (
                      <Compass className="w-5 h-5" />
                    ) : act.type === 'other' ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <ActivityIcon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white font-heading group-hover:text-[#FF4E00] transition-colors">
                        {act.title}
                      </h3>
                      <span className={`text-[10px] font-mono-data px-2 py-0.5 rounded-md font-semibold border ${
                        act.source === 'intervals'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                      }`}>
                        {act.sourceLabel || act.source}
                      </span>
                      {hasGps && (
                        <span className="text-[10px] font-mono-data bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                          <Navigation className="w-2.5 h-2.5" />
                          ROTA GPS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-data">
                      <span>{new Date(act.date).toLocaleDateString('pt-BR')} às {new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {act.shoeName && <span>• 👟 {act.shoeName}</span>}
                    </div>

                    {act.notes && (
                      <p className="text-xs text-slate-300 line-clamp-1 italic">
                        "{act.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Key Telemetry Grid & Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-white/5 font-mono-data">
                  {/* Distance */}
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">DISTÂNCIA</span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {act.distanceKm.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">DURAÇÃO</span>
                    <span className="text-base sm:text-lg font-bold text-amber-400">
                      {act.durationFormatted}
                    </span>
                  </div>

                  {/* Pace */}
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">PACE MÉDIO</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-400">
                      {act.paceFormatted} <span className="text-xs font-normal text-slate-400">/km</span>
                    </span>
                  </div>

                  {/* Open HUD & Upload Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadingActivityId(act.id);
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/40 text-[11px] font-bold font-sans transition-all cursor-pointer"
                      title="Anexar arquivo .GPX, .FIT ou .TCX para enriquecer com rota e parciais"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Anexar GPS</span>
                    </button>

                    <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#121214] group-hover:bg-[#FF4E00] text-slate-300 group-hover:text-white text-xs font-bold font-sans transition-all">
                      Abrir HUD
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="telemetry-card rounded-2xl p-10 border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
            <ActivityIcon className="w-8 h-8 text-[#FF4E00]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-heading">
              Nenhuma Atividade Encontrada
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Não há treinos que correspondam aos filtros selecionados. Registre um treino manual ou sincronize com as APIs do Google.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-xs font-heading transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Atividade Manual</span>
            </button>
            <button
              onClick={handleSyncIntervals}
              className="px-4 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-xs font-mono-data uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Intervals.icu</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        allActivities={activities}
        onDeleteActivity={handleDeleteActivity}
        athleteName={runnerState.name || 'Atleta PaceLab'}
      />

      <ManualActivityModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSaveActivity={handleSaveManualActivity}
        availableShoes={runnerState.shoes || []}
      />

      {/* Hidden file input for direct activity GPX/FIT upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadGpsForActivity}
        accept=".gpx,.fit,.tcx"
        className="hidden"
      />
    </div>
  );
};
