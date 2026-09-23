import React, { useState } from 'react';
import { 
  BookOpen, 
  UserCheck, 
  Gauge, 
  Calendar, 
  ChevronDown, 
  HelpCircle, 
  Flame, 
  Watch, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuideTabProps {
  onOpenAthleteModal: () => void;
  onNavigateTab: (tab: 'guide' | 'importer' | 'zonas' | 'planilha' | 'previsoes' | 'recuperacao' | 'corridas') => void;
}

export const GuideTab: React.FC<GuideTabProps> = ({ onOpenAthleteModal, onNavigateTab }) => {
  const [selectedZone, setSelectedZone] = useState<'E' | 'M' | 'T' | 'I' | 'R'>('E');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const zonesGuide = {
    E: {
      name: 'Zona E — Easy / Rodagem & Regenerativo',
      pctVdot: '62% a 72% do VO2max / 65% a 79% FCmax',
      color: '#22C55E',
      objective: 'Construção da base aeróbica, proliferação mitocondrial, aumento da densidade capilar periférica e fortalecimento articular sem estresse mecânico severo.',
      whenToUse: 'Em dias de recuperação ativa, treinos longos de final de semana e aquecimentos/desaquecimentos.',
      tip: 'Mantenha um ritmo onde você consiga conversar confortavelmente em frases completas sem perder o fôlego.'
    },
    M: {
      name: 'Zona M — Ritmo de Maratona',
      pctVdot: '79% a 85% do VO2max / 80% a 87% FCmax',
      color: '#3B82F6',
      objective: 'Adaptação neuromuscular ao ritmo alvo de 42k, eficiência no consumo de glicogênio e calibração da percepção de esforço prolongado.',
      whenToUse: 'Em blocos específicos dentro do treino longo (ex: 20k com 8k em ritmo M) na fase específica.',
      tip: 'Excelente para testar sua estratégia de nutrição intra-treino (géis e hidratação) no ritmo exato do seu desafio.'
    },
    T: {
      name: 'Zona T — Threshold / Limiar de Lactato',
      pctVdot: '86% a 90% do VO2max / 88% a 92% FCmax',
      color: '#EAB308',
      objective: 'Elevação do limiar anaeróbio. Aumenta a velocidade em que seu organismo consegue depurar o lactato sem acidose muscular.',
      whenToUse: 'Treinos contínuos de 20 a 40 minutos (Tempo Run) ou Cruise Intervals (ex: 4x 1.500m com 1min de trote leve).',
      tip: 'A sensação é de esforço "confortavelmente duro". Se você começar a queimar precocemente, você está rápido demais.'
    },
    I: {
      name: 'Zona I — Interval / VO2 Máximo',
      pctVdot: '95% a 100% do VO2max / 93% a 98% FCmax',
      color: '#EF4444',
      objective: 'Desenvolvimento do teto de potência aeróbica máxima (VO2Max) e expansão do volume sistólico cardíaco.',
      whenToUse: 'Tiros de 3 a 5 minutos (ex: 800m a 1.200m) com intervalo ativo de trote leve igual ou levemente menor ao tempo de estímulo (1:1).',
      tip: 'Nunca ultrapasse o teto de 8% do volume semanal total do atleta em estímulos de ritmo I e R para evitar lesões!'
    },
    R: {
      name: 'Zona R — Repetition / Economia & Velocidade',
      pctVdot: '105% a 112% do VO2max / Supra-aeróbico',
      color: '#A855F7',
      objective: 'Aprimoramento da biomecânica, recrutamento de fibras de contração rápida, alta cadência e economia de corrida.',
      whenToUse: 'Tiros curtos de 200m a 400m ou acelerações em retas (strides) com recuperação completa (2x a 3x o tempo de tiro).',
      tip: 'O foco é fluidez, relaxamento dos ombros e mecânica impecável, não fadiga extrema ou acúmulo de ácido lático.'
    }
  };

  const faqs = [
    {
      q: 'Como funciona a fase de Adaptação Musculoesquelética (Caminha-Corre / Run-Walk)?',
      a: 'Para iniciantes, pessoas retornando de sedentarismo ou com sobrepeso, submeter o corpo diretamente a corridas contínuas gera um impacto repetitivo de até 3x o peso corporal nas articulações, causando canelite e tendinopatias. O método Caminha-Corre prescreve blocos curtos de trote leve (RPE 6/10) intercalados com caminhada rápida de recuperação. Isso fortalece tendões e ossos gradualmente até você atingir 3km contínuos e desbloquear o motor VDOT formal.'
    },
    {
      q: 'O que é VDOT e por que ele é mais preciso que apenas o VO2Max?',
      a: 'O VDOT é um índice patenteado pelo lendário fisiologista Dr. Jack Daniels que combina o consumo máximo de oxigênio (VO2Max) com a Economia de Corrida do atleta. Dois corredores com o mesmo VO2Max podem ter desempenhos muito diferentes se um deles gastar menos energia mecânica. O VDOT expressa a sua real velocidade competitiva.'
    },
    {
      q: 'Qual é a regra sagrada do teto de 8% para treinos de tiro (I e R)?',
      a: 'Na metodologia Jack Daniels, o volume total somado de tiros de alta intensidade (ritmos I e R) na semana NUNCA deve ultrapassar 8% da quilometragem total semanal. Por exemplo, para quem corre 40 km/semana, o teto é 3,2 km de tiro forte. Ultrapassar isso multiplica exponencialmente o risco de fraturas por estresse e fadiga crônica.'
    },
    {
      q: 'Como funciona a fórmula de frequência cardíaca de Karvonen?',
      a: 'A fórmula de Karvonen utiliza a Frequência Cardíaca de Reserva (FCR = FCmax - FCrepouso): FC Alvo = FCrepouso + (% Intensidade × FCR). Ela é muito superior à fórmula clássica percentual porque leva em conta o nível de condicionamento do atleta refletido no seu coração em repouso.'
    },
    {
      q: 'Com que frequência devo atualizar o meu VDOT no PaceLab?',
      a: 'Recomenda-se atualizar o VDOT a cada 4 a 6 semanas, após a realização de uma prova oficial, teste de 5k/10k ou Teste de Cooper de 12 minutos. Nunca treine com base no VDOT que você "deseja ter", sempre treine com base no seu VDOT real demonstrado hoje.'
    },
    {
      q: 'Como a aplicação ajusta meus treinos se eu registrar alguma dor?',
      a: 'Na aba "Recuperação Ativa / Proteção Articular", ao registrar uma dor moderada ou severa (canelite, joelho, tendão de aquiles), o PaceLab automaticamente rebaixa o Readiness Score, gera alertas de segurança, reduz o volume sugerido e desabilita prescrição de tiros até a regressão dos sintomas.'
    },
    {
      q: 'Posso exportar minha planilha de 8 semanas para imprimir ou para o relógio?',
      a: 'Sim! Na aba "Planilha 8 Semanas", você pode clicar no botão "Exportar Planilha (CSV / Impressão)" para ter uma visão tabular completa de todos os 56 dias de treinamento com todas as descrições, paces e zonas.'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner Hero */}
      <div 
        id="guide-hero-banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D0907] via-[#0A0A0A] to-[#120E0B] border border-[#FF4E00]/25 p-6 sm:p-8 shadow-2xl shadow-black"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4E00]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4E00]/10 border border-[#FF4E00]/30 text-[#FF4E00] text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            Metodologia Científica Jack Daniels & Karvonen
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Como dominar seus treinos com o <span className="text-[#FF4E00]">PaceLab VDOT v3.5</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Elimine as adivinhações do seu treinamento de corrida. Nossa plataforma calcula com precisão matemática suas zonas de ritmo (Paces E, M, T, I, R), periodização de 8 semanas, análise de dores e prevenção de lesões.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id="btn-guide-open-athlete-modal"
              onClick={onOpenAthleteModal}
              className="px-5 py-2.5 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#FF4E00]/25 transition-all transform hover:-translate-y-0.5"
            >
              <UserCheck className="w-4 h-4" />
              Preencher Minha Ficha do Atleta
            </button>
            <button
              id="btn-guide-goto-zones"
              onClick={() => onNavigateTab('zonas')}
              className="px-5 py-2.5 rounded-xl bg-[#121214] hover:bg-[#1A1A1D] border border-white/10 hover:border-[#FF4E00]/40 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Gauge className="w-4 h-4 text-[#FF4E00]" />
              Ver Zonas de Pace
            </button>
          </div>
        </div>
      </div>

      {/* Checklist em 3 Passos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#FF4E00]" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider font-heading">
            Guia Rápido de Configuração em 3 Passos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            id="step-card-1"
            className="telemetry-card p-5 space-y-3 relative group border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer"
            onClick={onOpenAthleteModal}
          >
            <div className="w-9 h-9 rounded-lg bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] font-bold text-base font-mono-data">
              01
            </div>
            <h4 className="text-white font-bold text-base group-hover:text-[#FF4E00] transition-colors">
              Configure seu Perfil Fisiológico
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Abra a <strong>Ficha do Atleta</strong> para definir sua FC Máxima, FC de Repouso (para o cálculo preciso de Karvonen) e seu nível de treino.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-[#FF4E00] font-semibold">
              <span>Abrir Ficha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            id="step-card-2"
            className="telemetry-card p-5 space-y-3 relative group border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer"
            onClick={() => onNavigateTab('zonas')}
          >
            <div className="w-9 h-9 rounded-lg bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] font-bold text-base font-mono-data">
              02
            </div>
            <h4 className="text-white font-bold text-base group-hover:text-[#FF4E00] transition-colors">
              Descubra seu VDOT Atual
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Insira um tempo recente de prova (5k, 10k, 21k) ou execute o <strong>Teste de Cooper (12 min)</strong> ou <strong>2.400m</strong> para fixar seus ritmos reais.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-[#FF4E00] font-semibold">
              <span>Calcular VDOT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            id="step-card-3"
            className="telemetry-card p-5 space-y-3 relative group border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer"
            onClick={() => onNavigateTab('planilha')}
          >
            <div className="w-9 h-9 rounded-lg bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] font-bold text-base font-mono-data">
              03
            </div>
            <h4 className="text-white font-bold text-base group-hover:text-[#FF4E00] transition-colors">
              Siga a Planilha de 8 Semanas
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Acesse sua periodização de 8 semanas com validação do teto de tiros (≤ 8%), manuais de pliometria progressiva e check-in diário de treinos.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-[#FF4E00] font-semibold">
              <span>Acessar Planilha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Interpretador Interativo de Zonas Jack Daniels */}
      <div className="telemetry-card p-6 space-y-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Fisiologia Aplicada
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Interpretador Interativo das Zonas Jack Daniels
            </h3>
            <p className="text-slate-400 text-xs">
              Clique em cada zona para entender seu propósito fisiológico, intensidade e como executar.
            </p>
          </div>

          {/* Buttons E, M, T, I, R */}
          <div className="flex items-center gap-1.5 bg-[#121214] p-1.5 rounded-xl border border-white/10">
            {(['E', 'M', 'T', 'I', 'R'] as const).map((zoneKey) => (
              <button
                key={zoneKey}
                id={`btn-zone-selector-${zoneKey}`}
                onClick={() => setSelectedZone(zoneKey)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono-data transition-all ${
                  selectedZone === zoneKey
                    ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Pace {zoneKey}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Zone Card */}
        <div 
          id="zone-detail-panel"
          className="bg-[#121214] rounded-xl p-5 border border-white/10 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: zonesGuide[selectedZone].color }}
              />
              <h4 className="text-base sm:text-lg font-bold text-white">
                {zonesGuide[selectedZone].name}
              </h4>
            </div>
            <span className="text-xs font-mono-data px-2.5 py-1 rounded bg-white/5 text-[#FF4E00] border border-white/10 font-bold">
              {zonesGuide[selectedZone].pctVdot}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                🎯 Objetivo Fisiológico
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {zonesGuide[selectedZone].objective}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ⏱️ Quando Utilizar
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {zonesGuide[selectedZone].whenToUse}
              </p>
            </div>

            <div className="space-y-1.5 bg-[#0A0A0A] p-3 rounded-lg border border-[#FF4E00]/20">
              <div className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Dica de Ouro do Treinador
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{zonesGuide[selectedZone].tip}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guia de Funcionalidades Rápidas */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
          <Award className="w-5 h-5 text-[#FF4E00]" />
          Módulos Integrados do PaceLab v3.5
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            id="feature-card-watch"
            onClick={() => onNavigateTab('importer')}
            className="telemetry-card p-4 space-y-2.5 border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00]">
              <Watch className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#FF4E00] transition-colors">
              Importador GPX / TCX
            </h4>
            <p className="text-slate-400 text-xs">
              Suba arquivos do seu Garmin, Strava ou Amazfit (Zepp) e extraia o VDOT da atividade automaticamente.
            </p>
          </div>

          <div 
            id="feature-card-predictions"
            onClick={() => onNavigateTab('previsoes')}
            className="telemetry-card p-4 space-y-2.5 border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00]">
              <Gauge className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#FF4E00] transition-colors">
              Previsões de Prova & Pacing
            </h4>
            <p className="text-slate-400 text-xs">
              Simulador com slider dinâmico de VDOT, parciais km a km, estratégia de Negative Split e Pace Band.
            </p>
          </div>

          <div 
            id="feature-card-recovery"
            onClick={() => onNavigateTab('recuperacao')}
            className="telemetry-card p-4 space-y-2.5 border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00]">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#FF4E00] transition-colors">
              Recuperação & Pain Tracker
            </h4>
            <p className="text-slate-400 text-xs">
              Mapeamento de dores anatômicas, score de prontidão, triagem de overtraining e calculadora de suor.
            </p>
          </div>

          <div 
            id="feature-card-races"
            onClick={() => onNavigateTab('corridas')}
            className="telemetry-card p-4 space-y-2.5 border border-white/10 hover:border-[#FF4E00]/40 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00]">
              <MapPin className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#FF4E00] transition-colors">
              Corridas no Brasil
            </h4>
            <p className="text-slate-400 text-xs">
              Banco com todas as 27 capitais, altimetria, compensação de VDOT e hub inteligente de scraping.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="telemetry-card p-6 space-y-4 border border-white/10">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#FF4E00]" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider font-heading">
            Perguntas Frequentes & Fundamentos Fisiológicos
          </h3>
        </div>

        <div className="divide-y divide-white/10">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-3.5">
                <button
                  id={`btn-faq-toggle-${idx}`}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-3 focus:outline-none"
                >
                  <span className="text-sm font-semibold text-slate-200 hover:text-[#FF4E00] transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#FF4E00]' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
