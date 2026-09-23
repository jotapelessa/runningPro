import { 
  UserActivity, 
  StoryConfig, 
  StravaAppConfig,
  StravaAppMetricCardItem,
  RoutePoint,
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

/**
 * Standard Typography Initializer
 */
export function createDefaultTypography(
  overrides?: Partial<TypographyConfig>
): TypographyConfig {
  return {
    fontFamily: 'inherit',
    fontSize: 18,
    fontWeight: '400',
    fontStyle: 'normal',
    underline: false,
    strikethrough: false,
    letterSpacing: 0,
    lineHeight: 1.2,
    wordSpacing: 0,
    textAlign: 'left',
    textTransform: 'none',
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    color: '#FFFFFF',
    opacity: 100,
    gradientEnabled: false,
    gradientEndColor: '#FC4C02',
    shadowEnabled: false,
    shadowColor: 'rgba(0, 0, 0, 0.75)',
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    shadowOpacity: 80,
    strokeEnabled: false,
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeOpacity: 100,
    bgBoxEnabled: false,
    bgBoxColor: 'rgba(0, 0, 0, 0.5)',
    bgBoxOpacity: 100,
    bgBoxRadius: 6,
    bgBoxPadding: 6,
    ...overrides
  };
}

/**
 * Standard factory defaults for Template 2 — Strava App
 */
export function getDefaultStravaAppConfig(activity?: UserActivity, athleteName?: string): StravaAppConfig {
  // Format initial activity values
  const typeStr = activity?.type === 'walk' ? 'Caminhada' : 
                  activity?.type === 'trail' ? 'Corrida em Trilha' : 
                  activity?.type === 'treadmill' ? 'Esteira' : 'Corrida';

  let dateStr = '19 de Setembro de 2026';
  let timeStr = '07:15';
  if (activity?.date) {
    try {
      const d = new Date(activity.date);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      // fallback
    }
  }

  const durationStr = activity?.durationFormatted || '45:20';
  const distStr = activity?.distanceKm ? `${activity.distanceKm.toFixed(2)}` : '10.00';
  const gainStr = activity?.elevationGainMeters ? `+${Math.round(activity.elevationGainMeters)}` : '+145';

  return {
    background: {
      type: 'photo',
      solidColor: '#0F1115',
      customPhotoUrl: null,
      filter: 'none',
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      blur: 0,
      overlayColor: '#000000',
      overlayOpacity: 15,
      gradientTop: true,
      gradientTopColor: '#000000',
      gradientTopHeightPct: 25,
      gradientTopOpacity: 55,
      gradientBottom: true,
      gradientBottomColor: '#000000',
      gradientBottomHeightPct: 35,
      gradientBottomOpacity: 70,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0
    },

    topCard: {
      enabled: true,
      xPct: 5.0,        // 54px from left (inside safe side)
      yPct: 14.0,       // just below safe top
      widthPct: 48.0,   // ~518px wide
      heightPct: 21.0,  // ~400px high
      bgColor: '#121316',
      bgOpacity: 82,
      borderRadius: 20,
      shadowColor: '#000000',
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 8,
      shadowOpacity: 45,
      padding: 24,
      linesOrder: ['brand', 'activityType', 'location', 'date', 'time'],

      brand: {
        enabled: true,
        iconEnabled: true,
        iconType: 'strava',
        iconSize: 22,
        iconColor: '#FC4C02',
        text: 'STRAVA',
        textEnabled: true,
        fontSize: 18,
        fontWeight: 'black',
        letterSpacing: 3,
        textColor: '#FC4C02',
        offsetY: 0,
        typography: createDefaultTypography({
          fontSize: 18,
          fontWeight: '900',
          letterSpacing: 3,
          color: '#FC4C02',
          textTransform: 'uppercase'
        })
      },

      activityType: {
        enabled: true,
        text: typeStr,
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 0,
        textColor: '#FFFFFF',
        opacity: 100,
        textTransform: 'none',
        fontFamily: 'sans',
        align: 'left',
        offsetY: 8,
        typography: createDefaultTypography({
          fontSize: 32,
          fontWeight: '700',
          letterSpacing: 0,
          color: '#FFFFFF',
          textTransform: 'none',
          offsetY: 8
        })
      },

      location: {
        enabled: true,
        text: activity?.title || 'São Paulo, Brasil',
        iconEnabled: true,
        iconType: 'pin',
        iconSize: 15,
        iconColor: '#94A3B8',
        fontSize: 16,
        fontWeight: 'normal',
        letterSpacing: 0,
        textColor: '#CBD5E1',
        offsetY: 10,
        typography: createDefaultTypography({
          fontSize: 16,
          fontWeight: '400',
          color: '#CBD5E1',
          offsetY: 10
        })
      },

      date: {
        enabled: true,
        text: dateStr,
        format: 'long',
        iconEnabled: true,
        iconType: 'calendar',
        iconSize: 15,
        iconColor: '#94A3B8',
        fontSize: 15,
        fontWeight: 'normal',
        letterSpacing: 0,
        textColor: '#94A3B8',
        offsetY: 6,
        typography: createDefaultTypography({
          fontSize: 15,
          fontWeight: '400',
          color: '#94A3B8',
          offsetY: 6
        })
      },

      time: {
        enabled: true,
        text: timeStr,
        format: '24h',
        iconEnabled: true,
        iconType: 'clock',
        iconSize: 15,
        iconColor: '#94A3B8',
        fontSize: 15,
        fontWeight: 'normal',
        letterSpacing: 0,
        textColor: '#94A3B8',
        offsetY: 6,
        typography: createDefaultTypography({
          fontSize: 15,
          fontWeight: '400',
          color: '#94A3B8',
          offsetY: 6
        })
      }
    },

    mapPanel: {
      enabled: true,
      xPct: 56.0,
      yPct: 14.0,
      widthPct: 39.0,   // ~420px wide
      heightPct: 38.0,  // ~730px tall (matches top card + space)
      borderRadius: 20,
      opacity: 92,
      bgColor: '#1E232B',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
      shadowColor: '#000000',
      shadowBlur: 24,
      shadowOffsetX: 0,
      shadowOffsetY: 10,
      shadowOpacity: 50,
      mapStyle: 'light',
      routeColor: '#FC4C02',
      routeWidth: 8,
      routeHaloColor: 'rgba(0, 0, 0, 0.45)',
      routeHaloWidth: 14,
      smoothing: true,
      showStartPin: true,
      showFinishPin: true,
      pinStyle: 'circle',
      startPinColor: '#10B981',
      finishPinColor: '#EF4444',
      pinSize: 10,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0
    },

    metricsRow: {
      enabled: true,
      xPct: 5.0,
      yPct: 56.0,
      widthPct: 90.0,
      gap: 16,
      cardHeight: 140,
      bgColor: '#121316',
      bgOpacity: 85,
      borderRadius: 18,
      shadowColor: '#000000',
      shadowBlur: 18,
      shadowOpacity: 40,
      padding: 18,
      cards: [
        {
          id: 'duration',
          enabled: true,
          iconEnabled: true,
          iconType: 'stopwatch',
          iconColor: '#FC4C02',
          iconSize: 18,
          label: 'DURAÇÃO',
          labelEnabled: true,
          labelColor: '#94A3B8',
          labelFontSize: 13,
          labelFontWeight: 'bold',
          labelTransform: 'uppercase',
          labelTypography: createDefaultTypography({
            fontSize: 13,
            fontWeight: '700',
            color: '#94A3B8',
            textTransform: 'uppercase'
          }),
          value: durationStr,
          valueEnabled: true,
          valueColor: '#FFFFFF',
          valueFontSize: 34,
          valueFontWeight: 'black',
          valueTypography: createDefaultTypography({
            fontSize: 34,
            fontWeight: '900',
            color: '#FFFFFF'
          }),
          unit: '',
          unitEnabled: false,
          unitColor: '#94A3B8',
          unitFontSize: 14,
          unitTypography: createDefaultTypography({
            fontSize: 14,
            fontWeight: '700',
            color: '#94A3B8'
          }),
          textAlign: 'left',
          autoField: 'duration'
        },
        {
          id: 'distance',
          enabled: true,
          iconEnabled: true,
          iconType: 'pin',
          iconColor: '#FC4C02',
          iconSize: 18,
          label: 'DISTÂNCIA',
          labelEnabled: true,
          labelColor: '#94A3B8',
          labelFontSize: 13,
          labelFontWeight: 'bold',
          labelTransform: 'uppercase',
          labelTypography: createDefaultTypography({
            fontSize: 13,
            fontWeight: '700',
            color: '#94A3B8',
            textTransform: 'uppercase'
          }),
          value: distStr,
          valueEnabled: true,
          valueColor: '#FFFFFF',
          valueFontSize: 34,
          valueFontWeight: 'black',
          valueTypography: createDefaultTypography({
            fontSize: 34,
            fontWeight: '900',
            color: '#FFFFFF'
          }),
          unit: 'km',
          unitEnabled: true,
          unitColor: '#FC4C02',
          unitFontSize: 16,
          unitTypography: createDefaultTypography({
            fontSize: 16,
            fontWeight: '700',
            color: '#FC4C02'
          }),
          textAlign: 'left',
          autoField: 'distance'
        },
        {
          id: 'elevation',
          enabled: true,
          iconEnabled: true,
          iconType: 'mountain',
          iconColor: '#FC4C02',
          iconSize: 18,
          label: 'ELEVAÇÃO',
          labelEnabled: true,
          labelColor: '#94A3B8',
          labelFontSize: 13,
          labelFontWeight: 'bold',
          labelTransform: 'uppercase',
          labelTypography: createDefaultTypography({
            fontSize: 13,
            fontWeight: '700',
            color: '#94A3B8',
            textTransform: 'uppercase'
          }),
          value: gainStr,
          valueEnabled: true,
          valueColor: '#FFFFFF',
          valueFontSize: 34,
          valueFontWeight: 'black',
          valueTypography: createDefaultTypography({
            fontSize: 34,
            fontWeight: '900',
            color: '#FFFFFF'
          }),
          unit: 'm',
          unitEnabled: true,
          unitColor: '#94A3B8',
          unitFontSize: 16,
          unitTypography: createDefaultTypography({
            fontSize: 16,
            fontWeight: '700',
            color: '#94A3B8'
          }),
          textAlign: 'left',
          autoField: 'elevation'
        }
      ]
    },

    elevationChart: {
      enabled: true,
      xPct: 5.0,
      yPct: 67.0,
      widthPct: 90.0,
      heightPct: 14.0,  // ~270px tall
      bgColor: '#121316',
      bgOpacity: 85,
      borderRadius: 18,
      shadow: true,
      lineColor: '#FC4C02',
      lineWidth: 4,
      smoothing: true,
      fillEnabled: true,
      fillTopColor: 'rgba(252, 76, 2, 0.35)',
      fillBottomColor: 'rgba(252, 76, 2, 0.02)',
      fillOpacity: 100,
      guidelinesEnabled: true,
      guidelineColor: 'rgba(255, 255, 255, 0.1)',
      guidelineWidth: 1,
      guidelineOpacity: 100,
      yAxisEnabled: true,
      yAxisColor: '#94A3B8',
      yAxisFontSize: 13,
      yAxisMarksCount: 3,
      yAxisTypography: createDefaultTypography({
        fontSize: 13,
        fontWeight: '400',
        color: '#94A3B8',
        textAlign: 'right'
      }),
      verticalScale: 1.0,
      horizontalStretch: 1.0
    },

    floatingElements: [],
    accentColor: '#FC4C02',
    secondaryColor: '#FFFFFF',
    textPrimaryColor: '#FFFFFF',
    textSecondaryColor: '#94A3B8',
    cardBgColor: '#121316',
    globalFont: 'sans',
    baseFontSize: 16,
    globalTypography: {
      fontFamily: 'Inter',
      fontWeight: '400',
      baseScale: 1.0,
      letterSpacing: 0,
      color: '#FFFFFF'
    }
  };
}

/**
 * Utility: Draw Rounded Rectangle with individual or uniform corners
 */
function drawRoundedRect(
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
 * High-Precision Canvas Typography Rendering Engine
 * Handles custom fonts, weights, italic, underline, strikethrough,
 * tracking, word-spacing, alignment, rotation, stroke, shadow, gradients, and badges.
 */
export function renderCustomTypographyText(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseX: number,
  baseY: number,
  typoConfig: TypographyConfig | undefined,
  legacyFallback?: {
    fontSize?: number;
    fontWeight?: string;
    textColor?: string;
    fontFamily?: string;
    letterSpacing?: number;
    opacity?: number;
    textTransform?: string;
    align?: string;
  },
  globalTypography?: StravaAppConfig['globalTypography']
): { width: number; height: number } {
  if (!text) return { width: 0, height: 0 };

  const typo: TypographyConfig = typoConfig || createDefaultTypography({
    fontSize: legacyFallback?.fontSize || 18,
    fontWeight: (legacyFallback?.fontWeight === 'black' ? '900' : legacyFallback?.fontWeight === 'bold' ? '700' : '400') as any,
    color: legacyFallback?.textColor || '#FFFFFF',
    fontFamily: legacyFallback?.fontFamily || 'inherit',
    letterSpacing: legacyFallback?.letterSpacing || 0,
    opacity: legacyFallback?.opacity ?? 100,
    textTransform: (legacyFallback?.textTransform || 'none') as any,
    textAlign: (legacyFallback?.align || 'left') as any,
  });

  // 1. Text Transformation
  let displayText = text;
  if (typo.textTransform === 'uppercase') {
    displayText = displayText.toUpperCase();
  } else if (typo.textTransform === 'lowercase') {
    displayText = displayText.toLowerCase();
  } else if (typo.textTransform === 'capitalize') {
    displayText = displayText.replace(/\b\w/g, c => c.toUpperCase());
  }

  // 2. Resolve Font Family
  let resolvedFamily = typo.fontFamily;
  if (!resolvedFamily || resolvedFamily === 'inherit') {
    resolvedFamily = globalTypography?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  if (resolvedFamily === 'sans') resolvedFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  else if (resolvedFamily === 'mono') resolvedFamily = '"JetBrains Mono", monospace';
  else if (resolvedFamily === 'display') resolvedFamily = '"Space Grotesk", sans-serif';

  const baseScale = globalTypography?.baseScale || 1.0;
  const fontSize = Math.max(8, Math.round((typo.fontSize || 18) * baseScale));
  const fontStyle = typo.fontStyle === 'italic' ? 'italic' : 'normal';
  const fontWeight = typo.fontWeight || globalTypography?.fontWeight || '400';

  ctx.save();

  // 3. Translation & Rotation
  const posX = baseX + (typo.offsetX || 0);
  const posY = baseY + (typo.offsetY || 0);

  ctx.translate(posX, posY);
  if (typo.rotation) {
    ctx.rotate((typo.rotation * Math.PI) / 180);
  }

  // 4. Canvas Font & Spacing Properties
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${resolvedFamily}`;
  ctx.textAlign = typo.textAlign || 'left';
  ctx.textBaseline = 'middle';

  const letterSpacing = (typo.letterSpacing ?? 0) + (globalTypography?.letterSpacing ?? 0);
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = `${letterSpacing}px`;
  }
  if ('wordSpacing' in ctx && typo.wordSpacing) {
    (ctx as any).wordSpacing = `${typo.wordSpacing}px`;
  }

  const metrics = ctx.measureText(displayText);
  const textW = metrics.width;
  const textH = fontSize * (typo.lineHeight || 1.2);

  // 5. Background Highlight Box (Optional Badge)
  if (typo.bgBoxEnabled) {
    ctx.save();
    const pad = typo.bgBoxPadding || 6;
    let boxX = 0;
    if (typo.textAlign === 'center') boxX = -textW / 2;
    else if (typo.textAlign === 'right') boxX = -textW;
    boxX -= pad;
    const boxY = -textH / 2 - pad;
    const boxW = textW + pad * 2;
    const boxH = textH + pad * 2;

    ctx.globalAlpha = Math.max(0, Math.min(1, (typo.bgBoxOpacity ?? 100) / 100));
    ctx.fillStyle = typo.bgBoxColor || 'rgba(0, 0, 0, 0.6)';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, typo.bgBoxRadius || 6);
    ctx.fill();
    ctx.restore();
  }

  // 6. Text Shadow
  if (typo.shadowEnabled) {
    const shadowAlpha = (typo.shadowOpacity ?? 80) / 100;
    ctx.shadowColor = hexToRgba(typo.shadowColor || '#000000', shadowAlpha);
    ctx.shadowBlur = typo.shadowBlur ?? 8;
    ctx.shadowOffsetX = typo.shadowOffsetX ?? 0;
    ctx.shadowOffsetY = typo.shadowOffsetY ?? 2;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // 7. Text Fill Color / Gradient
  const fillAlpha = Math.max(0, Math.min(1, (typo.opacity ?? 100) / 100));
  ctx.globalAlpha = fillAlpha;

  if (typo.gradientEnabled && typo.gradientEndColor) {
    const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    grad.addColorStop(0, typo.color || '#FFFFFF');
    grad.addColorStop(1, typo.gradientEndColor);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = typo.color || '#FFFFFF';
  }

  // 8. Text Outline (Stroke)
  if (typo.strokeEnabled && (typo.strokeWidth || 1) > 0) {
    ctx.save();
    ctx.strokeStyle = typo.strokeColor || '#000000';
    ctx.lineWidth = typo.strokeWidth || 1;
    ctx.globalAlpha = fillAlpha * Math.max(0, Math.min(1, (typo.strokeOpacity ?? 100) / 100));
    ctx.strokeText(displayText, 0, 0);
    ctx.restore();
  }

  // 9. Main Text Fill
  ctx.fillText(displayText, 0, 0);

  // 10. Underline / Strikethrough
  if (typo.underline || typo.strikethrough) {
    ctx.save();
    ctx.strokeStyle = typo.color || '#FFFFFF';
    ctx.lineWidth = Math.max(1, fontSize * 0.08);

    let startX = 0;
    if (typo.textAlign === 'center') startX = -textW / 2;
    else if (typo.textAlign === 'right') startX = -textW;
    const endX = startX + textW;

    if (typo.underline) {
      const uY = fontSize * 0.55;
      ctx.beginPath();
      ctx.moveTo(startX, uY);
      ctx.lineTo(endX, uY);
      ctx.stroke();
    }
    if (typo.strikethrough) {
      const sY = 0;
      ctx.beginPath();
      ctx.moveTo(startX, sY);
      ctx.lineTo(endX, sY);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
  return { width: textW, height: textH };
}

/**
 * Draw crisp vector icons directly on Canvas 2D
 */
function drawVectorIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 24; // Normalized 24px viewBox
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'strava':
      // Strava double chevron authentic logo
      ctx.beginPath();
      ctx.moveTo(-7, 7);
      ctx.lineTo(0, -7);
      ctx.lineTo(7, 7);
      ctx.lineTo(3.5, 7);
      ctx.lineTo(0, 0);
      ctx.lineTo(-3.5, 7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(3.5, 7);
      ctx.lineTo(1.5, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-1.5, 7);
      ctx.closePath();
      ctx.fill();
      break;

    case 'stopwatch':
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, -8);
      ctx.lineTo(3, -8);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -6);
      ctx.moveTo(0, 2);
      ctx.lineTo(3, 2);
      ctx.stroke();
      break;

    case 'pin':
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.moveTo(0, 3);
      ctx.lineTo(0, 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'mountain':
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(-2, -6);
      ctx.lineTo(4, 2);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, -1);
      ctx.lineTo(6, -7);
      ctx.lineTo(10, 2);
      ctx.stroke();
      break;

    case 'calendar':
      ctx.beginPath();
      drawRoundedRect(ctx, -8, -6, 16, 15, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -1);
      ctx.lineTo(8, -1);
      ctx.moveTo(-5, -9);
      ctx.lineTo(-5, -6);
      ctx.moveTo(5, -9);
      ctx.lineTo(5, -6);
      ctx.stroke();
      break;

    case 'clock':
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 0);
      ctx.lineTo(4, 2);
      ctx.stroke();
      break;

    case 'heart':
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(-7, 1, -8, -5, -4, -7);
      ctx.bezierCurveTo(-1, -8, 0, -4, 0, -4);
      ctx.bezierCurveTo(0, -4, 1, -8, 4, -7);
      ctx.bezierCurveTo(8, -5, 7, 1, 0, 6);
      ctx.stroke();
      break;

    case 'flame':
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-6, 8, -8, 2, -5, -3);
      ctx.bezierCurveTo(-4, -5, -1, -8, 0, -10);
      ctx.bezierCurveTo(1, -7, 4, -5, 5, -2);
      ctx.bezierCurveTo(7, 3, 6, 8, 0, 8);
      ctx.stroke();
      break;

    case 'bolt':
    case 'zap':
      ctx.beginPath();
      ctx.moveTo(2, -9);
      ctx.lineTo(-6, 1);
      ctx.lineTo(0, 1);
      ctx.lineTo(-2, 9);
      ctx.lineTo(6, -1);
      ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fill();
      break;

    default:
      // Default dot circle
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  ctx.restore();
}

/**
 * Render Background Layer
 */
function renderStravaAppBackground(
  ctx: CanvasRenderingContext2D,
  bgConf: StravaAppConfig['background'],
  globalConfig: StoryConfig
) {
  ctx.save();

  // Solid fallback
  ctx.fillStyle = bgConf.solidColor || '#0F1115';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const customPhoto = bgConf.customPhotoUrl || globalConfig.customPhotoUrl;

  if (bgConf.type === 'photo' && customPhoto) {
    const img = storyImageCache.get(customPhoto) || (window as any).__storyPhotoCache?.get(customPhoto) ||
      (document.querySelector(`img[src="${customPhoto}"]`) as HTMLImageElement);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();

      // CSS Filters
      const filters: string[] = [];
      if (bgConf.filter === 'grayscale') filters.push('grayscale(100%)');
      if (bgConf.filter === 'sepia') filters.push('sepia(100%)');

      const brightnessVal = 100 + (bgConf.brightness || 0);
      const contrastVal = 100 + (bgConf.contrast || 0);
      const satVal = 100 + (bgConf.saturation || 0);

      filters.push(`brightness(${brightnessVal}%)`);
      filters.push(`contrast(${contrastVal}%)`);
      filters.push(`saturate(${satVal}%)`);

      if (bgConf.blur > 0) {
        filters.push(`blur(${bgConf.blur}px)`);
      }

      ctx.filter = filters.join(' ');

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const baseScale = Math.max(CANVAS_WIDTH / naturalW, CANVAS_HEIGHT / naturalH);
      const zoom = baseScale * (bgConf.zoom || 1.0);
      const dw = naturalW * zoom;
      const dh = naturalH * zoom;
      const dx = (CANVAS_WIDTH - dw) / 2 + (bgConf.panX || 0);
      const dy = (CANVAS_HEIGHT - dh) / 2 + (bgConf.panY || 0);

      if (bgConf.rotation) {
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.rotate((bgConf.rotation * Math.PI) / 180);
        ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
      }

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    }
  }

  // Color Overlay
  if (bgConf.overlayOpacity > 0) {
    ctx.fillStyle = bgConf.overlayColor || '#000000';
    ctx.globalAlpha = (bgConf.overlayOpacity || 15) / 100;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1.0;
  }

  // Top Dark Gradient
  if (bgConf.gradientTop) {
    const gradH = (CANVAS_HEIGHT * (bgConf.gradientTopHeightPct || 25)) / 100;
    const topGrad = ctx.createLinearGradient(0, 0, 0, gradH);
    const col = bgConf.gradientTopColor || '#000000';
    const op = (bgConf.gradientTopOpacity || 55) / 100;
    topGrad.addColorStop(0, hexToRgba(col, op));
    topGrad.addColorStop(1, hexToRgba(col, 0));
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, gradH);
  }

  // Bottom Dark Gradient
  if (bgConf.gradientBottom) {
    const gradH = (CANVAS_HEIGHT * (bgConf.gradientBottomHeightPct || 35)) / 100;
    const botY = CANVAS_HEIGHT - gradH;
    const botGrad = ctx.createLinearGradient(0, botY, 0, CANVAS_HEIGHT);
    const col = bgConf.gradientBottomColor || '#000000';
    const op = (bgConf.gradientBottomOpacity || 70) / 100;
    botGrad.addColorStop(0, hexToRgba(col, 0));
    botGrad.addColorStop(1, hexToRgba(col, op));
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, botY, CANVAS_WIDTH, gradH);
  }

  ctx.restore();
}

/**
 * Render Top-Left Activity Info Card
 */
function renderStravaAppTopCard(
  ctx: CanvasRenderingContext2D,
  topCard: StravaAppConfig['topCard'],
  fontFamily: string,
  globalTypography?: StravaAppConfig['globalTypography']
) {
  if (!topCard.enabled) return;

  const cardX = (CANVAS_WIDTH * topCard.xPct) / 100;
  const cardY = (CANVAS_HEIGHT * topCard.yPct) / 100;
  const cardW = (CANVAS_WIDTH * topCard.widthPct) / 100;
  const cardH = (CANVAS_HEIGHT * topCard.heightPct) / 100;
  const pad = topCard.padding || 24;

  ctx.save();

  // Shadow
  if (topCard.shadowOpacity > 0) {
    ctx.shadowColor = hexToRgba(topCard.shadowColor || '#000000', topCard.shadowOpacity / 100);
    ctx.shadowBlur = topCard.shadowBlur || 20;
    ctx.shadowOffsetX = topCard.shadowOffsetX || 0;
    ctx.shadowOffsetY = topCard.shadowOffsetY || 8;
  }

  // Card Background
  ctx.fillStyle = hexToRgba(topCard.bgColor || '#121316', topCard.bgOpacity / 100);
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, topCard.borderRadius || 20);
  ctx.fill();

  // Border if specified
  if (topCard.borderWidth && topCard.borderWidth > 0) {
    ctx.strokeStyle = hexToRgba(topCard.borderColor || 'rgba(255, 255, 255, 0.15)', 1);
    ctx.lineWidth = topCard.borderWidth;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, topCard.borderRadius || 20);
    ctx.stroke();
  }

  // Reset shadow for text rendering
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Render internal lines in order
  let currentY = cardY + pad + 10;

  topCard.linesOrder.forEach((lineKey) => {
    switch (lineKey) {
      case 'brand': {
        const b = topCard.brand;
        if (!b.enabled) return;
        currentY += b.offsetY || 0;
        let startX = cardX + pad + (b.offsetX || 0);

        if (b.iconEnabled) {
          drawVectorIcon(
            ctx,
            b.iconType || 'strava',
            startX + b.iconSize / 2 + (b.iconOffsetX || 0),
            currentY - 2 + (b.iconOffsetY || 0),
            b.iconSize,
            b.iconColor || '#FC4C02'
          );
          startX += b.iconSize + 10;
        }

        if (b.textEnabled && b.text) {
          renderCustomTypographyText(
            ctx,
            b.text,
            startX,
            currentY,
            b.typography,
            {
              fontSize: b.fontSize || 18,
              fontWeight: b.fontWeight || '900',
              textColor: b.textColor || '#FC4C02',
              letterSpacing: b.letterSpacing || 3,
              fontFamily
            },
            globalTypography
          );
        }
        currentY += (b.typography?.fontSize || b.fontSize || 18) + 14;
        break;
      }

      case 'activityType': {
        const act = topCard.activityType;
        if (!act.enabled || !act.text) return;
        currentY += act.offsetY || 0;

        const effectiveAlign = act.typography?.textAlign || act.align || 'left';
        const alignX = (effectiveAlign === 'center' ? cardX + cardW / 2 :
                       effectiveAlign === 'right' ? cardX + cardW - pad : cardX + pad) + (act.offsetX || 0);

        const effSize = act.typography?.fontSize || act.fontSize || 32;
        renderCustomTypographyText(
          ctx,
          act.text,
          alignX,
          currentY + effSize / 2,
          act.typography,
          {
            fontSize: act.fontSize || 32,
            fontWeight: act.fontWeight || '700',
            textColor: act.textColor || '#FFFFFF',
            opacity: act.opacity || 100,
            textTransform: act.textTransform || 'none',
            align: act.align || 'left',
            fontFamily
          },
          globalTypography
        );
        currentY += effSize + 12;
        break;
      }

      case 'location': {
        const loc = topCard.location;
        if (!loc.enabled || !loc.text) return;
        currentY += loc.offsetY || 0;
        let startX = cardX + pad + (loc.offsetX || 0);

        if (loc.iconEnabled) {
          drawVectorIcon(
            ctx,
            loc.iconType || 'pin',
            startX + loc.iconSize / 2 + (loc.iconOffsetX || 0),
            currentY + (loc.fontSize / 2) + (loc.iconOffsetY || 0),
            loc.iconSize,
            loc.iconColor || '#94A3B8'
          );
          startX += loc.iconSize + 8;
        }

        const effSize = loc.typography?.fontSize || loc.fontSize || 16;
        renderCustomTypographyText(
          ctx,
          loc.text,
          startX,
          currentY + effSize / 2,
          loc.typography,
          {
            fontSize: loc.fontSize || 16,
            fontWeight: loc.fontWeight || 'normal',
            textColor: loc.textColor || '#CBD5E1',
            fontFamily
          },
          globalTypography
        );
        currentY += effSize + 10;
        break;
      }

      case 'date': {
        const d = topCard.date;
        if (!d.enabled || !d.text) return;
        currentY += d.offsetY || 0;
        let startX = cardX + pad + (d.offsetX || 0);

        if (d.iconEnabled) {
          drawVectorIcon(
            ctx,
            d.iconType || 'calendar',
            startX + d.iconSize / 2 + (d.iconOffsetX || 0),
            currentY + (d.fontSize / 2) + (d.iconOffsetY || 0),
            d.iconSize,
            d.iconColor || '#94A3B8'
          );
          startX += d.iconSize + 8;
        }

        const effSize = d.typography?.fontSize || d.fontSize || 15;
        renderCustomTypographyText(
          ctx,
          d.text,
          startX,
          currentY + effSize / 2,
          d.typography,
          {
            fontSize: d.fontSize || 15,
            fontWeight: d.fontWeight || 'normal',
            textColor: d.textColor || '#94A3B8',
            fontFamily
          },
          globalTypography
        );
        currentY += effSize + 8;
        break;
      }

      case 'time': {
        const tm = topCard.time;
        if (!tm.enabled || !tm.text) return;
        currentY += tm.offsetY || 0;
        let startX = cardX + pad + (tm.offsetX || 0);

        if (tm.iconEnabled) {
          drawVectorIcon(
            ctx,
            tm.iconType || 'clock',
            startX + tm.iconSize / 2 + (tm.iconOffsetX || 0),
            currentY + (tm.fontSize / 2) + (tm.iconOffsetY || 0),
            tm.iconSize,
            tm.iconColor || '#94A3B8'
          );
          startX += tm.iconSize + 8;
        }

        const effSize = tm.typography?.fontSize || tm.fontSize || 15;
        renderCustomTypographyText(
          ctx,
          tm.text,
          startX,
          currentY + effSize / 2,
          tm.typography,
          {
            fontSize: tm.fontSize || 15,
            fontWeight: tm.fontWeight || 'normal',
            textColor: tm.textColor || '#94A3B8',
            fontFamily
          },
          globalTypography
        );
        currentY += effSize + 8;
        break;
      }
    }
  });

  ctx.restore();
}

/**
 * Render Vertical Map Panel at Right
 */
function renderStravaAppMapPanel(
  ctx: CanvasRenderingContext2D,
  mapConf: StravaAppConfig['mapPanel'],
  activity: UserActivity,
  progressRatio: number
) {
  if (!mapConf.enabled) return;

  const panelX = (CANVAS_WIDTH * mapConf.xPct) / 100;
  const panelY = (CANVAS_HEIGHT * mapConf.yPct) / 100;
  const panelW = (CANVAS_WIDTH * mapConf.widthPct) / 100;
  const panelH = (CANVAS_HEIGHT * mapConf.heightPct) / 100;
  const r = mapConf.borderRadius || 20;

  ctx.save();

  // Shadow
  if (mapConf.shadowOpacity > 0) {
    ctx.shadowColor = hexToRgba(mapConf.shadowColor || '#000000', mapConf.shadowOpacity / 100);
    ctx.shadowBlur = mapConf.shadowBlur || 24;
    ctx.shadowOffsetX = mapConf.shadowOffsetX || 0;
    ctx.shadowOffsetY = mapConf.shadowOffsetY || 10;
  }

  // Clip content inside rounded panel
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, r);
  ctx.fillStyle = hexToRgba(mapConf.bgColor || '#1E232B', (mapConf.opacity || 92) / 100);
  ctx.fill();

  ctx.clip(); // Clip everything to the rounded card

  // Draw Map Background Stylization (streets/grid lines)
  const isLight = mapConf.mapStyle === 'light';
  ctx.fillStyle = isLight ? '#F1F5F9' : '#0F1115';
  ctx.fillRect(panelX, panelY, panelW, panelH);

  // Soft grid lines to mimic real cartography
  ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let gx = panelX; gx < panelX + panelW; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, panelY);
    ctx.lineTo(gx, panelY + panelH);
    ctx.stroke();
  }
  for (let gy = panelY; gy < panelY + panelH; gy += step) {
    ctx.beginPath();
    ctx.moveTo(panelX, gy);
    ctx.lineTo(panelX + panelW, gy);
    ctx.stroke();
  }

  // GPS Route Projection
  const rawRoute = activity.route || [];
  let allPoints: Array<{ lat: number; lng: number }> = [];
  let animatedPoints: Array<{ lat: number; lng: number }> = [];

  if (rawRoute.length > 2) {
    const interpolated = getCachedInterpolatedRoute(activity.id, rawRoute, false);
    allPoints = interpolated.points;
    const slice = getRouteSliceAtRatio(interpolated, progressRatio);
    animatedPoints = slice.points;
  } else {
    // Elegant demo route
    allPoints = [
      { lat: -23.5505, lng: -46.6333 },
      { lat: -23.5480, lng: -46.6300 },
      { lat: -23.5450, lng: -46.6340 },
      { lat: -23.5420, lng: -46.6290 },
      { lat: -23.5390, lng: -46.6310 },
      { lat: -23.5410, lng: -46.6370 },
      { lat: -23.5460, lng: -46.6380 },
      { lat: -23.5500, lng: -46.6350 }
    ];
    const takeCount = Math.max(2, Math.floor(allPoints.length * Math.min(1, Math.max(0.05, progressRatio))));
    animatedPoints = allPoints.slice(0, takeCount);
  }

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  allPoints.forEach((pt) => {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lng < minLon) minLon = pt.lng;
    if (pt.lng > maxLon) maxLon = pt.lng;
  });

  const latSpan = Math.max(0.0008, maxLat - minLat);
  const lonSpan = Math.max(0.0008, maxLon - minLon);
  const pad = 42;
  const projW = panelW - pad * 2;
  const projH = panelH - pad * 2;

  const projX = (lng: number) => panelX + pad + ((lng - minLon) / lonSpan) * projW + (mapConf.panX || 0);
  const projY = (lat: number) => (panelY + panelH - pad) - ((lat - minLat) / latSpan) * projH + (mapConf.panY || 0);

  if (animatedPoints.length > 1) {
    // Route Halo
    if (mapConf.routeHaloWidth > 0) {
      ctx.strokeStyle = mapConf.routeHaloColor || 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = mapConf.routeHaloWidth || 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      animatedPoints.forEach((pt: { lat: number; lng: number }, i: number) => {
        const px = projX(pt.lng);
        const py = projY(pt.lat);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Main Vibrant Route
    ctx.strokeStyle = mapConf.routeColor || '#FC4C02';
    ctx.lineWidth = mapConf.routeWidth || 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    animatedPoints.forEach((pt: { lat: number; lng: number }, i: number) => {
      const px = projX(pt.lng);
      const py = projY(pt.lat);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Start Pin
    if (mapConf.showStartPin && allPoints.length > 0) {
      const startX = projX(allPoints[0].lng);
      const startY = projY(allPoints[0].lat);
      ctx.fillStyle = mapConf.startPinColor || '#10B981';
      ctx.beginPath();
      ctx.arc(startX, startY, mapConf.pinSize || 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Finish Pin
    if (mapConf.showFinishPin && allPoints.length > 1) {
      const endPt = allPoints[allPoints.length - 1];
      const endX = projX(endPt.lng);
      const endY = projY(endPt.lat);
      ctx.fillStyle = mapConf.finishPinColor || '#EF4444';
      ctx.beginPath();
      ctx.arc(endX, endY, mapConf.pinSize || 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Border outline
  if (mapConf.borderWidth > 0) {
    ctx.restore(); // Exit clip
    ctx.save();
    ctx.strokeStyle = mapConf.borderColor || 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = mapConf.borderWidth || 1;
    drawRoundedRect(ctx, panelX, panelY, panelW, panelH, r);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Render Bottom Row of 3 Metric Cards
 */
function renderStravaAppMetricsRow(
  ctx: CanvasRenderingContext2D,
  metricsRow: StravaAppConfig['metricsRow'],
  fontFamily: string,
  globalTypography?: StravaAppConfig['globalTypography']
) {
  if (!metricsRow.enabled || !metricsRow.cards || metricsRow.cards.length === 0) return;

  const rowX = (CANVAS_WIDTH * metricsRow.xPct) / 100;
  const rowY = (CANVAS_HEIGHT * metricsRow.yPct) / 100;
  const totalW = (CANVAS_WIDTH * metricsRow.widthPct) / 100;
  const gap = metricsRow.gap || 16;
  const cardH = metricsRow.cardHeight || 140;
  const count = metricsRow.cards.length;
  const cardW = (totalW - gap * (count - 1)) / count;
  const defaultR = metricsRow.borderRadius || 18;
  const defaultPad = metricsRow.padding || 18;

  // Optional container border
  if (metricsRow.borderWidth && metricsRow.borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(metricsRow.borderColor || 'rgba(255,255,255,0.1)', 1);
    ctx.lineWidth = metricsRow.borderWidth;
    drawRoundedRect(ctx, rowX - 8, rowY - 8, totalW + 16, cardH + 16, defaultR + 4);
    ctx.stroke();
    ctx.restore();
  }

  metricsRow.cards.forEach((card, idx) => {
    if (!card.enabled) return;

    const cx = rowX + idx * (cardW + gap) + (card.offsetX || 0);
    const cy = rowY + (card.offsetY || 0);
    const r = card.borderRadius ?? defaultR;
    const pad = card.padding ?? defaultPad;

    ctx.save();

    // Shadow
    if (metricsRow.shadowOpacity > 0) {
      ctx.shadowColor = hexToRgba(metricsRow.shadowColor || '#000000', metricsRow.shadowOpacity / 100);
      ctx.shadowBlur = metricsRow.shadowBlur || 18;
      ctx.shadowOffsetX = metricsRow.shadowOffsetX || 0;
      ctx.shadowOffsetY = metricsRow.shadowOffsetY || 6;
    }

    // Card BG
    const bgColor = card.cardBgColor || metricsRow.bgColor || '#121316';
    const bgOpacity = card.cardBgOpacity ?? metricsRow.bgOpacity ?? 90;
    ctx.fillStyle = hexToRgba(bgColor, bgOpacity / 100);
    drawRoundedRect(ctx, cx, cy, cardW, cardH, r);
    ctx.fill();

    // Individual Card Border if specified
    if (card.borderWidth && card.borderWidth > 0) {
      ctx.strokeStyle = hexToRgba(card.borderColor || 'rgba(255, 255, 255, 0.15)', 1);
      ctx.lineWidth = card.borderWidth;
      drawRoundedRect(ctx, cx, cy, cardW, cardH, r);
      ctx.stroke();
    }

    // Reset shadow for text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Top icon + Label
    let labelY = cy + pad + 6;
    let labelX = cx + pad;

    if (card.iconEnabled) {
      const iconX = labelX + (card.iconSize / 2) + (card.iconOffsetX || 0);
      const iconY = labelY + 6 + (card.iconOffsetY || 0);
      drawVectorIcon(ctx, card.iconType || 'stopwatch', iconX, iconY, card.iconSize, card.iconColor || '#FC4C02');
      labelX += card.iconSize + 8;
    }

    if (card.labelEnabled && card.label) {
      const lbl = card.labelTransform === 'uppercase' ? card.label.toUpperCase() : card.label;
      const effSize = card.labelTypography?.fontSize || card.labelFontSize || 13;
      const finalLabelX = labelX + (card.labelOffsetX || 0);
      const finalLabelY = labelY + effSize / 2 + (card.labelOffsetY || 0);

      renderCustomTypographyText(
        ctx,
        lbl,
        finalLabelX,
        finalLabelY,
        card.labelTypography,
        {
          fontSize: card.labelFontSize || 13,
          fontWeight: card.labelFontWeight || 'bold',
          textColor: card.labelColor || '#94A3B8',
          textTransform: card.labelTransform || 'uppercase',
          fontFamily
        },
        globalTypography
      );
    }

    // Value + Unit
    if (card.valueEnabled && card.value) {
      const valY = cy + cardH - pad - 6 + (card.valueOffsetY || 0);
      const effValSize = card.valueTypography?.fontSize || card.valueFontSize || 34;
      const textAlign = card.valueTypography?.textAlign || card.textAlign || 'left';
      const baseAlignX = textAlign === 'center' ? cx + cardW / 2 :
                         textAlign === 'right' ? cx + cardW - pad : cx + pad;
      const alignX = baseAlignX + (card.valueOffsetX || 0);

      const valMetrics = renderCustomTypographyText(
        ctx,
        card.value,
        alignX,
        valY - effValSize / 2,
        card.valueTypography,
        {
          fontSize: card.valueFontSize || 34,
          fontWeight: card.valueFontWeight || '900',
          textColor: card.valueColor || '#FFFFFF',
          align: card.textAlign || 'left',
          fontFamily
        },
        globalTypography
      );

      if (card.unitEnabled && card.unit) {
        const effUnitSize = card.unitTypography?.fontSize || card.unitFontSize || 15;
        const uGap = card.unitGap ?? 4;
        let baseUnitX = alignX + valMetrics.width + uGap;
        if (textAlign === 'center') {
          baseUnitX = alignX + valMetrics.width / 2 + uGap;
        } else if (textAlign === 'right') {
          baseUnitX = alignX + uGap;
        }
        const unitX = baseUnitX + (card.unitOffsetX || 0);
        const unitY = valY - effUnitSize / 2 + (card.unitOffsetY || 0);

        renderCustomTypographyText(
          ctx,
          card.unit,
          unitX,
          unitY,
          card.unitTypography,
          {
            fontSize: card.unitFontSize || 15,
            fontWeight: '700',
            textColor: card.unitColor || '#FC4C02',
            fontFamily
          },
          globalTypography
        );
      }
    }

    ctx.restore();
  });
}

/**
 * Render Elevation Profile Strip with Fill Gradient & Y-Axis
 */
function renderStravaAppElevationChart(
  ctx: CanvasRenderingContext2D,
  elevConf: StravaAppConfig['elevationChart'],
  activity: UserActivity,
  fontFamily: string,
  globalTypography?: StravaAppConfig['globalTypography']
) {
  if (!elevConf.enabled) return;

  const chartX = (CANVAS_WIDTH * elevConf.xPct) / 100;
  const chartY = (CANVAS_HEIGHT * elevConf.yPct) / 100;
  const chartW = (CANVAS_WIDTH * elevConf.widthPct) / 100;
  const chartH = (CANVAS_HEIGHT * elevConf.heightPct) / 100;
  const r = elevConf.borderRadius || 18;

  ctx.save();

  // Background card & Shadow
  if (elevConf.bgOpacity > 0) {
    if (elevConf.shadow || (elevConf.shadowOpacity && elevConf.shadowOpacity > 0)) {
      ctx.shadowColor = hexToRgba(elevConf.shadowColor || '#000000', (elevConf.shadowOpacity || 40) / 100);
      ctx.shadowBlur = elevConf.shadowBlur || 18;
      ctx.shadowOffsetX = elevConf.shadowOffsetX || 0;
      ctx.shadowOffsetY = elevConf.shadowOffsetY || 6;
    }
    ctx.fillStyle = hexToRgba(elevConf.bgColor || '#121316', elevConf.bgOpacity / 100);
    drawRoundedRect(ctx, chartX, chartY, chartW, chartH, r);
    ctx.fill();

    if (elevConf.borderWidth && elevConf.borderWidth > 0) {
      ctx.strokeStyle = hexToRgba(elevConf.borderColor || 'rgba(255, 255, 255, 0.15)', 1);
      ctx.lineWidth = elevConf.borderWidth;
      drawRoundedRect(ctx, chartX, chartY, chartW, chartH, r);
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
  }

  // Extract elevation points
  let elevations: number[] = [];
  const route = activity.route;
  if (route && route.length > 2) {
    const valid = route.filter(pt => typeof pt.ele === 'number' && !isNaN(pt.ele!));
    if (valid.length > 2) {
      const step = Math.max(1, Math.floor(valid.length / 70));
      for (let i = 0; i < valid.length; i += step) {
        elevations.push(Math.round(valid[i].ele!));
      }
    }
  }

  if (elevations.length < 2) {
    // Default realistic profile
    elevations = [45, 60, 95, 140, 165, 130, 85, 55, 70, 110, 150, 120, 65];
  }

  let minEle = Infinity;
  let maxEle = -Infinity;
  elevations.forEach(e => {
    if (e < minEle) minEle = e;
    if (e > maxEle) maxEle = e;
  });

  const padL = elevConf.yAxisEnabled ? 65 : 24;
  const padR = 24;
  const padT = 24;
  const padB = 24;
  const graphW = chartW - padL - padR;
  const graphH = chartH - padT - padB;
  const graphX = chartX + padL;
  const graphY = chartY + padT;

  // Horizontal Guidelines
  if (elevConf.guidelinesEnabled) {
    ctx.strokeStyle = hexToRgba(elevConf.guidelineColor || 'rgba(255, 255, 255, 0.1)', (elevConf.guidelineOpacity || 100) / 100);
    ctx.lineWidth = elevConf.guidelineWidth || 1;
    ctx.setLineDash([4, 4]);

    const lines = Math.max(2, elevConf.yAxisMarksCount || 3);
    for (let i = 0; i < lines; i++) {
      const gy = graphY + (graphH / (lines - 1)) * i;
      ctx.beginPath();
      ctx.moveTo(graphX, gy);
      ctx.lineTo(graphX + graphW, gy);
      ctx.stroke();

      // Y-axis labels
      if (elevConf.yAxisEnabled) {
        const val = Math.round(maxEle - ((maxEle - minEle) / (lines - 1)) * i);
        const yLabelX = graphX - 10 + (elevConf.yAxisOffsetX || 0);
        const yLabelY = gy + (elevConf.yAxisOffsetY || 0);

        renderCustomTypographyText(
          ctx,
          `${val}m`,
          yLabelX,
          yLabelY,
          elevConf.yAxisTypography,
          {
            fontSize: elevConf.yAxisFontSize || 13,
            fontWeight: '400',
            textColor: elevConf.yAxisColor || '#94A3B8',
            align: 'right',
            fontFamily
          },
          globalTypography
        );
      }
    }
    ctx.setLineDash([]);
  }

  // Generate Profile Points
  const pts: { x: number; y: number }[] = [];
  const count = elevations.length;
  elevations.forEach((ele, i) => {
    const x = graphX + (i / (count - 1)) * graphW;
    const norm = (ele - minEle) / Math.max(1, maxEle - minEle);
    const y = graphY + graphH - norm * graphH;
    pts.push({ x, y });
  });

  // Area Fill Gradient
  if (elevConf.fillEnabled && pts.length > 1) {
    ctx.save();
    const fillGrad = ctx.createLinearGradient(0, graphY, 0, graphY + graphH);
    fillGrad.addColorStop(0, elevConf.fillTopColor || 'rgba(252, 76, 2, 0.35)');
    fillGrad.addColorStop(1, elevConf.fillBottomColor || 'rgba(252, 76, 2, 0.02)');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, graphY + graphH);
    pts.forEach((p, i) => {
      if (i === 0) ctx.lineTo(p.x, p.y);
      else {
        // Smooth curve
        const prev = pts[i - 1];
        const cx = (prev.x + p.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + p.y) / 2);
      }
    });
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[pts.length - 1].x, graphY + graphH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Stroke Line
  if (pts.length > 1) {
    ctx.strokeStyle = elevConf.lineColor || '#FC4C02';
    ctx.lineWidth = elevConf.lineWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = pts[i - 1];
        const cx = (prev.x + p.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + p.y) / 2);
      }
    });
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Main Template 2 "Strava App" Canvas 2D Renderer
 */
export function renderStravaAppTemplate(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  const conf: StravaAppConfig = config.stravaApp || getDefaultStravaAppConfig(activity, athleteName);
  const fontFamily = conf.globalFont === 'display' 
    ? "'Oswald', 'Montserrat', sans-serif" 
    : conf.globalFont === 'mono' 
      ? "'JetBrains Mono', monospace" 
      : "'Plus Jakarta Sans', -apple-system, sans-serif";

  // 1. Full Screen Background
  renderStravaAppBackground(ctx, conf.background, config);

  // 2. Top-Left Activity Info Card
  renderStravaAppTopCard(ctx, conf.topCard, fontFamily, conf.globalTypography);

  // 3. Right Vertical Map Panel
  renderStravaAppMapPanel(ctx, conf.mapPanel, activity, progressRatio);

  // 4. Bottom 3 Metric Cards
  renderStravaAppMetricsRow(ctx, conf.metricsRow, fontFamily, conf.globalTypography);

  // 5. Elevation Profile Strip with Y-Axis
  renderStravaAppElevationChart(ctx, conf.elevationChart, activity, fontFamily, conf.globalTypography);

  // 6. Floating elements (if any)
  if (conf.floatingElements && conf.floatingElements.length > 0) {
    conf.floatingElements.forEach(el => {
      const fx = (CANVAS_WIDTH * el.xPct) / 100;
      const fy = (CANVAS_HEIGHT * el.yPct) / 100;
      ctx.save();
      if (el.type === 'text' && el.text) {
        renderCustomTypographyText(
          ctx,
          el.text,
          fx,
          fy,
          el.typography,
          {
            fontSize: el.fontSize || 18,
            fontWeight: '700',
            textColor: el.color || '#FFFFFF',
            fontFamily
          },
          conf.globalTypography
        );
      }
      ctx.restore();
    });
  }
}

/**
 * Utility: Color Hex to RGBA
 */
function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
