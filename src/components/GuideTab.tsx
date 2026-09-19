import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Target, 
  Flame, 
  Zap, 
  Sparkles, 
  Activity, 
  Compass, 
  Calendar, 
  TrendingUp, 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ShieldAlert,
  Info,
  Sliders,
  UserCheck,
  Award
} from 'lucide-react';
import { RunnerState } from '../types';

interface GuideTabProps {
  runnerState: RunnerState;
  onOpenProfileModal: () => void;
  onNavigateTab: (tab: 'calculator' | 'plan' | 'predictor' | 'recovery' | 'races') => void;
}

export default function GuideTab({ runnerState, onOpenProfileModal, onNavigateTab }: GuideTabProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedPaceZone, setSelectedPaceZone] = useState<'E' | 'M' | 'T' | 'I' | 'R'>('E');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Pace Zones Details
  const paceZoneInfo = {
    E: {
      title: 'Zona E — Fácil / Corrida Leve (Easy Pace)',
      badge: '60% - 79% VDOT',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      description: 'Ritmo conversacional e regenerativo. Essencial para construir base aeróbica, fortalecer tendões e vascularização muscular sem gerar estresse excessivo.',
      whenToUse: 'Aquecimentos, desaquecimentos, treinos regenerativos e nos treinos longos de base.',
      tip: 'Você deve ser capaz de manter uma conversa em frases completas sem ficar ofegante.'
    },
    M: {
      title: 'Zona M — Pace de Maratona (Marathon Pace)',
      badge: '80% - 85% VDOT',
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
      description: 'Ritmo sustentado e aeróbico específico para provas longas. Ensina o corpo a utilizar gordura como fonte primária de energia em ritmos mais fortes.',
      whenToUse: 'Blocos específicos em treinos longos e simulados para Maratona ou Meia Maratona.',
      tip: 'Ritmo firme, porém você não sente acúmulo de ácido lático imediato.'
    },
    T: {
      title: 'Zona T — Limiar de Lactato (Threshold Pace)',
      badge: '86% - 90% VDOT',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      description: 'Conhecido como o ritmo "confortavelmente desconfortável". É a velocidade máxima em que o corpo consegue remover o lactato no mesmo ritmo em que ele é produzido.',
      whenToUse: 'Treinos de Tempo Run (20 a 40 min contínuos) ou repetições longas com pouco descanso (ex: 5x 1km T com 1min de pausa).',
      tip: 'Requer alta concentração. Consegue falar apenas palavras soltas.'
    },
    I: {
      title: 'Zona I — Tiro de VO2máx (Interval Pace)',
      badge: '97% - 100% VDOT',
      color: 'border-vdot-orange/40 bg-vdot-orange/10 text-vdot-orange',
      description: 'Treino de consumo máximo de oxigênio (VO2máx). Expande a capacidade do sistema cardiovascular e a potência aeróbica.',
      whenToUse: 'Tiros de 400m a 1200m com tempo de descanso equivalente a 80-100% do tempo de tiro.',
      tip: 'Esforço de prova de 3k a 5k. Muito exigente fisicamente e mentalmente.'
    },
    R: {
      title: 'Zona R — Repetição e Velocidade Pura (Repetition Pace)',
      badge: '> 100% VDOT',
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
      description: 'Foco na economia de corrida, mecânica da passada, recrutamento neuromuscular e velocidade anaeróbica.',
      whenToUse: 'Tiros curtos (200m a 400m) com descanso total entre cada tiro para manter a técnica perfeita.',
      tip: 'Não é um tiro descontrolado ("sprint total"), mas sim velocidade com postura e fluidez perfeitas.'
    }
  };

  const faqs = [
    {
      q: 'O que a ferramenta precisa exatamente para funcionar e gerar meus dados corretos?',
      a: 'A ferramenta exige 3 dados fundamentais: 1) Um tempo recente de prova/treino (distância e tempo em 5k, 10k, 21k ou 42k) ou seu VDOT direto; 2) Sua Frequência Cardíaca Máxima (FCM) e em Repouso (FCR); 3) Seu volume semanal atual e dias disponíveis para treinar. Você insere tudo no botão "Ficha do Atleta".'
    },
    {
      q: 'O que é o VDOT e como ele é calculado?',
      a: 'O VDOT é uma pontuação desenvolvida pelo lendário treinador Dr. Jack Daniels. Ele pega seu melhor tempo recente em prova e converte em um índice que reflete sua capacidade aeróbica real e economia de corrida, permitindo prescrever ritmos de treino sob medida.'
    },
    {
      q: 'Como interpretar as Zonas de Pace na aba de Calculadora?',
      a: 'Cada zona (E, M, T, I, R) representa uma intensidade fisiológica específica. Nunca corra seus treinos leves (E) no ritmo de limiar (T). Respeitar os ritmos indicados evita lesões e garante supercompensação nos treinos de tiros.'
    },
    {
      q: 'Com que frequência devo atualizar meus dados ou meu VDOT?',
      a: 'Atualize seu VDOT sempre que fizer um novo teste de campo ou correr uma prova oficial com tempo melhor. Caso esteja voltando de lesão ou de uma pausa, ajuste o VDOT levemente para baixo na Ficha do Atleta.'
    },
    {
      q: 'Como funciona a Frequência Cardíaca de Karvonen?',
      a: 'Diferente da frequência simples, a Fórmula de Karvonen leva em conta sua Frequência Cardíaca de Reserva (FCM - FCR). Isso personaliza suas zonas Z1 a Z5 com precisão muito maior, considerando o nível do seu condicionamento físico.'
    },
    {
      q: 'Como usar a Planilha de 8 Semanas de forma eficiente?',
      a: 'A planilha gera treinos específicos divididos em dias da semana. Respeite os dias de descanso (OFF). Os ritmos indicados na planilha derivam exatamente do seu VDOT atual.'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header Banner do Guia */}
      <div className="bg-gradient-to-r from-[#0A0A0A] via-[#121212] to-[#0A0A0A] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4E00]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4E00]/15 border border-[#FF4E00]/30 text-[#FF4E00] text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manual do Atleta & Guia Interativo</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-display tracking-tight uppercase italic">
            Como usar o PaceLab VDOT e Dominar seus Treinos
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed font-sans">
            Aprenda passo a passo o que a plataforma precisa para calibrar suas métricas, como interpretar as faixas de ritmo de Jack Daniels e tire o máximo proveito da sua planilha de treinos.
          </p>
        </div>
      </div>

      {/* SEÇÃO 1: O QUE A FERRAMENTA PEDE PARA FUNCIONAR (CHECKLIST EM 3 PASSOS) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4E00] text-black font-black flex items-center justify-center font-mono">1</div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#FF4E00]" />
            O que a ferramenta pede para funcionar corretamente
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Passo 1 */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/40 transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF4E00] bg-[#FF4E00]/10 px-2.5 py-1 rounded-lg border border-[#FF4E00]/20">PASSO 01</span>
                <UserCheck className="w-5 h-5 text-zinc-400" />
              </div>
              <h4 className="font-bold text-white text-base">Perfil Fisiológico & Saúde</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Insira sua <strong className="text-zinc-200">Idade, Sexo Biológico, Peso</strong> e dados cardíacos: <strong className="text-zinc-200">Frequência Cardíaca Máxima (FCM)</strong> e <strong className="text-zinc-200">Frequência Cardíaca em Repouso (FCR)</strong>.
              </p>
            </div>
            <div className="text-[11px] text-zinc-500 bg-white/5 p-2.5 rounded-xl border border-white/5 font-mono">
              💡 Usado no cálculo de Zonas Cardíacas de Karvonen (Z1 a Z5).
            </div>
          </div>

          {/* Passo 2 */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/40 transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF4E00] bg-[#FF4E00]/10 px-2.5 py-1 rounded-lg border border-[#FF4E00]/20">PASSO 02</span>
                <Award className="w-5 h-5 text-zinc-400" />
              </div>
              <h4 className="font-bold text-white text-base">Tempo Recente de Prova / VDOT</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Forneça seu melhor tempo recente em <strong className="text-zinc-200">5k, 10k, 21k ou 42k</strong> (ou ajuste seu valor de VDOT diretamente).
              </p>
            </div>
            <div className="text-[11px] text-zinc-500 bg-white/5 p-2.5 rounded-xl border border-white/5 font-mono">
              💡 Define seus paces exatos de treino (Easy, Tempo, Intervalos).
            </div>
          </div>

          {/* Passo 3 */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/40 transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF4E00] bg-[#FF4E00]/10 px-2.5 py-1 rounded-lg border border-[#FF4E00]/20">PASSO 03</span>
                <Calendar className="w-5 h-5 text-zinc-400" />
              </div>
              <h4 className="font-bold text-white text-base">Rotina & Volume Semanal</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Informe quantos <strong className="text-zinc-200">quilômetros você corre por semana (km/s)</strong>, seus <strong className="text-zinc-200">dias de treino disponíveis</strong> e seu <strong className="text-zinc-200">nível de experiência</strong>.
              </p>
            </div>
            <div className="text-[11px] text-zinc-500 bg-white/5 p-2.5 rounded-xl border border-white/5 font-mono">
              💡 Gera sua planilha de 8 semanas totalmente personalizada.
            </div>
          </div>

        </div>

        {/* Action CTA Box */}
        <div className="bg-[#0A0A0A] border border-[#FF4E00]/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#FF4E00]/10 via-[#0A0A0A] to-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4E00] text-black flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pronto para configurar seu perfil?</h4>
              <p className="text-xs text-zinc-400">Preencha sua Ficha do Atleta agora para ativar todos os cálculos da plataforma.</p>
            </div>
          </div>
          <button
            onClick={onOpenProfileModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FF4E00] hover:bg-amber-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(255,78,0,0.4)] transition uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Abrir Ficha do Atleta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEÇÃO 2: COMO INTERPRETAR AS ZONAS DE PACE (INTERATIVO) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4E00] text-black font-black flex items-center justify-center font-mono">2</div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FF4E00]" />
              Como Interpretar as Zonas de Pace de Jack Daniels
            </h3>
            <p className="text-xs text-zinc-400">Clique nas zonas abaixo para entender o objetivo fisiológico de cada intensidade.</p>
          </div>
        </div>

        {/* Tab Buttons for Zones */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 flex flex-wrap gap-2">
          {(['E', 'M', 'T', 'I', 'R'] as const).map((zoneKey) => {
            const isSelected = selectedPaceZone === zoneKey;
            return (
              <button
                key={zoneKey}
                onClick={() => setSelectedPaceZone(zoneKey)}
                className={`flex-1 min-w-[70px] py-2.5 px-3 rounded-xl font-bold font-mono text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSelected 
                    ? 'bg-[#FF4E00] text-black shadow-[0_0_15px_rgba(255,78,0,0.3)]' 
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>Zona {zoneKey}</span>
              </button>
            );
          })}
        </div>

        {/* Active Zone Detail Card */}
        {selectedPaceZone && (
          <div className={`bg-[#0A0A0A] border rounded-2xl p-6 space-y-4 transition-all duration-300 ${paceZoneInfo[selectedPaceZone].color}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <h4 className="text-lg font-black text-white font-display">
                {paceZoneInfo[selectedPaceZone].title}
              </h4>
              <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-white/10 border border-white/10 w-fit">
                {paceZoneInfo[selectedPaceZone].badge}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
              <div className="space-y-1.5">
                <span className="font-bold text-white uppercase tracking-wider text-[10px] text-zinc-400 font-mono">Objetivo Fisiológico:</span>
                <p className="leading-relaxed">{paceZoneInfo[selectedPaceZone].description}</p>
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-white uppercase tracking-wider text-[10px] text-zinc-400 font-mono">Quando Utilizar:</span>
                <p className="leading-relaxed">{paceZoneInfo[selectedPaceZone].whenToUse}</p>
              </div>
            </div>

            <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 flex items-start gap-2.5 text-xs text-amber-200/90 font-sans">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400">Dica Prática de Campo:</strong> {paceZoneInfo[selectedPaceZone].tip}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 3: NAVEGAÇÃO E RECURSOS DAS ABAS DA APLICAÇÃO */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4E00] text-black font-black flex items-center justify-center font-mono">3</div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#FF4E00]" />
            Guia de Funcionalidades das Abas
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Aba 1 */}
          <div 
            onClick={() => onNavigateTab('calculator')}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:text-[#FF4E00] transition">
                <Compass className="w-4 h-4 text-[#FF4E00]" />
                <span>Zonas de Pace & Testes</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FF4E00] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Exibe seus ritmos exatos de treino por km e por 400m, além das zonas cardíacas Z1 a Z5 (Karvonen). Permite simular novos tempos de prova.
            </p>
          </div>

          {/* Aba 2 */}
          <div 
            onClick={() => onNavigateTab('plan')}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:text-[#FF4E00] transition">
                <Calendar className="w-4 h-4 text-[#FF4E00]" />
                <span>Planilha de 8 Semanas</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FF4E00] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gera a estrutura completa de treinos semanais com distribuição de volume, dias OFF, rodagens leves, fartleks e treinos de tiros calculados.
            </p>
          </div>

          {/* Aba 3 */}
          <div 
            onClick={() => onNavigateTab('predictor')}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:text-[#FF4E00] transition">
                <TrendingUp className="w-4 h-4 text-[#FF4E00]" />
                <span>Previsões de Prova</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FF4E00] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mostra estimativas realistas do seu tempo potencial para 1.5k, 3k, 5k, 10k, Meia Maratona (21k) e Maratona (42k) com base no seu VDOT atual.
            </p>
          </div>

          {/* Aba 4 */}
          <div 
            onClick={() => onNavigateTab('recovery')}
            className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4E00]/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:text-[#FF4E00] transition">
                <Heart className="w-4 h-4 text-[#FF4E00]" />
                <span>Recuperação Ativa</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FF4E00] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Orientações essenciais de sono, hidratação, nutrição pós-treino, liberação miofascial e prevenção de lesões para manter você correndo longe da dor.
            </p>
          </div>

        </div>
      </div>

      {/* SEÇÃO 4: FAQ / PERGUNTAS FREQUENTES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4E00] text-black font-black flex items-center justify-center font-mono">4</div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF4E00]" />
            Perguntas Frequentes (FAQ)
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden transition"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-[#FF4E00] transition cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-[#FF4E00] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
              </button>
              
              {openFaq === idx && (
                <div className="px-4 pb-5 md:px-5 text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-3 bg-white/[0.02]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
