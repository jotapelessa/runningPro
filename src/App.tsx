import React, { useState, useMemo } from 'react';
import { RunnerState } from './types';
import { 
  calculatePaceZones, 
  getKarvonenZones, 
  getPredictions, 
  generate8WeekPlan 
} from './lib/vdot';
import CalculatorTab from './components/CalculatorTab';
import PredictorTab from './components/PredictorTab';
import PlanTab from './components/PlanTab';
import RecoveryTab from './components/RecoveryTab';
import RacesTab from './components/RacesTab';
import GuideTab from './components/GuideTab';
import WorkoutImporter from './components/WorkoutImporter';
import CoachChat from './components/CoachChat';
import AthleteModal from './components/AthleteModal';
import { 
  Flame, 
  Compass, 
  TrendingUp, 
  Calendar, 
  Heart, 
  HelpCircle, 
  Sparkles,
  Info,
  X,
  ClipboardList,
  ChevronRight,
  BookOpen,
  Watch
} from 'lucide-react';
import { ParsedWorkout } from './lib/gpxParser';

export default function App() {
  // Initialize with exact example data from instructions:
  // FCmax 190, FCR 55, corre 5k em 22:30 (VDOT ≈ 41.8)
  const [runnerState, setRunnerState] = useState<RunnerState>({
    macHR: 190,
    restHR: 55,
    level: 'intermediate',
    weeklyVolume: 40,
    weeksActive: 8,
    currentVdot: 41.8,
    currentVo2max: 42.6,
    history: [],
    age: 32,
    gender: 'male',
    weight: 72,
    trainingDays: 4,
    goal: 'Completar meus primeiros 5k de forma confortável.'
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'plan' | 'predictor' | 'recovery' | 'races' | 'guide' | 'import'>('guide');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Procedurally calculate derived attributes using memozations
  const paceZones = useMemo(() => calculatePaceZones(runnerState.currentVdot), [runnerState.currentVdot]);
  const hrZones = useMemo(() => getKarvonenZones(runnerState.macHR, runnerState.restHR), [runnerState.macHR, runnerState.restHR]);
  const predictions = useMemo(() => getPredictions(runnerState.currentVdot), [runnerState.currentVdot]);
  
  const planWeeks = useMemo(() => {
    return generate8WeekPlan(
      runnerState.currentVdot, 
      runnerState.level, 
      runnerState.weeklyVolume, 
      runnerState.weeksActive, 
      runnerState.macHR, 
      runnerState.restHR,
      runnerState.pains
    );
  }, [runnerState.currentVdot, runnerState.level, runnerState.weeklyVolume, runnerState.weeksActive, runnerState.macHR, runnerState.restHR, runnerState.pains]);

  const activePainsCount = (runnerState.pains || []).filter(p => !p.resolved).length;

  const handleUpdatePains = (updatedPains: PainReport[]) => {
    setRunnerState(prev => ({ ...prev, pains: updatedPains }));
  };

  const handleSaveAthleteProfile = (updatedState: RunnerState) => {
    setRunnerState(updatedState);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#050505] text-[#E0E0E0] selection:bg-[#FF4E00] selection:text-black">
      
      {/* Top Immersive Navigation Header */}
      <header className="bg-[#0A0A0A] border-b border-white/10 py-4 px-6 sticky top-0 z-40 shadow-xl shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FF4E00] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,78,0,0.5)] text-black shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-white flex items-center gap-1.5 leading-none font-display">
                PaceLab VDOT
                <span className="text-[10px] transform rotate-3 non-italic font-mono font-black px-2 py-0.5 rounded-full bg-white/10 text-[#FF4E00] tracking-normal">v3.5</span>
              </h1>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Treinador Portátil & Calculadora de Corrida Procedimental</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Stats Strip (Immersive Theme) */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 select-none">
              <span className="px-2.5 py-1 bg-[#0A0A0A] rounded-lg border border-white/5 text-slate-300">
                VDOT: <span className="text-[#FF4E00]">{runnerState.currentVdot.toFixed(1)}</span>
              </span>
              <span className="px-2.5 py-1 bg-[#0A0A0A] rounded-lg border border-white/5 text-slate-300 capitalize">
                {runnerState.level === 'beginner' ? 'Iniciante' : runnerState.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </span>
              <span className="px-2.5 py-1 bg-[#0A0A0A] rounded-lg border border-white/5 text-slate-300">
                {runnerState.weeklyVolume} km/s
              </span>
            </div>

            {/* Glowing Prominent Athlete Intake Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF4E00] to-amber-500 hover:from-amber-500 hover:to-[#FF4E00] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(255,78,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-black" />
              <span>📋 FICHA DO ATLETA</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout Area - Clean Full Width */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Onboarding Welcome Banner if modal hasn't been configured or custom CTA */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-vdot-orange/15 text-vdot-orange border border-vdot-orange/20 font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full inline-block mb-1">Dica de Treinador</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-vdot-orange" />
              Calibre sua planilha e faixas desportivas no formulário oficial
            </h2>
            <p className="text-xs text-zinc-400 font-sans max-w-3xl">
              Clique em <strong>Ficha do Atleta</strong> para registrar sua idade, sexo biológico, volume de treino, metas e melhor tempo recente. Isso gera instantaneamente o planejamento periodizado de corrida de Jack Daniels, zonas de frequência de Karvonen e alimenta as respostas técnicas do Coach chatbot!
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 self-start md:self-center bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0"
          >
            <span>Configurar Perfil Fisiológico</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Interactive Labs Dashboard Slots */}
        <div id="calculator-tab-view" className="space-y-6">
          
          {/* Tabs selectors bar (Immersive Dark Design) */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-1.5 flex flex-wrap gap-1.5 shadow-xl">
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'guide' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📖 Guia & Tutorial</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'import' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Watch className="w-4 h-4" />
              <span>Importar Relógio (Amazfit)</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'calculator' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Zonas de Pace & Testes</span>
            </button>

            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'plan' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planilha 8S ({runnerState.trainingDays} dias/s)</span>
            </button>

            <button
              onClick={() => setActiveTab('predictor')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'predictor' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-[#FF4E00]/10 hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Previsões de Prova</span>
            </button>

             <button
              onClick={() => setActiveTab('recovery')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'recovery' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Recuperação Ativa</span>
            </button>

            <button
              onClick={() => setActiveTab('races')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                activeTab === 'races' 
                  ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.35)]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Corridas no Brasil</span>
            </button>
          </div>

          {/* Active Tab rendering */}
          <div id="labs-view-content" className="transition-all duration-300">
            {activeTab === 'guide' && (
              <GuideTab 
                runnerState={runnerState}
                onOpenProfileModal={() => setIsModalOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'calculator' && (
              <CalculatorTab 
                runnerState={runnerState}
                setRunnerState={setRunnerState}
                paceZones={paceZones}
                hrZones={hrZones}
              />
            )}
            {activeTab === 'plan' && (
              <PlanTab 
                planWeeks={planWeeks}
                runnerState={runnerState}
              />
            )}
            {activeTab === 'predictor' && (
              <PredictorTab 
                predictions={predictions}
                vdot={runnerState.currentVdot}
              />
            )}
            {activeTab === 'recovery' && (
              <RecoveryTab 
                runnerState={runnerState}
                onUpdatePains={handleUpdatePains}
              />
            )}
            {activeTab === 'import' && (
              <WorkoutImporter 
                runnerState={runnerState}
                onApplyWorkout={(w) => {
                  setRunnerState(prev => ({
                    ...prev,
                    currentVdot: w.calculatedVDOT,
                    macHR: w.maxHeartRate && w.maxHeartRate > 100 ? w.maxHeartRate : prev.macHR,
                    history: [
                      {
                        id: Date.now().toString(),
                        date: new Date().toLocaleDateString('pt-BR'),
                        type: 'vdot_direct',
                        value: w.calculatedVDOT,
                        vo2max: Math.round(w.calculatedVDOT * 1.02 * 10) / 10,
                        vdot: w.calculatedVDOT
                      },
                      ...prev.history
                    ]
                  }));
                  setActiveTab('calculator');
                }}
              />
            )}
            {activeTab === 'races' && (
              <RacesTab runnerState={runnerState} />
            )}
          </div>
        </div>

      </main>

      {/* Floating Interactive Chat Coach Widget Overlay */}
      <div id="coach-floating-widget" className="fixed right-6 bottom-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-4 w-[385px] md:w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[80vh] shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 rounded-2xl overflow-hidden bg-slate-950 flex flex-col transition-all duration-300">
            <CoachChat 
              runnerState={runnerState}
              activePlan={planWeeks}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_25px_rgba(255,78,0,0.45)] hover:scale-105 active:scale-95 ${
            isChatOpen 
              ? 'bg-rose-600 hover:bg-rose-500 rotate-90 text-white' 
              : 'bg-[#FF4E00] hover:bg-opacity-95 text-black'
          }`}
          title={isChatOpen ? "Fechar Conversa" : "Conversar com o Treinador IA"}
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full" />
            </div>
          )}
        </button>
      </div>

      {/* Profile Registration Intake Modal */}
      <AthleteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        runnerState={runnerState}
        onSave={handleSaveAthleteProfile}
      />

      {/* Immersive Footer Status Bar */}
      <footer className="px-8 py-5 bg-[#0a0a0a] border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 mt-auto shrink-0">
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center text-center sm:text-left mb-3 sm:mb-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse" />
            Status: Sincronizado
          </span>
          <span>Cadastro: {runnerState.age ? 'Ficha Integrada' : 'Simplificado'}</span>
          <span>Dias de Treino: {runnerState.trainingDays} dias/s</span>
        </div>
        <div>
          © 2026 VDOT Coach • Prescrição Segura Ativa
        </div>
      </footer>

    </div>
  );
}
