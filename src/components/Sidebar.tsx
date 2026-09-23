import React from 'react';
import { 
  Activity, 
  Gauge, 
  Trophy, 
  CalendarCheck, 
  HeartHandshake, 
  Flame, 
  BookOpen, 
  Watch, 
  MapPin, 
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { RunnerState, AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  runnerState?: RunnerState;
  onOpenAthleteModal?: () => void;
  onOpenPaceModal?: () => void;
  onOpenMetronomeModal?: () => void;
  onOpenWristbandModal?: () => void;
  onOpenResetModal?: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const tabsConfig = [
    { 
      id: 'guide' as AppTab, 
      label: 'Guia & Tutorial', 
      icon: BookOpen,
      desc: 'Instruções e metodologias'
    },
    { 
      id: 'atividades' as AppTab, 
      label: 'Atividades & HUD', 
      icon: Activity,
      desc: 'Histórico e Stories 9:16'
    },
    { 
      id: 'importer' as AppTab, 
      label: 'Importar Relógio', 
      icon: Watch,
      desc: 'Arquivos GPX, TCX e FIT'
    },
    { 
      id: 'zonas' as AppTab, 
      label: 'Zonas & Testes', 
      icon: Gauge,
      desc: 'VDOT e Karvonen'
    },
    { 
      id: 'planilha' as AppTab, 
      label: 'Planilha 8 Semanas', 
      icon: CalendarCheck,
      desc: 'Prescrição personalizada'
    },
    { 
      id: 'previsoes' as AppTab, 
      label: 'Previsões de Prova', 
      icon: Trophy,
      desc: '5k a 42k com splits'
    },
    { 
      id: 'recuperacao' as AppTab, 
      label: 'Recuperação & Dores', 
      icon: HeartHandshake,
      desc: 'Prontidão e dores'
    },
    { 
      id: 'corridas' as AppTab, 
      label: 'Corridas no Brasil', 
      icon: MapPin,
      desc: 'Calendário de provas'
    },
  ];

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#08080A] border-r border-white/10 text-slate-200">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4E00] to-[#992E00] p-0.5 shadow-lg shadow-[#FF4E00]/25 flex-shrink-0">
            <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#FF4E00]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight font-heading text-white">
                PACELAB <span className="text-[#FF4E00]">VDOT</span>
              </h1>
              <span className="bg-[#FF4E00]/10 text-[#FF4E00] border border-[#FF4E00]/30 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono-data">
                v3.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Prescrição Científica de Corrida
            </p>
          </div>
        </div>

        {/* Close Button for Mobile Drawer */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
          Menu de Navegação
        </div>

        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`sidebar-tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group cursor-pointer text-left ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF4E00]/20 to-[#FF4E00]/5 text-white font-semibold border-l-2 border-[#FF4E00] shadow-sm shadow-[#FF4E00]/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#FF4E00]' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <div className="truncate">
                  <div className={`truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-normal">
                    {tab.desc}
                  </div>
                </div>
              </div>
              {isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#FF4E00] flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info in sidebar */}
      <div className="p-3 border-t border-white/5 bg-[#050507] text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono-data">
          <Sparkles className="w-3 h-3 text-[#FF4E00]" />
          <span>Jack Daniels VDOT</span>
        </span>
        <span className="text-[10px] font-mono-data text-slate-600">v3.5</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Left) */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Left) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
