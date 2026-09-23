import React, { useState, useEffect } from 'react';
import { X, Play, Square, Volume2, Zap } from 'lucide-react';
import { metronomeInstance } from '../lib/audioMetronome';

interface CadenceMetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSpm?: number;
}

export const CadenceMetronomeModal: React.FC<CadenceMetronomeModalProps> = ({
  isOpen,
  onClose,
  defaultSpm = 180
}) => {
  const [spm, setSpm] = useState<number>(defaultSpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeBeat, setActiveBeat] = useState<number>(0);

  useEffect(() => {
    return () => {
      metronomeInstance.stop();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      metronomeInstance.start(spm, (count) => {
        setActiveBeat(count % 4);
      });
    }
  }, [spm, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      metronomeInstance.stop();
      setIsPlaying(false);
      setActiveBeat(0);
    } else {
      setIsPlaying(true);
      metronomeInstance.start(spm, (count) => {
        setActiveBeat(count % 4);
      });
    }
  };

  const handleClose = () => {
    metronomeInstance.stop();
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-cadence-metronome"
        className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden telemetry-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Metrônomo de Cadência Cinética</h3>
              <p className="text-xs text-slate-400">Treinamento de frequência de passadas (Passos por Minuto)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Visual Dial & BPM Indicator */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#050505] border border-white/10 relative overflow-hidden">
            {/* Pulsing Visual Wave */}
            {isPlaying && (
              <div 
                className="absolute inset-0 bg-emerald-500/5 animate-ping duration-700 pointer-events-none rounded-2xl"
                style={{ animationDuration: `${60 / spm}s` }}
              />
            )}

            {/* 4 Beat Indicators */}
            <div className="flex items-center gap-3 mb-4">
              {[0, 1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-75 ${
                    activeBeat === b && isPlaying
                      ? b === 0 
                        ? 'bg-[#FF4E00] scale-125 shadow-lg shadow-[#FF4E00]/80 ring-2 ring-[#FF4E00]' 
                        : 'bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* SPM Display */}
            <div className="text-center">
              <span className="text-5xl sm:text-6xl font-black font-mono-data tracking-tight text-white block">
                {spm}
              </span>
              <span className="text-xs uppercase font-mono-data text-emerald-400 font-bold tracking-widest mt-1 block">
                PASSOS POR MINUTO (SPM)
              </span>
            </div>

            {/* Play/Stop Main Button */}
            <button
              id="btn-metronome-toggle"
              onClick={togglePlay}
              className={`mt-6 px-8 py-3 rounded-xl font-bold font-mono-data uppercase tracking-wider text-sm flex items-center gap-2.5 transition-all shadow-lg ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/40'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>PARAR METRÔNOMO</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>INICIAR METRÔNOMO</span>
                </>
              )}
            </button>
          </div>

          {/* Slider & Presets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono-data text-slate-400">
              <span>150 SPM</span>
              <span className="text-emerald-300 font-bold">{spm} SPM SELECIONADO</span>
              <span>210 SPM</span>
            </div>

            <input
              type="range"
              min="150"
              max="210"
              value={spm}
              onChange={(e) => setSpm(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />

            {/* Quick Target Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {[165, 172, 180, 185, 190].map((val) => (
                <button
                  key={val}
                  onClick={() => setSpm(val)}
                  className={`py-1.5 text-xs rounded-lg font-mono-data font-semibold border transition-all ${
                    spm === val
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-[#121214] text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {val} SPM
                </button>
              ))}
            </div>
          </div>

          {/* Physiological Guidance Card */}
          <div className="bg-[#121214] p-3.5 rounded-xl border border-white/10 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-1.5 text-[#FF4E00] font-semibold uppercase tracking-wider font-mono-data">
              <Zap className="w-4 h-4" />
              <span>DICA DE BIOMECÂNICA PACELAB:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Uma cadência em torno de <strong className="text-emerald-300">180 SPM (175-185 SPM)</strong> aproxima o pé do centro de gravidade do corpo, reduz o tempo de contato com o solo (GCT) e diminui em até <strong className="text-white">20% o impacto nas articulações dos joelhos e quadril</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#121214] flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-sm font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
