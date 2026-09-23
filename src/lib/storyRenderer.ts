import { UserActivity, StoryConfig, RoutePoint, CardPlacement } from '../types';
import { buildContinuousArcLengthRoute, getRouteSliceAtRatio, ArcLengthRoute } from './routeInterpolator';
import { 
  renderTemplate1_CourseData, 
  renderTemplate2_StravaApp, 
  renderTemplate3_RunEditorial, 
  renderTemplate4_EnRoute,
  renderTemplate5_RaceCourseMap
} from './storyTemplates';

/**
 * Strava-Authentic Story Canvas & Video Rendering Engine (1080 x 1920 px - 9:16 Full Screen)
 * Produces pixel-perfect Instagram Stories where the map is the 100% full-screen background,
 * telemetry cards sit comfortably at the top and bottom edges (outside safe zones),
 * and GPS animation is interpolated at sub-meter precision at 60fps.
 */

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 350;
export const SAFE_SIDE = 54;

// Authentic Strava color definitions
export const THEME_PALETTES = {
  clean_white: {
    bg: '#F3F4F6',
    cardBg: 'rgba(255, 255, 255, 0.94)',
    cardBorder: '#E5E7EB',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    mapBg: '#E5E7EB',
    mapRoad: '#FFFFFF',
    mapPark: '#DCFCE7',
    mapWater: '#E0F2FE',
    routeHalo: '#FFFFFF',
    divider: '#E2E8F0'
  },
  dark_obsidian: {
    bg: '#0F1115',
    cardBg: 'rgba(24, 25, 29, 0.92)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    mapBg: '#0F1115',
    mapRoad: '#1E232E',
    mapPark: '#13241C',
    mapWater: '#0C1E2C',
    routeHalo: '#0B0C10',
    divider: '#262932'
  },
  minimalist: {
    bg: '#000000',
    cardBg: 'rgba(18, 18, 20, 0.9)',
    cardBorder: '#27272A',
    cardShadow: 'rgba(0, 0, 0, 0.6)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    mapBg: '#09090B',
    mapRoad: '#18181B',
    mapPark: '#141E18',
    mapWater: '#0E1720',
    routeHalo: '#000000',
    divider: '#202024'
  },
  neon_runner: {
    bg: '#0B0D13',
    cardBg: 'rgba(20, 23, 32, 0.92)',
    cardBorder: 'rgba(252, 76, 2, 0.3)',
    cardShadow: 'rgba(0, 0, 0, 0.6)',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    mapBg: '#090B10',
    mapRoad: '#191F2C',
    mapPark: '#12251D',
    mapWater: '#0D2030',
    routeHalo: '#0B0D13',
    divider: '#242B3A'
  },
  sunset_gold: {
    bg: '#141014',
    cardBg: 'rgba(29, 23, 30, 0.92)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    textPrimary: '#FFFBEB',
    textSecondary: '#D4C3D0',
    textMuted: '#8C7A8A',
    mapBg: '#120E12',
    mapRoad: '#251E27',
    mapPark: '#1C2219',
    mapWater: '#161F29',
    routeHalo: '#141014',
    divider: '#2F2631'
  },
  athletic_carbon: {
    bg: '#121214',
    cardBg: 'rgba(28, 28, 32, 0.92)',
    cardBorder: '#2E2E34',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    mapBg: '#111114',
    mapRoad: '#222227',
    mapPark: '#17221C',
    mapWater: '#121C26',
    routeHalo: '#121214',
    divider: '#2C2C33'
  }
};

/**
 * Image Cache for Personal Photo Backgrounds (Selfies, Race photos)
 */
export const storyImageCache = new Map<string, HTMLImageElement>();
if (typeof window !== 'undefined') {
  (window as any).__storyPhotoCache = storyImageCache;
}

export function preloadStoryPhoto(url: string): Promise<HTMLImageElement> {
  if (!url) return Promise.reject(new Error('URL de foto inválida'));
  
  if (storyImageCache.has(url)) {
    const cached = storyImageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      storyImageCache.set(url, img);
      if (typeof window !== 'undefined') {
        (window as any).__storyPhotoCache = storyImageCache;
      }
      resolve(img);
    };
    img.onerror = (err) => {
      console.warn('Erro ao carregar imagem para Story:', err);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Common: Render Safe Zone Guides for Instagram
 */
export function renderSafeZoneGuides(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, SAFE_TOP);
  ctx.fillRect(0, CANVAS_HEIGHT - SAFE_BOTTOM, CANVAS_WIDTH, SAFE_BOTTOM);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.setLineDash([12, 8]);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, SAFE_TOP);
  ctx.lineTo(CANVAS_WIDTH, SAFE_TOP);
  ctx.moveTo(0, CANVAS_HEIGHT - SAFE_BOTTOM);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - SAFE_BOTTOM);
  ctx.stroke();

  ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.font = 'bold 22px -apple-system, sans-serif';
  ctx.fillText('▲ SAFE ZONE TOP (Instagram UI)', SAFE_SIDE, SAFE_TOP - 20);
  ctx.fillText('▼ SAFE ZONE BOTTOM (Instagram Reply Bar)', SAFE_SIDE, CANVAS_HEIGHT - SAFE_BOTTOM + 40);
  ctx.restore();
}

/**
 * Filter route points according to privacy (strip initial & final 200m)
 */
export function applyPrivacyToRoute(route: RoutePoint[], obfuscate200m: boolean): RoutePoint[] {
  if (!route || route.length < 10 || !obfuscate200m) return route;
  const trimCount = Math.max(2, Math.floor(route.length * 0.08));
  return route.slice(trimCount, route.length - trimCount);
}

/**
 * Number & Time Interpolators for Video Animations
 */
function interpolateNumber(start: number, end: number, ratio: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, ratio));
}

function formatPaceFromSeconds(sec: number): string {
  if (!sec || isNaN(sec) || sec <= 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeFromSeconds(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Memoized route interpolator cache to prevent recalculating Catmull-Rom on every single frame
 */
const routeInterpolationCache = new Map<string, ArcLengthRoute>();

export function getCachedInterpolatedRoute(activityId: string, rawRoute: RoutePoint[], obfuscate: boolean): ArcLengthRoute {
  const cacheKey = `${activityId}_${obfuscate ? 'priv' : 'full'}_${rawRoute.length}`;
  let cached = routeInterpolationCache.get(cacheKey);
  if (!cached) {
    const filtered = applyPrivacyToRoute(rawRoute, obfuscate);
    cached = buildContinuousArcLengthRoute(filtered, 2.0); // 2-meter sub-stepping
    routeInterpolationCache.set(cacheKey, cached);
  }
  return cached;
}

export interface StoryCardBounds {
  id: 'header' | 'primary' | 'secondary' | 'badge';
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get calculated bounding boxes for all cards for hit-testing and dragging across all 5 templates
 */
export function getCardBoundingBoxes(config: StoryConfig, showSecondaryMetrics: boolean = true): StoryCardBounds[] {
  const tplId = config.templateId ?? 0;
  const boxes: StoryCardBounds[] = [];
  const baseCardWidth = CANVAS_WIDTH - (SAFE_SIDE * 2);

  const hConf = config.headerCard || { x: 0, y: 0, scale: 1.0, visible: true };
  const pConf = config.primaryMetricsCard || { x: 0, y: 0, scale: 1.0, visible: true };
  const sConf = config.secondaryMetricsCard || { x: 0, y: 0, scale: 1.0, visible: true };

  // =========================================================================
  // TEMPLATE 1 — COURSE DATA
  // =========================================================================
  if (tplId === 1) {
    // Header: Top title & race info (top portion of upper bar)
    if (hConf.visible !== false) {
      const scale = hConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 100 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (hConf.x || 0);
      const y = (SAFE_TOP - 40) + (hConf.y || 0);
      boxes.push({ id: 'header', x, y, width, height });
    }
    // Primary: Course Data technical table (bottom portion of upper bar)
    if (pConf.visible !== false) {
      const scale = pConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 230 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (pConf.x || 0);
      const y = (SAFE_TOP + 65) + (pConf.y || 0);
      boxes.push({ id: 'primary', x, y, width, height });
    }
    // Secondary: Elevation Profile chart (footer card)
    if (sConf.visible !== false) {
      const scale = sConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 420 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (sConf.x || 0);
      const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - 420 + 120;
      const y = defaultY + (sConf.y || 0);
      boxes.push({ id: 'secondary', x, y, width, height });
    }
    return boxes;
  }

  // =========================================================================
  // TEMPLATE 2 — STRAVA APP
  // =========================================================================
  if (tplId === 2) {
    // Header: Card Topo Esquerdo (Atleta, Atividade, Local, Data, Hora)
    if (hConf.visible !== false) {
      const scale = hConf.scale || 1.0;
      const width = 460 * scale;
      const height = 250 * scale;
      const x = SAFE_SIDE + (hConf.x || 0);
      const y = (SAFE_TOP - 20) + (hConf.y || 0);
      boxes.push({ id: 'header', x, y, width, height });
    }
    // Primary: Painel de Mapa Lateral Direito (40% da tela)
    if (pConf.visible !== false) {
      const scale = pConf.scale || 1.0;
      const width = 440 * scale;
      const height = 680 * scale;
      const x = (CANVAS_WIDTH - SAFE_SIDE - 440) + (pConf.x || 0);
      const y = (SAFE_TOP - 20) + (pConf.y || 0);
      boxes.push({ id: 'primary', x, y, width, height });
    }
    // Secondary: 3 Cards Esportivos Inferiores + Gráfico de Altitude
    if (sConf.visible !== false) {
      const scale = sConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 250 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (sConf.x || 0);
      const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - 230;
      const y = defaultY + (sConf.y || 0);
      boxes.push({ id: 'secondary', x, y, width, height });
    }
    return boxes;
  }

  // =========================================================================
  // TEMPLATE 3 — RUN EDITORIAL
  // =========================================================================
  if (tplId === 3) {
    // Header: Topo Editorial com Título RUN / at your own pace / Telemetria
    if (hConf.visible !== false) {
      const scale = hConf.scale || 1.0;
      const width = 540 * scale;
      const height = 350 * scale;
      const x = (CANVAS_WIDTH - SAFE_SIDE - width) + (hConf.x || 0);
      const y = (SAFE_TOP - 20) + (hConf.y || 0);
      boxes.push({ id: 'header', x, y, width, height });
    }
    // Primary: Bloco de Métricas no Rodapé Esquerdo
    if (pConf.visible !== false) {
      const scale = pConf.scale || 1.0;
      const width = 440 * scale;
      const height = 250 * scale;
      const x = SAFE_SIDE + (pConf.x || 0);
      const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - 245;
      const y = defaultY + (pConf.y || 0);
      boxes.push({ id: 'primary', x, y, width, height });
    }
    // Secondary: Mini-Rota no Rodapé Direito
    if (sConf.visible !== false) {
      const scale = sConf.scale || 1.0;
      const width = 220 * scale;
      const height = 220 * scale;
      const x = (CANVAS_WIDTH - SAFE_SIDE - width) + (sConf.x || 0);
      const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - 195;
      const y = defaultY + (sConf.y || 0);
      boxes.push({ id: 'secondary', x, y, width, height });
    }
    return boxes;
  }

  // =========================================================================
  // TEMPLATE 4 — EN ROUTE
  // =========================================================================
  if (tplId === 4) {
    // Header: Título Superior "EN ROUTE" + Subtítulo
    if (hConf.visible !== false) {
      const scale = hConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 110 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (hConf.x || 0);
      const y = (SAFE_TOP - 10) + (hConf.y || 0);
      boxes.push({ id: 'header', x, y, width, height });
    }
    // Primary: Janela do Mapa Central com Rota Azul
    if (pConf.visible !== false) {
      const scale = pConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 820 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (pConf.x || 0);
      const y = (SAFE_TOP + 120) + (pConf.y || 0);
      boxes.push({ id: 'primary', x, y, width, height });
    }
    // Secondary: Badges Flutuantes / Rodapé
    if (sConf.visible !== false) {
      const scale = sConf.scale || 1.0;
      const width = baseCardWidth * scale;
      const height = 110 * scale;
      const x = (CANVAS_WIDTH - width) / 2 + (sConf.x || 0);
      const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM + 20;
      const y = defaultY + (sConf.y || 0);
      boxes.push({ id: 'secondary', x, y, width, height });
    }
    return boxes;
  }

  // =========================================================================
  // TEMPLATE 0 — STRAVA CLASSIC (PADRÃO INTOCADO)
  // =========================================================================
  // 1. Header Card
  if (hConf.visible !== false) {
    const scale = hConf.scale || 1.0;
    const width = baseCardWidth * scale;
    const height = 118 * scale;
    const x = (CANVAS_WIDTH - width) / 2 + (hConf.x || 0);
    const y = SAFE_TOP + 18 + (hConf.y || 0);
    boxes.push({ id: 'header', x, y, width, height });
  }

  // 2. Primary Metrics Card
  if (pConf.visible !== false) {
    const scale = pConf.scale || 1.0;
    const width = baseCardWidth * scale;
    const height = 156 * scale;
    const x = (CANVAS_WIDTH - width) / 2 + (pConf.x || 0);
    const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - (showSecondaryMetrics ? 262 : 170);
    const y = defaultY + (pConf.y || 0);
    boxes.push({ id: 'primary', x, y, width, height });
  }

  // 3. Secondary Metrics Card
  if (sConf.visible !== false && showSecondaryMetrics) {
    const scale = sConf.scale || 1.0;
    const width = baseCardWidth * scale;
    const height = 94 * scale;
    const x = (CANVAS_WIDTH - width) / 2 + (sConf.x || 0);
    const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - 94;
    const y = defaultY + (sConf.y || 0);
    boxes.push({ id: 'secondary', x, y, width, height });
  }

  return boxes;
}

/**
 * Main Frame Renderer on 1080 x 1920 Canvas (100% Full-Screen Map Background)
 */
export function renderStoryFrame(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1, // 0 to 1 for animations
  options: { showSafeZoneGuides?: boolean; selectedId?: string | null } = {}
) {
  // Global subpixel antialiasing & high quality smoothing settings
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Dispatch dedicated new templates (1, 2, 3, 4, 5)
  if (config.templateId === 1) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTemplate1_CourseData(ctx, activity, athleteName, config, progressRatio);
    if (options.showSafeZoneGuides || config.showSafeZones) renderSafeZoneGuides(ctx);
    return;
  }
  if (config.templateId === 2) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTemplate2_StravaApp(ctx, activity, athleteName, config, progressRatio);
    if (options.showSafeZoneGuides || config.showSafeZones) renderSafeZoneGuides(ctx);
    return;
  }
  if (config.templateId === 3) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTemplate3_RunEditorial(ctx, activity, athleteName, config, progressRatio);
    if (options.showSafeZoneGuides || config.showSafeZones) renderSafeZoneGuides(ctx);
    return;
  }
  if (config.templateId === 4) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTemplate4_EnRoute(ctx, activity, athleteName, config, progressRatio);
    if (options.showSafeZoneGuides || config.showSafeZones) renderSafeZoneGuides(ctx);
    return;
  }
  if (config.templateId === 5) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTemplate5_RaceCourseMap(ctx, activity, athleteName, config, progressRatio);
    if (options.showSafeZoneGuides || config.showSafeZones) renderSafeZoneGuides(ctx);
    return;
  }

  // Template 0 — Padrão Atual (existente, integralmente preservado)
  const palette = THEME_PALETTES[config.theme] || THEME_PALETTES.clean_white;
  const STRAVA_ORANGE = config.accentColor || '#FC4C02';

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // ==========================================
  // 1. FULL-SCREEN 100% BACKGROUND (PHOTO OR MAP)
  // ==========================================
  const isPhotoMode = config.backgroundType === 'photo';

  if (isPhotoMode && config.customPhotoUrl) {
    ctx.save();
    // Base dark fallback in case photo is loading
    ctx.fillStyle = '#0F1115';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cachedImg = storyImageCache.get(config.customPhotoUrl);
    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      // Apply Photo Brightness and Contrast Filters
      const brightness = 100 + (config.photoBrightness || 0);
      const contrast = 100 + (config.photoContrast || 0);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Aspect Cover calculation
      const naturalW = cachedImg.naturalWidth || cachedImg.width;
      const naturalH = cachedImg.naturalHeight || cachedImg.height;
      const baseScale = Math.max(CANVAS_WIDTH / naturalW, CANVAS_HEIGHT / naturalH);
      const zoom = baseScale * (config.photoZoom || 1.0);
      const dw = naturalW * zoom;
      const dh = naturalH * zoom;
      const dx = (CANVAS_WIDTH - dw) / 2 + (config.photoPanX || 0);
      const dy = (CANVAS_HEIGHT - dh) / 2 + (config.photoPanY || 0);

      ctx.drawImage(cachedImg, dx, dy, dw, dh);
      ctx.filter = 'none';

      // Contrast Overlay Tint (Dark or Light)
      const overlayOpacity = Math.max(0, Math.min(0.85, (config.photoOverlayOpacity ?? 25) / 100));
      if (overlayOpacity > 0) {
        ctx.fillStyle = config.photoOverlayTheme === 'light'
          ? `rgba(255, 255, 255, ${overlayOpacity})`
          : `rgba(0, 0, 0, ${overlayOpacity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    } else {
      // Trigger background preload if not yet cached
      preloadStoryPhoto(config.customPhotoUrl).catch(() => {});
    }
    ctx.restore();

    // Render GPS Route on top of Photo (if present and not hidden)
    const rawRoute = activity.route || [];
    if (rawRoute.length > 2 && !config.hideRoute) {
      ctx.save();
      const zoom = Math.max(0.4, Math.min(3.5, config.mapZoom ?? 1.0));
      const panX = config.mapPanX ?? 0;
      const panY = config.mapPanY ?? 0;
      const rotationDeg = config.mapRotation ?? 0;

      ctx.translate(CANVAS_WIDTH / 2 + panX, CANVAS_HEIGHT / 2 + panY);
      if (rotationDeg !== 0) ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

      const interpolated = getCachedInterpolatedRoute(activity.id, rawRoute, config.obfuscatePrivacyMeters);
      const allPoints = interpolated.points;

      let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
      allPoints.forEach(pt => {
        if (pt.lat < minLat) minLat = pt.lat;
        if (pt.lat > maxLat) maxLat = pt.lat;
        if (pt.lng < minLon) minLon = pt.lng;
        if (pt.lng > maxLon) maxLon = pt.lng;
      });

      const latSpan = Math.max(0.0006, maxLat - minLat);
      const lonSpan = Math.max(0.0006, maxLon - minLon);
      const routeAreaPaddingX = 140;
      const routeAreaPaddingY = 480;
      const availableW = CANVAS_WIDTH - (routeAreaPaddingX * 2);
      const availableH = CANVAS_HEIGHT - (routeAreaPaddingY * 2);

      const projX = (lng: number) => routeAreaPaddingX + ((lng - minLon) / lonSpan) * availableW;
      const projY = (lat: number) => (CANVAS_HEIGHT - routeAreaPaddingY) - ((lat - minLat) / latSpan) * availableH;

      const animRatio = config.animationStyle === 'complete' ? 1 : progressRatio;
      const { points: animatedPoints, currentHead } = getRouteSliceAtRatio(interpolated, animRatio);

      if (animatedPoints.length > 1) {
        // High contrast halo for photo
        ctx.strokeStyle = config.photoOverlayTheme === 'light' ? 'rgba(0,0,0,0.6)' : '#FFFFFF';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        animatedPoints.forEach((pt, i) => {
          const px = projX(pt.lng);
          const py = projY(pt.lat);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Strava Orange Line
        ctx.strokeStyle = STRAVA_ORANGE;
        ctx.lineWidth = 7;
        ctx.beginPath();
        animatedPoints.forEach((pt, i) => {
          const px = projX(pt.lng);
          const py = projY(pt.lat);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Start Pin
        if (allPoints.length > 0) {
          const startX = projX(allPoints[0].lng);
          const startY = projY(allPoints[0].lat);
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(startX, startY, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }

        // Head Pin
        if (currentHead) {
          const headX = projX(currentHead.lng);
          const headY = projY(currentHead.lat);
          if (animRatio < 1) {
            ctx.fillStyle = 'rgba(252, 76, 2, 0.4)';
            ctx.beginPath();
            ctx.arc(headX, headY, 22, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(headX, headY, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  } else {
    // Standard Procedural Map Canvas
    ctx.save();
    ctx.fillStyle = palette.mapBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!config.hideMap) {
      const zoom = Math.max(0.4, Math.min(3.5, config.mapZoom ?? 1.0));
      const panX = config.mapPanX ?? 0;
      const panY = config.mapPanY ?? 0;
      const rotationDeg = config.mapRotation ?? 0;

      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2 + panX, CANVAS_HEIGHT / 2 + panY);
      if (rotationDeg !== 0) {
        ctx.rotate((rotationDeg * Math.PI) / 180);
      }
      ctx.scale(zoom, zoom);
      ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

      // Procedural Cartography
      ctx.fillStyle = palette.mapPark;
      ctx.beginPath();
      ctx.ellipse(280, 480, 320, 240, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(820, 1400, 380, 280, -Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(150, 1600, 280, 200, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.mapWater;
      ctx.beginPath();
      ctx.ellipse(880, 520, 260, 190, -Math.PI / 8, 0, Math.PI * 2);
      ctx.ellipse(920, 850, 200, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = palette.mapRoad;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      const roadSpacing = 160;
      for (let rx = -400; rx < CANVAS_WIDTH + 600; rx += roadSpacing) {
        ctx.beginPath();
        ctx.moveTo(rx - 120, -200);
        ctx.lineTo(rx + 120, CANVAS_HEIGHT + 200);
        ctx.stroke();
      }
      for (let ry = -200; ry < CANVAS_HEIGHT + 400; ry += roadSpacing) {
        ctx.beginPath();
        ctx.moveTo(-200, ry - 80);
        ctx.lineTo(CANVAS_WIDTH + 200, ry + 80);
        ctx.stroke();
      }

      // Route
      const rawRoute = activity.route || [];
      if (rawRoute.length > 0 && !config.hideRoute) {
        const interpolated = getCachedInterpolatedRoute(activity.id, rawRoute, config.obfuscatePrivacyMeters);
        const allPoints = interpolated.points;

        if (allPoints.length > 0) {
          let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
          allPoints.forEach(pt => {
            if (pt.lat < minLat) minLat = pt.lat;
            if (pt.lat > maxLat) maxLat = pt.lat;
            if (pt.lng < minLon) minLon = pt.lng;
            if (pt.lng > maxLon) maxLon = pt.lng;
          });

          const midLat = (minLat + maxLat) / 2;
          const cosLat = Math.cos((midLat * Math.PI) / 180);

          const latSpan = Math.max(0.0006, maxLat - minLat);
          const lonSpan = Math.max(0.0006, (maxLon - minLon) * cosLat);

          const routeAreaPaddingX = 140;
          const routeAreaPaddingY = 480;
          const availableW = CANVAS_WIDTH - (routeAreaPaddingX * 2);
          const availableH = CANVAS_HEIGHT - (routeAreaPaddingY * 2);

          // Preserve exact geographical aspect ratio so track isn't distorted
          const scale = Math.min(availableW / lonSpan, availableH / latSpan);
          const renderW = lonSpan * scale;
          const renderH = latSpan * scale;
          const offsetX = routeAreaPaddingX + (availableW - renderW) / 2;
          const offsetY = routeAreaPaddingY + (availableH - renderH) / 2;

          const projX = (lng: number) => offsetX + (((lng - minLon) * cosLat) / lonSpan) * renderW;
          const projY = (lat: number) => (offsetY + renderH) - ((lat - minLat) / latSpan) * renderH;

          const animRatio = config.animationStyle === 'complete' ? 1 : progressRatio;
          const { points: animatedPoints, currentHead } = getRouteSliceAtRatio(interpolated, animRatio);

          if (animatedPoints.length > 1) {
            ctx.strokeStyle = palette.routeHalo;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            animatedPoints.forEach((pt, i) => {
              const px = projX(pt.lng);
              const py = projY(pt.lat);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();

            ctx.strokeStyle = STRAVA_ORANGE;
            ctx.lineWidth = 7;
            ctx.beginPath();
            animatedPoints.forEach((pt, i) => {
              const px = projX(pt.lng);
              const py = projY(pt.lat);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();

            if (allPoints.length > 0) {
              const startX = projX(allPoints[0].lng);
              const startY = projY(allPoints[0].lat);
              ctx.fillStyle = '#10B981';
              ctx.beginPath();
              ctx.arc(startX, startY, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 3.5;
              ctx.stroke();
            }

            if (currentHead) {
              const headX = projX(currentHead.lng);
              const headY = projY(currentHead.lat);

              if (animRatio < 1) {
                ctx.fillStyle = 'rgba(252, 76, 2, 0.4)';
                ctx.beginPath();
                ctx.arc(headX, headY, 22, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.fillStyle = '#0F172A';
              ctx.beginPath();
              ctx.arc(headX, headY, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 3.5;
              ctx.stroke();
            }
          }
        }
      } else if (rawRoute.length === 0 && !config.hideRoute) {
        const cx = CANVAS_WIDTH / 2;
        const cy = CANVAS_HEIGHT / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = STRAVA_ORANGE;
        ctx.font = '900 88px -apple-system, sans-serif';
        const displayDistance = (activity.distanceKm * progressRatio).toFixed(2);
        ctx.fillText(`${displayDistance} km`, cx, cy);
        ctx.font = '700 24px -apple-system, sans-serif';
        ctx.fillStyle = palette.textSecondary;
        ctx.fillText('DISTÂNCIA ACUMULADA', cx, cy + 56);
      }

      ctx.restore();
    }
    ctx.restore();
  }

  // ==========================================
  // 3. SAFE ZONE GUIDES (Development/Preview)
  // ==========================================
  if (options.showSafeZoneGuides || config.showSafeZones) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, SAFE_TOP);
    ctx.fillRect(0, CANVAS_HEIGHT - SAFE_BOTTOM, CANVAS_WIDTH, SAFE_BOTTOM);

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.setLineDash([12, 8]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, SAFE_TOP);
    ctx.lineTo(CANVAS_WIDTH, SAFE_TOP);
    ctx.moveTo(0, CANVAS_HEIGHT - SAFE_BOTTOM);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - SAFE_BOTTOM);
    ctx.stroke();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillText('▲ SAFE ZONE TOP (Instagram UI)', SAFE_SIDE, SAFE_TOP - 20);
    ctx.fillText('▼ SAFE ZONE BOTTOM (Instagram Reply Bar)', SAFE_SIDE, CANVAS_HEIGHT - SAFE_BOTTOM + 40);
    ctx.restore();
  }

  const baseCardWidth = CANVAS_WIDTH - (SAFE_SIDE * 2);

  // Helper to apply text shadow based on card configuration
  const applyCardTextShadow = (cardConf: CardPlacement) => {
    if (cardConf.textShadow) {
      const style = cardConf.textShadowStyle || 'strong';
      if (style === 'subtle') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      } else if (style === 'strong') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
      } else if (style === 'glow') {
        ctx.shadowColor = cardConf.textColor || STRAVA_ORANGE;
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else if (style === 'outline') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  };

  const clearShadow = () => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // =========================================================
  // 4. INDIVIDUAL CARD 1: TOP STRAVA HEADER CARD
  // =========================================================
  const hConf = config.headerCard || { x: config.cardOffsetX || 0, y: config.cardOffsetY || 0, scale: config.cardScale || 1.0, visible: true };
  if (hConf.visible !== false) {
    const scale = hConf.scale || 1.0;
    const cardWidth = baseCardWidth * scale;
    const headerHeight = 118 * scale;
    const headerX = (CANVAS_WIDTH - cardWidth) / 2 + (hConf.x || 0);
    const headerY = SAFE_TOP + 18 + (hConf.y || 0);
    const isTransparent = Boolean(hConf.transparentBackground);

    ctx.save();
    
    // Card Surface (skip background fill if transparent)
    if (!isTransparent) {
      ctx.shadowColor = palette.cardShadow;
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = palette.cardBg;
      ctx.strokeStyle = options.selectedId === 'header' ? '#FC4C02' : palette.cardBorder;
      ctx.lineWidth = options.selectedId === 'header' ? 3 : 1.5;
      drawRoundedRect(ctx, headerX, headerY, cardWidth, headerHeight, 18 * scale);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();
    } else if (options.selectedId === 'header') {
      // Draw selection boundary dashed line when transparent
      ctx.strokeStyle = '#FC4C02';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      drawRoundedRect(ctx, headerX, headerY, cardWidth, headerHeight, 18 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Sport Icon Box
    const iconBoxSize = 72 * scale;
    const iconBoxX = headerX + 18 * scale;
    const iconBoxY = headerY + (headerHeight - iconBoxSize) / 2;
    
    ctx.fillStyle = isTransparent ? 'rgba(0, 0, 0, 0.35)' : 'rgba(252, 76, 2, 0.12)';
    if (isTransparent && hConf.textShadow) {
      applyCardTextShadow(hConf);
    }
    drawRoundedRect(ctx, iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 14 * scale);
    ctx.fill();
    clearShadow();

    // Sport Icon Glyph (Running Silhouette / Activity Icon)
    const iconColor = hConf.textColor || STRAVA_ORANGE;
    ctx.fillStyle = iconColor;
    ctx.beginPath();
    ctx.arc(iconBoxX + iconBoxSize / 2, iconBoxY + 26 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4 * scale;
    ctx.strokeStyle = iconColor;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(iconBoxX + iconBoxSize / 2, iconBoxY + 36 * scale);
    ctx.lineTo(iconBoxX + iconBoxSize / 2 - 4 * scale, iconBoxY + 50 * scale);
    ctx.lineTo(iconBoxX + iconBoxSize / 2 + 12 * scale, iconBoxY + 62 * scale);
    ctx.moveTo(iconBoxX + iconBoxSize / 2, iconBoxY + 42 * scale);
    ctx.lineTo(iconBoxX + iconBoxSize / 2 - 12 * scale, iconBoxY + 60 * scale);
    ctx.stroke();

    // Title & Athlete Info Text Colors
    const textLeft = iconBoxX + iconBoxSize + 20 * scale;
    const athleteDisplay = (config.visibleMetrics.athleteName && athleteName) ? athleteName : 'Atleta';
    const activityTitle = config.customTitle || activity.title || 'Treino de Corrida';
    const fontScale = (hConf.fontSizeScale || 1.0);
    const headerPrimaryColor = hConf.textColor || palette.textPrimary;
    const headerSecondaryColor = hConf.labelColor || (hConf.textColor ? hConf.textColor : palette.textSecondary);

    // Apply Text Shadow
    applyCardTextShadow(hConf);

    ctx.font = `800 ${Math.round(30 * scale * fontScale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = headerPrimaryColor;
    ctx.textAlign = 'left';
    ctx.fillText(activityTitle.slice(0, 26), textLeft, headerY + 48 * scale);

    const actDate = new Date(activity.date);
    const dateFormatted = !isNaN(actDate.getTime())
      ? `${actDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às ${actDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      : activity.date;

    ctx.font = `600 ${Math.round(20 * scale * fontScale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = headerSecondaryColor;
    ctx.fillText(`${athleteDisplay} • ${dateFormatted}`, textLeft, headerY + 84 * scale);

    clearShadow();

    // Selected indicator dot if currently editing
    if (options.selectedId === 'header') {
      ctx.fillStyle = '#FC4C02';
      ctx.beginPath();
      ctx.arc(headerX + cardWidth - 16, headerY + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Telemetry Interpolations from GPX Route Head Point
  const rawRoutePoints = activity.route || [];
  let activeHeadPoint: any = null;

  if (rawRoutePoints.length > 0) {
    const interpolated = getCachedInterpolatedRoute(activity.id, rawRoutePoints, config.obfuscatePrivacyMeters);
    const animRatio = config.animationStyle === 'complete' ? 1 : progressRatio;
    const slice = getRouteSliceAtRatio(interpolated, animRatio);
    activeHeadPoint = slice.currentHead;
  }

  const currentDistanceKm = activeHeadPoint
    ? activeHeadPoint.dist / 1000
    : interpolateNumber(0, activity.distanceKm, progressRatio);

  const currentDurationSec = (activeHeadPoint && activeHeadPoint.elapsedSec !== undefined && activeHeadPoint.elapsedSec > 0)
    ? activeHeadPoint.elapsedSec
    : interpolateNumber(0, activity.durationSeconds, progressRatio);

  const isWalking = activity.type === 'walk';
  const currentSpeed = (activeHeadPoint && activeHeadPoint.speed && activeHeadPoint.speed > 0)
    ? activeHeadPoint.speed
    : (activity.speedAvgKmh || (activity.distanceKm / (Math.max(1, activity.durationSeconds) / 3600)));

  const currentPaceSec = (activeHeadPoint && activeHeadPoint.speed && activeHeadPoint.speed > 0)
    ? Math.round(3600 / activeHeadPoint.speed)
    : (currentDistanceKm > 0.05 && currentDurationSec > 0 ? Math.round(currentDurationSec / currentDistanceKm) : activity.paceSecondsPerKm);

  const currentElevationMeters = (activeHeadPoint && activeHeadPoint.cumEleGain !== undefined && activeHeadPoint.cumEleGain > 0)
    ? activeHeadPoint.cumEleGain
    : (activity.elevationGainMeters !== undefined ? Math.round(activity.elevationGainMeters * (currentDistanceKm / Math.max(0.1, activity.distanceKm))) : 0);

  const currentHr = (activeHeadPoint && activeHeadPoint.hr)
    ? activeHeadPoint.hr
    : (activity.avgHr ?? null);

  const totalCalories = activity.calories || Math.round(activity.distanceKm * 68);
  const currentCalories = Math.round((currentDistanceKm / Math.max(0.1, activity.distanceKm)) * totalCalories);

  // Determine whether to show secondary metrics
  const showSecondary = config.visibleMetrics.elevation || config.visibleMetrics.avgHr || config.visibleMetrics.calories;

  // =========================================================
  // 5. INDIVIDUAL CARD 2: "THE BIG THREE" PRIMARY METRICS
  // =========================================================
  const pConf = config.primaryMetricsCard || { x: config.cardOffsetX || 0, y: config.cardOffsetY || 0, scale: config.cardScale || 1.0, visible: true };
  if (pConf.visible !== false) {
    const scale = pConf.scale || 1.0;
    const cardWidth = baseCardWidth * scale;
    const primaryHeight = 156 * scale;
    const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - (showSecondary ? 262 : 170);
    const bottomPanelY = defaultY + (pConf.y || 0);
    const bottomPanelX = (CANVAS_WIDTH - cardWidth) / 2 + (pConf.x || 0);
    const isTransparent = Boolean(pConf.transparentBackground);

    ctx.save();
    
    // Main Panel Box (skip background fill if transparent)
    if (!isTransparent) {
      ctx.shadowColor = palette.cardShadow;
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = -6;
      ctx.fillStyle = palette.cardBg;
      ctx.strokeStyle = options.selectedId === 'primary' ? '#FC4C02' : palette.cardBorder;
      ctx.lineWidth = options.selectedId === 'primary' ? 3 : 1.5;
      drawRoundedRect(ctx, bottomPanelX, bottomPanelY, cardWidth, primaryHeight, 22 * scale);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();
    } else if (options.selectedId === 'primary') {
      // Selection outline for transparent card
      ctx.strokeStyle = '#FC4C02';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      drawRoundedRect(ctx, bottomPanelX, bottomPanelY, cardWidth, primaryHeight, 22 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const colWidth = cardWidth / 3;
    const heroMetrics = [
      {
        label: 'DISTÂNCIA',
        value: `${currentDistanceKm.toFixed(2)}`,
        unit: 'km',
        show: config.visibleMetrics.distance
      },
      {
        label: 'TEMPO',
        value: formatTimeFromSeconds(currentDurationSec),
        unit: '',
        show: config.visibleMetrics.duration
      },
      {
        label: isWalking ? 'VELOC. MÉDIA' : 'RITMO MÉDIO',
        value: isWalking ? `${currentSpeed.toFixed(1)}` : formatPaceFromSeconds(currentPaceSec),
        unit: isWalking ? 'km/h' : '/km',
        show: config.visibleMetrics.pace
      }
    ];

    const fontScale = (pConf.fontSizeScale || 1.0);
    const primaryTextColor = pConf.textColor || palette.textPrimary;
    const primaryLabelColor = pConf.labelColor || (pConf.textColor ? pConf.textColor : palette.textMuted);
    const primaryUnitColor = pConf.labelColor || pConf.textColor || palette.textSecondary;

    heroMetrics.forEach((metric, idx) => {
      if (!metric.show) return;
      const colX = bottomPanelX + (idx * colWidth);

      // Vertical Divider
      if (idx > 0) {
        ctx.strokeStyle = isTransparent ? 'rgba(255, 255, 255, 0.15)' : palette.divider;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(colX, bottomPanelY + 22 * scale);
        ctx.lineTo(colX, bottomPanelY + primaryHeight - 22 * scale);
        ctx.stroke();
      }

      // Apply Text Shadow
      applyCardTextShadow(pConf);

      // Metric Label
      ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round(15 * scale * fontScale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = primaryLabelColor;
      ctx.fillText(metric.label, colX + colWidth / 2, bottomPanelY + 44 * scale);

      // Value + Unit
      ctx.font = `800 ${Math.round(44 * scale * fontScale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = primaryTextColor;
      const valText = metric.value;
      const unitText = metric.unit ? ` ${metric.unit}` : '';

      if (unitText) {
        const valWidth = ctx.measureText(valText).width;
        ctx.font = `600 ${Math.round(22 * scale * fontScale)}px -apple-system, sans-serif`;
        const unitWidth = ctx.measureText(unitText).width;
        const totalW = valWidth + unitWidth;
        const startX = colX + (colWidth - totalW) / 2;

        ctx.textAlign = 'left';
        ctx.font = `800 ${Math.round(44 * scale * fontScale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = primaryTextColor;
        ctx.fillText(valText, startX, bottomPanelY + 104 * scale);

        ctx.font = `600 ${Math.round(22 * scale * fontScale)}px -apple-system, sans-serif`;
        ctx.fillStyle = primaryUnitColor;
        ctx.fillText(unitText, startX + valWidth, bottomPanelY + 104 * scale);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(valText, colX + colWidth / 2, bottomPanelY + 104 * scale);
      }

      clearShadow();
    });

    if (options.selectedId === 'primary') {
      ctx.fillStyle = '#FC4C02';
      ctx.beginPath();
      ctx.arc(bottomPanelX + cardWidth - 16, bottomPanelY + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================
  // 6. INDIVIDUAL CARD 3: SECONDARY METRICS (Elevation, HR, Calories)
  // =========================================================
  const sConf = config.secondaryMetricsCard || { x: config.cardOffsetX || 0, y: config.cardOffsetY || 0, scale: config.cardScale || 1.0, visible: true };
  if (sConf.visible !== false && showSecondary) {
    const scale = sConf.scale || 1.0;
    const cardWidth = baseCardWidth * scale;
    const secHeight = 94 * scale;
    const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - 94;
    const secPanelY = defaultY + (sConf.y || 0);
    const secPanelX = (CANVAS_WIDTH - cardWidth) / 2 + (sConf.x || 0);
    const isTransparent = Boolean(sConf.transparentBackground);

    ctx.save();
    
    // Background Surface (skip background fill if transparent)
    if (!isTransparent) {
      ctx.shadowColor = palette.cardShadow;
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = -4;
      ctx.fillStyle = palette.cardBg;
      ctx.strokeStyle = options.selectedId === 'secondary' ? '#FC4C02' : palette.cardBorder;
      ctx.lineWidth = options.selectedId === 'secondary' ? 3 : 1.5;
      drawRoundedRect(ctx, secPanelX, secPanelY, cardWidth, secHeight, 18 * scale);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();
    } else if (options.selectedId === 'secondary') {
      ctx.strokeStyle = '#FC4C02';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      drawRoundedRect(ctx, secPanelX, secPanelY, cardWidth, secHeight, 18 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const secColWidth = cardWidth / 3;
    const secondaryMetrics = [
      {
        label: 'GANHO ELEV.',
        value: `▲ ${currentElevationMeters} m`,
        show: config.visibleMetrics.elevation
      },
      {
        label: 'FC MÉDIA',
        value: currentHr ? `♥ ${currentHr} bpm` : '♥ -- bpm',
        show: config.visibleMetrics.avgHr
      },
      {
        label: 'CALORIAS',
        value: `🔥 ${currentCalories} kcal`,
        show: config.visibleMetrics.calories
      }
    ];

    const fontScale = (sConf.fontSizeScale || 1.0);
    const secPrimaryColor = sConf.textColor || palette.textPrimary;
    const secLabelColor = sConf.labelColor || (sConf.textColor ? sConf.textColor : palette.textMuted);

    secondaryMetrics.forEach((sec, idx) => {
      if (!sec.show) return;
      const sx = secPanelX + (idx * secColWidth);

      if (idx > 0) {
        ctx.strokeStyle = isTransparent ? 'rgba(255, 255, 255, 0.15)' : palette.divider;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, secPanelY + 16 * scale);
        ctx.lineTo(sx, secPanelY + secHeight - 16 * scale);
        ctx.stroke();
      }

      // Apply Text Shadow
      applyCardTextShadow(sConf);

      ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round(14 * scale * fontScale)}px -apple-system, sans-serif`;
      ctx.fillStyle = secLabelColor;
      ctx.fillText(sec.label, sx + secColWidth / 2, secPanelY + 32 * scale);

      ctx.font = `800 ${Math.round(24 * scale * fontScale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = secPrimaryColor;
      ctx.fillText(sec.value, sx + secColWidth / 2, secPanelY + 68 * scale);

      clearShadow();
    });

    if (options.selectedId === 'secondary') {
      ctx.fillStyle = '#FC4C02';
      ctx.beginPath();
      ctx.arc(secPanelX + cardWidth - 16, secPanelY + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Utility: Draw Rounded Rectangle in Canvas 2D
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generate Static PNG Image Blob
 */
export async function generateStaticStoryImage(
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig
): Promise<Blob> {
  // Preload photo if photo background is selected
  if (config.backgroundType === 'photo' && config.customPhotoUrl) {
    try {
      await preloadStoryPhoto(config.customPhotoUrl);
    } catch (e) {
      console.warn('Foto não pôde ser pré-carregada para imagem estática:', e);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar o contexto 2D do Canvas.');

  // Render complete final frame (progress = 1)
  renderStoryFrame(ctx, activity, athleteName, config, 1, { showSafeZoneGuides: false });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar blob de imagem PNG.'));
    }, 'image/png', 0.95);
  });
}

/**
 * Generate Ultra-Smooth Animated Video (WebM / MP4) via MediaRecorder @ 60 FPS
 */
export async function generateAnimatedStoryVideo(
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  onProgress?: (ratio: number, statusText: string) => void
): Promise<{ blob: Blob; url: string; mimeType: string }> {
  // Preload photo if photo background is selected
  if (config.backgroundType === 'photo' && config.customPhotoUrl) {
    if (onProgress) onProgress(0.05, 'Carregando foto em alta resolução...');
    try {
      await preloadStoryPhoto(config.customPhotoUrl);
    } catch (e) {
      console.warn('Foto não pôde ser pré-carregada para vídeo:', e);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;  // 1080px
  canvas.height = CANVAS_HEIGHT; // 1920px
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: false,
    willReadFrequently: false
  });
  if (!ctx) throw new Error('Falha ao inicializar Canvas 2D');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // High-fidelity codecs for 60fps ultra-sharp text and graphics
  const candidateMimeTypes = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];

  const chosenMimeType = candidateMimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';

  const durationSec = Math.max(4, Math.min(15, config.videoDurationSeconds || 8));
  const fps = 60; // Ultra-fluid 60 FPS
  const totalFrames = durationSec * fps;

  // Ultra-high bitrate (30 Mbps) to eliminate text/number compression blur and artifacts
  const targetBitrate = 30000000;

  // Capture stream setup with high quality frame control
  let stream: MediaStream;
  let useManualTrackRequest = false;

  try {
    stream = canvas.captureStream(0);
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    if (track && typeof track.requestFrame === 'function') {
      useManualTrackRequest = true;
    } else {
      stream = canvas.captureStream(fps);
    }
  } catch (e) {
    stream = canvas.captureStream(fps);
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: chosenMimeType || undefined,
      videoBitsPerSecond: targetBitrate
    });
  } catch (err) {
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: chosenMimeType || undefined,
        videoBitsPerSecond: 16000000
      });
    } catch (err2) {
      recorder = new MediaRecorder(stream);
    }
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const actualMime = recorder.mimeType || chosenMimeType || 'video/webm';
      const videoBlob = new Blob(chunks, { type: actualMime });
      const videoUrl = URL.createObjectURL(videoBlob);
      if (onProgress) onProgress(1, 'Vídeo 60 FPS Ultra HD gerado com sucesso!');
      resolve({ blob: videoBlob, url: videoUrl, mimeType: actualMime });
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start(100);

    let currentFrame = 0;
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    const frameIntervalMs = 1000 / fps; // 16.666ms per frame

    const renderNextFrame = () => {
      if (currentFrame >= totalFrames) {
        setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, 200);
        return;
      }

      const linearRatio = currentFrame / Math.max(1, totalFrames - 1);
      let ratio = linearRatio;

      if (config.animationStyle === 'loop') {
        ratio = Math.sin((linearRatio * Math.PI) / 2);
      } else {
        ratio = linearRatio;
      }

      // Ensure crisp subpixel graphics & antialiasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      renderStoryFrame(ctx, activity, athleteName, config, ratio, { showSafeZoneGuides: false });

      if (useManualTrackRequest && track && typeof track.requestFrame === 'function') {
        try {
          track.requestFrame();
        } catch (e) {
          // ignore
        }
      }

      currentFrame++;
      if (onProgress && currentFrame % 15 === 0) {
        const pct = Math.round(linearRatio * 100);
        onProgress(linearRatio, `Renderizando 60 FPS Ultra HD (${pct}% - Frame ${currentFrame}/${totalFrames})...`);
      }

      setTimeout(renderNextFrame, frameIntervalMs);
    };

    // Begin render sequence
    renderNextFrame();
  });
}
