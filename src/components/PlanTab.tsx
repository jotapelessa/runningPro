import React, { useState } from 'react';
import { WeekPlan, RunnerState } from '../types';
import { Calendar, Percent, ShieldCheck, HelpCircle, Flame, ArrowRight, Snowflake, Zap, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlanTabProps {
  planWeeks: WeekPlan[];
  runnerState: RunnerState;
}

export default function PlanTab({ planWeeks, runnerState }: PlanTabProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(0);
  
  // Dynamic Plyometrics recommended phase based on weeks active / level
  const weeksLimit = runnerState.weeksActive || 0;
  const recommendedPhase = 
    runnerState.level === 'beginner' || weeksLimit <= 12 ? 1
    : weeksLimit <= 24 ? 2
    : weeksLimit <= 36 ? 3
    : 4;

  const [pliometriaPhase, setPliometriaPhase] = useState<number>(recommendedPhase);
  const activeWeek = planWeeks[activeWeekIndex] || planWeeks[0];

  const weeksKeys = [
    { num: 1, label: 'Sem. 1', cycle: 'Fase I: Fundação' },
    { num: 2, label: 'Sem. 2', cycle: 'Fase I: Construção' },
    { num: 3, label: 'Sem. 3', cycle: 'Fase II: Sobrecarga' },
    { num: 4, label: 'Sem. 4', cycle: 'Fase II: Supercompensar' },
    { num: 5, label: 'Sem. 5', cycle: 'Fase III: Ritmo e Limiar' },
    { num: 6, label: 'Sem. 6', cycle: 'Fase III: Pico Volume' },
    { num: 7, label: 'Sem. 7', cycle: 'Fase IV: VO2Máx' },
    { num: 8, label: 'Sem. 8', cycle: 'Fase IV: Polimento' },
  ]// Types of workouts badge colors
  const typeMap: Record<string, { label: string, bg: string, text: string }> = {
    'Rest': { label: 'Descanso / OFF', bg: 'bg-zinc-800/40 border-zinc-700/50', text: 'text-zinc-400' },
    'Easy': { label: 'Trote / Rodagem (E)', bg: 'bg-emerald-950/40 border-emerald-800/50', text: 'text-emerald-400' },
    'Long Run': { label: 'Treino Longo (LR)', bg: 'bg-blue-950/40 border-blue-800/50', text: 'text-blue-400' },
    'Threshold': { label: 'Limiar (T)', bg: 'bg-amber-950/40 border-amber-800/50', text: 'text-amber-400' },
    'Interval': { label: 'Velocidade / Tiros (I)', bg: 'bg-rose-950/40 border-rose-800/50', text: 'text-rose-400' },
    'Repetition': { label: 'Repetições (R)', bg: 'bg-purple-950/40 border-purple-800/50', text: 'text-purple-400' },
  };

  const isBeginnerMode = runnerState.level === 'beginner' || runnerState.weeksActive <= 6;
  const maxIntervalKm = Math.round(activeWeek.totalVolumeKm * 0.08 * 10) / 10;

  return (
    <div id="plan-tab-container" className="space-y-6">
      
      {/* Top Selector Grid */}
      <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cronograma de Periodização (Clique para selecionar a semana)</h3>
        <div id="weeks-selectors-grid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {weeksKeys.map((w, idx) => {
            const isSelected = activeWeekIndex === idx;
            const weekData = planWeeks[idx];
            const isRegenerativa = idx === 3 || idx === 7;

            return (
              <button
                key={w.num}
                onClick={() => setActiveWeekIndex(idx)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-vdot-orange border-vdot-orange text-black font-extrabold shadow-[0_0_15px_rgba(255,78,0,0.3)]' 
                    : isRegenerativa
                      ? 'bg-emerald-950/20 border-emerald-800/30 hover:bg-emerald-950/40 text-emerald-400'
                      : 'bg-[#121214] border-white/5 hover:border-white/15 hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-85 font-mono font-bold">Semana {w.num}</div>
                <div className="text-sm font-black font-display mt-0.5">{weekData ? `${weekData.totalVolumeKm} km` : `${w.label}`}</div>
                <div className={`text-[9px] mt-1 text-center font-bold ${isSelected ? 'text-black/60' : 'text-slate-500'}`}>
                  {isRegenerativa ? '💡 Regenerativa' : '⚡ Building'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Title & Metadata */}
      <div id="week-metrics-overview" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-[#0A0A0A] border border-white/10 text-white rounded-2xl p-5 shadow-xl flex items-center justify-between col-span-1 md:col-span-2">
          <div className="space-y-1">
            <div className="text-[10px] text-vdot-orange uppercase tracking-wider font-mono font-bold">Fase & Objetivo da Semana {activeWeek.weekNum}</div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 font-display uppercase tracking-tight">
              <Calendar className="w-5 h-5 text-vdot-orange" />
              {activeWeek.periodLabel}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-350">
              <div className="bg-[#050505] border border-white/5 px-2.5 py-1 rounded-md text-slate-350">
                Esforço de Carga: <strong className="text-vdot-orange">{activeWeek.intensityLevel}</strong>
              </div>
              <div className="bg-[#050505] border border-white/5 px-2.5 py-1 rounded-md text-slate-355">
                Volume Semanal: <strong className="text-white">{activeWeek.totalVolumeKm} km</strong>
              </div>
              {activeWeek.weekNum > 1 && (
                <div className={`px-2.5 py-1 rounded-md font-semibold border ${
                  activeWeek.ratioChange > 10 
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                    : activeWeek.ratioChange < 0
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}>
                  Frequência de Volume: <strong>{activeWeek.ratioChange > 0 ? '+' : ''}{activeWeek.ratioChange}%</strong>
                </div>
              )}
            </div>
          </div>
          <div className="hidden lg:block border-l border-white/10 pl-6 shrink-0">
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">TETO SEMANAL DE TIROS</span>
              <span className="text-lg font-mono font-black text-vdot-orange">{maxIntervalKm} km máx</span>
              <span className="text-[8px] text-slate-500 block font-bold">Restrição estrita de 8% volume</span>
            </div>
          </div>
        </div>

        {/* Safety Validation Summary */}
        <div id="plan-safety-validation-card" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-5 shadow-xl space-y-3.5">
          <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase tracking-wider font-display">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Validações de Segurança</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-sans leading-relaxed">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <span>Nível de Atleta Ajustado:</span>
              <strong className="capitalize text-white">{runnerState.level}</strong>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <span>Restrição Alta Intensidade:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isBeginnerMode ? 'bg-amber-950/50 border-amber-800/40 text-amber-400' : 'bg-emerald-950/50 border-emerald-800/40 text-emerald-400'}`}>
                {isBeginnerMode ? 'Iniciante Protegido (S1-S6)' : 'Liberada'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Teto de Tiros VO2Máx (8%):</span>
              <span className="font-bold font-mono text-vdot-orange">{maxIntervalKm} km</span>
            </div>
          </div>
        </div>

      </div>

      {/* Daily Workouts Calendar List */}
      <div id="daily-workouts-list" className="space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">Cronograma Diário Detalhado</h3>
        
        <div id="workouts-grid-days" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeWeek.workouts.map(wo => {
            const badge = typeMap[wo.type] || { label: wo.type, bg: 'bg-zinc-850 border-zinc-700', text: 'text-zinc-400' };
            const isOff = wo.type === 'Rest';

            return (
              <div 
                key={wo.dayName}
                className={`border rounded-xl p-4 transition flex flex-col justify-between ${
                  isOff 
                    ? 'bg-[#121214]/40 border-white/5 opacity-70 col-span-1' 
                    : 'bg-[#0A0A0A] border-white/10 hover:border-vdot-orange/50 hover:shadow-xl col-span-1'
                }`}
                style={{ minHeight: '340px' }}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-vdot-orange uppercase font-mono tracking-widest">{wo.dayName}</span>
                    <span className={`border text-[9px] px-2 py-0.5 rounded font-extrabold tracking-tight ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white font-sans line-clamp-2 leading-tight">{wo.title}</h4>
                </div>

                {/* Card middle: Workout distance / intensity */}
                <div className="my-3.5 pt-3 border-t border-white/5 space-y-1 bg-[#050505] p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-xs text-slate-450">
                    <span>Metragem:</span>
                    <strong className="text-white font-mono font-bold">{isOff ? 'OFF' : `${wo.distanceKm} km`}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-450">
                    <span>Intensidade:</span>
                    <span className="text-vdot-orange font-bold font-mono text-[10px] truncate max-w-[120px]" title={wo.intensity}>{wo.intensity}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-auto">
                  <p className="text-xs text-slate-350 leading-relaxed font-sans line-clamp-5">
                    {wo.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚡ Pliometria & Economia de Corrida Section */}
      <div id="pliometria-science-guide" className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Header with gradient badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Manual Científico de Desempenho
            </span>
            <h3 className="text-lg font-black text-white uppercase tracking-tight font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-vdot-orange" />
              Pliometria & Economia de Corrida para Ironman
            </h3>
            <p className="text-xs text-slate-400 max-w-3xl font-sans">
              Segredos fisiológicos da força explosiva elástica para otimizar a economia de corrida na maratona final de 42km do Ironman.
            </p>
          </div>
          
          <div className="bg-[#FF4E00]/10 border border-[#FF4E00]/20 rounded-xl px-3.5 py-2 text-right hidden sm:block shrink-0">
            <div className="text-[9px] text-[#FF4E05]/80 font-black uppercase tracking-wider">Economia de Corrida</div>
            <div className="text-lg font-bold font-mono text-emerald-400">+4% a 8%</div>
            <div className="text-[8px] text-slate-500 font-bold">Consumo O₂ Reduzido</div>
          </div>
        </div>

        {/* 1. O que é Pliometria & Por que Ironman precisa (Explicação Científica) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-vdot-orange flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-vdot-orange inline-block"></span>
              O que é Pliometria?
            </h4>
            <p className="text-xs text-slate-350 leading-relaxed font-sans">
              Pliometria é um tipo de treino de força explosiva que utiliza o <strong className="text-white font-semibold">Ciclo de Alongamento-Encurtamento (CAE)</strong>. 
              Na prática, são exercícios com saltos, lançamentos e impactos controlados, onde o músculo primeiro se estica rapidamente 
              (fase excêntrica) e depois encurta de imediato (fase concêntrica). 
              O objetivo principal é ensinar o sistema nervoso e os tendões a se comportarem como <strong className="text-white font-semibold">molas altamente eficientes</strong>, gerando força máxima no menor tempo possível (potência reativa).
            </p>
          </div>

          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-vdot-orange flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-vdot-orange inline-block"></span>
              Por que um Ironman Precisa Disso?
            </h4>
            <div className="text-xs text-slate-350 leading-relaxed font-sans space-y-1.5">
              <p>Ao contrário dos velocistas, o foco para triatletas é aprimorar a <strong className="text-white font-semibold">Economia de Corrida (Running Economy)</strong>:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-slate-305 font-semibold text-slate-300">Menos consumo de O₂:</strong> Estudos mostram que o treino pliométrico reduz o consumo de oxigênio de 4% a 8% no mesmo ritmo.</li>
                <li><strong className="text-slate-305 font-semibold text-slate-300">Reforço Tendinoso e Ósseo:</strong> Aumenta a rigidez (stiffness) do tendão de Aquiles, prevenindo fraturas de estresse e tendinites na maratona.</li>
                <li><strong className="text-slate-305 font-semibold text-slate-300">Transição de Postura:</strong> Ajuda a recalibrar os comandos musculares e mecânicos de corrida após horas na postura estática da bike.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Diagnóstico Dinâmico */}
        <div className="bg-amber-950/15 border border-amber-500/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wide font-mono">
              Avaliação de Carga Neuromuscular (Ex-Sedentário a Futuro Ironman)
            </h4>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Você está classificado como nível <span className="capitalize font-mono font-bold text-white">{runnerState.level}</span> com <strong className="text-white">{weeksLimit} semanas de atividade consistente</strong>. 
              {recommendedPhase === 1 ? (
                <span> O algoritmo de segurança determina que seu foco deve ser obrigatoriamente a <strong className="text-amber-400">Fase 1: Preparação Básica e Força Geral</strong>. Saltos precoces sob fadiga gerada por treinos longos de pedal/corrida são a rota direta para fascite plantar e dores tibiais.</span>
              ) : recommendedPhase === 2 ? (
                <span> Seu tempo de consistência habilita com segurança a <strong className="text-amber-400">Fase 2: Força Reativa Leve</strong>. Iniciando a rigidez elástica com baixíssimo deslocamento vertical.</span>
              ) : recommendedPhase === 3 ? (
                <span> Excelente base protetora! Sinta-se confortável em realizar a <strong className="text-emerald-450 font-semibold text-emerald-400">Fase 3: Pliometria de Baixo Impacto</strong> com treinos de corda rápidos e focando rigorosamente no silêncio de impacto.</span>
              ) : (
                <span> Habilitado para a <strong className="text-emerald-455 font-semibold text-emerald-400">Fase 4: Pliometria de Transição Específica</strong> com afundos pliométricos rápidos e treinos unilaterais precisos de manutenção.</span>
              )}
            </p>
          </div>
        </div>

        {/* 3. Abas de Fase de Pliometria */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Phases de Progressão Segura (Selecione para detalhar)
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: 1, title: '1. Base de Força', sub: '3-6 meses obrigatórios' },
              { id: 2, title: '2. Força Reativa Leve', sub: '2-3 meses de mola' },
              { id: 3, title: '3. Baixo Impacto', sub: 'Corda / Saltos rápidos' },
              { id: 4, title: '4. Pliometria Específica', sub: 'Afundos e Saltos unilaterais' },
            ].map((p) => {
              const isSelected = pliometriaPhase === p.id;
              const isRec = recommendedPhase === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPliometriaPhase(p.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                    isSelected 
                      ? 'bg-vdot-orange border-vdot-orange text-black font-extrabold shadow-[0_0_15px_rgba(255,78,0,0.2)]' 
                      : 'bg-[#121214] border-white/5 hover:border-white/10 hover:bg-white/5 text-slate-350'
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wide font-black truncate w-full flex items-center justify-between">
                    <span>{p.title}</span>
                    {isRec && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-1 shrink-0 ${isSelected ? 'bg-black/10 text-black' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        Recomendado
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-black/75' : 'text-slate-500'}`}>{p.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Aba Ativa */}
          <div className="bg-[#050505] border border-white/5 rounded-xl p-5 space-y-3">
            {pliometriaPhase === 1 ? (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase font-display flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    Fase 1: Preparação Muscular e Força Concreta
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">Volume de Impacto: Zero</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong className="text-white">O que fazer:</strong> Fortalecer a estrutura geral de tendões, ligamentos e o core sem nenhum tipo de impacto aéreo. Prepare o corpo para aguentar os treinamentos pliométricos reais que virão no futuro.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Agachamento Bilateral Livre</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Foco absoluto na descida (fase excêntrica) demorando de 3 a 4 segundos, subindo de forma ágil e explosiva. Executar 3 séries de 10-12 reps.</p>
                  </div>
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Elevação de Gêmeos no Degrau</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Apoiar as pontas dos pés no degrau, descer ao máximo e subir rapidamente contraindo forte a panturrilha. 3 séries de 15 reps controladas.</p>
                  </div>
                </div>
              </div>
            ) : pliometriaPhase === 2 ? (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase font-display flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    Fase 2: Força Reativa Leve (Molas Ativas)
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">Volume de Impacto: Mínimo</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong className="text-white">O que fazer:</strong> Movimentos elétricos rápidos no próprio lugar sem tirar os pés do chão drasticamente. Ensina o cérebro a aumentar a resposta reativa motora com impacto residual mínimo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Jumping Jacks Suaves</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Polichinelos rápidos, porém amortecendo as descidas de forma que o calcanhar encoste minimamente no solo. 3 séries de 30-40 segundos.</p>
                  </div>
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Skipping Baixo de Cadência</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Corrida estacionária tirando apenas a ponta dos pés do solo a poucos centímetros. Quadril alto, braços coordenados em alta velocidade. 3x30 segundos.</p>
                  </div>
                </div>
              </div>
            ) : pliometriaPhase === 3 ? (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase font-display flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Fase 3: Pliometria de Baixo Impacto (Impacto Controlado)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">Contatos: ~30-40 por Sessão</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong className="text-white">O que fazer:</strong> Pequenos saltos bilaterais curtos focado na rapidez e no amortecimento. Imagine que o "chão está pegando fogo" para decolar rapidamente a cada sutil contato.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Salto à Corda Curto</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Saltos normais de corda subindo apenas 1-2 cm do solo. Concentre em não flexionar demais os joelhos e mola do tornozelo. 3 séries de 20-30 repetições.</p>
                  </div>
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Salto Retido Vertical Contido</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Corpo enrijecido como um lápis rígido. Saltar verticalmente usando exclusivamente a elasticidade da panturrilha e pé. 3 séries de 6-8 pulos rápidos consecutivos.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase font-display flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Fase 4: Pliometria de Transição Específica
                  </h4>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">Contatos: ~20-30 Máximo</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong className="text-white">O que fazer:</strong> Saltos unilaterais avançados que copiam a cinemática e as passadas da corrida, desenvolvendo rigidez mecânica máxima. Use apenas com supervisão ou se muito avançado.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Afundo Alternado com Salto (Split Jump)</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Troca de pernas ágil no ar com pequeno salto. Aterrar absorvendo de forma suave e controlada. 2 séries de 5 saltos por perna.</p>
                  </div>
                  <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-vdot-orange font-mono">Saltos Laterais de Estabilidade</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Salto horizontal de um lado para o outro. Ao apoiar com a perna oposta, estabilize por 2 segundos antes de ejetar de volta. 2 séries de 10 contatos totais.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. A Técnica é Tudo & Programação Estratégica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <TrendingUp className="w-4 h-4 text-[#FF4E00]" />
              Como Aterrar: A Técnica é Tudo!
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              O segredo para transformar articulações em molas elásticas é reduzir drasticamente o tempo de contato e ruído com o chão:
            </p>
            <ul className="text-xs text-slate-305 space-y-1.5 mt-2 list-none pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-[#FF4E00] font-mono font-bold">•</span>
                <span><strong className="text-white">Aterrissagem ativa:</strong> Apoie sempre o terço anterior do pé (metatarso), nunca solte o calcanhar rígido direto no chão.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#FF4E00] font-mono font-bold">•</span>
                <span><strong className="text-white">Joelhos Alinhados:</strong> Evite a rotação interna dinâmica. Mantenha os joelhos totalmente simétricos e alinhados verticalmente com as pontas dos pés.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#FF4E00] font-mono font-bold">•</span>
                <span><strong className="text-white">Absorção Silenciosa:</strong> Seus saltos devem ser totalmente silenciosos. Ruídos excessivos significam sobrecarga articular sem absorção mecânica eficiente.</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Calendar className="w-4 h-4 text-[#FF4E00]" />
              Integração Periódica no Ciclo Ironman
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              Organize a pliometria de acordo com o estágio da sua planilha de 8 semanas para manter o corpo descansado e elástico:
            </p>
            <ul className="text-xs text-slate-305 space-y-2 mt-2 list-none pl-1">
              <li className="border-l-2 border-[#FF4E00] pl-2">
                <strong className="text-white">Período de Base:</strong> Foco exclusivo em fundação de força e quilometragem. <strong className="text-amber-500">Zero pliometria ativa</strong> de saltos.
              </li>
              <li className="border-l-2 border-[#FF4E00] pl-2">
                <strong className="text-white">Período de Construção:</strong> Introdução seletiva (1x por semana). Volume baixíssimo (20-30 contatos) num dia de treino leve, nunca após treinos longos de corrida.
              </li>
              <li className="border-l-2 border-[#FF4E00] pl-2">
                <strong className="text-white">Período de Pico/Polimento:</strong> Manutenção em baixas e rápida resposta elástica. Suspenda completamente o impacto <strong className="text-amber-500">2 a 3 semanas antes</strong> da prova alvo.
              </li>
            </ul>
          </div>

        </div>

        {/* Exemplo de Sessão Prática */}
        <div className="bg-[#FF4E00]/5 border border-[#FF4E00]/15 p-4 rounded-xl text-xs space-y-1">
          <div className="font-extrabold text-[#FF4E00] uppercase tracking-wide flex items-center gap-1 font-mono">
            <span>⚡ Exemplo de Rotina Prática Recomendada (Para Atletas Habilitados):</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed">
            Após aquecimento leve com trote e mobilidade de quadril, realize: 
            <strong className="text-white"> 3x20 contatos de cordas</strong> (salto curtinho de 2cm) + 
            <strong className="text-white"> 3x6 saltos de lápis</strong> (verticais sem dobrar joelhos) + 
            <strong className="text-white"> 2x5 split jumps por perna</strong>. 
            Mantenha intervalo generoso e interrompa o treino imediatamente ao menor sinal de dores tibiais ou tendinosas.
          </p>
        </div>

      </div>

    </div>
  );
}
