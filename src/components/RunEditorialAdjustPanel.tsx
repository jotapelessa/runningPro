import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Map as MapIcon, 
  Palette, 
  Type, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Upload, 
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
  Flame,
  Calendar,
  Check,
  Bookmark,
  ArrowUp,
  ArrowDown,
  Layers,
  MapPin,
  Quote,
  MoreHorizontal,
  Compass,
  AlertCircle
} from 'lucide-react';
import { 
  UserActivity, 
  StoryConfig, 
  RunEditorialConfig, 
  RunEditorialMetricItem, 
  TypographyConfig 
} from '../types';
import { getDefaultRunEditorialConfig } from '../lib/runEditorialTemplate';
import { createDefaultTypography } from '../lib/stravaAppTemplate';
import { TypographyControls } from './TypographyControls';

interface RunEditorialAdjustPanelProps {
  config: StoryConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoryConfig>>;
  activity: UserActivity;
  athleteName: string;
}

export const RunEditorialAdjustPanel: React.FC<RunEditorialAdjustPanelProps> = ({
  config,
  setConfig,
  activity,
  athleteName
}) => {
  const editorial = config.runEditorial || getDefaultRunEditorialConfig(activity, athleteName);
  const [openSection, setOpenSection] = useState<string>('global');
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; config: RunEditorialConfig }>>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pacelab_run_editorial_presets');
      if (raw) {
        setSavedPresets(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateEditorial = (updater: (prev: RunEditorialConfig) => RunEditorialConfig) => {
    setConfig(old => {
      const current = old.runEditorial || getDefaultRunEditorialConfig(activity, athleteName);
      const next = updater(current);
      return {
        ...old,
        accentColor: next.accentColor,
        runEditorial: next
      };
    });
  };

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    try {
      const newPreset = { name: presetNameInput.trim(), config: editorial };
      const updated = [...savedPresets.filter(p => p.name !== newPreset.name), newPreset];
      setSavedPresets(updated);
      localStorage.setItem('pacelab_run_editorial_presets', JSON.stringify(updated));
      setPresetNameInput('');
      setSaveNotice(`Preset "${newPreset.name}" salvo com sucesso!`);
      setTimeout(() => setSaveNotice(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleApplyPreset = (preset: RunEditorialConfig) => {
    updateEditorial(() => preset);
    setSaveNotice('Preset aplicado!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleDeletePreset = (name: string) => {
    const updated = savedPresets.filter(p => p.name !== name);
    setSavedPresets(updated);
    localStorage.setItem('pacelab_run_editorial_presets', JSON.stringify(updated));
  };

  const handleResetDefaults = () => {
    const fresh = getDefaultRunEditorialConfig(activity, athleteName);
    updateEditorial(() => fresh);
    setSaveNotice('Padrão de fábrica do Template 3 restaurado!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleApplyGlobalFontToAll = () => {
    const primaryFont = editorial.globalTypography?.primaryFont || editorial.globalTypography?.fontFamily || 'Montserrat';
    const scaleMult = editorial.globalTypography?.scaleMultiplier || 1.0;

    const applyToTypo = (typo?: TypographyConfig): TypographyConfig => {
      const base = typo || createDefaultTypography();
      return {
        ...base,
        fontFamily: primaryFont,
        fontSize: Math.round(base.fontSize * scaleMult)
      };
    };

    updateEditorial(prev => ({
      ...prev,
      topLocation: {
        ...prev.topLocation,
        typography: applyToTypo(prev.topLocation.typography)
      },
      mainTitle: {
        ...prev.mainTitle,
        typography: applyToTypo(prev.mainTitle.typography)
      },
      subtitle: {
        ...prev.subtitle,
        typography: applyToTypo(prev.subtitle.typography)
      },
      dateTime: {
        ...prev.dateTime,
        dateTypography: applyToTypo(prev.dateTime.dateTypography),
        timeTypography: applyToTypo(prev.dateTime.timeTypography),
        separatorTypography: applyToTypo(prev.dateTime.separatorTypography)
      },
      userQuote: {
        ...prev.userQuote,
        typography: applyToTypo(prev.userQuote.typography)
      },
      metricsFooter: {
        ...prev.metricsFooter,
        items: prev.metricsFooter.items.map(m => ({
          ...m,
          labelTypography: applyToTypo(m.labelTypography),
          valueTypography: applyToTypo(m.valueTypography),
          unitTypography: applyToTypo(m.unitTypography)
        }))
      },
      bottomStrip: {
        ...prev.bottomStrip,
        dateTypography: applyToTypo(prev.bottomStrip.dateTypography),
        locationTypography: applyToTypo(prev.bottomStrip.locationTypography),
        separatorTypography: applyToTypo(prev.bottomStrip.separatorTypography)
      }
    }));

    setShowGlobalConfirm(false);
    setSaveNotice(`Fonte "${primaryFont}" aplicada a todos os textos!`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const toggleSection = (sec: string) => {
    setOpenSection(prev => prev === sec ? '' : sec);
  };

  return (
    <div className="space-y-4">
      {/* HEADER: TEMPLATE 3 & QUICK PRESET ACTIONS */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">Template 3 — Run Editorial</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Personalização Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Estilo clássico revista/editorial: tipografia independente em todos os textos, fotos e mini-rota
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          title="Restaurar padrão original do Template 3"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          <span>Restaurar</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SEÇÃO: TIPOGRAFIA GLOBAL & PRESETS */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('global')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Type className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Tipografia Global & Presets</span>
              <p className="text-[11px] text-slate-400">Fonte mestre, escala e presets salvos</p>
            </div>
          </div>
          {openSection === 'global' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'global' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            {/* Global Typography Controls */}
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-3">
              <div className="text-xs font-bold text-slate-200">Fonte Global Mestre</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Família Recomendada</label>
                  <select
                    value={editorial.globalTypography?.primaryFont || editorial.globalTypography?.fontFamily || 'Montserrat'}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateEditorial(prev => ({
                        ...prev,
                        globalTypography: {
                          ...(prev.globalTypography || {
                            fontFamily: val,
                            fontWeight: '400',
                            baseScale: 1.0,
                            letterSpacing: 0,
                            color: '#FFFFFF'
                          }),
                          primaryFont: val,
                          fontFamily: val
                        }
                      }));
                    }}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Montserrat">Montserrat (Editorial Moderno)</option>
                    <option value="Oswald">Oswald (Condensada Itálica Forte)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Suave / Premium)</option>
                    <option value="Inter">Inter (Limpa / Suíça)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech / Esportiva)</option>
                    <option value="Bebas Neue">Bebas Neue (Display Impacto)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Dados / Técnica)</option>
                    <option value="Roboto Condensed">Roboto Condensed (Atlética)</option>
                    <option value="Playfair Display">Playfair Display (Serifada Elegante)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                    Escala Mestre: {editorial.globalTypography?.scaleMultiplier || 1.0}x
                  </label>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.05"
                    value={editorial.globalTypography?.scaleMultiplier || 1.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateEditorial(prev => ({
                        ...prev,
                        globalTypography: {
                          ...(prev.globalTypography || {
                            fontFamily: 'Montserrat',
                            fontWeight: '400',
                            baseScale: 1.0,
                            letterSpacing: 0,
                            color: '#FFFFFF'
                          }),
                          scaleMultiplier: val,
                          baseScale: val
                        }
                      }));
                    }}
                    className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* Sync Button */}
              <div className="pt-2">
                {!showGlobalConfirm ? (
                  <button
                    onClick={() => setShowGlobalConfirm(true)}
                    className="w-full py-2 px-3 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aplicar Fonte Mestre a Todos os Textos do Template 3</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-orange-950/40 border border-orange-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-300">
                      <AlertCircle className="w-4 h-4 shrink-0 text-orange-400" />
                      <span>Confirmação: Deseja sobrescrever a tipografia de todos os textos?</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Essa ação atualizará a família de fonte de cada bloco (título, subtítulo, data, hora, métricas, rodapé) para "{editorial.globalTypography?.primaryFont || 'Montserrat'}".
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleApplyGlobalFontToAll}
                        className="px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
                      >
                        Sim, Aplicar a Todos
                      </button>
                      <button
                        onClick={() => setShowGlobalConfirm(false)}
                        className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Presets Management */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-200">Salvar Preset do Layout Atual</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do preset (ex: Meu Editorial Preto & Branco)"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleSavePreset}
                  disabled={!presetNameInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors disabled:opacity-40"
                >
                  Salvar
                </button>
              </div>

              {savedPresets.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-400">Presets Salvos:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedPresets.map(preset => (
                      <div key={preset.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <span className="text-xs text-white font-medium truncate">{preset.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleApplyPreset(preset.config)}
                            className="px-2 py-0.5 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-[11px] font-semibold"
                          >
                            Carregar
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.name)}
                            className="p-1 text-slate-400 hover:text-red-400"
                            title="Excluir preset"
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
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SEÇÃO: FUNDO (FOTO, FILTROS & VINHETAS) */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('background')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Fundo (Foto, Filtros & Vinheta)</span>
              <p className="text-[11px] text-slate-400">Foto colorida 100%, P&B, sépia e gradientes</p>
            </div>
          </div>
          {openSection === 'background' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'background' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            {/* Mode: Photo vs Solid vs Map */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'photo', label: 'Foto Pessoal' },
                { id: 'solid', label: 'Cor Sólida' },
                { id: 'map', label: 'Mapa GPS' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateEditorial(prev => ({
                    ...prev,
                    background: { ...prev.background, type: opt.id as any }
                  }))}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                    editorial.background.type === opt.id
                      ? 'border-orange-500 bg-orange-500/15 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Photo Filters */}
            {editorial.background.type === 'photo' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[
                    { id: 'normal', label: 'Colorido Original' },
                    { id: 'grayscale', label: 'Preto & Branco' },
                    { id: 'sepia', label: 'Sépia Editorial' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => updateEditorial(prev => ({
                        ...prev,
                        background: { ...prev.background, filterMode: f.id as any }
                      }))}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                        editorial.background.filterMode === f.id
                          ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Brightness, Contrast & Saturation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Brilho</span>
                      <span>{editorial.background.brightness || 0}</span>
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={editorial.background.brightness || 0}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        background: { ...prev.background, brightness: parseInt(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Contraste</span>
                      <span>{editorial.background.contrast || 0}</span>
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={editorial.background.contrast || 0}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        background: { ...prev.background, contrast: parseInt(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Vignettes for Readability */}
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                  <div className="text-xs font-bold text-slate-200">Vinhetas de Gradiente (Garante Legibilidade do Texto)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                        <span>Vinheta Topo</span>
                        <span>{editorial.background.topVignetteOpacity ?? 45}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editorial.background.topVignetteOpacity ?? 45}
                        onChange={(e) => updateEditorial(prev => ({
                          ...prev,
                          background: { ...prev.background, topVignetteOpacity: parseInt(e.target.value) }
                        }))}
                        className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                        <span>Vinheta Rodapé</span>
                        <span>{editorial.background.bottomVignetteOpacity ?? 65}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editorial.background.bottomVignetteOpacity ?? 65}
                        onChange={(e) => updateEditorial(prev => ({
                          ...prev,
                          background: { ...prev.background, bottomVignetteOpacity: parseInt(e.target.value) }
                        }))}
                        className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. SEÇÃO: TOPO DIREITO — LOCALIZAÇÃO */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('location')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Topo Direito — Localização</span>
              <p className="text-[11px] text-slate-400">Rótulo com nome do local e ícone de pin</p>
            </div>
          </div>
          {openSection === 'location' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'location' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Ativar Localização no Topo</span>
              </label>
              <input
                type="checkbox"
                checked={editorial.topLocation.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  topLocation: { ...prev.topLocation, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.topLocation.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto da Localização</label>
                  <input
                    type="text"
                    value={editorial.topLocation.text}
                    onChange={(e) => updateEditorial(prev => ({
                      ...prev,
                      topLocation: { ...prev.topLocation, text: e.target.value }
                    }))}
                    placeholder="SÃO PAULO, BRASIL"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição X (%)</span>
                      <span>{editorial.topLocation.xPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      step="0.5"
                      value={editorial.topLocation.xPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        topLocation: { ...prev.topLocation, xPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição Y (%)</span>
                      <span>{editorial.topLocation.yPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="0.5"
                      value={editorial.topLocation.yPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        topLocation: { ...prev.topLocation, yPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Pin Icon options */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60">
                  <span className="text-xs text-slate-300 font-medium">Exibir Ícone de Pin</span>
                  <input
                    type="checkbox"
                    checked={editorial.topLocation.iconEnabled}
                    onChange={(e) => updateEditorial(prev => ({
                      ...prev,
                      topLocation: { ...prev.topLocation, iconEnabled: e.target.checked }
                    }))}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>

                {/* Typography Controls */}
                <TypographyControls
                  label="Tipografia — Localização Topo"
                  value={editorial.topLocation.typography}
                  onChange={(typo) => updateEditorial(prev => ({
                    ...prev,
                    topLocation: { ...prev.topLocation, typography: typo }
                  }))}
                  previewSample={editorial.topLocation.text || 'SÃO PAULO'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. SEÇÃO: TÍTULO PRINCIPAL ("RUN" / "WALK") */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('mainTitle')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Título Principal ("RUN" / "WALK")</span>
              <p className="text-[11px] text-slate-400">Título grande itálico condensado em destaque</p>
            </div>
          </div>
          {openSection === 'mainTitle' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'mainTitle' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Ativar Título Principal</label>
              <input
                type="checkbox"
                checked={editorial.mainTitle.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  mainTitle: { ...prev.mainTitle, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.mainTitle.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto do Título</label>
                  <input
                    type="text"
                    value={editorial.mainTitle.text}
                    onChange={(e) => updateEditorial(prev => ({
                      ...prev,
                      mainTitle: { ...prev.mainTitle, text: e.target.value }
                    }))}
                    placeholder="RUN"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição X (%)</span>
                      <span>{editorial.mainTitle.xPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      step="0.5"
                      value={editorial.mainTitle.xPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        mainTitle: { ...prev.mainTitle, xPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição Y (%)</span>
                      <span>{editorial.mainTitle.yPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="35"
                      step="0.5"
                      value={editorial.mainTitle.yPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        mainTitle: { ...prev.mainTitle, yPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Typography Controls */}
                <TypographyControls
                  label="Tipografia — Título Principal"
                  value={editorial.mainTitle.typography}
                  onChange={(typo) => updateEditorial(prev => ({
                    ...prev,
                    mainTitle: { ...prev.mainTitle, typography: typo }
                  }))}
                  previewSample={editorial.mainTitle.text || 'RUN'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. SEÇÃO: SUBTÍTULO ("at your own pace") */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('subtitle')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Quote className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Subtítulo ("at your own pace")</span>
              <p className="text-[11px] text-slate-400">Frase limpa e fina logo abaixo do título</p>
            </div>
          </div>
          {openSection === 'subtitle' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'subtitle' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Ativar Subtítulo</label>
              <input
                type="checkbox"
                checked={editorial.subtitle.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  subtitle: { ...prev.subtitle, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.subtitle.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto do Subtítulo</label>
                  <input
                    type="text"
                    value={editorial.subtitle.text}
                    onChange={(e) => updateEditorial(prev => ({
                      ...prev,
                      subtitle: { ...prev.subtitle, text: e.target.value }
                    }))}
                    placeholder="at your own pace"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição X (%)</span>
                      <span>{editorial.subtitle.xPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      step="0.5"
                      value={editorial.subtitle.xPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        subtitle: { ...prev.subtitle, xPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição Y (%)</span>
                      <span>{editorial.subtitle.yPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="40"
                      step="0.5"
                      value={editorial.subtitle.yPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        subtitle: { ...prev.subtitle, yPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Typography Controls */}
                <TypographyControls
                  label="Tipografia — Subtítulo"
                  value={editorial.subtitle.typography}
                  onChange={(typo) => updateEditorial(prev => ({
                    ...prev,
                    subtitle: { ...prev.subtitle, typography: typo }
                  }))}
                  previewSample={editorial.subtitle.text || 'at your own pace'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. SEÇÃO: DATA E HORA COM SEPARADOR VERTICAL */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('dateTime')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Data & Hora com Separador</span>
              <p className="text-[11px] text-slate-400">Data e hora lado a lado com barra vertical</p>
            </div>
          </div>
          {openSection === 'dateTime' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'dateTime' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Ativar Bloco de Data/Hora</label>
              <input
                type="checkbox"
                checked={editorial.dateTime.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  dateTime: { ...prev.dateTime, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.dateTime.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto Data</label>
                    <input
                      type="text"
                      value={editorial.dateTime.dateText}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        dateTime: { ...prev.dateTime, dateText: e.target.value }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Separador</label>
                    <input
                      type="text"
                      value={editorial.dateTime.separatorText}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        dateTime: { ...prev.dateTime, separatorText: e.target.value }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto Hora</label>
                    <input
                      type="text"
                      value={editorial.dateTime.timeText}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        dateTime: { ...prev.dateTime, timeText: e.target.value }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição X (%)</span>
                      <span>{editorial.dateTime.xPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      step="0.5"
                      value={editorial.dateTime.xPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        dateTime: { ...prev.dateTime, xPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição Y (%)</span>
                      <span>{editorial.dateTime.yPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="18"
                      max="45"
                      step="0.5"
                      value={editorial.dateTime.yPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        dateTime: { ...prev.dateTime, yPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Typography Controls */}
                <TypographyControls
                  label="Tipografia — Texto da Data"
                  value={editorial.dateTime.dateTypography}
                  onChange={(typo) => updateEditorial(prev => ({
                    ...prev,
                    dateTime: { ...prev.dateTime, dateTypography: typo }
                  }))}
                  previewSample={editorial.dateTime.dateText || '20 SET'}
                />

                <TypographyControls
                  label="Tipografia — Texto da Hora"
                  value={editorial.dateTime.timeTypography}
                  onChange={(typo) => updateEditorial(prev => ({
                    ...prev,
                    dateTime: { ...prev.dateTime, timeTypography: typo }
                  }))}
                  previewSample={editorial.dateTime.timeText || '07:15'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. SEÇÃO: FRASE / MENSAGEM DO USUÁRIO & TRÊS PONTOS */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('quote')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <MoreHorizontal className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Frase & Três Pontos Decorativos</span>
              <p className="text-[11px] text-slate-400">Mensagem personalizada e separador de pontos</p>
            </div>
          </div>
          {openSection === 'quote' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'quote' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            {/* Frase */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Frase do Usuário / Atleta</label>
                <input
                  type="checkbox"
                  checked={editorial.userQuote.enabled}
                  onChange={(e) => updateEditorial(prev => ({
                    ...prev,
                    userQuote: { ...prev.userQuote, enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
              </div>

              {editorial.userQuote.enabled && (
                <>
                  <div>
                    <input
                      type="text"
                      value={editorial.userQuote.text}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        userQuote: { ...prev.userQuote, text: e.target.value }
                      }))}
                      placeholder="DAILY RUN TELEMETRY"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <TypographyControls
                    label="Tipografia — Frase do Usuário"
                    value={editorial.userQuote.typography}
                    onChange={(typo) => updateEditorial(prev => ({
                      ...prev,
                      userQuote: { ...prev.userQuote, typography: typo }
                    }))}
                    previewSample={editorial.userQuote.text || 'TELEMETRY'}
                  />
                </>
              )}
            </div>

            {/* Três Pontos */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Três Pontos Decorativos</label>
                <input
                  type="checkbox"
                  checked={editorial.decorativeDots.enabled}
                  onChange={(e) => updateEditorial(prev => ({
                    ...prev,
                    decorativeDots: { ...prev.decorativeDots, enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
              </div>

              {editorial.decorativeDots.enabled && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Estilo</label>
                    <select
                      value={editorial.decorativeDots.style}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        decorativeDots: { ...prev.decorativeDots, style: e.target.value as any }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="dots">Pontos (• • •)</option>
                      <option value="diamonds">Losangos (♦ ♦ ♦)</option>
                      <option value="line">Linha Sólida</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={editorial.decorativeDots.count}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        decorativeDots: { ...prev.decorativeDots, count: parseInt(e.target.value) || 3 }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Espaçamento</label>
                    <input
                      type="number"
                      min="6"
                      max="30"
                      value={editorial.decorativeDots.spacing}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        decorativeDots: { ...prev.decorativeDots, spacing: parseInt(e.target.value) || 14 }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 8. SEÇÃO: RODAPÉ ESQUERDO — MÉTRICAS (DISTÂNCIA, PACE, TEMPO) */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('metrics')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Rodapé Esquerdo — Métricas</span>
              <p className="text-[11px] text-slate-400">Distância, pace, tempo: empilhados ou em linha</p>
            </div>
          </div>
          {openSection === 'metrics' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'metrics' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Ativar Rodapé de Métricas</label>
              <input
                type="checkbox"
                checked={editorial.metricsFooter.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  metricsFooter: { ...prev.metricsFooter, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.metricsFooter.enabled && (
              <div className="space-y-4">
                {/* Layout switch: vertical vs horizontal */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateEditorial(prev => ({
                      ...prev,
                      metricsFooter: { ...prev.metricsFooter, layout: 'vertical' }
                    }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      editorial.metricsFooter.layout === 'vertical'
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    Empilhado (Vertical)
                  </button>
                  <button
                    onClick={() => updateEditorial(prev => ({
                      ...prev,
                      metricsFooter: { ...prev.metricsFooter, layout: 'horizontal' }
                    }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      editorial.metricsFooter.layout === 'horizontal'
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    Em Linha (Horizontal)
                  </button>
                </div>

                {/* Position Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição X (%)</span>
                      <span>{editorial.metricsFooter.xPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="60"
                      step="0.5"
                      value={editorial.metricsFooter.xPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        metricsFooter: { ...prev.metricsFooter, xPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição Y (%)</span>
                      <span>{editorial.metricsFooter.yPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="92"
                      step="0.5"
                      value={editorial.metricsFooter.yPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        metricsFooter: { ...prev.metricsFooter, yPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                {/* Metric Items List */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-200">Itens de Métricas:</div>
                  {editorial.metricsFooter.items.map((item, index) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateEditorial(prev => ({
                                ...prev,
                                metricsFooter: {
                                  ...prev.metricsFooter,
                                  items: prev.metricsFooter.items.map((it, i) => i === index ? { ...it, enabled: checked } : it)
                                }
                              }));
                            }}
                            className="w-4 h-4 accent-orange-500 rounded"
                          />
                          <span className="text-xs font-bold text-white uppercase">{item.label || `Métrica ${index + 1}`}</span>
                        </div>

                        {/* Move Up / Down */}
                        <div className="flex items-center gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => {
                              updateEditorial(prev => {
                                const list = [...prev.metricsFooter.items];
                                const temp = list[index - 1];
                                list[index - 1] = list[index];
                                list[index] = temp;
                                return {
                                  ...prev,
                                  metricsFooter: { ...prev.metricsFooter, items: list }
                                };
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={index === editorial.metricsFooter.items.length - 1}
                            onClick={() => {
                              updateEditorial(prev => {
                                const list = [...prev.metricsFooter.items];
                                const temp = list[index + 1];
                                list[index + 1] = list[index];
                                list[index] = temp;
                                return {
                                  ...prev,
                                  metricsFooter: { ...prev.metricsFooter, items: list }
                                };
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.enabled && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Rótulo</label>
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateEditorial(prev => ({
                                    ...prev,
                                    metricsFooter: {
                                      ...prev.metricsFooter,
                                      items: prev.metricsFooter.items.map((it, i) => i === index ? { ...it, label: v } : it)
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Valor</label>
                              <input
                                type="text"
                                value={item.value}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateEditorial(prev => ({
                                    ...prev,
                                    metricsFooter: {
                                      ...prev.metricsFooter,
                                      items: prev.metricsFooter.items.map((it, i) => i === index ? { ...it, value: v, autoField: 'custom' } : it)
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Unidade</label>
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateEditorial(prev => ({
                                    ...prev,
                                    metricsFooter: {
                                      ...prev.metricsFooter,
                                      items: prev.metricsFooter.items.map((it, i) => i === index ? { ...it, unit: v, unitEnabled: Boolean(v) } : it)
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white"
                              />
                            </div>
                          </div>

                          {/* Typographies */}
                          <TypographyControls
                            label={`Tipografia — Rótulo (${item.label})`}
                            value={item.labelTypography}
                            onChange={(typo) => updateEditorial(prev => ({
                              ...prev,
                              metricsFooter: {
                                ...prev.metricsFooter,
                                items: prev.metricsFooter.items.map((it, i) => i === index ? { ...it, labelTypography: typo } : it)
                              }
                            }))}
                            previewSample={item.label || 'DISTÂNCIA'}
                          />

                          <TypographyControls
                            label={`Tipografia — Valor (${item.label})`}
                            value={item.valueTypography}
                            onChange={(typo) => updateEditorial(prev => ({
                              ...prev,
                              metricsFooter: {
                                ...prev.metricsFooter,
                                items: prev.metricsFooter.items.map((it, i) => i === index ? { ...it, valueTypography: typo } : it)
                              }
                            }))}
                            previewSample={item.value || '10.00'}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 9. SEÇÃO: RODAPÉ DIREITO — ÍCONE DE ROTA */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('routeIcon')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Navigation className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Rodapé Direito — Ícone de Rota</span>
              <p className="text-[11px] text-slate-400">Desenho da rota em traço estilizado no canto</p>
            </div>
          </div>
          {openSection === 'routeIcon' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'routeIcon' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Ativar Ícone de Rota</label>
              <input
                type="checkbox"
                checked={editorial.routeIcon.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  routeIcon: { ...prev.routeIcon, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.routeIcon.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateEditorial(prev => ({
                      ...prev,
                      routeIcon: { ...prev.routeIcon, mode: 'route' }
                    }))}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                      editorial.routeIcon.mode === 'route'
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    Traçado GPS Real
                  </button>
                  <button
                    onClick={() => updateEditorial(prev => ({
                      ...prev,
                      routeIcon: { ...prev.routeIcon, mode: 'icon' }
                    }))}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                      editorial.routeIcon.mode === 'icon'
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ícone Genérico
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Tamanho (px)</span>
                      <span>{editorial.routeIcon.size}px</span>
                    </label>
                    <input
                      type="range"
                      min="120"
                      max="320"
                      value={editorial.routeIcon.size}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        routeIcon: { ...prev.routeIcon, size: parseInt(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Espessura Traço</span>
                      <span>{editorial.routeIcon.strokeWidth}px</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="0.5"
                      value={editorial.routeIcon.strokeWidth}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        routeIcon: { ...prev.routeIcon, strokeWidth: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição X (%)</span>
                      <span>{editorial.routeIcon.xPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      step="0.5"
                      value={editorial.routeIcon.xPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        routeIcon: { ...prev.routeIcon, xPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 flex justify-between">
                      <span>Posição Y (%)</span>
                      <span>{editorial.routeIcon.yPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      step="0.5"
                      value={editorial.routeIcon.yPct}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        routeIcon: { ...prev.routeIcon, yPct: parseFloat(e.target.value) }
                      }))}
                      className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 10. SEÇÃO: FAIXA INFERIOR (DATA COMPLETA & LOCALIZAÇÃO) */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('bottomStrip')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Faixa Inferior (Data Completa)</span>
              <p className="text-[11px] text-slate-400">Linha fina e discreta com data completa e local</p>
            </div>
          </div>
          {openSection === 'bottomStrip' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'bottomStrip' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Ativar Faixa Inferior</label>
              <input
                type="checkbox"
                checked={editorial.bottomStrip.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  bottomStrip: { ...prev.bottomStrip, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.bottomStrip.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto da Data</label>
                    <input
                      type="text"
                      value={editorial.bottomStrip.dateText}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        bottomStrip: { ...prev.bottomStrip, dateText: e.target.value }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Texto do Local</label>
                    <input
                      type="text"
                      value={editorial.bottomStrip.locationText}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        bottomStrip: { ...prev.bottomStrip, locationText: e.target.value }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <TypographyControls
                  label="Tipografia — Faixa Inferior"
                  value={editorial.bottomStrip.dateTypography}
                  onChange={(typo) => updateEditorial(prev => ({
                    ...prev,
                    bottomStrip: { 
                      ...prev.bottomStrip, 
                      dateTypography: typo,
                      locationTypography: typo
                    }
                  }))}
                  previewSample={editorial.bottomStrip.dateText || '20 DE SETEMBRO DE 2026'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 11. SEÇÃO: MAPA OPCIONAL (CENTRAL) */}
      {/* ======================================================== */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <button
          onClick={() => toggleSection('map')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-orange-400" />
            <div className="text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Mapa Interativo (Opcional)</span>
              <p className="text-[11px] text-slate-400">Por padrão desligado; ative se desejar exibir mapa central</p>
            </div>
          </div>
          {openSection === 'map' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSection === 'map' && (
          <div className="p-4 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Exibir Painel de Mapa Central</label>
              <input
                type="checkbox"
                checked={editorial.optionalMap.enabled}
                onChange={(e) => updateEditorial(prev => ({
                  ...prev,
                  optionalMap: { ...prev.optionalMap, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-orange-500 rounded"
              />
            </div>

            {editorial.optionalMap.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Estilo do Mapa</label>
                    <select
                      value={editorial.optionalMap.mapStyle}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        optionalMap: { ...prev.optionalMap, mapStyle: e.target.value as any }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="dark">Escuro Cartográfico</option>
                      <option value="light">Claro Moderno</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Espessura da Rota</label>
                    <input
                      type="number"
                      min="2"
                      max="12"
                      value={editorial.optionalMap.routeWidth}
                      onChange={(e) => updateEditorial(prev => ({
                        ...prev,
                        optionalMap: { ...prev.optionalMap, routeWidth: parseInt(e.target.value) || 5 }
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
