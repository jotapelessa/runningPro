import React, { useState } from 'react';
import { 
  Sliders, 
  Map as MapIcon, 
  Palette, 
  Type, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Image as ImageIcon,
  Clock,
  Navigation,
  Mountain,
  Zap,
  Check,
  Bookmark,
  Layers,
  MapPin,
  Flag,
  MessageSquare,
  Compass,
  AlertCircle
} from 'lucide-react';
import { 
  UserActivity, 
  StoryConfig, 
  EnRouteConfig, 
  EnRouteWaypointMarker, 
  EnRouteFloatingBadge, 
  TypographyConfig 
} from '../types';
import { getDefaultEnRouteConfig } from '../lib/enRouteTemplate';
import { createDefaultTypography } from '../lib/stravaAppTemplate';
import { TypographyControls } from './TypographyControls';

interface EnRouteAdjustPanelProps {
  config: StoryConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoryConfig>>;
  activity: UserActivity;
  athleteName: string;
}

export const EnRouteAdjustPanel: React.FC<EnRouteAdjustPanelProps> = ({
  config,
  setConfig,
  activity,
  athleteName
}) => {
  const editorial = config.enRoute || getDefaultEnRouteConfig(activity, athleteName);
  const [openSection, setOpenSection] = useState<string>('global');
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);
  const [selectedGlobalFont, setSelectedGlobalFont] = useState<string>('Montserrat');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Helper to update EnRouteConfig immutably
  const updateEnRoute = (patch: Partial<EnRouteConfig>) => {
    setConfig(prev => ({
      ...prev,
      enRoute: {
        ...(prev.enRoute || getDefaultEnRouteConfig(activity, athleteName)),
        ...patch
      }
    }));
  };

  // Toggle accordion sections
  const toggleSection = (id: string) => {
    setOpenSection(curr => curr === id ? '' : id);
  };

  // Reset to initial defaults
  const handleResetToDefaults = () => {
    const defaults = getDefaultEnRouteConfig(activity, athleteName);
    updateEnRoute(defaults);
  };

  // Save preset to localStorage
  const handleSavePreset = () => {
    try {
      localStorage.setItem('en_route_preset_v1', JSON.stringify(editorial));
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (e) {
      console.error('Failed to save preset', e);
    }
  };

  // Load preset from localStorage
  const handleLoadPreset = () => {
    try {
      const saved = localStorage.getItem('en_route_preset_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        updateEnRoute(parsed);
      }
    } catch (e) {
      console.error('Failed to load preset', e);
    }
  };

  // Apply global font to all or unmodified elements
  const handleApplyGlobalFont = (onlyUnmodified: boolean) => {
    const updateTypo = (current?: TypographyConfig): TypographyConfig => {
      const base = current || createDefaultTypography();
      if (onlyUnmodified && base.fontFamily && base.fontFamily !== 'inherit' && base.fontFamily !== 'Montserrat') {
        return base;
      }
      return {
        ...base,
        fontFamily: selectedGlobalFont
      };
    };

    updateEnRoute({
      mainTitle: {
        ...editorial.mainTitle,
        typography: updateTypo(editorial.mainTitle.typography)
      },
      subtitle: {
        ...editorial.subtitle,
        typography: updateTypo(editorial.subtitle.typography)
      },
      waypoints: editorial.waypoints.map(wp => ({
        ...wp,
        labelTypography: updateTypo(wp.labelTypography),
        sublabelTypography: updateTypo(wp.sublabelTypography)
      })),
      badges: editorial.badges.map(b => ({
        ...b,
        typography: updateTypo(b.typography)
      })),
      credits: {
        ...editorial.credits,
        creditsTypography: updateTypo(editorial.credits.creditsTypography),
        athleteTypography: updateTypo(editorial.credits.athleteTypography)
      }
    });

    setShowGlobalConfirm(false);
  };

  // Waypoints management
  const handleAddWaypoint = () => {
    const newWp: EnRouteWaypointMarker = {
      id: `wp-${Date.now()}`,
      enabled: true,
      label: 'NOVO PONTO',
      sublabel: 'KM 0.0',
      locationRatio: 0.5,
      iconType: 'pin',
      iconColor: editorial.accentColor || '#1565C0',
      iconSize: 14,
      badgeBgColor: '#FFFFFF',
      badgeBgOpacity: 95,
      badgeBorderRadius: 8,
      badgePaddingX: 10,
      badgePaddingY: 5,
      connectorLine: true,
      connectorColor: 'rgba(15, 23, 42, 0.4)',
      connectorWidth: 1.5,
      labelTypography: createDefaultTypography({
        fontFamily: selectedGlobalFont,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: '#0F172A',
        textAlign: 'center'
      }),
      sublabelTypography: createDefaultTypography({
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 9,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center'
      })
    };

    updateEnRoute({
      waypoints: [...editorial.waypoints, newWp]
    });
  };

  const handleUpdateWaypoint = (id: string, patch: Partial<EnRouteWaypointMarker>) => {
    updateEnRoute({
      waypoints: editorial.waypoints.map(wp => wp.id === id ? { ...wp, ...patch } : wp)
    });
  };

  const handleRemoveWaypoint = (id: string) => {
    updateEnRoute({
      waypoints: editorial.waypoints.filter(wp => wp.id !== id)
    });
  };

  // Badges management
  const handleAddBadge = () => {
    const newBadge: EnRouteFloatingBadge = {
      id: `badge-${Date.now()}`,
      enabled: true,
      text: 'Novo Destaque',
      icon: 'star',
      iconColor: editorial.accentColor || '#1565C0',
      iconSize: 14,
      xPct: 50,
      yPct: 50,
      autoWidth: true,
      widthPx: 140,
      heightPx: 36,
      paddingX: 14,
      paddingY: 7,
      bgColor: '#FFFFFF',
      bgOpacity: 95,
      borderRadius: 12,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.22)',
      shadowBlur: 10,
      shadowOffsetY: 3,
      borderEnabled: false,
      borderColor: '#E2E8F0',
      borderWidth: 1,
      rotation: 0,
      locked: false,
      typography: createDefaultTypography({
        fontFamily: selectedGlobalFont,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: '#0F172A',
        textAlign: 'left'
      })
    };

    updateEnRoute({
      badges: [...editorial.badges, newBadge]
    });
  };

  const handleUpdateBadge = (id: string, patch: Partial<EnRouteFloatingBadge>) => {
    updateEnRoute({
      badges: editorial.badges.map(b => b.id === id ? { ...b, ...patch } : b)
    });
  };

  const handleRemoveBadge = (id: string) => {
    updateEnRoute({
      badges: editorial.badges.filter(b => b.id !== id)
    });
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Header Info & Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-sm border border-blue-500/30">
            T4
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              En Route • Controles Granulares
            </h3>
            <p className="text-[10px] text-slate-400">
              Personalização completa de todas as fontes, mapa, rota e badges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSavePreset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
            title="Salva layout e tipografia no armazenamento local"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvar Preset</span>
          </button>
          <button
            onClick={handleLoadPreset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            title="Carregar último preset salvo"
          >
            <span>Carregar</span>
          </button>
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            title="Restaurar valores de fábrica do Template 4"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Restaurar</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>Preset do Template 4 salvo com sucesso!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: GLOBAL TYPOGRAPHY & THEME PALETTE */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('global')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                1. Tipografia Global & Cores do Tema
              </div>
              <div className="text-[10px] text-slate-400">
                Fonte mestre, aplicação em lote e paleta do En Route
              </div>
            </div>
          </div>
          {openSection === 'global' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'global' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            {/* Global Master Font */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Fonte Mestre do Template
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedGlobalFont}
                  onChange={(e) => setSelectedGlobalFont(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Montserrat">Montserrat (Geométrico / Padrão)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderno)</option>
                  <option value="Inter">Inter (Clean / Neutro)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech Moderno)</option>
                  <option value="Oswald">Oswald (Condensado / Caixa Alta)</option>
                  <option value="Bebas Neue">Bebas Neue (Display Impacto)</option>
                  <option value="Playfair Display">Playfair Display (Serifado Editorial)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Mono Tech)</option>
                </select>

                <button
                  onClick={() => setShowGlobalConfirm(true)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                >
                  Aplicar Fonte
                </button>
              </div>
            </div>

            {/* Global Font Modal Confirmation */}
            {showGlobalConfirm && (
              <div className="p-3 rounded-xl bg-slate-800 border border-blue-500/40 space-y-2.5 animate-fade-in">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span>Como deseja aplicar a fonte &quot;{selectedGlobalFont}&quot;?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyGlobalFont(false)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Em TODOS os textos
                  </button>
                  <button
                    onClick={() => handleApplyGlobalFont(true)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold"
                  >
                    Apenas não-customizados
                  </button>
                  <button
                    onClick={() => setShowGlobalConfirm(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Theme Colors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cor da Rota (Destaque)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editorial.accentColor || '#1565C0'}
                    onChange={(e) => {
                      updateEnRoute({
                        accentColor: e.target.value,
                        map: { ...editorial.map, routeColor: e.target.value }
                      });
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono">{editorial.accentColor || '#1565C0'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Fundo dos Badges
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editorial.badgeBgColor || '#FFFFFF'}
                    onChange={(e) => updateEnRoute({ badgeBgColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono">{editorial.badgeBgColor || '#FFFFFF'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Texto Principal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editorial.textPrimaryColor || '#FFFFFF'}
                    onChange={(e) => updateEnRoute({ textPrimaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono">{editorial.textPrimaryColor || '#FFFFFF'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Texto Secundário
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editorial.textSecondaryColor || '#E2E8F0'}
                    onChange={(e) => updateEnRoute({ textSecondaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono">{editorial.textSecondaryColor || '#E2E8F0'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: BACKGROUND 100% (PHOTO, SOLID, FILTERS & VIGNETTES) */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('background')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                2. Fundo 100% & Filtros Fotográficos
              </div>
              <div className="text-[10px] text-slate-400">
                Foto, saturação, brilho, vinhetas superior e inferior
              </div>
            </div>
          </div>
          {openSection === 'background' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'background' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            {/* Filter Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Filtro Fotográfico
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'grayscale', 'sepia'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateEnRoute({
                      background: { ...editorial.background, filterMode: mode }
                    })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                      editorial.background.filterMode === mode
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'normal' ? 'Normal' : mode === 'grayscale' ? 'Preto e Branco' : 'Sépia'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Brightness, Contrast, Saturation, Blur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Brilho</span>
                  <span className="font-mono text-white">{editorial.background.brightness || 0}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={editorial.background.brightness || 0}
                  onChange={(e) => updateEnRoute({
                    background: { ...editorial.background, brightness: Number(e.target.value) }
                  })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Contraste</span>
                  <span className="font-mono text-white">{editorial.background.contrast || 0}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={editorial.background.contrast || 0}
                  onChange={(e) => updateEnRoute({
                    background: { ...editorial.background, contrast: Number(e.target.value) }
                  })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Saturação</span>
                  <span className="font-mono text-white">{editorial.background.saturation || 0}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={editorial.background.saturation || 0}
                  onChange={(e) => updateEnRoute({
                    background: { ...editorial.background, saturation: Number(e.target.value) }
                  })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Desfoque (Blur)</span>
                  <span className="font-mono text-white">{editorial.background.blur || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={editorial.background.blur || 0}
                  onChange={(e) => updateEnRoute({
                    background: { ...editorial.background, blur: Number(e.target.value) }
                  })}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Vignettes (Top & Bottom Gradients for Text Legibility) */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Gradiente Superior (Destacar Título)</span>
                <input
                  type="checkbox"
                  checked={editorial.background.gradientTop}
                  onChange={(e) => updateEnRoute({
                    background: { ...editorial.background, gradientTop: e.target.checked }
                  })}
                  className="rounded accent-blue-500"
                />
              </div>
              {editorial.background.gradientTop && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                      <span>Altura</span>
                      <span className="font-mono">{editorial.background.gradientTopHeightPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={editorial.background.gradientTopHeightPct}
                      onChange={(e) => updateEnRoute({
                        background: { ...editorial.background, gradientTopHeightPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                      <span>Opacidade</span>
                      <span className="font-mono">{editorial.background.gradientTopOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editorial.background.gradientTopOpacity}
                      onChange={(e) => updateEnRoute({
                        background: { ...editorial.background, gradientTopOpacity: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Gradiente Inferior (Destacar Rodapé)</span>
                <input
                  type="checkbox"
                  checked={editorial.background.gradientBottom}
                  onChange={(e) => updateEnRoute({
                    background: { ...editorial.background, gradientBottom: e.target.checked }
                  })}
                  className="rounded accent-blue-500"
                />
              </div>
              {editorial.background.gradientBottom && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                      <span>Altura</span>
                      <span className="font-mono">{editorial.background.gradientBottomHeightPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={editorial.background.gradientBottomHeightPct}
                      onChange={(e) => updateEnRoute({
                        background: { ...editorial.background, gradientBottomHeightPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                      <span>Opacidade</span>
                      <span className="font-mono">{editorial.background.gradientBottomOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editorial.background.gradientBottomOpacity}
                      onChange={(e) => updateEnRoute({
                        background: { ...editorial.background, gradientBottomOpacity: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: MAIN TITLE ("EN ROUTE") */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('mainTitle')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                3. Título Principal &quot;EN ROUTE&quot;
              </div>
              <div className="text-[10px] text-slate-400">
                Texto livre, posição X/Y e controle tipográfico completo
              </div>
            </div>
          </div>
          {openSection === 'mainTitle' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'mainTitle' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Exibir Título Principal</span>
              <input
                type="checkbox"
                checked={editorial.mainTitle.enabled}
                onChange={(e) => updateEnRoute({
                  mainTitle: { ...editorial.mainTitle, enabled: e.target.checked }
                })}
                className="rounded accent-blue-500"
              />
            </div>

            {editorial.mainTitle.enabled && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Texto do Título
                  </label>
                  <input
                    type="text"
                    value={editorial.mainTitle.text}
                    onChange={(e) => updateEnRoute({
                      mainTitle: { ...editorial.mainTitle, text: e.target.value }
                    })}
                    placeholder="EN ROUTE"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posição Horizontal (X)</span>
                      <span className="font-mono text-white">{editorial.mainTitle.xPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={editorial.mainTitle.xPct}
                      onChange={(e) => updateEnRoute({
                        mainTitle: { ...editorial.mainTitle, xPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posição Vertical (Y)</span>
                      <span className="font-mono text-white">{editorial.mainTitle.yPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="40"
                      step="0.5"
                      value={editorial.mainTitle.yPct}
                      onChange={(e) => updateEnRoute({
                        mainTitle: { ...editorial.mainTitle, yPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Typography Controls for Main Title */}
                <TypographyControls
                  label="Tipografia do Título Principal"
                  value={editorial.mainTitle.typography}
                  onChange={(typo) => updateEnRoute({
                    mainTitle: { ...editorial.mainTitle, typography: typo }
                  })}
                  previewSample={editorial.mainTitle.text || 'EN ROUTE'}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: SUBTITLE (ROUTE NAME & SEPARATOR) */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('subtitle')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                4. Subtítulo com Percurso
              </div>
              <div className="text-[10px] text-slate-400">
                Payakumbuh - Batusangkar, separador configurável e tipografia
              </div>
            </div>
          </div>
          {openSection === 'subtitle' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'subtitle' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Exibir Subtítulo</span>
              <input
                type="checkbox"
                checked={editorial.subtitle.enabled}
                onChange={(e) => updateEnRoute({
                  subtitle: { ...editorial.subtitle, enabled: e.target.checked }
                })}
                className="rounded accent-blue-500"
              />
            </div>

            {editorial.subtitle.enabled && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Texto do Percurso
                    </label>
                    <input
                      type="text"
                      value={editorial.subtitle.text}
                      onChange={(e) => updateEnRoute({
                        subtitle: { ...editorial.subtitle, text: e.target.value }
                      })}
                      placeholder="Payakumbuh - Batusangkar - Solok"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Separador
                    </label>
                    <input
                      type="text"
                      value={editorial.subtitle.separator}
                      onChange={(e) => updateEnRoute({
                        subtitle: { ...editorial.subtitle, separator: e.target.value }
                      })}
                      placeholder=" - "
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posição Horizontal (X)</span>
                      <span className="font-mono text-white">{editorial.subtitle.xPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={editorial.subtitle.xPct}
                      onChange={(e) => updateEnRoute({
                        subtitle: { ...editorial.subtitle, xPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posição Vertical (Y)</span>
                      <span className="font-mono text-white">{editorial.subtitle.yPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="0.5"
                      value={editorial.subtitle.yPct}
                      onChange={(e) => updateEnRoute({
                        subtitle: { ...editorial.subtitle, yPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Typography Controls for Subtitle */}
                <TypographyControls
                  label="Tipografia do Subtítulo"
                  value={editorial.subtitle.typography}
                  onChange={(typo) => updateEnRoute({
                    subtitle: { ...editorial.subtitle, typography: typo }
                  })}
                  previewSample={editorial.subtitle.text || 'Payakumbuh - Solok'}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: CENTRAL MINIMALIST MAP PANEL */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('map')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <MapIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                5. Painel Central do Mapa & Rota
              </div>
              <div className="text-[10px] text-slate-400">
                Dimensões, bordas arredondadas, cor da rota e marcadores
              </div>
            </div>
          </div>
          {openSection === 'map' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'map' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Exibir Painel do Mapa</span>
              <input
                type="checkbox"
                checked={editorial.map.enabled}
                onChange={(e) => updateEnRoute({
                  map: { ...editorial.map, enabled: e.target.checked }
                })}
                className="rounded accent-blue-500"
              />
            </div>

            {editorial.map.enabled && (
              <>
                {/* Size & Position */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Largura (%)</span>
                      <span className="font-mono text-white">{editorial.map.widthPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="96"
                      value={editorial.map.widthPct}
                      onChange={(e) => updateEnRoute({
                        map: { ...editorial.map, widthPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Altura (%)</span>
                      <span className="font-mono text-white">{editorial.map.heightPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="75"
                      value={editorial.map.heightPct}
                      onChange={(e) => updateEnRoute({
                        map: { ...editorial.map, heightPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Centro Vertical (Y)</span>
                      <span className="font-mono text-white">{editorial.map.yPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="75"
                      step="0.5"
                      value={editorial.map.yPct}
                      onChange={(e) => updateEnRoute({
                        map: { ...editorial.map, yPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Cantos Arredondados</span>
                      <span className="font-mono text-white">{editorial.map.borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={editorial.map.borderRadius}
                      onChange={(e) => updateEnRoute({
                        map: { ...editorial.map, borderRadius: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Route Line Styling */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <div className="text-xs font-bold text-white">Traçado da Rota GPS</div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Cor da Rota</label>
                      <input
                        type="color"
                        value={editorial.map.routeColor || '#1565C0'}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, routeColor: e.target.value }
                        })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                        <span>Espessura</span>
                        <span className="font-mono">{editorial.map.routeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="16"
                        value={editorial.map.routeWidth}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, routeWidth: Number(e.target.value) }
                        })}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                        <span>Contorno Branco</span>
                        <span className="font-mono">{editorial.map.routeOutlineWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.5"
                        value={editorial.map.routeOutlineWidth}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, routeOutlineWidth: Number(e.target.value) }
                        })}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={editorial.map.routeGlow}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, routeGlow: e.target.checked }
                        })}
                        className="rounded accent-blue-500"
                      />
                      <span>Brilho / Glow suave sob a rota</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={editorial.map.routeFillUnder}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, routeFillUnder: e.target.checked }
                        })}
                        className="rounded accent-blue-500"
                      />
                      <span>Preenchimento suave sob rota</span>
                    </label>
                  </div>
                </div>

                {/* Start & Finish Markers */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                      <input
                        type="checkbox"
                        checked={editorial.map.showStartMarker}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, showStartMarker: e.target.checked }
                        })}
                        className="rounded accent-blue-500"
                      />
                      <span>Marcador de Largada</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editorial.map.startMarkerColor || '#10B981'}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, startMarkerColor: e.target.value }
                        })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[11px] text-slate-400">Cor de Início</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                      <input
                        type="checkbox"
                        checked={editorial.map.showFinishMarker}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, showFinishMarker: e.target.checked }
                        })}
                        className="rounded accent-blue-500"
                      />
                      <span>Marcador de Chegada</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editorial.map.finishMarkerColor || '#EF4444'}
                        onChange={(e) => updateEnRoute({
                          map: { ...editorial.map, finishMarkerColor: e.target.value }
                        })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[11px] text-slate-400">Cor de Chegada</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: WAYPOINTS (POI) ON MAP */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('waypoints')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                6. Pontos de Interesse (Waypoints)
              </div>
              <div className="text-[10px] text-slate-400">
                {editorial.waypoints.length} pontos ao longo da rota com tipografia individual
              </div>
            </div>
          </div>
          {openSection === 'waypoints' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'waypoints' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Lista de Marcadores</span>
              <button
                onClick={handleAddWaypoint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Ponto</span>
              </button>
            </div>

            <div className="space-y-3">
              {editorial.waypoints.map((wp, idx) => (
                <div key={wp.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={wp.enabled}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { enabled: e.target.checked })}
                        className="rounded accent-blue-500"
                      />
                      <span className="text-xs font-bold text-white">
                        Ponto {idx + 1}: {wp.label}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveWaypoint(wp.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Excluir este ponto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Rótulo Principal</label>
                      <input
                        type="text"
                        value={wp.label}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { label: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Sub-rótulo / Alt / KM</label>
                      <input
                        type="text"
                        value={wp.sublabel || ''}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { sublabel: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Position along route slider */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                      <span>Posição na Rota ({Math.round(wp.locationRatio * 100)}%)</span>
                      <span className="font-mono">
                        {wp.locationRatio === 0 ? 'Início' : wp.locationRatio === 1 ? 'Final' : `${Math.round(wp.locationRatio * 100)}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={wp.locationRatio}
                      onChange={(e) => handleUpdateWaypoint(wp.id, { locationRatio: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* Icon & Connector */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Ícone</label>
                      <select
                        value={wp.iconType}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { iconType: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="pin">Pino (Pin)</option>
                        <option value="flag">Bandeira</option>
                        <option value="mountain">Montanha</option>
                        <option value="circle">Círculo</option>
                        <option value="star">Estrela</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Cor do Ícone</label>
                      <input
                        type="color"
                        value={wp.iconColor || '#1565C0'}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { iconColor: e.target.value })}
                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>

                    <div className="flex items-center pt-3">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={wp.connectorLine}
                          onChange={(e) => handleUpdateWaypoint(wp.id, { connectorLine: e.target.checked })}
                          className="rounded accent-blue-500"
                        />
                        <span>Linha guia</span>
                      </label>
                    </div>
                  </div>

                  {/* Individual Typography for Waypoint */}
                  <TypographyControls
                    label={`Fonte do Rótulo (${wp.label})`}
                    value={wp.labelTypography}
                    onChange={(typo) => handleUpdateWaypoint(wp.id, { labelTypography: typo })}
                    previewSample={wp.label}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: FLOATING INFO BADGES */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('badges')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                7. Badges Flutuantes de Informação
              </div>
              <div className="text-[10px] text-slate-400">
                {editorial.badges.length} badges (tempo, km, ritmo, notas) com tipografia total
              </div>
            </div>
          </div>
          {openSection === 'badges' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'badges' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Badges Ativos</span>
              <button
                onClick={handleAddBadge}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Badge</span>
              </button>
            </div>

            <div className="space-y-3">
              {editorial.badges.map((b, idx) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={(e) => handleUpdateBadge(b.id, { enabled: e.target.checked })}
                        className="rounded accent-blue-500"
                      />
                      <span className="text-xs font-bold text-white">
                        Badge {idx + 1}: {b.text}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveBadge(b.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Excluir este badge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">Texto do Badge</label>
                      <input
                        type="text"
                        value={b.text}
                        onChange={(e) => handleUpdateBadge(b.id, { text: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Ícone</label>
                      <select
                        value={b.icon}
                        onChange={(e) => handleUpdateBadge(b.id, { icon: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="clock">⏱ Relógio</option>
                        <option value="road">🛣 Rodovia</option>
                        <option value="pace">⚡ Ritmo</option>
                        <option value="chat">💬 Balão</option>
                        <option value="heart">❤️ Coração</option>
                        <option value="star">⭐ Estrela</option>
                        <option value="none">Nenhum</option>
                      </select>
                    </div>
                  </div>

                  {/* Position Sliders X and Y */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                        <span>Horizontal (X)</span>
                        <span className="font-mono text-white">{b.xPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={b.xPct}
                        onChange={(e) => handleUpdateBadge(b.id, { xPct: Number(e.target.value) })}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                        <span>Vertical (Y)</span>
                        <span className="font-mono text-white">{b.yPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={b.yPct}
                        onChange={(e) => handleUpdateBadge(b.id, { yPct: Number(e.target.value) })}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Individual Typography for Badge */}
                  <TypographyControls
                    label={`Tipografia (${b.text})`}
                    value={b.typography}
                    onChange={(typo) => handleUpdateBadge(b.id, { typography: typo })}
                    previewSample={b.text}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: FOOTER CREDITS & ATHLETE NAME */}
      {/* ========================================================================= */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => toggleSection('credits')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                8. Rodapé de Créditos & Usuário
              </div>
              <div className="text-[10px] text-slate-400">
                Instagram | Google Maps, nome do atleta e tipografia individual
              </div>
            </div>
          </div>
          {openSection === 'credits' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'credits' && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Exibir Rodapé de Créditos</span>
              <input
                type="checkbox"
                checked={editorial.credits.enabled}
                onChange={(e) => updateEnRoute({
                  credits: { ...editorial.credits, enabled: e.target.checked }
                })}
                className="rounded accent-blue-500"
              />
            </div>

            {editorial.credits.enabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Texto dos Créditos
                    </label>
                    <input
                      type="text"
                      value={editorial.credits.creditsText}
                      onChange={(e) => updateEnRoute({
                        credits: { ...editorial.credits, creditsText: e.target.value }
                      })}
                      placeholder="Instagram | Google Maps"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Identificação do Atleta
                    </label>
                    <input
                      type="text"
                      value={editorial.credits.athleteName}
                      onChange={(e) => updateEnRoute({
                        credits: { ...editorial.credits, athleteName: e.target.value }
                      })}
                      placeholder="@atleta"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posição Horizontal (X)</span>
                      <span className="font-mono text-white">{editorial.credits.xPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={editorial.credits.xPct}
                      onChange={(e) => updateEnRoute({
                        credits: { ...editorial.credits, xPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Posição Vertical (Y)</span>
                      <span className="font-mono text-white">{editorial.credits.yPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="98"
                      step="0.5"
                      value={editorial.credits.yPct}
                      onChange={(e) => updateEnRoute({
                        credits: { ...editorial.credits, yPct: Number(e.target.value) }
                      })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Typography for Credits */}
                <TypographyControls
                  label="Tipografia dos Créditos (Instagram | Google Maps)"
                  value={editorial.credits.creditsTypography}
                  onChange={(typo) => updateEnRoute({
                    credits: { ...editorial.credits, creditsTypography: typo }
                  })}
                  previewSample={editorial.credits.creditsText || 'Instagram | Google Maps'}
                />

                {/* Typography for Athlete Username */}
                <TypographyControls
                  label="Tipografia do Nome do Atleta"
                  value={editorial.credits.athleteTypography}
                  onChange={(typo) => updateEnRoute({
                    credits: { ...editorial.credits, athleteTypography: typo }
                  })}
                  previewSample={editorial.credits.athleteName || '@runner'}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
