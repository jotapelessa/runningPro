import React, { useState, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Circle, 
  ShieldCheck, 
  Flame, 
  HeartHandshake, 
  Clock, 
  Sparkles, 
  Info, 
  CalendarCheck,
  Watch,
  UploadCloud,
  Check,
  Activity,
  Globe,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CalendarSessionEvent, RunnerState, ParsedWorkout, UserActivity } from '../types';
import { RUN_WALK_SCHEDULE } from '../lib/runWalkEngine';
import { parseUniversalWorkoutFile } from '../lib/workoutParser';
import { loadUserActivities } from '../lib/activitiesStorage';

interface AdaptationCalendarProps {
  runnerState: RunnerState;
  onStartLiveSession: (weekNum: number) => void;
  onUpdateRunnerState?: (fields: Partial<RunnerState>) => void;
  onUploadWorkout?: (workout: ParsedWorkout) => void;
  activities?: UserActivity[];
  onUpdateActivities?: (activities: UserActivity[]) => void;
}

export const AdaptationCalendar: React.FC<AdaptationCalendarProps> = ({
  runnerState,
  onStartLiveSession,
  onUpdateRunnerState,
  onUploadWorkout,
  activities,
  onUpdateActivities
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Current calendar view date state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calculate days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Completed sessions cache from LocalStorage or state
  const [completedDates, setCompletedDates] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('pacelab_completed_calendar_dates');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleToggleDateComplete = (dateStr: string) => {
    const updated = { ...completedDates, [dateStr]: !completedDates[dateStr] };
    setCompletedDates(updated);
    try {
      localStorage.setItem('pacelab_completed_calendar_dates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Navigation handlers for week and month
  const handlePrev = () => {
    if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  // Helper to get 7 days of the currently focused week
  const weekDays = React.useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 is Sunday
    // Start week on Monday (1) or Sunday (0). Let's start Monday:
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, '0');
      const dt = String(day.getDate()).padStart(2, '0');
      return {
        dateObj: day,
        dateStr: `${y}-${m}-${dt}`,
        dayNum: day.getDate(),
        dayOfWeekIndex: day.getDay(),
        monthName: monthNames[day.getMonth()]
      };
    });
  }, [currentDate]);

  // Dias ativos configuráveis pelo atleta (dom=0, seg=1, ter=2, qua=3, qui=4, sex=5, sab=6)
  // Padrão do usuário: Segunda(1), Quarta(3), Sexta(5) OU o que vier em runnerState.preferredDaysOfWeek
  const activeDaysOfWeek: number[] = runnerState.preferredDaysOfWeek && runnerState.preferredDaysOfWeek.length > 0
    ? runnerState.preferredDaysOfWeek.map(d => (d + 1) % 7) // converte de convenção Seg=0 para Date.getDay() (Dom=0, Seg=1...)
    : [1, 3, 5]; // Default: Segunda(1), Quarta(3), Sexta(5)

  const handleTogglePreferredDay = (jsDayOfWeek: number) => {
    // jsDayOfWeek: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    let nextJsDays: number[];
    if (activeDaysOfWeek.includes(jsDayOfWeek)) {
      if (activeDaysOfWeek.length <= 1) return; // Mínimo 1 dia
      nextJsDays = activeDaysOfWeek.filter(d => d !== jsDayOfWeek);
    } else {
      nextJsDays = [...activeDaysOfWeek, jsDayOfWeek].sort();
    }
    // Converte de volta para 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sáb, 6=Dom
    const appDays = nextJsDays.map(d => (d === 0 ? 6 : d - 1));
    if (onUpdateRunnerState) {
      onUpdateRunnerState({
        preferredDaysOfWeek: appDays,
        trainingDays: appDays.length
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadFeedback(null);
    try {
      const parsed = await parseUniversalWorkoutFile(file);
      // Auto-mark date of workout as completed
      const activityDateStr = parsed.date ? parsed.date.split('T')[0] : selectedDateStr;
      handleToggleDateComplete(activityDateStr);

      if (onUploadWorkout) {
        onUploadWorkout(parsed);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setUploadFeedback(`✅ Arquivo "${file.name}" importado com sucesso! Distância: ${parsed.distanceKm} km • Duração: ${parsed.durationFormatted} • Pace: ${parsed.paceFormatted}/km`);
    } catch (err: any) {
      setUploadFeedback(`❌ Erro ao ler arquivo do smartwatch: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper to determine session type for any date based on activeDaysOfWeek
  const getSessionForDate = (dStr: string) => {
    const d = new Date(dStr + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0 is Dom, 1 is Seg, 3 is Qua, 5 is Sex
    const isWorkoutDay = activeDaysOfWeek.includes(dayOfWeek);

    // Week schedule mapping
    const weekNum = Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
    const schedule = RUN_WALK_SCHEDULE[weekNum - 1] || RUN_WALK_SCHEDULE[0];

    if (isWorkoutDay) {
      return {
        isWorkout: true,
        weekNum,
        title: `Caminha-Corre (${schedule.interval.runDurationSec}s Trote / ${schedule.interval.walkDurationSec}s Andar)`,
        duration: `${schedule.totalDurationMin} min`,
        badge: 'Treino de Adaptação',
        focus: schedule.focus,
        cues: schedule.interval.cues
      };
    } else {
      return {
        isWorkout: false,
        weekNum,
        title: dayOfWeek === 0 ? 'Descanso Pleno de Cartilagens' : 'Recuperação & Mobilidade de Fáscias',
        duration: '15 min livre',
        badge: 'Proteção Articular',
        focus: 'Alongamento suave de panturrilhas, hidratação e repouso ativo para remodelagem óssea e tendínea.',
        cues: null
      };
    }
  };

  const selectedSession = getSessionForDate(selectedDateStr);
  const isSelectedCompleted = completedDates[selectedDateStr] || false;

  return (
    <div className="telemetry-card rounded-2xl p-5 sm:p-6 border border-white/10 space-y-6">
      
      {/* Header with Title, View Toggle and Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono-data mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Calendário Oficial de Adaptação Musculoesquelética</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
            {viewMode === 'week' 
              ? `Semana de ${weekDays[0].dayNum} a ${weekDays[6].dayNum} de ${weekDays[0].monthName} ${year}` 
              : `${monthNames[month]} ${year}`}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dias de estímulo alternados intercalados com proteção de cartilagens e fáscias musculares.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* View Mode Toggle: Semana vs Mês */}
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl mr-1">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono-data transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono-data transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês
            </button>
          </div>

          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title={viewMode === 'week' ? 'Semana Anterior' : 'Mês Anterior'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDateStr(new Date().toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 font-mono-data transition-colors cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title={viewMode === 'week' ? 'Próxima Semana' : 'Próximo Mês'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Preferred Days of Week Selector */}
      <div className="p-4 rounded-xl bg-[#0B0F0D] border border-emerald-500/25 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-emerald-300 font-heading flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Configurar Seus Dias de Treino da Semana:
          </span>
          <p className="text-[11px] text-slate-400">
            Clique para marcar os dias em que você treina (ex: <strong>Segunda, Quarta e Sexta</strong>). Os demais dias serão protegidos para descanso articular.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { jsDay: 1, label: 'Seg' },
            { jsDay: 2, label: 'Ter' },
            { jsDay: 3, label: 'Qua' },
            { jsDay: 4, label: 'Qui' },
            { jsDay: 5, label: 'Sex' },
            { jsDay: 6, label: 'Sáb' },
            { jsDay: 0, label: 'Dom' },
          ].map(({ jsDay, label }) => {
            const isSelected = activeDaysOfWeek.includes(jsDay);
            return (
              <button
                key={jsDay}
                type="button"
                onClick={() => handleTogglePreferredDay(jsDay)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono-data transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Alternar ${label} como dia de treino`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN GRID: WEEK VIEW (Default) OR MONTH VIEW */}
      {viewMode === 'week' ? (
        /* VISÃO SEMANAL DE 7 DIAS */
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
            {weekDays.map((day) => {
              const dateStr = day.dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const isSelected = selectedDateStr === dateStr;
              const session = getSessionForDate(dateStr);
              const isDone = completedDates[dateStr] || false;
              const dayName = daysOfWeek[day.dayOfWeekIndex];

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer min-h-[110px] ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                      : isToday
                      ? 'border-[#FF4E00]/60 bg-[#FF4E00]/10'
                      : session.isWorkout
                      ? 'border-white/10 bg-[#0E1512] hover:border-emerald-500/40'
                      : 'border-white/5 bg-[#0A0A0A] hover:border-white/20 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold font-mono-data text-slate-400 block">
                        {dayName}
                      </span>
                      <span className={`text-base font-black font-mono-data ${
                        isToday ? 'text-[#FF4E00]' : isSelected ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {day.dayNum}
                      </span>
                    </div>

                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : session.isWorkout ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    ) : (
                      <span className="text-[10px] text-slate-600 font-mono-data">OFF</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    {session.isWorkout ? (
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-emerald-400 truncate block font-heading">
                          🏃 {session.duration}
                        </span>
                        <span className="text-[9px] text-slate-400 line-clamp-1">
                          {session.badge}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-slate-500 truncate block">
                          🛡️ Descanso
                        </span>
                        <span className="text-[9px] text-slate-600 line-clamp-1">
                          Proteção Articular
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISÃO MENSAL */
        <div>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold font-mono-data text-slate-400">
            {daysOfWeek.map((dow, idx) => (
              <div key={idx} className={`py-1.5 ${idx === 0 || idx === 6 ? 'text-slate-500' : 'text-slate-300'}`}>
                {dow}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-white/[0.01] border border-transparent" />
            ))}

            {/* Actual days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const isSelected = selectedDateStr === dateStr;
              const session = getSessionForDate(dateStr);
              const isDone = completedDates[dateStr] || false;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/30 shadow-md shadow-emerald-500/20'
                      : isToday
                      ? 'border-[#FF4E00]/60 bg-[#FF4E00]/5'
                      : 'border-white/5 bg-[#0A0A0A] hover:border-white/20 hover:bg-[#121214]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono-data ${
                      isToday ? 'text-[#FF4E00]' : isSelected ? 'text-emerald-300' : 'text-slate-300'
                    }`}>
                      {dayNum}
                    </span>

                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : session.isWorkout ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    ) : null}
                  </div>

                  {/* Day content badge */}
                  <div className="truncate">
                    {session.isWorkout ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 truncate block font-heading">
                        🏃 {session.duration}
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] text-slate-500 truncate block">
                        🛡️ Descanso
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Action Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0E1A14] via-[#0A0A0A] to-[#121214] border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-data uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {selectedDateStr} • {selectedSession.badge}
            </span>
            {isSelectedCompleted && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </span>
            )}
          </div>

          <h4 className="text-base sm:text-lg font-bold text-white font-heading">
            {selectedSession.title}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedSession.focus}
          </p>

          {selectedSession.cues && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Trote:</span> {selectedSession.cues.runText}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-shrink-0">
          {/* Smartwatch direct upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,.tcx,.fit"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-white/10 bg-[#16161a] hover:bg-[#1f1f24] text-slate-200 hover:text-white text-xs font-bold font-mono-data transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            title="Importar treino do Amazfit T-Rex, Garmin, Strava ou Polar (.gpx, .tcx, .fit)"
          >
            <Watch className="w-4 h-4 text-emerald-400" />
            <span>{isUploading ? 'Processando...' : 'Subir Treino Amazfit (.GPX/.FIT)'}</span>
          </button>

          <button
            onClick={() => handleToggleDateComplete(selectedDateStr)}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl border text-xs font-bold font-mono-data transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isSelectedCompleted
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isSelectedCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
            <span>{isSelectedCompleted ? 'Concluído' : 'Marcar Feito'}</span>
          </button>

          {selectedSession.isWorkout && (
            <button
              onClick={() => onStartLiveSession(selectedSession.weekNum)}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-heading flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Iniciar com Áudio</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Feedback Toast / Card */}
      {uploadFeedback && (
        <div className={`p-3.5 rounded-xl text-xs font-mono-data border animate-fadeIn ${
          uploadFeedback.startsWith('✅') 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          {uploadFeedback}
        </div>
      )}



    </div>
  );
};
