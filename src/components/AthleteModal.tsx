import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  User, 
  Heart, 
  Activity, 
  Award, 
  ShieldAlert, 
  Check, 
  Flame, 
  Sparkles, 
  Calculator, 
  RotateCcw,
  UploadCloud,
  FileCode,
  AlertTriangle,
  Zap,
  TrendingUp,
  CheckCircle2,
  Scale,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Star,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';
import { RunnerState, RunnerLevel, DistanceType, ParsedWorkout, MultiWorkoutTelemetrySummary, TrainingPlan, UserActivity } from '../types';
import { calculateVDOT, calculateTrainingPaces } from '../lib/vdotCalculator';
import { parseMultipleWorkoutFiles, aggregateWorkoutTelemetry } from '../lib/workoutParser';
import { computeAthletePrescription } from '../lib/athletePrescriptionEngine';
import { exportToObsidianMarkdown, exportToGraphifyJson } from '../lib/secondBrainExport';

interface AthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  runnerState: RunnerState;
  onSave: (updatedState: Partial<RunnerState>) => void;
  onOpenResetModal?: () => void;
  onWorkoutUploaded?: (workout: ParsedWorkout) => void;
  plan?: TrainingPlan;
  activities?: UserActivity[];
}

export const AthleteModal: React.FC<AthleteModalProps> = ({
  isOpen,
  onClose,
  runnerState,
  onSave,
  onOpenResetModal,
  onWorkoutUploaded,
  plan,
  activities,
}) => {
  if (!isOpen) return null;

  // Form State
  const [name, setName] = useState(runnerState.name || 'Corredor PaceLab');
  const [age, setAge] = useState<number>(runnerState.age || 32);
  const initialGender = runnerState.gender === 'F' ? 'female' : runnerState.gender === 'M' ? 'male' : (runnerState.gender || 'male');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialGender);
  const [weight, setWeight] = useState<number>(runnerState.weightKg || runnerState.weight || 70);
  const [heightCm, setHeightCm] = useState<number>(runnerState.heightCm || runnerState.height || 175);

  // Physical State & Routine
  const isCurrentlySedentary = runnerState.level === 'beginner' && (runnerState.weeksActive || 0) <= 2;
  const [activityProfile, setActivityProfile] = useState<'sedentary' | 'beginner' | 'intermediate' | 'advanced'>(
    isCurrentlySedentary ? 'sedentary' : (runnerState.level === 'advanced' ? 'advanced' : runnerState.level === 'intermediate' ? 'intermediate' : 'beginner')
  );
  const [weeksActive, setWeeksActive] = useState<number>(runnerState.weeksActive !== undefined ? runnerState.weeksActive : 12);
  const [weeklyVolume, setWeeklyVolume] = useState<number>(runnerState.weeklyVolume || 28);
  const [trainingDays, setTrainingDays] = useState<number>(runnerState.trainingDays || 4);
  const [goal, setGoal] = useState<string>(runnerState.goal || runnerState.targetGoal || 'Completar 10k com consistência');
  const [targetRaceDistance, setTargetRaceDistance] = useState<string>(runnerState.targetRaceDistance || '10k');
  const [injuries, setInjuries] = useState<string>(runnerState.injuries || '');

  // Heart Rates
  const [maxHR, setMaxHR] = useState<number>(runnerState.macHR || runnerState.maxHr || 188);
  const [restHR, setRestHR] = useState<number>(runnerState.restHR || runnerState.restingHr || 58);

  // Intervals.icu Integration
  const [intervalsAthleteId, setIntervalsAthleteId] = useState<string>(runnerState.intervalsAthleteId || '');
  const [intervalsApiKey, setIntervalsApiKey] = useState<string>(runnerState.intervalsApiKey || '');
  const [isTestingIntervals, setIsTestingIntervals] = useState<boolean>(false);
  const [intervalsTestResult, setIntervalsTestResult] = useState<'success' | 'error' | null>(null);

  // Manual VDOT / Test section
  const [hasRecentRace, setHasRecentRace] = useState<boolean>(!isCurrentlySedentary);
  const [raceDistance, setRaceDistance] = useState<DistanceType>('5k');
  const [raceHours, setRaceHours] = useState<number>(0);
  const [raceMinutes, setRaceMinutes] = useState<number>(24);
  const [raceSeconds, setRaceSeconds] = useState<number>(0);
  const [manualVdot, setManualVdot] = useState<number>(runnerState.currentVdot || 42.0);

  // Auto calculate Max HR based on age & gender
  const handleAutoCalculateHR = () => {
    const calculatedMax = gender === 'female' ? Math.round(208 - 0.7 * age) : Math.round(208 - 0.7 * age);
    setMaxHR(calculatedMax);
    if (!restHR || restHR < 35 || restHR > 100) {
      setRestHR(activityProfile === 'sedentary' ? 74 : 58);
    }
  };

  const handleTestIntervals = async () => {
    if (!intervalsApiKey) return;
    setIsTestingIntervals(true);
    setIntervalsTestResult(null);
    try {
      const { fetchIntervalsProfile } = await import('../lib/intervalsIcu');
      const profile = await fetchIntervalsProfile(intervalsAthleteId, intervalsApiKey);
      setIntervalsTestResult('success');
      
      if (profile.maxHR) setMaxHR(profile.maxHR);
      if (profile.restingHR) setRestHR(profile.restingHR);
      if (profile.threshold_pace && profile.threshold_pace > 0) {
        const time10kSeconds = 10000 / profile.threshold_pace;
        const estimatedVdot = calculateVDOT(10000, time10kSeconds);
        setManualVdot(estimatedVdot);
      }
    } catch (err) {
      console.error(err);
      setIntervalsTestResult('error');
    } finally {
      setIsTestingIntervals(false);
    }
  };

  // PKM Export Handlers
  const handleExportObsidian = () => {
    if (!plan || !activities) return;
    const md = exportToObsidianMarkdown(runnerState, plan, activities);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Athlete_${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportGraphify = () => {
    if (!plan || !activities) return;
    const json = exportToGraphifyJson(runnerState, plan, activities);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Athlete_${name.replace(/\s+/g, '_')}_Graphify.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Compute calculated VDOT
  const effectiveVdot = useMemo(() => {
    if (hasRecentRace) {
      const distanceMetersMap: Record<DistanceType, number> = {
        '400m': 400,
        '800m': 800,
        '1500m': 1500,
        '1mile': 1609.34,
        '3000m': 3000,
        '2miles': 3218.68,
        '5k': 5000,
        '10k': 10000,
        '15k': 15000,
        '10miles': 16093.4,
        'half_marathon': 21097.5,
        '30k': 30000,
        'marathon': 42195,
        '50k': 50000,
        'custom': 5000,
      };

      const meters = distanceMetersMap[raceDistance] || 5000;
      const totalSeconds = (raceHours * 3600) + (raceMinutes * 60) + raceSeconds;
      if (totalSeconds > 0) {
        return calculateVDOT(meters, totalSeconds);
      }
    }
    return manualVdot > 0 ? manualVdot : (activityProfile === 'sedentary' ? 28.0 : 40.0);
  }, [hasRecentRace, raceDistance, raceHours, raceMinutes, raceSeconds, manualVdot, activityProfile]);

  // Compute multi-factor athlete prescription on the fly
  const prescription = useMemo(() => {
    const currentMappedLevel: RunnerLevel = activityProfile === 'sedentary' || activityProfile === 'beginner' 
      ? 'beginner' 
      : activityProfile === 'advanced' ? 'advanced' : 'intermediate';

    return computeAthletePrescription(
      {
        name,
        age,
        gender,
        weightKg: weight,
        weight: weight,
        heightCm,
        height: heightCm,
        level: currentMappedLevel,
        weeksActive: activityProfile === 'sedentary' ? 0 : weeksActive,
        trainingDays,
        weeklyVolume,
        macHR: maxHR,
        maxHr: maxHR,
        restHR,
        restingHr: restHR,
        currentVdot: effectiveVdot,
        injuries,
      },
      null
    );
  }, [name, age, gender, weight, heightCm, activityProfile, weeksActive, trainingDays, weeklyVolume, maxHR, restHR, effectiveVdot, injuries]);

  // Handle Save
  const handleSave = () => {
    const finalLevel: RunnerLevel = activityProfile === 'sedentary' 
      ? 'sedentary_transition' 
      : activityProfile === 'beginner' 
      ? 'beginner' 
      : activityProfile === 'advanced' ? 'advanced' : 'intermediate';

    const formatCountStr = 'Ficha do Atleta';


    const updatedState: Partial<RunnerState> = {
      name,
      age,
      gender,
      weight,
      weightKg: weight,
      height: heightCm,
      heightCm,
      macHR: maxHR,
      maxHr: maxHR,
      restHR,
      restingHr: restHR,
      level: finalLevel,
      weeklyVolume,
      weeksActive: activityProfile === 'sedentary' ? 0 : weeksActive,
      trainingDays,
      goal,
      targetGoal: goal,
      targetRaceDistance,
      injuries,
      currentVdot: effectiveVdot,
      currentVo2max: effectiveVdot,
      isCalibrated: true,
      calibrationSource: formatCountStr,
      intervalsAthleteId,
      intervalsApiKey,
    };

    onSave(updatedState);
    onClose();
  };

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'biometria' | 'fisiologia' | 'integracoes' | 'prescricao'>('biometria');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div 
        id="modal-athlete-profile"
        className="relative w-full max-w-4xl bg-[#0A0A0A] border border-[#FF4E00]/30 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] animate-fadeIn"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#140E0B] via-[#0D0D0F] to-[#140E0B] border-b border-white/10 px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white font-heading">
                  Ficha Completa do Atleta & Calibração Fisiológica
                </h3>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono-data bg-[#FF4E00]/20 text-[#FF4E00] px-2 py-0.5 rounded font-bold border border-[#FF4E00]/30">
                  Motor Daniels & Karvonen
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Configure biometria, sedentarismo, rotina e avalie seu diagnóstico exato.
              </p>
            </div>
          </div>

          <button
            id="btn-close-athlete-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-white/10 bg-[#0F0F11] px-4 sm:px-6 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('biometria')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'biometria'
                ? 'border-[#FF4E00] text-white bg-white/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-[#FF4E00]" />
            <span>Biometria & Atividade</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fisiologia')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'fisiologia'
                ? 'border-[#FF4E00] text-white bg-white/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Zonas & Fisiologia (VDOT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('integracoes')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'integracoes'
                ? 'border-[#FF4E00] text-white bg-white/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>Intervals.icu & Segundo Cérebro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prescricao')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'prescricao'
                ? 'border-[#FF4E00] text-white bg-white/[0.02]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Metas & Prescrição Live</span>
          </button>
        </div>

        {/* Modal Body with smooth custom scrollbar */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* TAB 1: Biometria & Atividade */}
          {activeTab === 'biometria' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Section 1: Biometria & Identificação */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <User className="w-3.5 h-3.5" />
                  Biometria & Composição Corporal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF4E00] outline-none"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sexo Biológico</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Idade (anos)</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Math.max(12, Math.min(100, parseInt(e.target.value) || 30)))}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Math.max(30, Math.min(200, parseFloat(e.target.value) || 70)))}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono-data"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Math.max(100, Math.min(240, parseInt(e.target.value) || 175)))}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono-data"
                    />
                  </div>

                  {/* BMI Live Card */}
                  <div className="sm:col-span-2 p-2.5 rounded-xl bg-[#121214] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] text-slate-300">Índice IMC Calculado:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono-data text-white">{prescription.bmi} kg/m²</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        prescription.bmiCategory === 'normal' 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                          : prescription.bmiCategory === 'overweight' 
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' 
                          : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                      }`}>
                        {prescription.bmiClassification}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Histórico de Atividade & Sedentarismo */}
              <div className="space-y-3 bg-[#121214] p-4 rounded-xl border border-white/10">
                <h4 className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <Activity className="w-3.5 h-3.5" />
                  Nível de Atividade & Experiência de Corrida
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Condição Física / Histórico Recente</label>
                    <select
                      value={activityProfile}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setActivityProfile(val);
                        if (val === 'sedentary') {
                          setWeeksActive(0);
                          setWeeklyVolume(12);
                          setTrainingDays(3);
                        } else if (val === 'beginner') {
                          setWeeksActive(4);
                          setWeeklyVolume(20);
                          setTrainingDays(3);
                        } else if (val === 'intermediate') {
                          setWeeksActive(16);
                          setWeeklyVolume(35);
                          setTrainingDays(4);
                        } else {
                          setWeeksActive(36);
                          setWeeklyVolume(55);
                          setTrainingDays(5);
                        }
                      }}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="sedentary">Sedentário / Retomando do Zero (Método Caminha-Corre & Proteção Articular)</option>
                      <option value="beginner">Iniciante em Adaptação (Já corre alguns km contínuos)</option>
                      <option value="intermediate">Corredor Regular (6 a 24 semanas contínuas)</option>
                      <option value="advanced">Corredor Experiente / Avançado (&gt; 24 semanas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Semanas Ativas Consecutivas de Treino</label>
                    <input
                      type="number"
                      value={weeksActive}
                      onChange={(e) => setWeeksActive(Math.max(0, Math.min(520, parseInt(e.target.value) || 0)))}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                      placeholder="Ex: 12"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Frequência Semanal Desejada</label>
                    <select
                      value={trainingDays}
                      onChange={(e) => setTrainingDays(parseInt(e.target.value) || 4)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value={2}>2 dias por semana (Manutenção / Início Leve)</option>
                      <option value={3}>3 dias por semana (Recomendado Iniciantes / Sedentários)</option>
                      <option value={4}>4 dias por semana (Ideal Intermediários)</option>
                      <option value={5}>5 dias por semana (Avançado)</option>
                      <option value={6}>6 dias por semana (Alta Performance)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Volume Semanal Atual Estimado (km)</label>
                    <input
                      type="number"
                      value={weeklyVolume}
                      onChange={(e) => setWeeklyVolume(Math.max(5, Math.min(180, parseInt(e.target.value) || 20)))}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* TAB 2: Zonas Cardíacas & VDOT */}
          {activeTab === 'fisiologia' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Section 3: Frequência Cardíaca (Karvonen) */}
              <div className="space-y-3 bg-[#121214] p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Zonas Cardíacas (Karvonen HRR)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAutoCalculateHR}
                    className="text-[10px] text-[#FF4E00] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Calculator className="w-3 h-3" />
                    Auto-calcular Tanaka por Idade ({Math.round(208 - 0.7 * age)} bpm)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      FC Máxima (bpm) <span className="text-slate-500">[{gender === 'female' ? 'Tanaka: 208 - 0.7xIdade' : 'Tanaka: 208 - 0.7xIdade'}]</span>
                    </label>
                    <input
                      type="number"
                      value={maxHR}
                      onChange={(e) => setMaxHR(parseInt(e.target.value) || 185)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      FC Repouso (bpm) <span className="text-slate-500">[ao acordar na cama]</span>
                    </label>
                    <input
                      type="number"
                      value={restHR}
                      onChange={(e) => setRestHR(parseInt(e.target.value) || 58)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: VDOT Manual se não tiver arquivo carregado */}
              <div className="space-y-3 bg-[#121214] p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <Flame className="w-3.5 h-3.5" />
                    Teste de Campo ou VDOT Manual
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasRecentRace}
                      onChange={(e) => setHasRecentRace(e.target.checked)}
                      className="rounded text-[#FF4E00] focus:ring-[#FF4E00]"
                    />
                    Calcular por tempo de prova/teste
                  </label>
                </div>

                {hasRecentRace ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Distância</label>
                      <select
                        value={raceDistance}
                        onChange={(e) => setRaceDistance(e.target.value as DistanceType)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      >
                        <option value="5k">5 km</option>
                        <option value="10k">10 km</option>
                        <option value="half_marathon">Meia Maratona (21.1k)</option>
                        <option value="marathon">Maratona (42.2k)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Horas</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={raceHours}
                        onChange={(e) => setRaceHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Minutos</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={raceMinutes}
                        onChange={(e) => setRaceMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Segundos</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={raceSeconds}
                        onChange={(e) => setRaceSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">VDOT Direto Estimado</label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualVdot}
                        onChange={(e) => setManualVdot(Math.max(15, Math.min(85, parseFloat(e.target.value) || 35)))}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#FF4E00] font-bold font-mono-data outline-none"
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center">
                      <span>Sedentários iniciam em VDOT 25-30. Corredores intermediários ficam em 40-48. Avançados em 50+.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Integrações (Intervals.icu & Segundo Cérebro) */}
          {activeTab === 'integracoes' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Section: Intervals.icu */}
              <div className="space-y-3 bg-[#121214] p-4 rounded-xl border border-white/10">
                <h4 className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                  Sincronização Intervals.icu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Athlete ID (Opcional)</label>
                    <input
                      type="text"
                      value={intervalsAthleteId}
                      onChange={(e) => setIntervalsAthleteId(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="Ex: i12345 (Deixe em branco para conta principal)"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">API Key</label>
                    <input
                      type="password"
                      value={intervalsApiKey}
                      onChange={(e) => setIntervalsApiKey(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="Cole sua API Key do Intervals.icu aqui"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-400">
                      Sincronize automaticamente seus treinos, ritmos de limiar e zonas cardíacas.
                    </span>
                    <button
                      type="button"
                      onClick={handleTestIntervals}
                      disabled={isTestingIntervals || !intervalsApiKey}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        !intervalsApiKey ? 'bg-white/5 text-slate-500 cursor-not-allowed' :
                        intervalsTestResult === 'success' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
                        intervalsTestResult === 'error' ? 'bg-rose-900/50 text-rose-400 border border-rose-500/30' :
                        'bg-[#FF4E00]/20 text-[#FF4E00] hover:bg-[#FF4E00]/30'
                      }`}
                    >
                      {isTestingIntervals ? (
                        <span className="animate-pulse">Testando...</span>
                      ) : intervalsTestResult === 'success' ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Conectado</>
                      ) : intervalsTestResult === 'error' ? (
                        <><AlertTriangle className="w-3.5 h-3.5" /> Falhou</>
                      ) : (
                        'Testar Conexão'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Segundo Cérebro (PKM) */}
              <div className="p-4 rounded-xl bg-[#121214] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="p-1 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
                    <FileCode className="w-3.5 h-3.5" />
                  </span>
                  Integração Segundo Cérebro (PKM / Obsidian / Graphify)
                </h4>
                <p className="text-xs text-slate-400">
                  Exporte sua ficha fisiológica, limiares, ritmos VDOT e histórico recente para ferramentas de conhecimento como Obsidian, Logseq ou Graphify.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    id="btn-export-obsidian"
                    type="button"
                    onClick={handleExportObsidian}
                    disabled={!plan || !activities}
                    className="px-3.5 py-2 rounded-xl bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Exportar para Obsidian (Markdown)</span>
                  </button>
                  
                  <button
                    id="btn-export-graphify"
                    type="button"
                    onClick={handleExportGraphify}
                    disabled={!plan || !activities}
                    className="px-3.5 py-2 rounded-xl bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Exportar para Graphify (JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Metas & Prescrição Live */}
          {activeTab === 'prescricao' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Section 5: Metas e Observações Clínicas */}
              <div className="space-y-3 bg-[#121214] p-4 rounded-xl border border-white/10">
                <h4 className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Objetivo de Prova & Histórico de Dores / Lesões
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Distância Alvo</label>
                    <select
                      value={targetRaceDistance}
                      onChange={(e) => setTargetRaceDistance(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="5k">5 km</option>
                      <option value="10k">10 km</option>
                      <option value="21k">Meia Maratona (21.1k)</option>
                      <option value="42k">Maratona (42.2k)</option>
                      <option value="base">Construção de Base / Condicionamento</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Objetivo Específico</label>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="Ex: Correr 10k sub-45 com segurança e sem dores"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Histórico de Lesões, Dores Articulares ou Restrições</label>
                    <input
                      type="text"
                      value={injuries}
                      onChange={(e) => setInjuries(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      placeholder="Ex: Histórico de canelite na perna esquerda ou fascite plantar prévia"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE DIAGNOSIS & TRAINING PRESCRIPTION CARD */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1A120D] via-[#121216] to-[#1A120D] border-2 border-[#FF4E00]/40 space-y-4 shadow-xl shadow-black/60">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-[#FF4E00] animate-pulse" />
                    <div>
                      <h4 className="text-sm font-extrabold text-white font-heading">
                        Diagnóstico da Condição Física & Prescrição do Treino
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Calculado em tempo real com base nos seus parâmetros biométricos e telemetria
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono-data text-slate-400 block">VDOT / VO2máx</span>
                    <span className="text-lg font-black text-[#FF4E00] font-mono-data">{prescription.vdot.toFixed(1)}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Nível Fisiológico</span>
                    <span className="text-xs font-bold text-white block truncate">{prescription.fitnessLevelName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono-data font-semibold">Percentil {prescription.fitnessPercentileAgeGender}%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Risco Articular</span>
                    <span className={`text-xs font-bold block ${
                      prescription.injuryRiskLevel === 'Baixo' ? 'text-emerald-400' : prescription.injuryRiskLevel === 'Moderado' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {prescription.injuryRiskLevel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">IMC {prescription.bmi}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Volume Seguro</span>
                    <span className="text-xs font-bold text-amber-300 block font-mono-data">
                      Até {prescription.safeWeeklyVolumeKm} km/sem
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">{trainingDays} dias/semana</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Teto do Longão</span>
                    <span className="text-xs font-bold text-[#FF4E00] block font-mono-data">
                      {prescription.safeLongRunKm} km máx
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">Proteção tecidual</span>
                  </div>
                </div>

                {/* Recommended Phase & Guidance */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-white/10">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                      <Layers className="w-3.5 h-3.5 text-[#FF4E00]" />
                      <span>{prescription.trainingPhase}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {prescription.trainingPhaseDescription}
                    </p>
                    <div className="mt-2 text-[10px] font-mono-data text-[#FF4E00] font-bold">
                      Distribuição Polarizada: {prescription.polarizedRatio}
                    </div>
                  </div>

                  {prescription.actionableGuidance.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recomendações Clínicas para seu Treino:</span>
                      <ul className="space-y-1">
                        {prescription.actionableGuidance.map((g, idx) => (
                          <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <span className="text-[#FF4E00] font-bold">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#121214] border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {onOpenResetModal ? (
            <button
              id="btn-athlete-modal-reset"
              type="button"
              onClick={() => {
                onClose();
                onOpenResetModal();
              }}
              className="px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>Zerar Dados & Estatísticas</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              id="btn-cancel-athlete-modal"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-athlete-modal"
              onClick={handleSave}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-[#FF4E00]/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Perfil & Aplicar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
