import React, { useState } from 'react';
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
  CalendarCheck
} from 'lucide-react';
import { CalendarSessionEvent, RunnerState } from '../types';
import { RUN_WALK_SCHEDULE } from '../lib/runWalkEngine';

interface AdaptationCalendarProps {
  runnerState: RunnerState;
  onStartLiveSession: (weekNum: number) => void;
  onUpdateRunnerState?: (fields: Partial<RunnerState>) => void;
}

export const AdaptationCalendar: React.FC<AdaptationCalendarProps> = ({
  runnerState,
  onStartLiveSession,
  onUpdateRunnerState
}) => {
  // Current calendar view date state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to determine session type for any date:
  // Terça(2), Quinta(4), Sábado(6) = Treino de Caminha-Corre
  // Segunda, Quarta, Sexta, Domingo = Regeneração & Fortalecimento de Tendões
  const getSessionForDate = (dStr: string) => {
    const d = new Date(dStr + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0 is Dom, 2 is Ter, 4 is Qui, 6 is Sab
    const isWorkoutDay = [2, 4, 6].includes(dayOfWeek);

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
        badge: 'Descanso Ativo',
        focus: 'Alongamento suave de gastrocnêmios e soleares, hidratação e repouso ativo para adaptação tendínea.',
        cues: null
      };
    }
  };

  const selectedSession = getSessionForDate(selectedDateStr);
  const isSelectedCompleted = completedDates[selectedDateStr] || false;

  return (
    <div className="telemetry-card rounded-2xl p-5 sm:p-6 border border-white/10 space-y-6">
      
      {/* Header with Title and Month Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono-data mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Calendário Oficial de Adaptação Musculoesquelética</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
            {monthNames[month]} {year}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dias de estímulo alternados (Ter, Qui, Sáb) intercalados com regeneração de tendões e fáscias.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 font-mono-data transition-colors cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Days of Week and Days */}
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

        <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
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

    </div>
  );
};
