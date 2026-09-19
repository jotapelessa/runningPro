import React, { useState, useEffect, useMemo } from 'react';
import { RacePrediction } from '../types';
import { getPredictions } from '../lib/vdot';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Minus, 
  Flame 
} from 'lucide-react';

interface PredictorTabProps {
  predictions: RacePrediction[];
  vdot: number;
}

export default function PredictorTab({ predictions, vdot }: PredictorTabProps) {
  // Local simulated VDOT state
  const [simulatedVdot, setSimulatedVdot] = useState<number>(vdot);

  // Sync simulated VDOT when athlete's base profile VDOT changes
  useEffect(() => {
    setSimulatedVdot(vdot);
  }, [vdot]);

  // Recalculate predictions in real-time as simulated VDOT changes
  const simulatedPredictions = useMemo(() => {
    return getPredictions(simulatedVdot);
  }, [simulatedVdot]);

  // Find reference paces for dynamic visual bar sizing under simulated values
  const maxPaceSec = useMemo(() => {
    return Math.max(...simulatedPredictions.map(p => p.totalSeconds / (p.distanceMeters / 1000)));
  }, [simulatedPredictions]);

  const minPaceSec = useMemo(() => {
    return Math.min(...simulatedPredictions.map(p => p.totalSeconds / (p.distanceMeters / 1000)));
  }, [simulatedPredictions]);

  const vdotDifference = simulatedVdot - vdot;

  return (
    <div id="predictor-tab-container" className="space-y-6">
      
      {/* Dynamic Simulation Master Controller Card */}
      <div id="vdot-simulator-card" className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-[0_4px_30px_rgba(255,78,0,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] bg-vdot-orange/15 text-vdot-orange border border-vdot-orange/20 font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full inline-block mb-1.5">Laboratório Interativo</span>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Flame className="w-5 h-5 text-vdot-orange animate-pulse animate-duration-1000" />
              Simulador Técnico de Evolução (VDOT Dinâmico)
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Ajuste a intensidade de oxigênio abaixo para prever tempos e planejar ritmos em metas de prova futuras.
            </p>
          </div>
          
          {Math.abs(vdotDifference) > 0.01 && (
            <button
              onClick={() => setSimulatedVdot(vdot)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] font-mono border border-white/10 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Original ({vdot.toFixed(1)})
            </button>
          )}
        </div>

        {/* Control Desk Grid with Range and Plus/Minus Nodes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: VDOT Monitor Display */}
          <div className="lg:col-span-3 bg-slate-950/50 p-4 border border-white/5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">VDOT Estimado</div>
              <div className="text-3xl font-black font-mono text-white flex items-baseline gap-1">
                {simulatedVdot.toFixed(1)}
              </div>
            </div>
            
            {/* Real-time Dynamic Delta values */}
            <div className="text-right">
              <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Metabolismo VO₂máx</div>
              <div className="text-[11px] font-mono font-bold">
                {vdotDifference > 0.01 ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 justify-end">
                    +{vdotDifference.toFixed(1)} (+{Math.round((vdotDifference / vdot) * 100)}%)
                  </span>
                ) : vdotDifference < -0.01 ? (
                  <span className="text-rose-400 flex items-center gap-0.5 justify-end">
                    {vdotDifference.toFixed(1)} ({Math.round((vdotDifference / vdot) * 100)}%)
                  </span>
                ) : (
                  <span className="text-zinc-500">Valor Perfil</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-none">
                ~{(simulatedVdot * 1.02).toFixed(1)} mL/kg/min
              </div>
            </div>
          </div>

          {/* Center: Core Range Slider & Steppers */}
          <div className="lg:col-span-6 space-y-2.5 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="text-zinc-500">Mínimo: 15.0</span>
              <span className="text-vdot-orange">Deslize para Projetar</span>
              <span className="text-zinc-500">Máximo: 85.0</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setSimulatedVdot(prev => Math.max(15, parseFloat((prev - 0.5).toFixed(1))))}
                className="w-9 h-9 shrink-0 bg-white/5 hover:bg-white/10 active:scale-95 text-white border border-white/10 rounded-lg flex items-center justify-center transition cursor-pointer"
                title="Diminuir VDOT em 0.5"
              >
                <Minus className="w-3.5 h-3.5 text-vdot-orange" />
              </button>

              <input 
                type="range" 
                min="15.0" 
                max="85.0" 
                step="0.5" 
                value={simulatedVdot}
                onChange={(e) => setSimulatedVdot(parseFloat(e.target.value))}
                className="flex-1 accent-vdot-orange h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setSimulatedVdot(prev => Math.min(85, parseFloat((prev + 0.5).toFixed(1))))}
                className="w-9 h-9 shrink-0 bg-white/5 hover:bg-white/10 active:scale-95 text-white border border-white/10 rounded-lg flex items-center justify-center transition cursor-pointer"
                title="Aumentar VDOT em 0.5"
              >
                <Plus className="w-3.5 h-3.5 text-vdot-orange" />
              </button>
            </div>
          </div>

          {/* Right: Quick Standard Presets jump deck */}
          <div className="lg:col-span-3 space-y-2">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Saltos por Patamar</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSimulatedVdot(32.0)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition text-center cursor-pointer ${
                  Math.abs(simulatedVdot - 32.0) < 0.05
                    ? 'bg-vdot-orange/15 text-vdot-orange border-vdot-orange/30' 
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Iniciante
                <span className="block text-[8px] opacity-75 font-normal">32.0</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedVdot(41.8)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition text-center cursor-pointer ${
                  Math.abs(simulatedVdot - 41.8) < 0.05
                    ? 'bg-vdot-orange/15 text-vdot-orange border-vdot-orange/30' 
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Interm.
                <span className="block text-[8px] opacity-75 font-normal">41.8</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedVdot(52.0)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold border transition text-center cursor-pointer ${
                  Math.abs(simulatedVdot - 52.0) < 0.05
                    ? 'bg-vdot-orange/15 text-vdot-orange border-vdot-orange/30' 
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Avançado
                <span className="block text-[8px] opacity-75 font-normal">52.0</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Grid of Predictions and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Equivalent performances list (Col 2) */}
        <div id="equivalencies-list-column" className="lg:col-span-2 bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center justify-between">
              <span>Tabela de Tempos Equivalentes (Jack Daniels VDOT)</span>
              <span className="text-[10px] font-mono text-vdot-orange bg-vdot-orange/10 px-2 py-0.5 rounded border border-vdot-orange/20 uppercase">
                Projeção Ativa: VDOT {simulatedVdot.toFixed(1)}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Estimativas obtidas através do balanço estrito do consumo aeróbico estável por tempo de esforço.</p>
          </div>

          <div id="predictions-card-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simulatedPredictions.map(pred => {
              const currentPaceSec = pred.totalSeconds / (pred.distanceMeters / 1000);
              // Calculate percent of relative velocity for visual bar
              const percentBar = Math.round(((maxPaceSec - currentPaceSec) / (maxPaceSec - minPaceSec || 1)) * 105);

              return (
                <div 
                  key={pred.name} 
                  className="border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-xl hover:border-vdot-orange/50 rounded-xl p-4 space-y-3 transition flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-vdot-orange font-mono tracking-wider uppercase">{pred.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-semibold">{(pred.distanceMeters / 1000).toFixed(2)} km</div>
                    </div>
                    <div className="bg-white/5 text-white border border-white/10 px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-vdot-orange" />
                      <span>{pred.paceStr}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-2xl font-black text-white font-mono">{pred.timeStr}</div>
                  </div>

                  {/* Relative Speed Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Velocidade Relativa</span>
                      <span className="text-white font-semibold font-mono">{Math.round(((1 / currentPaceSec) * 3600000)).toLocaleString()} m/h</span>
                    </div>
                    <div className="w-full bg-[#050505] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-vdot-orange h-1.5 rounded-full shadow-[0_0_8px_#FF4E00]"
                        style={{ width: `${Math.max(15, Math.min(100, percentBar))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning and advice section (Col 1) */}
        <div id="predictor-science-guidelines" className="space-y-6">
          
          {/* Important Scientific caveat box */}
          <div id="scientific-warnings-card" className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-start space-x-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <h3 className="font-bold text-sm tracking-wide">Advertência Fisiológica</h3>
            </div>
            
            <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
              As previsões mostradas acima são <strong>equivalências fisiológicas teóricas potenciais</strong> baseadas estritamente na capacidade aeróbica estimada (Consumo Máximo de Oxigênio do Sistema VDOT).
            </p>

            <div className="border-t border-amber-500/25 pt-3.5 space-y-3 text-xs text-amber-200/85 leading-relaxed">
              <div className="flex items-start">
                <span className="text-vdot-orange mr-2 font-bold font-mono">1.</span>
                <p><strong>Desenvolvimento Muscular:</strong> Um tempo nos 5k não se traduz automaticamente em uma maratona similar, a menos que haja semanas de rodagem longa e consolidação cardíaco-mecânica específica.</p>
              </div>
              <div className="flex items-start">
                <span className="text-vdot-orange mr-2 font-bold font-mono">2.</span>
                <p><strong>Variáveis do Meio:</strong> Clima quente (&gt; 22°C), umidade relativa alta, subidas acumuladas e atrito do solo reduzem o rendimento de pace VDOT.</p>
              </div>
              <div className="flex items-start">
                <span className="text-vdot-orange mr-2 font-bold font-mono">3.</span>
                <p><strong>Estratégia de Ritmo:</strong> Erros de pacing (largar muito rápido nas primeiras frações de prova) invalidam as equações lineares de Jack Daniels.</p>
              </div>
            </div>
          </div>

          {/* Golden Rules of training */}
          <div className="bg-[#0A0A0A] text-white rounded-2xl p-5 space-y-4 shadow-xl border border-white/10">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider font-display">Leis do Treinamento VDOT</h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div>
                <span className="block font-bold text-white uppercase text-[10px] tracking-wide">Regra 1: Evite o "Tudo de Uma Vez"</span>
                <p className="text-slate-400">Jamais eleve o volume corporal (km/semana) e os treinos de alta velocidade (intensidade) simultaneamente em mais de 10%.</p>
              </div>

              <div>
                <span className="block font-semibold text-white uppercase text-[10px] tracking-wide">Regra 2: Intensidade pelo VDOT atual</span>
                <p className="text-slate-400">Sempre treine nos ritmos do seu VDOT atual, e não nos ritmos de onde você deseja chegar no futuro.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
