import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Heart, Calendar, Snowflake, Zap, Activity } from 'lucide-react';
import PainTracker from './PainTracker';
import { RunnerState, PainReport } from '../types';

interface RecoveryTabProps {
  runnerState?: RunnerState;
  onUpdatePains?: (updatedPains: PainReport[]) => void;
}

export default function RecoveryTab({ runnerState, onUpdatePains }: RecoveryTabProps) {
  // Assessment questions states
  const [q1, setQ1] = useState<boolean>(false); // fatigue
  const [q2, setQ2] = useState<boolean>(false); // mood
  const [q3, setQ3] = useState<boolean>(false); // HR elevation
  const [q4, setQ4] = useState<boolean>(false); // sleep
  const [q5, setQ5] = useState<boolean>(false); // sharp local pain

  // Count positive responses
  const score = [q1, q2, q3, q4, q5].filter(Boolean).length;

  return (
    <div id="recovery-tab-container" className="space-y-8">
      
      {/* Seção 1: Pain Tracker & Discomfort Tracker */}
      {runnerState && onUpdatePains && (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#FF4E00]" />
                Diário de Incômodos, Dores & Adaptação Cineto-Muscular
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Reporte dores leves, moderadas ou fortes. O algoritmo recalibra automaticamente sua planilha de treinos para evitar lesões.
              </p>
            </div>
          </div>

          <PainTracker runnerState={runnerState} onUpdatePains={onUpdatePains} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Interactive Overtraining Assessment Quiz */}
        <div id="overtraining-quiz-card" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl h-fit space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Checklist de Prevenção & Overtraining
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Marque os sintomas recorrentes nos últimos 5-7 dias para verificar seu nível de adaptação biológica à planilha.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Q1 */}
            <label className="flex items-start space-x-3 cursor-pointer group text-sm select-none">
              <input 
                type="checkbox" 
                checked={q1}
                onChange={() => setQ1(!q1)}
                className="mt-1 rounded border-white/20 bg-black text-vdot-orange focus:ring-vdot-orange cursor-pointer w-4 h-4"
              />
              <div className="text-slate-300 group-hover:text-white">
                <span className="font-extrabold block text-xs uppercase tracking-wide text-slate-100">Fadiga Crônica Persistente</span>
                <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">Sensação de pernas pesadas e cansaço excessivo mesmo nas tarefas comuns.</span>
              </div>
            </label>

            {/* Q2 */}
            <label className="flex items-start space-x-3 cursor-pointer group text-sm select-none">
              <input 
                type="checkbox" 
                checked={q2}
                onChange={() => setQ2(!q2)}
                className="mt-1 rounded border-white/20 bg-black text-vdot-orange focus:ring-vdot-orange cursor-pointer w-4 h-4"
              />
              <div className="text-slate-300 group-hover:text-white">
                <span className="font-extrabold block text-xs uppercase tracking-wide text-slate-100">Alterações de Humor</span>
                <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">Irritabilidade elevada, ansiedade ou falta de motivação generalizada para treinar.</span>
              </div>
            </label>

            {/* Q3 */}
            <label className="flex items-start space-x-3 cursor-pointer group text-sm select-none">
              <input 
                type="checkbox" 
                checked={q3}
                onChange={() => setQ3(!q3)}
                className="mt-1 rounded border-white/20 bg-black text-vdot-orange focus:ring-vdot-orange cursor-pointer w-4 h-4"
              />
              <div className="text-slate-300 group-hover:text-white">
                <span className="font-extrabold block text-xs uppercase tracking-wide text-slate-100">FC de Repouso Elevada</span>
                <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">Sua frequência cardíaca ao acordar está &gt; 5-7 bpm acima do seu histórico comum.</span>
              </div>
            </label>

            {/* Q4 */}
            <label className="flex items-start space-x-3 cursor-pointer group text-sm select-none">
              <input 
                type="checkbox" 
                checked={q4}
                onChange={() => setQ4(!q4)}
                className="mt-1 rounded border-white/20 bg-black text-vdot-orange focus:ring-vdot-orange cursor-pointer w-4 h-4"
              />
              <div className="text-slate-300 group-hover:text-white">
                <span className="font-extrabold block text-xs uppercase tracking-wide text-slate-100">Sono Prejudicado ou Agitado</span>
                <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">Dificuldade para iniciar o sono, múltiplos despertares noturnos ou suores incomuns.</span>
              </div>
            </label>

            {/* Q5 - Sharp Local Pain */}
            <label className="flex items-start space-x-3 cursor-pointer group text-sm select-none border-t border-white/5 pt-3">
              <input 
                type="checkbox" 
                checked={q5}
                onChange={() => setQ5(!q5)}
                className="mt-1 rounded border-rose-800 bg-black text-rose-500 focus:ring-rose-500 cursor-pointer w-4 h-4"
              />
              <div className="text-slate-300 group-hover:text-white">
                <span className="font-black block text-xs uppercase tracking-wide text-rose-450">Dor Aguda Localizada Recorrente</span>
                <span className="text-[11px] text-rose-400 block leading-tight mt-0.5">Dor que piora ao pisar (canela, joelho, calcanhar ou tendão de aquiles).</span>
              </div>
            </label>
          </div>
        </div>

        {/* Col 2 & 3: Results and Protocols */}
        <div id="recovery-protocols-results" className="lg:col-span-2 space-y-6">
          
          {/* Risk Diagnostic Banner */}
          <div id="diagnostic-result-banner" className={`rounded-xl p-5 border flex flex-col md:flex-row items-center gap-4 ${
            score >= 4 || q5
              ? 'bg-rose-950/40 border-rose-800 text-rose-100'
              : score >= 2
                ? 'bg-amber-950/40 border-amber-800 text-amber-100'
                : 'bg-emerald-950/45 border-emerald-800 text-emerald-100'
          }`}>
            <div className="shrink-0">
              {score >= 4 || q5 ? (
                <ShieldAlert className="w-12 h-12 text-rose-500" />
              ) : score >= 2 ? (
                <ShieldAlert className="w-12 h-12 text-amber-500" />
              ) : (
                <ShieldCheck className="w-12 h-12 text-emerald-500" />
              )}
            </div>
            
            <div className="space-y-1 text-center md:text-left">
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-80 text-white">Risco Adaptativo Diagnosticado</div>
              <h4 className="text-base font-extrabold font-sans">
                {score >= 4 || q5 
                  ? 'ALERTA: Risco Muito Alto / Perigo de Lesão' 
                  : score >= 2 
                    ? 'AVISO: Risco Moderado de Fadiga Sistêmica' 
                    : 'Recuperação Excelente / Ótima Adaptação à Planilha'}
              </h4>
              <p className="text-xs leading-relaxed opacity-90 max-w-xl font-sans">
                {score >= 4 || q5
                  ? 'Seu corpo está exibindo múltiplos sinais clínicos de sobrecarga fisiológica e estrutural. Ignorar estes sintomas pode resultar em lesões inflamatórias severas ou síndrome de frustração sistêmica.'
                  : score >= 2
                    ? 'Você está no limite de fadiga produtiva. Sugere-se reduzir o volume dos treinos da próxima semana em 20% a 30% ou trocar um dia de rodagem por repouso absoluto, evitando tiros rápidos temporariamente.'
                    : 'Sinal verde! O treinamento está sendo absorvido corretamente. Mantenha os seus hábitos de hidratação e sono profundo atuais para continuar evoluindo de forma contínua.'}
              </p>
            </div>
          </div>

          {/* CLINICAL DOOR WARNINGS GUARD */}
          {q5 && (
            <div id="critical-medical-guard" className="bg-rose-950 border border-red-500 text-white rounded-xl p-6 space-y-3 shadow-lg animate-pulse">
              <div className="flex items-center space-x-2 border-b border-red-800 pb-2">
                <ShieldAlert className="w-5 h-5 text-vdot-orange" />
                <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-vdot-orange">⚠ ADVERTÊNCIA MÉDICA DE SEGURANÇA</h3>
              </div>
              <p className="text-xs leading-relaxed font-semibold">
                CRÍTICO: Você relatou DOR AGUDA LOCALIZADA RECORRENTE nas articulações, ossos ou tendões. 
              </p>
              <p className="text-xs leading-relaxed font-sans opacity-95">
                Por favor, <strong>interrompa imediatamente todas as atividades de corrida com impacto</strong>. Dores localizadas persistentes podem sinalizar patologias clínicas graves, como <strong>fratura por estresse na tíbia, tendinopatia patelar ou estiramentos musculares complexos</strong>. Consulte um médico ortopedista ou fisioterapeuta de confiança antes de calçar os tênis novamente.
              </p>
            </div>
          )}

          {/* Protocolo de Recuperação Ativa */}
          <div id="active-recovery-card" className="bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                <Snowflake className="w-4 h-4 text-sky-400" />
                Guia de Protocolos de Recuperação Ativa (Otimizar Regeneração)
              </h3>
              <p className="text-xs text-slate-400">Procedimentos estruturados para acelerar a depuração de metabólitos corporais e consolidar a síntese de mitocôndrias.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Protocol Item 1 */}
              <div className="border border-white/5 bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-vdot-orange uppercase tracking-wide">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>1. Rodagem Regenerativa Ativa (Easy S1)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Realize um trote contínuo super-fácil de 20 a 30 minutos em ritmo de caminhada acelerada ou Z1 cardíaco. O objetivo é unicamente forçar o bombeamento do músculo sem fadigá-lo, limpando o lactato acumulado nas pernas sem gerar estresse inflamatório mecânico.
                </p>
              </div>

              {/* Protocol Item 2 */}
              <div className="border border-white/5 bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-vdot-orange uppercase tracking-wide">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>2. Liberação Miofascial Cuidadosa</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Utilize um rolo de espuma (foam roller) ou uma bola de tênis sob a sola do pé (fáscia plantar), panturrilhas, banda iliotibial e glúteos. Faça movimentos lentos e controlados por 45-60 segundos por ponto de dor para soltar pontos gatilho.
                </p>
              </div>

              {/* Protocol Item 3 */}
              <div className="border border-white/5 bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-vdot-orange uppercase tracking-wide">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>3. Alongamento Passivo e Mobilidade</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Realize alongamentos estáticos pós-treino ou em dias de OFF focando na mobilidade de quadril, panturrilhas (sóleo e gastrocnêmio) e isquiotibiais. Mantenha cada postura por 30 segundos, sem pressa, respirando suavemente pelo nariz.
                </p>
              </div>

              {/* Protocol Item 4 */}
              <div className="border border-white/5 bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-vdot-orange uppercase tracking-wide">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>4. Hidratação Profunda Osmótica</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Beba aproximadamente 35ml a 40ml de água por quilo de peso corporal por dia. Insira uma dose de eletrólitos (sódio, potássio, magnésio) em dias quentes para repor os sais eliminados na transpiração e evitar cãibras ou dores musculares tardias.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
