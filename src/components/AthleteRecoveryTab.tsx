import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Activity, 
  Moon, 
  Droplet, 
  BatteryCharging, 
  ShieldAlert, 
  TrendingUp, 
  User, 
  Save, 
  CheckCircle2, 
  Flame,
  AlertTriangle,
  Coffee,
  Heart,
  Scale,
  Calendar,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RunnerState, DailyRecoveryCheckin, TestRecord } from '../types';

interface AthleteRecoveryTabProps {
  runnerState: RunnerState;
  onUpdateRunnerState: (updatedState: Partial<RunnerState>) => void;
  recoveryLogs: DailyRecoveryCheckin[];
  onAddRecoveryLog: (log: DailyRecoveryCheckin) => void;
  testHistory: TestRecord[];
  onAddTestRecord: (test: TestRecord) => void;
  onOpenAthleteModal: () => void;
}

export const AthleteRecoveryTab: React.FC<AthleteRecoveryTabProps> = ({
  runnerState,
  onUpdateRunnerState,
  recoveryLogs,
  onAddRecoveryLog,
  testHistory,
  onAddTestRecord,
  onOpenAthleteModal
}) => {
  const isUncalibrated = runnerState.isCalibrated === false || (runnerState.currentVdot || 0) <= 0;

  // Recovery Check-in Form State
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [hrvMs, setHrvMs] = useState<number>(65);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(2);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [hydrationQuality, setHydrationQuality] = useState<number>(4);

  // Pain / Injury logging state
  const [painLocation, setPainLocation] = useState<string>('Canela Direita (Tendinite Tibial)');
  const [painIntensity, setPainIntensity] = useState<number>(3);
  const [painType, setPainType] = useState<'muscular' | 'articular' | 'tendinea' | 'ossea'>('tendinea');
  const [painLoggedSuccess, setPainLoggedSuccess] = useState<boolean>(false);

  // Calculate live readiness score
  const calculateReadiness = () => {
    let score = 50;
    score += (Math.min(9, Math.max(4, sleepHours)) - 5) * 4;
    score += (sleepQuality - 3) * 4;
    score += (Math.min(100, Math.max(30, hrvMs)) - 50) * 0.4;
    score -= (muscleSoreness - 2) * 5;
    score -= (stressLevel - 2) * 5;
    score += (hydrationQuality - 3) * 3;

    return Math.max(15, Math.min(100, Math.round(score)));
  };

  const liveReadiness = calculateReadiness();

  const getReadinessStatus = (score: number) => {
    if (score >= 85) {
      return {
        status: 'OPTIMAL',
        label: 'PRONTIDÃO ÓTIMA (100% LIBERADO)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/30 border-emerald-500/40',
        rec: 'Sistema nervoso autônomo plenamente equilibrado e reservas de glicogênio restauradas. Excelente dia para treinos intensos (Pace T / I).'
      };
    }
    if (score >= 70) {
      return {
        status: 'MODERATE',
        label: 'PRONTIDÃO MODERADA',
        color: 'text-[#FF4E00]',
        bg: 'bg-[#18110D] border-[#FF4E00]/40',
        rec: 'Corpo em boa condição, com leve fadiga acumulada. Treinos em ritmo aeróbico Z2 (Pace E) ou limiar controlado liberados.'
      };
    }
    if (score >= 50) {
      return {
        status: 'FATIGUE',
        label: 'FADIGA ACUMULADA (ATENÇÃO)',
        color: 'text-amber-400',
        bg: 'bg-amber-950/30 border-amber-500/40',
        rec: 'Sinais de estresse fisiológico ou sono insuficiente. Recomenda-se reduzir o volume em 30% ou realizar apenas trote regenerativo em Z1.'
      };
    }
    return {
      status: 'REST_REQUIRED',
      label: 'ALTO RISCO DE LESÃO / REPOUSO',
      color: 'text-rose-400',
      bg: 'bg-rose-950/30 border-rose-500/40',
      rec: 'Sobrecarga aguda crítica. Evite treinos fortes hoje. Priorize sono restaurador, hidratação e mobilidade leve.'
    };
  };

  const readinessInfo = getReadinessStatus(liveReadiness);

  // Submit Recovery Log
  const handleLogRecovery = () => {
    const newLog: DailyRecoveryCheckin = {
      date: new Date().toISOString().split('T')[0],
      sleepHours,
      sleepQuality,
      hrvMs,
      muscleSoreness,
      stressLevel,
      hydrationQuality,
      readinessScore: liveReadiness,
      status: readinessInfo.status as any,
      recommendation: readinessInfo.rec
    };

    onAddRecoveryLog(newLog);
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 }
    });
  };

  // Submit Pain Report
  const handleSavePainReport = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedInjuries = runnerState.injuries 
      ? `${runnerState.injuries}; ${painLocation} (Nível ${painIntensity}/10)` 
      : `${painLocation} (Nível ${painIntensity}/10)`;

    onUpdateRunnerState({
      injuries: updatedInjuries
    });

    setPainLoggedSuccess(true);
    setTimeout(() => setPainLoggedSuccess(false), 3000);
  };

  // Nutrition & Biometrics
  const athleteWeight = runnerState.weight || runnerState.weightKg || 70;
  const athleteHeight = runnerState.heightCm || runnerState.height || 175;
  const bmi = athleteHeight > 0 ? (athleteWeight / Math.pow(athleteHeight / 100, 2)).toFixed(1) : '22.8';
  
  const sweatRateMlPerHour = Math.round(athleteWeight * 10.5); // ~735 ml/h
  const sodiumMgPerHour = Math.round(sweatRateMlPerHour * 0.85); // ~625 mg

  const maxHr = runnerState.macHR || runnerState.maxHr || 188;
  const restHr = runnerState.restHR || runnerState.restingHr || 52;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Uncalibrated Banner */}
      {isUncalibrated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#18110D] to-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300 font-heading">
                  Módulo de Recuperação & Fisiologia: Dados Zerados
                </span>
                <span className="text-[10px] uppercase font-mono-data bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Aguardando Check-in
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Atualize seus dados biométricos (Peso, FC Repouso, Carga Semanal) na Ficha do Atleta e registre seu primeiro check-in diário para calibrar a taxa de suor, reposição eletrolítica e prontidão.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAthleteModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-heading flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            Ficha do Atleta
          </button>
        </div>
      )}

      {/* Athlete Biometric Profile Snapshot Bar */}
      <div className="telemetry-card rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-sm">
            <User className="w-4 h-4 text-[#FF4E00]" />
            <span>Perfil Biométrico do Atleta • Sincronizado</span>
          </div>
          <button
            onClick={onOpenAthleteModal}
            className="text-xs font-bold text-[#FF4E00] hover:underline flex items-center gap-1 cursor-pointer w-fit"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Editar Dados da Ficha</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono-data uppercase block">Peso & Altura</span>
            <span className="text-sm font-bold text-white font-mono-data mt-0.5 block">
              {athleteWeight} kg • {athleteHeight} cm
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono-data uppercase block">IMC Corporal</span>
            <span className="text-sm font-bold text-emerald-400 font-mono-data mt-0.5 block">
              {bmi} kg/m²
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono-data uppercase block">FC Repouso</span>
            <span className="text-sm font-bold text-blue-400 font-mono-data mt-0.5 block">
              {restHr} bpm
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono-data uppercase block">FC Máxima</span>
            <span className="text-sm font-bold text-[#FF4E00] font-mono-data mt-0.5 block">
              {maxHr} bpm
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono-data uppercase block">Volume Declarado</span>
            <span className="text-sm font-bold text-amber-400 font-mono-data mt-0.5 block">
              {runnerState.weeklyVolume || 0} km/sem
            </span>
          </div>

          <div className="bg-[#121214] p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono-data uppercase block">Frequência</span>
            <span className="text-sm font-bold text-slate-200 font-mono-data mt-0.5 block">
              {runnerState.trainingDays || 4} dias/sem
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Pain & Biomechanical Health (5 cols) */}
        <div className="lg:col-span-5 telemetry-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-heading text-white">
                  Mapeamento de Dores & Lesões
                </h3>
              </div>
              <span className="text-[10px] font-mono-data text-[#FF4E00] bg-[#FF4E00]/10 px-2 py-0.5 rounded border border-[#FF4E00]/30 uppercase">
                PREVENÇÃO
              </span>
            </div>

            <form onSubmit={handleSavePainReport} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Local da Dor / Desconforto</label>
                <input
                  type="text"
                  value={painLocation}
                  onChange={(e) => setPainLocation(e.target.value)}
                  placeholder="Ex: Canela direita, Joelho anterior, Fáscia plantar"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4E00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Tipo de Tecido</label>
                  <select
                    value={painType}
                    onChange={(e) => setPainType(e.target.value as any)}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-2 py-1.5 text-white"
                  >
                    <option value="tendinea">Tendínea (Tendão)</option>
                    <option value="muscular">Muscular (Sobrecarga)</option>
                    <option value="articular">Articular (Cartilagem)</option>
                    <option value="ossea">Óssea / Canelite</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Intensidade (1 a 10)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={painIntensity}
                      onChange={(e) => setPainIntensity(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#222] rounded accent-[#FF4E00]"
                    />
                    <span className="text-xs font-bold text-[#FF4E00] font-mono-data w-5 text-right">
                      {painIntensity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Injury history display */}
              <div className="bg-[#050505] p-3 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-mono-data block">Histórico Registrado:</span>
                <p className="text-xs text-slate-300">
                  {runnerState.injuries || 'Nenhuma dor ou lesão ativa registrada no momento.'}
                </p>
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-bold font-mono-data uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  painLoggedSuccess
                    ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                    : 'bg-[#FF4E00] hover:bg-[#E03E00] text-white shadow-[#FF4E00]/20'
                }`}
              >
                {painLoggedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>REGISTRADO COM SUCESSO!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>REGISTRAR / ATUALIZAR DOR</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Daily Recovery & Readiness Score System (7 cols) */}
        <div className="lg:col-span-7 telemetry-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
                  Prontidão Diária & Monitoramento de Recuperação
                </h3>
              </div>
              <span className="text-[10px] font-mono-data text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                READINESS INDEX
              </span>
            </div>

            {/* Main Score Visual Card */}
            <div className={`p-4 rounded-2xl border ${readinessInfo.bg} mb-4 flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#050505] border border-white/10 flex flex-col items-center justify-center p-2 text-center shadow-inner">
                  <span className="text-3xl font-black font-mono-data text-white">
                    {liveReadiness}%
                  </span>
                  <span className="text-[9px] font-mono-data text-slate-400 uppercase">SCORE HOJE</span>
                </div>
                <div>
                  <span className={`text-xs font-bold font-mono-data tracking-wider block ${readinessInfo.color}`}>
                    {readinessInfo.label}
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-md">
                    {readinessInfo.rec}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogRecovery}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono-data text-xs uppercase tracking-wider rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
              >
                REGISTRAR CHECK-IN
              </button>
            </div>

            {/* Recovery Input Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#121214] p-4 rounded-2xl border border-white/5 text-xs">
              <div>
                <label className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5 text-[#FF4E00]" /> Sono (Horas):</span>
                  <span className="text-[#FF4E00] font-mono-data font-bold">{sleepHours}h ({sleepQuality}/5)</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded accent-[#FF4E00] mb-2"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> VFC / HRV (ms):</span>
                  <span className="text-emerald-400 font-mono-data font-bold">{hrvMs} ms</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="110"
                  value={hrvMs}
                  onChange={(e) => setHrvMs(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded accent-emerald-400 mb-2"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-rose-400" /> Dor Muscular (DOMS):</span>
                  <span className="text-rose-400 font-mono-data font-bold">{muscleSoreness}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={muscleSoreness}
                  onChange={(e) => setMuscleSoreness(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded accent-rose-400 mb-2"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-blue-400" /> Hidratação & Urina:</span>
                  <span className="text-blue-400 font-mono-data font-bold">{hydrationQuality}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={hydrationQuality}
                  onChange={(e) => setHydrationQuality(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded accent-blue-400 mb-2"
                />
              </div>
            </div>
          </div>

          {/* ACWR Sweet Spot Telemetry Bar */}
          <div className="pt-3 border-t border-white/10 bg-[#050505] -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300 font-mono-data flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF4E00]" />
                RELAÇÃO CARGA AGUDA / CRÔNICA (ACWR)
              </span>
              <span className="text-emerald-400 font-bold font-mono-data">
                {runnerState.weeklyVolume && runnerState.weeklyVolume > 0 ? '1.08 (Sweet Spot: 0.8 - 1.3)' : 'Aguardando Dados'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O volume semanal atual de {runnerState.weeklyVolume || 0} km mantém o atleta na zona segura de adaptação neuromuscular com risco controlado de sobrecarga.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Check-in Logs History Table */}
      {recoveryLogs.length > 0 && (
        <div className="telemetry-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
                Histórico de Check-ins de Recuperação
              </h3>
            </div>
            <span className="text-xs font-mono-data text-slate-400">
              {recoveryLogs.length} Registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-data">
              <thead>
                <tr className="border-b border-white/10 bg-[#121214] text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">DATA</th>
                  <th className="py-2.5 px-3">SCORE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">SONO</th>
                  <th className="py-2.5 px-3">HRV</th>
                  <th className="py-2.5 px-3">DOMS</th>
                  <th className="py-2.5 px-3 font-sans">RECOMENDAÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recoveryLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] text-slate-300">
                    <td className="py-2 px-3 font-bold text-white">{log.date}</td>
                    <td className="py-2 px-3 font-bold text-emerald-400">{log.readinessScore}%</td>
                    <td className="py-2 px-3 font-semibold">{log.status}</td>
                    <td className="py-2 px-3">{log.sleepHours}h</td>
                    <td className="py-2 px-3">{log.hrvMs} ms</td>
                    <td className="py-2 px-3">{log.muscleSoreness}/5</td>
                    <td className="py-2 px-3 font-sans text-slate-400">{log.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Race Nutrition & Hydration Strategy Matrix */}
      <div className="telemetry-card rounded-2xl p-5 border border-white/10 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Coffee className="w-4 h-4" />
            <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
              Calculadora de Nutrição & Hidratação de Corrida PaceLab
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Estimativas baseadas no peso de {athleteWeight} kg do atleta para provas longas e treinos chave
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] font-mono-data text-slate-400 uppercase block">TAXA ESTIMADA DE SUOR</span>
            <div className="text-2xl font-bold font-mono-data text-[#FF4E00] my-1">
              ~{sweatRateMlPerHour} <span className="text-xs font-normal text-slate-400">ml / hora</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Repor entre 150ml e 200ml a cada 15-20 minutos de prova.
            </p>
          </div>

          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] font-mono-data text-slate-400 uppercase block">CARBOIDRATOS / HORA</span>
            <div className="text-2xl font-bold font-mono-data text-amber-400 my-1">
              45 - 60 <span className="text-xs font-normal text-slate-400">g CHO / h</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Equivale a 1 gel (25-30g CHO) a cada 30 a 40 minutos com água pura.
            </p>
          </div>

          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] font-mono-data text-slate-400 uppercase block">SÓDIO / ELETRÓLITOS</span>
            <div className="text-2xl font-bold font-mono-data text-emerald-400 my-1">
              ~{sodiumMgPerHour} <span className="text-xs font-normal text-slate-400">mg / hora</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cápsulas de sal ou isotônicos para prevenir câimbras e hiponatremia em dias quentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
