import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Map as MapIcon, 
  Sliders, 
  ListPlus, 
  Trash2, 
  Move, 
  RotateCcw, 
  Sparkles, 
  Compass, 
  ShieldAlert, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Bookmark, 
  Layers, 
  Flag, 
  Circle, 
  Check, 
  AlertTriangle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  StoryConfig, 
  RaceCourseMapConfig, 
  RaceCourseMapLegendItem, 
  RaceCourseMapStreetName, 
  RaceCourseMapAidStation, 
  RaceCourseMapMetricCardItem,
  TypographyConfig 
} from '../types';
import { getDefaultRaceCourseMapConfig } from '../lib/raceCourseMapTemplate';
import { createDefaultTypography } from '../lib/stravaAppTemplate';
import { TypographyControls } from './TypographyControls';

interface RaceCourseMapAdjustPanelProps {
  config: StoryConfig;
  onChange: (newConfig: StoryConfig) => void;
}

const STORAGE_KEY_PRESETS_T5 = 'pacelab_story_presets_template5_v1';

export const RaceCourseMapAdjustPanel: React.FC<RaceCourseMapAdjustPanelProps> = ({
  config,
  onChange
}) => {
  const conf: RaceCourseMapConfig = config.raceCourseMap || getDefaultRaceCourseMapConfig();

  const [activeTab, setActiveTab] = useState<
    'general' | 'title' | 'metrics' | 'legend' | 'route' | 'streets' | 'compass' | 'footer' | 'bg' | 'floating'
  >('general');

  // Confirmation Modals State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGlobalFontConfirm, setShowGlobalFontConfirm] = useState(false);
  const [targetGlobalFont, setTargetGlobalFont] = useState('Oswald');

  // Preset state
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; date: string; data: RaceCourseMapConfig }>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRESETS_T5);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const updateConf = (patch: Partial<RaceCourseMapConfig>) => {
    onChange({
      ...config,
      raceCourseMap: {
        ...conf,
        ...patch
      }
    });
  };

  // Restores factory defaults for Template 5 without touching other templates
  const handleFactoryReset = () => {
    updateConf(getDefaultRaceCourseMapConfig());
    setShowResetConfirm(false);
  };

  // Applies a global font family to every single text item in Template 5
  const handleApplyGlobalFontToAll = () => {
    const f = targetGlobalFont;
    
    const applyFont = (typo?: TypographyConfig): TypographyConfig => {
      const base = typo || createDefaultTypography();
      return { ...base, fontFamily: f };
    };

    updateConf({
      globalFont: f,
      title: {
        ...conf.title,
        part1: { ...conf.title.part1, typography: applyFont(conf.title.part1.typography) },
        part2: { ...conf.title.part2, typography: applyFont(conf.title.part2.typography) },
        registeredSymbol: { ...conf.title.registeredSymbol, typography: applyFont(conf.title.registeredSymbol.typography) }
      },
      sideLegend: {
        ...conf.sideLegend,
        items: conf.sideLegend.items.map(it => ({
          ...it,
          typography: applyFont(it.typography)
        }))
      },
      markers: {
        ...conf.markers,
        startFinishLabelTypography: applyFont(conf.markers.startFinishLabelTypography),
        aidStations: conf.markers.aidStations.map(as => ({
          ...as,
          labelTypography: applyFont(as.labelTypography)
        }))
      },
      streetNames: conf.streetNames.map(st => ({
        ...st,
        typography: applyFont(st.typography)
      })),
      northCompass: {
        ...conf.northCompass,
        letterNTypography: applyFont(conf.northCompass.letterNTypography)
      },
      footer: {
        ...conf.footer,
        teamOrBrandName: { ...conf.footer.teamOrBrandName, typography: applyFont(conf.footer.teamOrBrandName.typography) },
        slogan: { ...conf.footer.slogan, typography: applyFont(conf.footer.slogan.typography) }
      }
    });

    setShowGlobalFontConfirm(false);
  };

  // Preset handlers
  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    const newEntry = {
      name: presetNameInput.trim(),
      date: new Date().toLocaleDateString('pt-BR'),
      data: conf
    };
    const updated = [newEntry, ...savedPresets.filter(p => p.name !== newEntry.name)];
    setSavedPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS_T5, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setPresetNameInput('');
  };

  const handleLoadPreset = (pData: RaceCourseMapConfig) => {
    updateConf(pData);
  };

  const handleDeletePreset = (pName: string) => {
    const updated = savedPresets.filter(p => p.name !== pName);
    setSavedPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PRESETS_T5, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* HEADER BAR & PRESETS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
            <MapIcon className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Race Course Map • Template 5</h4>
            <p className="text-[11px] text-slate-400">Personalização 100% livre: cores, rota, legenda, ruas e tipografia individual</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar Template 5
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL: FACTORY RESET */}
      {showResetConfirm && (
        <div className="p-3.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-200 text-xs">Restaurar padrões do Template 5?</p>
              <p className="text-[10px] text-red-300/80">Esta ação irá redefinir todas as customizações do mapa e da legenda.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[11px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFactoryReset}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold shadow"
            >
              Confirmar Reset
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: UNIFY GLOBAL FONT */}
      {showGlobalFontConfirm && (
        <div className="p-3.5 bg-amber-950/80 border border-amber-500/50 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Type className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-200 text-xs">Aplicar fonte "{targetGlobalFont}" a TODOS os textos?</p>
              <p className="text-[10px] text-amber-300/80">Esta ação irá atualizar a família da fonte de cada título, legenda e rua.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGlobalFontConfirm(false)}
              className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[11px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyGlobalFontToAll}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-[11px] font-bold shadow"
            >
              Aplicar a Todos
            </button>
          </div>
        </div>
      )}

      {/* MAIN NAVIGATION SUB-TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-semibold text-center">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'general' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Geral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('title')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'title' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Título Topo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'metrics' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cards Métricas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('legend')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'legend' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Legenda
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('route')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'route' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rota & Pontos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('streets')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'streets' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Nomes Ruas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compass')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'compass' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Bússola (N)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'footer' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rodapé
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bg')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'bg' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Fundo/Mapa
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('floating')}
          className={`py-2 rounded-lg transition-colors ${
            activeTab === 'floating' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Flutuantes
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: GENERAL / PRESETS / GLOBAL COLORS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'general' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Preset Management Card */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-slate-100 text-xs">Presets Personalizados do Template 5</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do Preset (ex: Maratona Amarela)"
                value={presetNameInput}
                onChange={e => setPresetNameInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!presetNameInput.trim()}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg text-xs"
              >
                Salvar Preset
              </button>
            </div>

            {savedPresets.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Presets Salvos:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedPresets.map((p, idx) => (
                    <div key={idx} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.date}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadPreset(p.data)}
                          className="px-2 py-1 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 rounded text-[10px] font-bold"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(p.name)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accent Color Palette */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-slate-100 text-xs block">Cores e Tema Principal</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">Cor Destaque Primária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.primaryAccentColor || '#FFD400'}
                    onChange={e => updateConf({ primaryAccentColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-yellow-400">{conf.primaryAccentColor || '#FFD400'}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-medium block mb-1">Fundo do Canvas Escuro</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={conf.darkBgColor || '#0D0D0D'}
                    onChange={e => updateConf({ darkBgColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-300">{conf.darkBgColor || '#0D0D0D'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Global Font Family Shortcut */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-slate-100 text-xs block">Unificar Tipografia Global (Opcional)</span>
            <p className="text-[11px] text-slate-400">
              Escolha uma fonte para aplicar em massa em todos os textos do mapa de uma só vez:
            </p>
            <div className="flex items-center gap-2">
              <select
                value={targetGlobalFont}
                onChange={e => setTargetGlobalFont(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="Oswald">Oswald (Impacto / Condensado)</option>
                <option value="Inter">Inter (Sans Limpo)</option>
                <option value="Space Grotesk">Space Grotesk (Moderno)</option>
                <option value="Montserrat">Montserrat (Geométrico)</option>
                <option value="Bebas Neue">Bebas Neue (Display)</option>
                <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
                <option value="JetBrains Mono">JetBrains Mono (Tech)</option>
              </select>
              <button
                type="button"
                onClick={() => setShowGlobalFontConfirm(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs shrink-0"
              >
                Unificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: TITLE (TOP BANNER & SPLIT TITLE) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'title' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Ativação e Banner Superior</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.title.enabled}
                  onChange={e => updateConf({ title: { ...conf.title, enabled: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-xs text-slate-300">Exibir Título do Topo</span>
              </label>
            </div>

            {conf.title.enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conf.title.showTopBanner}
                      onChange={e => updateConf({ title: { ...conf.title, showTopBanner: e.target.checked } })}
                      className="rounded border-slate-700 text-yellow-500"
                    />
                    <span className="text-xs text-slate-300">Faixa Escura no Topo</span>
                  </label>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Alinhamento</label>
                    <select
                      value={conf.title.align}
                      onChange={e => updateConf({ title: { ...conf.title, align: e.target.value as any } })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                    >
                      <option value="center">Centralizado</option>
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 font-medium block mb-1">Posição Offset Y ({conf.title.yOffset}px)</span>
                    <input
                      type="range"
                      min={-100}
                      max={150}
                      value={conf.title.yOffset}
                      onChange={e => updateConf({ title: { ...conf.title, yOffset: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 font-medium block mb-1">Posição Offset X ({conf.title.xOffset}px)</span>
                    <input
                      type="range"
                      min={-200}
                      max={200}
                      value={conf.title.xOffset}
                      onChange={e => updateConf({ title: { ...conf.title, xOffset: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title Part 1 (White / Primary) */}
          {conf.title.enabled && (
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <span className="font-bold text-slate-100 text-xs block">Título — Parte 1 (ex: LIVESTRONG)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={conf.title.part1.text}
                  onChange={e => updateConf({
                    title: {
                      ...conf.title,
                      part1: { ...conf.title.part1, text: e.target.value }
                    }
                  })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-bold"
                  placeholder="LIVESTRONG"
                />
              </div>

              <TypographyControls
                label="Tipografia — Título Parte 1"
                value={conf.title.part1.typography}
                onChange={newTypo => updateConf({
                  title: {
                    ...conf.title,
                    part1: { ...conf.title.part1, typography: newTypo }
                  }
                })}
              />
            </div>
          )}

          {/* Title Part 2 (Yellow / Highlight) */}
          {conf.title.enabled && (
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <span className="font-bold text-slate-100 text-xs block">Título — Parte 2 (ex: HONOR 5K/10K)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={conf.title.part2.text}
                  onChange={e => updateConf({
                    title: {
                      ...conf.title,
                      part2: { ...conf.title.part2, text: e.target.value }
                    }
                  })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-yellow-400 font-bold"
                  placeholder="HONOR 5K/10K"
                />
              </div>

              <TypographyControls
                label="Tipografia — Título Parte 2"
                value={conf.title.part2.typography}
                onChange={newTypo => updateConf({
                  title: {
                    ...conf.title,
                    part2: { ...conf.title.part2, typography: newTypo }
                  }
                })}
              />
            </div>
          )}

          {/* Registered Symbol ® */}
          {conf.title.enabled && (
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-xs">Símbolo Registrado (®)</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conf.title.registeredSymbol.enabled}
                    onChange={e => updateConf({
                      title: {
                        ...conf.title,
                        registeredSymbol: { ...conf.title.registeredSymbol, enabled: e.target.checked }
                      }
                    })}
                    className="rounded border-slate-700 text-yellow-500"
                  />
                  <span className="text-xs text-slate-300">Exibir ®</span>
                </label>
              </div>

              {conf.title.registeredSymbol.enabled && (
                <TypographyControls
                  label="Tipografia — Símbolo ®"
                  value={conf.title.registeredSymbol.typography}
                  onChange={newTypo => updateConf({
                    title: {
                      ...conf.title,
                      registeredSymbol: { ...conf.title.registeredSymbol, typography: newTypo }
                    }
                  })}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2.5: CARDS & METRICS                                             */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'metrics' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Main Toggle Panel */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-100 text-xs block">Cards & Métricas (Distância, Tempo, Pace, Elevação, etc.)</span>
                <span className="text-[11px] text-slate-400">Exiba e personalize cada card de dados individualmente no percurso</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.metricsPanel?.enabled ?? true}
                  onChange={e => updateConf({
                    metricsPanel: {
                      ...(conf.metricsPanel || {
                        enabled: true,
                        layout: 'grid',
                        xPct: 6,
                        yPct: 62,
                        gap: 12,
                        bgColor: '#0D0D0D',
                        bgOpacity: 88,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#FFD400',
                        padding: 16,
                        shadowEnabled: true,
                        shadowColor: 'rgba(0,0,0,0.8)',
                        shadowBlur: 10,
                        cards: []
                      }),
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300 font-bold">Ativar Painel de Métricas</span>
              </label>
            </div>

            {/* Add New Metric Card Button */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Cards Ativos: {(conf.metricsPanel?.cards || []).length}</span>
              <button
                type="button"
                onClick={() => {
                  const newCard: RaceCourseMapMetricCardItem = {
                    id: `mc-${Date.now()}`,
                    enabled: true,
                    metricKey: 'custom',
                    label: 'NOVA MÉTRICA',
                    value: '100 %',
                    xPct: 10,
                    yPct: 50,
                    widthPx: 160,
                    heightPx: 70,
                    bgColor: '#0D0D0D',
                    bgOpacity: 85,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 212, 0, 0.3)',
                    paddingX: 12,
                    paddingY: 10,
                    shadowEnabled: true,
                    shadowColor: 'rgba(0,0,0,0.8)',
                    shadowBlur: 8,
                    shadowOffsetX: 0,
                    shadowOffsetY: 4,
                    showIcon: true,
                    iconType: 'star',
                    iconColor: '#FFD400',
                    iconSize: 18,
                    showLabel: true,
                    labelTypography: createDefaultTypography({
                      fontFamily: conf.globalFont || 'Oswald',
                      fontSize: 11,
                      fontWeight: '700',
                      letterSpacing: 2,
                      color: '#A3A3A3',
                      textTransform: 'uppercase'
                    }),
                    showValue: true,
                    valueTypography: createDefaultTypography({
                      fontFamily: conf.globalFont || 'Oswald',
                      fontSize: 24,
                      fontWeight: '800',
                      letterSpacing: 1,
                      color: '#FFD400'
                    })
                  };
                  const currentCards = conf.metricsPanel?.cards || [];
                  updateConf({
                    metricsPanel: {
                      ...(conf.metricsPanel || {
                        enabled: true,
                        layout: 'grid',
                        xPct: 6,
                        yPct: 62,
                        gap: 12,
                        bgColor: '#0D0D0D',
                        bgOpacity: 88,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#FFD400',
                        padding: 16,
                        shadowEnabled: true,
                        shadowColor: 'rgba(0,0,0,0.8)',
                        shadowBlur: 10,
                        cards: []
                      }),
                      cards: [...currentCards, newCard]
                    }
                  });
                }}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Card de Métrica</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          {(conf.metricsPanel?.cards || []).map((card, idx) => (
            <div key={card.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px] font-mono font-bold">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={card.label}
                    onChange={e => {
                      const newCards = [...(conf.metricsPanel?.cards || [])];
                      newCards[idx] = { ...newCards[idx], label: e.target.value };
                      updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-yellow-400 font-bold"
                    placeholder="RÓTULO DO CARD"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={card.enabled}
                      onChange={e => {
                        const newCards = [...(conf.metricsPanel?.cards || [])];
                        newCards[idx] = { ...newCards[idx], enabled: e.target.checked };
                        updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                      }}
                      className="rounded border-slate-700 text-yellow-500"
                    />
                    <span>Ativo</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const newCards = (conf.metricsPanel?.cards || []).filter((_, i) => i !== idx);
                      updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                    }}
                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                    title="Excluir Card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {card.enabled && (
                <div className="space-y-3 pt-1">
                  {/* Value / Number input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Valor / Número do Card (100% Personalizável):
                    </label>
                    <input
                      type="text"
                      value={card.value}
                      onChange={e => {
                        const newCards = [...(conf.metricsPanel?.cards || [])];
                        newCards[idx] = { ...newCards[idx], value: e.target.value };
                        updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                      placeholder="Ex: 21.10 km, 1h 45m, 4'58''"
                    />
                  </div>

                  {/* Position X / Y and Width / Height */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Posição X</span>
                        <span className="font-mono text-yellow-400">{card.xPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={card.xPct}
                        onChange={e => {
                          const newCards = [...(conf.metricsPanel?.cards || [])];
                          newCards[idx] = { ...newCards[idx], xPct: parseInt(e.target.value, 10) };
                          updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Posição Y</span>
                        <span className="font-mono text-yellow-400">{card.yPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={card.yPct}
                        onChange={e => {
                          const newCards = [...(conf.metricsPanel?.cards || [])];
                          newCards[idx] = { ...newCards[idx], yPct: parseInt(e.target.value, 10) };
                          updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Largura</span>
                        <span className="font-mono text-yellow-400">{card.widthPx}px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="300"
                        step="5"
                        value={card.widthPx}
                        onChange={e => {
                          const newCards = [...(conf.metricsPanel?.cards || [])];
                          newCards[idx] = { ...newCards[idx], widthPx: parseInt(e.target.value, 10) };
                          updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Altura</span>
                        <span className="font-mono text-yellow-400">{card.heightPx}px</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="150"
                        step="5"
                        value={card.heightPx}
                        onChange={e => {
                          const newCards = [...(conf.metricsPanel?.cards || [])];
                          newCards[idx] = { ...newCards[idx], heightPx: parseInt(e.target.value, 10) };
                          updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>
                  </div>

                  {/* Colors & Shadows */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Cor do Fundo</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={card.bgColor.length === 7 ? card.bgColor : '#0D0D0D'}
                          onChange={e => {
                            const newCards = [...(conf.metricsPanel?.cards || [])];
                            newCards[idx] = { ...newCards[idx], bgColor: e.target.value };
                            updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                          }}
                          className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={card.bgOpacity}
                          onChange={e => {
                            const newCards = [...(conf.metricsPanel?.cards || [])];
                            newCards[idx] = { ...newCards[idx], bgOpacity: parseInt(e.target.value, 10) };
                            updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                          }}
                          className="flex-1 accent-yellow-500"
                          title="Opacidade Fundo"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Borda (Cor / Espessura)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={card.borderColor.length === 7 ? card.borderColor : '#FFD400'}
                          onChange={e => {
                            const newCards = [...(conf.metricsPanel?.cards || [])];
                            newCards[idx] = { ...newCards[idx], borderColor: e.target.value };
                            updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                          }}
                          className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={card.borderWidth}
                          onChange={e => {
                            const newCards = [...(conf.metricsPanel?.cards || [])];
                            newCards[idx] = { ...newCards[idx], borderWidth: parseInt(e.target.value, 10) };
                            updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                          }}
                          className="flex-1 accent-yellow-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Ícone (Tipo & Cor)</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={card.iconType}
                          onChange={e => {
                            const newCards = [...(conf.metricsPanel?.cards || [])];
                            newCards[idx] = { ...newCards[idx], iconType: e.target.value };
                            updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded text-xs text-white p-1"
                        >
                          <option value="route">Rota</option>
                          <option value="clock">Relógio</option>
                          <option value="bolt">Raio</option>
                          <option value="star">Estrela</option>
                          <option value="flag">Bandeira</option>
                          <option value="circle">Círculo</option>
                        </select>

                        <input
                          type="color"
                          value={card.iconColor.length === 7 ? card.iconColor : '#FFD400'}
                          onChange={e => {
                            const newCards = [...(conf.metricsPanel?.cards || [])];
                            newCards[idx] = { ...newCards[idx], iconColor: e.target.value };
                            updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                          }}
                          className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Label Typography Controls */}
                  <TypographyControls
                    label={`Tipografia Rótulo — "${card.label}"`}
                    value={card.labelTypography}
                    onChange={newTypo => {
                      const newCards = [...(conf.metricsPanel?.cards || [])];
                      newCards[idx] = { ...newCards[idx], labelTypography: newTypo };
                      updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                    }}
                  />

                  {/* Value/Number Typography Controls */}
                  <TypographyControls
                    label={`Tipografia Número/Valor — "${card.value}"`}
                    value={card.valueTypography}
                    onChange={newTypo => {
                      const newCards = [...(conf.metricsPanel?.cards || [])];
                      newCards[idx] = { ...newCards[idx], valueTypography: newTypo };
                      updateConf({ metricsPanel: { ...conf.metricsPanel!, cards: newCards } });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: SIDE LEGEND */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'legend' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Painel da Legenda Lateral</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.sideLegend.enabled}
                  onChange={e => updateConf({ sideLegend: { ...conf.sideLegend, enabled: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300">Exibir Legenda</span>
              </label>
            </div>

            {conf.sideLegend.enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Posição X ({conf.sideLegend.xPct}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      value={conf.sideLegend.xPct}
                      onChange={e => updateConf({ sideLegend: { ...conf.sideLegend, xPct: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Posição Y ({conf.sideLegend.yPct}%)</span>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={conf.sideLegend.yPct}
                      onChange={e => updateConf({ sideLegend: { ...conf.sideLegend, yPct: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Espaçamento Vertical ({conf.sideLegend.verticalGap}px)</span>
                    <input
                      type="range"
                      min={4}
                      max={35}
                      value={conf.sideLegend.verticalGap}
                      onChange={e => updateConf({ sideLegend: { ...conf.sideLegend, verticalGap: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Largura do Card ({conf.sideLegend.widthPct}%)</span>
                    <input
                      type="range"
                      min={20}
                      max={60}
                      value={conf.sideLegend.widthPct}
                      onChange={e => updateConf({ sideLegend: { ...conf.sideLegend, widthPct: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of Legend Items */}
          {conf.sideLegend.enabled && (
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-xs">Itens da Legenda ({conf.sideLegend.items.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const newItem: RaceCourseMapLegendItem = {
                      id: `leg-${Date.now()}`,
                      enabled: true,
                      iconType: 'info',
                      iconColor: '#FFD400',
                      iconSize: 20,
                      showIcon: true,
                      text: 'NOVO ITEM DE LEGENDA',
                      showText: true,
                      isWarning: false,
                      warningIconColor: '#FFD400',
                      typography: createDefaultTypography({
                        fontSize: 13,
                        fontWeight: '700',
                        color: '#E2E8F0',
                        textTransform: 'uppercase'
                      })
                    };
                    updateConf({
                      sideLegend: {
                        ...conf.sideLegend,
                        items: [...conf.sideLegend.items, newItem]
                      }
                    });
                  }}
                  className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Item
                </button>
              </div>

              <div className="space-y-3">
                {conf.sideLegend.items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={e => {
                            const newItems = [...conf.sideLegend.items];
                            newItems[idx].enabled = e.target.checked;
                            updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                          }}
                          className="rounded border-slate-700 text-yellow-500"
                        />
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => {
                            const newItems = [...conf.sideLegend.items];
                            newItems[idx].text = e.target.value;
                            updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                          }}
                          className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-bold flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (idx === 0) return;
                            const newItems = [...conf.sideLegend.items];
                            const temp = newItems[idx - 1];
                            newItems[idx - 1] = newItems[idx];
                            newItems[idx] = temp;
                            updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (idx === conf.sideLegend.items.length - 1) return;
                            const newItems = [...conf.sideLegend.items];
                            const temp = newItems[idx + 1];
                            newItems[idx + 1] = newItems[idx];
                            newItems[idx] = temp;
                            updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-200"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = conf.sideLegend.items.filter((_, i) => i !== idx);
                            updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block mb-1">Ícone</span>
                        <select
                          value={item.iconType}
                          onChange={e => {
                            const newItems = [...conf.sideLegend.items];
                            newItems[idx].iconType = e.target.value as any;
                            updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                        >
                          <option value="route">Rota (Zigzag)</option>
                          <option value="flag">Bandeira (Largada/Chegada)</option>
                          <option value="circle_num">Círculo com Número</option>
                          <option value="stop">Power Stop (Octógono)</option>
                          <option value="clock">Relógio (Horário)</option>
                          <option value="warning">Alerta / Aviso (!)</option>
                          <option value="star">Estrela</option>
                          <option value="info">Informação (i)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isWarning}
                            onChange={e => {
                              const newItems = [...conf.sideLegend.items];
                              newItems[idx].isWarning = e.target.checked;
                              updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                            }}
                            className="rounded border-slate-700 text-amber-500"
                          />
                          <span className="text-amber-400 font-medium">Destaque Aviso</span>
                        </label>
                      </div>
                    </div>

                    <TypographyControls
                      label={`Tipografia — ${item.text || 'Item'}`}
                      value={item.typography}
                      onChange={newTypo => {
                        const newItems = [...conf.sideLegend.items];
                        newItems[idx].typography = newTypo;
                        updateConf({ sideLegend: { ...conf.sideLegend, items: newItems } });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: ROUTE & WAYPOINTS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'route' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-slate-100 text-xs block">Estilo da Linha do Percurso</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Cor da Rota</label>
                <input
                  type="color"
                  value={conf.route.color || '#FFD400'}
                  onChange={e => updateConf({ route: { ...conf.route, color: e.target.value } })}
                  className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-300 block mb-1">Espessura ({conf.route.width}px)</span>
                <input
                  type="range"
                  min={3}
                  max={24}
                  value={conf.route.width}
                  onChange={e => updateConf({ route: { ...conf.route, width: parseInt(e.target.value) } })}
                  className="w-full accent-yellow-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-300 block mb-1">Zoom do Traçado ({conf.route.zoom.toFixed(1)}x)</span>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={conf.route.zoom}
                  onChange={e => updateConf({ route: { ...conf.route, zoom: parseFloat(e.target.value) } })}
                  className="w-full accent-yellow-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.route.showDirectionArrows}
                  onChange={e => updateConf({ route: { ...conf.route, showDirectionArrows: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300">Setas Indicadoras de Sentido</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.route.showOuterGlow}
                  onChange={e => updateConf({ route: { ...conf.route, showOuterGlow: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300">Brilho Neon (Glow)</span>
              </label>
            </div>
          </div>

          {/* Start/Finish Marker */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Marcador de Largada / Chegada</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.markers.showStartFinish}
                  onChange={e => updateConf({ markers: { ...conf.markers, showStartFinish: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300">Exibir Marcador</span>
              </label>
            </div>

            {conf.markers.showStartFinish && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={conf.markers.startFinishName}
                  onChange={e => updateConf({ markers: { ...conf.markers, startFinishName: e.target.value } })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-yellow-400 font-bold"
                  placeholder="START / FINISH"
                />

                <TypographyControls
                  label="Tipografia — Rótulo Largada/Chegada"
                  value={conf.markers.startFinishLabelTypography}
                  onChange={newTypo => updateConf({
                    markers: {
                      ...conf.markers,
                      startFinishLabelTypography: newTypo
                    }
                  })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: STREET NAMES & LANDMARKS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'streets' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Nomes de Ruas e Pontos do Mapa</span>
              <button
                type="button"
                onClick={() => {
                  const newStreet: RaceCourseMapStreetName = {
                    id: `st-${Date.now()}`,
                    text: 'NOVA RUA / AVENIDA',
                    xPct: 50,
                    yPct: 50,
                    rotation: 0,
                    locked: false,
                    enabled: true,
                    typography: createDefaultTypography({
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#A3A3A3',
                      textTransform: 'uppercase'
                    })
                  };
                  updateConf({
                    streetNames: [...conf.streetNames, newStreet]
                  });
                }}
                className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Rua
              </button>
            </div>

            <div className="space-y-3">
              {conf.streetNames.map((st, idx) => (
                <div key={st.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={st.enabled}
                        onChange={e => {
                          const newSts = [...conf.streetNames];
                          newSts[idx].enabled = e.target.checked;
                          updateConf({ streetNames: newSts });
                        }}
                        className="rounded border-slate-700 text-yellow-500"
                      />
                      <input
                        type="text"
                        value={st.text}
                        onChange={e => {
                          const newSts = [...conf.streetNames];
                          newSts[idx].text = e.target.value;
                          updateConf({ streetNames: newSts });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-bold flex-1"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newSts = conf.streetNames.filter((_, i) => i !== idx);
                        updateConf({ streetNames: newSts });
                      }}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Posição X ({st.xPct}%)</span>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={st.xPct}
                        onChange={e => {
                          const newSts = [...conf.streetNames];
                          newSts[idx].xPct = parseInt(e.target.value);
                          updateConf({ streetNames: newSts });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Posição Y ({st.yPct}%)</span>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={st.yPct}
                        onChange={e => {
                          const newSts = [...conf.streetNames];
                          newSts[idx].yPct = parseInt(e.target.value);
                          updateConf({ streetNames: newSts });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Rotação ({st.rotation}°)</span>
                      <input
                        type="range"
                        min={-90}
                        max={90}
                        value={st.rotation}
                        onChange={e => {
                          const newSts = [...conf.streetNames];
                          newSts[idx].rotation = parseInt(e.target.value);
                          updateConf({ streetNames: newSts });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>
                  </div>

                  <TypographyControls
                    label={`Tipografia — ${st.text || 'Rua'}`}
                    value={st.typography}
                    onChange={newTypo => {
                      const newSts = [...conf.streetNames];
                      newSts[idx].typography = newTypo;
                      updateConf({ streetNames: newSts });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 6: NORTH COMPASS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'compass' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Indicação de Norte (Bússola N)</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.northCompass.enabled}
                  onChange={e => updateConf({ northCompass: { ...conf.northCompass, enabled: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300">Exibir Bússola</span>
              </label>
            </div>

            {conf.northCompass.enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Posição X ({conf.northCompass.xPct}%)</span>
                    <input
                      type="range"
                      min={10}
                      max={95}
                      value={conf.northCompass.xPct}
                      onChange={e => updateConf({ northCompass: { ...conf.northCompass, xPct: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Posição Y ({conf.northCompass.yPct}%)</span>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={conf.northCompass.yPct}
                      onChange={e => updateConf({ northCompass: { ...conf.northCompass, yPct: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Tamanho ({conf.northCompass.size}px)</span>
                    <input
                      type="range"
                      min={24}
                      max={80}
                      value={conf.northCompass.size}
                      onChange={e => updateConf({ northCompass: { ...conf.northCompass, size: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                </div>

                <TypographyControls
                  label="Tipografia da Letra N"
                  value={conf.northCompass.letterNTypography}
                  onChange={newTypo => updateConf({
                    northCompass: {
                      ...conf.northCompass,
                      letterNTypography: newTypo
                    }
                  })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 7: FOOTER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'footer' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Rodapé (Marca / Equipe)</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conf.footer.enabled}
                  onChange={e => updateConf({ footer: { ...conf.footer, enabled: e.target.checked } })}
                  className="rounded border-slate-700 text-yellow-500"
                />
                <span className="text-xs text-slate-300">Exibir Rodapé</span>
              </label>
            </div>

            {conf.footer.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Posição Offset Y ({conf.footer.yOffset}px)</span>
                    <input
                      type="range"
                      min={-150}
                      max={100}
                      value={conf.footer.yOffset}
                      onChange={e => updateConf({ footer: { ...conf.footer, yOffset: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Alinhamento</label>
                    <select
                      value={conf.footer.align}
                      onChange={e => updateConf({ footer: { ...conf.footer, align: e.target.value as any } })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                    >
                      <option value="center">Centralizado</option>
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-slate-200 text-xs block">Nome da Equipe / Marca</span>
                  <input
                    type="text"
                    value={conf.footer.teamOrBrandName.text}
                    onChange={e => updateConf({
                      footer: {
                        ...conf.footer,
                        teamOrBrandName: { ...conf.footer.teamOrBrandName, text: e.target.value }
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 font-bold"
                    placeholder="AUSTIN RUN CLUB"
                  />

                  <TypographyControls
                    label="Tipografia — Nome da Equipe"
                    value={conf.footer.teamOrBrandName.typography}
                    onChange={newTypo => updateConf({
                      footer: {
                        ...conf.footer,
                        teamOrBrandName: { ...conf.footer.teamOrBrandName, typography: newTypo }
                      }
                    })}
                  />
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-slate-200 text-xs block">Slogan / Tagline</span>
                  <input
                    type="text"
                    value={conf.footer.slogan.text}
                    onChange={e => updateConf({
                      footer: {
                        ...conf.footer,
                        slogan: { ...conf.footer.slogan, text: e.target.value }
                      }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-medium"
                    placeholder="EST. 2018 • AUSTIN, TEXAS"
                  />

                  <TypographyControls
                    label="Tipografia — Slogan"
                    value={conf.footer.slogan.typography}
                    onChange={newTypo => updateConf({
                      footer: {
                        ...conf.footer,
                        slogan: { ...conf.footer.slogan, typography: newTypo }
                      }
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 8: BACKGROUND & MAP STYLING */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'bg' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-slate-100 text-xs block">Origem do Fundo</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateConf({ background: { ...conf.background, source: 'map' } })}
                className={`py-2 rounded-lg font-bold text-xs border ${
                  conf.background.source === 'map' ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Mapa Escuro
              </button>
              <button
                type="button"
                onClick={() => updateConf({ background: { ...conf.background, source: 'photo' } })}
                className={`py-2 rounded-lg font-bold text-xs border ${
                  conf.background.source === 'photo' ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Foto Pessoal
              </button>
              <button
                type="button"
                onClick={() => updateConf({ background: { ...conf.background, source: 'solid' } })}
                className={`py-2 rounded-lg font-bold text-xs border ${
                  conf.background.source === 'solid' ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Cor Sólida
              </button>
            </div>

            {conf.background.source === 'photo' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Brilho da Foto ({conf.background.brightness})</span>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={conf.background.brightness}
                      onChange={e => updateConf({ background: { ...conf.background, brightness: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Contraste ({conf.background.contrast})</span>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={conf.background.contrast}
                      onChange={e => updateConf({ background: { ...conf.background, contrast: parseInt(e.target.value) } })}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-300 block mb-1">Filtro de Cor</span>
                  <select
                    value={conf.background.filter}
                    onChange={e => updateConf({ background: { ...conf.background, filter: e.target.value as any } })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value="none">Normal / Sem Filtro</option>
                    <option value="grayscale">Preto & Branco (Grayscale)</option>
                    <option value="sepia">Sépia Vintage</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 9: FLOATING ELEMENTS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'floating' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs">Textos Flutuantes Soltos ({conf.floatingTexts.length})</span>
              <button
                type="button"
                onClick={() => {
                  const newFt = {
                    id: `ft-${Date.now()}`,
                    text: 'TEXTO LIVRE',
                    xPct: 50,
                    yPct: 50,
                    rotation: 0,
                    enabled: true,
                    typography: createDefaultTypography({
                      fontSize: 18,
                      fontWeight: '800',
                      color: '#FFD400'
                    })
                  };
                  updateConf({
                    floatingTexts: [...conf.floatingTexts, newFt]
                  });
                }}
                className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Texto Solto
              </button>
            </div>

            <div className="space-y-3">
              {conf.floatingTexts.map((ft, idx) => (
                <div key={ft.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={ft.text}
                      onChange={e => {
                        const newFts = [...conf.floatingTexts];
                        newFts[idx].text = e.target.value;
                        updateConf({ floatingTexts: newFts });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-yellow-400 font-bold flex-1"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const newFts = conf.floatingTexts.filter((_, i) => i !== idx);
                        updateConf({ floatingTexts: newFts });
                      }}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Posição X ({ft.xPct}%)</span>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={ft.xPct}
                        onChange={e => {
                          const newFts = [...conf.floatingTexts];
                          newFts[idx].xPct = parseInt(e.target.value);
                          updateConf({ floatingTexts: newFts });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Posição Y ({ft.yPct}%)</span>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={ft.yPct}
                        onChange={e => {
                          const newFts = [...conf.floatingTexts];
                          newFts[idx].yPct = parseInt(e.target.value);
                          updateConf({ floatingTexts: newFts });
                        }}
                        className="w-full accent-yellow-500"
                      />
                    </div>
                  </div>

                  <TypographyControls
                    label={`Tipografia — ${ft.text || 'Texto Flutuante'}`}
                    value={ft.typography}
                    onChange={newTypo => {
                      const newFts = [...conf.floatingTexts];
                      newFts[idx].typography = newTypo;
                      updateConf({ floatingTexts: newFts });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
