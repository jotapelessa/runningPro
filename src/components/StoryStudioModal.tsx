import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Share2, 
  Download, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Check, 
  Palette, 
  Sliders, 
  Layers, 
  Lock,
  Instagram,
  Zap,
  Info,
  Move,
  ZoomIn,
  Compass,
  LayoutTemplate,
  Bookmark,
  Activity as ActivityIcon,
  MousePointer,
  Camera,
  Upload,
  Sun,
  Contrast,
  SlidersHorizontal,
  Map as MapIcon,
  Type
} from 'lucide-react';
import { UserActivity, StoryConfig, CardPlacement, StoryTemplateId } from '../types';
import { 
  renderStoryFrame, 
  generateStaticStoryImage, 
  generateAnimatedStoryVideo,
  getCardBoundingBoxes,
  preloadStoryPhoto,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../lib/storyRenderer';
import { CourseDataAdjustPanel } from './CourseDataAdjustPanel';
import { getDefaultCourseDataConfig } from '../lib/courseDataTemplate';
import { StravaAppAdjustPanel } from './StravaAppAdjustPanel';
import { getDefaultStravaAppConfig } from '../lib/stravaAppTemplate';
import { RunEditorialAdjustPanel } from './RunEditorialAdjustPanel';
import { getDefaultRunEditorialConfig } from '../lib/runEditorialTemplate';
import { EnRouteAdjustPanel } from './EnRouteAdjustPanel';
import { getDefaultEnRouteConfig } from '../lib/enRouteTemplate';
import { RaceCourseMapAdjustPanel } from './RaceCourseMapAdjustPanel';
import { getDefaultRaceCourseMapConfig } from '../lib/raceCourseMapTemplate';

interface StoryStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: UserActivity;
  athleteName: string;
}

const STORAGE_KEY_PRESET = 'pacelab_story_layout_preset_v2';

export const STORY_TEMPLATES: Array<{
  id: StoryTemplateId;
  name: string;
  badge: string;
  desc: string;
  tag: string;
  accent: string;
  accentName: string;
  features: string[];
}> = [
  {
    id: 0,
    name: 'Padrão Atual (Strava Classic)',
    badge: 'Template 0 • Original Intocado',
    desc: 'Layout oficial com mapa 100% tela cheia, cards arrastáveis individuais (topo, primário e secundário) e telemetria completa.',
    tag: 'PADRÃO INICIAL',
    accent: '#FC4C02',
    accentName: 'Laranja Strava',
    features: ['Cards individuais com arrasto livre', 'Fundo comutável Mapa 100% ou Foto', 'Telemetria e altimetria clássica']
  },
  {
    id: 1,
    name: 'Course Data',
    badge: 'Template 1 • Editorial Altimetria',
    desc: 'Foto preto e branco com gradiente escuro, tabela superior minimalista com dados do percurso e perfil de elevação verde-limão no rodapé.',
    tag: 'ALTIMETRIA B&W',
    accent: '#D4E157',
    accentName: 'Verde-Limão',
    features: ['Filtro P&B de alto contraste automático', 'Tabela de percurso 4 linhas', 'Perfil de elevação verde-limão neon']
  },
  {
    id: 2,
    name: 'Strava App',
    badge: 'Template 2 • Layout Oficial App',
    desc: 'Inspirado no visual clássico do app Strava: foto de fundo, card superior esquerdo de atividade, mapa vertical à direita, 3 cards de métricas e perfil de elevação com eixos.',
    tag: 'ESTILO CLÁSSICO STRAVA',
    accent: '#FC4C02',
    accentName: 'Laranja Strava',
    features: ['Card de atividade (marca, esporte, local, data, hora)', 'Painel de mapa vertical flutuante à direita', '3 cards de métricas inferiores e gráfico de elevação com eixos Y']
  },
  {
    id: 3,
    name: 'Run Editorial',
    badge: 'Template 3 • Estilo Revista & Tipografia Total',
    desc: 'Estilo editorial minimalista com título grande em itálico, data e hora com separador vertical, frase personalizada, mini-traçado de rota e controle tipográfico granular em todos os textos.',
    tag: 'EDITORIAL & TIPOGRAFIA',
    accent: '#FFFFFF',
    accentName: 'Branco Puro',
    features: ['Tipografia customizável em cada texto individual', 'Título gigante itálico com ajuste de tracking', 'Métricas empilhadas e mini-rota no rodapé']
  },
  {
    id: 4,
    name: 'En Route',
    badge: 'Template 4 • Mapa Flutuante & Waypoints',
    desc: 'Visual estilo viagem com título "EN ROUTE" no topo, percurso com separador, mapa central flutuante, marcadores de pontos de interesse (LARGADA, CHEGADA, mirantes), badges de tempo/distância e controle tipográfico total em todos os textos.',
    tag: 'ROTA & WAYPOINTS',
    accent: '#1565C0',
    accentName: 'Azul En Route',
    features: ['Título EN ROUTE e subtítulo com tipografia completa', 'Mapa central flutuante com rota vibrante e waypoints', 'Badges flutuantes informativos e créditos no rodapé']
  },
  {
    id: 5,
    name: 'Race Course Map',
    badge: 'Template 5 • Percurso & Legenda',
    desc: 'Inspirado em mapas de percurso de corrida de rua: fundo escuro, rota amarela destacada, legenda lateral com ícones, bússola de norte e tipografia 100% customizável.',
    tag: 'RACE COURSE MAP',
    accent: '#FFD400',
    accentName: 'Amarelo Percurso',
    features: ['Mapa de percurso escuro com rota amarela vibrante', 'Legenda lateral vertical com ícones e avisos', 'Tipografia individual para títulos, ruas, legenda e rodapé']
  }
];

export const TEMPLATE_DEFAULTS: Record<StoryTemplateId, Partial<StoryConfig>> = {
  0: {
    templateId: 0,
    backgroundType: 'map',
    accentColor: '#FC4C02',
    theme: 'clean_white',
    mapZoom: 1.0,
    mapPanX: 0,
    mapPanY: 0,
    mapRotation: 0,
    headerCard: { x: 0, y: 0, scale: 1.0, visible: true },
    primaryMetricsCard: { x: 0, y: 0, scale: 1.0, visible: true },
    secondaryMetricsCard: { x: 0, y: 0, scale: 1.0, visible: true }
  },
  1: {
    templateId: 1,
    backgroundType: 'photo',
    accentColor: '#D4E157',
    courseData: getDefaultCourseDataConfig(),
    photoBrightness: 0,
    photoContrast: 10,
    photoOverlayOpacity: 25,
    photoZoom: 1.0,
    photoPanX: 0,
    photoPanY: 0
  },
  2: {
    templateId: 2,
    backgroundType: 'photo',
    accentColor: '#FC4C02',
    stravaApp: getDefaultStravaAppConfig(),
    photoBrightness: 0,
    photoContrast: 0,
    photoOverlayOpacity: 15,
    photoZoom: 1.0,
    photoPanX: 0,
    photoPanY: 0
  },
  3: {
    templateId: 3,
    backgroundType: 'photo',
    accentColor: '#FFFFFF',
    runEditorial: getDefaultRunEditorialConfig(),
    photoBrightness: 0,
    photoContrast: 5,
    photoOverlayOpacity: 10,
    photoZoom: 1.0,
    photoPanX: 0,
    photoPanY: 0
  },
  4: {
    templateId: 4,
    backgroundType: 'photo',
    accentColor: '#1565C0',
    enRoute: getDefaultEnRouteConfig(),
    photoBrightness: 0,
    photoContrast: 5,
    photoOverlayOpacity: 12,
    photoZoom: 1.0,
    photoPanX: 0,
    photoPanY: 0
  },
  5: {
    templateId: 5,
    backgroundType: 'map',
    accentColor: '#FFD400',
    raceCourseMap: getDefaultRaceCourseMapConfig(),
    photoBrightness: 0,
    photoContrast: 0,
    photoOverlayOpacity: 20,
    photoZoom: 1.0,
    photoPanX: 0,
    photoPanY: 0
  }
};

const DEFAULT_CONFIG: StoryConfig = {
  templateId: 0, // Template padrão inicial garantido!
  templateSettings: {},
  courseData: getDefaultCourseDataConfig(),
  stravaApp: getDefaultStravaAppConfig(),
  runEditorial: getDefaultRunEditorialConfig(),
  enRoute: getDefaultEnRouteConfig(),
  raceCourseMap: getDefaultRaceCourseMapConfig(),
  theme: 'clean_white',
  accentColor: '#FC4C02',
  fontStyle: 'sans',
  mapStyle: 'light',
  backgroundType: 'map',
  customPhotoUrl: undefined,
  photoZoom: 1.0,
  photoPanX: 0,
  photoPanY: 0,
  photoBrightness: 0,
  photoContrast: 0,
  photoOverlayOpacity: 25,
  photoOverlayTheme: 'dark',
  mapZoom: 1.0,
  mapPanX: 0,
  mapPanY: 0,
  mapRotation: 0,
  headerCard: { x: 0, y: 0, scale: 1.0, visible: true },
  primaryMetricsCard: { x: 0, y: 0, scale: 1.0, visible: true },
  secondaryMetricsCard: { x: 0, y: 0, scale: 1.0, visible: true },
  cardScale: 1.0,
  cardOffsetY: 0,
  cardOffsetX: 0,
  animationStyle: 'progressive',
  hideMap: false,
  hideRoute: false,
  obfuscatePrivacyMeters: true, // Default ON for runner safety
  visibleMetrics: {
    distance: true,
    duration: true,
    pace: true,
    avgHr: true,
    calories: true,
    elevation: true,
    cadence: true,
    vdot: true,
    athleteName: true,
    date: true,
    splits: false
  },
  exportFormat: 'image',
  videoDurationSeconds: 8,
  showSafeZones: false,
  customTitle: ''
};

const SAMPLE_PHOTOS = [
  {
    name: 'Selfie Corrida',
    url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1080&q=80',
    desc: 'Atleta comemorando percurso'
  },
  {
    name: 'Prova & Medalha',
    url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1080&q=80',
    desc: 'Linha de chegada esportiva'
  },
  {
    name: 'Trilha & Montanha',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1080&q=80',
    desc: 'Treino ao ar livre'
  }
];

const COLOR_OPTIONS = [
  { label: 'Strava Laranja Clássico', value: '#FC4C02' },
  { label: 'Verde Elétrico', value: '#10B981' },
  { label: 'Ciano Esportivo', value: '#06B6D4' },
  { label: 'Amarelo Neon', value: '#FACC15' },
  { label: 'Magenta Hyper', value: '#EC4899' },
  { label: 'Roxo Ultraviolet', value: '#8B5CF6' },
  { label: 'Vermelho Pro', value: '#EF4444' }
];

const QUICK_TEXT_COLORS = [
  { label: 'Branco Puro', hex: '#FFFFFF' },
  { label: 'Preto Profundo', hex: '#000000' },
  { label: 'Laranja Strava', hex: '#FC4C02' },
  { label: 'Amarelo Ouro', hex: '#FACC15' },
  { label: 'Ciano Neon', hex: '#22D3EE' },
  { label: 'Verde Neon', hex: '#4ADE80' },
  { label: 'Rosa Neon', hex: '#FB7185' },
  { label: 'Cinza Metálico', hex: '#CBD5E1' }
];

const THEME_OPTIONS: Array<{ id: StoryConfig['theme']; name: string; desc: string; previewBg: string }> = [
  { id: 'clean_white', name: 'Strava Classic (Claro)', desc: 'Branco puro com métricas nítidas e mapa claro', previewBg: 'from-slate-100 to-white' },
  { id: 'dark_obsidian', name: 'Strava Dark Mode', desc: 'Fundo escuro profundo com alto contraste esportivo', previewBg: 'from-slate-900 to-black' },
  { id: 'minimalist', name: 'Minimalista Puro', desc: 'Monocromático focado nos números', previewBg: 'from-black to-black' },
  { id: 'neon_runner', name: 'Neon Runner', desc: 'Grid esportivo com iluminação vibrante', previewBg: 'from-indigo-950 to-black' },
  { id: 'sunset_gold', name: 'Sunset Gold', desc: 'Tons crepusculares de fim de tarde', previewBg: 'from-amber-950 to-neutral-950' },
  { id: 'athletic_carbon', name: 'Athletic Carbon', desc: 'Textura premium de fibra de carbono', previewBg: 'from-zinc-900 to-stone-950' }
];

export const StoryStudioModal: React.FC<StoryStudioModalProps> = ({
  isOpen,
  onClose,
  activity,
  athleteName
}) => {
  const [config, setConfig] = useState<StoryConfig>(() => {
    // Attempt to load user saved custom preset
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRESET);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          customTitle: activity.title || parsed.customTitle || 'Treino de Corrida'
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar layout salvo:', e);
    }
    return {
      ...DEFAULT_CONFIG,
      customTitle: activity.title || 'Treino de Corrida'
    };
  });

  const [activeTab, setActiveTab] = useState<'templates' | 'style' | 'adjust' | 'metrics' | 'privacy' | 'export'>('templates');
  const [selectedCardId, setSelectedCardId] = useState<'header' | 'primary' | 'secondary' | 'map'>('primary');
  const [previewProgress, setPreviewProgress] = useState(1);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ ratio: number; text: string }>({ ratio: 0, text: '' });
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef<'header' | 'primary' | 'secondary' | 'map' | null>(null);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({ clientX: 0, clientY: 0, initialX: 0, initialY: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preload photo background whenever customPhotoUrl changes
  useEffect(() => {
    if (config.customPhotoUrl) {
      preloadStoryPhoto(config.customPhotoUrl).then(() => {
        const canvas = previewCanvasRef.current;
        if (canvas && isOpen) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderStoryFrame(ctx, activity, athleteName, config, previewProgress, {
              showSafeZoneGuides: config.showSafeZones,
              selectedId: activeTab === 'adjust' ? selectedCardId : null
            });
          }
        }
      }).catch(err => console.warn('Preload de foto:', err));
    }
  }, [config.customPhotoUrl, isOpen, config, previewProgress, activity, athleteName, activeTab, selectedCardId]);

  // Switch between templates with isolated per-template saved settings
  const handleSelectTemplate = (newTemplateId: StoryTemplateId) => {
    const currentId = (config.templateId ?? 0) as StoryTemplateId;
    if (currentId === newTemplateId) return;

    // 1. Snapshot the current settings of the template being exited
    const currentSnapshot: Partial<StoryConfig> = {
      mapZoom: config.mapZoom,
      mapPanX: config.mapPanX,
      mapPanY: config.mapPanY,
      mapRotation: config.mapRotation,
      photoZoom: config.photoZoom,
      photoPanX: config.photoPanX,
      photoPanY: config.photoPanY,
      photoBrightness: config.photoBrightness,
      photoContrast: config.photoContrast,
      photoOverlayOpacity: config.photoOverlayOpacity,
      photoOverlayTheme: config.photoOverlayTheme,
      backgroundType: config.backgroundType,
      accentColor: config.accentColor,
      theme: config.theme,
      headerCard: config.headerCard,
      primaryMetricsCard: config.primaryMetricsCard,
      secondaryMetricsCard: config.secondaryMetricsCard,
      customTitle: config.customTitle,
      courseData: config.courseData,
      stravaApp: config.stravaApp,
      runEditorial: config.runEditorial
    };

    const updatedSettings = {
      ...(config.templateSettings || {}),
      [currentId]: currentSnapshot
    };

    // 2. Retrieve saved configuration for the target template, or default parameters
    const targetStored = updatedSettings[newTemplateId];
    const targetDefaults = TEMPLATE_DEFAULTS[newTemplateId] || TEMPLATE_DEFAULTS[0];

    // If switching to templates 1, 2, 3 or 4 and there's no photo yet, auto-select a sample photo
    let photoToUse = config.customPhotoUrl;
    if (newTemplateId !== 0 && !photoToUse) {
      photoToUse = SAMPLE_PHOTOS[0].url;
    }

    const targetCourseData = newTemplateId === 1
      ? (targetStored?.courseData || config.courseData || getDefaultCourseDataConfig(activity, athleteName))
      : config.courseData;

    const targetStravaApp = newTemplateId === 2
      ? (targetStored?.stravaApp || config.stravaApp || getDefaultStravaAppConfig(activity, athleteName))
      : config.stravaApp;

    const targetRunEditorial = newTemplateId === 3
      ? (targetStored?.runEditorial || config.runEditorial || getDefaultRunEditorialConfig(activity, athleteName))
      : config.runEditorial;

    setConfig(prev => ({
      ...prev,
      ...targetDefaults,
      ...(targetStored || {}),
      templateId: newTemplateId,
      templateSettings: updatedSettings,
      courseData: targetCourseData,
      stravaApp: targetStravaApp,
      runEditorial: targetRunEditorial,
      customPhotoUrl: photoToUse || prev.customPhotoUrl
    }));
  };

  // Reset adjustments of currently active template to its original preset
  const handleResetCurrentTemplate = () => {
    const currentId = (config.templateId ?? 0) as StoryTemplateId;
    const defaults = TEMPLATE_DEFAULTS[currentId] || TEMPLATE_DEFAULTS[0];
    const freshCourseData = currentId === 1 ? getDefaultCourseDataConfig(activity, athleteName) : undefined;
    const freshStravaApp = currentId === 2 ? getDefaultStravaAppConfig(activity, athleteName) : undefined;
    const freshRunEditorial = currentId === 3 ? getDefaultRunEditorialConfig(activity, athleteName) : undefined;

    setConfig(prev => {
      const updatedSettings = {
        ...(prev.templateSettings || {}),
        [currentId]: {
          ...defaults,
          courseData: freshCourseData,
          stravaApp: freshStravaApp,
          runEditorial: freshRunEditorial
        }
      };
      return {
        ...prev,
        ...defaults,
        ...(freshCourseData ? { courseData: freshCourseData } : {}),
        ...(freshStravaApp ? { stravaApp: freshStravaApp } : {}),
        ...(freshRunEditorial ? { runEditorial: freshRunEditorial } : {}),
        templateSettings: updatedSettings
      };
    });
  };

  // Redraw preview whenever config, progress, or activity changes
  useEffect(() => {
    if (!isOpen) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderStoryFrame(ctx, activity, athleteName, config, previewProgress, {
      showSafeZoneGuides: config.showSafeZones,
      selectedId: activeTab === 'adjust' ? selectedCardId : null
    });
  }, [isOpen, config, previewProgress, activity, athleteName, activeTab, selectedCardId]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (generatedMediaUrl) URL.revokeObjectURL(generatedMediaUrl);
    };
  }, [generatedMediaUrl]);

  if (!isOpen) return null;

  // Handle preview animation play
  const handlePlayPreview = () => {
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setPreviewProgress(1);
      return;
    }

    setIsPlayingPreview(true);
    setPreviewProgress(0);
    const startTime = performance.now();
    const durationMs = (config.videoDurationSeconds || 8) * 1000;

    const animateLoop = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / durationMs);
      setPreviewProgress(ratio);

      if (ratio < 1) {
        animationFrameRef.current = requestAnimationFrame(animateLoop);
      } else {
        setIsPlayingPreview(false);
        setPreviewProgress(1);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateLoop);
  };

  // Reset transforms to defaults
  const handleResetAdjustments = () => {
    const currentId = (config.templateId ?? 0) as StoryTemplateId;
    if (currentId !== 0) {
      handleResetCurrentTemplate();
      return;
    }
    setConfig(prev => ({
      ...prev,
      mapZoom: 1.0,
      mapPanX: 0,
      mapPanY: 0,
      mapRotation: 0,
      photoZoom: 1.0,
      photoPanX: 0,
      photoPanY: 0,
      headerCard: { x: 0, y: 0, scale: 1.0, visible: true, fontSizeScale: 1.0, transparentBackground: false, textColor: undefined, labelColor: undefined, textShadow: false },
      primaryMetricsCard: { x: 0, y: 0, scale: 1.0, visible: true, fontSizeScale: 1.0, transparentBackground: false, textColor: undefined, labelColor: undefined, textShadow: false },
      secondaryMetricsCard: { x: 0, y: 0, scale: 1.0, visible: true, fontSizeScale: 1.0, transparentBackground: false, textColor: undefined, labelColor: undefined, textShadow: false },
      cardScale: 1.0,
      cardOffsetY: 0,
      cardOffsetX: 0
    }));
  };

  // Save current layout as default for future activities
  const handleSaveLayoutPreset = () => {
    try {
      const toSave = {
        theme: config.theme,
        accentColor: config.accentColor,
        mapZoom: config.mapZoom,
        mapPanX: config.mapPanX,
        mapPanY: config.mapPanY,
        mapRotation: config.mapRotation,
        headerCard: config.headerCard,
        primaryMetricsCard: config.primaryMetricsCard,
        secondaryMetricsCard: config.secondaryMetricsCard,
        visibleMetrics: config.visibleMetrics,
        obfuscatePrivacyMeters: config.obfuscatePrivacyMeters,
        videoDurationSeconds: config.videoDurationSeconds
      };
      localStorage.setItem(STORAGE_KEY_PRESET, JSON.stringify(toSave));
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (e) {
      console.error('Falha ao salvar layout:', e);
    }
  };

  // Update a single card property without affecting any other card
  const updateCardPlacement = (cardId: 'header' | 'primary' | 'secondary', updates: Partial<CardPlacement>) => {
    const key = cardId === 'header' ? 'headerCard' : cardId === 'primary' ? 'primaryMetricsCard' : 'secondaryMetricsCard';
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { x: 0, y: 0, scale: 1.0, visible: true }),
        ...updates
      }
    }));
  };

  // Canvas Direct Pointer Dragging Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Check hit testing with cards
    const showSecondary = config.visibleMetrics.elevation || config.visibleMetrics.avgHr || config.visibleMetrics.calories;
    const boxes = getCardBoundingBoxes(config, showSecondary);
    const hitBox = boxes.find(b => 
      canvasX >= b.x && canvasX <= b.x + b.width && canvasY >= b.y && canvasY <= b.y + b.height
    );

    if (hitBox) {
      setSelectedCardId(hitBox.id as any);
      dragTargetRef.current = hitBox.id as any;
      const key = hitBox.id === 'header' ? 'headerCard' : hitBox.id === 'primary' ? 'primaryMetricsCard' : 'secondaryMetricsCard';
      const currentPos = config[key] || { x: 0, y: 0 };
      dragStartPosRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialX: currentPos.x || 0,
        initialY: currentPos.y || 0
      };
    } else {
      // Hit background (Map or Photo)
      setSelectedCardId('map');
      dragTargetRef.current = 'map';
      const initX = config.backgroundType === 'photo' ? (config.photoPanX ?? 0) : (config.mapPanX ?? 0);
      const initY = config.backgroundType === 'photo' ? (config.photoPanY ?? 0) : (config.mapPanY ?? 0);
      dragStartPosRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialX: initX,
        initialY: initY
      };
    }

    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragTargetRef.current) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const deltaX = (e.clientX - dragStartPosRef.current.clientX) * scaleX;
    const deltaY = (e.clientY - dragStartPosRef.current.clientY) * scaleY;

    if (dragTargetRef.current === 'map') {
      if (config.backgroundType === 'photo') {
        setConfig(prev => ({
          ...prev,
          photoPanX: Math.round(dragStartPosRef.current.initialX + deltaX),
          photoPanY: Math.round(dragStartPosRef.current.initialY + deltaY)
        }));
      } else {
        setConfig(prev => ({
          ...prev,
          mapPanX: Math.round(dragStartPosRef.current.initialX + deltaX),
          mapPanY: Math.round(dragStartPosRef.current.initialY + deltaY)
        }));
      }
    } else {
      updateCardPlacement(dragTargetRef.current, {
        x: Math.round(dragStartPosRef.current.initialX + deltaX),
        y: Math.round(dragStartPosRef.current.initialY + deltaY)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    dragTargetRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Handle Photo Upload (via File Input or Drag & Drop)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        preloadStoryPhoto(dataUrl).then(() => {
          setConfig(prev => ({
            ...prev,
            backgroundType: 'photo',
            customPhotoUrl: dataUrl,
            photoZoom: 1.0,
            photoPanX: 0,
            photoPanY: 0
          }));
        }).catch(err => {
          console.error('Falha ao processar imagem:', err);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate Image or Video Output
  const handleExport = async (format: 'image' | 'video') => {
    setIsGenerating(true);
    setGenerationProgress({ ratio: 0, text: 'Iniciando pipeline de renderização...' });
    setGeneratedMediaUrl(null);
    setGeneratedBlob(null);

    try {
      if (format === 'image') {
        setGenerationProgress({ ratio: 0.5, text: 'Renderizando imagem em alta definição 1080x1920...' });
        const blob = await generateStaticStoryImage(activity, athleteName, config);
        const url = URL.createObjectURL(blob);
        setGeneratedBlob(blob);
        setGeneratedMediaUrl(url);
        setGenerationProgress({ ratio: 1, text: 'Imagem gerada com sucesso!' });
      } else {
        const result = await generateAnimatedStoryVideo(
          activity,
          athleteName,
          config,
          (ratio, statusText) => {
            setGenerationProgress({ ratio, text: statusText });
          }
        );
        setGeneratedBlob(result.blob);
        setGeneratedMediaUrl(result.url);
      }
    } catch (err: any) {
      console.error('Erro na exportação do Story:', err);
      alert('Houve um erro ao processar o arquivo para Stories: ' + (err?.message || 'Erro desconhecido.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Download
  const handleDownloadFile = () => {
    if (!generatedBlob || !generatedMediaUrl) return;
    const isMp4 = generatedBlob.type.includes('mp4');
    const ext = config.exportFormat === 'image' ? 'png' : (isMp4 ? 'mp4' : 'webm');
    const filename = `pacelab_story_${activity.date.split('T')[0]}_${activity.type}.${ext}`;
    
    const a = document.createElement('a');
    a.href = generatedMediaUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Trigger Native Web Share (Instagram Stories)
  const handleNativeShare = async () => {
    if (!generatedBlob) return;
    const isMp4 = generatedBlob.type.includes('mp4');
    const ext = config.exportFormat === 'image' ? 'png' : (isMp4 ? 'mp4' : 'webm');
    const mime = config.exportFormat === 'image' ? 'image/png' : (generatedBlob.type || 'video/webm');
    const file = new File([generatedBlob], `story_${Date.now()}.${ext}`, { type: mime });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Treino PaceLab',
          text: `Confira meu treino de ${activity.distanceKm} km no PaceLab!`
        });
      } catch (e) {
        console.log('Compartilhamento cancelado ou não suportado:', e);
      }
    } else {
      handleDownloadFile();
      alert('Arquivo baixado! Abra o aplicativo do Instagram e selecione o arquivo baixado na galeria para postar nos Stories.');
    }
  };

  const currentCardConf = selectedCardId === 'header' 
    ? (config.headerCard || { x: 0, y: 0, scale: 1.0, visible: true })
    : selectedCardId === 'primary' 
    ? (config.primaryMetricsCard || { x: 0, y: 0, scale: 1.0, visible: true })
    : selectedCardId === 'secondary'
    ? (config.secondaryMetricsCard || { x: 0, y: 0, scale: 1.0, visible: true })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white w-screen h-screen overflow-hidden select-none">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/95 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FC4C02] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                HUD Instagramável • Stories (9:16)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-[#FC4C02] border border-orange-500/30">
                1080 × 1920 px
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Padrão Strava • Fundo 100% tela cheia • Cards individuais arrastáveis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab !== 'export') setActiveTab('export');
              else handleExport(config.exportFormat);
            }}
            className="hidden sm:flex px-4 py-2 rounded-xl bg-[#FC4C02] hover:bg-orange-500 text-white text-xs font-bold transition-colors items-center gap-1.5 shadow-lg shadow-orange-950/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeTab === 'export' ? 'Renderizar Agora' : 'Exportar Story'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar Estúdio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Studio Workspace: Left Canvas (9:16) & Right Fixed Tabs + Controls */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* Left: Interactive Live 9:16 Canvas Preview with Direct Dragging */}
        <div className="lg:col-span-5 xl:col-span-5 bg-black/85 p-3 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800/90 relative min-h-0 overflow-hidden">
          <div className="relative h-full max-h-[calc(100vh-150px)] max-w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl shadow-orange-950/30 border-2 border-slate-700 bg-slate-950 flex items-center justify-center select-none group cursor-grab active:cursor-grabbing">
            
            {/* Actual HD Canvas rendered scaled */}
            <canvas
              ref={previewCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full object-contain touch-none"
              title="Clique e arraste diretamente para reposicionar o card ou mapa"
            />

            {/* Direct Drag Hint Overlay */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-300 pointer-events-none flex items-center gap-1 border border-white/10 opacity-75 group-hover:opacity-100 transition-opacity">
              <MousePointer className="w-3 h-3 text-[#FC4C02]" />
              <span>Arraste na tela</span>
            </div>

            {/* Safe Zones Indicator Badge */}
            {config.showSafeZones && (
              <div className="absolute top-3 left-3 bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur pointer-events-none">
                Safe Zones Visíveis
              </div>
            )}

            {/* Generating Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                <div className="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-[#FC4C02] animate-spin mb-4" />
                <p className="text-sm font-bold text-white mb-1">
                  {config.exportFormat === 'video' ? 'Gravando Vídeo 60 FPS...' : 'Renderizando Imagem...'}
                </p>
                <p className="text-xs text-slate-400 mb-3">{generationProgress.text}</p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#FC4C02] h-full transition-all duration-200"
                    style={{ width: `${Math.round(generationProgress.ratio * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Action Controls */}
          <div className="mt-3 flex items-center gap-2 w-full max-w-[320px] justify-between shrink-0">
            <button
              onClick={handlePlayPreview}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              {isPlayingPreview ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#FC4C02] fill-[#FC4C02]" />
                  <span>Play Fluido (60 FPS)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setConfig(prev => ({ ...prev, showSafeZones: !prev.showSafeZones }))}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                config.showSafeZones 
                  ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Mostrar áreas seguras do Instagram"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safe Zones</span>
            </button>
          </div>
        </div>

        {/* Right: Dedicated Scrollable Customization Controls with Sticky Tabs Header */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col bg-slate-900/40 min-h-0 h-full overflow-hidden">
          
          {/* Permanent Sticky Tabs Header Bar - NEVER DISAPPEARS */}
          <div className="shrink-0 px-4 sm:px-6 pt-3 pb-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-20 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'templates'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Templates (5)</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-orange-500/30 text-orange-300">
                  {config.templateId ?? 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('style')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'style'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Tema & Cores</span>
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'adjust'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Ajustes & Cards Individuais</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'privacy'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Privacidade</span>
              </button>

              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'metrics'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Métricas</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'export'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>
            </div>

            {/* Quick 5-Template Selector Bar (Always accessible) */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                <LayoutTemplate className="w-3 h-3 text-orange-400" />
                <span>Template:</span>
              </span>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {STORY_TEMPLATES.map(tpl => {
                  const isCurrent = (config.templateId ?? 0) === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      title={`${tpl.name} - ${tpl.desc}`}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap ${
                        isCurrent
                          ? 'bg-[#FC4C02] text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {tpl.id}: {tpl.name.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scrollable Tab Content Container */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 overscroll-contain">

              {/* TAB 0: TEMPLATES SELECTOR (5 Options) */}
              {activeTab === 'templates' && (
                <div className="space-y-6">
                  {/* Current Active Template Highlight & Reset Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/90 to-slate-900 border border-slate-700/80 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Template Ativo no Momento
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Opção {(config.templateId ?? 0)} de 5
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white">
                          {STORY_TEMPLATES[config.templateId ?? 0]?.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                          {STORY_TEMPLATES[config.templateId ?? 0]?.desc}
                        </p>
                      </div>

                      {/* Reset to template default button */}
                      <button
                        onClick={handleResetCurrentTemplate}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/80 text-xs font-bold transition-all shrink-0 shadow-sm"
                        title="Restaura os valores e posições padrão originais deste template"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span>Restaurar Padrão do Template</span>
                      </button>
                    </div>
                  </div>

                  {/* 5 Templates Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Escolha um dos 5 Templates Disponíveis
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Ajustes preservados individualmente por template
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {STORY_TEMPLATES.map(tpl => {
                        const isSelected = (config.templateId ?? 0) === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => handleSelectTemplate(tpl.id)}
                            className={`group relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-gradient-to-b from-orange-500/10 via-slate-900 to-slate-900 border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                            }`}
                          >
                            {/* Card Header & Badge */}
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {tpl.badge}
                                </span>

                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                                  {tpl.tag}
                                </span>
                              </div>

                              <h4 className="text-sm font-black text-white group-hover:text-orange-400 transition-colors">
                                {tpl.name}
                              </h4>

                              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                {tpl.desc}
                              </p>

                              {/* Features checklist */}
                              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                                {tpl.features.map((feat, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <div 
                                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: tpl.accent }} 
                                    />
                                    <span>{feat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Card Footer Action */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: tpl.accent }}
                                />
                                <span>{tpl.accentName}</span>
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTemplate(tpl.id);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#FC4C02] text-white shadow-md'
                                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Template Ativo</span>
                                  </>
                                ) : (
                                  <span>Selecionar</span>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Informational Guidance banner */}
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                    <Sliders className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">Personalização Completa:</span> Após escolher o template, você pode navegar livremente nas abas <strong className="text-orange-400">Tema & Cores</strong>, <strong className="text-orange-400">Ajustes & Cards</strong> e <strong className="text-orange-400">Privacidade</strong>. Seus ajustes manuais de zoom, foto, fundo e rota serão lembrados exclusivamente para este template!
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: THEME & STYLE */}
              {activeTab === 'style' && (
                <div className="space-y-5">

                  {/* Background Type Choice: Map vs Photo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Plano de Fundo do Story (9:16)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, backgroundType: 'map' }))}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          config.backgroundType !== 'photo'
                            ? 'border-orange-500 bg-orange-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-orange-500/20 text-[#FC4C02]">
                          <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Mapa GPS 100%</div>
                          <div className="text-[10px] text-slate-400">Cartografia estilizada</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          if (!config.customPhotoUrl) {
                            // Default to first sample photo if none selected
                            setConfig(prev => ({
                              ...prev,
                              backgroundType: 'photo',
                              customPhotoUrl: SAMPLE_PHOTOS[0].url
                            }));
                          } else {
                            setConfig(prev => ({ ...prev, backgroundType: 'photo' }));
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          config.backgroundType === 'photo'
                            ? 'border-orange-500 bg-orange-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">Foto Pessoal / Selfie</div>
                          <div className="text-[10px] text-slate-400">Sua foto com rota e HUD</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* If Photo Background is selected, show upload & sample selector */}
                  {config.backgroundType === 'photo' && (
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-orange-400" />
                          <span>Selecionar Foto de Fundo</span>
                        </span>

                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handlePhotoUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Enviar Minha Foto</span>
                        </button>
                      </div>

                      {/* Sample Photos for Quick Try */}
                      <div>
                        <div className="text-[11px] text-slate-400 mb-1.5">Ou escolha uma foto de demonstração:</div>
                        <div className="grid grid-cols-3 gap-2">
                          {SAMPLE_PHOTOS.map(p => (
                            <button
                              key={p.name}
                              onClick={() => {
                                preloadStoryPhoto(p.url).then(() => {
                                  setConfig(prev => ({
                                    ...prev,
                                    backgroundType: 'photo',
                                    customPhotoUrl: p.url
                                  }));
                                });
                              }}
                              className={`p-1.5 rounded-lg border text-left transition-all flex flex-col items-center gap-1 overflow-hidden relative ${
                                config.customPhotoUrl === p.url
                                  ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500'
                                  : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:text-white'
                              }`}
                            >
                              <img 
                                src={p.url} 
                                alt={p.name}
                                className="w-full h-12 object-cover rounded-md" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-semibold truncate w-full text-center">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Estilo do Story & HUD
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {THEME_OPTIONS.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => setConfig(prev => ({ ...prev, theme: theme.id }))}
                          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                            config.theme === theme.id
                              ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-950/20'
                              : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-full h-8 rounded-lg bg-gradient-to-br ${theme.previewBg} border border-slate-700/50 mb-2`} />
                          <div className="font-bold text-xs text-white">{theme.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{theme.desc}</div>
                          {config.theme === theme.id && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FC4C02] flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Cor de Destaque da Rota & Detalhes
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {COLOR_OPTIONS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setConfig(prev => ({ ...prev, accentColor: c.value }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                            config.accentColor === c.value
                              ? 'border-white/40 bg-slate-800 text-white shadow-md'
                              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: c.value }}
                          />
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Style Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Modo de Exibição da Rota no Vídeo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'progressive', label: 'Traçado Fluido', desc: 'Desenha do início ao fim' },
                        { id: 'complete', label: 'Rota Completa', desc: 'Exibe percurso total' },
                        { id: 'loop', label: 'Ciclo / Loop', desc: 'Avanço e retorno suave' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setConfig(prev => ({ ...prev, animationStyle: m.id as any }))}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            config.animationStyle === m.id
                              ? 'border-orange-500 bg-orange-500/10 text-white'
                              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="font-bold text-xs">{m.label}</div>
                          <div className="text-[10px] text-slate-400">{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Title Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Título da Atividade
                    </label>
                    <input
                      type="text"
                      value={config.customTitle || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, customTitle: e.target.value }))}
                      placeholder="Ex: Longão de Domingo • 15 km"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: INDIVIDUAL CARD & MAP CONTROLS */}
              {activeTab === 'adjust' && (
                config.templateId === 1 ? (
                  <CourseDataAdjustPanel
                    config={config}
                    setConfig={setConfig}
                    activity={activity}
                    athleteName={athleteName}
                    selectedCardId={selectedCardId}
                    onSelectCard={setSelectedCardId}
                  />
                ) : config.templateId === 2 ? (
                  <StravaAppAdjustPanel
                    config={config}
                    setConfig={setConfig}
                    activity={activity}
                    athleteName={athleteName}
                  />
                ) : config.templateId === 3 ? (
                  <RunEditorialAdjustPanel
                    config={config}
                    setConfig={setConfig}
                    activity={activity}
                    athleteName={athleteName}
                  />
                ) : config.templateId === 4 ? (
                  <EnRouteAdjustPanel
                    config={config}
                    setConfig={setConfig}
                    activity={activity}
                    athleteName={athleteName}
                  />
                ) : config.templateId === 5 ? (
                  <RaceCourseMapAdjustPanel
                    config={config}
                    onChange={setConfig}
                  />
                ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">Ajustes Individuais de Cada Elemento</h4>
                      <p className="text-xs text-slate-400">Arraste os elementos na prévia ou use os controles finos abaixo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveLayoutPreset}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold border border-orange-500/30 transition-colors"
                        title="Salvar layout personalizado para treinos futuros"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Salvar Layout</span>
                      </button>
                      <button
                        onClick={handleResetAdjustments}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                        title="Restaurar posições originais seguras"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span>Restaurar</span>
                      </button>
                    </div>
                  </div>

                  {saveSuccessNotice && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4" />
                      <span>Layout salvo! Suas preferências serão reaproveitadas automaticamente nos próximos Stories.</span>
                    </div>
                  )}

                  {/* Element Selector Tabs */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'primary', label: '3 Grandes Métricas', icon: LayoutTemplate },
                      { id: 'header', label: 'Cabeçalho / Atleta', icon: ActivityIcon },
                      { id: 'secondary', label: 'Métricas Secundárias', icon: Layers },
                      { 
                        id: 'map', 
                        label: config.backgroundType === 'photo' ? 'Fundo (Foto / Selfie)' : 'Fundo (Mapa GPS)', 
                        icon: config.backgroundType === 'photo' ? Camera : Compass 
                      }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isSelected = selectedCardId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedCardId(tab.id as any)}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'border-[#FC4C02] bg-orange-500/15 text-white shadow-md'
                              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FC4C02]' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-bold leading-tight">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dedicated Controls for Selected Card */}
                  {selectedCardId !== 'map' && currentCardConf && (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                          <Move className="w-4 h-4" />
                          <span>
                            {selectedCardId === 'header' && 'Card Superior (Atleta & Data)'}
                            {selectedCardId === 'primary' && 'Card Principal (Distância, Tempo e Pace)'}
                            {selectedCardId === 'secondary' && 'Card Secundário (Elevação, FC e Calorias)'}
                          </span>
                        </div>

                        {/* Visibility Toggle for this specific card */}
                        <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                          <span>{currentCardConf.visible !== false ? 'Visível' : 'Oculto'}</span>
                          <input
                            type="checkbox"
                            checked={currentCardConf.visible !== false}
                            onChange={(e) => updateCardPlacement(selectedCardId, { visible: e.target.checked })}
                            className="w-4 h-4 accent-orange-500 rounded"
                          />
                        </label>
                      </div>

                      {/* Position X / Position Y */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Posição X (Horizontal)</span>
                            <span className="font-mono text-slate-400">{currentCardConf.x || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-350"
                            max="350"
                            step="5"
                            value={currentCardConf.x || 0}
                            onChange={(e) => updateCardPlacement(selectedCardId, { x: parseInt(e.target.value, 10) })}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Posição Y (Vertical)</span>
                            <span className="font-mono text-slate-400">{currentCardConf.y || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-400"
                            max="400"
                            step="5"
                            value={currentCardConf.y || 0}
                            onChange={(e) => updateCardPlacement(selectedCardId, { y: parseInt(e.target.value, 10) })}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Card Scale Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Tamanho / Escala do Card</span>
                          <span className="font-mono text-orange-400">{Math.round((currentCardConf.scale || 1.0) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.3"
                          step="0.05"
                          value={currentCardConf.scale || 1.0}
                          onChange={(e) => updateCardPlacement(selectedCardId, { scale: parseFloat(e.target.value) })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>

                      {/* Font Size / Text Scale Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 flex items-center gap-1">
                            <Type className="w-3.5 h-3.5 text-orange-400" />
                            <span>Tamanho das Fontes / Texto das Métricas</span>
                          </span>
                          <span className="font-mono text-orange-400">{Math.round((currentCardConf.fontSizeScale || 1.0) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.5"
                          step="0.05"
                          value={currentCardConf.fontSizeScale || 1.0}
                          onChange={(e) => updateCardPlacement(selectedCardId, { fontSizeScale: parseFloat(e.target.value) })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>

                      {/* Card Background / Transparency Toggle */}
                      <div className="border-t border-slate-700/60 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-orange-400" />
                            <span>Fundo do Card</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {currentCardConf.transparentBackground ? 'Sem Fundo (Transparente)' : 'Com Fundo (Padrão do Tema)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateCardPlacement(selectedCardId, { transparentBackground: false })}
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              !currentCardConf.transparentBackground
                                ? 'border-orange-500 bg-orange-500/15 text-white shadow-sm'
                                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-orange-400" />
                            <span>Com Fundo (Padrão)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCardPlacement(selectedCardId, { 
                              transparentBackground: true,
                              // Auto-enable text shadow when removing background for superior readability
                              textShadow: currentCardConf.textShadow ?? true
                            })}
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              currentCardConf.transparentBackground
                                ? 'border-orange-500 bg-orange-500/15 text-white shadow-sm'
                                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                            }`}
                          >
                            <EyeOff className="w-3.5 h-3.5 text-orange-400" />
                            <span>Sem Fundo (Flutuante)</span>
                          </button>
                        </div>
                        {currentCardConf.transparentBackground && (
                          <p className="text-[10px] text-orange-400/90 mt-1.5">
                            Fundo e bordas removidos. Os dados flutuam diretamente sobre o mapa/foto.
                          </p>
                        )}
                      </div>

                      {/* Text Color Controls */}
                      <div className="border-t border-slate-700/60 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-orange-400" />
                            <span>Cor dos Textos & Valores</span>
                          </span>
                          {(currentCardConf.textColor || currentCardConf.labelColor) && (
                            <button
                              type="button"
                              onClick={() => updateCardPlacement(selectedCardId, { textColor: undefined, labelColor: undefined })}
                              className="text-[10px] font-bold text-orange-400 hover:text-orange-300 underline"
                            >
                              Restaurar Cores do Tema
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Primary Text Color */}
                          <div>
                            <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                              <span>Texto Principal (Valores e Título):</span>
                              <span className="font-mono text-[10px] text-slate-300">
                                {currentCardConf.textColor || 'Padrão do Tema'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {QUICK_TEXT_COLORS.map(c => (
                                <button
                                  key={`prim-${c.hex}`}
                                  type="button"
                                  onClick={() => updateCardPlacement(selectedCardId, { textColor: c.hex })}
                                  className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                                    currentCardConf.textColor === c.hex 
                                      ? 'scale-125 border-orange-500 shadow-md ring-2 ring-orange-500/30' 
                                      : 'border-slate-600 hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.label}
                                >
                                  {currentCardConf.textColor === c.hex && (
                                    <Check className={`w-3 h-3 ${c.hex === '#FFFFFF' || c.hex === '#FACC15' || c.hex === '#22D3EE' || c.hex === '#4ADE80' || c.hex === '#CBD5E1' ? 'text-black' : 'text-white'}`} />
                                  )}
                                </button>
                              ))}
                              {/* Custom Color Input */}
                              <label 
                                className="relative flex items-center justify-center w-6 h-6 rounded-full border border-slate-600 cursor-pointer overflow-hidden hover:scale-110 transition-transform bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500" 
                                title="Cor personalizada"
                              >
                                <input
                                  type="color"
                                  value={currentCardConf.textColor || '#FFFFFF'}
                                  onChange={(e) => updateCardPlacement(selectedCardId, { textColor: e.target.value })}
                                  className="absolute -inset-2 w-10 h-10 opacity-0 cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Secondary / Label Color */}
                          <div>
                            <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                              <span>Rótulos e Unidades (Distância, Tempo, Pace):</span>
                              <span className="font-mono text-[10px] text-slate-300">
                                {currentCardConf.labelColor || (currentCardConf.textColor ? 'Acompanha Principal' : 'Padrão do Tema')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {QUICK_TEXT_COLORS.map(c => (
                                <button
                                  key={`lbl-${c.hex}`}
                                  type="button"
                                  onClick={() => updateCardPlacement(selectedCardId, { labelColor: c.hex })}
                                  className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                                    currentCardConf.labelColor === c.hex 
                                      ? 'scale-125 border-orange-500 shadow-md ring-2 ring-orange-500/30' 
                                      : 'border-slate-600 hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.label}
                                >
                                  {currentCardConf.labelColor === c.hex && (
                                    <Check className={`w-3 h-3 ${c.hex === '#FFFFFF' || c.hex === '#FACC15' || c.hex === '#22D3EE' || c.hex === '#4ADE80' || c.hex === '#CBD5E1' ? 'text-black' : 'text-white'}`} />
                                  )}
                                </button>
                              ))}
                              <label 
                                className="relative flex items-center justify-center w-6 h-6 rounded-full border border-slate-600 cursor-pointer overflow-hidden hover:scale-110 transition-transform bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500" 
                                title="Cor personalizada dos rótulos"
                              >
                                <input
                                  type="color"
                                  value={currentCardConf.labelColor || '#CBD5E1'}
                                  onChange={(e) => updateCardPlacement(selectedCardId, { labelColor: e.target.value })}
                                  className="absolute -inset-2 w-10 h-10 opacity-0 cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Text Shadow Controls */}
                      <div className="border-t border-slate-700/60 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                            <span>Sombra nos Textos (Alto Contraste)</span>
                          </span>
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
                            <span>{currentCardConf.textShadow ? 'Ativada' : 'Desativada'}</span>
                            <input
                              type="checkbox"
                              checked={Boolean(currentCardConf.textShadow)}
                              onChange={(e) => updateCardPlacement(selectedCardId, { 
                                textShadow: e.target.checked,
                                textShadowStyle: currentCardConf.textShadowStyle || 'strong'
                              })}
                              className="w-4 h-4 accent-orange-500 rounded"
                            />
                          </label>
                        </div>

                        {currentCardConf.textShadow && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
                            {[
                              { id: 'subtle', label: 'Sutil', desc: 'Suave' },
                              { id: 'strong', label: 'Forte', desc: 'Destaque' },
                              { id: 'outline', label: 'Contorno', desc: 'Nítido' },
                              { id: 'glow', label: 'Brilho', desc: 'Glow Neon' }
                            ].map(style => (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => updateCardPlacement(selectedCardId, { textShadowStyle: style.id as any })}
                                className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                                  (currentCardConf.textShadowStyle || 'strong') === style.id
                                    ? 'border-orange-500 bg-orange-500/15 text-white shadow-sm'
                                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                                }`}
                              >
                                <div className="text-[11px] font-bold">{style.label}</div>
                                <div className="text-[9px] text-slate-400">{style.desc}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          onClick={() => updateCardPlacement(selectedCardId, { 
                            x: 0, 
                            y: 0, 
                            scale: 1.0, 
                            fontSizeScale: 1.0,
                            transparentBackground: false,
                            textColor: undefined,
                            labelColor: undefined,
                            textShadow: false,
                            textShadowStyle: 'strong'
                          })}
                          className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          Restaurar Padrão Deste Card
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dedicated Controls for Background (Photo vs Map) */}
                  {selectedCardId === 'map' && config.backgroundType === 'photo' && (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                          <Camera className="w-4 h-4" />
                          <span>Ajustes da Foto Pessoal</span>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold text-orange-400 hover:text-orange-300 underline"
                        >
                          Trocar Foto
                        </button>
                      </div>

                      {/* Photo Zoom Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Zoom da Foto</span>
                          <span className="font-mono text-orange-400">{(config.photoZoom ?? 1.0).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="3.0"
                          step="0.05"
                          value={config.photoZoom ?? 1.0}
                          onChange={(e) => setConfig(prev => ({ ...prev, photoZoom: parseFloat(e.target.value) }))}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>

                      {/* Photo Pan X / Pan Y */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Posição Horizontal</span>
                            <span className="font-mono text-slate-400">{config.photoPanX ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            step="10"
                            value={config.photoPanX ?? 0}
                            onChange={(e) => setConfig(prev => ({ ...prev, photoPanX: parseInt(e.target.value, 10) }))}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Posição Vertical</span>
                            <span className="font-mono text-slate-400">{config.photoPanY ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            step="10"
                            value={config.photoPanY ?? 0}
                            onChange={(e) => setConfig(prev => ({ ...prev, photoPanY: parseInt(e.target.value, 10) }))}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Photo Brightness & Contrast */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Sun className="w-3.5 h-3.5 text-amber-400" />
                              <span>Brilho</span>
                            </span>
                            <span className="font-mono text-slate-400">{(config.photoBrightness ?? 0) > 0 ? `+${config.photoBrightness}` : config.photoBrightness ?? 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="5"
                            value={config.photoBrightness ?? 0}
                            onChange={(e) => setConfig(prev => ({ ...prev, photoBrightness: parseInt(e.target.value, 10) }))}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Contrast className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Contraste</span>
                            </span>
                            <span className="font-mono text-slate-400">{(config.photoContrast ?? 0) > 0 ? `+${config.photoContrast}` : config.photoContrast ?? 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="5"
                            value={config.photoContrast ?? 0}
                            onChange={(e) => setConfig(prev => ({ ...prev, photoContrast: parseInt(e.target.value, 10) }))}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Photo Overlay Dimming */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Escurecimento de Fundo (Legibilidade dos Dados)</span>
                          <span className="font-mono text-orange-400">{config.photoOverlayOpacity ?? 25}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          step="5"
                          value={config.photoOverlayOpacity ?? 25}
                          onChange={(e) => setConfig(prev => ({ ...prev, photoOverlayOpacity: parseInt(e.target.value, 10) }))}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>

                      {/* Route Over Photo Tuning */}
                      <div className="border-t border-slate-700/60 pt-3">
                        <div className="text-xs font-bold text-slate-300 mb-2">Traçado da Rota GPS Sobre a Foto:</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-400">Escala da Rota</span>
                              <span className="font-mono text-slate-400">{(config.mapZoom ?? 1.0).toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2.5"
                              step="0.05"
                              value={config.mapZoom ?? 1.0}
                              onChange={(e) => setConfig(prev => ({ ...prev, mapZoom: parseFloat(e.target.value) }))}
                              className="w-full accent-orange-500 cursor-pointer"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-400">Rotação</span>
                              <span className="font-mono text-slate-400">{config.mapRotation ?? 0}°</span>
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              step="5"
                              value={config.mapRotation ?? 0}
                              onChange={(e) => setConfig(prev => ({ ...prev, mapRotation: parseInt(e.target.value, 10) }))}
                              className="w-full accent-orange-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dedicated Controls for Map */}
                  {selectedCardId === 'map' && config.backgroundType !== 'photo' && (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                        <ZoomIn className="w-4 h-4" />
                        <span>Enquadramento e Cartografia</span>
                      </div>

                      {/* Zoom Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Zoom do Mapa</span>
                          <span className="font-mono text-orange-400">{(config.mapZoom ?? 1.0).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="3.0"
                          step="0.05"
                          value={config.mapZoom ?? 1.0}
                          onChange={(e) => setConfig(prev => ({ ...prev, mapZoom: parseFloat(e.target.value) }))}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>

                      {/* Pan X / Pan Y */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Deslocamento X</span>
                            <span className="font-mono text-slate-400">{config.mapPanX ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-400"
                            max="400"
                            step="10"
                            value={config.mapPanX ?? 0}
                            onChange={(e) => setConfig(prev => ({ ...prev, mapPanX: parseInt(e.target.value, 10) }))}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">Deslocamento Y</span>
                            <span className="font-mono text-slate-400">{config.mapPanY ?? 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            step="10"
                            value={config.mapPanY ?? 0}
                            onChange={(e) => setConfig(prev => ({ ...prev, mapPanY: parseInt(e.target.value, 10) }))}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Rotation Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Rotação do Percurso</span>
                          <span className="font-mono text-slate-400">{config.mapRotation ?? 0}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={config.mapRotation ?? 0}
                          onChange={(e) => setConfig(prev => ({ ...prev, mapRotation: parseInt(e.target.value, 10) }))}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
                )
              )}

              {/* TAB 3: PRIVACY & MAP TOGGLES */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Privacidade Residencial (200m)</div>
                          <div className="text-xs text-slate-400">
                            Oculta automaticamente os primeiros e últimos 200m da rota no Story
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.obfuscatePrivacyMeters}
                        onChange={(e) => setConfig(prev => ({ ...prev, obfuscatePrivacyMeters: e.target.checked }))}
                        className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Ocultar Mapa por Completo</div>
                          <div className="text-xs text-slate-400">
                            Exibe apenas mostrador atlético e métricas de desempenho
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.hideMap}
                        onChange={(e) => setConfig(prev => ({ ...prev, hideMap: e.target.checked }))}
                        className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Ocultar Traçado da Rota</div>
                          <div className="text-xs text-slate-400">
                            Mantém o mapa de fundo estilizado sem a linha do trajeto
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.hideRoute}
                        onChange={(e) => setConfig(prev => ({ ...prev, hideRoute: e.target.checked }))}
                        className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      <strong>Proteção de Dados:</strong> O PaceLab não armazena suas coordenadas em servidores externos. Toda a arte e vídeo são gerados 100% no seu próprio navegador.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: VISIBLE METRICS */}
              {activeTab === 'metrics' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Escolha quais informações e métricas de telemetria devem aparecer no Story:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'distance', label: 'Distância Total (km)' },
                      { key: 'duration', label: 'Tempo Total' },
                      { key: 'pace', label: 'Pace Médio / Velocidade' },
                      { key: 'avgHr', label: 'Frequência Cardíaca (bpm)' },
                      { key: 'calories', label: 'Calorias (kcal)' },
                      { key: 'elevation', label: 'Altimetria / Elevação' },
                      { key: 'vdot', label: 'Índice VDOT de Daniels' },
                      { key: 'athleteName', label: 'Nome do Atleta' },
                      { key: 'date', label: 'Data da Atividade' }
                    ].map(m => (
                      <label 
                        key={m.key} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-200">{m.label}</span>
                        <input
                          type="checkbox"
                          checked={(config.visibleMetrics as any)[m.key]}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setConfig(prev => ({
                              ...prev,
                              visibleMetrics: { ...prev.visibleMetrics, [m.key]: val }
                            }));
                          }}
                          className="w-4 h-4 accent-orange-500 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: EXPORT & FORMAT SELECTION */}
              {activeTab === 'export' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Formato de Compartilhamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setConfig(prev => ({ ...prev, exportFormat: 'image' }))}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                          config.exportFormat === 'image'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-6 h-6 text-[#FC4C02]" />
                        <div>
                          <div className="font-bold text-xs">Imagem Estática (PNG)</div>
                          <div className="text-[10px] text-slate-400">Arte finalizada 1080x1920</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setConfig(prev => ({ ...prev, exportFormat: 'video' }))}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                          config.exportFormat === 'video'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-6 h-6 text-[#FC4C02]" />
                        <div>
                          <div className="font-bold text-xs">Vídeo Fluido 60 FPS</div>
                          <div className="text-[10px] text-slate-400">Animação contínua sem saltos</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Video Duration Selector if Video format */}
                  {config.exportFormat === 'video' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Duração da Animação do Vídeo
                      </label>
                      <div className="flex gap-2">
                        {[
                          { sec: 5, label: '5s (Rápido)' },
                          { sec: 8, label: '8s (Ideal)' },
                          { sec: 12, label: '12s (Cinemático)' },
                          { sec: 15, label: '15s (Story Completo)' }
                        ].map(d => (
                          <button
                            key={d.sec}
                            onClick={() => setConfig(prev => ({ ...prev, videoDurationSeconds: d.sec }))}
                            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                              config.videoDurationSeconds === d.sec
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons to Generate */}
                  <div className="pt-2 space-y-3">
                    <button
                      onClick={() => handleExport(config.exportFormat)}
                      disabled={isGenerating}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FC4C02] to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isGenerating 
                          ? 'Processando...' 
                          : config.exportFormat === 'video' ? 'Gerar Vídeo 60 FPS 9:16' : 'Gerar Imagem Estática 9:16'}
                      </span>
                    </button>

                    {/* If generated, show Download & Share Buttons */}
                    {generatedMediaUrl && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fade-in">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <Check className="w-4 h-4" />
                          <span>Arquivo 1080x1920 gerado com sucesso!</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={handleNativeShare}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                          >
                            <Instagram className="w-4 h-4" />
                            <span>Postar Stories</span>
                          </button>

                          <button
                            onClick={handleDownloadFile}
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                          >
                            <Download className="w-4 h-4" />
                            <span>Baixar Arquivo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          {/* Bottom Actions Footer */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between z-20">
            <span className="text-[11px] text-slate-400">
              Instagram Stories (1080 × 1920) • 60 FPS
            </span>
            <button
              onClick={() => {
                if (activeTab !== 'export') setActiveTab('export');
                else handleExport(config.exportFormat);
              }}
              className="px-5 py-2 rounded-xl bg-[#FC4C02] hover:bg-orange-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-orange-950/30"
            >
              <span>{activeTab === 'export' ? 'Renderizar Agora' : 'Avançar para Exportação'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
