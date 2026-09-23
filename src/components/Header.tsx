import React from 'react';
import { 
  Activity, 
  Gauge, 
  Trophy, 
  CalendarCheck, 
  HeartHandshake, 
  Timer, 
  Volume2, 
  Award,
  Zap,
  Flame,
  BookOpen,
  Watch,
  MapPin,
  UserCheck,
  RotateCcw,
  Menu
} from 'lucide-react';
import { RunnerState, AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab?: (tab: AppTab) => void;
  runnerState: RunnerState;
  onOpenAthleteModal: () => void;
  onOpenPaceModal: () => void;
  onOpenMetronomeModal: () => void;
  onOpenWristbandModal: () => void;
  onOpenResetModal: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  runnerState,
  onOpenAthleteModal,
  onOpenPaceModal,
  onOpenMetronomeModal,
  onOpenWristbandModal,
  onOpenResetModal,
  onToggleMobileMenu,
}) => {
  const isUncalibrated = runnerState.isCalibrated === false || (runnerState.currentVdot || 0) <= 0;

  const tabTitles: Record<AppTab, { label: string; desc: string; icon: React.ElementType }> = {
    guide: { label: 'Guia & Tutorial', desc: 'Instruções completas e base científica', icon: BookOpen },
    atividades: { label: 'Atividades & HUD', desc: 'Histórico de corridas e gerador de Stories 9:16 para Instagram', icon: Activity },
    importer: { label: 'Importar Relógio', desc: 'Upload e calibração de arquivos GPX, TCX e FIT', icon: Watch },
    zonas: { label: 'Zonas & Testes', desc: 'Tabela de Paces VDOT de Jack Daniels e Zonas Cardíacas Karvonen', icon: Gauge },
    planilha: { label: 'Planilha 8 Semanas', desc: 'Periodização científica baseada no seu VDOT calibrado', icon: CalendarCheck },
    previsoes: { label: 'Previsões de Prova', desc: 'Estimativas de tempo e splits de 5km à Maratona', icon: Trophy },
    recuperacao: { label: 'Recuperação & Dores', desc: 'Monitoramento de carga aguda:crônica (ACWR) e mapa de dores', icon: HeartHandshake },
    corridas: { label: 'Corridas no Brasil', desc: 'Calendário de maratonas e meias no país', icon: MapPin },
  };

  const currentTabInfo = tabTitles[activeTab] || tabTitles.atividades;
  const TabIcon = currentTabInfo.icon;

  return (
    <header className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40">
      {/* Top Telemetry Strip with Runner Name, VDOT and Status */}
      <div className="border-b border-white/5 bg-[#080808] px-3 sm:px-6 py-1.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 font-mono-data text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[#FF4E00] font-semibold text-[11px] sm:text-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUncalibrated ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isUncalibrated ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              </span>
              PACELAB VDOT v3.5
            </span>
            <span className="text-slate-700 hidden sm:inline-block">|</span>
            <span className="flex items-center gap-1.5 text-xs">
              {isUncalibrated ? (
                <span className="text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <Activity className="w-3.5 h-3.5" />
                  Aguardando telemetria
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Fisiologia calibrada
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Athlete Name */}
            <button
              id="btn-header-athlete-badge"
              onClick={onOpenAthleteModal}
              title="Abrir Ficha do Atleta"
              className="flex items-center gap-1.5 bg-[#121214] hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-xs transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span className="text-slate-400 text-[11px] hidden xs:inline">ATLETA:</span>
              <span className="text-white font-semibold truncate max-w-[130px] sm:max-w-none">
                {runnerState.name || 'Novo Corredor'}
              </span>
            </button>

            {/* VDOT Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs ${
              isUncalibrated 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
                : 'bg-[#18110D] border-[#FF4E00]/40 text-[#FF4E00]'
            }`}>
              <span className="text-[11px] text-slate-400">VDOT:</span>
              <span className="text-white text-xs sm:text-sm font-heading font-mono-data">
                {isUncalibrated ? '0.0 (Zerado)' : runnerState.currentVdot.toFixed(1)}
              </span>
            </div>

            {/* Zerar Dados Button */}
            <button
              id="btn-header-reset-all"
              onClick={onOpenResetModal}
              title="Zerar todos os dados e estatísticas para nova calibração"
              className="flex items-center gap-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-red-100 px-2.5 py-1 rounded-lg border border-red-500/30 text-[11px] font-medium transition-all cursor-pointer font-sans"
            >
              <RotateCcw className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">Zerar Dados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <button
            id="btn-mobile-menu-toggle"
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl bg-[#121214] border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Abrir menu lateral de abas"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF4E00] to-[#992E00] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#050505] rounded-[6px] flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-[#FF4E00]" />
              </div>
            </div>
            <div>
              <span className="font-heading font-black text-sm text-white">
                PACELAB <span className="text-[#FF4E00]">VDOT</span>
              </span>
              <div className="text-[10px] text-slate-400 font-mono-data truncate max-w-[130px]">
                {currentTabInfo.label}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-quick-pace-mobile"
            onClick={onOpenPaceModal}
            title="Calculadora Rápida de Pace"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#121214] border border-white/10 text-[#FF4E00] text-xs font-medium cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] text-slate-200">Calc. Pace</span>
          </button>

          <button
            id="btn-metronome-mobile"
            onClick={onOpenMetronomeModal}
            title="Metrônomo de Cadência"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#121214] border border-white/10 text-emerald-400 text-xs font-medium cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] text-slate-200">Metrônomo</span>
          </button>

          <button
            id="btn-wristband-mobile"
            onClick={onOpenWristbandModal}
            title="Pulseira de Prova"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#121214] border border-white/10 text-amber-400 text-xs font-medium cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] text-slate-200">Pulseira</span>
          </button>
        </div>
      </div>

      {/* Desktop Main Header Bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2.5">
        {/* Left: Active Section Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#141417] border border-white/10 text-[#FF4E00]">
            <TabIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{currentTabInfo.label}</span>
              <span className="text-xs font-normal text-slate-500 font-mono-data">/ pacelab</span>
            </h2>
            <p className="text-xs text-slate-400">
              {currentTabInfo.desc}
            </p>
          </div>
        </div>

        {/* Right: Ferramentas Rápidas (Quick Tools) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono-data text-slate-400 bg-[#0E0E11] px-2.5 py-1 rounded-lg border border-white/5">
            <Zap className="w-3.5 h-3.5 text-[#FF4E00]" />
            <span className="font-bold text-slate-300">Ferramentas Rápidas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-quick-pace"
              onClick={onOpenPaceModal}
              title="Calculadora Rápida de Pace"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1E1E24] border border-white/10 hover:border-[#FF4E00]/50 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Timer className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span>Calc. Rápida Pace</span>
            </button>
            <button
              id="btn-metronome"
              onClick={onOpenMetronomeModal}
              title="Metrônomo de Cadência"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1E1E24] border border-white/10 hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Metrônomo (SPM)</span>
            </button>
            <button
              id="btn-wristband"
              onClick={onOpenWristbandModal}
              title="Pulseira de Prova"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1E1E24] border border-white/10 hover:border-amber-500/50 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Pulseira de Prova</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

