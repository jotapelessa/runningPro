import { 
  UserActivity, 
  StoryConfig, 
  RunEditorialConfig,
  RunEditorialMetricItem,
  TypographyConfig
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  SAFE_TOP, 
  SAFE_BOTTOM, 
  SAFE_SIDE,
  storyImageCache,
  preloadStoryPhoto,
  getCachedInterpolatedRoute
} from './storyRenderer';
import { getRouteSliceAtRatio } from './routeInterpolator';
import { createDefaultTypography, renderCustomTypographyText } from './stravaAppTemplate';

/**
 * Utility: Draw Rounded Rectangle in Canvas 2D
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Hex to RGBA string helper
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  if (hex.startsWith('rgba')) return hex;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Draw crisp minimalist vector icons on Canvas 2D
 */
export function drawVectorIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  centerX: number,
  centerY: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = size;
  const h = s / 2;

  switch (type) {
    case 'pin':
      // Location Pin
      ctx.beginPath();
      ctx.arc(0, -h * 0.35, h * 0.55, Math.PI, 0);
      ctx.bezierCurveTo(h * 0.55, h * 0.1, 0, h * 0.9, 0, h);
      ctx.bezierCurveTo(0, h * 0.9, -h * 0.55, h * 0.1, -h * 0.55, -h * 0.35);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, -h * 0.35, h * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'navigation':
      // Navigation Arrow
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(h * 0.8, h * 0.8);
      ctx.lineTo(0, h * 0.3);
      ctx.lineTo(-h * 0.8, h * 0.8);
      ctx.closePath();
      ctx.fill();
      break;

    case 'globe':
      // Globe
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, h * 0.45, h * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-h * 0.85, 0);
      ctx.lineTo(h * 0.85, 0);
      ctx.stroke();
      break;

    case 'zap':
      // Lightning Zap
      ctx.beginPath();
      ctx.moveTo(h * 0.2, -h);
      ctx.lineTo(-h * 0.6, h * 0.1);
      ctx.lineTo(-h * 0.05, h * 0.1);
      ctx.lineTo(-h * 0.2, h);
      ctx.lineTo(h * 0.6, -h * 0.1);
      ctx.lineTo(h * 0.05, -h * 0.1);
      ctx.closePath();
      ctx.fill();
      break;

    case 'stopwatch':
      // Stopwatch
      ctx.beginPath();
      ctx.arc(0, h * 0.15, h * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.6);
      ctx.lineTo(0, -h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-h * 0.25, -h);
      ctx.lineTo(h * 0.25, -h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, h * 0.15);
      ctx.lineTo(h * 0.35, -h * 0.15);
      ctx.stroke();
      break;

    case 'mountain':
      // Mountain Elevation
      ctx.beginPath();
      ctx.moveTo(-h, h * 0.8);
      ctx.lineTo(-h * 0.2, -h * 0.6);
      ctx.lineTo(h * 0.35, h * 0.3);
      ctx.lineTo(h * 0.7, -h * 0.15);
      ctx.lineTo(h, h * 0.8);
      ctx.closePath();
      ctx.stroke();
      break;

    case 'heart':
      // Heart Rate
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.bezierCurveTo(-h * 0.9, h * 0.1, -h * 0.9, -h * 0.7, 0, -h * 0.3);
      ctx.bezierCurveTo(h * 0.9, -h * 0.7, h * 0.9, h * 0.1, 0, h * 0.6);
      ctx.fill();
      break;

    case 'flame':
      // Flame / Calories
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.bezierCurveTo(h * 0.8, -h * 0.1, h * 0.7, h * 0.8, 0, h * 0.9);
      ctx.bezierCurveTo(-h * 0.7, h * 0.8, -h * 0.8, -h * 0.1, 0, -h);
      ctx.fill();
      break;

    case 'sparkles':
    default:
      // Minimalist Sparkle Star
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.quadraticCurveTo(0, 0, h, 0);
      ctx.quadraticCurveTo(0, 0, 0, h);
      ctx.quadraticCurveTo(0, 0, -h, 0);
      ctx.quadraticCurveTo(0, 0, 0, -h);
      ctx.fill();
      break;
  }

  ctx.restore();
}

/**
 * Standard factory defaults for Template 3 — Run Editorial
 */
export function getDefaultRunEditorialConfig(
  activity?: UserActivity, 
  athleteName?: string
): RunEditorialConfig {
  // Activity title and date formatting
  const rawTitle = activity?.title || 'São Paulo, Brasil';
  let dateFormatted = '20 DE SETEMBRO DE 2026';
  let timeFormatted = '07:15';
  let dayMonthFormatted = '20 SET';

  if (activity?.date) {
    try {
      const d = new Date(activity.date);
      if (!isNaN(d.getTime())) {
        dateFormatted = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        timeFormatted = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        dayMonthFormatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
      }
    } catch {
      // fallback
    }
  }

  const isWalk = activity?.type === 'walk';
  const mainTitleText = isWalk ? 'WALK' : 'RUN';
  const distVal = activity?.distanceKm ? activity.distanceKm.toFixed(2) : '10.00';
  const paceVal = activity?.paceFormatted || '4:52';
  const durationVal = activity?.durationFormatted || '48:40';
  const elevationVal = activity?.elevationGainMeters ? `${Math.round(activity.elevationGainMeters)}` : '124';

  return {
    background: {
      type: 'photo',
      solidColor: '#121316',
      filterMode: 'normal',
      brightness: 0,
      contrast: 5,
      saturation: 0,
      blur: 0,
      overlayColor: '#000000',
      overlayOpacity: 10,
      topVignetteOpacity: 45,
      bottomVignetteOpacity: 65,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0
    },

    topLocation: {
      enabled: true,
      text: rawTitle.toUpperCase(),
      xPct: 94.0, // top right alignment
      yPct: 6.2,  // inside safe top
      iconEnabled: true,
      iconType: 'pin',
      iconColor: '#FFFFFF',
      iconSize: 15,
      typography: createDefaultTypography({
        fontFamily: 'Montserrat',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 3,
        color: '#FFFFFF',
        textAlign: 'right',
        textTransform: 'uppercase',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.9)',
        shadowBlur: 8,
        shadowOffsetY: 2
      })
    },

    mainTitle: {
      enabled: true,
      text: mainTitleText,
      xPct: 94.0,
      yPct: 14.8,
      typography: createDefaultTypography({
        fontFamily: 'Oswald',
        fontSize: 135,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: -2,
        color: '#FFFFFF',
        textAlign: 'right',
        textTransform: 'uppercase',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.85)',
        shadowBlur: 16,
        shadowOffsetY: 4
      })
    },

    subtitle: {
      enabled: true,
      text: 'at your own pace',
      xPct: 94.0,
      yPct: 20.8,
      typography: createDefaultTypography({
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 24,
        fontWeight: '300',
        fontStyle: 'normal',
        letterSpacing: 4,
        color: '#E2E8F0',
        textAlign: 'right',
        textTransform: 'none',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.8)',
        shadowBlur: 10,
        shadowOffsetY: 2
      })
    },

    dateTime: {
      enabled: true,
      dateEnabled: true,
      timeEnabled: true,
      separatorEnabled: true,
      dateText: dayMonthFormatted,
      timeText: timeFormatted,
      separatorText: '|',
      separatorColor: '#94A3B8',
      xPct: 94.0,
      yPct: 24.2,
      dateTypography: createDefaultTypography({
        fontFamily: 'Space Grotesk',
        fontSize: 18,
        fontWeight: '500',
        letterSpacing: 3,
        color: '#F1F5F9',
        textAlign: 'right',
        shadowEnabled: true,
        shadowBlur: 8
      }),
      timeTypography: createDefaultTypography({
        fontFamily: 'Space Grotesk',
        fontSize: 18,
        fontWeight: '400',
        letterSpacing: 2,
        color: '#CBD5E1',
        textAlign: 'right',
        shadowEnabled: true,
        shadowBlur: 8
      }),
      separatorTypography: createDefaultTypography({
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '300',
        letterSpacing: 2,
        color: '#94A3B8',
        textAlign: 'center'
      })
    },

    userQuote: {
      enabled: true,
      text: athleteName ? `RUNNER • ${athleteName.toUpperCase()}` : 'DAILY RUN TELEMETRY',
      xPct: 94.0,
      yPct: 27.8,
      maxWidthPct: 60,
      typography: createDefaultTypography({
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: 3,
        color: '#CBD5E1',
        textAlign: 'right',
        textTransform: 'uppercase',
        shadowEnabled: true,
        shadowBlur: 8
      })
    },

    decorativeDots: {
      enabled: true,
      style: 'dots',
      count: 3,
      size: 5,
      spacing: 14,
      color: '#FFFFFF',
      opacity: 85,
      xPct: 94.0,
      yPct: 30.5
    },

    metricsFooter: {
      enabled: true,
      layout: 'vertical',
      xPct: 6.0,
      yPct: 76.0,
      widthPct: 42.0,
      gap: 16,
      cardBgEnabled: false,
      cardBgColor: 'rgba(15, 17, 23, 0.65)',
      cardBgOpacity: 65,
      cardBorderRadius: 16,
      padding: 16,
      items: [
        {
          id: 'distance',
          enabled: true,
          iconEnabled: true,
          iconType: 'sparkles',
          iconColor: '#FFFFFF',
          iconSize: 14,
          label: 'DISTÂNCIA',
          labelEnabled: true,
          labelTypography: createDefaultTypography({
            fontFamily: 'Montserrat',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 2.5,
            color: '#CBD5E1',
            textTransform: 'uppercase',
            shadowEnabled: true,
            shadowBlur: 6
          }),
          value: distVal,
          valueEnabled: true,
          valueTypography: createDefaultTypography({
            fontFamily: 'Oswald',
            fontSize: 44,
            fontWeight: '800',
            letterSpacing: 0,
            color: '#FFFFFF',
            shadowEnabled: true,
            shadowBlur: 12
          }),
          unit: 'KM',
          unitEnabled: true,
          unitTypography: createDefaultTypography({
            fontFamily: 'Montserrat',
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: 1.5,
            color: '#FFFFFF',
            textTransform: 'uppercase'
          }),
          autoField: 'distance'
        },
        {
          id: 'pace',
          enabled: true,
          iconEnabled: true,
          iconType: 'zap',
          iconColor: '#FFFFFF',
          iconSize: 14,
          label: 'PACE MÉDIO',
          labelEnabled: true,
          labelTypography: createDefaultTypography({
            fontFamily: 'Montserrat',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 2.5,
            color: '#CBD5E1',
            textTransform: 'uppercase',
            shadowEnabled: true,
            shadowBlur: 6
          }),
          value: paceVal,
          valueEnabled: true,
          valueTypography: createDefaultTypography({
            fontFamily: 'Oswald',
            fontSize: 44,
            fontWeight: '800',
            letterSpacing: 0,
            color: '#FFFFFF',
            shadowEnabled: true,
            shadowBlur: 12
          }),
          unit: '/KM',
          unitEnabled: true,
          unitTypography: createDefaultTypography({
            fontFamily: 'Montserrat',
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: 1.5,
            color: '#FFFFFF',
            textTransform: 'uppercase'
          }),
          autoField: 'pace'
        },
        {
          id: 'duration',
          enabled: true,
          iconEnabled: true,
          iconType: 'stopwatch',
          iconColor: '#FFFFFF',
          iconSize: 14,
          label: 'TEMPO TOTAL',
          labelEnabled: true,
          labelTypography: createDefaultTypography({
            fontFamily: 'Montserrat',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 2.5,
            color: '#CBD5E1',
            textTransform: 'uppercase',
            shadowEnabled: true,
            shadowBlur: 6
          }),
          value: durationVal,
          valueEnabled: true,
          valueTypography: createDefaultTypography({
            fontFamily: 'Oswald',
            fontSize: 44,
            fontWeight: '800',
            letterSpacing: 0,
            color: '#FFFFFF',
            shadowEnabled: true,
            shadowBlur: 12
          }),
          unit: 'H',
          unitEnabled: false,
          unitTypography: createDefaultTypography({
            fontFamily: 'Montserrat',
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF'
          }),
          autoField: 'duration'
        }
      ]
    },

    routeIcon: {
      enabled: true,
      mode: 'route',
      xPct: 94.0, // anchored to right
      yPct: 83.0,
      size: 210,
      strokeColor: '#FFFFFF',
      strokeWidth: 4.5,
      fillEnabled: false,
      fillColor: 'rgba(255, 255, 255, 0.1)',
      fillOpacity: 10,
      glowEnabled: true,
      glowColor: 'rgba(0, 0, 0, 0.6)',
      glowBlur: 12,
      rotation: 0,
      bgBoxEnabled: false,
      bgBoxColor: 'rgba(0, 0, 0, 0.35)',
      bgBoxOpacity: 35,
      bgBoxBorderRadius: 18,
      showStartFinishPoints: true
    },

    bottomStrip: {
      enabled: true,
      xPct: 6.0,
      yPct: 96.2,
      heightPx: 38,
      bgColor: 'transparent',
      bgOpacity: 0,
      dateText: dateFormatted,
      locationText: rawTitle.toUpperCase(),
      separatorText: '•',
      dateTypography: createDefaultTypography({
        fontFamily: 'Montserrat',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 2.5,
        color: '#E2E8F0',
        textAlign: 'left',
        shadowEnabled: true,
        shadowBlur: 6
      }),
      locationTypography: createDefaultTypography({
        fontFamily: 'Montserrat',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2.5,
        color: '#FFFFFF',
        textAlign: 'left',
        shadowEnabled: true,
        shadowBlur: 6
      }),
      separatorTypography: createDefaultTypography({
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '400',
        color: '#94A3B8',
        textAlign: 'center'
      })
    },

    optionalMap: {
      enabled: false,
      xPct: 50.0,
      yPct: 52.0,
      widthPct: 88.0,
      heightPct: 36.0,
      borderRadius: 20,
      opacity: 90,
      mapStyle: 'dark',
      routeColor: '#FFFFFF',
      routeWidth: 5,
      routeGlow: true,
      zoom: 1.0,
      panX: 0,
      panY: 0
    },

    floatingElements: [],
    accentColor: '#FFFFFF',
    textColor: '#FFFFFF',
    secondaryTextColor: '#CBD5E1',
    globalFont: 'sans',
    globalTypography: {
      fontFamily: 'Montserrat',
      fontWeight: '400',
      baseScale: 1.0,
      letterSpacing: 0,
      color: '#FFFFFF'
    }
  };
}

/**
 * 1. Background Renderer for Run Editorial
 */
export function renderRunEditorialBackground(
  ctx: CanvasRenderingContext2D,
  config: StoryConfig,
  editorialConf: RunEditorialConfig,
  activity: UserActivity
) {
  const bg = editorialConf.background;
  ctx.save();
  ctx.fillStyle = bg.solidColor || '#121316';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let hasDrawn = false;
  const photoUrl = config.customPhotoUrl;

  if (bg.type === 'photo' && photoUrl) {
    const img = storyImageCache.get(photoUrl) || 
      (window as any).__storyPhotoCache?.get(photoUrl) || 
      (document.querySelector(`img[src="${photoUrl}"]`) as HTMLImageElement);

    if (img && img.complete && img.naturalWidth > 0) {
      const brightness = 100 + (bg.brightness || 0);
      const contrast = 100 + (bg.contrast || 0);
      const saturation = 100 + (bg.saturation || 0);
      const blurPx = bg.blur || 0;

      let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      if (bg.filterMode === 'grayscale') filterStr += ' grayscale(100%)';
      else if (bg.filterMode === 'sepia') filterStr += ' sepia(100%)';
      if (blurPx > 0) filterStr += ` blur(${blurPx}px)`;

      ctx.filter = filterStr;

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const baseScale = Math.max(CANVAS_WIDTH / naturalW, CANVAS_HEIGHT / naturalH);
      const zoom = baseScale * (bg.zoom || 1.0);
      const dw = naturalW * zoom;
      const dh = naturalH * zoom;
      const dx = (CANVAS_WIDTH - dw) / 2 + (bg.panX || 0);
      const dy = (CANVAS_HEIGHT - dh) / 2 + (bg.panY || 0);

      if (bg.rotation) {
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.rotate((bg.rotation * Math.PI) / 180);
        ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
      }

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
      hasDrawn = true;
    } else {
      preloadStoryPhoto(photoUrl).catch(() => {});
    }
  }

  // Flat or Gradient Overlays for readability
  if (bg.overlayOpacity > 0) {
    const alpha = Math.max(0, Math.min(1, bg.overlayOpacity / 100));
    ctx.fillStyle = hexToRgba(bg.overlayColor || '#000000', alpha);
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Top Vignette
  if ((bg.topVignetteOpacity || 0) > 0) {
    const topAlpha = Math.max(0, Math.min(1, (bg.topVignetteOpacity || 45) / 100));
    const topGrad = ctx.createLinearGradient(0, 0, 0, SAFE_TOP + 440);
    topGrad.addColorStop(0, `rgba(0, 0, 0, ${topAlpha})`);
    topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, SAFE_TOP + 440);
  }

  // Bottom Vignette
  if ((bg.bottomVignetteOpacity || 0) > 0) {
    const btmAlpha = Math.max(0, Math.min(1, (bg.bottomVignetteOpacity || 65) / 100));
    const btmGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - SAFE_BOTTOM - 480, 0, CANVAS_HEIGHT);
    btmGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    btmGrad.addColorStop(1, `rgba(0, 0, 0, ${btmAlpha})`);
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - SAFE_BOTTOM - 480, CANVAS_WIDTH, SAFE_BOTTOM + 480);
  }

  ctx.restore();
}

/**
 * 2. Optional Central Map Panel
 */
export function renderRunEditorialOptionalMap(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  activity: UserActivity,
  progressRatio: number = 1
) {
  const mapConf = editorialConf.optionalMap;
  if (!mapConf || !mapConf.enabled) return;

  const w = (mapConf.widthPct / 100) * CANVAS_WIDTH;
  const h = (mapConf.heightPct / 100) * CANVAS_HEIGHT;
  const x = (mapConf.xPct / 100) * CANVAS_WIDTH - (w / 2) + (mapConf.panX || 0);
  const y = (mapConf.yPct / 100) * CANVAS_HEIGHT - (h / 2) + (mapConf.panY || 0);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, (mapConf.opacity || 90) / 100));

  // Frame with rounded corners
  drawRoundedRect(ctx, x, y, w, h, mapConf.borderRadius || 20);
  ctx.clip();

  // Map background
  ctx.fillStyle = mapConf.mapStyle === 'light' ? '#E2E8F0' : '#0B0D12';
  ctx.fillRect(x, y, w, h);

  // Draw Route
  const rawRoute = activity.route || [];
  if (rawRoute.length > 2) {
    const interpolated = getCachedInterpolatedRoute(activity.id, rawRoute, false);
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
    const pad = 24;
    const projW = w - (pad * 2);
    const projH = h - (pad * 2);

    const projX = (lng: number) => x + pad + ((lng - minLon) / lonSpan) * projW;
    const projY = (lat: number) => (y + h - pad) - ((lat - minLat) / latSpan) * projH;

    const { points: animatedPoints } = getRouteSliceAtRatio(interpolated, progressRatio);

    if (animatedPoints.length > 1) {
      if (mapConf.routeGlow) {
        ctx.shadowColor = mapConf.routeColor || '#FFFFFF';
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = mapConf.routeColor || '#FFFFFF';
      ctx.lineWidth = mapConf.routeWidth || 5;
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
    }
  }

  ctx.restore();
}

/**
 * 3. Top Right Location Block
 */
export function renderRunEditorialTopLocation(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const loc = editorialConf.topLocation;
  if (!loc || !loc.enabled || !loc.text) return;

  const posX = (loc.xPct / 100) * CANVAS_WIDTH;
  const posY = (loc.yPct / 100) * CANVAS_HEIGHT;

  // Render text first
  const metrics = renderCustomTypographyText(
    ctx,
    loc.text,
    posX,
    posY,
    loc.typography,
    undefined,
    globalTypography
  );

  // Render Pin Icon if enabled (aligned to the left of text if right aligned)
  if (loc.iconEnabled) {
    const iconSize = loc.iconSize || 16;
    const textW = metrics.width || 80;
    const iconX = posX - textW - (iconSize * 1.3);
    drawVectorIcon(ctx, loc.iconType || 'pin', iconX, posY, iconSize, loc.iconColor || '#FFFFFF');
  }
}

/**
 * 4. Main Title Block ("RUN" / "WALK")
 */
export function renderRunEditorialMainTitle(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const title = editorialConf.mainTitle;
  if (!title || !title.enabled || !title.text) return;

  const posX = (title.xPct / 100) * CANVAS_WIDTH;
  const posY = (title.yPct / 100) * CANVAS_HEIGHT;

  renderCustomTypographyText(
    ctx,
    title.text,
    posX,
    posY,
    title.typography,
    undefined,
    globalTypography
  );
}

/**
 * 5. Subtitle Block ("at your own pace")
 */
export function renderRunEditorialSubtitle(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const sub = editorialConf.subtitle;
  if (!sub || !sub.enabled || !sub.text) return;

  const posX = (sub.xPct / 100) * CANVAS_WIDTH;
  const posY = (sub.yPct / 100) * CANVAS_HEIGHT;

  renderCustomTypographyText(
    ctx,
    sub.text,
    posX,
    posY,
    sub.typography,
    undefined,
    globalTypography
  );
}

/**
 * 6. Date & Time Block (side-by-side with separator)
 */
export function renderRunEditorialDateTime(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const dt = editorialConf.dateTime;
  if (!dt || !dt.enabled) return;

  const posX = (dt.xPct / 100) * CANVAS_WIDTH;
  const posY = (dt.yPct / 100) * CANVAS_HEIGHT;

  // Render Time (rightmost if right-aligned)
  let currentOffset = 0;

  if (dt.timeEnabled && dt.timeText) {
    const timeMetrics = renderCustomTypographyText(
      ctx,
      dt.timeText,
      posX - currentOffset,
      posY,
      dt.timeTypography,
      undefined,
      globalTypography
    );
    currentOffset += (timeMetrics.width || 50) + 14;
  }

  // Separator
  if (dt.separatorEnabled && dt.separatorText) {
    const sepMetrics = renderCustomTypographyText(
      ctx,
      dt.separatorText,
      posX - currentOffset,
      posY,
      dt.separatorTypography,
      undefined,
      globalTypography
    );
    currentOffset += (sepMetrics.width || 12) + 14;
  }

  // Date
  if (dt.dateEnabled && dt.dateText) {
    renderCustomTypographyText(
      ctx,
      dt.dateText,
      posX - currentOffset,
      posY,
      dt.dateTypography,
      undefined,
      globalTypography
    );
  }
}

/**
 * 7. User Quote / Message Block
 */
export function renderRunEditorialUserQuote(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const quote = editorialConf.userQuote;
  if (!quote || !quote.enabled || !quote.text) return;

  const posX = (quote.xPct / 100) * CANVAS_WIDTH;
  const posY = (quote.yPct / 100) * CANVAS_HEIGHT;

  renderCustomTypographyText(
    ctx,
    quote.text,
    posX,
    posY,
    quote.typography,
    undefined,
    globalTypography
  );
}

/**
 * 8. Decorative 3 Dots or Divider
 */
export function renderRunEditorialDecorativeDots(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig
) {
  const dots = editorialConf.decorativeDots;
  if (!dots || !dots.enabled) return;

  const posX = (dots.xPct / 100) * CANVAS_WIDTH;
  const posY = (dots.yPct / 100) * CANVAS_HEIGHT;
  const count = dots.count || 3;
  const size = dots.size || 5;
  const spacing = dots.spacing || 14;
  const color = dots.color || '#FFFFFF';
  const alpha = Math.max(0, Math.min(1, (dots.opacity || 85) / 100));

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;

  if (dots.style === 'line') {
    const totalW = (count - 1) * spacing + 40;
    ctx.lineWidth = size * 0.6;
    ctx.beginPath();
    ctx.moveTo(posX - totalW, posY);
    ctx.lineTo(posX, posY);
    ctx.stroke();
  } else if (dots.style === 'diamonds') {
    for (let i = 0; i < count; i++) {
      const dx = posX - (i * spacing);
      ctx.beginPath();
      ctx.moveTo(dx, posY - size);
      ctx.lineTo(dx + size, posY);
      ctx.lineTo(dx, posY + size);
      ctx.lineTo(dx - size, posY);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Default Dots
    for (let i = 0; i < count; i++) {
      const dx = posX - (i * spacing);
      ctx.beginPath();
      ctx.arc(dx, posY, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 9. Metrics Footer (Left Bottom)
 */
export function renderRunEditorialMetricsFooter(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  activity: UserActivity,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const mf = editorialConf.metricsFooter;
  if (!mf || !mf.enabled || !mf.items || mf.items.length === 0) return;

  const activeItems = mf.items.filter(it => it.enabled);
  if (activeItems.length === 0) return;

  const baseX = (mf.xPct / 100) * CANVAS_WIDTH;
  const baseY = (mf.yPct / 100) * CANVAS_HEIGHT;
  const isHorizontal = mf.layout === 'horizontal';
  const gap = mf.gap || 18;

  ctx.save();

  // Optional card background container
  if (mf.cardBgEnabled) {
    const cardW = (mf.widthPct / 100) * CANVAS_WIDTH;
    const cardH = isHorizontal ? 120 : (activeItems.length * 75) + 30;
    ctx.fillStyle = hexToRgba(mf.cardBgColor || 'rgba(15,17,23,0.7)', (mf.cardBgOpacity || 70) / 100);
    drawRoundedRect(ctx, baseX - 12, baseY - 24, cardW, cardH, mf.cardBorderRadius || 16);
    ctx.fill();
  }

  activeItems.forEach((item, index) => {
    let itemX = baseX;
    let itemY = baseY + (index * (68 + gap));

    if (isHorizontal) {
      const itemWidth = ((mf.widthPct / 100) * CANVAS_WIDTH) / activeItems.length;
      itemX = baseX + (index * itemWidth);
      itemY = baseY;
    }

    // Resolve Value from activity if autoField is set
    let displayValue = item.value;
    if (item.autoField === 'distance' && activity.distanceKm) {
      displayValue = activity.distanceKm.toFixed(2);
    } else if (item.autoField === 'pace' && activity.paceFormatted) {
      displayValue = activity.paceFormatted;
    } else if (item.autoField === 'duration' && activity.durationFormatted) {
      displayValue = activity.durationFormatted;
    } else if (item.autoField === 'elevation' && activity.elevationGainMeters) {
      displayValue = `${Math.round(activity.elevationGainMeters)}`;
    }

    // 1. Label + Icon
    let labelOffsetY = 0;
    if (item.labelEnabled && item.label) {
      let iconShift = 0;
      if (item.iconEnabled) {
        const iconSize = item.iconSize || 13;
        drawVectorIcon(
          ctx,
          item.iconType || 'sparkles',
          itemX + (iconSize / 2),
          itemY,
          iconSize,
          item.iconColor || '#FFFFFF'
        );
        iconShift = iconSize + 8;
      }

      renderCustomTypographyText(
        ctx,
        item.label,
        itemX + iconShift,
        itemY,
        item.labelTypography,
        undefined,
        globalTypography
      );
      labelOffsetY = 32;
    }

    // 2. Value + Unit side-by-side
    if (item.valueEnabled && displayValue) {
      const valY = itemY + labelOffsetY;
      const valMetrics = renderCustomTypographyText(
        ctx,
        displayValue,
        itemX,
        valY,
        item.valueTypography,
        undefined,
        globalTypography
      );

      // Unit
      if (item.unitEnabled && item.unit) {
        const unitX = itemX + (valMetrics.width || 40) + 8;
        renderCustomTypographyText(
          ctx,
          item.unit,
          unitX,
          valY + 4,
          item.unitTypography,
          undefined,
          globalTypography
        );
      }
    }
  });

  ctx.restore();
}

/**
 * 10. Route Icon / Stylized Outline (Right Bottom)
 */
export function renderRunEditorialRouteIcon(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  activity: UserActivity,
  progressRatio: number = 1
) {
  const routeConf = editorialConf.routeIcon;
  if (!routeConf || !routeConf.enabled) return;

  const size = routeConf.size || 190;
  const posX = (routeConf.xPct / 100) * CANVAS_WIDTH - size;
  const posY = (routeConf.yPct / 100) * CANVAS_HEIGHT - (size / 2);

  ctx.save();

  // Optional background container
  if (routeConf.bgBoxEnabled) {
    ctx.fillStyle = hexToRgba(routeConf.bgBoxColor || 'rgba(0,0,0,0.35)', (routeConf.bgBoxOpacity || 35) / 100);
    drawRoundedRect(ctx, posX, posY, size, size, routeConf.bgBoxBorderRadius || 18);
    ctx.fill();
  }

  // Draw Stylized Route
  const rawRoute = activity.route || [];
  if (rawRoute.length > 2 && routeConf.mode === 'route') {
    const interpolated = getCachedInterpolatedRoute(activity.id, rawRoute, false);
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
    const pad = 22;
    const projW = size - (pad * 2);
    const projH = size - (pad * 2);

    const projX = (lng: number) => posX + pad + ((lng - minLon) / lonSpan) * projW;
    const projY = (lat: number) => (posY + size - pad) - ((lat - minLat) / latSpan) * projH;

    const { points: animatedPoints, currentHead } = getRouteSliceAtRatio(interpolated, progressRatio);

    if (animatedPoints.length > 1) {
      if (routeConf.glowEnabled) {
        ctx.shadowColor = routeConf.glowColor || 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = routeConf.glowBlur || 12;
      }

      ctx.strokeStyle = routeConf.strokeColor || '#FFFFFF';
      ctx.lineWidth = routeConf.strokeWidth || 4.5;
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

      // Optional start/finish dots
      if (routeConf.showStartFinishPoints && allPoints.length > 0) {
        // Start Dot
        const startX = projX(allPoints[0].lng);
        const startY = projY(allPoints[0].lat);
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(startX, startY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Finish Dot
        if (currentHead) {
          const finishX = projX(currentHead.lng);
          const finishY = projY(currentHead.lat);
          ctx.fillStyle = routeConf.strokeColor || '#FFFFFF';
          ctx.beginPath();
          ctx.arc(finishX, finishY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (routeConf.mode === 'icon') {
    // Generic Minimalist Route Icon
    drawVectorIcon(ctx, 'navigation', posX + size / 2, posY + size / 2, size * 0.45, routeConf.strokeColor || '#FFFFFF');
  }

  ctx.restore();
}

/**
 * 11. Bottom Strip (Full Date & Location)
 */
export function renderRunEditorialBottomStrip(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const strip = editorialConf.bottomStrip;
  if (!strip || !strip.enabled) return;

  const posX = (strip.xPct / 100) * CANVAS_WIDTH;
  const posY = (strip.yPct / 100) * CANVAS_HEIGHT;

  ctx.save();

  // Background bar if enabled
  if (strip.bgOpacity > 0) {
    ctx.fillStyle = hexToRgba(strip.bgColor || '#000000', strip.bgOpacity / 100);
    ctx.fillRect(0, posY - (strip.heightPx / 2), CANVAS_WIDTH, strip.heightPx);
  }

  let currentOffset = 0;

  // Date Text
  if (strip.dateText) {
    const dateMetrics = renderCustomTypographyText(
      ctx,
      strip.dateText,
      posX + currentOffset,
      posY,
      strip.dateTypography,
      undefined,
      globalTypography
    );
    currentOffset += (dateMetrics.width || 120) + 12;
  }

  // Separator
  if (strip.separatorText) {
    const sepMetrics = renderCustomTypographyText(
      ctx,
      strip.separatorText,
      posX + currentOffset,
      posY,
      strip.separatorTypography,
      undefined,
      globalTypography
    );
    currentOffset += (sepMetrics.width || 12) + 12;
  }

  // Location Text
  if (strip.locationText) {
    renderCustomTypographyText(
      ctx,
      strip.locationText,
      posX + currentOffset,
      posY,
      strip.locationTypography,
      undefined,
      globalTypography
    );
  }

  ctx.restore();
}

/**
 * 12. Floating Extra Elements
 */
export function renderRunEditorialFloatingElements(
  ctx: CanvasRenderingContext2D,
  editorialConf: RunEditorialConfig,
  globalTypography?: RunEditorialConfig['globalTypography']
) {
  const elements = editorialConf.floatingElements || [];
  if (elements.length === 0) return;

  elements.forEach(el => {
    const posX = (el.xPct / 100) * CANVAS_WIDTH;
    const posY = (el.yPct / 100) * CANVAS_HEIGHT;

    if (el.type === 'text' && el.text) {
      renderCustomTypographyText(
        ctx,
        el.text,
        posX,
        posY,
        el.typography,
        undefined,
        globalTypography
      );
    } else if (el.type === 'shape') {
      ctx.save();
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.globalAlpha = Math.max(0, Math.min(1, (el.opacity || 100) / 100));
      const w = el.widthPx || 100;
      const h = el.heightPx || 4;
      if (el.shapeType === 'circle') {
        ctx.beginPath();
        ctx.arc(posX, posY, w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(posX - w / 2, posY - h / 2, w, h);
      }
      ctx.restore();
    }
  });
}

/**
 * Main Orchestrator for Template 3: Run Editorial
 */
export function renderRunEditorialTemplate(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  const editorialConf = config.runEditorial || getDefaultRunEditorialConfig(activity, athleteName);
  const globalTypo = editorialConf.globalTypography;

  // 1. Background (Personal Photo, solid, or procedural map with high-grade filters)
  renderRunEditorialBackground(ctx, config, editorialConf, activity);

  // 2. Optional Central Map Panel (if enabled by user)
  renderRunEditorialOptionalMap(ctx, editorialConf, activity, progressRatio);

  // 3. Top Right Location with Pin
  renderRunEditorialTopLocation(ctx, editorialConf, globalTypo);

  // 4. Main Title ("RUN" / "WALK")
  renderRunEditorialMainTitle(ctx, editorialConf, globalTypo);

  // 5. Subtitle ("at your own pace")
  renderRunEditorialSubtitle(ctx, editorialConf, globalTypo);

  // 6. Date & Time
  renderRunEditorialDateTime(ctx, editorialConf, globalTypo);

  // 7. User Quote / Athlete Name
  renderRunEditorialUserQuote(ctx, editorialConf, globalTypo);

  // 8. Decorative 3 Dots
  renderRunEditorialDecorativeDots(ctx, editorialConf);

  // 9. Metrics Footer (Distance, Pace, Time)
  renderRunEditorialMetricsFooter(ctx, editorialConf, activity, globalTypo);

  // 10. Route Icon (Artistic Trajectory Outline)
  renderRunEditorialRouteIcon(ctx, editorialConf, activity, progressRatio);

  // 11. Bottom Strip (Full Date & Location)
  renderRunEditorialBottomStrip(ctx, editorialConf, globalTypo);

  // 12. Floating Elements
  renderRunEditorialFloatingElements(ctx, editorialConf, globalTypo);
}
