import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Heart,
  Activity,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RunWalkInterval } from '../types';
import { 
  playCountdownPip, 
  playStartRunTone, 
  playStartWalkTone, 
  playFinishWorkoutTone 
} from '../lib/audioCues';

interface LiveRunWalkModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervalConfig: RunWalkInterval;
  weekNumber: number;
  onCompleteSession: (summary: {
    completedReps: number;
    totalDurationMin: number;
    rpe: number;
    hasPain: boolean;
    painLocation?: string;
  }) => void;
}

type Phase = 'warmup' | 'run' | 'walk' | 'cooldown' | 'finished';

export const LiveRunWalkModal: React.FC<LiveRunWalkModalProps> = ({
  isOpen,
  onClose,
  intervalConfig,
  weekNumber,
  onCompleteSession
}) => {
  if (!isOpen) return null;

  // Session State
  const [phase, setPhase] = useState<Phase>('warmup');
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(intervalConfig.warmupWalkSec || 300);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Post-workout feedback state
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [rpe, setRpe] = useState<number>(6);
  const [hasPain, setHasPain] = useState<boolean>(false);
  const [painLocation, setPainLocation] = useState<string>('Nenhuma');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Timer loop
  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setTimeout(() => {
        // Sound cue at 3, 2, 1
        if (soundEnabled && secondsRemaining <= 4 && secondsRemaining > 1) {
          playCountdownPip();
        }
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      handlePhaseTransition();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, secondsRemaining, phase, currentRep]);

  const handlePhaseTransition = () => {
    if (phase === 'warmup') {
      // Transition from warmup to first run
      setPhase('run');
      setSecondsRemaining(intervalConfig.runDurationSec);
      if (soundEnabled) playStartRunTone();
    } else if (phase === 'run') {
      // Transition from run to walk
      setPhase('walk');
      setSecondsRemaining(intervalConfig.walkDurationSec);
      if (soundEnabled) playStartWalkTone();
    } else if (phase === 'walk') {
      // Check if all reps completed
      if (currentRep >= intervalConfig.reps) {
        setPhase('cooldown');
        setSecondsRemaining(intervalConfig.cooldownWalkSec || 300);
        if (soundEnabled) playStartWalkTone();
      } else {
        setCurrentRep(prev => prev + 1);
        setPhase('run');
        setSecondsRemaining(intervalConfig.runDurationSec);
        if (soundEnabled) playStartRunTone();
      }
    } else if (phase === 'cooldown') {
      setPhase('finished');
      setIsActive(false);
      setIsFinishing(true);
      if (soundEnabled) playFinishWorkoutTone();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleTogglePlay = () => {
    // If just starting from initial state, play cue
    if (!isActive && phase === 'warmup' && secondsRemaining === intervalConfig.warmupWalkSec) {
      if (soundEnabled) playStartWalkTone();
    }
    setIsActive(!isActive);
  };

  const handleSkipForward = () => {
    handlePhaseTransition();
  };

  const handleFinishEarly = () => {
    setIsActive(false);
    setIsFinishing(true);
    if (soundEnabled) playFinishWorkoutTone();
  };

  const handleSaveFeedback = () => {
    const totalTimeEst = Math.round(
      ((intervalConfig.warmupWalkSec + intervalConfig.cooldownWalkSec + 
        (currentRep * (intervalConfig.runDurationSec + intervalConfig.walkDurationSec))) / 60)
    );

    onCompleteSession({
      completedReps: currentRep,
      totalDurationMin: totalTimeEst,
      rpe,
      hasPain,
      painLocation: hasPain ? painLocation : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-hidden">
        
        {/* Glow Accent */}
        <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          phase === 'run' ? 'bg-[#FF4E00]/25' : phase === 'walk' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
        }`} />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/10 text-white">
              Semana {weekNumber}
            </span>
            <span className="text-sm font-medium text-slate-300">
              Método Caminha-Corre
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              title={soundEnabled ? 'Desativar áudio' : 'Ativar áudio'}
            >
              {soundEnabled ? <Volume2 size={18} className="text-[#FF4E00]" /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Workout Running Screen */}
        {!isFinishing ? (
          <div className="flex flex-col items-center justify-center my-8 z-10 text-center">
            
            {/* Phase Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 transition-all ${
              phase === 'run' 
                ? 'bg-[#FF4E00]/20 text-[#FF4E00] border border-[#FF4E00]/40 shadow-lg shadow-[#FF4E00]/20 animate-pulse'
                : phase === 'walk'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              <Activity size={16} />
              {phase === 'warmup' && 'Aquecimento (Caminhada)'}
              {phase === 'run' && 'Trote Muito Leve (RPE 6)'}
              {phase === 'walk' && 'Caminhada de Recuperação'}
              {phase === 'cooldown' && 'Desaquecimento Final'}
              {phase === 'finished' && 'Treino Concluído!'}
            </div>

            {/* Rep Counter */}
            {phase !== 'warmup' && phase !== 'cooldown' && (
              <div className="text-sm font-semibold text-slate-400 mb-2">
                Repetição <span className="text-white text-base font-bold">{currentRep}</span> de <span className="text-white text-base font-bold">{intervalConfig.reps}</span>
              </div>
            )}

            {/* Huge Countdown Timer */}
            <div className="font-mono text-7xl md:text-8xl font-black tracking-tight text-white my-2 drop-shadow-md">
              {formatTime(secondsRemaining)}
            </div>

            {/* Coach Voice / Text Hint */}
            <p className="text-sm text-slate-300 max-w-md mt-4 min-h-[44px] flex items-center justify-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              {phase === 'warmup' && 'Caminhada firme para lubrificar as articulações e elevar os batimentos aos poucos.'}
              {phase === 'run' && intervalConfig.cues.runText}
              {phase === 'walk' && intervalConfig.cues.walkText}
              {phase === 'cooldown' && 'Caminhe leve para normalizar sua respiração e baixar a frequência cardíaca.'}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handleSkipForward}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Pular bloco atual"
              >
                Pular bloco <ArrowRight size={14} />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`p-5 rounded-2xl flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/25' 
                    : 'bg-[#FF4E00] hover:bg-[#E03E00] text-white shadow-xl shadow-[#FF4E00]/30 scale-105'
                }`}
              >
                {isActive ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
              </button>

              <button
                onClick={handleFinishEarly}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-xs font-semibold text-slate-300 transition-colors"
              >
                Finalizar
              </button>
            </div>
          </div>
        ) : (
          /* Post-Workout Feedback */
          <div className="flex flex-col my-6 z-10">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">Excelente Treino!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Você completou seus blocos de adaptação mecânica com segurança.
              </p>
            </div>

            <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/5">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-2">
                  <span>Esforço Médio Percebido (RPE):</span>
                  <span className="text-[#FF4E00] font-bold text-sm">{rpe}/10 ({rpe <= 6 ? 'Leve/Confortável' : rpe <= 7 ? 'Moderado Seguro' : 'Forte'})</span>
                </label>
                <input 
                  type="range" 
                  min={1} 
                  max={10} 
                  value={rpe}
                  onChange={(e) => setRpe(parseInt(e.target.value))}
                  className="w-full accent-[#FF4E00]" 
                />
              </div>

              <div className="pt-2 border-t border-white/5">
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Sentiu alguma dor ou pontada durante o treino?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasPain(false)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      !hasPain ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Zero dor (100% confortável)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPain(true)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      hasPain ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Senti desconforto / dor
                  </button>
                </div>

                {hasPain && (
                  <div className="mt-3">
                    <label className="text-xs text-slate-400 block mb-1">Local da dor:</label>
                    <select
                      value={painLocation}
                      onChange={(e) => setPainLocation(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg bg-[#111] border border-white/10 text-xs text-white"
                    >
                      <option value="Canela (Tíbia)">Canela (Tíbia / Canelite)</option>
                      <option value="Joelho">Joelho</option>
                      <option value="Tendão de Aquiles">Tendão de Aquiles</option>
                      <option value="Planta do Pé">Planta do Pé (Fáscia)</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveFeedback}
              className="mt-6 w-full py-3.5 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#FF4E00]/25 transition-all"
            >
              Salvar Treino e Atualizar Prontidão
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
