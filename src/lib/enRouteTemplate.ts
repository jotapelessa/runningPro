import { 
  UserActivity, 
  StoryConfig, 
  EnRouteConfig,
  EnRouteWaypointMarker,
  EnRouteFloatingBadge,
  TypographyConfig,
  RoutePoint
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
 * Draw crisp vector icons on Canvas 2D
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
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -h * 0.35, h * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'flag':
      // Checkered / Finish Flag
      ctx.beginPath();
      ctx.moveTo(-h * 0.6, -h * 0.8);
      ctx.lineTo(-h * 0.6, h * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-h * 0.6, -h * 0.8);
      ctx.quadraticCurveTo(0, -h * 1.0, h * 0.6, -h * 0.7);
      ctx.lineTo(h * 0.6, 0);
      ctx.quadraticCurveTo(0, -h * 0.3, -h * 0.6, -h * 0.1);
      ctx.closePath();
      ctx.fill();
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2, size * 0.15);
      ctx.stroke();
      break;

    case 'mountain':
      // Mountain peak
      ctx.beginPath();
      ctx.moveTo(-h * 0.8, h * 0.7);
      ctx.lineTo(0, -h * 0.7);
      ctx.lineTo(h * 0.8, h * 0.7);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-h * 0.2, h * 0.7);
      ctx.lineTo(h * 0.4, -h * 0.1);
      ctx.lineTo(h * 0.9, h * 0.7);
      ctx.stroke();
      break;

    case 'clock':
      // Clock
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h * 0.45);
      ctx.moveTo(0, 0);
      ctx.lineTo(h * 0.4, 0);
      ctx.stroke();
      break;

    case 'road':
      // Highway / Road
      ctx.beginPath();
      ctx.moveTo(-h * 0.7, h * 0.8);
      ctx.lineTo(-h * 0.3, -h * 0.8);
      ctx.moveTo(h * 0.7, h * 0.8);
      ctx.lineTo(h * 0.3, -h * 0.8);
      ctx.stroke();
      ctx.setLineDash([s * 0.2, s * 0.2]);
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.7);
      ctx.lineTo(0, h * 0.7);
      ctx.stroke();
      break;

    case 'pace':
    case 'bolt':
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(h * 0.1, -h * 0.9);
      ctx.lineTo(-h * 0.5, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(-h * 0.2, h * 0.9);
      ctx.lineTo(h * 0.5, -0.1);
      ctx.lineTo(0, -0.1);
      ctx.closePath();
      ctx.fill();
      break;

    case 'heart':
      // Heart
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.bezierCurveTo(-h * 0.8, h * 0.1, -h * 0.9, -h * 0.5, -h * 0.4, -h * 0.7);
      ctx.bezierCurveTo(-h * 0.1, -h * 0.7, 0, -h * 0.4, 0, -h * 0.2);
      ctx.bezierCurveTo(0, -h * 0.4, h * 0.1, -h * 0.7, h * 0.4, -h * 0.7);
      ctx.bezierCurveTo(h * 0.9, -h * 0.5, h * 0.8, h * 0.1, 0, h * 0.6);
      ctx.fill();
      break;

    case 'chat':
    case 'star':
    default:
      // Star / Note
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const r1 = h * 0.8;
        const r2 = h * 0.35;
        const x1 = Math.cos(a) * r1;
        const y1 = Math.sin(a) * r1;
        const x2 = Math.cos(a + Math.PI / 5) * r2;
        const y2 = Math.sin(a + Math.PI / 5) * r2;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}

/**
 * Standard factory defaults for Template 4 — En Route
 */
export function getDefaultEnRouteConfig(activity?: UserActivity, athleteName?: string): EnRouteConfig {
  const distKm = activity?.distanceKm ? activity.distanceKm.toFixed(1) : '140';
  const durStr = activity?.durationFormatted || '2j 45 mnt';
  const paceStr = activity?.paceFormatted ? `${activity.paceFormatted}/km` : '4:30/km';
  const locationTitle = activity?.title || 'Payakumbuh - Batusangkar - Batipuh - Solok';
  const athleteHandle = athleteName ? `@${athleteName.toLowerCase().replace(/\s+/g, '')}` : '@runner';

  return {
    background: {
      type: 'photo',
      solidColor: '#101726',
      filterMode: 'normal',
      brightness: 0,
      contrast: 5,
      saturation: 10,
      exposure: 0,
      blur: 0,
      overlayColor: '#000000',
      overlayOpacity: 12,
      gradientTop: true,
      gradientTopColor: '#000000',
      gradientTopHeightPct: 28,
      gradientTopOpacity: 55,
      gradientBottom: true,
      gradientBottomColor: '#000000',
      gradientBottomHeightPct: 35,
      gradientBottomOpacity: 65,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0
    },

    mainTitle: {
      enabled: true,
      text: 'EN ROUTE',
      xPct: 50,
      yPct: 9.2,
      textAlign: 'center',
      rotation: 0,
      typography: createDefaultTypography({
        fontFamily: 'Montserrat',
        fontSize: 46,
        fontWeight: '900',
        fontStyle: 'normal',
        letterSpacing: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.65)',
        shadowBlur: 14,
        shadowOffsetY: 3
      })
    },

    subtitle: {
      enabled: true,
      text: locationTitle,
      separator: ' - ',
      xPct: 50,
      yPct: 13.6,
      textAlign: 'center',
      typography: createDefaultTypography({
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'normal',
        letterSpacing: 3,
        textAlign: 'center',
        textTransform: 'none',
        color: 'rgba(255, 255, 255, 0.92)',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.7)',
        shadowBlur: 8,
        shadowOffsetY: 2
      }),
      separatorTypography: createDefaultTypography({
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: 2,
        color: 'rgba(255, 255, 255, 0.6)'
      })
    },

    map: {
      enabled: true,
      xPct: 50,
      yPct: 46.0,
      widthPct: 88,
      heightPct: 52,
      borderRadius: 22,
      opacity: 100,
      bgColor: '#F8FAFC',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderWidth: 0,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.35)',
      shadowBlur: 26,
      shadowOffsetY: 10,
      mapStyle: 'light',
      routeColor: '#1565C0', // Vibrant Road Blue
      routeWidth: 7,
      routeOutlineColor: '#FFFFFF',
      routeOutlineWidth: 2.5,
      routeGlow: true,
      routeSmoothing: true,
      routeFillUnder: false,
      routeFillColor: 'rgba(21, 101, 192, 0.12)',
      routeFillOpacity: 12,
      showStartMarker: true,
      showFinishMarker: true,
      markerStyle: 'circle',
      startMarkerColor: '#10B981',
      finishMarkerColor: '#EF4444',
      markerSize: 14,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0
    },

    waypoints: [
      {
        id: 'wp-start',
        enabled: true,
        label: 'LARGADA',
        sublabel: 'KM 0.0',
        locationRatio: 0.0,
        iconType: 'pin',
        iconColor: '#10B981',
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
          fontFamily: 'Montserrat',
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
      },
      {
        id: 'wp-mid',
        enabled: true,
        label: 'BATUSANGKAR',
        sublabel: 'ALT 1.240M',
        locationRatio: 0.5,
        iconType: 'mountain',
        iconColor: '#1565C0',
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
          fontFamily: 'Montserrat',
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
      },
      {
        id: 'wp-end',
        enabled: true,
        label: 'CHEGADA',
        sublabel: `TOTAL ${distKm} KM`,
        locationRatio: 1.0,
        iconType: 'flag',
        iconColor: '#EF4444',
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
          fontFamily: 'Montserrat',
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
      }
    ],

    badges: [
      {
        id: 'badge-time',
        enabled: true,
        text: durStr,
        icon: 'clock',
        iconColor: '#1565C0',
        iconSize: 15,
        xPct: 18,
        yPct: 24,
        autoWidth: true,
        widthPx: 140,
        heightPx: 38,
        paddingX: 14,
        paddingY: 8,
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
          fontFamily: 'Montserrat',
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: '#0F172A',
          textAlign: 'left'
        })
      },
      {
        id: 'badge-dist',
        enabled: true,
        text: `PP ±${distKm} KM`,
        icon: 'road',
        iconColor: '#1565C0',
        iconSize: 15,
        xPct: 82,
        yPct: 24,
        autoWidth: true,
        widthPx: 150,
        heightPx: 38,
        paddingX: 14,
        paddingY: 8,
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
          fontFamily: 'Montserrat',
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: '#0F172A',
          textAlign: 'left'
        })
      },
      {
        id: 'badge-note',
        enabled: true,
        text: '* Trip dadakan, Next?',
        icon: 'chat',
        iconColor: '#1565C0',
        iconSize: 14,
        xPct: 26,
        yPct: 69,
        autoWidth: true,
        widthPx: 200,
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
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.3,
          color: '#0F172A',
          textAlign: 'left'
        })
      },
      {
        id: 'badge-pace',
        enabled: true,
        text: `⚡ Ritmo ${paceStr}`,
        icon: 'pace',
        iconColor: '#1565C0',
        iconSize: 14,
        xPct: 75,
        yPct: 69,
        autoWidth: true,
        widthPx: 160,
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
          fontFamily: 'Montserrat',
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: '#0F172A',
          textAlign: 'left'
        })
      }
    ],

    credits: {
      enabled: true,
      creditsText: 'Instagram | Google Maps',
      separator: ' | ',
      athleteName: athleteHandle,
      xPct: 50,
      yPct: 93.0,
      textAlign: 'center',
      creditsTypography: createDefaultTypography({
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        fontWeight: '500',
        fontStyle: 'italic',
        letterSpacing: 2,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.7)',
        shadowBlur: 6,
        shadowOffsetY: 2
      }),
      athleteTypography: createDefaultTypography({
        fontFamily: 'Montserrat',
        fontSize: 15,
        fontWeight: '700',
        fontStyle: 'normal',
        letterSpacing: 1.5,
        color: '#FFFFFF',
        textAlign: 'center',
        shadowEnabled: true,
        shadowColor: 'rgba(0, 0, 0, 0.8)',
        shadowBlur: 8,
        shadowOffsetY: 2
      }),
      bgBoxEnabled: false,
      bgBoxColor: 'rgba(0, 0, 0, 0.45)',
      bgBoxOpacity: 70,
      bgBoxRadius: 12,
      bgBoxPaddingX: 18,
      bgBoxPaddingY: 8
    },

    floatingElements: [],
    accentColor: '#1565C0',
    secondaryColor: '#0D47A1',
    textPrimaryColor: '#FFFFFF',
    textSecondaryColor: '#E2E8F0',
    badgeBgColor: '#FFFFFF',
    globalFont: 'sans'
  };
}

/**
 * Main Template 4 “En Route” Renderer
 */
export function renderEnRouteTemplate(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progress: number = 1,
  options?: {
    showSafeZoneGuides?: boolean;
    selectedId?: string | null;
  }
) {
  const editorial = config.enRoute || getDefaultEnRouteConfig(activity, athleteName);
  const selectedId = options?.selectedId;

  // =========================================================================
  // LAYER 1: BACKGROUND (PHOTO, SOLID OR BACKDROP WITH FILTERS & VIGNETTES)
  // =========================================================================
  renderEnRouteBackground(ctx, config, editorial);

  // =========================================================================
  // LAYER 2: CENTRAL MINIMALIST MAP PANEL WITH ROUTE & WAYPOINTS
  // =========================================================================
  renderEnRouteCentralMap(ctx, activity, config, editorial, progress, selectedId);

  // =========================================================================
  // LAYER 3: FLOATING INFO BADGES OVER MAP
  // =========================================================================
  renderEnRouteFloatingBadges(ctx, editorial, selectedId);

  // =========================================================================
  // LAYER 4: TOP MAIN TITLE & SUBTITLE
  // =========================================================================
  renderEnRouteHeader(ctx, editorial, selectedId);

  // =========================================================================
  // LAYER 5: FOOTER CREDITS & ATHLETE USERNAME
  // =========================================================================
  renderEnRouteFooter(ctx, editorial, selectedId);

  // =========================================================================
  // LAYER 6: FLOATING ELEMENTS (CUSTOM SHAPES/TEXTS)
  // =========================================================================
  if (editorial.floatingElements && editorial.floatingElements.length > 0) {
    for (const elem of editorial.floatingElements) {
      const ex = (elem.xPct / 100) * CANVAS_WIDTH;
      const ey = (elem.yPct / 100) * CANVAS_HEIGHT;
      if (elem.type === 'text' && elem.text && elem.typography) {
        renderCustomTypographyText(ctx, elem.text, ex, ey, elem.typography);
      } else if (elem.type === 'shape') {
        ctx.save();
        ctx.fillStyle = elem.color || '#FFFFFF';
        ctx.globalAlpha = (elem.opacity ?? 100) / 100;
        const w = elem.widthPx || 100;
        const h = elem.heightPx || 4;
        if (elem.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(ex, ey, w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(ex - w / 2, ey - h / 2, w, h);
        }
        ctx.restore();
      }
    }
  }

  // =========================================================================
  // SAFE ZONE GUIDES OVERLAY (IF ENABLED)
  // =========================================================================
  if (options?.showSafeZoneGuides) {
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(SAFE_SIDE, 0);
    ctx.lineTo(SAFE_SIDE, CANVAS_HEIGHT);
    ctx.moveTo(CANVAS_WIDTH - SAFE_SIDE, 0);
    ctx.lineTo(CANVAS_WIDTH - SAFE_SIDE, CANVAS_HEIGHT);
    ctx.moveTo(0, SAFE_TOP);
    ctx.lineTo(CANVAS_WIDTH, SAFE_TOP);
    ctx.moveTo(0, CANVAS_HEIGHT - SAFE_BOTTOM);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - SAFE_BOTTOM);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Render Background for Template 4
 */
function renderEnRouteBackground(
  ctx: CanvasRenderingContext2D,
  config: StoryConfig,
  editorial: EnRouteConfig
) {
  const bg = editorial.background;
  ctx.save();

  // Solid base color
  ctx.fillStyle = bg.solidColor || '#101726';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let hasDrawnPhoto = false;
  const photoUrl = config.customPhotoUrl;

  if (bg.type === 'photo' && photoUrl) {
    const img = storyImageCache.get(photoUrl) || (window as any).__storyPhotoCache?.get(photoUrl) || 
      (document.querySelector(`img[src="${photoUrl}"]`) as HTMLImageElement);

    if (img && img.complete && img.naturalWidth > 0) {
      const brightness = 100 + (bg.brightness || 0);
      const contrast = 100 + (bg.contrast || 0);
      const saturation = 100 + (bg.saturation || 0);
      const blur = bg.blur || 0;

      let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      if (bg.filterMode === 'grayscale') {
        filterStr += ' grayscale(100%)';
      } else if (bg.filterMode === 'sepia') {
        filterStr += ' sepia(100%)';
      }
      if (blur > 0) {
        filterStr += ` blur(${blur}px)`;
      }

      ctx.filter = filterStr;

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const baseScale = Math.max(CANVAS_WIDTH / naturalW, CANVAS_HEIGHT / naturalH);
      const zoom = baseScale * (bg.zoom || 1.0);
      const dw = naturalW * zoom;
      const dh = naturalH * zoom;
      const dx = (CANVAS_WIDTH - dw) / 2 + (bg.panX || 0);
      const dy = (CANVAS_HEIGHT - dh) / 2 + (bg.panY || 0);

      ctx.save();
      if (bg.rotation) {
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.rotate((bg.rotation * Math.PI) / 180);
        ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      ctx.filter = 'none';
      hasDrawnPhoto = true;
    }
  }

  // If no photo or fallback, draw scenic gradient
  if (!hasDrawnPhoto) {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#1E293B');
    grad.addColorStop(1, '#0B1120');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Color Overlay
  if (bg.overlayOpacity > 0) {
    ctx.fillStyle = hexToRgba(bg.overlayColor || '#000000', bg.overlayOpacity / 100);
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Top Dark Gradient (for Title legibility)
  if (bg.gradientTop && bg.gradientTopOpacity > 0) {
    const topHeight = (bg.gradientTopHeightPct / 100) * CANVAS_HEIGHT;
    const topGrad = ctx.createLinearGradient(0, 0, 0, topHeight);
    topGrad.addColorStop(0, hexToRgba(bg.gradientTopColor || '#000000', bg.gradientTopOpacity / 100));
    topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, topHeight);
  }

  // Bottom Dark Gradient (for Credits legibility)
  if (bg.gradientBottom && bg.gradientBottomOpacity > 0) {
    const bottomHeight = (bg.gradientBottomHeightPct / 100) * CANVAS_HEIGHT;
    const startY = CANVAS_HEIGHT - bottomHeight;
    const bottomGrad = ctx.createLinearGradient(0, startY, 0, CANVAS_HEIGHT);
    bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrad.addColorStop(1, hexToRgba(bg.gradientBottomColor || '#000000', bg.gradientBottomOpacity / 100));
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, startY, CANVAS_WIDTH, bottomHeight);
  }

  ctx.restore();
}

/**
 * Render Header (Main Title + Subtitle with custom separator)
 */
function renderEnRouteHeader(
  ctx: CanvasRenderingContext2D,
  editorial: EnRouteConfig,
  selectedId?: string | null
) {
  // Main Title
  if (editorial.mainTitle.enabled) {
    const titleX = (editorial.mainTitle.xPct / 100) * CANVAS_WIDTH;
    const titleY = (editorial.mainTitle.yPct / 100) * CANVAS_HEIGHT;
    
    ctx.save();
    if (editorial.mainTitle.rotation) {
      ctx.translate(titleX, titleY);
      ctx.rotate((editorial.mainTitle.rotation * Math.PI) / 180);
      ctx.translate(-titleX, -titleY);
    }

    renderCustomTypographyText(
      ctx,
      editorial.mainTitle.text || 'EN ROUTE',
      titleX,
      titleY,
      editorial.mainTitle.typography
    );

    if (selectedId === 'mainTitle') {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(SAFE_SIDE, titleY - 30, CANVAS_WIDTH - (SAFE_SIDE * 2), 60);
    }
    ctx.restore();
  }

  // Subtitle
  if (editorial.subtitle.enabled && editorial.subtitle.text) {
    const subX = (editorial.subtitle.xPct / 100) * CANVAS_WIDTH;
    const subY = (editorial.subtitle.yPct / 100) * CANVAS_HEIGHT;

    ctx.save();
    // Render text with separator styling if applicable
    renderCustomTypographyText(
      ctx,
      editorial.subtitle.text,
      subX,
      subY,
      editorial.subtitle.typography
    );

    if (selectedId === 'subtitle') {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(SAFE_SIDE, subY - 20, CANVAS_WIDTH - (SAFE_SIDE * 2), 40);
    }
    ctx.restore();
  }
}

/**
 * Render Central Map with Waypoints & Route
 */
function renderEnRouteCentralMap(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  config: StoryConfig,
  editorial: EnRouteConfig,
  progress: number = 1,
  selectedId?: string | null
) {
  const mapConf = editorial.map;
  if (!mapConf.enabled) return;

  const mapW = (mapConf.widthPct / 100) * CANVAS_WIDTH;
  const mapH = (mapConf.heightPct / 100) * CANVAS_HEIGHT;
  const mapX = (mapConf.xPct / 100) * CANVAS_WIDTH - mapW / 2;
  const mapY = (mapConf.yPct / 100) * CANVAS_HEIGHT - mapH / 2;

  ctx.save();

  // Map shadow
  if (mapConf.shadow) {
    ctx.shadowColor = mapConf.shadowColor || 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = mapConf.shadowBlur ?? 24;
    ctx.shadowOffsetY = mapConf.shadowOffsetY ?? 8;
  }

  // Map Panel Background
  ctx.fillStyle = mapConf.bgColor || '#F8FAFC';
  ctx.globalAlpha = (mapConf.opacity ?? 100) / 100;
  drawRoundedRect(ctx, mapX, mapY, mapW, mapH, mapConf.borderRadius || 20);
  ctx.fill();

  // Map Border
  if (mapConf.borderWidth > 0) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = mapConf.borderColor || 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = mapConf.borderWidth;
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Clip inside map panel for route drawing
  ctx.save();
  drawRoundedRect(ctx, mapX, mapY, mapW, mapH, mapConf.borderRadius || 20);
  ctx.clip();

  // Subtle grid / terrain background lines for minimalist map feel
  renderMinimalistMapGrid(ctx, mapX, mapY, mapW, mapH, mapConf.mapStyle);

  // Draw GPS Route
  const rawRoute = activity.route || [];
  let startPtCoord: { x: number; y: number } | null = null;
  let finishPtCoord: { x: number; y: number } | null = null;
  const waypointCoords: Array<{ wp: EnRouteWaypointMarker; x: number; y: number }> = [];

  if (rawRoute.length > 1) {
    const interpolated = getCachedInterpolatedRoute(activity.id, rawRoute, false);
    const allPoints = interpolated.points;
    const { points: routePoints, currentHead } = getRouteSliceAtRatio(interpolated, progress);

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of allPoints) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }

    const dLat = maxLat - minLat || 0.001;
    const dLng = maxLng - minLng || 0.001;

    const pad = Math.min(mapW, mapH) * 0.14;
    const drawW = mapW - pad * 2;
    const drawH = mapH - pad * 2;

    const scale = Math.min(drawW / dLng, drawH / dLat) * (mapConf.zoom || 1.0);
    const offsetX = mapX + pad + (drawW - dLng * scale) / 2 + (mapConf.panX || 0);
    const offsetY = mapY + pad + (drawH - dLat * scale) / 2 + (mapConf.panY || 0);

    const project = (pt: RoutePoint) => ({
      x: offsetX + (pt.lng - minLng) * scale,
      y: offsetY + (maxLat - pt.lat) * scale
    });

    // Compute route screen points
    const screenPoints = routePoints.map(project);
    const fullScreenPoints = allPoints.map(project);

    if (fullScreenPoints.length > 0) {
      startPtCoord = fullScreenPoints[0];
      finishPtCoord = currentHead ? project(currentHead) : fullScreenPoints[fullScreenPoints.length - 1];

      // Project waypoint locations along the route
      if (editorial.waypoints && editorial.waypoints.length > 0) {
        for (const wp of editorial.waypoints) {
          if (!wp.enabled) continue;
          if (wp.manualCoord) {
            waypointCoords.push({
              wp,
              x: mapX + (wp.manualCoord.xPct / 100) * mapW,
              y: mapY + (wp.manualCoord.yPct / 100) * mapH
            });
          } else {
            const index = Math.min(
              fullScreenPoints.length - 1,
              Math.max(0, Math.floor(wp.locationRatio * (fullScreenPoints.length - 1)))
            );
            waypointCoords.push({
              wp,
              x: fullScreenPoints[index].x,
              y: fullScreenPoints[index].y
            });
          }
        }
      }
    }

    // Optional fill under route
    if (mapConf.routeFillUnder && screenPoints.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.lineTo(screenPoints[screenPoints.length - 1].x, mapY + mapH);
      ctx.lineTo(screenPoints[0].x, mapY + mapH);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(mapConf.routeFillColor || '#1565C0', (mapConf.routeFillOpacity ?? 12) / 100);
      ctx.fill();
      ctx.restore();
    }

    // Glow under route
    if (mapConf.routeGlow && screenPoints.length > 1) {
      ctx.save();
      ctx.shadowColor = hexToRgba(mapConf.routeColor || '#1565C0', 0.5);
      ctx.shadowBlur = 16;
      ctx.strokeStyle = hexToRgba(mapConf.routeColor || '#1565C0', 0.6);
      ctx.lineWidth = (mapConf.routeWidth || 7) + 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Outer white halo outline for contrast
    if (mapConf.routeOutlineWidth > 0 && screenPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = mapConf.routeOutlineColor || '#FFFFFF';
      ctx.lineWidth = (mapConf.routeWidth || 7) + (mapConf.routeOutlineWidth * 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Vibrant main route stroke
    if (screenPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = mapConf.routeColor || '#1565C0';
      ctx.lineWidth = mapConf.routeWidth || 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Start & Finish Markers
    if (mapConf.showStartMarker && startPtCoord) {
      drawVectorIcon(
        ctx,
        mapConf.markerStyle === 'pin' ? 'pin' : 'circle',
        startPtCoord.x,
        startPtCoord.y,
        mapConf.markerSize || 14,
        mapConf.startMarkerColor || '#10B981'
      );
    }
    if (mapConf.showFinishMarker && finishPtCoord) {
      drawVectorIcon(
        ctx,
        mapConf.markerStyle === 'flag' ? 'flag' : 'circle',
        finishPtCoord.x,
        finishPtCoord.y,
        mapConf.markerSize || 14,
        mapConf.finishMarkerColor || '#EF4444'
      );
    }

    // Render Waypoints & Labels with connector lines
    for (const item of waypointCoords) {
      renderEnRouteWaypoint(ctx, item.wp, item.x, item.y, mapX, mapY, mapW, mapH);
    }
  }

  ctx.restore(); // end clip
  ctx.restore(); // end map container

  if (selectedId === 'map') {
    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    drawRoundedRect(ctx, mapX - 4, mapY - 4, mapW + 8, mapH + 8, (mapConf.borderRadius || 20) + 4);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Render Minimalist Background Grid for Map Panel
 */
function renderMinimalistMapGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  style: string
) {
  ctx.save();
  const isDark = style === 'dark';
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)';
  ctx.lineWidth = 1;

  const gridSize = 45;
  for (let gx = x; gx <= x + w; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Render Waypoint POI on Map
 */
function renderEnRouteWaypoint(
  ctx: CanvasRenderingContext2D,
  wp: EnRouteWaypointMarker,
  wx: number,
  wy: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number
) {
  ctx.save();

  // POI pin marker on the route
  drawVectorIcon(ctx, wp.iconType || 'pin', wx, wy, wp.iconSize || 14, wp.iconColor || '#1565C0');

  // Compute label position slightly offset from the waypoint
  const isNearTop = wy - mapY < 60;
  const isNearRight = mapX + mapW - wx < 100;
  
  const labelOffsetX = isNearRight ? -70 : 30;
  const labelOffsetY = isNearTop ? 30 : -35;
  const badgeX = wx + labelOffsetX;
  const badgeY = wy + labelOffsetY;

  // Connector line from route to label badge
  if (wp.connectorLine) {
    ctx.save();
    ctx.strokeStyle = wp.connectorColor || 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = wp.connectorWidth || 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(badgeX, badgeY);
    ctx.stroke();
    ctx.restore();
  }

  // Measure text for badge background box
  ctx.font = `${wp.labelTypography?.fontWeight || '800'} ${wp.labelTypography?.fontSize || 11}px sans-serif`;
  const labelMetrics = ctx.measureText(wp.label || '');
  const subMetrics = wp.sublabel ? ctx.measureText(wp.sublabel) : { width: 0 };
  const textW = Math.max(labelMetrics.width, subMetrics.width);
  const padX = wp.badgePaddingX || 10;
  const padY = wp.badgePaddingY || 5;
  const boxW = textW + padX * 2 + 10;
  const boxH = wp.sublabel ? 36 : 24;

  const bx = badgeX - boxW / 2;
  const by = badgeY - boxH / 2;

  // Draw pill background
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = hexToRgba(wp.badgeBgColor || '#FFFFFF', (wp.badgeBgOpacity ?? 95) / 100);
  drawRoundedRect(ctx, bx, by, boxW, boxH, wp.badgeBorderRadius || 8);
  ctx.fill();
  ctx.restore();

  // Render Label Text
  renderCustomTypographyText(
    ctx,
    wp.label,
    badgeX,
    wp.sublabel ? badgeY - 5 : badgeY,
    wp.labelTypography
  );

  // Render Sublabel (Altitude / KM)
  if (wp.sublabel) {
    renderCustomTypographyText(
      ctx,
      wp.sublabel,
      badgeX,
      badgeY + 8,
      wp.sublabelTypography
    );
  }

  ctx.restore();
}

/**
 * Render Floating Badges (Time, Distance, Note, Pace)
 */
function renderEnRouteFloatingBadges(
  ctx: CanvasRenderingContext2D,
  editorial: EnRouteConfig,
  selectedId?: string | null
) {
  if (!editorial.badges || editorial.badges.length === 0) return;

  for (const badge of editorial.badges) {
    if (!badge.enabled || !badge.text) continue;

    const bx = (badge.xPct / 100) * CANVAS_WIDTH;
    const by = (badge.yPct / 100) * CANVAS_HEIGHT;

    ctx.save();
    if (badge.rotation) {
      ctx.translate(bx, by);
      ctx.rotate((badge.rotation * Math.PI) / 180);
      ctx.translate(-bx, -by);
    }

    // Measure text to compute box width if autoWidth is true
    ctx.font = `${badge.typography.fontWeight} ${badge.typography.fontSize}px sans-serif`;
    const textMetrics = ctx.measureText(badge.text);
    const hasIcon = badge.icon && badge.icon !== 'none';
    const iconGap = hasIcon ? (badge.iconSize || 15) + 8 : 0;
    const padX = badge.paddingX || 14;
    const padY = badge.paddingY || 8;
    const boxW = badge.autoWidth ? textMetrics.width + padX * 2 + iconGap : badge.widthPx || 140;
    const boxH = badge.heightPx || 38;

    const startX = bx - boxW / 2;
    const startY = by - boxH / 2;

    // Shadow
    if (badge.shadow) {
      ctx.shadowColor = badge.shadowColor || 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = badge.shadowBlur ?? 10;
      ctx.shadowOffsetY = badge.shadowOffsetY ?? 3;
    }

    // Background pill
    ctx.fillStyle = hexToRgba(badge.bgColor || '#FFFFFF', (badge.bgOpacity ?? 95) / 100);
    drawRoundedRect(ctx, startX, startY, boxW, boxH, badge.borderRadius || 12);
    ctx.fill();

    // Border
    if (badge.borderEnabled && badge.borderWidth > 0) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = badge.borderColor || '#E2E8F0';
      ctx.lineWidth = badge.borderWidth;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Icon
    let textDrawX = bx;
    if (hasIcon) {
      const iconCenterX = startX + padX + (badge.iconSize || 15) / 2;
      const iconCenterY = by;
      drawVectorIcon(
        ctx,
        badge.icon,
        iconCenterX,
        iconCenterY,
        badge.iconSize || 15,
        badge.iconColor || '#1565C0'
      );
      textDrawX = startX + padX + iconGap + (badge.autoWidth ? textMetrics.width / 2 : (boxW - padX * 2 - iconGap) / 2);
    }

    // Text with custom typography
    renderCustomTypographyText(
      ctx,
      badge.text,
      textDrawX,
      by,
      badge.typography
    );

    if (selectedId === badge.id) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      drawRoundedRect(ctx, startX - 3, startY - 3, boxW + 6, boxH + 6, (badge.borderRadius || 12) + 3);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Render Footer Credits (Instagram | Google Maps • @athlete)
 */
function renderEnRouteFooter(
  ctx: CanvasRenderingContext2D,
  editorial: EnRouteConfig,
  selectedId?: string | null
) {
  const credits = editorial.credits;
  if (!credits || !credits.enabled) return;

  const cx = (credits.xPct / 100) * CANVAS_WIDTH;
  const cy = (credits.yPct / 100) * CANVAS_HEIGHT;

  ctx.save();

  // Optional background container box
  if (credits.bgBoxEnabled) {
    const padX = credits.bgBoxPaddingX || 18;
    const padY = credits.bgBoxPaddingY || 8;
    const boxW = 340;
    const boxH = 50;
    ctx.fillStyle = hexToRgba(credits.bgBoxColor || '#000000', (credits.bgBoxOpacity ?? 70) / 100);
    drawRoundedRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, credits.bgBoxRadius || 12);
    ctx.fill();
  }

  // Line 1: Credits text (e.g. "Instagram | Google Maps")
  if (credits.creditsText) {
    renderCustomTypographyText(
      ctx,
      credits.creditsText,
      cx,
      cy - 12,
      credits.creditsTypography
    );
  }

  // Line 2: Athlete Name (e.g. "@runner")
  if (credits.athleteName) {
    renderCustomTypographyText(
      ctx,
      credits.athleteName,
      cx,
      cy + 12,
      credits.athleteTypography
    );
  }

  if (selectedId === 'credits') {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(SAFE_SIDE, cy - 25, CANVAS_WIDTH - (SAFE_SIDE * 2), 50);
  }

  ctx.restore();
}
