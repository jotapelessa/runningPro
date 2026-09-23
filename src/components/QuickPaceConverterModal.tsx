import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { formatPace, formatTime } from '../lib/vdotCalculator';

interface QuickPaceConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPaceConverterModal: React.FC<QuickPaceConverterModalProps> = ({ isOpen, onClose }) => {
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(45);
  const [seconds, setSeconds] = useState<number>(0);

  const [paceMin, setPaceMin] = useState<number>(4);
  const [paceSec, setPaceSec] = useState<number>(30);

  const [speedKmh, setSpeedKmh] = useState<number>(13.33);

  // Recalculate on time/distance changes
  useEffect(() => {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    if (distanceKm > 0 && totalSeconds > 0) {
      const secPerKm = totalSeconds / distanceKm;
      setPaceMin(Math.floor(secPerKm / 60));
      setPaceSec(Math.round(secPerKm % 60));
      setSpeedKmh(Math.round((distanceKm / (totalSeconds / 3600)) * 100) / 100);
    }
  }, [distanceKm, hours, minutes, seconds]);

  if (!isOpen) return null;

  const totalTimeSec = (hours * 3600) + (minutes * 60) + seconds;
  const currentPaceSec = distanceKm > 0 ? totalTimeSec / distanceKm : 0;
  const paceMileSec = currentPaceSec * 1.60934;
  const track400mSec = (currentPaceSec * 400) / 1000;
  const speedMph = speedKmh * 0.621371;

  const setPreset = (km: number, h: number, m: number, s: number) => {
    setDistanceKm(km);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-quick-pace"
        className="w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden telemetry-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FF4E00]/10 border border-[#FF4E00]/30 rounded-lg text-[#FF4E00]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Calculadora Rápida de Pace & Velocidade</h3>
              <p className="text-xs text-slate-400">Conversões instantâneas de tempo, distância, ritmo e parciais</p>
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
          {/* Quick Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono-data">
              PRESETS POPULARES:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPreset(5, 0, 19, 59)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#121214] hover:bg-[#18110D] border border-white/10 hover:border-[#FF4E00]/40 text-slate-300 hover:text-[#FF4E00] font-mono-data transition-colors"
              >
                5k Sub-20
              </button>
              <button
                onClick={() => setPreset(5, 0, 24, 59)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#121214] hover:bg-[#18110D] border border-white/10 hover:border-[#FF4E00]/40 text-slate-300 hover:text-[#FF4E00] font-mono-data transition-colors"
              >
                5k Sub-25
              </button>
              <button
                onClick={() => setPreset(10, 0, 44, 59)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#121214] hover:bg-[#18110D] border border-white/10 hover:border-[#FF4E00]/40 text-slate-300 hover:text-[#FF4E00] font-mono-data transition-colors"
              >
                10k Sub-45
              </button>
              <button
                onClick={() => setPreset(21.0975, 1, 39, 59)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#121214] hover:bg-[#18110D] border border-white/10 hover:border-[#FF4E00]/40 text-slate-300 hover:text-[#FF4E00] font-mono-data transition-colors"
              >
                21k Sub-1h40
              </button>
              <button
                onClick={() => setPreset(42.195, 3, 29, 59)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#121214] hover:bg-[#18110D] border border-white/10 hover:border-[#FF4E00]/40 text-slate-300 hover:text-[#FF4E00] font-mono-data transition-colors"
              >
                42k Sub-3h30
              </button>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Distância */}
            <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span>DISTÂNCIA (KM)</span>
                <span className="text-[#FF4E00] font-mono-data">{distanceKm} km</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white font-mono-data text-base focus:border-[#FF4E00] focus:outline-none"
              />
            </div>

            {/* Tempo */}
            <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                TEMPO TOTAL (HH : MM : SS)
              </label>
              <div className="grid grid-cols-3 gap-1.5 font-mono-data">
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="HH"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-[#050505] border border-white/10 rounded-lg px-2 py-2 text-center text-white focus:border-[#FF4E00] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="MM"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="bg-[#050505] border border-white/10 rounded-lg px-2 py-2 text-center text-white focus:border-[#FF4E00] focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="SS"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="bg-[#050505] border border-white/10 rounded-lg px-2 py-2 text-center text-white focus:border-[#FF4E00] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Results Telemetry Matrix */}
          <div className="bg-[#121214] p-4 rounded-xl border border-white/10">
            <div className="text-xs font-semibold text-[#FF4E00] uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>TELEMETRIA DE RITMO CALCULADA</span>
              <span className="text-[10px] bg-[#FF4E00]/10 px-2 py-0.5 rounded text-[#FF4E00] font-mono-data">PACELAB PRECISION</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#050505] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block font-mono-data">PACE (MIN/KM)</span>
                <span className="text-xl sm:text-2xl font-bold font-mono-data text-[#FF4E00] block mt-0.5">
                  {formatPace(currentPaceSec)}
                </span>
                <span className="text-[10px] text-slate-500">min/km</span>
              </div>

              <div className="bg-[#050505] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block font-mono-data">VELOCIDADE</span>
                <span className="text-xl sm:text-2xl font-bold font-mono-data text-emerald-400 block mt-0.5">
                  {speedKmh.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500">km/h</span>
              </div>

              <div className="bg-[#050505] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block font-mono-data">PACE (MIN/MILHA)</span>
                <span className="text-xl sm:text-2xl font-bold font-mono-data text-amber-400 block mt-0.5">
                  {formatPace(paceMileSec)}
                </span>
                <span className="text-[10px] text-slate-500">min/mi ({speedMph.toFixed(1)} mph)</span>
              </div>

              <div className="bg-[#050505] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block font-mono-data">VOLTA PISTA (400M)</span>
                <span className="text-xl sm:text-2xl font-bold font-mono-data text-purple-400 block mt-0.5">
                  {formatTime(track400mSec)}
                </span>
                <span className="text-[10px] text-slate-500">segundos / volta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#121214] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-sm transition-colors shadow-md shadow-[#FF4E00]/20"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
