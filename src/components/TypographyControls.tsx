import React, { useState } from 'react';
import { 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Layers,
  Square,
  Palette
} from 'lucide-react';
import { TypographyConfig } from '../types';
import { createDefaultTypography } from '../lib/stravaAppTemplate';

interface TypographyControlsProps {
  label: string;
  value?: TypographyConfig;
  onChange: (value: TypographyConfig) => void;
  previewSample?: string;
  defaultOverrides?: Partial<TypographyConfig>;
}

const POPULAR_FONTS = [
  { label: 'Padrão (Herdar)', value: 'inherit' },
  { label: 'Inter (Sans Limpo)', value: 'Inter' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
  { label: 'Space Grotesk (Moderno)', value: 'Space Grotesk' },
  { label: 'Oswald (Condensado/Impacto)', value: 'Oswald' },
  { label: 'Montserrat (Geométrico)', value: 'Montserrat' },
  { label: 'Bebas Neue (Display Caixa Alta)', value: 'Bebas Neue' },
  { label: 'JetBrains Mono (Mono Tech)', value: 'JetBrains Mono' },
  { label: 'Roboto Condensed', value: 'Roboto Condensed' },
  { label: 'Playfair Display (Serifado)', value: 'Playfair Display' }
];

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  label,
  value,
  onChange,
  previewSample = 'Aa 123',
  defaultOverrides
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'spacing' | 'effects' | 'box'>('basics');

  const typo: TypographyConfig = value || createDefaultTypography(defaultOverrides);

  const update = (patch: Partial<TypographyConfig>) => {
    onChange({
      ...typo,
      ...patch
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(createDefaultTypography(defaultOverrides));
  };

  return (
    <div className="border border-slate-800/80 bg-slate-900/60 rounded-xl overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Type className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="truncate">
            <span className="text-xs font-semibold text-slate-200 block truncate">{label}</span>
            <span className="text-[10px] text-slate-400 block truncate">
              {typo.fontFamily === 'inherit' ? 'Fonte Global' : typo.fontFamily} • {typo.fontSize}px • {typo.fontWeight}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Quick Color Pill */}
          <div 
            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: typo.color || '#FFFFFF' }}
            title={`Cor: ${typo.color}`}
          />
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="p-3.5 pt-2 border-t border-slate-800 space-y-4">
          {/* Live Preview Strip */}
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Prévia</div>
            <div 
              className="text-right truncate max-w-[200px]"
              style={{
                fontFamily: typo.fontFamily === 'inherit' ? 'inherit' : typo.fontFamily,
                fontWeight: typo.fontWeight as any,
                fontStyle: typo.fontStyle,
                textDecoration: typo.underline ? 'underline' : typo.strikethrough ? 'line-through' : 'none',
                color: typo.color,
                letterSpacing: `${typo.letterSpacing}px`,
                textTransform: typo.textTransform as any,
                textShadow: typo.shadowEnabled ? `0px 2px ${typo.shadowBlur}px ${typo.shadowColor}` : 'none'
              }}
            >
              {previewSample}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-slate-500 hover:text-orange-400 flex items-center gap-1 transition-colors ml-2"
              title="Restaurar padrão deste texto"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={`py-1 rounded font-medium transition-colors ${
                activeTab === 'basics' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fonte
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spacing')}
              className={`py-1 rounded font-medium transition-colors ${
                activeTab === 'spacing' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Posição
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('effects')}
              className={`py-1 rounded font-medium transition-colors ${
                activeTab === 'effects' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Efeitos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('box')}
              className={`py-1 rounded font-medium transition-colors ${
                activeTab === 'box' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fundo
            </button>
          </div>

          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-3">
              {/* Font Family */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">Família da Fonte</label>
                <select
                  value={typo.fontFamily || 'inherit'}
                  onChange={e => update({ fontFamily: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  {POPULAR_FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Tamanho</span>
                    <span className="text-orange-400 font-mono">{typo.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="96"
                    value={typo.fontSize}
                    onChange={e => update({ fontSize: parseInt(e.target.value) || 16 })}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Peso / Espessura</label>
                  <select
                    value={typo.fontWeight || '400'}
                    onChange={e => update({ fontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="100">100 - Fino</option>
                    <option value="300">300 - Leve</option>
                    <option value="400">400 - Regular</option>
                    <option value="500">500 - Médio</option>
                    <option value="600">600 - Semi Bold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - Extra Bold</option>
                    <option value="900">900 - Black</option>
                  </select>
                </div>
              </div>

              {/* Color & Opacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Cor do Texto</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={typo.color || '#FFFFFF'}
                      onChange={e => update({ color: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={typo.color || '#FFFFFF'}
                      onChange={e => update({ color: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Opacidade</span>
                    <span className="text-orange-400 font-mono">{typo.opacity ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={typo.opacity ?? 100}
                    onChange={e => update({ opacity: parseInt(e.target.value) || 100 })}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Styles: Italic, Underline, Strikethrough, Alignments, Transforms */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">Estilo & Alinhamento</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => update({ fontStyle: typo.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      className={`p-1.5 rounded transition-colors ${
                        typo.fontStyle === 'italic' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Itálico"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ underline: !typo.underline })}
                      className={`p-1.5 rounded transition-colors ${
                        typo.underline ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Sublinhado"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ strikethrough: !typo.strikethrough })}
                      className={`p-1.5 rounded transition-colors ${
                        typo.strikethrough ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Tachado"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => update({ textAlign: 'left' })}
                      className={`p-1.5 rounded transition-colors ${
                        typo.textAlign === 'left' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Alinhar à Esquerda"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ textAlign: 'center' })}
                      className={`p-1.5 rounded transition-colors ${
                        typo.textAlign === 'center' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Centralizar"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ textAlign: 'right' })}
                      className={`p-1.5 rounded transition-colors ${
                        typo.textAlign === 'right' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Alinhar à Direita"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Transform */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">Caixa de Texto</span>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => update({ textTransform: 'none' })}
                      className={`px-2 py-1 rounded transition-colors ${
                        typo.textTransform === 'none' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Aa Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ textTransform: 'uppercase' })}
                      className={`px-2 py-1 rounded transition-colors ${
                        typo.textTransform === 'uppercase' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AA ALTA
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ textTransform: 'capitalize' })}
                      className={`px-2 py-1 rounded transition-colors ${
                        typo.textTransform === 'capitalize' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Aa Título
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPACING & POSITION */}
          {activeTab === 'spacing' && (
            <div className="space-y-3">
              {/* Letter Spacing (Tracking) */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium">Tracking (Espaçamento entre letras)</span>
                  <span className="text-orange-400 font-mono">{typo.letterSpacing ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="18"
                  value={typo.letterSpacing ?? 0}
                  onChange={e => update({ letterSpacing: parseInt(e.target.value) || 0 })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Line Height */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium">Altura da Linha (Line-height)</span>
                  <span className="text-orange-400 font-mono">{(typo.lineHeight ?? 1.2).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={Math.round((typo.lineHeight ?? 1.2) * 10)}
                  onChange={e => update({ lineHeight: (parseInt(e.target.value) || 12) / 10 })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Offset X & Y */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Offset X</span>
                    <span className="text-orange-400 font-mono">{typo.offsetX ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={typo.offsetX ?? 0}
                    onChange={e => update({ offsetX: parseInt(e.target.value) || 0 })}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Offset Y</span>
                    <span className="text-orange-400 font-mono">{typo.offsetY ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={typo.offsetY ?? 0}
                    onChange={e => update({ offsetY: parseInt(e.target.value) || 0 })}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium">Rotação</span>
                  <span className="text-orange-400 font-mono">{typo.rotation ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={typo.rotation ?? 0}
                  onChange={e => update({ rotation: parseInt(e.target.value) || 0 })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: EFFECTS (Shadow, Stroke, Gradient) */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              {/* Gradient Toggle */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Gradiente Vertical
                  </span>
                  <input
                    type="checkbox"
                    checked={typo.gradientEnabled || false}
                    onChange={e => update({ gradientEnabled: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>
                {typo.gradientEnabled && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Cor Final:</span>
                    <input
                      type="color"
                      value={typo.gradientEndColor || '#FC4C02'}
                      onChange={e => update({ gradientEndColor: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={typo.gradientEndColor || '#FC4C02'}
                      onChange={e => update({ gradientEndColor: e.target.value })}
                      className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Shadow Controls */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    Sombra do Texto
                  </span>
                  <input
                    type="checkbox"
                    checked={typo.shadowEnabled || false}
                    onChange={e => update({ shadowEnabled: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>

                {typo.shadowEnabled && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Cor da Sombra</span>
                      <input
                        type="color"
                        value={typo.shadowColor || '#000000'}
                        onChange={e => update({ shadowColor: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Desfoque (Blur)</span>
                        <span className="text-orange-400 font-mono">{typo.shadowBlur ?? 8}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={typo.shadowBlur ?? 8}
                        onChange={e => update({ shadowBlur: parseInt(e.target.value) || 0 })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Offset X: {typo.shadowOffsetX ?? 0}px</span>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          value={typo.shadowOffsetX ?? 0}
                          onChange={e => update({ shadowOffsetX: parseInt(e.target.value) || 0 })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Offset Y: {typo.shadowOffsetY ?? 2}px</span>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          value={typo.shadowOffsetY ?? 2}
                          onChange={e => update({ shadowOffsetY: parseInt(e.target.value) || 0 })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stroke / Outline */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Square className="w-3.5 h-3.5 text-orange-400" />
                    Contorno (Stroke)
                  </span>
                  <input
                    type="checkbox"
                    checked={typo.strokeEnabled || false}
                    onChange={e => update({ strokeEnabled: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>

                {typo.strokeEnabled && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Cor do Traço</span>
                      <input
                        type="color"
                        value={typo.strokeColor || '#000000'}
                        onChange={e => update({ strokeColor: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Largura</span>
                        <span className="text-orange-400 font-mono">{typo.strokeWidth ?? 1}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={typo.strokeWidth ?? 1}
                        onChange={e => update({ strokeWidth: parseInt(e.target.value) || 1 })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HIGHLIGHT BOX / BADGE */}
          {activeTab === 'box' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Caixa de Destaque / Badge</span>
                  <input
                    type="checkbox"
                    checked={typo.bgBoxEnabled || false}
                    onChange={e => update({ bgBoxEnabled: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </div>

                {typo.bgBoxEnabled && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Cor de Fundo</span>
                      <input
                        type="color"
                        value={typo.bgBoxColor || '#000000'}
                        onChange={e => update({ bgBoxColor: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Opacidade</span>
                        <span className="text-orange-400 font-mono">{typo.bgBoxOpacity ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={typo.bgBoxOpacity ?? 100}
                        onChange={e => update({ bgBoxOpacity: parseInt(e.target.value) || 100 })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Arredondamento: {typo.bgBoxRadius ?? 6}px</span>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          value={typo.bgBoxRadius ?? 6}
                          onChange={e => update({ bgBoxRadius: parseInt(e.target.value) || 0 })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Padding: {typo.bgBoxPadding ?? 6}px</span>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          value={typo.bgBoxPadding ?? 6}
                          onChange={e => update({ bgBoxPadding: parseInt(e.target.value) || 0 })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
