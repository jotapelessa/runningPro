import { UserActivity, StoryConfig, RoutePoint } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  SAFE_TOP, 
  SAFE_BOTTOM, 
  SAFE_SIDE, 
  applyPrivacyToRoute,
  getCachedInterpolatedRoute,
  storyImageCache
} from './storyRenderer';
import { getRouteSliceAtRatio } from './routeInterpolator';
import { renderCourseDataTemplate } from './courseDataTemplate';
import { renderStravaAppTemplate } from './stravaAppTemplate';
import { renderRunEditorialTemplate } from './runEditorialTemplate';
import { renderEnRouteTemplate } from './enRouteTemplate';
import { renderRaceCourseMapTemplate } from './raceCourseMapTemplate';

/**
 * Utility: Draw Rounded Rectangle in Canvas 2D
 */
export function drawRoundedRectPath(
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
 * Common: Render Background (Photo or Neutral Backdrop)
 * Supports custom brightness, contrast, zoom and pan
 */
export function renderBasePhotoBackground(
  ctx: CanvasRenderingContext2D,
  config: StoryConfig,
  filterMode: 'normal' | 'grayscale' = 'normal',
  fallbackColor: string = '#0F1115'
) {
  ctx.save();
  ctx.fillStyle = fallbackColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const customPhoto = config.customPhotoUrl;
  let hasDrawnPhoto = false;

  if (customPhoto) {
    // Look up cached image
    const img = storyImageCache.get(customPhoto) || (window as any).__storyPhotoCache?.get(customPhoto) || 
      (document.querySelector(`img[src="${customPhoto}"]`) as HTMLImageElement);

    if (img && img.complete && img.naturalWidth > 0) {
      const brightness = 100 + (config.photoBrightness || 0);
      const contrast = 100 + (config.photoContrast || 0);
      
      if (filterMode === 'grayscale') {
        ctx.filter = `grayscale(100%) contrast(${contrast}%) brightness(${brightness}%)`;
      } else {
        ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
      }

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const baseScale = Math.max(CANVAS_WIDTH / naturalW, CANVAS_HEIGHT / naturalH);
      const zoom = baseScale * (config.photoZoom || 1.0);
      const dw = naturalW * zoom;
      const dh = naturalH * zoom;
      const dx = (CANVAS_WIDTH - dw) / 2 + (config.photoPanX || 0);
      const dy = (CANVAS_HEIGHT - dh) / 2 + (config.photoPanY || 0);

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
      hasDrawnPhoto = true;

      // Overlay Opacity
      const overlayOpacity = Math.max(0, Math.min(0.85, (config.photoOverlayOpacity ?? 25) / 100));
      if (overlayOpacity > 0) {
        ctx.fillStyle = config.photoOverlayTheme === 'light'
          ? `rgba(255, 255, 255, ${overlayOpacity})`
          : `rgba(0, 0, 0, ${overlayOpacity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
  }

  if (!hasDrawnPhoto) {
    // Elegant fallback gradient when no personal photo is available
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, fallbackColor);
    grad.addColorStop(0.5, '#1A1D24');
    grad.addColorStop(1, '#090B0E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  ctx.restore();
}

/**
 * Format date in Portuguese / International friendly
 */
function formatStoryDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || 'HOJE';
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr || '';
  }
}

function formatStoryTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '07:00';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '07:00';
  }
}

/**
 * Extract Elevation Profile & Extremes from route points
 */
interface ElevationProfileData {
  elevations: number[];
  minEle: number;
  maxEle: number;
  gain: number;
  peakIndex: number;
}

function extractElevationProfile(activity: UserActivity): ElevationProfileData | null {
  const points = activity.route || [];
  const rawElevations = points.map(p => p.ele).filter((e): e is number => typeof e === 'number' && !isNaN(e));
  
  if (rawElevations.length < 5) {
    // If route has no elevation but activity has gain
    if (activity.elevationGainMeters && activity.elevationGainMeters > 0) {
      const gain = Math.round(activity.elevationGainMeters);
      const min = 20;
      const max = min + gain;
      // Synthesize a graceful elevation curve
      const synth: number[] = [];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const curve = Math.sin(ratio * Math.PI) * gain * 0.8 + (ratio * gain * 0.2);
        synth.push(Math.round(min + curve));
      }
      return {
        elevations: synth,
        minEle: min,
        maxEle: max,
        gain,
        peakIndex: Math.floor(steps * 0.6)
      };
    }
    return null;
  }

  // Downsample to ~50-80 points for smooth canvas rendering
  const targetSamples = 60;
  const step = Math.max(1, Math.floor(rawElevations.length / targetSamples));
  const sampled: number[] = [];
  let minEle = Infinity;
  let maxEle = -Infinity;
  let peakIndex = 0;

  for (let i = 0; i < rawElevations.length; i += step) {
    const ele = Math.round(rawElevations[i]);
    sampled.push(ele);
    if (ele < minEle) minEle = ele;
    if (ele > maxEle) {
      maxEle = ele;
      peakIndex = sampled.length - 1;
    }
  }

  const gain = activity.elevationGainMeters && activity.elevationGainMeters > 0 
    ? Math.round(activity.elevationGainMeters) 
    : Math.max(0, Math.round(maxEle - minEle));

  return {
    elevations: sampled,
    minEle: isFinite(minEle) ? minEle : 0,
    maxEle: isFinite(maxEle) ? maxEle : 100,
    gain,
    peakIndex
  };
}

// ============================================================================
// TEMPLATE 1 — COURSE DATA (Editorial B&W, Tabela Topo, Perfil Verde-Limão)
// ============================================================================
export function renderTemplate1_CourseData(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  renderCourseDataTemplate(ctx, activity, athleteName, config, progressRatio);
}

// ============================================================================
// TEMPLATE 2 — STRAVA APP (Card Topo Esquerdo, Mapa Lateral, 3 Cards + Altimetria)
// ============================================================================
export function renderTemplate2_StravaApp(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  renderStravaAppTemplate(ctx, activity, athleteName, config, progressRatio);
}

// ============================================================================
// TEMPLATE 3 — RUN EDITORIAL (Totalmente Customizável com Tipografia Completa)
// ============================================================================
export function renderTemplate3_RunEditorial(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  renderRunEditorialTemplate(ctx, activity, athleteName, config, progressRatio);
}

// ============================================================================
// TEMPLATE 4 — EN ROUTE (Editorial Centralizado, Mapa Flutuante com Badges, Rota Azul)
// ============================================================================
export function renderTemplate4_EnRoute(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  renderEnRouteTemplate(ctx, activity, athleteName, config, progressRatio);
}

// ============================================================================
// TEMPLATE 5 — RACE COURSE MAP (Mapa de Percurso, Legenda Lateral, Tipografia Total)
// ============================================================================
export function renderTemplate5_RaceCourseMap(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  renderRaceCourseMapTemplate(ctx, activity, athleteName, config, progressRatio);
}


