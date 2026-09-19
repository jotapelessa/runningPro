import React, { useState, useEffect } from 'react';
import { RunnerState, RunnerLevel } from '../types';
import { calculateVDOT } from '../lib/vdot';
import { X, Heart, ShieldAlert, Award, Calendar, HelpCircle } from 'lucide-react';

interface AthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  runnerState: RunnerState;
  onSave: (updatedState: RunnerState) => void;
}

export default function AthleteModal({ isOpen, onClose, runnerState, onSave }: AthleteModalProps) {
  // General details
  const [age, setAge] = useState<number>(runnerState.age || 32);
  const [gender, setGender] = useState<'male' | 'female'>(runnerState.gender || 'male');
  const [weight, setWeight] = useState<string>(runnerState.weight ? String(runnerState.weight) : '');

  // HR Details
  const [macHR, setMacHR] = useState<number>(runnerState.macHR);
  const [estimateMaxHR, setEstimateMaxHR] = useState<boolean>(!runnerState.age); // True if they want us to estimate
  const [restHR, setRestHR] = useState<number>(runnerState.restHR);
  const [estimateRestHR, setEstimateRestHR] = useState<boolean>(runnerState.restHR === 60);

  // Experience level
  const [level, setLevel] = useState<RunnerLevel>(runnerState.level);
  const [weeklyVolume, setWeeklyVolume] = useState<number>(runnerState.weeklyVolume);
  const [weeksActive, setWeeksActive] = useState<number>(runnerState.weeksActive);

  // Training parameters & race performance
  const [trainingDays, setTrainingDays] = useState<number>(runnerState.trainingDays || 4);
  const [goal, setGoal] = useState<string>(runnerState.goal || 'Completar meus primeiros 5k de forma confortável.');
  const [injuries, setInjuries] = useState<string>(runnerState.injuries || '');

  // Performance VDOT solver
  const [hasRecentTime, setHasRecentTime] = useState<boolean>(true);
  const [recentDistance, setRecentDistance] = useState<number>(5000); // meters
  const [recentHours, setRecentHours] = useState<number>(0);
  const [recentMinutes, setRecentMinutes] = useState<number>(25);
  const [recentSeconds, setRecentSeconds] = useState<number>(30);

  // Auto calculate estimated HR max based on Age & Sex
  useEffect(() => {
    if (estimateMaxHR) {
      const calculatedMax = gender === 'male' ? 220 - age : 226 - age;
      setMacHR(calculatedMax);
    }
  }, [age, gender, estimateMaxHR]);

  // Auto set rest HR
  useEffect(() => {
    if (estimateRestHR) {
      setRestHR(60);
    }
  }, [estimateRestHR]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let computedVdot = runnerState.currentVdot;
    let computedVo2max = runnerState.currentVo2max;

    if (hasRecentTime) {
      const totalSeconds = (recentHours * 3600) + (recentMinutes * 60) + recentSeconds;
      if (totalSeconds > 0) {
        const vdotResult = calculateVDOT(recentDistance, totalSeconds);
        if (vdotResult > 10 && vdotResult < 95) {
          computedVdot = parseFloat(vdotResult.toFixed(2));
          computedVo2max = parseFloat((vdotResult * 1.02).toFixed(2));
        }
      }
    } else {
      // Set reasonable baseline VDOT based on technical level selection
      if (level === 'beginner') {
        computedVdot = 32.0; // ~5k in 32:00
        computedVo2max = 32.6;
      } else if (level === 'intermediate') {
        computedVdot = 41.8; // ~5k in 22:30
        computedVo2max = 42.6;
      } else if (level === 'advanced') {
        computedVdot = 52.0; // ~5k in 18:30
        computedVo2max = 53.0;
      }
    }

    onSave({
      ...runnerState,
      macHR: macHR,
      restHR: restHR,
      level: level,
      weeklyVolume: weeklyVolume,
      weeksActive: weeksActive,
      currentVdot: computedVdot,
      currentVo2max: computedVo2max,
      age: age,
      gender: gender,
      weight: weight ? parseFloat(weight) : undefined,
      trainingDays: trainingDays,
      goal: goal,
      injuries: injuries || undefined
    });

    onClose();
  };

  return (
    <div id="athlete-registration-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0D0D10] border border-white/10 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(255,78,0,0.15)] overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-vdot-orange/15 p-2 rounded-lg border border-vdot-orange/25">
              <Calendar className="w-5 h-5 text-vdot-orange" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white font-display tracking-tight uppercase">📋 Ficha de Performance & Cadastro do Atleta</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Informe seus dados para calibrar o algoritmo de Jacks Daniels e gerar exercícios personalizados.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="bg-vdot-orange/5 border border-vdot-orange/15 p-4 rounded-xl text-xs text-vdot-orange flex gap-3 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Compromisso de Prescrição Segura:</strong> Seus dados de frequência e histórico determinam limites de intensidade. Caso você esteja inativo há tempo ou sinta dores agudas, consulte seu cardiologista antes de subir os limites de volume e velocidade.
            </div>
          </div>

          {/* SECTION 1: DADOS FISIOLÓGICOS BÁSICOS */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-white/50 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-vdot-orange rounded-full" />
              1. Fisiologia Básica
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-10 flex items-end pb-1">Idade</label>
                <input 
                  type="number" 
                  required
                  min="14"
                  max="99"
                  value={age}
                  onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-10 flex items-end pb-1">Sexo Biológico</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-10 flex items-end pb-1">Peso (kg) &nbsp;<span className="text-[10px] text-zinc-500 font-normal mt-0.5 normal-case">(Opcional)</span></label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Ex: 72.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: FREQUÊNCIA CARDÍACA */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-black uppercase text-white/50 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              2. Frequências Cardíacas (Karvonen)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Max HR */}
              <div className="bg-[#060608]/50 border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">FC Máxima (FCmáx)</span>
                  </div>
                  <label className="flex items-center space-x-1 text-[10px] text-zinc-400 select-none cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="accent-vdot-orange rounded text-black"
                      checked={estimateMaxHR} 
                      onChange={(e) => setEstimateMaxHR(e.target.checked)} 
                    />
                    <span>Estimar via Fórmula</span>
                  </label>
                </div>
                
                <input 
                  type="number" 
                  disabled={estimateMaxHR}
                  value={macHR}
                  onChange={(e) => setMacHR(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2 text-sm text-white focus:outline-none focus:border-vdot-orange disabled:opacity-50"
                />
                
                <p className="text-[10px] text-zinc-500 leading-normal">
                  {estimateMaxHR 
                    ? `Fórmula de Haskell & Fox aplicada (${gender === 'male' ? '220 - idade' : '226 - idade'}): ${macHR} bpm. Note que estimativas manuais possuem erro padrão de ±10 bpm.`
                    : "Recomendado apenas se você já fez teste ergométrico ou de esforço máximo recente."}
                </p>
              </div>

              {/* Resting HR */}
              <div className="bg-[#060608]/50 border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Heart className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">FC Repouso (FCR)</span>
                  </div>
                  <label className="flex items-center space-x-1 text-[10px] text-zinc-400 select-none cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="accent-vdot-orange rounded text-black"
                      checked={estimateRestHR} 
                      onChange={(e) => setEstimateRestHR(e.target.checked)} 
                    />
                    <span>Média Padrão (60 bpm)</span>
                  </label>
                </div>
                
                <input 
                  type="number" 
                  disabled={estimateRestHR}
                  value={restHR}
                  onChange={(e) => setRestHR(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2 text-sm text-white focus:outline-none focus:border-vdot-orange disabled:opacity-50"
                />
                
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Frequência cardíaca medida pela manhã, preferencialmente ao acordar deitado. Ajuda a definir as faixas reais das Zonas Karvonen.
                </p>
              </div>

            </div>
          </div>

          {/* SECTION 3: ATIVIDADE E EXPERIÊNCIA */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-black uppercase text-white/50 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              3. Rotina e Volume de Treino
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-10 flex items-end pb-1">Histórico de Nível</label>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                >
                  <option value="beginner">Iniciante (&lt; 6 meses, sem tiros)</option>
                  <option value="intermediate">Intermediário (6 meses a 2 anos)</option>
                  <option value="advanced">Avançado (&gt; 2 anos, com planilhas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-10 flex items-end pb-1">Volume Semanal Típico (km)</label>
                <input 
                  type="number" 
                  min="0"
                  max="180"
                  required
                  value={weeklyVolume}
                  onChange={(e) => setWeeklyVolume(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-10 flex items-end pb-1">Semanas Seguidas Ativas</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={weeksActive}
                  onChange={(e) => setWeeksActive(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              O teto de tiros rápidos do plano é rigidamente limitado a <strong>8% deste volume semanal</strong> para evitar cansaço crônico e lesões. Iniciantes nas primeiras 6 semanas de planilha não receberão tiros.
            </p>
          </div>

          {/* SECTION 4: CAPACIDADE E RACES */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-black uppercase text-white/50 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              4. Desempenho Físico Atual (VDOT)
            </h4>

            <div className="bg-[#060608]/80 border border-white/10 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Possui tempo recente de prova/treino?</span>
                <label className="inline-flex items-center relative cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hasRecentTime}
                    onChange={(e) => setHasRecentTime(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vdot-orange"></div>
                </label>
              </div>

              {hasRecentTime ? (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-6 flex items-end pb-0.5">Distância da Prova</label>
                      <select 
                        value={recentDistance}
                        onChange={(e) => setRecentDistance(parseInt(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2 text-sm text-white focus:outline-none focus:border-vdot-orange h-10"
                      >
                        <option value={1500}>1500 metros</option>
                        <option value={1609.34}>1 Milha (1609m)</option>
                        <option value={3000}>3000 metros (3k)</option>
                        <option value={5000}>5000 metros (5k)</option>
                        <option value={10000}>10.000 metros (10k)</option>
                        <option value={21097.5}>Meia Maratona (21.1k)</option>
                        <option value={42195}>Maratona (42.2k)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 font-bold uppercase tracking-wider h-6 flex items-end pb-0.5">Tempo Coletado</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={recentHours}
                            onChange={(e) => setRecentHours(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-left pl-3 pr-6 rounded-lg border border-white/10 bg-[#060608] py-2 text-sm text-white focus:outline-none focus:border-vdot-orange h-10"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase font-mono font-bold text-zinc-500 pointer-events-none">H</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            max="59"
                            required
                            placeholder="25"
                            value={recentMinutes}
                            onChange={(e) => setRecentMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-left pl-3 pr-8 rounded-lg border border-white/10 bg-[#060608] py-2 text-sm text-white focus:outline-none focus:border-vdot-orange h-10"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase font-mono font-bold text-zinc-500 pointer-events-none">MIN</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            max="59"
                            required
                            placeholder="30"
                            value={recentSeconds}
                            onChange={(e) => setRecentSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-left pl-3 pr-8 rounded-lg border border-white/10 bg-[#060608] py-2 text-sm text-white focus:outline-none focus:border-vdot-orange h-10"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase font-mono font-bold text-zinc-500 pointer-events-none">SEG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    O sistema utilizará esse tempo para computar o seu **VDOT procedimental oficial**, atualizando todos os paces de rodagem, ritmo limiar e ritmo intervalado.
                  </p>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/5 bg-[#FF4E00]/5 border border-[#FF4E00]/10 p-3.5 rounded-lg text-xs leading-normal text-zinc-300">
                  Sem tempo de referência recente. O VDOT será estimado de forma genérica para o nível de experiência selecionado (**{level === 'beginner' ? 'Iniciante: VDOT 32.0' : level === 'intermediate' ? 'Intermediário: VDOT 41.8' : 'Avançado: VDOT 52.0'}**). Você poderá atualizar depois fornecendo resultados de testes de Cooper ou de 2.400m na aba de Zonas.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: DIAS, GOAL, INJURIES */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-black uppercase text-white/50 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              5. Parâmetros de Trabalho e Adaptações
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">Dias Disponíveis por Semana</label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6, 7].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTrainingDays(d)}
                      className={`flex-1 py-2 text-center rounded-lg font-mono font-bold text-sm border transition ${
                        trainingDays === d 
                          ? 'bg-vdot-orange text-black border-vdot-orange font-black shadow-[0_0_10px_rgba(255,78,0,0.2)]'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">Objetivo de Corrida Principal</label>
                <input 
                  type="text" 
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex: Baixar o tempo dos 10k para sub 50min, emagrecimento, etc."
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vdot-orange"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">Histórico de Lesões <span className="text-[10px] text-zinc-500 font-normal">(Opcional)</span></label>
                <textarea 
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="Ex: Fascite plantar no pé esquerdo há 3 meses. Dor leve na patela direita após longões."
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-[#060608] px-3 py-2 text-sm text-white focus:outline-none focus:border-vdot-orange resize-none"
                />
              </div>
            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-white/5 flex gap-3 justify-end shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition"
          >
            Cancelar
          </button>
          
          <button 
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-vdot-orange hover:bg-opacity-95 text-black font-black rounded-lg text-xs tracking-wider uppercase transition shadow-[0_0_15px_rgba(255,78,0,0.35)]"
          >
            Confirmar e Inicializar Planilha
          </button>
        </div>

      </div>
    </div>
  );
}
