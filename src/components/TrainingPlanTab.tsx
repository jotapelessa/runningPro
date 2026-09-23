import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  RotateCw, 
  Circle, 
  CheckCircle2,
  Activity, 
  FileSpreadsheet,
  User,
  Sparkles,
  ShieldAlert,
  Flame,
  Clock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyWorkout, TrainingPlan, TrainingWeek, RunnerState } from '../types';
import { generateEightWeekPlan } from '../lib/planGenerator';

interface TrainingPlanTabProps {
  runnerState: RunnerState;
  currentPlan: TrainingPlan;
  onUpdatePlan: (newPlan: TrainingPlan) => void;
  onOpenAthleteModal: () => void;
}

export const TrainingPlanTab: React.FC<TrainingPlanTabProps> = ({
  runnerState,
  currentPlan,
  onUpdatePlan,
  onOpenAthleteModal
}) => {
  const isUncalibrated = runnerState.isCalibrated === false || (runnerState.currentVdot || 0) <= 0;

  const [activeWeekNum, setActiveWeekNum] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState<'5k' | '10k' | '21k' | '42k' | 'base'>(currentPlan.targetGoal || '10k');
  const [selectedFreq, setSelectedFreq] = useState<3 | 4 | 5 | 6>(currentPlan.weeklyFrequency || 4);
  const [loggingWorkoutId, setLoggingWorkoutId] = useState<string | null>(null);

  // Sync state when runnerState or currentPlan changes
  useEffect(() => {
    if (runnerState.targetRaceDistance) {
      const g = runnerState.targetRaceDistance.toLowerCase();
      if (['5k', '10k', '21k', '42k', 'base'].includes(g)) {
        setSelectedGoal(g as any);
      }
    } else if (currentPlan.targetGoal) {
      setSelectedGoal(currentPlan.targetGoal);
    }

    if (runnerState.trainingDays && runnerState.trainingDays >= 3 && runnerState.trainingDays <= 6) {
      setSelectedFreq(runnerState.trainingDays as any);
    } else if (currentPlan.weeklyFrequency) {
      setSelectedFreq(currentPlan.weeklyFrequency);
    }
  }, [runnerState.targetRaceDistance, runnerState.targetGoal, runnerState.trainingDays, currentPlan.targetGoal, currentPlan.weeklyFrequency]);

  // Workout feedback form state
  const [feedbackPace, setFeedbackPace] = useState<string>('');
  const [feedbackHr, setFeedbackHr] = useState<string>('');
  const [feedbackRpe, setFeedbackRpe] = useState<number>(7);

  const activeWeek = currentPlan?.weeks?.find(w => w.weekNumber === activeWeekNum) || currentPlan?.weeks?.[0] || {
    weekNumber: 1,
    phase: 'Fase 1: Fundação & Adaptação',
    phaseCode: 'base',
    focus: 'Aguardando calibração de dados.',
    totalKm: 0,
    targetTss: 0,
    days: []
  };

  // Overall Plan Stats
  const totalPlanWorkouts = (currentPlan?.weeks || []).flatMap(w => w.days).filter(d => d.type !== 'REST');
  const completedWorkouts = totalPlanWorkouts.filter(d => d.completed);
  const planProgressPct = totalPlanWorkouts.length > 0 
    ? Math.round((completedWorkouts.length / totalPlanWorkouts.length) * 100) 
    : 0;

  const totalPlanKm = (currentPlan?.weeks || []).reduce((sum, w) => sum + w.totalKm, 0);

  // Generate a fresh plan
  const handleRegeneratePlan = () => {
    const vdotToUse = runnerState.currentVdot > 0 ? runnerState.currentVdot : 38.0;
    const newPlan = generateEightWeekPlan(
      runnerState.name || 'Atleta PaceLab',
      vdotToUse,
      selectedGoal,
      selectedFreq
    );
    onUpdatePlan(newPlan);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  // Toggle workout completion
  const handleToggleComplete = (workoutId: string) => {
    if (!currentPlan?.weeks) return;
    const updatedWeeks = currentPlan.weeks.map(week => {
      return {
        ...week,
        days: week.days.map(day => {
          if (day.id === workoutId) {
            const nextCompleted = !day.completed;
            if (nextCompleted) {
              confetti({
                particleCount: 25,
                spread: 40,
                origin: { y: 0.8 }
              });
            }
            return {
              ...day,
              completed: nextCompleted
            };
          }
          return day;
        })
      };
    });

    onUpdatePlan({
      ...currentPlan,
      weeks: updatedWeeks
    });
  };

  // Submit detailed feedback
  const handleSaveFeedback = (workoutId: string) => {
    if (!currentPlan?.weeks) return;
    const updatedWeeks = currentPlan.weeks.map(week => {
      return {
        ...week,
        days: week.days.map(day => {
          if (day.id === workoutId) {
            return {
              ...day,
              completed: true,
              completedPace: feedbackPace || undefined,
              completedHr: feedbackHr ? parseInt(feedbackHr) : undefined,
              rpe: feedbackRpe
            };
          }
          return day;
        })
      };
    });

    onUpdatePlan({
      ...currentPlan,
      weeks: updatedWeeks
    });
    setLoggingWorkoutId(null);
    setFeedbackPace('');
    setFeedbackHr('');
  };

  // Export Plan to CSV
  const handleExportCsv = () => {
    if (!currentPlan?.weeks) return;
    let csvContent = 'Semana,Fase,Dia,Tipo,Titulo,Distancia_KM,TSS,Aquecimento,Bloco_Principal,Desaquecimento,Concluido\n';
    
    currentPlan.weeks.forEach(w => {
      w.days.forEach(d => {
        const row = [
          `Semana ${w.weekNumber}`,
          `"${w.phase}"`,
          d.dayName,
          d.type,
          `"${d.title.replace(/"/g, '""')}"`,
          d.totalKm,
          d.tss,
          `"${d.warmup.replace(/"/g, '""')}"`,
          `"${d.mainBlock.replace(/"/g, '""')}"`,
          `"${d.cooldown.replace(/"/g, '""')}"`,
          d.completed ? 'SIM' : 'NAO'
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PaceLab_Planilha_8_Semanas_${selectedGoal.toUpperCase()}_VDOT_${(runnerState.currentVdot || 0).toFixed(1)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Uncalibrated Status Banner */}
      {isUncalibrated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#18110D] to-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <CalendarCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300 font-heading">
                  Planilha de Treinos: Perfil Zerado
                </span>
                <span className="text-[10px] uppercase font-mono-data bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Aguardando Calibração
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                A planilha será ajustada dinamicamente com base no seu <strong>VDOT</strong>, <strong>volume semanal</strong> e <strong>dias de treino por semana</strong> assim que você preencher a Ficha do Atleta ou carregar arquivos de treino (.GPX / .FIT / .TCX).
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAthleteModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-heading flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            Configurar Ficha do Atleta
          </button>
        </div>
      )}

      {/* Top Generator / Settings Card */}
      <div className="telemetry-card rounded-2xl p-5 border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                Periodização Científica de 8 Semanas PaceLab
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>Atleta: <strong className="text-white">{runnerState.name || 'Atleta'}</strong></span>
              <span>•</span>
              <span>VDOT Base: <strong className="text-[#FF4E00] font-mono-data">{runnerState.currentVdot > 0 ? runnerState.currentVdot.toFixed(1) : 'Zerado'}</strong></span>
              <span>•</span>
              <span>Frequência: <strong className="text-white">{runnerState.trainingDays || selectedFreq}x/semana</strong></span>
              <span>•</span>
              <span>Volume Cadastrado: <strong className="text-white">{runnerState.weeklyVolume || 0} km/semana</strong></span>
            </div>
          </div>

          {/* Quick Generator Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#121214] px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold font-mono-data">ALVO:</span>
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value as any)}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-2 py-1 text-white font-bold focus:outline-none focus:border-[#FF4E00]"
              >
                <option value="5k">5 km (Velocidade / VO2)</option>
                <option value="10k">10 km (Limiar / Resistência)</option>
                <option value="21k">Meia Maratona 21.1k</option>
                <option value="42k">Maratona 42.2k</option>
                <option value="base">Condicionamento Base</option>
              </select>
            </div>

            <div className="bg-[#121214] px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold font-mono-data">FREQUÊNCIA:</span>
              <select
                value={selectedFreq}
                onChange={(e) => setSelectedFreq(parseInt(e.target.value) as any)}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-2 py-1 text-white font-bold focus:outline-none focus:border-[#FF4E00]"
              >
                <option value="3">3 dias / semana</option>
                <option value="4">4 dias / semana</option>
                <option value="5">5 dias / semana</option>
                <option value="6">6 dias / semana</option>
              </select>
            </div>

            <button
              id="btn-regenerate-plan"
              onClick={handleRegeneratePlan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-xs font-mono-data uppercase transition-all shadow-md shadow-[#FF4E00]/25 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Gerar / Atualizar</span>
            </button>
          </div>
        </div>

        {/* Global Progress Strip */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-mono-data block">PROGRESSO DO MACROCICLO</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-[#050505] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${planProgressPct}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono-data text-emerald-400">{planProgressPct}%</span>
            </div>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-mono-data block">TREINOS CONCLUÍDOS</span>
            <span className="text-base font-bold font-mono-data text-white block mt-0.5">
              {completedWorkouts.length} / {totalPlanWorkouts.length}
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-mono-data block">VOLUME TOTAL ESTIMADO</span>
            <span className="text-base font-bold font-mono-data text-[#FF4E00] block mt-0.5">
              ~{Math.round(totalPlanKm)} km
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono-data block">EXPORTAR PLANILHA</span>
              <span className="text-xs font-bold text-slate-200 block mt-0.5">CSV / Excel</span>
            </div>
            <button
              onClick={handleExportCsv}
              className="p-2 bg-white/5 hover:bg-white/10 text-[#FF4E00] rounded-lg transition-colors cursor-pointer"
              title="Baixar CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Tabs Navigator (1 to 8) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
        {(currentPlan?.weeks || []).map((w) => {
          const isSelected = w.weekNumber === activeWeekNum;
          const weekDone = w.days.filter(d => d.type !== 'REST' && d.completed).length;
          const weekTotal = w.days.filter(d => d.type !== 'REST').length;
          const isWeekComplete = weekTotal > 0 && weekDone === weekTotal;

          return (
            <button
              key={w.weekNumber}
              onClick={() => setActiveWeekNum(w.weekNumber)}
              className={`flex-1 min-w-[110px] p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#18110D] border-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/20'
                  : 'bg-[#0A0A0A] border-white/10 text-slate-400 hover:bg-[#121214] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold font-mono-data tracking-wider">
                  SEMANA 0{w.weekNumber}
                </span>
                {isWeekComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] font-mono-data text-slate-500">{weekDone}/{weekTotal}</span>
                )}
              </div>
              <div className="text-[10px] font-mono-data truncate text-[#FF4E00]">
                {w.totalKm} km • {w.targetTss} TSS
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Week Details Header */}
      <div className="telemetry-card rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0A0A0A] via-[#120E0B] to-[#0A0A0A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono-data bg-[#FF4E00]/15 text-[#FF4E00] px-2 py-0.5 rounded border border-[#FF4E00]/30">
              SEMANA {activeWeek.weekNumber} DE 8
            </span>
            <h3 className="text-base font-bold text-white font-heading">{activeWeek.phase}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{activeWeek.focus}</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-data text-slate-300">
          <div>
            <span className="text-slate-500 block text-[10px]">META DE VOLUME:</span>
            <strong className="text-white text-sm">{activeWeek.totalKm} km</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">CARGA ESTIMADA:</span>
            <strong className="text-amber-400 text-sm">{activeWeek.targetTss} TSS</strong>
          </div>
        </div>
      </div>

      {/* 7 Days Workout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {activeWeek.days.map((workout) => {
          const isRest = workout.type === 'REST';
          const isRace = workout.type === 'TEST';
          const isLoggingThis = loggingWorkoutId === workout.id;

          const badgeColorMap: Record<string, string> = {
            E: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30',
            Easy: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30',
            M: 'bg-blue-950/50 text-blue-400 border-blue-500/30',
            'Long Run': 'bg-blue-950/50 text-blue-400 border-blue-500/30',
            T: 'bg-amber-950/50 text-amber-400 border-amber-500/30',
            Threshold: 'bg-amber-950/50 text-amber-400 border-amber-500/30',
            I: 'bg-rose-950/50 text-rose-400 border-rose-500/30',
            Interval: 'bg-rose-950/50 text-rose-400 border-rose-500/30',
            R: 'bg-purple-950/50 text-purple-400 border-purple-500/30',
            Repetition: 'bg-purple-950/50 text-purple-400 border-purple-500/30',
            REST: 'bg-[#121214] text-slate-500 border-white/5',
            Rest: 'bg-[#121214] text-slate-500 border-white/5',
            TEST: 'bg-[#FF4E00] text-white border-[#FF4E00] font-black',
            CROSS: 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30',
          };
          const typeBadgeColors = badgeColorMap[workout.type] || 'bg-slate-900 text-slate-300 border-white/10';

          return (
            <div
              key={workout.id}
              className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                workout.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-950/40'
                  : isRest
                    ? 'bg-[#0A0A0A]/60 border-white/5 opacity-70'
                    : isRace
                      ? 'bg-[#18110D] border-[#FF4E00]/60 shadow-lg shadow-[#FF4E00]/20'
                      : 'bg-[#0A0A0A] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 font-mono-data">
                    {workout.dayName.split('-')[0]}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono-data ${typeBadgeColors}`}>
                    {workout.type === 'REST' ? 'OFF' : `Pace ${workout.type}`}
                  </span>
                </div>

                {/* Workout Title */}
                <h4 className="font-bold text-xs text-white leading-tight mb-2">
                  {workout.title}
                </h4>

                {/* Workout Metrics */}
                {!isRest && (
                  <div className="flex items-center justify-between text-[11px] font-mono-data text-slate-400 mb-2.5 bg-[#121214] px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-[#FF4E00] font-bold">{workout.totalKm} km</span>
                    <span>~{workout.durationMinutes} min</span>
                    <span className="text-amber-400">{workout.tss} TSS</span>
                  </div>
                )}

                {/* Workout Execution Details */}
                <div className="space-y-1.5 text-[11px] text-slate-300 mb-3">
                  {!isRest && workout.warmup && (
                    <div className="bg-[#121214] p-1.5 rounded border border-white/5">
                      <strong className="text-slate-400 block text-[9px] uppercase font-mono-data">Aquecimento:</strong>
                      <span className="text-[10px] text-slate-300">{workout.warmup}</span>
                    </div>
                  )}

                  <div className="bg-[#121214] p-2 rounded-lg border border-white/10">
                    <strong className="text-[#FF4E00] block text-[9px] uppercase font-mono-data">Bloco Principal:</strong>
                    <span className="text-xs text-white leading-snug font-medium">{workout.mainBlock}</span>
                  </div>

                  {!isRest && workout.cooldown && (
                    <div className="bg-[#121214] p-1.5 rounded border border-white/5">
                      <strong className="text-slate-400 block text-[9px] uppercase font-mono-data">Desaquecimento:</strong>
                      <span className="text-[10px] text-slate-300">{workout.cooldown}</span>
                    </div>
                  )}
                </div>

                {/* Completed Details pill if logged */}
                {workout.completed && (workout.completedPace || workout.rpe) && (
                  <div className="bg-emerald-950/50 border border-emerald-500/30 p-2 rounded-lg text-[10px] font-mono-data text-emerald-300 mb-2 space-y-0.5">
                    {workout.completedPace && <div>Pace Real: <strong>{workout.completedPace}</strong></div>}
                    {workout.completedHr && <div>FC Média: <strong>{workout.completedHr} bpm</strong></div>}
                    {workout.rpe && <div>Percepção (RPE): <strong>{workout.rpe}/10</strong></div>}
                  </div>
                )}

                {/* Feedback Modal / Inline Logger */}
                {isLoggingThis && (
                  <div className="bg-[#121214] p-2.5 rounded-xl border border-[#FF4E00]/40 space-y-2 mb-2 text-xs">
                    <span className="text-[10px] font-bold text-[#FF4E00] block font-mono-data uppercase">
                      Registrar Execução Real:
                    </span>
                    <input
                      type="text"
                      placeholder="Pace Real (ex: 4:32/km)"
                      value={feedbackPace}
                      onChange={(e) => setFeedbackPace(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono-data"
                    />
                    <input
                      type="number"
                      placeholder="FC Média (bpm)"
                      value={feedbackHr}
                      onChange={(e) => setFeedbackHr(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono-data"
                    />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Esforço (RPE): {feedbackRpe}/10</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={feedbackRpe}
                        onChange={(e) => setFeedbackRpe(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#222] rounded accent-[#FF4E00]"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleSaveFeedback(workout.id)}
                        className="flex-1 py-1 bg-[#FF4E00] text-white font-bold rounded text-[11px] cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setLoggingWorkoutId(null)}
                        className="px-2 py-1 bg-white/10 text-slate-300 rounded text-[11px] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Complete Button */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                <button
                  onClick={() => handleToggleComplete(workout.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] font-mono-data flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    workout.completed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : isRest
                        ? 'bg-[#121214] text-slate-500 hover:text-slate-300'
                        : 'bg-[#121214] hover:bg-[#18110D] text-slate-300 hover:text-[#FF4E00] border border-white/10'
                  }`}
                >
                  {workout.completed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CONCLUÍDO</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isRest ? 'Descansado' : 'Concluir'}</span>
                    </>
                  )}
                </button>

                {!isRest && (
                  <button
                    onClick={() => setLoggingWorkoutId(isLoggingThis ? null : workout.id)}
                    className="p-1.5 text-slate-400 hover:text-[#FF4E00] bg-[#121214] hover:bg-white/10 rounded-lg border border-white/10 cursor-pointer"
                    title="Registrar dados reais de pace e FC"
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
