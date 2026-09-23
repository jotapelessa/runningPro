import React, { useState } from 'react';
import { 
  Sliders, 
  Layers, 
  Palette, 
  Type, 
  Camera, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Bookmark, 
  Check, 
  Mountain, 
  Eye, 
  EyeOff, 
  Sun, 
  Contrast, 
  SlidersHorizontal, 
  Move,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { 
  StoryConfig, 
  UserActivity, 
  CourseDataConfig, 
  CourseDataTableRow, 
  CourseDataPeakMarker,
  CourseDataFloatingText
} from '../types';
import { getDefaultCourseDataConfig } from '../lib/courseDataTemplate';

interface CourseDataAdjustPanelProps {
  config: StoryConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoryConfig>>;
  activity: UserActivity;
  athleteName: string;
  selectedCardId: string | null;
  onSelectCard: (id: 'header' | 'primary' | 'secondary' | 'map') => void;
}

const STORAGE_KEY_COURSE_DATA_PRESETS = 'pacelab_course_data_presets_v1';

export const POPULAR_FONTS = [
  { label: 'Padrão (Sans Moderno)', value: 'sans' },
  { label: 'Inter (Sans Limpo)', value: 'Inter' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
  { label: 'Space Grotesk (Tech)', value: 'Space Grotesk' },
  { label: 'Oswald (Condensado/Impacto)', value: 'Oswald' },
  { label: 'Montserrat (Geométrico)', value: 'Montserrat' },
  { label: 'Bebas Neue (Display Caixa Alta)', value: 'Bebas Neue' },
  { label: 'JetBrains Mono (Mono Code)', value: 'JetBrains Mono' },
  { label: 'Roboto Condensed', value: 'Roboto Condensed' },
  { label: 'Playfair Display (Serif Elegante)', value: 'Playfair Display' }
];

export const CourseDataAdjustPanel: React.FC<CourseDataAdjustPanelProps> = ({
  config,
  setConfig,
  activity,
  athleteName,
  selectedCardId,
  onSelectCard
}) => {
  const cd = config.courseData || getDefaultCourseDataConfig(activity, athleteName);

  const [activeSubTab, setActiveSubTab] = useState<
    'header' | 'table' | 'elevation' | 'bg' | 'map' | 'floating' | 'presets'
  >('header');

  const [globalFont, setGlobalFont] = useState<string>('sans');
  const [presetNameInput, setPresetNameInput] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; date: string; data: CourseDataConfig }>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COURSE_DATA_PRESETS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  // Safe immutable state updater
  const updateCd = (updater: (prevCd: CourseDataConfig) => CourseDataConfig) => {
    setConfig(prev => {
      const current = prev.courseData || getDefaultCourseDataConfig(activity, athleteName);
      const updated = updater(current);
      return {
        ...prev,
        courseData: updated
      };
    });
  };

  // Apply Global Font to ALL text elements in Template 1
  const handleApplyGlobalFont = (fontVal: string) => {
    updateCd(prev => ({
      ...prev,
      courseDataLabel: { ...prev.courseDataLabel, fontFamily: fontVal as any },
      activityName: { ...prev.activityName, fontFamily: fontVal as any },
      dateText: { ...prev.dateText, fontFamily: fontVal as any },
      elevationFooter: {
        ...prev.elevationFooter,
        titleFontFamily: fontVal as any,
        athleteFontFamily: fontVal as any
      },
      peakMarkers: {
        ...prev.peakMarkers,
        markers: prev.peakMarkers.markers.map(m => ({ ...m, fontFamily: fontVal as any }))
      },
      dataTable: {
        ...prev.dataTable,
        rows: prev.dataTable.rows.map(r => ({
          ...r,
          fontFamily: fontVal as any,
          labelFontFamily: fontVal as any,
          valueFontFamily: fontVal as any
        }))
      },
      floatingTexts: (prev.floatingTexts || []).map(t => ({
        ...t,
        fontFamily: fontVal as any
      }))
    }));
    setSaveNotice(`Fonte "${fontVal}" aplicada a todos os textos do Course Data!`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Preset Handlers
  const handleSavePreset = () => {
    const name = presetNameInput.trim() || `Preset ${savedPresets.length + 1}`;
    const newEntry = {
      name,
      date: new Date().toLocaleDateString('pt-BR'),
      data: cd
    };
    const updated = [newEntry, ...savedPresets];
    setSavedPresets(updated);
    localStorage.setItem(STORAGE_KEY_COURSE_DATA_PRESETS, JSON.stringify(updated));
    setPresetNameInput('');
    setSaveNotice(`Preset "${name}" salvo com sucesso!`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleApplyPreset = (presetData: CourseDataConfig) => {
    updateCd(() => presetData);
    setSaveNotice('Preset aplicado com sucesso!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleDeletePreset = (index: number) => {
    const updated = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updated);
    localStorage.setItem(STORAGE_KEY_COURSE_DATA_PRESETS, JSON.stringify(updated));
  };

  const handleResetFactoryDefaults = () => {
    const fresh = getDefaultCourseDataConfig(activity, athleteName);
    updateCd(() => fresh);
    setSaveNotice('Template 1 restaurado para as configurações padrão de fábrica!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  // Quick Palettes
  const applyQuickPalette = (accent: string, bg: string, text: string) => {
    updateCd(prev => ({
      ...prev,
      activityName: { ...prev.activityName, color: accent },
      elevationFooter: { ...prev.elevationFooter, strokeColor: accent, fillColorTop: accent },
      headerBar: { ...prev.headerBar, bgColor: bg },
      dataTable: { ...prev.dataTable, bgColor: bg },
      optionalMap: { ...prev.optionalMap, routeColor: accent }
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Notice */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4E157]" />
            <span>Personalização Total — Template 1 (Course Data)</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Controle total de tipografia, tamanho, cor, posição, distância e rotação de cada elemento.
          </p>
        </div>

        <button
          onClick={handleResetFactoryDefaults}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition-all shrink-0"
          title="Restaura os valores de fábrica do Template 1"
        >
          <RotateCcw className="w-3 h-3 text-[#D4E157]" />
          <span>Restaurar Fábrica</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Global Typography Sync Toolbar */}
      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D4E157]" />
          <span className="text-[11px] font-bold text-slate-200">Fonte Global do Template:</span>
          <select
            value={globalFont}
            onChange={e => setGlobalFont(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
          >
            {POPULAR_FONTS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => handleApplyGlobalFont(globalFont)}
          className="px-2.5 py-1 rounded bg-[#D4E157] hover:bg-[#c2cf45] text-slate-950 text-[11px] font-bold shadow-sm transition-all"
        >
          Aplicar a Todos os Textos
        </button>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
        {[
          { id: 'header', label: 'Cabeçalho', icon: Type },
          { id: 'table', label: 'Tabela', icon: SlidersHorizontal },
          { id: 'elevation', label: 'Altimetria', icon: Mountain },
          { id: 'bg', label: 'Fundo & FX', icon: Camera },
          { id: 'map', label: 'Mini-Mapa', icon: MapIcon },
          { id: 'floating', label: 'Anotações', icon: Plus },
          { id: 'presets', label: 'Presets', icon: Bookmark }
        ].map(t => {
          const Icon = t.icon;
          const isAct = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={`p-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
                isAct
                  ? 'bg-slate-800 text-[#D4E157] font-bold shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 1. CABEÇALHO & TEXTOS                                                */}
      {/* ==================================================================== */}
      {activeSubTab === 'header' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Card da Faixa Superior do Cabeçalho</span>
            </span>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <span>{cd.headerBar.enabled ? 'Ativado' : 'Oculto'}</span>
              <input
                type="checkbox"
                checked={cd.headerBar.enabled}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  headerBar: { ...prev.headerBar, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-[#D4E157] rounded"
              />
            </label>
          </div>

          {/* Dimensões, Posição e Fundo da Faixa */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 space-y-3">
            <span className="text-[11px] font-bold text-slate-200">Dimensões & Fundo do Card</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Altura</span>
                  <span className="font-mono text-[#D4E157]">{cd.headerBar.heightPct}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="30"
                  step="1"
                  value={cd.headerBar.heightPct}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, heightPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Largura</span>
                  <span className="font-mono text-[#D4E157]">{cd.headerBar.widthPct ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={cd.headerBar.widthPct ?? 100}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, widthPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Posição Y</span>
                  <span className="font-mono text-[#D4E157]">{cd.headerBar.yPct ?? 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={cd.headerBar.yPct ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, yPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Opacidade Fundo</span>
                  <span className="font-mono text-[#D4E157]">{cd.headerBar.bgOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cd.headerBar.bgOpacity}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, bgOpacity: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor de Fundo</label>
                <input
                  type="color"
                  value={cd.headerBar.bgColor.startsWith('#') ? cd.headerBar.bgColor : '#0C0E12'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, bgColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Padding Lateral (px)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cd.headerBar.paddingX ?? 48}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, paddingX: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Arredondamento (px)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={cd.headerBar.borderRadius ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    headerBar: { ...prev.headerBar, borderRadius: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* 1.1 Rótulo "COURSE DATA" */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4E157] uppercase tracking-wide">
                Texto 1: Rótulo "COURSE DATA"
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>{cd.courseDataLabel.enabled ? 'Visível' : 'Oculto'}</span>
                <input
                  type="checkbox"
                  checked={cd.courseDataLabel.enabled}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, enabled: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Texto (quebra de linha permitida)</label>
              <textarea
                rows={2}
                value={cd.courseDataLabel.text}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  courseDataLabel: { ...prev.courseDataLabel, text: e.target.value }
                }))}
                placeholder="COURSE\nDATA"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4E157] font-mono"
              />
            </div>

            {/* Tipografia & Estilo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Família da Fonte</label>
                <select
                  value={cd.courseDataLabel.fontFamily}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, fontFamily: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho (px)</label>
                <input
                  type="number"
                  min="10"
                  max="64"
                  value={cd.courseDataLabel.fontSize}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, fontSize: parseInt(e.target.value, 10) || 22 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Peso (Weight)</label>
                <select
                  value={cd.courseDataLabel.fontWeight || '900'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, fontWeight: e.target.value }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor do Texto</label>
                <input
                  type="color"
                  value={cd.courseDataLabel.color.startsWith('#') ? cd.courseDataLabel.color : '#CBD5E1'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, color: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Posição, Distância e Rotação */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.courseDataLabel.xOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, xOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.courseDataLabel.yOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, yOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tracking (px)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={cd.courseDataLabel.letterSpacing}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, letterSpacing: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Rotação (°)</label>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  value={cd.courseDataLabel.rotation ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    courseDataLabel: { ...prev.courseDataLabel, rotation: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 1.2 Nome da Atividade / Prova */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4E157] uppercase tracking-wide">
                Texto 2: Nome da Atividade / Percurso
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>{cd.activityName.enabled ? 'Visível' : 'Oculto'}</span>
                <input
                  type="checkbox"
                  checked={cd.activityName.enabled}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, enabled: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Texto Customizado</label>
              <input
                type="text"
                value={cd.activityName.customText ?? activity.title}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  activityName: { ...prev.activityName, customText: e.target.value }
                }))}
                placeholder="CIRCUITO DE TREINO"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4E157]"
              />
            </div>

            {/* Tipografia & Estilo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Família da Fonte</label>
                <select
                  value={cd.activityName.fontFamily || 'sans'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, fontFamily: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho (px)</label>
                <input
                  type="number"
                  min="12"
                  max="54"
                  value={cd.activityName.fontSize}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, fontSize: parseInt(e.target.value, 10) || 22 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Peso (Weight)</label>
                <select
                  value={cd.activityName.fontWeight || '700'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, fontWeight: e.target.value }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="400">Regular (400)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor Destaque</label>
                <input
                  type="color"
                  value={cd.activityName.color.startsWith('#') ? cd.activityName.color : '#D4E157'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, color: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Posição, Distância e Rotação */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.activityName.xOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, xOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.activityName.yOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, yOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Alinhamento</label>
                <select
                  value={cd.activityName.align}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, align: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="right">Direita</option>
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Rotação (°)</label>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  value={cd.activityName.rotation ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    activityName: { ...prev.activityName, rotation: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 1.3 Data do Treino */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4E157] uppercase tracking-wide">
                Texto 3: Data do Treino
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>{cd.dateText.enabled ? 'Visível' : 'Oculto'}</span>
                <input
                  type="checkbox"
                  checked={cd.dateText.enabled}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, enabled: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Formato Automático</label>
                <select
                  value={cd.dateText.format}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, format: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="verbose">20 DE OUTUBRO • 2026</option>
                  <option value="dd_mm_yyyy">20/10/2026</option>
                  <option value="iso">2026-10-20</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Texto Customizado (Opcional)</label>
                <input
                  type="text"
                  value={cd.dateText.customText || ''}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, customText: e.target.value }
                  }))}
                  placeholder="Automático"
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Tipografia & Estilo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Família da Fonte</label>
                <select
                  value={cd.dateText.fontFamily || 'sans'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, fontFamily: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho (px)</label>
                <input
                  type="number"
                  min="10"
                  max="36"
                  value={cd.dateText.fontSize}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, fontSize: parseInt(e.target.value, 10) || 12 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Peso (Weight)</label>
                <select
                  value={cd.dateText.fontWeight || '400'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, fontWeight: e.target.value }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor da Data</label>
                <input
                  type="color"
                  value={cd.dateText.color.startsWith('#') ? cd.dateText.color : '#94A3B8'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, color: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Posição, Distância e Rotação */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.dateText.xOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, xOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.dateText.yOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, yOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tracking (px)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={cd.dateText.letterSpacing}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, letterSpacing: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Rotação (°)</label>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  value={cd.dateText.rotation ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dateText: { ...prev.dateText, rotation: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TABELA DE DADOS DO PERCURSO                                       */}
      {/* ==================================================================== */}
      {activeSubTab === 'table' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Card da Tabela Técnica de Dados</span>
            </span>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <span>{cd.dataTable.enabled ? 'Ativada' : 'Oculta'}</span>
              <input
                type="checkbox"
                checked={cd.dataTable.enabled}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  dataTable: { ...prev.dataTable, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-[#D4E157] rounded"
              />
            </label>
          </div>

          {/* Dimensões, Posição & Divisórias do Card Tabela */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 space-y-3">
            <span className="text-[11px] font-bold text-slate-200">Posição, Dimensões & Fundo da Tabela</span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Largura (%)</span>
                  <span className="font-mono text-[#D4E157]">{cd.dataTable.widthPct}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="98"
                  step="1"
                  value={cd.dataTable.widthPct}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, widthPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Altura (px)</span>
                  <span className="font-mono text-[#D4E157]">{cd.dataTable.heightPx}px</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="450"
                  step="10"
                  value={cd.dataTable.heightPx}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, heightPx: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.dataTable.xOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, xOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-200"
                  max="200"
                  value={cd.dataTable.yOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, yOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor de Fundo</label>
                <input
                  type="color"
                  value={cd.dataTable.bgColor.startsWith('#') ? cd.dataTable.bgColor : '#0C0E12'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, bgColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Opacidade Fundo (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cd.dataTable.bgOpacity ?? 88}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, bgOpacity: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor das Linhas Divisórias</label>
                <input
                  type="color"
                  value={cd.dataTable.dividerColor.startsWith('#') ? cd.dataTable.dividerColor : '#334155'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, dividerColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Arredondamento (px)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={cd.dataTable.borderRadius ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, borderRadius: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Gerenciador de Linhas Individuais da Tabela */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Linhas da Tabela & Tipografia Individual ({cd.dataTable.rows.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  const newRow: CourseDataTableRow = {
                    id: `row-${Date.now()}`,
                    enabled: true,
                    label: 'NOVA MÉTRICA',
                    value: '100',
                    metricKey: 'custom',
                    labelColor: '#94A3B8',
                    valueColor: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '600',
                    letterSpacing: 1.5,
                    fontFamily: 'sans'
                  };
                  updateCd(prev => ({
                    ...prev,
                    dataTable: { ...prev.dataTable, rows: [...prev.dataTable.rows, newRow] }
                  }));
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#D4E157]/20 hover:bg-[#D4E157]/30 text-[#D4E157] text-[11px] font-bold border border-[#D4E157]/40 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Linha</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {cd.dataTable.rows.map((row, idx) => (
                <div key={row.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#D4E157]">
                      Linha {idx + 1}: {row.label || 'Sem Título'}
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, enabled: e.target.checked } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                        />
                        <span>Ativa</span>
                      </label>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const rows = [...cd.dataTable.rows];
                            const temp = rows[idx - 1];
                            rows[idx - 1] = rows[idx];
                            rows[idx] = temp;
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows } }));
                          }}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {idx < cd.dataTable.rows.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const rows = [...cd.dataTable.rows];
                            const temp = rows[idx + 1];
                            rows[idx + 1] = rows[idx];
                            rows[idx] = temp;
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows } }));
                          }}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {cd.dataTable.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = cd.dataTable.rows.filter(r => r.id !== row.id);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="text-red-400 hover:text-red-300 p-0.5"
                          title="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seletor de Tipo de Métrica */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-0.5">Origem dos Dados / Métrica</label>
                      <select
                        value={row.metricKey || 'custom'}
                        onChange={e => {
                          const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, metricKey: e.target.value as any } : r);
                          updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                      >
                        <option value="distance">Distância Total (ex: 42,2 km)</option>
                        <option value="elevation_gain">Ganho de Elevação (ex: 850m)</option>
                        <option value="min_elev">Altitude Mínima (ex: 120m)</option>
                        <option value="max_elev">Altitude Máxima (ex: 940m)</option>
                        <option value="pace">Pace Médio (ex: 4:35 /km)</option>
                        <option value="time">Duração / Tempo Total</option>
                        <option value="heartrate">Frequência Cardíaca Média</option>
                        <option value="custom">Valor Personalizado Manual</option>
                      </select>
                    </div>

                    {row.metricKey === 'custom' && (
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Valor Personalizado</label>
                        <input
                          type="text"
                          value={row.value || ''}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, value: e.target.value } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          placeholder="Ex: 1:42:15"
                          className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Personalização do RÓTULO (Esquerda) */}
                  <div className="p-2.5 rounded bg-slate-800/60 border border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        Texto do Rótulo (Esquerda)
                      </span>
                      <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                        <span>{row.showLabel !== false ? 'Visível' : 'Oculto'}</span>
                        <input
                          type="checkbox"
                          checked={row.showLabel !== false}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, showLabel: e.target.checked } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-3 h-3 accent-[#D4E157] rounded"
                        />
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] text-slate-400 mb-0.5">Texto do Rótulo</label>
                        <input
                          type="text"
                          value={row.label}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, label: e.target.value } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Fonte</label>
                        <select
                          value={row.labelFontFamily || row.fontFamily || 'sans'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelFontFamily: e.target.value as any } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          {POPULAR_FONTS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Cor do Rótulo</label>
                        <input
                          type="color"
                          value={row.labelColor && row.labelColor.startsWith('#') ? row.labelColor : '#94A3B8'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelColor: e.target.value } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-700/40">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Tamanho (px)</label>
                        <input
                          type="number"
                          min="10"
                          max="40"
                          value={row.labelFontSize || row.fontSize || 18}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 18;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelFontSize: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Peso</label>
                        <select
                          value={row.labelFontWeight || row.fontWeight || '600'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelFontWeight: e.target.value } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="300">Light (300)</option>
                          <option value="400">Regular (400)</option>
                          <option value="600">Semi-Bold (600)</option>
                          <option value="700">Bold (700)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                        <input
                          type="number"
                          min="-100"
                          max="100"
                          value={row.labelXOffset ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelXOffset: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                        <input
                          type="number"
                          min="-100"
                          max="100"
                          value={row.labelYOffset ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelYOffset: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-700/40">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Tracking (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={row.labelLetterSpacing ?? (row.letterSpacing ?? 2)}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelLetterSpacing: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Caixa / Formato</label>
                        <select
                          value={row.labelTextTransform || 'uppercase'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelTextTransform: e.target.value as any } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="uppercase">CAIXA ALTA</option>
                          <option value="lowercase">caixa baixa</option>
                          <option value="capitalize">Capitalizado</option>
                          <option value="none">Normal (Como digitado)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Opacidade (%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={row.labelOpacity ?? 100}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelOpacity: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full accent-[#D4E157]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Rotação (°)</label>
                        <input
                          type="number"
                          min="-90"
                          max="90"
                          value={row.labelRotation ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, labelRotation: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Sombra do Rótulo Expandida */}
                    {(() => {
                      const lsObj = typeof row.labelShadow === 'object' ? row.labelShadow : { enabled: !!row.labelShadow, color: row.labelShadowColor || '#000000', blur: row.labelShadowBlur || 8, offsetX: row.labelShadowOffsetX || 0, offsetY: row.labelShadowOffsetY || 2 };
                      return (
                        <div className="p-2 rounded bg-slate-900/60 border border-slate-700/40 space-y-2 mt-1">
                          <label className="flex items-center justify-between text-[10px] text-slate-300 font-bold cursor-pointer">
                            <span className="uppercase tracking-wider">Sombra do Rótulo</span>
                            <input
                              type="checkbox"
                              checked={lsObj.enabled}
                              onChange={e => {
                                const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                  ...r,
                                  labelShadow: { ...lsObj, enabled: e.target.checked }
                                } : r);
                                updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                              }}
                              className="w-3 h-3 accent-[#D4E157] rounded"
                            />
                          </label>

                          {lsObj.enabled && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Cor</label>
                                <input
                                  type="color"
                                  value={lsObj.color?.startsWith('#') ? lsObj.color : '#000000'}
                                  onChange={e => {
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      labelShadow: { ...lsObj, color: e.target.value }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full h-6 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Desfocagem (Blur)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={lsObj.blur ?? 8}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      labelShadow: { ...lsObj, blur: val }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Sombra Desloc. X</label>
                                <input
                                  type="number"
                                  min="-30"
                                  max="30"
                                  value={lsObj.offsetX ?? 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      labelShadow: { ...lsObj, offsetX: val }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Sombra Desloc. Y</label>
                                <input
                                  type="number"
                                  min="-30"
                                  max="30"
                                  value={lsObj.offsetY ?? 2}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      labelShadow: { ...lsObj, offsetY: val }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Personalização do VALOR (Direita) */}
                  <div className="p-2.5 rounded bg-slate-800/60 border border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        Texto do Valor (Direita)
                      </span>
                      <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                        <span>{row.showValue !== false ? 'Visível' : 'Oculto'}</span>
                        <input
                          type="checkbox"
                          checked={row.showValue !== false}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, showValue: e.target.checked } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-3 h-3 accent-[#D4E157] rounded"
                        />
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Fonte</label>
                        <select
                          value={row.valueFontFamily || row.fontFamily || 'sans'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueFontFamily: e.target.value as any } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          {POPULAR_FONTS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Cor do Valor</label>
                        <input
                          type="color"
                          value={row.valueColor && row.valueColor.startsWith('#') ? row.valueColor : '#FFFFFF'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueColor: e.target.value } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Tamanho (px)</label>
                        <input
                          type="number"
                          min="10"
                          max="40"
                          value={row.valueFontSize || row.fontSize || 18}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 18;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueFontSize: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Peso</label>
                        <select
                          value={row.valueFontWeight || row.fontWeight || '700'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueFontWeight: e.target.value } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="400">Regular (400)</option>
                          <option value="600">Semi-Bold (600)</option>
                          <option value="700">Bold (700)</option>
                          <option value="900">Black (900)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-700/40">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Tracking (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={row.valueLetterSpacing ?? (row.letterSpacing ?? 1)}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueLetterSpacing: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Caixa / Formato</label>
                        <select
                          value={row.valueTextTransform || 'none'}
                          onChange={e => {
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueTextTransform: e.target.value as any } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="none">Normal (Como digitado)</option>
                          <option value="uppercase">CAIXA ALTA</option>
                          <option value="lowercase">caixa baixa</option>
                          <option value="capitalize">Capitalizado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                        <input
                          type="number"
                          min="-100"
                          max="100"
                          value={row.valueXOffset ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueXOffset: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                        <input
                          type="number"
                          min="-100"
                          max="100"
                          value={row.valueYOffset ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueYOffset: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-700/40">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Opacidade (%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={row.valueOpacity ?? 100}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueOpacity: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full accent-[#D4E157]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">Rotação (°)</label>
                        <input
                          type="number"
                          min="-90"
                          max="90"
                          value={row.valueRotation ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = cd.dataTable.rows.map(r => r.id === row.id ? { ...r, valueRotation: val } : r);
                            updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Sombra do Valor Expandida */}
                    {(() => {
                      const vsObj = typeof row.valueShadow === 'object' ? row.valueShadow : { enabled: !!row.valueShadow, color: row.valueShadowColor || '#000000', blur: row.valueShadowBlur || 8, offsetX: row.valueShadowOffsetX || 0, offsetY: row.valueShadowOffsetY || 2 };
                      return (
                        <div className="p-2 rounded bg-slate-900/60 border border-slate-700/40 space-y-2 mt-1">
                          <label className="flex items-center justify-between text-[10px] text-slate-300 font-bold cursor-pointer">
                            <span className="uppercase tracking-wider">Sombra do Valor / Número</span>
                            <input
                              type="checkbox"
                              checked={vsObj.enabled}
                              onChange={e => {
                                const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                  ...r,
                                  valueShadow: { ...vsObj, enabled: e.target.checked }
                                } : r);
                                updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                              }}
                              className="w-3 h-3 accent-[#D4E157] rounded"
                            />
                          </label>

                          {vsObj.enabled && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Cor</label>
                                <input
                                  type="color"
                                  value={vsObj.color?.startsWith('#') ? vsObj.color : '#000000'}
                                  onChange={e => {
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      valueShadow: { ...vsObj, color: e.target.value }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full h-6 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Desfocagem (Blur)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={vsObj.blur ?? 8}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      valueShadow: { ...vsObj, blur: val }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Sombra Desloc. X</label>
                                <input
                                  type="number"
                                  min="-30"
                                  max="30"
                                  value={vsObj.offsetX ?? 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      valueShadow: { ...vsObj, offsetX: val }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">Sombra Desloc. Y</label>
                                <input
                                  type="number"
                                  min="-30"
                                  max="30"
                                  value={vsObj.offsetY ?? 2}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    const updated = cd.dataTable.rows.map(r => r.id === row.id ? {
                                      ...r,
                                      valueShadow: { ...vsObj, offsetY: val }
                                    } : r);
                                    updateCd(prev => ({ ...prev, dataTable: { ...prev.dataTable, rows: updated } }));
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. ALTIMETRIA & RELEVO (FOOTER)                                      */}
      {/* ==================================================================== */}
      {activeSubTab === 'elevation' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Card do Rodapé de Altimetria</span>
            </span>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <span>{cd.elevationFooter.enabled ? 'Ativado' : 'Oculto'}</span>
              <input
                type="checkbox"
                checked={cd.elevationFooter.enabled}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  elevationFooter: { ...prev.elevationFooter, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-[#D4E157] rounded"
              />
            </label>
          </div>

          {/* Dimensões, Posição & Escala do Gráfico */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 space-y-3">
            <span className="text-[11px] font-bold text-slate-200">Posição, Dimensões & Escala Vertical</span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Altura do Rodapé</span>
                  <span className="font-mono text-[#D4E157]">{cd.elevationFooter.heightPct}%</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="45"
                  step="1"
                  value={cd.elevationFooter.heightPct}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, heightPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Largura (%)</span>
                  <span className="font-mono text-[#D4E157]">{cd.elevationFooter.widthPct ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  step="1"
                  value={cd.elevationFooter.widthPct ?? 100}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, widthPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Posição Y (%)</span>
                  <span className="font-mono text-[#D4E157]">{cd.elevationFooter.yPct ?? (100 - cd.elevationFooter.heightPct)}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="1"
                  value={cd.elevationFooter.yPct ?? (100 - cd.elevationFooter.heightPct)}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, yPct: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Escala Vertical</span>
                  <span className="font-mono text-[#D4E157]">{cd.elevationFooter.verticalScale}x</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.8"
                  step="0.1"
                  value={cd.elevationFooter.verticalScale}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, verticalScale: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>
            </div>

            {/* Modo de Preenchimento & Cores do Gráfico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Modo do Gráfico</label>
                <select
                  value={cd.elevationFooter.fillMode}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, fillMode: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="gradient">Gradiente Suave</option>
                  <option value="solid">Sólido</option>
                  <option value="lineOnly">Apenas Linha</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor do Contorno</label>
                <input
                  type="color"
                  value={cd.elevationFooter.strokeColor.startsWith('#') ? cd.elevationFooter.strokeColor : '#D4E157'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { 
                      ...prev.elevationFooter, 
                      strokeColor: e.target.value,
                      fillColorTop: e.target.value 
                    }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Espessura Linha (px)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={cd.elevationFooter.strokeWidth}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, strokeWidth: parseInt(e.target.value, 10) || 4 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor Fundo Card</label>
                <input
                  type="color"
                  value={cd.elevationFooter.bgColor?.startsWith('#') ? cd.elevationFooter.bgColor : '#0C0E12'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, bgColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3.1 Título da Altimetria */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4E157] uppercase tracking-wide">
                Texto do Título da Altimetria (Topo Esquerdo)
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>{cd.elevationFooter.showTitle !== false ? 'Visível' : 'Oculto'}</span>
                <input
                  type="checkbox"
                  checked={cd.elevationFooter.showTitle !== false}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, showTitle: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Texto do Título</label>
              <input
                type="text"
                value={cd.elevationFooter.titleText ?? 'ELEVATION PROFILE • ALTIMETRIA'}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  elevationFooter: { ...prev.elevationFooter, titleText: e.target.value }
                }))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4E157]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Fonte</label>
                <select
                  value={cd.elevationFooter.titleFontFamily || 'sans'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, titleFontFamily: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho (px)</label>
                <input
                  type="number"
                  min="10"
                  max="32"
                  value={cd.elevationFooter.titleFontSize ?? 13}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, titleFontSize: parseInt(e.target.value, 10) || 13 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor</label>
                <input
                  type="color"
                  value={cd.elevationFooter.titleColor?.startsWith('#') ? cd.elevationFooter.titleColor : '#94A3B8'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, titleColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tracking (px)</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={cd.elevationFooter.titleLetterSpacing ?? 2}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, titleLetterSpacing: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-150"
                  max="150"
                  value={cd.elevationFooter.titleXOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, titleXOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-150"
                  max="150"
                  value={cd.elevationFooter.titleYOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, titleYOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3.2 Rótulo do Atleta */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4E157] uppercase tracking-wide">
                Texto do Atleta (Topo Direito)
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>{cd.elevationFooter.showAthleteLabel !== false ? 'Visível' : 'Oculto'}</span>
                <input
                  type="checkbox"
                  checked={cd.elevationFooter.showAthleteLabel !== false}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, showAthleteLabel: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Nome / Rótulo</label>
              <input
                type="text"
                value={cd.elevationFooter.athleteLabelText ?? (athleteName ? athleteName.toUpperCase() : 'PACELAB ATHLETE')}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  elevationFooter: { ...prev.elevationFooter, athleteLabelText: e.target.value }
                }))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4E157]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Fonte</label>
                <select
                  value={cd.elevationFooter.athleteFontFamily || 'sans'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, athleteFontFamily: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho (px)</label>
                <input
                  type="number"
                  min="10"
                  max="32"
                  value={cd.elevationFooter.athleteFontSize ?? 13}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, athleteFontSize: parseInt(e.target.value, 10) || 13 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor</label>
                <input
                  type="color"
                  value={cd.elevationFooter.athleteColor?.startsWith('#') ? cd.elevationFooter.athleteColor : '#CBD5E1'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, athleteColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tracking (px)</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={cd.elevationFooter.athleteLetterSpacing ?? 2}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, athleteLetterSpacing: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-150"
                  max="150"
                  value={cd.elevationFooter.athleteXOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, athleteXOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-150"
                  max="150"
                  value={cd.elevationFooter.athleteYOffset ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, athleteYOffset: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3.3 Números de Altimetria Mínima e Máxima (Base do Gráfico) */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4E157] uppercase tracking-wide">
                Números de Altimetria Mínima / Máxima (Base do Gráfico)
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>{cd.elevationFooter.showMinMaxLabels !== false ? 'Visíveis' : 'Ocultos'}</span>
                <input
                  type="checkbox"
                  checked={cd.elevationFooter.showMinMaxLabels !== false}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, showMinMaxLabels: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Rótulo Mínimo Customizado</label>
                <input
                  type="text"
                  placeholder="Ex: MIN: 42M"
                  value={cd.elevationFooter.customMinLabel ?? ''}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, customMinLabel: e.target.value }
                  }))}
                  className="w-full px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Rótulo Máximo Customizado</label>
                <input
                  type="text"
                  placeholder="Ex: MAX: 180M"
                  value={cd.elevationFooter.customMaxLabel ?? ''}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, customMaxLabel: e.target.value }
                  }))}
                  className="w-full px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Fonte</label>
                <select
                  value={cd.elevationFooter.minMaxFontFamily || 'sans'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, minMaxFontFamily: e.target.value as any }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tamanho (px)</label>
                <input
                  type="number"
                  min="8"
                  max="28"
                  value={cd.elevationFooter.minMaxFontSize ?? 12}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, minMaxFontSize: parseInt(e.target.value, 10) || 12 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Peso</label>
                <select
                  value={cd.elevationFooter.minMaxFontWeight || '600'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, minMaxFontWeight: e.target.value }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="400">Regular (400)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Cor</label>
                <input
                  type="color"
                  value={cd.elevationFooter.minMaxColor?.startsWith('#') ? cd.elevationFooter.minMaxColor : '#64748B'}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, minMaxColor: e.target.value }
                  }))}
                  className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. X (px)</label>
                <input
                  type="number"
                  min="-100"
                  max="100"
                  value={cd.elevationFooter.minMaxOffsetX ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, minMaxOffsetX: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Desloc. Y (px)</label>
                <input
                  type="number"
                  min="-100"
                  max="100"
                  value={cd.elevationFooter.minMaxOffsetY ?? 0}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    elevationFooter: { ...prev.elevationFooter, minMaxOffsetY: parseInt(e.target.value, 10) || 0 }
                  }))}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={!!cd.elevationFooter.minMaxShadow}
                    onChange={e => updateCd(prev => ({
                      ...prev,
                      elevationFooter: { ...prev.elevationFooter, minMaxShadow: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                  />
                  <span>Ativar Sombra</span>
                </label>
              </div>
            </div>
          </div>

          {/* 3.3 Marcadores de Pico */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Marcadores de Picos & Topos ({cd.peakMarkers.markers.length})
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                  <span>{cd.peakMarkers.enabled ? 'Ativados' : 'Ocultos'}</span>
                  <input
                    type="checkbox"
                    checked={cd.peakMarkers.enabled}
                    onChange={e => updateCd(prev => ({
                      ...prev,
                      peakMarkers: { ...prev.peakMarkers, enabled: e.target.checked }
                    }))}
                    className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const newMarker: CourseDataPeakMarker = {
                      id: `peak-${Date.now()}`,
                      name: 'PICO ALTO',
                      altitudeMeters: 140,
                      pctPosition: 0.4,
                      triangleColor: '#D4E157',
                      triangleSize: 12,
                      textColor: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '700',
                      letterSpacing: 1,
                      fontFamily: 'sans',
                      showTriangle: true,
                      showLabel: true
                    };
                    updateCd(prev => ({
                      ...prev,
                      peakMarkers: {
                        ...prev.peakMarkers,
                        markers: [...prev.peakMarkers.markers, newMarker]
                      }
                    }));
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#D4E157]/20 text-[#D4E157] text-[11px] font-bold border border-[#D4E157]/40"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo Pico</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {cd.peakMarkers.markers.map(pm => (
                <div key={pm.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={pm.name}
                      onChange={e => {
                        const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, name: e.target.value } : m);
                        updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                      }}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-bold flex-1"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = cd.peakMarkers.markers.filter(m => m.id !== pm.id);
                        updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400">Altitude (m)</label>
                      <input
                        type="number"
                        value={pm.altitudeMeters}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, altitudeMeters: parseInt(e.target.value, 10) || 0 } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Posição na Rota (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={pm.pctPosition}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, pctPosition: parseFloat(e.target.value) } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full accent-[#D4E157]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Fonte</label>
                      <select
                        value={pm.fontFamily || 'sans'}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, fontFamily: e.target.value as any } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {POPULAR_FONTS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Cor do Texto</label>
                      <input
                        type="color"
                        value={pm.textColor?.startsWith('#') ? pm.textColor : '#FFFFFF'}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, textColor: e.target.value } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-700/50">
                    <div>
                      <label className="block text-[9px] text-slate-400">Tamanho Fonte (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="28"
                        value={pm.fontSize || 14}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, fontSize: parseInt(e.target.value, 10) || 14 } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Cor Triângulo</label>
                      <input
                        type="color"
                        value={pm.triangleColor?.startsWith('#') ? pm.triangleColor : '#D4E157'}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, triangleColor: e.target.value } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Desloc. X (px)</label>
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        value={pm.xOffset ?? 0}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, xOffset: parseInt(e.target.value, 10) || 0 } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Desloc. Y (px)</label>
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        value={pm.yOffset ?? 0}
                        onChange={e => {
                          const updated = cd.peakMarkers.markers.map(m => m.id === pm.id ? { ...m, yOffset: parseInt(e.target.value, 10) || 0 } : m);
                          updateCd(prev => ({ ...prev, peakMarkers: { ...prev.peakMarkers, markers: updated } }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. FUNDO & FILTROS (FOTO / MAPA / SÓLIDO + P&B)                      */}
      {/* ==================================================================== */}
      {activeSubTab === 'bg' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Origem do Fundo & Filtros</span>
            </span>
          </div>

          {/* Origem: Foto, Mapa ou Sólido */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'photo', label: 'Foto Pessoal', icon: Camera },
              { id: 'map', label: 'Mapa Cartográfico', icon: MapIcon },
              { id: 'solid', label: 'Cor Sólida', icon: Layers }
            ].map(source => {
              const Icon = source.icon;
              const isSel = cd.backgroundSource === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => updateCd(prev => ({ ...prev, backgroundSource: source.id as any }))}
                  className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                    isSel
                      ? 'border-[#D4E157] bg-[#D4E157]/15 text-white font-bold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#D4E157]" />
                  <span className="text-[11px]">{source.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filtro Preto e Branco (B&W) */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-[#D4E157]" />
                <span>Filtro Monocromático Preto & Branco</span>
              </span>

              <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                <span>{cd.bwFilter ? 'Ligado' : 'Desligado'}</span>
                <input
                  type="checkbox"
                  checked={cd.bwFilter}
                  onChange={e => updateCd(prev => ({ ...prev, bwFilter: e.target.checked }))}
                  className="w-4 h-4 accent-[#D4E157] rounded"
                />
              </label>
            </div>

            {cd.bwFilter && (
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Intensidade do P&B</span>
                  <span className="font-mono text-[#D4E157]">{cd.bwIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cd.bwIntensity}
                  onChange={e => updateCd(prev => ({ ...prev, bwIntensity: parseInt(e.target.value, 10) }))}
                  className="w-full accent-[#D4E157] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Brilho, Contraste e Desfoque */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                <span>Brilho</span>
                <span className="font-mono text-[#D4E157]">{cd.brightness}</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                step="5"
                value={cd.brightness}
                onChange={e => updateCd(prev => ({ ...prev, brightness: parseInt(e.target.value, 10) }))}
                className="w-full accent-[#D4E157]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                <span>Contraste</span>
                <span className="font-mono text-[#D4E157]">{cd.contrast}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="80"
                step="5"
                value={cd.contrast}
                onChange={e => updateCd(prev => ({ ...prev, contrast: parseInt(e.target.value, 10) }))}
                className="w-full accent-[#D4E157]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                <span>Desfoque / Blur</span>
                <span className="font-mono text-[#D4E157]">{cd.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={cd.blur}
                onChange={e => updateCd(prev => ({ ...prev, blur: parseInt(e.target.value, 10) }))}
                className="w-full accent-[#D4E157]"
              />
            </div>
          </div>

          {/* Gradientes Escurecedores Topo & Rodapé */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
            <div>
              <label className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1 cursor-pointer">
                <span>Gradiente no Topo</span>
                <input
                  type="checkbox"
                  checked={cd.topGradient.enabled}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    topGradient: { ...prev.topGradient, enabled: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={cd.topGradient.heightPct}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  topGradient: { ...prev.topGradient, heightPct: parseInt(e.target.value, 10) }
                }))}
                className="w-full accent-[#D4E157]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1 cursor-pointer">
                <span>Gradiente no Rodapé</span>
                <input
                  type="checkbox"
                  checked={cd.bottomGradient.enabled}
                  onChange={e => updateCd(prev => ({
                    ...prev,
                    bottomGradient: { ...prev.bottomGradient, enabled: e.target.checked }
                  }))}
                  className="w-3.5 h-3.5 accent-[#D4E157] rounded"
                />
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={cd.bottomGradient.heightPct}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  bottomGradient: { ...prev.bottomGradient, heightPct: parseInt(e.target.value, 10) }
                }))}
                className="w-full accent-[#D4E157]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MINI-MAPA OPCIONAL                                                */}
      {/* ==================================================================== */}
      {activeSubTab === 'map' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Mini-Mapa Cartográfico da Rota</span>
            </span>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <span>{cd.optionalMap.enabled ? 'Ativado' : 'Oculto'}</span>
              <input
                type="checkbox"
                checked={cd.optionalMap.enabled}
                onChange={e => updateCd(prev => ({
                  ...prev,
                  optionalMap: { ...prev.optionalMap, enabled: e.target.checked }
                }))}
                className="w-4 h-4 accent-[#D4E157] rounded"
              />
            </label>
          </div>

          <p className="text-xs text-slate-400">
            Adicione uma janela flutuante com o traçado GPS da sua rota diretamente no Story.
          </p>

          {cd.optionalMap.enabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span>Posição Y (% da tela)</span>
                    <span className="font-mono text-[#D4E157]">{cd.optionalMap.yPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="65"
                    value={cd.optionalMap.yPct}
                    onChange={e => updateCd(prev => ({
                      ...prev,
                      optionalMap: { ...prev.optionalMap, yPct: parseInt(e.target.value, 10) }
                    }))}
                    className="w-full accent-[#D4E157]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-300">
                    <span>Altura da Janela (px)</span>
                    <span className="font-mono text-[#D4E157]">{cd.optionalMap.heightPx}px</span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="500"
                    step="20"
                    value={cd.optionalMap.heightPx}
                    onChange={e => updateCd(prev => ({
                      ...prev,
                      optionalMap: { ...prev.optionalMap, heightPx: parseInt(e.target.value, 10) }
                    }))}
                    className="w-full accent-[#D4E157]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Estilo do Mapa</label>
                  <select
                    value={cd.optionalMap.mapStyle}
                    onChange={e => updateCd(prev => ({
                      ...prev,
                      optionalMap: { ...prev.optionalMap, mapStyle: e.target.value as any }
                    }))}
                    className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="dark">Dark Cartography</option>
                    <option value="light">Light Minimal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Cor da Rota</label>
                  <input
                    type="color"
                    value={cd.optionalMap.routeColor.startsWith('#') ? cd.optionalMap.routeColor : '#D4E157'}
                    onChange={e => updateCd(prev => ({
                      ...prev,
                      optionalMap: { ...prev.optionalMap, routeColor: e.target.value }
                    }))}
                    className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. ANOTAÇÕES / TEXTOS SOLTOS                                         */}
      {/* ==================================================================== */}
      {activeSubTab === 'floating' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Textos Soltos & Anotações Livres</span>
            </span>

            <button
              type="button"
              onClick={() => {
                const newFt: CourseDataFloatingText = {
                  id: `ft-${Date.now()}`,
                  text: 'NOVO TEXTO',
                  xPct: 50,
                  yPct: 50,
                  fontSize: 20,
                  color: '#FFFFFF',
                  fontWeight: '700',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  fontFamily: 'sans'
                };
                updateCd(prev => ({
                  ...prev,
                  floatingTexts: [...(prev.floatingTexts || []), newFt]
                }));
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#D4E157] hover:bg-[#c2cf45] text-slate-950 font-bold text-xs shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Texto</span>
            </button>
          </div>

          {(!cd.floatingTexts || cd.floatingTexts.length === 0) ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma anotação extra na tela. Clique no botão acima para adicionar textos livres em qualquer posição do Story!
            </p>
          ) : (
            <div className="space-y-2.5">
              {cd.floatingTexts.map(ft => (
                <div key={ft.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/70 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={ft.text}
                      onChange={e => {
                        const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, text: e.target.value } : t);
                        updateCd(prev => ({ ...prev, floatingTexts: updated }));
                      }}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-bold flex-1"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = cd.floatingTexts.filter(t => t.id !== ft.id);
                        updateCd(prev => ({ ...prev, floatingTexts: updated }));
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400">Posição X %</label>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={ft.xPct}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, xPct: parseInt(e.target.value, 10) } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full accent-[#D4E157]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Posição Y %</label>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={ft.yPct}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, yPct: parseInt(e.target.value, 10) } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full accent-[#D4E157]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Fonte</label>
                      <select
                        value={ft.fontFamily || 'sans'}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, fontFamily: e.target.value as any } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-850 border border-slate-700 text-xs text-white"
                      >
                        {POPULAR_FONTS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Cor</label>
                      <input
                        type="color"
                        value={(ft.color || '#FFFFFF').startsWith('#') ? (ft.color || '#FFFFFF') : '#FFFFFF'}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, color: e.target.value } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full h-7 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/50">
                    <div>
                      <label className="block text-[9px] text-slate-400">Tamanho (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="60"
                        value={ft.fontSize}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, fontSize: parseInt(e.target.value, 10) || 20 } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Tracking (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={ft.letterSpacing || 1}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, letterSpacing: parseInt(e.target.value, 10) || 0 } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400">Rotação (°)</label>
                      <input
                        type="number"
                        min="-90"
                        max="90"
                        value={ft.rotation ?? 0}
                        onChange={e => {
                          const updated = cd.floatingTexts.map(t => t.id === ft.id ? { ...t, rotation: parseInt(e.target.value, 10) || 0 } : t);
                          updateCd(prev => ({ ...prev, floatingTexts: updated }));
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. PRESETS & PALETAS PRONTAS                                         */}
      {/* ==================================================================== */}
      {activeSubTab === 'presets' && (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-[#D4E157]" />
              <span>Salvar, Aplicar e Restaurar Presets</span>
            </span>
          </div>

          {/* Paletas de Cor Rápidas com 1 Clique */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Paletas de Cores Rápidas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Lime Minimal', accent: '#D4E157', bg: '#0C0E12', text: '#FFFFFF' },
                { name: 'Neon Cyan', accent: '#06B6D4', bg: '#0A101D', text: '#E2E8F0' },
                { name: 'Strava Sunset', accent: '#FC4C02', bg: '#161114', text: '#FFFBEB' },
                { name: 'Pure White Mono', accent: '#FFFFFF', bg: '#000000', text: '#FFFFFF' }
              ].map(pal => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => applyQuickPalette(pal.accent, pal.bg, pal.text)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-left transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pal.accent }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: pal.bg }} />
                  </div>
                  <div className="text-[11px] font-bold text-white">{pal.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Salvar Novo Preset */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 space-y-2">
            <span className="text-xs font-bold text-slate-200">Salvar Layout Atual como Novo Preset</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={presetNameInput}
                onChange={e => setPresetNameInput(e.target.value)}
                placeholder="Ex: Treino Noturno Altimetria..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4E157]"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D4E157] hover:bg-[#c2cf45] text-slate-950 font-bold text-xs shadow-sm transition-colors"
              >
                <Bookmark className="w-3 h-3" />
                <span>Salvar</span>
              </button>
            </div>
          </div>

          {/* Lista de Presets Salvos */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">Seus Presets Salvos ({savedPresets.length})</span>
            {savedPresets.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Nenhum preset personalizado salvo ainda.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {savedPresets.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700">
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">Salvo em {p.date}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(p.data)}
                        className="px-2.5 py-1 rounded bg-[#D4E157]/20 hover:bg-[#D4E157]/30 text-[#D4E157] text-[11px] font-bold"
                      >
                        Carregar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(idx)}
                        className="p-1 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
