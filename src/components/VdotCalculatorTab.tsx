import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Flame, 
  Activity, 
  Thermometer, 
  Clock, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Award,
  Zap,
  User,
  Heart,
  AlertTriangle,
  HeartHandshake,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DistanceType, RunnerState, TestRecord } from '../types';
import { 
  STANDARD_DISTANCES, 
  calculateVDOT, 
  calculateTrainingPaces, 
  calculateHeartRateZones, 
  calculateEnvironmentalAdjustment,
  formatPace, 
  formatTime 
} from '../lib/vdotCalculator';
import { calculateVdotReadiness } from '../lib/runWalkEngine';


interface VdotCalculatorTabProps {
  runnerState: RunnerState;
  onUpdateRunnerState: (updatedState: Partial<RunnerState>) => void;
  onAddTestRecord: (record: TestRecord) => void;
  onOpenAthleteModal: () => void;
}

export const VdotCalculatorTab: React.FC<VdotCalculatorTabProps> = ({
  runnerState,
  onUpdateRunnerState,
  onAddTestRecord,
  onOpenAthleteModal,
}) => {
  const isTransitionUser = runnerState.level === 'sedentary_transition' || runnerState.activityProfile === 'sedentary';
  const isUncalibrated = !isTransitionUser && (runnerState.isCalibrated === false || (runnerState.currentVdot || 0) <= 0);
  const readiness = calculateVdotReadiness(runnerState);


  // Test Input State
  const [selectedDistance, setSelectedDistance] = useState<DistanceType>('5k');
  const [customDistanceMeters, setCustomDistanceMeters] = useState<number>(5000);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(22);
  const [seconds, setSeconds] = useState<number>(30);
  const [hasCustomTestInput, setHasCustomTestInput] = useState<boolean>(false);

  // Field Tests State
  const [activeTestTab, setActiveTestTab] = useState<'race' | 'cooper' | '2400m'>('race');
  const [cooperMeters, setCooperMeters] = useState<number>(2600);
  const [test2400Minutes, setTest2400Minutes] = useState<number>(10);
  const [test2400Seconds, setTest2400Seconds] = useState<number>(30);

  // Environmental state
  const [tempC, setTempC] = useState<number>(20);
  const [humidityPct, setHumidityPct] = useState<number>(55);
  const [altitudeM, setAltitudeM] = useState<number>(600);

  // Success indicator for saving
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Calculate Distance in meters
  const distObj = STANDARD_DISTANCES.find(d => d.id === selectedDistance);
  const distanceMeters = selectedDistance === 'custom' ? customDistanceMeters : (distObj?.meters || 5000);
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

  // Calculated VDOT based on user test input or runnerState
  let testCalculatedVdot = 0;
  if (activeTestTab === 'race' && totalSeconds > 0) {
    testCalculatedVdot = calculateVDOT(distanceMeters, totalSeconds);
  } else if (activeTestTab === 'cooper' && cooperMeters > 500) {
    const vo2 = Math.max(15, (cooperMeters - 504.9) / 44.73);
    testCalculatedVdot = Math.round(vo2 * 10) / 10;
  } else if (activeTestTab === '2400m') {
    const tMin = test2400Minutes + (test2400Seconds / 60);
    const vo2 = Math.max(15, 85.95 - (3.079 * tMin));
    testCalculatedVdot = Math.round(vo2 * 10) / 10;
  }

  // Active VDOT priority: If user is actively typing/simulating a test, show testCalculatedVdot.
  // Otherwise, use runnerState.currentVdot. If uncalibrated and no custom input, it's 0.
  let activeVdot = 0;
  if (hasCustomTestInput && testCalculatedVdot > 0) {
    activeVdot = testCalculatedVdot;
  } else if (runnerState.currentVdot && runnerState.currentVdot > 0) {
    activeVdot = runnerState.currentVdot;
  } else if (testCalculatedVdot > 0) {
    activeVdot = testCalculatedVdot;
  }

  const effectiveMaxHr = runnerState.macHR || runnerState.maxHr || 188;
  const effectiveRestHr = runnerState.restHR || runnerState.restingHr || 52;

  // Paces & Heart Rates (fallback to 40 only if calculating display for 0)
  const displayVdot = activeVdot > 0 ? activeVdot : 40.0;
  const trainingPaces = calculateTrainingPaces(displayVdot, effectiveMaxHr, effectiveRestHr);
  const hrZones = calculateHeartRateZones(effectiveMaxHr, effectiveRestHr);
  const envAdj = calculateEnvironmentalAdjustment(displayVdot, tempC, humidityPct, altitudeM);

  // Athletic Category Tier
  const getVdotCategory = (v: number) => {
    if (v <= 0) return { label: 'Não Calibrado (Zerado)', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/30' };
    if (v < 35) return { label: 'Iniciante', color: 'text-slate-400', bg: 'bg-slate-800/80', border: 'border-slate-700' };
    if (v < 42) return { label: 'Intermediário Base', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' };
    if (v < 50) return { label: 'Intermediário Avançado', color: 'text-[#FF4E00]', bg: 'bg-[#FF4E00]/10', border: 'border-[#FF4E00]/30' };
    if (v < 58) return { label: 'Avançado / Competitivo', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/30' };
    if (v < 66) return { label: 'Sub-Elite / Alta Performance', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/30' };
    return { label: 'Elite Internacional', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/30' };
  };

  const vdotTier = getVdotCategory(activeVdot);

  const handleSaveVdot = () => {
    const vdotToSave = activeVdot > 0 ? activeVdot : testCalculatedVdot;
    if (vdotToSave <= 0) return;

    onUpdateRunnerState({
      currentVdot: vdotToSave,
      currentVo2max: vdotToSave,
      isCalibrated: true,
      calibrationSource: `Teste de Campo: ${activeTestTab.toUpperCase()}`
    });

    const newRecord: TestRecord = {
      id: `test-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: activeTestTab === 'cooper' ? 'cooper' : activeTestTab === '2400m' ? '2400m' : 'race',
      value: activeTestTab === 'cooper' ? cooperMeters : activeTestTab === '2400m' ? (test2400Minutes * 60 + test2400Seconds) : vdotToSave,
      vo2max: vdotToSave,
      vdot: vdotToSave,
      location: 'Teste Calibrado PaceLab',
      notes: `Calibração oficial de VDOT: ${vdotToSave.toFixed(1)} via ${activeTestTab}.`
    };

    onAddTestRecord(newRecord);
    setSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  // SVG Gauge calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const gaugePercent = activeVdot > 0 
    ? Math.min(100, Math.max(0, ((activeVdot - 15) / (85 - 15)) * 100))
    : 0;
  const strokeDashoffset = circumference - (gaugePercent / 100) * circumference * 0.75; // 270 deg arc

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Transition / Protective Banner for Run-Walk and Sedentary athletes */}
      {isTransitionUser && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#0E1A14] to-emerald-950/50 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-emerald-300 font-heading">
                    {readiness.stageTitle}
                  </span>
                  <span className="text-[10px] uppercase font-mono-data bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded font-bold">
                    Proteção Fisiológica Ativa
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  O sistema VDOT tradicional de Jack Daniels é projetado para corrida contínua consolidada e começa no índice ~30 (5 km em ~30 min). 
                  Para o seu estágio atual, <strong>fazer um teste all-out traria risco elevado de canelite e lesão de tendões</strong>. 
                  Seu foco atual é acumular adaptação mecânica pelo método Caminha-Corre!
                </p>
              </div>
            </div>

            <div className="bg-[#050505] p-3 rounded-xl border border-white/10 text-center min-w-[140px] flex-shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono-data block">Prontidão VDOT</span>
              <span className="text-2xl font-black font-mono-data text-emerald-400">{readiness.readinessPercentage}%</span>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${readiness.readinessPercentage}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Flame className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{readiness.coachRecommendation}</span>
            </div>
            <button
              onClick={() => {
                onUpdateRunnerState({ level: 'beginner', isCalibrated: true, currentVdot: 32 });
              }}
              className="text-[11px] text-slate-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer whitespace-nowrap self-end sm:self-auto"
            >
              Já consigo correr 3 km contínuos (Desbloquear VDOT agora)
            </button>
          </div>
        </div>
      )}

      {/* Uncalibrated Status Banner */}
      {isUncalibrated && (

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#18110D] to-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300 font-heading">
                  Zonas e Testes: Sistema Zerado
                </span>
                <span className="text-[10px] uppercase font-mono-data bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Aguardando Calibração
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Os dados foram zerados. Você pode <strong>preencher a Ficha do Atleta</strong>, <strong>enviar arquivos .GPX/.TCX/.FIT</strong> de treinos recentes, ou simular seu tempo de prova / teste de campo abaixo para calibrar suas zonas.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAthleteModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-heading flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            Calibrar na Ficha do Atleta
          </button>
        </div>
      )}

      {/* Header section & Athlete Biometrics Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider font-mono-data">
            <Gauge className="w-4 h-4" />
            Metodologia Científica Jack Daniels & Karvonen
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-heading">
            Zonas de Pace & Testes de Campo
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Ritmos fisiológicos de corrida (Paces E, M, T, I, R) e zonas cardíacas sincronizados com a Ficha do Atleta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/10 text-xs flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono-data block">Atleta</span>
              <span className="font-bold text-white truncate max-w-[140px] block">{runnerState.name || 'Atleta'}</span>
            </div>
            <div className="border-l border-white/10 pl-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono-data block">FC Máx / Rep</span>
              <span className="font-bold text-[#FF4E00] font-mono-data">{effectiveMaxHr} / {effectiveRestHr} bpm</span>
            </div>
          </div>

          <button
            id="btn-edit-athlete-quick"
            onClick={onOpenAthleteModal}
            className="px-4 py-2.5 rounded-xl bg-[#FF4E00]/10 hover:bg-[#FF4E00]/20 border border-[#FF4E00]/40 text-[#FF4E00] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ficha do Atleta</span>
          </button>
        </div>
      </div>

      {/* Top 2-Columns HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test & Field Inputs (5 cols) */}
        <div className="lg:col-span-5 telemetry-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Test sub-tabs */}
            <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => { setActiveTestTab('race'); setHasCustomTestInput(true); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTestTab === 'race'
                    ? 'bg-[#FF4E00] text-white shadow-sm shadow-[#FF4E00]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tempo em Prova
              </button>
              <button
                onClick={() => { setActiveTestTab('cooper'); setHasCustomTestInput(true); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTestTab === 'cooper'
                    ? 'bg-[#FF4E00] text-white shadow-sm shadow-[#FF4E00]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cooper (12 min)
              </button>
              <button
                onClick={() => { setActiveTestTab('2400m'); setHasCustomTestInput(true); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTestTab === '2400m'
                    ? 'bg-[#FF4E00] text-white shadow-sm shadow-[#FF4E00]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Teste 2.400m
              </button>
            </div>

            {/* Test 1: Race Time */}
            {activeTestTab === 'race' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    DISTÂNCIA DO TESTE / PROVA
                  </label>
                  <select
                    value={selectedDistance}
                    onChange={(e) => {
                      setSelectedDistance(e.target.value as DistanceType);
                      setHasCustomTestInput(true);
                    }}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:border-[#FF4E00]"
                  >
                    <option value="1500m">1.500m (Pista)</option>
                    <option value="1mile">1 Milha (1.609m)</option>
                    <option value="3000m">3.000m (3k)</option>
                    <option value="5k">5 km (5.000m) — Padrão Ouro</option>
                    <option value="10k">10 km (10.000m)</option>
                    <option value="15k">15 km</option>
                    <option value="half_marathon">Meia Maratona (21.097m)</option>
                    <option value="marathon">Maratona (42.195m)</option>
                    <option value="custom">Personalizado (Metros)</option>
                  </select>
                </div>

                {selectedDistance === 'custom' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Metros Exatos</label>
                    <input
                      type="number"
                      value={customDistanceMeters}
                      onChange={(e) => {
                        setCustomDistanceMeters(parseInt(e.target.value) || 1000);
                        setHasCustomTestInput(true);
                      }}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono-data"
                    />
                  </div>
                )}

                {/* Time Inputs */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span>TEMPO DO TESTE (H : M : S)</span>
                    <span className="text-xs font-mono-data text-[#FF4E00] font-bold">
                      {formatTime(totalSeconds, totalSeconds >= 3600)}
                    </span>
                  </label>

                  <div className="grid grid-cols-3 gap-2 font-mono-data text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">HORAS</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={hours}
                        onChange={(e) => {
                          setHours(Math.max(0, parseInt(e.target.value) || 0));
                          setHasCustomTestInput(true);
                        }}
                        className="w-full bg-[#121214] border border-white/10 rounded-xl px-2 py-2 text-center text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">MINUTOS</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(e) => {
                          setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)));
                          setHasCustomTestInput(true);
                        }}
                        className="w-full bg-[#121214] border border-white/10 rounded-xl px-2 py-2 text-center text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">SEGUNDOS</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={seconds}
                        onChange={(e) => {
                          setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)));
                          setHasCustomTestInput(true);
                        }}
                        className="w-full bg-[#121214] border border-white/10 rounded-xl px-2 py-2 text-center text-white font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test 2: Cooper */}
            {activeTestTab === 'cooper' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    DISTÂNCIA PERCORRIDA EM 12 MINUTOS (METROS)
                  </label>
                  <input
                    type="number"
                    min="800"
                    max="5000"
                    step="50"
                    value={cooperMeters}
                    onChange={(e) => {
                      setCooperMeters(parseInt(e.target.value) || 2000);
                      setHasCustomTestInput(true);
                    }}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono-data font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 font-mono-data">
                    Fórmula Cooper: VO2 = ({cooperMeters} - 504.9) / 44.73
                  </span>
                </div>
              </div>
            )}

            {/* Test 3: 2.400m */}
            {activeTestTab === '2400m' && (
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  TEMPO PARA 2.400 METROS (6 VOLTAS NA PISTA)
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono-data text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">MINUTOS</span>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={test2400Minutes}
                      onChange={(e) => {
                        setTest2400Minutes(parseInt(e.target.value) || 10);
                        setHasCustomTestInput(true);
                      }}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-2 py-2 text-center text-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">SEGUNDOS</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={test2400Seconds}
                      onChange={(e) => {
                        setTest2400Seconds(parseInt(e.target.value) || 0);
                        setHasCustomTestInput(true);
                      }}
                      className="w-full bg-[#121214] border border-white/10 rounded-xl px-2 py-2 text-center text-white font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Safety Rules Panel */}
            <div className="p-3 rounded-xl bg-[#050505] border border-white/5 space-y-2 text-[11px]">
              <div className="text-[#FF4E00] font-bold uppercase tracking-wider flex items-center gap-1 font-mono-data">
                <ShieldAlert className="w-3.5 h-3.5" />
                Diretrizes de Proteção Fisiológica
              </div>
              <div className="space-y-1 text-slate-400">
                <div>• <strong>Teto de Tiros (≤ 8%)</strong>: Máximo de {((runnerState.weeklyVolume || 40) * 0.08).toFixed(1)} km em ritmos I e R por semana.</div>
                <div>• <strong>Volume Ficha do Atleta</strong>: {runnerState.weeklyVolume || 0} km/semana ({runnerState.trainingDays || 4} dias de treino).</div>
                <div>• <strong>Alerta Articular</strong>: {runnerState.injuries || 'Nenhuma lesão ativa relatada.'}</div>
              </div>
            </div>
          </div>

          {/* Action to Save */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              VDOT Ativo: <strong className="text-[#FF4E00] font-mono-data text-sm">{activeVdot > 0 ? activeVdot.toFixed(1) : 'Zerado'}</strong>
            </span>
            <button
              id="btn-save-vdot"
              onClick={handleSaveVdot}
              disabled={activeVdot <= 0 && testCalculatedVdot <= 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                  : activeVdot > 0 || testCalculatedVdot > 0
                  ? 'bg-[#FF4E00] hover:bg-[#E03E00] text-white shadow-[#FF4E00]/25'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VDOT SALVO!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>APLICAR AO MEU PERFIL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Neon Circular Gauge & Telemetry (7 cols) */}
        <div className="lg:col-span-7 telemetry-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#120E0B]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  Indicador de Potência Aeróbica (VDOT / VO2Max)
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border font-mono-data ${vdotTier.color} ${vdotTier.bg} ${vdotTier.border}`}>
                {vdotTier.label}
              </span>
            </div>

            {/* Central SVG Circular Gauge + Big Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-135" viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#1E1E24"
                    strokeWidth="12"
                    strokeDasharray={circumference * 0.75}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#FF4E00"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(255, 78, 0, 0.6))',
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-mono-data text-slate-400">
                    {activeVdot > 0 ? 'VDOT ATIVO' : 'STATUS'}
                  </span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
                    {activeVdot > 0 ? activeVdot.toFixed(1) : '--'}
                  </span>
                  <span className="text-[10px] font-mono-data text-slate-400">
                    {activeVdot > 0 ? `VO2 ~${(activeVdot * 1.02).toFixed(1)} ml/kg` : 'Perfil Zerado'}
                  </span>
                </div>
              </div>

              {/* Threshold & Marathon Key Metrics */}
              <div className="space-y-3 flex-1 w-full">
                <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Pace de Limiar (Zona T / Threshold)
                  </div>
                  <div className="text-xl font-bold text-amber-400 font-mono-data">
                    {activeVdot > 0 ? trainingPaces.find(p => p.key === 'T')?.formattedPaceKm : '--:--/km'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Esforço sustentável por ~60 min (88% a 92% FCmax)
                  </div>
                </div>

                <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Pace de Maratona (Zona M)
                  </div>
                  <div className="text-xl font-bold text-blue-400 font-mono-data">
                    {activeVdot > 0 ? trainingPaces.find(p => p.key === 'M')?.formattedPaceKm : '--:--/km'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sustentação aeróbica estável para 42.195m
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Telemetry Adjuster */}
          <div className="mt-4 pt-3 border-t border-white/10 bg-[#050505] -mx-6 -mb-6 p-4 rounded-b-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Compensação de Clima & Altitude</span>
              </div>
              <span className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded ${
                envAdj.paceAdjustmentPct > 0 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                  : 'bg-white/5 text-slate-400'
              }`}>
                {envAdj.paceAdjustmentPct > 0 ? `+${envAdj.paceAdjustmentPct}% no Pace (VDOT Efetivo: ${envAdj.adjustedVdot})` : 'Condições Ideais (Sem penalidade)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Temp: {tempC}°C</label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={tempC}
                  onChange={(e) => setTempC(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg accent-[#FF4E00]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Umidade: {humidityPct}%</label>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={humidityPct}
                  onChange={(e) => setHumidityPct(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg accent-[#FF4E00]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Altitude: {altitudeM}m</label>
                <input
                  type="range"
                  min="0"
                  max="3500"
                  step="100"
                  value={altitudeM}
                  onChange={(e) => setAltitudeM(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded-lg accent-[#FF4E00]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Physiological Training Paces Cards (E, M, T, I, R) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white font-heading uppercase tracking-wider">
              As 5 Zonas de Ritmo Jack Daniels {activeVdot > 0 ? `(VDOT ${activeVdot.toFixed(1)})` : '(Aguardando Calibração)'}
            </h3>
            <p className="text-xs text-slate-400">
              Parciais exatas de 200m, 400m, 800m e 1.000m calculadas para o perfil fisiológico atual.
            </p>
          </div>
          <span className="text-xs font-mono-data text-slate-400 bg-[#121214] px-3 py-1 rounded-lg border border-white/10">
            FC MÁX: <strong className="text-white">{effectiveMaxHr} BPM</strong> | FC REP: <strong className="text-white">{effectiveRestHr} BPM</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {trainingPaces.map((zone) => {
            const badgeBg = {
              E: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30',
              M: 'bg-blue-950/40 text-blue-400 border-blue-500/30',
              T: 'bg-amber-950/40 text-amber-400 border-amber-500/30',
              I: 'bg-rose-950/40 text-rose-400 border-rose-500/30',
              R: 'bg-purple-950/40 text-purple-400 border-purple-500/30',
            }[zone.key];

            return (
              <div
                key={zone.key}
                className="telemetry-card rounded-2xl p-4 border border-white/10 hover:border-[#FF4E00]/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono-data ${badgeBg}`}>
                      ZONA {zone.key}
                    </span>
                    <span className="text-[10px] font-mono-data text-slate-400">
                      {zone.hrPercentRange}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{zone.name}</h4>
                  <p className="text-[11px] text-slate-400 mb-2">{zone.subname}</p>

                  {/* Pace display */}
                  <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5 text-center mb-2.5">
                    <span className="text-[10px] uppercase font-mono-data text-slate-500 block">RITMO MIN/KM</span>
                    <span className="text-lg sm:text-xl font-bold text-white font-mono-data block mt-0.5">
                      {activeVdot > 0 ? zone.formattedPaceKm : '--:--'}
                    </span>
                    <span className="text-[10px] text-[#FF4E00] font-mono-data block mt-0.5">
                      {zone.hrBpmRange[0]} - {zone.hrBpmRange[1]} BPM
                    </span>
                  </div>

                  {/* Splits */}
                  <div className="space-y-1 bg-[#050505] p-2 rounded-lg border border-white/5 text-xs font-mono-data">
                    {zone.splits.m200 && (
                      <div className="flex justify-between text-slate-400">
                        <span>200m:</span>
                        <strong className="text-slate-200">{activeVdot > 0 ? zone.splits.m200 : '--:--'}</strong>
                      </div>
                    )}
                    {zone.splits.m400 && (
                      <div className="flex justify-between text-slate-400">
                        <span>400m:</span>
                        <strong className="text-slate-200">{activeVdot > 0 ? zone.splits.m400 : '--:--'}</strong>
                      </div>
                    )}
                    {zone.splits.m800 && (
                      <div className="flex justify-between text-slate-400">
                        <span>800m:</span>
                        <strong className="text-slate-200">{activeVdot > 0 ? zone.splits.m800 : '--:--'}</strong>
                      </div>
                    )}
                    {zone.splits.m1000 && (
                      <div className="flex justify-between text-slate-400">
                        <span>1000m:</span>
                        <strong className="text-slate-200">{activeVdot > 0 ? zone.splits.m1000 : '--:--'}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic pt-2 border-t border-white/5">
                  {zone.purpose}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heart Rate Zones Karvonen */}
      <div className="telemetry-card p-5 rounded-2xl border border-white/10 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading uppercase tracking-wider">
            Zonas Cardíacas Fisiológicas (Fórmula Karvonen / Reserva de FC)
          </h3>
          <p className="text-xs text-slate-400 font-mono-data">
            FCR = FC Máx ({effectiveMaxHr} bpm) - FC Repouso ({effectiveRestHr} bpm) = {effectiveMaxHr - effectiveRestHr} bpm de Reserva Cardíaca
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {hrZones.map((z) => (
            <div
              key={z.zone}
              className="bg-[#121214] p-3 rounded-xl border border-white/10 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono-data">
                <span className="font-bold text-white">ZONA {z.zone}</span>
                <span className="text-slate-400">{z.pctRange}</span>
              </div>
              <div className="text-lg font-bold text-[#FF4E00] font-mono-data">
                {z.bpmMin} - {z.bpmMax} <span className="text-xs text-slate-400 font-normal">BPM</span>
              </div>
              <p className="text-[11px] text-slate-300">{z.name.split('—')[1] || z.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
