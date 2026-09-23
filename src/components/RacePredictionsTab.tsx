import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  ChevronRight, 
  Sliders, 
  Printer, 
  Edit2, 
  Check,
  User,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { DistanceType, RunnerState, RacePrediction } from '../types';
import { 
  generateRacePredictions, 
  formatPace, 
  formatTime 
} from '../lib/vdotCalculator';

interface RacePredictionsTabProps {
  runnerState: RunnerState;
  onUpdateRunnerState: (updatedState: Partial<RunnerState>) => void;
  onOpenWristbandModal: () => void;
  onOpenAthleteModal: () => void;
}

export const RacePredictionsTab: React.FC<RacePredictionsTabProps> = ({
  runnerState,
  onUpdateRunnerState,
  onOpenWristbandModal,
  onOpenAthleteModal
}) => {
  const isUncalibrated = runnerState.isCalibrated === false || (runnerState.currentVdot || 0) <= 0;

  const [selectedRace, setSelectedRace] = useState<DistanceType>('half_marathon');
  const [strategy, setStrategy] = useState<'negative' | 'even' | 'conservative' | 'positive'>('negative');
  const [editingPrDistance, setEditingPrDistance] = useState<DistanceType | null>(null);
  const [prInputMinutes, setPrInputMinutes] = useState<string>('');
  const [prInputSeconds, setPrInputSeconds] = useState<string>('');

  // If uncalibrated, use a base of 40 only for calculation table generation fallback
  const effectiveVdot = runnerState.currentVdot > 0 ? runnerState.currentVdot : 40.0;
  const predictions = generateRacePredictions(effectiveVdot, runnerState.prRecords || {});

  const activePred = predictions.find(p => p.distanceId === selectedRace) || predictions[10];

  // Calculate detailed splits for selected race
  const totalKm = Math.round((activePred.meters / 1000) * 10) / 10;
  const numKm = Math.floor(totalKm);
  const baseSecPerKm = activePred.paceSecondsPerKm;

  const splits: Array<{
    km: number;
    paceSec: number;
    formattedPace: string;
    cumulativeSec: number;
    formattedCumulative: string;
    effortPct: number;
    fuelNote?: string;
  }> = [];

  let cumSec = 0;
  for (let k = 1; k <= numKm; k++) {
    let factor = 1.0;
    if (strategy === 'negative') {
      factor = k <= totalKm / 2 ? 1.018 : 0.982;
    } else if (strategy === 'conservative') {
      if (k <= 2) factor = 1.035;
      else if (k > totalKm - 3) factor = 0.975;
      else factor = 1.00;
    } else if (strategy === 'positive') {
      factor = k <= totalKm / 2 ? 0.98 : 1.03;
    }

    const kmPace = baseSecPerKm * factor;
    cumSec += kmPace;

    let fuelNote = undefined;
    if (k % 5 === 0 && k < totalKm - 2) fuelNote = '💧 Água + ⚡ Gel Carboidrato';
    else if (k % 2.5 === 0 || k % 3 === 0) fuelNote = '💧 Hidratação';

    splits.push({
      km: k,
      paceSec: kmPace,
      formattedPace: formatPace(kmPace),
      cumulativeSec: cumSec,
      formattedCumulative: formatTime(cumSec, cumSec >= 3600),
      effortPct: Math.round((baseSecPerKm / kmPace) * 100),
      fuelNote
    });
  }

  // Handle PR saving
  const handleSavePr = (distId: DistanceType) => {
    const mins = parseInt(prInputMinutes) || 0;
    const secs = parseInt(prInputSeconds) || 0;
    const totalPrSec = (mins * 60) + secs;

    if (totalPrSec > 0) {
      onUpdateRunnerState({
        prRecords: {
          ...(runnerState.prRecords || {}),
          [distId]: totalPrSec
        }
      });
    }
    setEditingPrDistance(null);
  };

  const startEditPr = (distId: DistanceType, currentPrSec?: number) => {
    setEditingPrDistance(distId);
    if (currentPrSec && currentPrSec > 0) {
      setPrInputMinutes(Math.floor(currentPrSec / 60).toString());
      setPrInputSeconds((currentPrSec % 60).toString());
    } else {
      setPrInputMinutes('');
      setPrInputSeconds('');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Uncalibrated Status Banner */}
      {isUncalibrated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#18110D] to-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300 font-heading">
                  Previsões de Prova: Perfil Zerado
                </span>
                <span className="text-[10px] uppercase font-mono-data bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Aguardando VDOT Ativo
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Os tempos equivalentes de 400m a 50km serão calculados com precisão matemática assim que o VDOT do atleta for configurado na Ficha do Atleta, nos Testes de Campo ou pela Telemetria de relógio (.GPX / .FIT / .TCX).
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAthleteModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-heading flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            Calibrar VDOT do Atleta
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="telemetry-card rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Tabela de Equivalências de Prova & Previsões VDOT
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>Atleta: <strong className="text-white">{runnerState.name || 'Atleta'}</strong></span>
            <span>•</span>
            <span>VDOT Ativo: <strong className="text-[#FF4E00] font-mono-data">{runnerState.currentVdot > 0 ? runnerState.currentVdot.toFixed(1) : 'Não Calibrado (Zerado)'}</strong></span>
            <span>•</span>
            <span>FC Máxima: <strong className="text-white">{runnerState.macHR || runnerState.maxHr || 190} bpm</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWristbandModal}
            disabled={isUncalibrated}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs font-mono-data uppercase tracking-wider transition-all shadow-md ${
              isUncalibrated
                ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 cursor-pointer'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Gerar Pulseira de Pulso (Pace Band)</span>
          </button>
        </div>
      </div>

      {/* Predictions Master Table */}
      <div className="telemetry-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 bg-[#121214] border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase font-mono-data text-[#FF4E00]">
            PROJEÇÕES OFICIAIS (400M A 50KM) {runnerState.currentVdot > 0 ? `• VDOT ${runnerState.currentVdot.toFixed(1)}` : '• PERFIL ZERADO'}
          </span>
          <span className="text-[11px] font-mono-data text-slate-400">
            Clique em uma distância para simular estratégia de parciais
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono-data">
            <thead>
              <tr className="border-b border-white/10 bg-[#050505] text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4 font-sans font-bold">DISTÂNCIA</th>
                <th className="py-3 px-3">TEMPO PREVISTO</th>
                <th className="py-3 px-3">PACE MÉDIO</th>
                <th className="py-3 px-3">VELOCIDADE</th>
                <th className="py-3 px-3">SEU RECORDE (PR)</th>
                <th className="py-3 px-3">DELTA / GAP</th>
                <th className="py-3 px-3 text-right font-sans">SIMULADOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {predictions.map((p) => {
                const isSelected = p.distanceId === selectedRace;
                const isEditing = editingPrDistance === p.distanceId;
                const hasPr = p.userPrSeconds && p.userPrSeconds > 0;
                const isAheadOfPr = p.deltaSeconds && p.deltaSeconds < 0;

                return (
                  <tr
                    key={p.distanceId}
                    onClick={() => setSelectedRace(p.distanceId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#18110D] text-white border-l-2 border-l-[#FF4E00]'
                        : 'hover:bg-[#121214] text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#FF4E00] shadow-sm shadow-[#FF4E00]' : 'bg-slate-700'}`} />
                        <span>{p.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-sm text-[#FF4E00]">
                      {runnerState.currentVdot > 0 ? p.formattedTime : '--:--'}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {runnerState.currentVdot > 0 ? `${p.formattedPaceKm}/km` : '--:--/km'}
                    </td>

                    <td className="py-3 px-3 text-emerald-400">
                      {runnerState.currentVdot > 0 ? `${p.speedKmh} km/h` : '--'}
                    </td>

                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Min"
                            value={prInputMinutes}
                            onChange={(e) => setPrInputMinutes(e.target.value)}
                            className="w-12 bg-[#050505] border border-white/20 rounded px-1 py-0.5 text-xs text-white"
                          />
                          <span>:</span>
                          <input
                            type="number"
                            placeholder="Sec"
                            value={prInputSeconds}
                            onChange={(e) => setPrInputSeconds(e.target.value)}
                            className="w-12 bg-[#050505] border border-white/20 rounded px-1 py-0.5 text-xs text-white"
                          />
                          <button
                            onClick={() => handleSavePr(p.distanceId)}
                            className="p-1 bg-[#FF4E00] text-white rounded hover:bg-[#E03E00] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className={hasPr ? 'text-slate-200 font-bold' : 'text-slate-500'}>
                            {hasPr ? formatTime(p.userPrSeconds!, p.meters >= 15000) : 'Cadastrar PR'}
                          </span>
                          <button
                            onClick={() => startEditPr(p.distanceId, p.userPrSeconds)}
                            className="text-slate-500 hover:text-[#FF4E00] p-0.5 rounded opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Editar Recorde Pessoal"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {hasPr && runnerState.currentVdot > 0 ? (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          isAheadOfPr 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-[#121214] text-slate-400'
                        }`}>
                          {p.deltaSeconds! < 0 ? `-${formatTime(Math.abs(p.deltaSeconds!))} (Potencial PR!)` : `+${formatTime(p.deltaSeconds!)}`}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${
                        isSelected 
                          ? 'bg-[#FF4E00] text-white' 
                          : 'bg-[#121214] text-slate-400 hover:text-white'
                      }`}>
                        Simular
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Race Pacing Strategy & Splits Breakdown Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Strategy Selector Panel (4 cols) */}
        <div className="lg:col-span-4 telemetry-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
                Estratégia de Ritmo
              </h3>
            </div>

            <div className="bg-[#121214] p-3 rounded-xl border border-white/10 mb-4">
              <span className="text-[10px] uppercase font-mono-data text-slate-400 block mb-1">PROVA EM FOCO:</span>
              <div className="text-lg font-bold text-white font-heading">{activePred.name}</div>
              <div className="text-xs text-[#FF4E00] font-mono-data mt-0.5">
                Meta Prevista: <strong>{runnerState.currentVdot > 0 ? activePred.formattedTime : '--:--'}</strong> ({runnerState.currentVdot > 0 ? `${activePred.formattedPaceKm}/km` : '--:--'})
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 block font-mono-data">
                ESCOLHA O MODELO DE PACING:
              </label>

              {/* Negative Split */}
              <button
                onClick={() => setStrategy('negative')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  strategy === 'negative'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-[#121214] border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-emerald-400 mb-1">
                  <span>SPLIT NEGATIVO (Recomendado)</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">ALTA EFICIÊNCIA</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Primeira metade 1.8% mais conservadora; aceleração progressiva na segunda metade para evitar a acidose precoce.
                </p>
              </button>

              {/* Even Split */}
              <button
                onClick={() => setStrategy('even')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  strategy === 'even'
                    ? 'bg-[#18110D] border-[#FF4E00]/60 text-white shadow-sm shadow-[#FF4E00]/20'
                    : 'bg-[#121214] border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-[#FF4E00] mb-1">
                  <span>EVEN SPLIT (Ritmo Constante)</span>
                  <span className="text-[10px] bg-[#FF4E00]/20 px-1.5 py-0.5 rounded font-mono-data">PLANO</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Mesmo ritmo cravado em cada quilômetro. Ideal para provas com relevo uniforme e clima perfeito.
                </p>
              </button>

              {/* Conservative Start */}
              <button
                onClick={() => setStrategy('conservative')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  strategy === 'conservative'
                    ? 'bg-amber-950/40 border-amber-500/60 text-white shadow-sm shadow-amber-500/20'
                    : 'bg-[#121214] border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs text-amber-400 mb-1">
                  <span>INÍCIO CAUTELOSO / PROGRESSIVO</span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">SEGURANÇA</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Primeiros 2 km mais lentos para controlar a ansiedade da largada, crescendo até o sprint final.
                </p>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <button
              onClick={onOpenWristbandModal}
              disabled={isUncalibrated}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono-data uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-white/10 ${
                isUncalibrated
                  ? 'bg-[#121214] text-slate-600 cursor-not-allowed'
                  : 'bg-[#121214] hover:bg-[#1A1A1D] text-white cursor-pointer'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir Ficha de Pulso</span>
            </button>
          </div>
        </div>

        {/* Splits Matrix Breakdown (8 cols) */}
        <div className="lg:col-span-8 telemetry-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white uppercase tracking-wider">
                    Parciais Quilômetro a Quilômetro & Nutrição
                  </h3>
                  <p className="text-xs text-slate-400">
                    Estratégia: <strong className="text-[#FF4E00]">{strategy.toUpperCase()}</strong>
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono-data bg-[#121214] text-[#FF4E00] border border-white/10 px-2.5 py-1 rounded-lg font-bold">
                {numKm} CHECKPOINTS
              </span>
            </div>

            {/* Splits Table */}
            <div className="max-h-[380px] overflow-y-auto rounded-xl border border-white/10 bg-[#050505]">
              <table className="w-full text-left text-xs border-collapse font-mono-data">
                <thead>
                  <tr className="border-b border-white/10 bg-[#121214] text-slate-400 text-[10px] uppercase sticky top-0">
                    <th className="py-2.5 px-3 font-sans">KM</th>
                    <th className="py-2.5 px-3">PACE DO KM</th>
                    <th className="py-2.5 px-3">TEMPO ACUMULADO</th>
                    <th className="py-2.5 px-3">INTENSIDADE</th>
                    <th className="py-2.5 px-3 text-right font-sans">PONTO NUTRICIONAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {splits.map((s) => (
                    <tr key={s.km} className="hover:bg-white/[0.02] text-slate-300">
                      <td className="py-2 px-3 font-bold text-white font-sans">
                        KM {s.km}
                      </td>
                      <td className="py-2 px-3 font-bold text-[#FF4E00]">
                        {runnerState.currentVdot > 0 ? `${s.formattedPace}/km` : '--:--'}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-200">
                        {runnerState.currentVdot > 0 ? s.formattedCumulative : '--:--'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          s.effortPct > 100 
                            ? 'bg-rose-950 text-rose-300' 
                            : s.effortPct < 100 
                              ? 'bg-emerald-950 text-emerald-300' 
                              : 'bg-white/5 text-slate-300'
                        }`}>
                          {s.effortPct}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-[11px] font-sans">
                        {s.fuelNote ? (
                          <span className="text-amber-300 font-semibold bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                            {s.fuelNote}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>💡 Em provas de 21.1k e 42.2k, a hidratação e reposição de eletrólitos/glicose evitam a quebra de ritmo.</span>
            <span className="font-mono-data text-[#FF4E00] font-semibold">PACELAB KINETIC PACING</span>
          </div>
        </div>
      </div>
    </div>
  );
};
