import React, { useState } from 'react';
import { RunnerState, PaceZone, HRZone } from '../types';
import { 
  calculatePaceZones, 
  getKarvonenZones, 
  estimateVO2MaxCooper, 
  estimateVO2Max2400m,
  calculateVDOT
} from '../lib/vdot';
import { Heart, ShieldAlert, Award, ChevronRight, Gauge, Timer, Flame } from 'lucide-react';

interface CalculatorTabProps {
  runnerState: RunnerState;
  setRunnerState: React.Dispatch<React.SetStateAction<RunnerState>>;
  paceZones: PaceZone[];
  hrZones: HRZone[];
}

export default function CalculatorTab({ 
  runnerState, 
  setRunnerState, 
  paceZones, 
  hrZones 
}: CalculatorTabProps) {

  // Cooper State
  const [cooperMeters, setCooperMeters] = useState<number>(2600);
  const [cooperVO2, setCooperVO2] = useState<number | null>(null);
  const [cooperVdot, setCooperVdot] = useState<number | null>(null);

  // 2400m State
  const [test2400Min, setTest2400Min] = useState<number>(11);
  const [test2400Sec, setTest2400Sec] = useState<number>(30);
  const [test2400VO2, setTest2400VO2] = useState<number | null>(null);
  const [test2400Vdot, setTest2400Vdot] = useState<number | null>(null);

  // Direct edit VDOT
  const [directVdot, setDirectVdot] = useState<number>(runnerState.currentVdot);

  const handleApplyCooper = () => {
    const vo2 = estimateVO2MaxCooper(cooperMeters);
    const vdot = calculateVDOT(cooperMeters, 12 * 60);
    setCooperVO2(vo2);
    setCooperVdot(vdot);
    
    // Update state
    setRunnerState(prev => ({
      ...prev,
      currentVdot: parseFloat(vdot.toFixed(2)),
      currentVo2max: parseFloat(vo2.toFixed(2)),
      history: [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('pt-BR'),
          type: 'cooper',
          value: cooperMeters,
          vo2max: parseFloat(vo2.toFixed(2)),
          vdot: parseFloat(vdot.toFixed(2))
        },
        ...prev.history
      ]
    }));
  };

  const handleApply2400 = () => {
    const totalSec = (test2400Min * 60) + test2400Sec;
    const vo2 = estimateVO2Max2400m(totalSec);
    const vdot = calculateVDOT(2400, totalSec);
    setTest2400VO2(vo2);
    setTest2400Vdot(vdot);

    setRunnerState(prev => ({
      ...prev,
      currentVdot: parseFloat(vdot.toFixed(2)),
      currentVo2max: parseFloat(vo2.toFixed(2)),
      history: [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('pt-BR'),
          type: '2400m',
          value: totalSec,
          vo2max: parseFloat(vo2.toFixed(2)),
          vdot: parseFloat(vdot.toFixed(2))
        },
        ...prev.history
      ]
    }));
  };

  const handleApplyDirectVdot = () => {
    if (directVdot < 10 || directVdot > 90) return;
    setRunnerState(prev => ({
      ...prev,
      currentVdot: parseFloat(directVdot.toFixed(2)),
      // VDOT roughly approximates VO2Max
      currentVo2max: parseFloat((directVdot * 1.02).toFixed(2)),
      history: [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('pt-BR'),
          type: 'vdot_direct',
          value: directVdot,
          vo2max: parseFloat((directVdot * 1.02).toFixed(2)),
          vdot: parseFloat(directVdot.toFixed(2))
        },
        ...prev.history
      ]
    }));
  };

  const maxIntervalKm = Math.round(runnerState.weeklyVolume * 0.08 * 10) / 10;

  return (
    <div id="calculator-tab-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Col 1: Runner Profile Controls */}
      <div id="runner-profile-section" className="lg:col-span-1 space-y-6">
        <div id="card-configs-running" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-4 mb-4">
            <Gauge className="w-5 h-5 text-vdot-orange" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">Parâmetros do Atleta</h2>
          </div>

          <div className="space-y-4">
            {/* Level Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nível Técnico</label>
              <select 
                value={runnerState.level} 
                onChange={(e) => setRunnerState(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full rounded-lg border border-white/10 bg-[#050505] p-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
              >
                <option value="beginner">Iniciante (Beginner)</option>
                <option value="intermediate">Intermediário (Intermediate)</option>
                <option value="advanced">Avançado (Advanced)</option>
              </select>
            </div>

            {/* Weekly Volume Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Volume (Km/Sem.)</label>
                <input 
                  type="number" 
                  value={runnerState.weeklyVolume}
                  onChange={(e) => setRunnerState(prev => ({ ...prev, weeklyVolume: Math.max(1, parseFloat(e.target.value) || 0) }))}
                  className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Semanas Ativo</label>
                <input 
                  type="number" 
                  value={runnerState.weeksActive}
                  onChange={(e) => setRunnerState(prev => ({ ...prev, weeksActive: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>
            </div>

            {/* HR Inputs */}
            <div id="heart-rate-inputs" className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">FC Máxima (bpm)</label>
                </div>
                <input 
                  type="number" 
                  value={runnerState.macHR}
                  onChange={(e) => setRunnerState(prev => ({ ...prev, macHR: Math.max(100, parseInt(e.target.value) || 0) }))}
                  className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Heart className="w-3.5 h-3.5 text-slate-500" />
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">FC Repouso (bpm)</label>
                </div>
                <input 
                  type="number" 
                  value={runnerState.restHR}
                  onChange={(e) => setRunnerState(prev => ({ ...prev, restHR: Math.max(30, parseInt(e.target.value) || 0) }))}
                  className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>
            </div>

            {/* Direct VDOT Override */}
            <div className="pt-4 border-t border-white/10">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Ajuste Direto de VDOT</label>
              <div id="direct-vdot-fields" className="flex space-x-2">
                <input 
                  type="number" 
                  step="0.1"
                  value={directVdot}
                  onChange={(e) => setDirectVdot(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none focus:border-vdot-orange"
                  placeholder="Ex: 45.3"
                />
                <button 
                  id="btn-apply-direct"
                  onClick={handleApplyDirectVdot}
                  className="px-4 py-2 bg-vdot-orange hover:bg-vdot-orange-hover text-black font-extrabold text-xs rounded-lg transition"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Indicators box */}
        <div id="safety-guidelines-box" className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-start space-x-2 text-amber-400">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <h3 className="font-bold text-sm tracking-wide">Diretrizes de Proteção Desportiva</h3>
          </div>
          
          <div className="space-y-2 text-xs text-amber-200/90 leading-relaxed">
            <div className="flex items-start">
              <span className="text-amber-500 mr-2 font-bold">•</span>
              <p><strong>Meta de Tiros (Intervalado):</strong> Limite máximo de volume em velocidade rápida ({paceZones.find(p => p.key === 'I')?.name.split('(')[0]}) para seu volume atual: <span className="bg-amber-950 border border-amber-800/60 px-1.5 py-0.5 rounded font-mono font-bold text-amber-300">{maxIntervalKm} km por treino</span> (máx 8% do volume semanal).</p>
            </div>
            
            <div className="flex items-start">
              <span className="text-amber-500 mr-2 font-bold">•</span>
              <p><strong>Iniciantes (Semanas 1 a 6):</strong> Não realizam tiros de alta intensidade para mitigar traumas repetitivos nas articulações.</p>
            </div>

            <div className="flex items-start border-t border-amber-500/20 pt-2">
              <span className="text-amber-500 mr-2 font-bold">•</span>
              <p><strong>Aumento simultâneo proibido:</strong> Nunca eleve o volume (km) e a intensidade (acelerações) simultaneamente em mais de 10%.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Col 2: Test Calculations */}
      <div id="fitness-testing-section" className="lg:col-span-2 space-y-6">
        
        {/* Active Fitness Dashboard (Immersive Theme) */}
        <div id="active-fitness-banner" className="bg-[#0A0A0A] text-white rounded-2xl p-6 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative w-28 h-28 flex justify-center items-center shrink-0">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  stroke="#FF4E00" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray="301.6" 
                  strokeDashoffset={301.6 - (301.6 * (Math.min(90, Math.max(10, runnerState.currentVo2max)) / 90))} 
                  className="drop-shadow-[0_0_10px_#FF4E00]" 
                />
              </svg>
              <div className="text-center z-10 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-display tracking-tighter text-white">{runnerState.currentVo2max.toFixed(1)}</span>
                <div className="text-[8px] text-white/40 uppercase tracking-widest font-bold">VO2 Máx</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[#FF4E00] tracking-widest uppercase">Capacidade Aeróbica / Fisiológica</div>
              <div className="text-3xl font-black text-white font-display uppercase tracking-tight">VDOT {runnerState.currentVdot.toFixed(1)}</div>
              <p className="text-xs text-white/55 font-sans leading-relaxed">
                Zonas de intensidade calibradas dinamicamente com base nas equações quadráticas de Jack Daniels.
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center space-x-3 shrink-0 self-stretch sm:self-center justify-center">
            <Award className="w-8 h-8 text-[#FF4E00] drop-shadow-[0_0_5px_#FF4E00]" />
            <div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Classificação Prevista</div>
              <div className="text-xs font-bold text-white font-mono uppercase">
                {runnerState.currentVdot >= 55 ? 'Alta Performance' : runnerState.currentVdot >= 46 ? 'Intermediário Avançado' : runnerState.currentVdot >= 36 ? 'Intermediário Confortável' : 'Iniciante Ativo'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic testing converters */}
        <div id="testing-methods-card" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">Cálculo de VO2Máx via Testes de Campo</h3>
            <p className="text-xs text-slate-400 mt-1">Insira os resultados obtidos em pista para autocalcular seu VDOT e reformular suas zonas desportivas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cooper Method */}
            <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-white/5 hover:border-white/20 transition">
              <div className="flex items-center space-x-2 text-vdot-orange font-bold text-sm">
                <Timer className="w-4 h-4" />
                <span>Teste de Cooper (12 minutos)</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">Corra a maior distância possível dentro do tempo fixo de 12 minutos.</p>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Distância Percorrida (Metros)</label>
                <div className="flex space-x-2">
                  <input 
                    type="number"
                    value={cooperMeters}
                    step="10"
                    onChange={(e) => setCooperMeters(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none"
                  />
                  <button
                    onClick={handleApplyCooper}
                    className="px-3 py-2 bg-vdot-orange hover:bg-vdot-orange-hover text-black font-extrabold rounded-md text-xs transition shrink-0"
                  >
                    Estimar
                  </button>
                </div>
              </div>

              {cooperVdot !== null && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-vdot-orange uppercase tracking-wider text-[10px]">Resultado Estimado Cooper:</div>
                  <div className="text-slate-300">VO2Máx: <span className="font-bold text-white font-mono">{cooperVO2?.toFixed(1)}</span> ml/kg/min</div>
                  <div className="text-slate-300">VDOT correspondente: <span className="font-bold text-white font-mono">{cooperVdot?.toFixed(1)}</span></div>
                  <div className="text-emerald-400 text-[10px] font-semibold italic">Zonas e calendários sincronizados!</div>
                </div>
              )}
            </div>

            {/* 2400m Method */}
            <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-white/5 hover:border-white/20 transition">
              <div className="flex items-center space-x-2 text-vdot-orange font-bold text-sm">
                <Timer className="w-4 h-4" />
                <span>Teste de 2400 metros</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">Corra a distância exata de 2,4 km no menor tempo possível.</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Minutos</label>
                  <input 
                    type="number"
                    value={test2400Min}
                    onChange={(e) => setTest2400Min(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Segundos</label>
                  <div className="flex space-x-1.5">
                    <input 
                      type="number"
                      value={test2400Sec}
                      max="59"
                      onChange={(e) => setTest2400Sec(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-white/10 bg-[#050505] p-2 text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={handleApply2400}
                      className="px-2.5 py-2 bg-vdot-orange hover:bg-vdot-orange-hover text-black font-extrabold rounded-md text-xs transition shrink-0"
                    >
                      Calcular
                    </button>
                  </div>
                </div>
              </div>

              {test2400Vdot !== null && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-vdot-orange uppercase tracking-wider text-[10px]">Resultado Estimado 2400m:</div>
                  <div className="text-slate-300">VO2Máx: <span className="font-bold text-white font-mono">{test2400VO2?.toFixed(1)}</span> ml/kg/min</div>
                  <div className="text-slate-300">VDOT correspondente: <span className="font-bold text-white font-mono">{test2400Vdot?.toFixed(1)}</span></div>
                  <div className="text-emerald-400 text-[10px] font-semibold italic">Zonas e calendários sincronizados!</div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Tables for Pace and HR */}
      <div id="zones-comparison-tables" className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Pace Table */}
        <div id="vdot-paces-card" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3 flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider">
              <Flame className="w-5 h-5 text-emerald-500" />
              Ritmos de Corrida VDOT (Paces)
            </h3>
            <span className="bg-white/5 border border-white/10 text-vdot-orange font-mono text-xs px-2.5 py-1 rounded-full font-bold">VDOT ~ {runnerState.currentVdot}</span>
          </div>

          <div className="space-y-3.5">
            {paceZones.map(pz => (
              <div 
                key={pz.key}
                className="border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/5 hover:border-white/20 transition"
              >
                <div className="space-y-1 md:max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-vdot-orange shadow-[0_0_8px_#FF4E00]" />
                    <span className="font-extrabold text-[#FF4E00] uppercase tracking-wide text-sm">{pz.name}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{pz.description}</p>
                  <p className="text-[11px] text-zinc-400 font-mono font-semibold">{pz.descriptionSpeed}</p>
                </div>

                <div className="text-right flex md:flex-col justify-between items-center md:items-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Pace Médio</span>
                  <span className="font-mono text-xl font-black text-white">{pz.paceStr}</span>
                  <span className="text-[10px] text-vdot-orange font-mono font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/10 mt-1">{pz.paceRangeStr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HR Karvonen Table */}
        <div id="hr-zones-card" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3 flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-display uppercase tracking-wider">
              <Heart className="w-5 h-5 text-red-500" />
              Frequência Cardíaca (Karvonen)
            </h3>
            <span className="bg-red-950/20 border border-red-500/30 text-red-400 font-mono text-xs px-2.5 py-1 rounded-full font-bold">FCR: {runnerState.restHR} / FCm: {runnerState.macHR}</span>
          </div>

          <div className="space-y-3.5">
            {hrZones.map(hz => (
              <div 
                key={hz.zone} 
                className="border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/5 hover:border-white/20 transition"
              >
                <div className="space-y-1 md:max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="font-extrabold text-white uppercase tracking-wide text-sm">{hz.name}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{hz.description}</p>
                </div>

                <div className="text-right flex md:flex-col justify-between items-center md:items-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Faixa Alvo</span>
                  <span className="font-mono text-xl font-black text-red-500">{hz.hrRangeStr}</span>
                  <span className="text-[10px] text-slate-300 font-mono font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/10 mt-1">{hz.intensityRange} Reserva</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
