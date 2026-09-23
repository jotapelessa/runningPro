import React, { useState } from 'react';
import { X, Printer, Award } from 'lucide-react';
import { DistanceType } from '../types';
import { STANDARD_DISTANCES, formatPace, formatTime, predictRaceTime } from '../lib/vdotCalculator';

interface WristbandModalProps {
  isOpen: boolean;
  onClose: () => void;
  vdot: number;
}

export const WristbandModal: React.FC<WristbandModalProps> = ({
  isOpen,
  onClose,
  vdot
}) => {
  const [selectedDistance, setSelectedDistance] = useState<DistanceType>('half_marathon');
  const [strategy, setStrategy] = useState<'even' | 'negative' | 'conservative'>('negative');
  const [gelIntervalKm, setGelIntervalKm] = useState<number>(7);

  if (!isOpen) return null;

  const distInfo = STANDARD_DISTANCES.find(d => d.id === selectedDistance) || STANDARD_DISTANCES[10];
  const totalSeconds = predictRaceTime(distInfo.meters, vdot);
  const baseSecPerKm = (totalSeconds / distInfo.meters) * 1000;
  const totalKm = Math.round((distInfo.meters / 1000) * 10) / 10;

  // Generate split checkpoints
  const splits: Array<{
    km: number;
    splitPaceSec: number;
    cumulativeSec: number;
    hasGel: boolean;
    hasWater: boolean;
  }> = [];

  let currentCumulative = 0;
  const numCheckpoints = Math.floor(totalKm);

  for (let k = 1; k <= numCheckpoints; k++) {
    let multiplier = 1.0;
    if (strategy === 'negative') {
      if (k <= totalKm / 2) multiplier = 1.015;
      else multiplier = 0.985;
    } else if (strategy === 'conservative') {
      if (k <= 2) multiplier = 1.03;
      else if (k > totalKm - 3) multiplier = 0.97;
      else multiplier = 1.00;
    }

    const kmPace = baseSecPerKm * multiplier;
    currentCumulative += kmPace;

    const hasGel = gelIntervalKm > 0 && k % gelIntervalKm === 0 && k < totalKm - 2;
    const hasWater = k % 3 === 0;

    splits.push({
      km: k,
      splitPaceSec: kmPace,
      cumulativeSec: currentCumulative,
      hasGel,
      hasWater
    });
  }

  // Final fraction if distance has decimals (e.g. 21.1k or 42.2k)
  if (totalKm > numCheckpoints) {
    const fractionKm = totalKm - numCheckpoints;
    const finalSec = baseSecPerKm * fractionKm;
    currentCumulative += finalSec;
    splits.push({
      km: totalKm,
      splitPaceSec: baseSecPerKm,
      cumulativeSec: currentCumulative,
      hasGel: false,
      hasWater: false
    });
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="modal-wristband"
        className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 telemetry-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Gerador de Pace Band (Pulseira de Pulso)</h3>
              <p className="text-xs text-slate-400">Tabela de parciais acumuladas para recortar, plastificar e usar na prova</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Distância */}
            <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
              <label className="text-xs font-semibold text-slate-400 block mb-1">PROVA ALVO</label>
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(e.target.value as DistanceType)}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="5k">5 km (5.000m)</option>
                <option value="10k">10 km (10.000m)</option>
                <option value="15k">15 km (15.000m)</option>
                <option value="10miles">10 Milhas (16.1k)</option>
                <option value="half_marathon">Meia Maratona (21.1k)</option>
                <option value="30k">30 km</option>
                <option value="marathon">Maratona (42.2k)</option>
              </select>
            </div>

            {/* Estratégia de Pacing */}
            <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
              <label className="text-xs font-semibold text-slate-400 block mb-1">ESTRATÉGIA</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="negative">Split Negativo (Recomendado)</option>
                <option value="even">Even Split (Ritmo Constante)</option>
                <option value="conservative">Início Cauteloso</option>
              </select>
            </div>

            {/* Ingestão de Gel */}
            <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
              <label className="text-xs font-semibold text-slate-400 block mb-1">LEMBRETE DE GEL</label>
              <select
                value={gelIntervalKm}
                onChange={(e) => setGelIntervalKm(parseInt(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="5">A cada 5 km</option>
                <option value="7">A cada 7 km</option>
                <option value="8">A cada 8 km</option>
                <option value="10">A cada 10 km</option>
                <option value="0">Sem lembrete de gel</option>
              </select>
            </div>
          </div>

          {/* Target Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-950/20 border border-amber-500/30 px-4 py-3 rounded-xl text-amber-200 text-xs">
            <div>
              <span className="text-amber-400 font-bold block">{distInfo.name} • VDOT {vdot.toFixed(1)}</span>
              <span>Tempo Estimado: <strong className="text-white text-sm font-mono-data">{formatTime(totalSeconds, totalSeconds >= 3600)}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Pace Médio Base:</span>
              <strong className="text-[#FF4E00] font-mono-data text-sm">{formatPace(baseSecPerKm)}/km</strong>
            </div>
          </div>

          {/* Printable Strip Preview */}
          <div className="border-2 border-dashed border-white/20 p-4 rounded-xl bg-[#050505]">
            <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
              <span className="font-mono-data">PREVIEW DA FITA DE CORTE (LARGURA: 3cm)</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-amber-300 font-mono-data">PRINT-READY</span>
            </div>

            <div 
              id="printable-wristband"
              className="bg-white text-black p-3 rounded-lg shadow-inner font-mono text-xs max-h-72 overflow-y-auto"
            >
              <div className="text-center font-bold border-b border-black pb-1 mb-2">
                <div className="text-sm tracking-wider">PACELAB VDOT 3.5 — {distInfo.shortName}</div>
                <div className="text-[10px] text-gray-700">META: {formatTime(totalSeconds, totalSeconds >= 3600)} • VDOT {vdot.toFixed(1)}</div>
              </div>

              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="border-b border-gray-400 text-[10px] uppercase font-bold">
                    <th className="py-0.5 text-left">KM</th>
                    <th className="py-0.5">PACE</th>
                    <th className="py-0.5">ACUMULADO</th>
                    <th className="py-0.5 text-right">NUTRIÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {splits.map((s) => (
                    <tr key={s.km} className="hover:bg-gray-100">
                      <td className="py-0.5 text-left font-bold">{s.km}k</td>
                      <td className="py-0.5">{formatPace(s.splitPaceSec)}</td>
                      <td className="py-0.5 font-bold">{formatTime(s.cumulativeSec, s.cumulativeSec >= 3600)}</td>
                      <td className="py-0.5 text-right text-[10px]">
                        {s.hasGel && <span className="font-bold text-amber-800 mr-1">[GEL]</span>}
                        {s.hasWater && <span className="text-blue-800">[H2O]</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-[9px] text-center text-gray-600 mt-2 border-t border-black pt-1">
                Acelere com inteligência • pacelab.vdot
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#121214] flex items-center justify-between">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Dica: Cole uma fita transparente por cima para impermeabilizar contra o suor.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold transition-colors"
            >
              Fechar
            </button>
            <button
              id="btn-print-wristband"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-sm transition-colors shadow-md shadow-[#FF4E00]/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
