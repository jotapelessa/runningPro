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
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserActivity, ActivityFilter, GoogleSyncState, RunnerState } from '../types';
import { 
  loadGoogleSyncState, 
  saveGoogleSyncState, 
  simulateGoogleFitSync, 
  deduplicateOrMergeActivity 
} from '../lib/activitiesStorage';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ManualActivityModal } from './ManualActivityModal';
import { GoogleConnectModal } from './GoogleConnectModal';
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
  const [syncState, setSyncState] = useState<GoogleSyncState>(() => loadGoogleSyncState());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Auto-sync on component mount if backend has active Google session
  useEffect(() => {
    let isMounted = true;
    async function checkAndAutoSync() {
      try {
        const res = await fetch('/api/fitness/activities');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.sessions) && data.sessions.length > 0 && isMounted) {
            handleSyncGoogle();
          }
        }
      } catch (e) {
        // silent check
      }
    }
    checkAndAutoSync();
    return () => { isMounted = false; };
  }, []);

  // Filters State
  const [filters, setFilters] = useState<ActivityFilter>({
    type: 'all',
    period: 'all',
    source: 'all',
    searchQuery: ''
  });

  // Modal State
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Trigger Google Sync with Deduplication
  const handleSyncGoogle = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const result = await simulateGoogleFitSync(activities);
      onUpdateActivities(result.activities);
      setSyncState(result.syncState);

      if (result.addedCount > 0 || result.mergedCount > 0) {
        setSyncFeedback({
          message: `Sincronização concluída: ${result.addedCount} nova(s) atividade(s) importada(s) e ${result.mergedCount} mesclada(s) sem duplicidades.`,
          type: 'success'
        });
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 }
        });
      } else {
        setSyncFeedback({
          message: 'Tudo atualizado! Nenhuma nova atividade pendente no Google Fit / Health Connect.',
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Error syncing Google APIs:', err);
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
        if (filters.source === 'google_api' && item.source !== 'google_fit' && item.source !== 'health_connect') {
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
      {/* Top Banner & KPI Ribbon */}
      <div className="telemetry-card rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
              <ActivityIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Histórico Centralizado de Atividades Físicas
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Mapeamento de treinos manuais e sincronização com Google Fit, Health Connect e Google Maps
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-xs font-heading shadow-md shadow-[#FF4E00]/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atividade Manual</span>
          </button>
        </div>
      </div>

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

      {/* Google Fit / Health Connect Synchronizer Strip */}
      <div className="telemetry-card rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex-shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white font-heading">
                Google Fit / Google Health Connect API
              </span>
              <span className={`text-[10px] font-mono-data px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                syncState.isConnected
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${syncState.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                {syncState.isConnected ? 'CONECTADO & SEGURO' : 'CONEXÃO DISPONÍVEL'}
              </span>
              {syncState.userEmail && (
                <span className="text-[11px] font-mono-data bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-slate-300">
                  {syncState.userEmail}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Última sincronização: {syncState.lastSync ? new Date(syncState.lastSync).toLocaleString('pt-BR') : 'Nunca sincronizado'} • Deduplicação inteligente de treinos ativada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold font-mono-data border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition-all cursor-pointer whitespace-nowrap"
          >
            {syncState.isConnected ? 'Gerenciar Conta' : 'Conectar Conta Google'}
          </button>

          <button
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono-data uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              isSyncing
                ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Google APIs'}</span>
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
                { id: 'trail', label: 'Trilha' }
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
              <option value="google_api">Apenas Google APIs</option>
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
                      : 'bg-[#FF4E00]/10 border-[#FF4E00]/30 text-[#FF4E00]'
                  }`}>
                    {act.type === 'walk' ? <Compass className="w-5 h-5" /> : <ActivityIcon className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white font-heading group-hover:text-[#FF4E00] transition-colors">
                        {act.title}
                      </h3>
                      <span className={`text-[10px] font-mono-data px-2 py-0.5 rounded-md font-semibold border ${
                        act.source === 'google_fit' || act.source === 'health_connect'
                          ? 'bg-blue-950/60 text-blue-400 border-blue-500/30'
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

                  {/* Open HUD Button */}
                  <div className="flex items-center gap-1">
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
              onClick={handleSyncGoogle}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono-data uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Google Fit</span>
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

      {/* Google Connect OAuth Modal */}
      <GoogleConnectModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        syncState={syncState}
        onUpdateSyncState={(newState) => setSyncState(newState)}
        onSyncActivities={handleSyncGoogle}
      />
    </div>
  );
};
