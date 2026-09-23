import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Layout, 
  Map as MapIcon, 
  Activity, 
  TrendingUp, 
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
  Trophy,
  Calendar,
  Check
} from 'lucide-react';
import { UserActivity, StoryConfig, StravaAppConfig, StravaAppMetricCardItem, TypographyConfig } from '../types';
import { getDefaultStravaAppConfig, createDefaultTypography } from '../lib/stravaAppTemplate';
import { TypographyControls } from './TypographyControls';

interface StravaAppAdjustPanelProps {
  config: StoryConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoryConfig>>;
  activity: UserActivity;
  athleteName: string;
}

export const StravaAppAdjustPanel: React.FC<StravaAppAdjustPanelProps> = ({
  config,
  setConfig,
  activity,
  athleteName
}) => {
  const stravaApp = config.stravaApp || getDefaultStravaAppConfig(activity, athleteName);
  const [openSection, setOpenSection] = useState<'presets' | 'background' | 'topCard' | 'mapPanel' | 'metricsRow' | 'elevationChart' | 'theme'>('presets');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to mutate stravaApp state immutably
  const updateStrava = (updater: (prev: StravaAppConfig) => StravaAppConfig) => {
    setConfig(old => {
      const current = old.stravaApp || getDefaultStravaAppConfig(activity, athleteName);
      const next = updater(current);
      return {
        ...old,
        accentColor: next.accentColor,
        stravaApp: next
      };
    });
  };

  // Factory Presets
  const applyPreset = (presetKey: 'classic' | 'dark' | 'clean' | 'sunset' | 'neon') => {
    const base = getDefaultStravaAppConfig(activity, athleteName);

    if (presetKey === 'classic') {
      updateStrava(() => ({
        ...base,
        accentColor: '#FC4C02',
        background: { ...base.background, overlayOpacity: 15, filter: 'none' },
        mapPanel: { ...base.mapPanel, routeColor: '#FC4C02', mapStyle: 'light' },
        elevationChart: { ...base.elevationChart, lineColor: '#FC4C02' }
      }));
    } else if (presetKey === 'dark') {
      updateStrava(() => ({
        ...base,
        accentColor: '#E2E8F0',
        cardBgColor: '#090A0D',
        background: { ...base.background, filter: 'grayscale', overlayOpacity: 45, brightness: -10 },
        topCard: { ...base.topCard, bgColor: '#090A0D', bgOpacity: 90 },
        mapPanel: { ...base.mapPanel, bgColor: '#090A0D', routeColor: '#FFFFFF', mapStyle: 'dark', borderColor: 'rgba(255,255,255,0.08)' },
        metricsRow: { ...base.metricsRow, bgColor: '#090A0D', bgOpacity: 90 },
        elevationChart: { ...base.elevationChart, bgColor: '#090A0D', bgOpacity: 90, lineColor: '#FFFFFF', fillTopColor: 'rgba(255,255,255,0.2)' }
      }));
    } else if (presetKey === 'clean') {
      updateStrava(() => ({
        ...base,
        accentColor: '#FC4C02',
        cardBgColor: '#FFFFFF',
        textPrimaryColor: '#0F172A',
        topCard: { ...base.topCard, bgColor: '#FFFFFF', bgOpacity: 95, textColor: '#0F172A', brand: { ...base.topCard.brand, textColor: '#FC4C02' }, activityType: { ...base.topCard.activityType, textColor: '#0F172A' }, location: { ...base.topCard.location, textColor: '#475569' }, date: { ...base.topCard.date, textColor: '#64748B' }, time: { ...base.topCard.time, textColor: '#64748B' } },
        mapPanel: { ...base.mapPanel, bgColor: '#FFFFFF', mapStyle: 'light', borderColor: 'rgba(0,0,0,0.08)' },
        metricsRow: {
          ...base.metricsRow,
          bgColor: '#FFFFFF',
          bgOpacity: 95,
          cards: base.metricsRow.cards.map(c => ({ ...c, valueColor: '#0F172A', labelColor: '#64748B' }))
        },
        elevationChart: { ...base.elevationChart, bgColor: '#FFFFFF', bgOpacity: 95, yAxisColor: '#64748B', guidelineColor: 'rgba(0,0,0,0.06)' }
      }));
    } else if (presetKey === 'sunset') {
      updateStrava(() => ({
        ...base,
        accentColor: '#F59E0B',
        background: { ...base.background, overlayColor: '#78350F', overlayOpacity: 25, gradientBottomColor: '#1C1917' },
        topCard: { ...base.topCard, brand: { ...base.topCard.brand, iconColor: '#F59E0B', textColor: '#F59E0B' } },
        mapPanel: { ...base.mapPanel, routeColor: '#F59E0B' },
        metricsRow: {
          ...base.metricsRow,
          cards: base.metricsRow.cards.map(c => ({ ...c, iconColor: '#F59E0B', unitColor: '#F59E0B' }))
        },
        elevationChart: { ...base.elevationChart, lineColor: '#F59E0B', fillTopColor: 'rgba(245, 158, 11, 0.4)' }
      }));
    } else if (presetKey === 'neon') {
      updateStrava(() => ({
        ...base,
        accentColor: '#06B6D4',
        topCard: { ...base.topCard, brand: { ...base.topCard.brand, iconColor: '#06B6D4', textColor: '#06B6D4' } },
        mapPanel: { ...base.mapPanel, routeColor: '#06B6D4', mapStyle: 'dark' },
        metricsRow: {
          ...base.metricsRow,
          cards: base.metricsRow.cards.map(c => ({ ...c, iconColor: '#06B6D4', unitColor: '#06B6D4' }))
        },
        elevationChart: { ...base.elevationChart, lineColor: '#06B6D4', fillTopColor: 'rgba(6, 182, 212, 0.35)' }
      }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        updateStrava(prev => ({
          ...prev,
          background: {
            ...prev.background,
            type: 'photo',
            customPhotoUrl: url
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSection = (s: typeof openSection) => {
    setOpenSection(openSection === s ? ('' as any) : s);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Banner & Reset */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Template 2 — Strava App</div>
            <div className="text-xs text-orange-200/80">Layout oficial clássico com edição 100% livre de cada elemento</div>
          </div>
        </div>
        <button
          onClick={() => updateStrava(() => getDefaultStravaAppConfig(activity, athleteName))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
          title="Restaurar valores de fábrica do Template 2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Padrão
        </button>
      </div>

      {/* 1. PRESETS RÁPIDOS */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('presets')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Palette className="w-4 h-4 text-orange-400" />
            Predefinições de Estilo
          </div>
          {openSection === 'presets' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'presets' && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => applyPreset('classic')}
              className="p-3 rounded-lg bg-slate-800/80 hover:bg-orange-500/20 hover:border-orange-500/50 border border-slate-700 text-left transition-all"
            >
              <div className="text-xs font-bold text-orange-400">Strava Authentic</div>
              <div className="text-[11px] text-slate-400">Laranja clássico, cards escuros</div>
            </button>
            <button
              onClick={() => applyPreset('dark')}
              className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition-all"
            >
              <div className="text-xs font-bold text-slate-200">Dark Stealth</div>
              <div className="text-[11px] text-slate-400">P&B contrastado, minimalista</div>
            </button>
            <button
              onClick={() => applyPreset('clean')}
              className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition-all"
            >
              <div className="text-xs font-bold text-white">Clean White</div>
              <div className="text-[11px] text-slate-400">Cards brancos com alto contraste</div>
            </button>
            <button
              onClick={() => applyPreset('sunset')}
              className="p-3 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/50 border border-slate-700 text-left transition-all"
            >
              <div className="text-xs font-bold text-amber-400">Sunset Gold</div>
              <div className="text-[11px] text-slate-400">Tons quentes de fim de tarde</div>
            </button>
            <button
              onClick={() => applyPreset('neon')}
              className="p-3 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-slate-700 text-left transition-all col-span-2"
            >
              <div className="text-xs font-bold text-cyan-400">Vibrant Neon</div>
              <div className="text-[11px] text-slate-400">Ciano elétrico com estética esportiva de alta energia</div>
            </button>
          </div>
        )}
      </div>

      {/* 2. FUNDO & FILTROS FOTOGRÁFICOS */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('background')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ImageIcon className="w-4 h-4 text-orange-400" />
            Fundo, Foto & Filtros (100% 9:16)
          </div>
          {openSection === 'background' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'background' && (
          <div className="space-y-4 pt-1">
            {/* Background Type */}
            <div className="flex gap-2">
              {(['photo', 'map', 'solid'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => updateStrava(p => ({ ...p, background: { ...p.background, type } }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize transition-colors border ${
                    stravaApp.background.type === type 
                      ? 'bg-orange-500 text-white border-orange-500' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {type === 'photo' ? 'Foto' : type === 'map' ? 'Mapa' : 'Cor Sólida'}
                </button>
              ))}
            </div>

            {/* Photo Upload */}
            {stravaApp.background.type === 'photo' && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Carregar Foto Pessoal
                </button>
                {stravaApp.background.customPhotoUrl && (
                  <button
                    onClick={() => updateStrava(p => ({ ...p, background: { ...p.background, customPhotoUrl: null } }))}
                    className="w-full text-center text-xs text-red-400 hover:underline pt-1"
                  >
                    Remover foto personalizada
                  </button>
                )}
              </div>
            )}

            {/* Filters (B&W / Sepia / None) */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">Filtro Artístico</div>
              <div className="flex gap-2">
                {(['none', 'grayscale', 'sepia'] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => updateStrava(p => ({ ...p, background: { ...p.background, filter: flt } }))}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                      stravaApp.background.filter === flt
                        ? 'bg-slate-700 text-white border-orange-500'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    {flt === 'none' ? 'Normal' : flt === 'grayscale' ? 'Preto & Branco' : 'Sépia'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Brilho, Contraste, Saturação, Blur */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Brilho</span>
                  <span>{stravaApp.background.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={stravaApp.background.brightness}
                  onChange={e => updateStrava(p => ({ ...p, background: { ...p.background, brightness: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Contraste</span>
                  <span>{stravaApp.background.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={stravaApp.background.contrast}
                  onChange={e => updateStrava(p => ({ ...p, background: { ...p.background, contrast: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Desfoque / Blur</span>
                  <span>{stravaApp.background.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={stravaApp.background.blur}
                  onChange={e => updateStrava(p => ({ ...p, background: { ...p.background, blur: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Escurecimento Superior (Gradiente Topo)</span>
                  <span>{stravaApp.background.gradientTopOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stravaApp.background.gradientTopOpacity}
                  onChange={e => updateStrava(p => ({ ...p, background: { ...p.background, gradientTopOpacity: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Escurecimento Inferior (Gradiente Base)</span>
                  <span>{stravaApp.background.gradientBottomOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stravaApp.background.gradientBottomOpacity}
                  onChange={e => updateStrava(p => ({ ...p, background: { ...p.background, gradientBottomOpacity: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Zoom do Fundo</span>
                  <span>{stravaApp.background.zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={stravaApp.background.zoom}
                  onChange={e => updateStrava(p => ({ ...p, background: { ...p.background, zoom: parseFloat(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CARD SUPERIOR ESQUERDO (INFORMAÇÕES) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('topCard')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Layout className="w-4 h-4 text-orange-400" />
            Card Superior (Atividade & Local)
          </div>
          {openSection === 'topCard' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'topCard' && (
          <div className="space-y-4 pt-1">
            {/* Toggle Enabled */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Exibir Card Superior</span>
              <button
                onClick={() => updateStrava(p => ({ ...p, topCard: { ...p.topCard, enabled: !p.topCard.enabled } }))}
                className={`p-1.5 rounded-lg border ${stravaApp.topCard.enabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
              >
                {stravaApp.topCard.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Position & Size Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Posição X (%)</span>
                  <span>{stravaApp.topCard.xPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={stravaApp.topCard.xPct}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, xPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Posição Y (%)</span>
                  <span>{stravaApp.topCard.yPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={stravaApp.topCard.yPct}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, yPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Largura (%)</span>
                  <span>{stravaApp.topCard.widthPct}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={stravaApp.topCard.widthPct}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, widthPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Opacidade Fundo</span>
                  <span>{stravaApp.topCard.bgOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stravaApp.topCard.bgOpacity}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, bgOpacity: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Linha 1: Marca & Ícone */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400">1. Marca (Topo do Card)</span>
                <input
                  type="checkbox"
                  checked={stravaApp.topCard.brand.enabled}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, brand: { ...p.topCard.brand, enabled: e.target.checked } } }))}
                  className="accent-orange-500 cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={stravaApp.topCard.brand.text}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, brand: { ...p.topCard.brand, text: e.target.value } } }))}
                  placeholder="Nome da Marca (ex: STRAVA)"
                  className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
                />
                <select
                  value={stravaApp.topCard.brand.iconType}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, brand: { ...p.topCard.brand, iconType: e.target.value as any } } }))}
                  className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
                >
                  <option value="strava">Ícone Strava</option>
                  <option value="bolt">Raio / Potência</option>
                  <option value="flame">Chama / Fogo</option>
                  <option value="trophy">Troféu</option>
                </select>
              </div>

              {/* Typography Controls for Brand */}
              <TypographyControls
                label="Tipografia da Marca"
                value={stravaApp.topCard.brand.typography}
                onChange={t => updateStrava(p => ({
                  ...p,
                  topCard: {
                    ...p.topCard,
                    brand: {
                      ...p.topCard.brand,
                      typography: t,
                      fontSize: t.fontSize,
                      textColor: t.color
                    }
                  }
                }))}
                previewSample={stravaApp.topCard.brand.text || 'STRAVA'}
                defaultOverrides={{ fontSize: 18, fontWeight: '900', color: '#FC4C02', letterSpacing: 3 }}
              />
            </div>

            {/* Linha 2: Tipo de Atividade */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">2. Tipo de Atividade</span>
                <input
                  type="checkbox"
                  checked={stravaApp.topCard.activityType.enabled}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, activityType: { ...p.topCard.activityType, enabled: e.target.checked } } }))}
                  className="accent-orange-500 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={stravaApp.topCard.activityType.text}
                onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, activityType: { ...p.topCard.activityType, text: e.target.value } } }))}
                placeholder="Ex: Corrida, Caminhada..."
                className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
              />

              {/* Typography Controls for Activity Type */}
              <TypographyControls
                label="Tipografia do Tipo de Atividade"
                value={stravaApp.topCard.activityType.typography}
                onChange={t => updateStrava(p => ({
                  ...p,
                  topCard: {
                    ...p.topCard,
                    activityType: {
                      ...p.topCard.activityType,
                      typography: t,
                      fontSize: t.fontSize,
                      textColor: t.color
                    }
                  }
                }))}
                previewSample={stravaApp.topCard.activityType.text || 'Corrida da Manhã'}
                defaultOverrides={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}
              />
            </div>

            {/* Linha 3: Localização */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">3. Localização</span>
                <input
                  type="checkbox"
                  checked={stravaApp.topCard.location.enabled}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, location: { ...p.topCard.location, enabled: e.target.checked } } }))}
                  className="accent-orange-500 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={stravaApp.topCard.location.text}
                onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, location: { ...p.topCard.location, text: e.target.value } } }))}
                placeholder="Ex: São Paulo, Brasil"
                className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
              />

              {/* Typography Controls for Location */}
              <TypographyControls
                label="Tipografia da Localização"
                value={stravaApp.topCard.location.typography}
                onChange={t => updateStrava(p => ({
                  ...p,
                  topCard: {
                    ...p.topCard,
                    location: {
                      ...p.topCard.location,
                      typography: t,
                      fontSize: t.fontSize,
                      textColor: t.color
                    }
                  }
                }))}
                previewSample={stravaApp.topCard.location.text || 'São Paulo, Brasil'}
                defaultOverrides={{ fontSize: 16, fontWeight: '400', color: '#CBD5E1' }}
              />
            </div>

            {/* Linha 4: Data & Hora */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">4. Data e Hora</span>
                <div className="flex gap-2">
                  <label className="text-[11px] text-slate-400 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={stravaApp.topCard.date.enabled}
                      onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, date: { ...p.topCard.date, enabled: e.target.checked } } }))}
                      className="accent-orange-500"
                    />
                    Data
                  </label>
                  <label className="text-[11px] text-slate-400 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={stravaApp.topCard.time.enabled}
                      onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, time: { ...p.topCard.time, enabled: e.target.checked } } }))}
                      className="accent-orange-500"
                    />
                    Hora
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={stravaApp.topCard.date.text}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, date: { ...p.topCard.date, text: e.target.value } } }))}
                  placeholder="Data"
                  className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
                />
                <input
                  type="text"
                  value={stravaApp.topCard.time.text}
                  onChange={e => updateStrava(p => ({ ...p, topCard: { ...p.topCard, time: { ...p.topCard.time, text: e.target.value } } }))}
                  placeholder="Hora (ex: 07:15)"
                  className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
                />
              </div>

              {/* Typography Controls for Date */}
              {stravaApp.topCard.date.enabled && (
                <TypographyControls
                  label="Tipografia da Data"
                  value={stravaApp.topCard.date.typography}
                  onChange={t => updateStrava(p => ({
                    ...p,
                    topCard: {
                      ...p.topCard,
                      date: {
                        ...p.topCard.date,
                        typography: t,
                        fontSize: t.fontSize,
                        textColor: t.color
                      }
                    }
                  }))}
                  previewSample={stravaApp.topCard.date.text || 'Hoje'}
                  defaultOverrides={{ fontSize: 15, fontWeight: '400', color: '#94A3B8' }}
                />
              )}

              {/* Typography Controls for Time */}
              {stravaApp.topCard.time.enabled && (
                <TypographyControls
                  label="Tipografia da Hora"
                  value={stravaApp.topCard.time.typography}
                  onChange={t => updateStrava(p => ({
                    ...p,
                    topCard: {
                      ...p.topCard,
                      time: {
                        ...p.topCard.time,
                        typography: t,
                        fontSize: t.fontSize,
                        textColor: t.color
                      }
                    }
                  }))}
                  previewSample={stravaApp.topCard.time.text || '07:15'}
                  defaultOverrides={{ fontSize: 15, fontWeight: '400', color: '#94A3B8' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. PAINEL DE MAPA VERTICAL (À DIREITA) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('mapPanel')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <MapIcon className="w-4 h-4 text-orange-400" />
            Painel de Mapa Vertical (~40% altura)
          </div>
          {openSection === 'mapPanel' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'mapPanel' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Exibir Painel de Mapa</span>
              <button
                onClick={() => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, enabled: !p.mapPanel.enabled } }))}
                className={`p-1.5 rounded-lg border ${stravaApp.mapPanel.enabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
              >
                {stravaApp.mapPanel.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Position & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Posição X (%)</span>
                  <span>{stravaApp.mapPanel.xPct}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="70"
                  value={stravaApp.mapPanel.xPct}
                  onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, xPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Posição Y (%)</span>
                  <span>{stravaApp.mapPanel.yPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={stravaApp.mapPanel.yPct}
                  onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, yPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Largura (%)</span>
                  <span>{stravaApp.mapPanel.widthPct}%</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="60"
                  value={stravaApp.mapPanel.widthPct}
                  onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, widthPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Altura (%)</span>
                  <span>{stravaApp.mapPanel.heightPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="55"
                  value={stravaApp.mapPanel.heightPct}
                  onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, heightPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Estilo e Cor da Rota */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Estilo do Mapa</span>
                <select
                  value={stravaApp.mapPanel.mapStyle}
                  onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, mapStyle: e.target.value as any } }))}
                  className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs text-white border border-slate-700"
                >
                  <option value="light">Claro (Strava Soft)</option>
                  <option value="dark">Escuro</option>
                  <option value="minimal">Minimalista</option>
                </select>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Cor da Rota</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stravaApp.mapPanel.routeColor}
                    onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, routeColor: e.target.value } }))}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{stravaApp.mapPanel.routeColor}</span>
                </div>
              </div>
            </div>

            {/* Espessura da Rota & Marcadores Início/Fim */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Espessura da Linha</span>
                  <span>{stravaApp.mapPanel.routeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="16"
                  value={stravaApp.mapPanel.routeWidth}
                  onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, routeWidth: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stravaApp.mapPanel.showStartPin}
                    onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, showStartPin: e.target.checked } }))}
                    className="accent-emerald-500"
                  />
                  Marcador de Início (Verde)
                </label>
                <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stravaApp.mapPanel.showFinishPin}
                    onChange={e => updateStrava(p => ({ ...p, mapPanel: { ...p.mapPanel, showFinishPin: e.target.checked } }))}
                    className="accent-red-500"
                  />
                  Marcador de Fim (Vermelho)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. CARDS DE MÉTRICAS (FAIXA INFERIOR) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('metricsRow')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Activity className="w-4 h-4 text-orange-400" />
            Cards de Métricas e Números (Faixa Inferior)
          </div>
          {openSection === 'metricsRow' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'metricsRow' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Exibir Faixa de Métricas</span>
              <button
                onClick={() => updateStrava(p => ({ ...p, metricsRow: { ...p.metricsRow, enabled: !p.metricsRow.enabled } }))}
                className={`p-1.5 rounded-lg border ${stravaApp.metricsRow.enabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
              >
                {stravaApp.metricsRow.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Position Y, Height, Gap & Container Border */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Posição Vertical Y (%)</span>
                  <span>{stravaApp.metricsRow.yPct}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="85"
                  value={stravaApp.metricsRow.yPct}
                  onChange={e => updateStrava(p => ({ ...p, metricsRow: { ...p.metricsRow, yPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Altura dos Cards</span>
                  <span>{stravaApp.metricsRow.cardHeight}px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="220"
                  value={stravaApp.metricsRow.cardHeight}
                  onChange={e => updateStrava(p => ({ ...p, metricsRow: { ...p.metricsRow, cardHeight: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Espaçamento entre Cards (Gap)</span>
                  <span>{stravaApp.metricsRow.gap || 16}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="36"
                  value={stravaApp.metricsRow.gap || 16}
                  onChange={e => updateStrava(p => ({ ...p, metricsRow: { ...p.metricsRow, gap: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Borda do Container</span>
                  <span>{stravaApp.metricsRow.borderWidth || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={stravaApp.metricsRow.borderWidth || 0}
                  onChange={e => updateStrava(p => ({ ...p, metricsRow: { ...p.metricsRow, borderWidth: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Action Bar: Add New Metric Card */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300">Cards de Métricas ({stravaApp.metricsRow.cards.length})</span>
              <button
                type="button"
                onClick={() => updateStrava(p => ({
                  ...p,
                  metricsRow: {
                    ...p.metricsRow,
                    cards: [
                      ...p.metricsRow.cards,
                      {
                        id: `card_${Date.now()}`,
                        enabled: true,
                        iconEnabled: true,
                        iconType: 'flame',
                        iconColor: '#FC4C02',
                        iconSize: 22,
                        label: 'CALORIAS',
                        labelEnabled: true,
                        labelColor: '#94A3B8',
                        labelFontSize: 13,
                        labelFontWeight: 'bold',
                        labelTransform: 'uppercase',
                        value: '480',
                        valueEnabled: true,
                        valueColor: '#FFFFFF',
                        valueFontSize: 34,
                        valueFontWeight: 'black',
                        unit: 'kcal',
                        unitEnabled: true,
                        unitColor: '#FC4C02',
                        unitFontSize: 15,
                        textAlign: 'left',
                        autoField: 'calories'
                      }
                    ]
                  }
                }))}
                className="py-1.5 px-3 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Card de Métrica
              </button>
            </div>

            {/* Individual Cards Editor */}
            <div className="space-y-3">
              {stravaApp.metricsRow.cards.map((card, idx) => (
                <div key={card.id || idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-400">Card {idx + 1}: {card.label || 'Métrica'}</span>
                      <select
                        value={card.autoField || 'custom'}
                        onChange={e => {
                          const field = e.target.value as any;
                          updateStrava(p => {
                            const updated = [...p.metricsRow.cards];
                            let autoVal = card.value;
                            let autoUnit = card.unit;
                            let autoLbl = card.label;

                            if (field === 'duration') { autoLbl = 'DURAÇÃO'; autoVal = activity.durationFormatted || '45:20'; autoUnit = 'min'; }
                            else if (field === 'distance') { autoLbl = 'DISTÂNCIA'; autoVal = (activity.distanceKm || 10).toFixed(2); autoUnit = 'km'; }
                            else if (field === 'elevation') { autoLbl = 'ELEVAÇÃO'; autoVal = `+${activity.elevationGainMeters || 145}`; autoUnit = 'm'; }
                            else if (field === 'pace') { autoLbl = 'PACE MÉDIO'; autoVal = activity.paceFormatted || '4:32'; autoUnit = 'min/km'; }
                            else if (field === 'hr') { autoLbl = 'FREQ. CARDÍACA'; autoVal = `${activity.avgHr || 155}`; autoUnit = 'bpm'; }
                            else if (field === 'calories') { autoLbl = 'CALORIAS'; autoVal = `${activity.calories || 520}`; autoUnit = 'kcal'; }

                            updated[idx] = {
                              ...updated[idx],
                              autoField: field,
                              label: autoLbl,
                              value: autoVal,
                              unit: autoUnit
                            };
                            return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                          });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-300"
                      >
                        <option value="duration">⏱️ Duração</option>
                        <option value="distance">📍 Distância</option>
                        <option value="elevation">⛰️ Elevação</option>
                        <option value="pace">⚡ Pace</option>
                        <option value="hr">❤️ Freq. Cardíaca</option>
                        <option value="calories">🔥 Calorias</option>
                        <option value="custom">✏️ Personalizado</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-slate-400 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={card.enabled}
                          onChange={e => {
                            const checked = e.target.checked;
                            updateStrava(p => {
                              const updated = [...p.metricsRow.cards];
                              updated[idx] = { ...updated[idx], enabled: checked };
                              return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                            });
                          }}
                          className="accent-orange-500 cursor-pointer"
                        />
                        Ativo
                      </label>
                      {stravaApp.metricsRow.cards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => updateStrava(p => {
                            const updated = p.metricsRow.cards.filter((_, i) => i !== idx);
                            return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                          })}
                          className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Excluir Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Text Inputs for Label, Value, Unit */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">Rótulo / Texto</span>
                      <input
                        type="text"
                        value={card.label}
                        onChange={e => {
                          const v = e.target.value;
                          updateStrava(p => {
                            const updated = [...p.metricsRow.cards];
                            updated[idx] = { ...updated[idx], label: v };
                            return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                          });
                        }}
                        className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-white border border-slate-700"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">Valor / Número</span>
                      <input
                        type="text"
                        value={card.value}
                        onChange={e => {
                          const v = e.target.value;
                          updateStrava(p => {
                            const updated = [...p.metricsRow.cards];
                            updated[idx] = { ...updated[idx], value: v };
                            return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                          });
                        }}
                        className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-white border border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">Unidade</span>
                      <input
                        type="text"
                        value={card.unit || ''}
                        onChange={e => {
                          const v = e.target.value;
                          updateStrava(p => {
                            const updated = [...p.metricsRow.cards];
                            updated[idx] = { ...updated[idx], unit: v, unitEnabled: !!v };
                            return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                          });
                        }}
                        placeholder="ex: km"
                        className="w-full bg-slate-900 px-2 py-1 rounded text-xs text-white border border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Offsets & Distance Controls for Card Elements */}
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 block">Posicionamento Fino, Offsets & Distâncias</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-400 mb-0.5">
                          <span>Deslocamento Card X</span>
                          <span className="text-orange-400 font-mono">{card.offsetX || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={card.offsetX || 0}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            updateStrava(p => {
                              const updated = [...p.metricsRow.cards];
                              updated[idx] = { ...updated[idx], offsetX: val };
                              return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                            });
                          }}
                          className="w-full accent-orange-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-400 mb-0.5">
                          <span>Deslocamento Card Y</span>
                          <span className="text-orange-400 font-mono">{card.offsetY || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={card.offsetY || 0}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            updateStrava(p => {
                              const updated = [...p.metricsRow.cards];
                              updated[idx] = { ...updated[idx], offsetY: val };
                              return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                            });
                          }}
                          className="w-full accent-orange-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-400 mb-0.5">
                          <span>Deslocamento Número / Valor Y</span>
                          <span className="text-orange-400 font-mono">{card.valueOffsetY || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={card.valueOffsetY || 0}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            updateStrava(p => {
                              const updated = [...p.metricsRow.cards];
                              updated[idx] = { ...updated[idx], valueOffsetY: val };
                              return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                            });
                          }}
                          className="w-full accent-orange-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-400 mb-0.5">
                          <span>Distância Unidade x Valor</span>
                          <span className="text-orange-400 font-mono">{card.unitGap ?? 4}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          value={card.unitGap ?? 4}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            updateStrava(p => {
                              const updated = [...p.metricsRow.cards];
                              updated[idx] = { ...updated[idx], unitGap: val };
                              return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                            });
                          }}
                          className="w-full accent-orange-500"
                        />
                      </div>
                    </div>

                    {/* Icon Selection & Settings */}
                    <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Ícone do Card</span>
                        <select
                          value={card.iconType || 'stopwatch'}
                          onChange={e => {
                            const val = e.target.value;
                            updateStrava(p => {
                              const updated = [...p.metricsRow.cards];
                              updated[idx] = { ...updated[idx], iconType: val as any };
                              return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="stopwatch">⏱️ Cronômetro</option>
                          <option value="pin">📍 Local / Pin</option>
                          <option value="mountain">⛰️ Montanha / Elevação</option>
                          <option value="heart">❤️ Coração / HR</option>
                          <option value="flame">🔥 Fogo / Calorias</option>
                          <option value="gauge">⚡ Velocímetro / Pace</option>
                          <option value="trophy">🏆 Troféu</option>
                          <option value="zap">⚡ Raio</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Cor do Ícone</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={card.iconColor || '#FC4C02'}
                            onChange={e => {
                              const val = e.target.value;
                              updateStrava(p => {
                                const updated = [...p.metricsRow.cards];
                                updated[idx] = { ...updated[idx], iconColor: val };
                                return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                              });
                            }}
                            className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-slate-300">{card.iconColor || '#FC4C02'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography Controls for Metric Card */}
                  <div className="space-y-2 pt-1 border-t border-slate-700/50">
                    <TypographyControls
                      label={`Tipografia do Rótulo (${card.label})`}
                      value={card.labelTypography}
                      onChange={t => updateStrava(p => {
                        const updated = [...p.metricsRow.cards];
                        updated[idx] = {
                          ...updated[idx],
                          labelTypography: t,
                          labelFontSize: t.fontSize,
                          labelColor: t.color
                        };
                        return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                      })}
                      previewSample={card.label}
                      defaultOverrides={{ fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}
                    />

                    <TypographyControls
                      label={`Tipografia do Número / Valor (${card.value})`}
                      value={card.valueTypography}
                      onChange={t => updateStrava(p => {
                        const updated = [...p.metricsRow.cards];
                        updated[idx] = {
                          ...updated[idx],
                          valueTypography: t,
                          valueFontSize: t.fontSize,
                          valueColor: t.color
                        };
                        return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                      })}
                      previewSample={card.value}
                      defaultOverrides={{ fontSize: 34, fontWeight: '900', color: '#FFFFFF' }}
                    />

                    {card.unit && (
                      <TypographyControls
                        label={`Tipografia da Unidade (${card.unit})`}
                        value={card.unitTypography}
                        onChange={t => updateStrava(p => {
                          const updated = [...p.metricsRow.cards];
                          updated[idx] = {
                            ...updated[idx],
                            unitTypography: t,
                            unitFontSize: t.fontSize,
                            unitColor: t.color
                          };
                          return { ...p, metricsRow: { ...p.metricsRow, cards: updated } };
                        })}
                        previewSample={card.unit}
                        defaultOverrides={{ fontSize: 15, fontWeight: '700', color: '#FC4C02' }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. GRÁFICO DE ELEVAÇÃO (ALTIMETRIA) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('elevationChart')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Mountain className="w-4 h-4 text-orange-400" />
            Gráfico de Elevação & Eixo Y
          </div>
          {openSection === 'elevationChart' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'elevationChart' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Exibir Gráfico de Elevação</span>
              <button
                onClick={() => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, enabled: !p.elevationChart.enabled } }))}
                className={`p-1.5 rounded-lg border ${stravaApp.elevationChart.enabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
              >
                {stravaApp.elevationChart.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Position Y & Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Posição Y (%)</span>
                  <span>{stravaApp.elevationChart.yPct}%</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="85"
                  value={stravaApp.elevationChart.yPct}
                  onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, yPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Altura do Gráfico (%)</span>
                  <span>{stravaApp.elevationChart.heightPct}%</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="22"
                  value={stravaApp.elevationChart.heightPct}
                  onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, heightPct: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Cor da Linha e Preenchimento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Cor da Linha</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stravaApp.elevationChart.lineColor}
                    onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, lineColor: e.target.value } }))}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{stravaApp.elevationChart.lineColor}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Espessura da Linha</span>
                  <span>{stravaApp.elevationChart.lineWidth}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={stravaApp.elevationChart.lineWidth}
                  onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, lineWidth: parseInt(e.target.value) } }))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Toggles: Preenchimento gradiente, Linhas guias, Eixo Y */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Preenchimento Gradiente Suave</span>
                <input
                  type="checkbox"
                  checked={stravaApp.elevationChart.fillEnabled}
                  onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, fillEnabled: e.target.checked } }))}
                  className="accent-orange-500"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Linhas Guias Horizontais Pontilhadas</span>
                <input
                  type="checkbox"
                  checked={stravaApp.elevationChart.guidelinesEnabled}
                  onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, guidelinesEnabled: e.target.checked } }))}
                  className="accent-orange-500"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Exibir Eixo Y com Metragem de Altitude</span>
                <input
                  type="checkbox"
                  checked={stravaApp.elevationChart.yAxisEnabled}
                  onChange={e => updateStrava(p => ({ ...p, elevationChart: { ...p.elevationChart, yAxisEnabled: e.target.checked } }))}
                  className="accent-orange-500"
                />
              </label>

              {stravaApp.elevationChart.yAxisEnabled && (
                <div className="pt-2">
                  <TypographyControls
                    label="Tipografia do Eixo Y (Altitude)"
                    value={stravaApp.elevationChart.yAxisTypography}
                    onChange={t => updateStrava(p => ({
                      ...p,
                      elevationChart: {
                        ...p.elevationChart,
                        yAxisTypography: t,
                        yAxisFontSize: t.fontSize,
                        yAxisColor: t.color
                      }
                    }))}
                    previewSample="150m"
                    defaultOverrides={{ fontSize: 13, fontWeight: '400', color: '#94A3B8' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. CORES GLOBAIS & TIPOGRAFIA */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('theme')}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Type className="w-4 h-4 text-orange-400" />
            Tipografia Global & Destaque
          </div>
          {openSection === 'theme' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {openSection === 'theme' && (
          <div className="space-y-4 pt-1">
            {/* Fonte Global */}
            <div>
              <span className="text-xs text-slate-400 block mb-1">Família Tipográfica Principal</span>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { id: 'sans', label: 'Moderna (Sans)' },
                  { id: 'display', label: 'Impacto (Display)' },
                  { id: 'mono', label: 'Técnica (Mono)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => updateStrava(p => {
                      const font = f.id === 'display' ? 'Oswald' : f.id === 'mono' ? 'JetBrains Mono' : 'Plus Jakarta Sans';
                      const base = p.globalTypography || {
                        fontFamily: 'Plus Jakarta Sans',
                        fontWeight: '600' as const,
                        baseScale: 1.0,
                        letterSpacing: 0,
                        color: '#FFFFFF'
                      };
                      return {
                        ...p,
                        globalFont: f.id as any,
                        globalTypography: {
                          ...base,
                          fontFamily: font,
                          primaryFont: font
                        }
                      };
                    })}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border ${
                      stravaApp.globalFont === f.id
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Advanced Global Typography Controls */}
              <div className="space-y-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Fonte Específica do Layout</label>
                  <select
                    value={stravaApp.globalTypography?.primaryFont || (stravaApp.globalFont === 'display' ? 'Oswald' : stravaApp.globalFont === 'mono' ? 'JetBrains Mono' : 'Plus Jakarta Sans')}
                    onChange={e => {
                      const newFont = e.target.value;
                      updateStrava(p => {
                        const base = p.globalTypography || {
                          fontFamily: 'Plus Jakarta Sans',
                          fontWeight: '600' as const,
                          baseScale: 1.0,
                          letterSpacing: 0,
                          color: '#FFFFFF'
                        };
                        return {
                          ...p,
                          globalTypography: {
                            ...base,
                            fontFamily: newFont,
                            primaryFont: newFont
                          }
                        };
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Inter">Inter</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Oswald">Oswald (Impacto)</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Bebas Neue">Bebas Neue</option>
                    <option value="JetBrains Mono">JetBrains Mono (Técnica)</option>
                    <option value="Roboto Condensed">Roboto Condensed</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Escala Global de Tamanho</span>
                    <span className="text-orange-400 font-mono">{(stravaApp.globalTypography?.scaleMultiplier || stravaApp.globalTypography?.baseScale || 1.0).toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="15"
                    value={Math.round((stravaApp.globalTypography?.scaleMultiplier || stravaApp.globalTypography?.baseScale || 1.0) * 10)}
                    onChange={e => {
                      const val = (parseInt(e.target.value) || 10) / 10;
                      updateStrava(p => {
                        const base = p.globalTypography || {
                          fontFamily: 'Plus Jakarta Sans',
                          fontWeight: '600' as const,
                          baseScale: 1.0,
                          letterSpacing: 0,
                          color: '#FFFFFF'
                        };
                        return {
                          ...p,
                          globalTypography: {
                            ...base,
                            baseScale: val,
                            scaleMultiplier: val
                          }
                        };
                      });
                    }}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => {
                      const selFont = stravaApp.globalTypography?.primaryFont || 'Plus Jakarta Sans';
                      updateStrava(p => ({
                        ...p,
                        topCard: {
                          ...p.topCard,
                          brand: { ...p.topCard.brand, typography: { ...(p.topCard.brand.typography || createDefaultTypography()), fontFamily: selFont } },
                          activityType: { ...p.topCard.activityType, typography: { ...(p.topCard.activityType.typography || createDefaultTypography()), fontFamily: selFont } },
                          location: { ...p.topCard.location, typography: { ...(p.topCard.location.typography || createDefaultTypography()), fontFamily: selFont } },
                          date: { ...p.topCard.date, typography: { ...(p.topCard.date.typography || createDefaultTypography()), fontFamily: selFont } },
                          time: { ...p.topCard.time, typography: { ...(p.topCard.time.typography || createDefaultTypography()), fontFamily: selFont } }
                        },
                        metricsRow: {
                          ...p.metricsRow,
                          cards: p.metricsRow.cards.map(c => ({
                            ...c,
                            labelTypography: { ...(c.labelTypography || createDefaultTypography()), fontFamily: selFont },
                            valueTypography: { ...(c.valueTypography || createDefaultTypography()), fontFamily: selFont },
                            unitTypography: { ...(c.unitTypography || createDefaultTypography()), fontFamily: selFont }
                          }))
                        },
                        elevationChart: {
                          ...p.elevationChart,
                          yAxisTypography: { ...(p.elevationChart.yAxisTypography || createDefaultTypography()), fontFamily: selFont }
                        }
                      }));
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Aplicar Fonte Selecionada a Todos os Elementos
                  </button>
                </div>
              </div>
            </div>

            {/* Cor de Destaque Global */}
            <div>
              <span className="text-xs text-slate-400 block mb-1">Cor de Destaque Principal (Strava Orange)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stravaApp.accentColor}
                  onChange={e => updateStrava(p => ({ ...p, accentColor: e.target.value }))}
                  className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300">{stravaApp.accentColor}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
