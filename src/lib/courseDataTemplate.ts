import { 
  UserActivity, 
  StoryConfig, 
  CourseDataConfig, 
  CourseDataTableRow, 
  CourseDataPeakMarker,
  CourseDataFloatingText,
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
 * Resolve font family CSS string for Course Data
 */
export function resolveCourseDataFont(family?: string): string {
  if (!family || family === 'inherit' || family === 'sans') {
    return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  if (family === 'mono') {
    return '"JetBrains Mono", "SF Mono", monospace';
  }
  if (family === 'serif') {
    return '"Playfair Display", Georgia, serif';
  }
  if (family === 'display' || family === 'condensed') {
    return '"Oswald", "Barlow Condensed", sans-serif';
  }
  return `"${family}", -apple-system, BlinkMacSystemFont, sans-serif`;
}

/**
 * Standard factory defaults for Template 1 — Course Data
 */
export function getDefaultCourseDataConfig(activity?: UserActivity, athleteName?: string): CourseDataConfig {
  const distStr = activity?.distanceKm ? `${activity.distanceKm.toFixed(2)} KM` : '10.00 KM';
  const gainStr = activity?.elevationGainMeters ? `+${Math.round(activity.elevationGainMeters)} M` : '+145 M';

  return {
    globalFont: 'sans',
    // 2.1 Fundo
    backgroundSource: 'photo',
    solidBgColor: '#121417',
    bwFilter: true,
    bwIntensity: 100,
    brightness: 0,
    contrast: 12,
    saturation: -100,
    exposure: 0,
    blur: 0,
    overlayColor: '#000000',
    overlayOpacity: 25,
    topGradient: { enabled: true, color: '#000000', intensity: 75, heightPct: 22 },
    bottomGradient: { enabled: true, color: '#000000', intensity: 80, heightPct: 28 },
    bgZoom: 1.0,
    bgPanX: 0,
    bgPanY: 0,
    bgRotation: 0,

    // 2.2 Cabeçalho (Faixa Superior)
    headerBar: {
      enabled: true,
      xOffsetPct: 0,
      heightPct: 11, // ~210px
      yOffsetPct: 0,
      widthPct: 90,
      bgColor: '#0C0E12',
      bgOpacity: 88,
      borderRadius: 16,
      paddingX: 24,
      paddingY: 16,
      shadow: { color: 'rgba(0, 0, 0, 0.6)', blur: 16, offsetY: 4, opacity: 60 }
    },

    // 2.3 Rótulo "COURSE DATA"
    courseDataLabel: {
      enabled: true,
      text: 'COURSE\nDATA',
      xOffset: 0,
      yOffset: 0,
      fontSize: 22,
      fontWeight: '300',
      letterSpacing: 5,
      lineHeight: 28,
      color: '#CBD5E1',
      opacity: 100,
      align: 'left',
      textTransform: 'uppercase',
      fontFamily: 'sans',
      italic: false,
      underline: false,
      strikethrough: false,
      shadow: true,
      stroke: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      rotation: 0
    },

    // 2.4 Nome da atividade ou percurso
    activityName: {
      enabled: true,
      customText: activity?.title || 'CIRCUITO DE TREINO',
      xOffset: 0,
      yOffset: 0,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 2,
      color: '#D4E157', // Verde-Limão vibrante
      opacity: 100,
      align: 'right',
      textTransform: 'uppercase',
      fontFamily: 'sans',
      shadow: true,
      rotation: 0
    },

    // 2.5 Data
    dateText: {
      enabled: true,
      customText: '',
      format: 'verbose',
      xOffset: 0,
      yOffset: 0,
      fontSize: 15,
      fontWeight: '400',
      letterSpacing: 3,
      color: '#94A3B8',
      opacity: 100,
      align: 'right',
      textTransform: 'uppercase',
      fontFamily: 'sans',
      shadow: false,
      rotation: 0
    },

    // 2.6 Tabela de Dados
    dataTable: {
      enabled: true,
      xOffset: 0,
      yOffset: 0,
      widthPct: 90,
      heightPx: 230,
      bgColor: '#0C0E12',
      bgOpacity: 88,
      borderRadius: 16,
      shadow: true,
      dividerColor: 'rgba(255, 255, 255, 0.12)',
      dividerWidth: 1,
      dividerOpacity: 80,
      paddingX: 24,
      paddingY: 10,
      rowSpacing: 12,
      globalLabelColor: '#94A3B8',
      globalValueColor: '#FFFFFF',
      globalFontSize: 18,
      globalFontFamily: 'sans',
      rows: [
        {
          id: 'row-1',
          enabled: true,
          label: 'TOTAL DISTANCE',
          metricKey: 'distance',
          value: distStr,
          labelColor: '#94A3B8',
          labelFontSize: 15,
          labelFontWeight: '300',
          labelFontFamily: 'sans',
          labelLetterSpacing: 2.0,
          labelTextTransform: 'uppercase',
          labelOffsetX: 0,
          labelOffsetY: 0,
          valueColor: '#FFFFFF',
          valueFontSize: 18,
          valueFontWeight: '600',
          valueFontFamily: 'sans',
          valueLetterSpacing: 1.0,
          valueTextTransform: 'none',
          valueOffsetX: 0,
          valueOffsetY: 0,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: 1.5
        },
        {
          id: 'row-2',
          enabled: true,
          label: 'ELEVATION GAIN',
          metricKey: 'elevationGain',
          value: gainStr,
          labelColor: '#94A3B8',
          labelFontSize: 15,
          labelFontWeight: '300',
          labelFontFamily: 'sans',
          labelLetterSpacing: 2.0,
          labelTextTransform: 'uppercase',
          labelOffsetX: 0,
          labelOffsetY: 0,
          valueColor: '#FFFFFF',
          valueFontSize: 18,
          valueFontWeight: '600',
          valueFontFamily: 'sans',
          valueLetterSpacing: 1.0,
          valueTextTransform: 'none',
          valueOffsetX: 0,
          valueOffsetY: 0,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: 1.5
        },
        {
          id: 'row-3',
          enabled: true,
          label: 'MIN. ELEVATION',
          metricKey: 'minElevation',
          value: '42 M',
          labelColor: '#94A3B8',
          labelFontSize: 15,
          labelFontWeight: '300',
          labelFontFamily: 'sans',
          labelLetterSpacing: 2.0,
          labelTextTransform: 'uppercase',
          labelOffsetX: 0,
          labelOffsetY: 0,
          valueColor: '#FFFFFF',
          valueFontSize: 18,
          valueFontWeight: '600',
          valueFontFamily: 'sans',
          valueLetterSpacing: 1.0,
          valueTextTransform: 'none',
          valueOffsetX: 0,
          valueOffsetY: 0,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: 1.5
        },
        {
          id: 'row-4',
          enabled: true,
          label: 'MAX. ELEVATION',
          metricKey: 'maxElevation',
          value: '187 M',
          labelColor: '#94A3B8',
          labelFontSize: 15,
          labelFontWeight: '300',
          labelFontFamily: 'sans',
          labelLetterSpacing: 2.0,
          labelTextTransform: 'uppercase',
          labelOffsetX: 0,
          labelOffsetY: 0,
          valueColor: '#FFFFFF',
          valueFontSize: 18,
          valueFontWeight: '600',
          valueFontFamily: 'sans',
          valueLetterSpacing: 1.0,
          valueTextTransform: 'none',
          valueOffsetX: 0,
          valueOffsetY: 0,
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: 1.5
        }
      ]
    },

    // 2.7 Rodapé e Perfil de Elevação
    elevationFooter: {
      enabled: true,
      xOffsetPct: 0,
      heightPct: 24, // ~460px
      yOffsetPct: 0,
      widthPct: 90,
      bgColor: '#0A0C10',
      bgOpacity: 85,
      borderRadius: 16,
      shadow: true,
      paddingX: 28,
      paddingY: 38,
      athleteLabel: athleteName ? athleteName.toUpperCase() : 'PACELAB ATHLETE',
      athleteLabelEnabled: true,
      athleteLabelColor: '#D4E157',
      athleteLabelFontSize: 14,
      athleteLabelFontWeight: '600',
      athleteLabelFontFamily: 'sans',
      athleteLabelLetterSpacing: 1.5,
      athleteLabelOffsetX: 0,
      athleteLabelOffsetY: 0,
      titleText: 'ELEVATION PROFILE • ALTIMETRIA',
      titleEnabled: true,
      titleColor: '#94A3B8',
      titleFontSize: 14,
      titleFontWeight: '400',
      titleFontFamily: 'sans',
      titleLetterSpacing: 3,
      titleOffsetX: 0,
      titleOffsetY: 0,
      showMinMaxLabels: true,
      minMaxColor: '#64748B',
      minMaxFontSize: 12,
      fillMode: 'gradient',
      fillColorTop: '#D4E157',
      fillColorBottom: 'rgba(212, 225, 87, 0.05)',
      fillOpacity: 70,
      strokeColor: '#D4E157',
      strokeWidth: 4,
      smoothing: true,
      verticalScale: 1.0
    },

    // 2.8 Marcadores de Pico
    peakMarkers: {
      enabled: true,
      markers: [
        {
          id: 'peak-auto-1',
          name: 'PICO ALTO',
          altitudeMeters: 187,
          pctPosition: 0.65,
          triangleColor: '#D4E157',
          triangleSize: 12,
          textColor: '#FFFFFF',
          fontSize: 15,
          fontWeight: '600',
          fontFamily: 'sans',
          letterSpacing: 1,
          offsetX: 0,
          offsetY: 0,
          showTriangle: true,
          showLabel: true
        }
      ]
    },

    // 2.9 Mapa (Opcional)
    optionalMap: {
      enabled: false,
      xPct: 5,
      yPct: 40,
      widthPct: 90,
      heightPx: 320,
      borderRadius: 16,
      opacity: 95,
      mapStyle: 'dark',
      routeColor: '#D4E157',
      routeWidth: 6,
      showStartFinishPins: true,
      zoom: 1.0,
      panX: 0,
      panY: 0
    },

    // 2.10 Textos Soltos
    floatingTexts: []
  };
}

/**
 * Extracts elevation profile points and extremes from activity
 */
export function extractElevationProfile(activity: UserActivity): {
  elevations: number[];
  minEle: number;
  maxEle: number;
  gain: number;
  peakIndex: number;
} | null {
  const route = activity.route;
  if (!route || route.length < 2) {
    if (activity.elevationGainMeters) {
      const g = Math.round(activity.elevationGainMeters);
      return { elevations: [40, 85, 120, 160, 140, 95, 50], minEle: 40, maxEle: 160, gain: g, peakIndex: 3 };
    }
    return null;
  }

  const elevationsWithAlt = route.filter(pt => typeof pt.ele === 'number' && !isNaN(pt.ele!));
  if (elevationsWithAlt.length < 2) {
    const g = activity.elevationGainMeters ? Math.round(activity.elevationGainMeters) : 75;
    return { elevations: [40, 80, 115, 150, 130, 90, 45], minEle: 40, maxEle: 150, gain: g, peakIndex: 3 };
  }

  const maxPoints = 80;
  const step = Math.max(1, Math.floor(elevationsWithAlt.length / maxPoints));
  const sampled: number[] = [];
  let minEle = Infinity;
  let maxEle = -Infinity;
  let peakIndex = 0;

  for (let i = 0; i < elevationsWithAlt.length; i += step) {
    const alt = Math.round(elevationsWithAlt[i].ele!);
    sampled.push(alt);
    if (alt < minEle) minEle = alt;
    if (alt > maxEle) {
      maxEle = alt;
      peakIndex = sampled.length - 1;
    }
  }

  const calculatedGain = activity.elevationGainMeters 
    ? Math.round(activity.elevationGainMeters) 
    : Math.max(0, maxEle - minEle);

  return {
    elevations: sampled,
    minEle: minEle === Infinity ? 0 : minEle,
    maxEle: maxEle === -Infinity ? 100 : maxEle,
    gain: calculatedGain,
    peakIndex
  };
}

/**
 * Format date for Course Data template
 */
function formatCourseDate(dateVal?: string, format: string = 'verbose'): string {
  if (!dateVal) return '20 DE OUTUBRO • 2026';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal.toUpperCase();

    if (format === 'dd_mm_yyyy') {
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      const yr = d.getFullYear();
      return `${day}/${mon}/${yr}`;
    }

    if (format === 'iso') {
      return d.toISOString().split('T')[0];
    }

    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const day = d.getDate();
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    return `${day} DE ${mon} • ${yr}`;
  } catch {
    return dateVal.toUpperCase();
  }
}

/**
 * Main Renderer for Template 1: Course Data
 */
export function renderCourseDataTemplate(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  // Ensure config has courseData with full fallback defaults
  const cd = config.courseData || getDefaultCourseDataConfig(activity, athleteName);
  const eleData = extractElevationProfile(activity);

  // =========================================================================
  // LAYER 1: BACKGROUND (Photo, Map, or Solid Color)
  // =========================================================================
  ctx.save();

  if (cd.backgroundSource === 'solid') {
    ctx.fillStyle = cd.solidBgColor || '#121417';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (cd.backgroundSource === 'map') {
    // Map Background
    ctx.fillStyle = '#0F1218';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Procedural Dark Cartography
    ctx.fillStyle = '#141A24';
    ctx.beginPath();
    ctx.ellipse(320, 500, 360, 280, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(820, 1400, 420, 320, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0E1722';
    ctx.beginPath();
    ctx.ellipse(900, 600, 240, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1E2836';
    ctx.lineWidth = 3;
    for (let x = 80; x < CANVAS_WIDTH; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 100, CANVAS_HEIGHT);
      ctx.stroke();
    }
  } else {
    // Photo Background (Selfie, Race Photo, or Unsplash sample)
    ctx.fillStyle = cd.solidBgColor || '#121417';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const photoUrl = config.customPhotoUrl || 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1080&q=80';
    const cachedImg = storyImageCache.get(photoUrl);

    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      ctx.save();

      // CSS Filters: B&W intensity, brightness, contrast, blur
      const grayPct = cd.bwFilter ? Math.max(0, Math.min(100, cd.bwIntensity ?? 100)) : 0;
      const bVal = 100 + (cd.brightness || 0);
      const cVal = 100 + (cd.contrast || 0);
      const sVal = cd.bwFilter ? Math.max(0, 100 - grayPct) : Math.max(0, 100 + (cd.saturation || 0));
      const blurPx = Math.max(0, cd.blur || 0);

      ctx.filter = `grayscale(${grayPct}%) brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) blur(${blurPx}px)`;

      // Geometry & Aspect Fill
      const natW = cachedImg.naturalWidth || cachedImg.width;
      const natH = cachedImg.naturalHeight || cachedImg.height;
      const baseScale = Math.max(CANVAS_WIDTH / natW, CANVAS_HEIGHT / natH);
      const zoom = baseScale * (cd.bgZoom || 1.0);
      const dw = natW * zoom;
      const dh = natH * zoom;
      const cx = CANVAS_WIDTH / 2 + (cd.bgPanX || 0);
      const cy = CANVAS_HEIGHT / 2 + (cd.bgPanY || 0);

      ctx.translate(cx, cy);
      if (cd.bgRotation) {
        ctx.rotate((cd.bgRotation * Math.PI) / 180);
      }
      ctx.drawImage(cachedImg, -dw / 2, -dh / 2, dw, dh);

      ctx.restore();
    } else {
      preloadStoryPhoto(photoUrl).catch(() => {});
    }
  }

  // Color Overlay
  if (cd.overlayOpacity > 0) {
    const alpha = Math.max(0, Math.min(1, cd.overlayOpacity / 100));
    ctx.save();
    ctx.fillStyle = hexToRgba(cd.overlayColor || '#000000', alpha);
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Top Darkening Gradient
  if (cd.topGradient?.enabled) {
    const topH = (CANVAS_HEIGHT * Math.max(5, Math.min(50, cd.topGradient.heightPct || 22))) / 100;
    const grad = ctx.createLinearGradient(0, 0, 0, topH);
    const topAlpha = Math.max(0, Math.min(1, (cd.topGradient.intensity || 75) / 100));
    grad.addColorStop(0, hexToRgba(cd.topGradient.color || '#000000', topAlpha));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, topH);
  }

  // Bottom Darkening Gradient
  if (cd.bottomGradient?.enabled) {
    const botH = (CANVAS_HEIGHT * Math.max(5, Math.min(60, cd.bottomGradient.heightPct || 28))) / 100;
    const startY = CANVAS_HEIGHT - botH;
    const grad = ctx.createLinearGradient(0, startY, 0, CANVAS_HEIGHT);
    const botAlpha = Math.max(0, Math.min(1, (cd.bottomGradient.intensity || 80) / 100));
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, hexToRgba(cd.bottomGradient.color || '#000000', botAlpha));
    ctx.fillStyle = grad;
    ctx.fillRect(0, startY, CANVAS_WIDTH, botH);
  }

  ctx.restore();

  // =========================================================================
  // LAYER 2: OPTIONAL MAP (if user activates map on Template 1)
  // =========================================================================
  if (cd.optionalMap?.enabled) {
    renderOptionalMap(ctx, activity, cd.optionalMap, progressRatio);
  }

  // Base layout dimensions
  const baseCardW = (CANVAS_WIDTH * Math.max(40, Math.min(96, cd.dataTable.widthPct || 90))) / 100;
  const baseCardX = (CANVAS_WIDTH - baseCardW) / 2;

  // =========================================================================
  // LAYER 3: TOP HEADER BAR (COURSE DATA label + Course Title + Date)
  // =========================================================================
  if (cd.headerBar?.enabled) {
    const hb = cd.headerBar;
    const barH = (CANVAS_HEIGHT * Math.max(6, Math.min(30, hb.heightPct || 11))) / 100;
    const barY = SAFE_TOP - 40 + ((CANVAS_HEIGHT * (hb.yOffsetPct || 0)) / 100);
    const barW = (CANVAS_WIDTH * Math.max(40, Math.min(96, hb.widthPct ?? (cd.dataTable.widthPct || 90)))) / 100;
    const barX = (CANVAS_WIDTH - barW) / 2 + ((CANVAS_WIDTH * (hb.xOffsetPct || 0)) / 100);

    ctx.save();

    // Box Shadow
    if (hb.shadow) {
      ctx.shadowColor = hb.shadow.color || 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = hb.shadow.blur || 16;
      ctx.shadowOffsetY = hb.shadow.offsetY || 4;
    }

    // Box Surface
    const bgAlpha = Math.max(0, Math.min(1, (hb.bgOpacity || 88) / 100));
    ctx.fillStyle = hexToRgba(hb.bgColor || '#0C0E12', bgAlpha);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, barX, barY, barW, barH, hb.borderRadius || 16);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const padX = hb.paddingX || 24;
    const padY = hb.paddingY || 16;

    // Left: "COURSE DATA" Label
    if (cd.courseDataLabel?.enabled) {
      const cdl = cd.courseDataLabel;
      const lx = barX + padX + (cdl.xOffset || 0);
      const ly = barY + padY + 24 + (cdl.yOffset || 0);

      ctx.save();
      if (cdl.rotation) {
        ctx.translate(lx, ly);
        ctx.rotate((cdl.rotation * Math.PI) / 180);
        ctx.translate(-lx, -ly);
      }

      if (cdl.shadow) {
        ctx.shadowColor = cdl.shadowColor || 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = cdl.shadowBlur ?? 10;
        ctx.shadowOffsetX = cdl.shadowOffsetX ?? 0;
        ctx.shadowOffsetY = cdl.shadowOffsetY ?? 2;
      }

      ctx.fillStyle = hexToRgba(cdl.color || '#CBD5E1', Math.max(0, Math.min(1, (cdl.opacity ?? 100) / 100)));
      const fontFam = resolveCourseDataFont(cdl.fontFamily || cd.globalFont || 'sans');
      ctx.font = `${cdl.italic ? 'italic ' : ''}${cdl.fontWeight || '300'} ${cdl.fontSize || 22}px ${fontFam}`;
      ctx.letterSpacing = `${cdl.letterSpacing ?? 5}px`;
      ctx.textAlign = cdl.align || 'left';

      // Multiline text handling
      const rawText = cdl.text || 'COURSE\nDATA';
      const lines = rawText.split('\n');
      const lineH = cdl.lineHeight || 28;

      lines.forEach((line, idx) => {
        let displayLine = line;
        if (cdl.textTransform === 'uppercase') displayLine = line.toUpperCase();
        else if (cdl.textTransform === 'lowercase') displayLine = line.toLowerCase();
        else if (cdl.textTransform === 'capitalize') displayLine = line.replace(/\b\w/g, c => c.toUpperCase());

        const lineY = ly + (idx * lineH);

        if (cdl.stroke) {
          ctx.strokeStyle = cdl.strokeColor || '#000000';
          ctx.lineWidth = cdl.strokeWidth || 2;
          ctx.strokeText(displayLine, lx, lineY);
        }
        ctx.fillText(displayLine, lx, lineY);

        // Underline / Strikethrough
        if (cdl.underline || cdl.strikethrough) {
          const textW = ctx.measureText(displayLine).width;
          const uY = cdl.underline ? lineY + 4 : lineY - (cdl.fontSize / 3);
          ctx.beginPath();
          ctx.moveTo(lx, uY);
          ctx.lineTo(lx + textW, uY);
          ctx.strokeStyle = cdl.color || '#CBD5E1';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      ctx.restore();
    }

    // Right: Course/Activity Name
    if (cd.activityName?.enabled) {
      const an = cd.activityName;
      const rx = barX + barW - padX + (an.xOffset || 0);
      const ry = barY + padY + 22 + (an.yOffset || 0);

      ctx.save();
      if (an.rotation) {
        ctx.translate(rx, ry);
        ctx.rotate((an.rotation * Math.PI) / 180);
        ctx.translate(-rx, -ry);
      }
      if (an.shadow) {
        ctx.shadowColor = an.shadowColor || 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = an.shadowBlur ?? 10;
        ctx.shadowOffsetX = an.shadowOffsetX ?? 0;
        ctx.shadowOffsetY = an.shadowOffsetY ?? 2;
      }

      const aAlpha = Math.max(0, Math.min(1, (an.opacity ?? 100) / 100));
      ctx.fillStyle = hexToRgba(an.color || '#D4E157', aAlpha);
      const fontFam = resolveCourseDataFont(an.fontFamily || cd.globalFont || 'sans');
      ctx.font = `${an.italic ? 'italic ' : ''}${an.fontWeight || '700'} ${an.fontSize || 22}px ${fontFam}`;
      ctx.letterSpacing = `${an.letterSpacing ?? 2}px`;
      ctx.textAlign = an.align || 'right';

      let titleStr = an.customText || activity.title || 'CIRCUITO DE TREINO';
      if (an.textTransform === 'uppercase') titleStr = titleStr.toUpperCase();
      else if (an.textTransform === 'lowercase') titleStr = titleStr.toLowerCase();
      else if (an.textTransform === 'capitalize') titleStr = titleStr.replace(/\b\w/g, c => c.toUpperCase());

      ctx.fillText(titleStr.slice(0, 42), rx, ry);
      ctx.restore();
    }

    // Below Right: Date Text
    if (cd.dateText?.enabled) {
      const dt = cd.dateText;
      const dx = barX + barW - padX + (dt.xOffset || 0);
      const dy = barY + padY + 54 + (dt.yOffset || 0);

      ctx.save();
      if (dt.rotation) {
        ctx.translate(dx, dy);
        ctx.rotate((dt.rotation * Math.PI) / 180);
        ctx.translate(-dx, -dy);
      }
      if (dt.shadow) {
        ctx.shadowColor = dt.shadowColor || 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = dt.shadowBlur ?? 8;
        ctx.shadowOffsetX = dt.shadowOffsetX ?? 0;
        ctx.shadowOffsetY = dt.shadowOffsetY ?? 2;
      }

      const dAlpha = Math.max(0, Math.min(1, (dt.opacity ?? 100) / 100));
      ctx.fillStyle = hexToRgba(dt.color || '#94A3B8', dAlpha);
      const fontFam = resolveCourseDataFont(dt.fontFamily || cd.globalFont || 'sans');
      ctx.font = `${dt.italic ? 'italic ' : ''}${dt.fontWeight || '400'} ${dt.fontSize || 15}px ${fontFam}`;
      ctx.letterSpacing = `${dt.letterSpacing ?? 3}px`;
      ctx.textAlign = dt.align || 'right';

      const formatted = dt.customText || formatCourseDate(activity.date, dt.format || 'verbose');
      let displayDate = formatted;
      if (dt.textTransform === 'uppercase') displayDate = formatted.toUpperCase();
      else if (dt.textTransform === 'lowercase') displayDate = formatted.toLowerCase();
      else if (dt.textTransform === 'capitalize') displayDate = formatted.replace(/\b\w/g, c => c.toUpperCase());

      ctx.fillText(displayDate, dx, dy);
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // LAYER 4: DATA TABLE (4+ rows with horizontal dividers)
  // =========================================================================
  if (cd.dataTable?.enabled) {
    const dt = cd.dataTable;
    const tableW = (CANVAS_WIDTH * Math.max(40, Math.min(96, dt.widthPct || 90))) / 100;
    const tableX = (CANVAS_WIDTH - tableW) / 2 + (dt.xOffset || 0);
    const tableY = SAFE_TOP + 80 + (dt.yOffset || 0);
    const tableH = Math.max(100, dt.heightPx || 230);

    ctx.save();

    if (dt.shadow) {
      ctx.shadowColor = dt.shadowColor || 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = dt.shadowBlur ?? 18;
      ctx.shadowOffsetX = dt.shadowOffsetX ?? 0;
      ctx.shadowOffsetY = dt.shadowOffsetY ?? 6;
    }

    const bgAlpha = Math.max(0, Math.min(1, (dt.bgOpacity || 88) / 100));
    ctx.fillStyle = hexToRgba(dt.bgColor || '#0C0E12', bgAlpha);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, tableX, tableY, tableW, tableH, dt.borderRadius || 16);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Filter active rows
    const activeRows = (dt.rows || []).filter(r => r.enabled);
    if (activeRows.length > 0) {
      const padX = dt.paddingX || 24;
      const padY = dt.paddingY || 10;
      const availableH = Math.max(40, tableH - padY * 2);
      const rowH = availableH / activeRows.length;

      activeRows.forEach((row, idx) => {
        const ry = tableY + padY + (idx * rowH);

        // Horizontal divider line
        if (idx > 0 && dt.showDividers !== false) {
          const divAlpha = Math.max(0, Math.min(1, (dt.dividerOpacity || 80) / 100));
          ctx.strokeStyle = hexToRgba(dt.dividerColor || 'rgba(255, 255, 255, 0.12)', divAlpha);
          ctx.lineWidth = dt.dividerWidth || 1;
          ctx.beginPath();
          ctx.moveTo(tableX + padX, ry);
          ctx.lineTo(tableX + tableW - padX, ry);
          ctx.stroke();
        }

        // Resolve value from custom input or activity metrics
        let rowVal = row.value !== undefined && row.value !== null && row.value !== '' ? row.value : '';
        if (!rowVal) {
          if (row.metricKey === 'distance') {
            rowVal = (activity.distanceKm || 0).toFixed(2) + ' KM';
          } else if (row.metricKey === 'elevationGain') {
            rowVal = eleData ? `+${eleData.gain} M` : (activity.elevationGainMeters ? `+${Math.round(activity.elevationGainMeters)} M` : 'N/A');
          } else if (row.metricKey === 'minElevation') {
            rowVal = eleData ? `${eleData.minEle} M` : 'N/A';
          } else if (row.metricKey === 'maxElevation') {
            rowVal = eleData ? `${eleData.maxEle} M` : 'N/A';
          } else if (row.metricKey === 'pace') {
            rowVal = (activity.paceFormatted || '4:30') + '/KM';
          } else if (row.metricKey === 'duration') {
            rowVal = activity.durationFormatted || '00:45:00';
          } else if (row.metricKey === 'avgHr') {
            rowVal = activity.avgHr ? `${activity.avgHr} BPM` : 'N/A';
          }
        }

        const baselineY = ry + (rowH * 0.58);

        // Left Label (Texto descritivo)
        if (row.showLabel !== false) {
          ctx.save();
          const labelText = row.labelTextTransform === 'lowercase' 
            ? row.label.toLowerCase() 
            : row.labelTextTransform === 'none' 
              ? row.label 
              : row.labelTextTransform === 'capitalize'
                ? row.label.replace(/\b\w/g, c => c.toUpperCase())
                : row.label.toUpperCase();

          const lAlpha = Math.max(0, Math.min(1, (row.labelOpacity ?? 100) / 100));
          const lColor = hexToRgba(row.labelColor || dt.globalLabelColor || '#94A3B8', lAlpha);
          const lSize = row.labelFontSize || (row.fontSize ? Math.round(row.fontSize * 0.85) : (dt.globalFontSize ? Math.round(dt.globalFontSize * 0.85) : 15));
          const lWeight = row.labelFontWeight || '300';
          const lFamily = resolveCourseDataFont(row.labelFontFamily || dt.globalFontFamily || cd.globalFont);
          const lSpacing = row.labelLetterSpacing ?? (row.letterSpacing ?? 2.5);
          const lx = tableX + padX + (row.labelOffsetX ?? row.labelXOffset ?? 0);
          const ly = baselineY + (row.labelOffsetY ?? row.labelYOffset ?? 0);

          if (row.labelRotation) {
            ctx.translate(lx, ly);
            ctx.rotate((row.labelRotation * Math.PI) / 180);
            ctx.translate(-lx, -ly);
          }

          if (row.labelShadow) {
            const ls = typeof row.labelShadow === 'object' ? row.labelShadow : { enabled: true, color: row.labelShadowColor, blur: row.labelShadowBlur, offsetX: row.labelShadowOffsetX, offsetY: row.labelShadowOffsetY };
            if (ls.enabled !== false) {
              ctx.shadowColor = ls.color || row.labelShadowColor || 'rgba(0, 0, 0, 0.85)';
              ctx.shadowBlur = ls.blur ?? row.labelShadowBlur ?? 8;
              ctx.shadowOffsetX = ls.offsetX ?? row.labelShadowOffsetX ?? 0;
              ctx.shadowOffsetY = ls.offsetY ?? row.labelShadowOffsetY ?? 2;
            }
          }

          ctx.fillStyle = lColor;
          ctx.font = `${lWeight} ${lSize}px ${lFamily}`;
          ctx.letterSpacing = `${lSpacing}px`;
          ctx.textAlign = 'left';
          ctx.fillText(labelText, lx, ly);
          ctx.restore();
        }

        // Right Value (Números / Valores)
        if (row.showValue !== false) {
          ctx.save();
          let displayVal = rowVal;
          if (row.valueTextTransform === 'uppercase') displayVal = displayVal.toUpperCase();
          else if (row.valueTextTransform === 'lowercase') displayVal = displayVal.toLowerCase();
          else if (row.valueTextTransform === 'capitalize') displayVal = displayVal.replace(/\b\w/g, c => c.toUpperCase());

          const vAlpha = Math.max(0, Math.min(1, (row.valueOpacity ?? 100) / 100));
          const vColor = hexToRgba(row.valueColor || dt.globalValueColor || '#FFFFFF', vAlpha);
          const vSize = row.valueFontSize || row.fontSize || dt.globalFontSize || 18;
          const vWeight = row.valueFontWeight || row.fontWeight || '600';
          const vFamily = resolveCourseDataFont(row.valueFontFamily || dt.globalFontFamily || cd.globalFont);
          const vSpacing = row.valueLetterSpacing ?? 1;
          const vx = tableX + tableW - padX + (row.valueOffsetX ?? row.valueXOffset ?? 0);
          const vy = baselineY + (row.valueOffsetY ?? row.valueYOffset ?? 0);

          if (row.valueRotation) {
            ctx.translate(vx, vy);
            ctx.rotate((row.valueRotation * Math.PI) / 180);
            ctx.translate(-vx, -vy);
          }

          if (row.valueShadow) {
            const vs = typeof row.valueShadow === 'object' ? row.valueShadow : { enabled: true, color: row.valueShadowColor, blur: row.valueShadowBlur, offsetX: row.valueShadowOffsetX, offsetY: row.valueShadowOffsetY };
            if (vs.enabled !== false) {
              ctx.shadowColor = vs.color || row.valueShadowColor || 'rgba(0, 0, 0, 0.85)';
              ctx.shadowBlur = vs.blur ?? row.valueShadowBlur ?? 8;
              ctx.shadowOffsetX = vs.offsetX ?? row.valueShadowOffsetX ?? 0;
              ctx.shadowOffsetY = vs.offsetY ?? row.valueShadowOffsetY ?? 2;
            }
          }

          ctx.fillStyle = vColor;
          ctx.font = `${vWeight} ${vSize}px ${vFamily}`;
          ctx.letterSpacing = `${vSpacing}px`;
          ctx.textAlign = 'right';
          ctx.fillText(displayVal, vx, vy);
          ctx.restore();
        }
      });
    }

    ctx.restore();
  }

  // =========================================================================
  // LAYER 5: ELEVATION FOOTER (Chart + Peaks)
  // =========================================================================
  if (cd.elevationFooter?.enabled) {
    const ef = cd.elevationFooter;
    const footerH = (CANVAS_HEIGHT * Math.max(12, Math.min(45, ef.heightPct || 24))) / 100;
    const footerW = (CANVAS_WIDTH * Math.max(40, Math.min(96, ef.widthPct ?? (cd.dataTable.widthPct || 90)))) / 100;
    const footerX = (CANVAS_WIDTH - footerW) / 2 + ((CANVAS_WIDTH * (ef.xOffsetPct || 0)) / 100);
    const defaultY = CANVAS_HEIGHT - SAFE_BOTTOM - footerH + 110;
    const footerY = defaultY + ((CANVAS_HEIGHT * (ef.yOffsetPct || 0)) / 100);

    ctx.save();

    if (ef.shadow) {
      ctx.shadowColor = ef.shadowColor || 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = ef.shadowBlur ?? 20;
      ctx.shadowOffsetX = ef.shadowOffsetX ?? 0;
      ctx.shadowOffsetY = ef.shadowOffsetY ?? 6;
    }

    const bgAlpha = Math.max(0, Math.min(1, (ef.bgOpacity || 85) / 100));
    ctx.fillStyle = hexToRgba(ef.bgColor || '#0A0C10', bgAlpha);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, footerX, footerY, footerW, footerH, ef.borderRadius || 16);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const padX = ef.paddingX || 28;
    const padY = ef.paddingY || 38;

    // Header inside footer: Title
    if (ef.titleEnabled !== false && ef.showTitle !== false) {
      ctx.save();
      const tAlpha = Math.max(0, Math.min(1, (ef.titleOpacity ?? 100) / 100));
      const tColor = hexToRgba(ef.titleColor || '#94A3B8', tAlpha);
      const tSize = ef.titleFontSize || 14;
      const tWeight = ef.titleFontWeight || '400';
      const tFamily = resolveCourseDataFont(ef.titleFontFamily || cd.globalFont);
      const tSpacing = ef.titleLetterSpacing ?? 3;
      const tx = footerX + padX + (ef.titleXOffset ?? ef.titleOffsetX ?? 0);
      const ty = footerY + padY + (ef.titleYOffset ?? ef.titleOffsetY ?? 0);

      if (ef.titleRotation) {
        ctx.translate(tx, ty);
        ctx.rotate((ef.titleRotation * Math.PI) / 180);
        ctx.translate(-tx, -ty);
      }

      if (ef.titleShadow) {
        ctx.shadowColor = ef.titleShadowColor || 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = ef.titleShadowBlur ?? 8;
        ctx.shadowOffsetX = ef.titleShadowOffsetX ?? 0;
        ctx.shadowOffsetY = ef.titleShadowOffsetY ?? 2;
      }

      ctx.fillStyle = tColor;
      ctx.font = `${tWeight} ${tSize}px ${tFamily}`;
      ctx.letterSpacing = `${tSpacing}px`;
      ctx.textAlign = 'left';

      let titleStr = ef.titleText || 'ELEVATION PROFILE • ALTIMETRIA';
      if (ef.titleTextTransform === 'uppercase') titleStr = titleStr.toUpperCase();
      else if (ef.titleTextTransform === 'lowercase') titleStr = titleStr.toLowerCase();
      else if (ef.titleTextTransform === 'capitalize') titleStr = titleStr.replace(/\b\w/g, c => c.toUpperCase());

      ctx.fillText(titleStr, tx, ty);
      ctx.restore();
    }

    // Header inside footer: Athlete Name
    if (ef.athleteLabelEnabled !== false && ef.showAthleteLabel !== false) {
      ctx.save();
      const aAlpha = Math.max(0, Math.min(1, (ef.athleteOpacity ?? 100) / 100));
      const aColor = hexToRgba(ef.athleteColor || ef.athleteLabelColor || ef.strokeColor || '#D4E157', aAlpha);
      const aSize = ef.athleteFontSize || ef.athleteLabelFontSize || 14;
      const aWeight = ef.athleteLabelFontWeight || '600';
      const aFamily = resolveCourseDataFont(ef.athleteFontFamily || ef.athleteLabelFontFamily || cd.globalFont);
      const aSpacing = ef.athleteLetterSpacing ?? ef.athleteLabelLetterSpacing ?? 1.5;
      const ax = footerX + footerW - padX + (ef.athleteXOffset ?? ef.athleteLabelOffsetX ?? 0);
      const ay = footerY + padY + (ef.athleteYOffset ?? ef.athleteLabelOffsetY ?? 0);

      if (ef.athleteRotation) {
        ctx.translate(ax, ay);
        ctx.rotate((ef.athleteRotation * Math.PI) / 180);
        ctx.translate(-ax, -ay);
      }

      if (ef.athleteShadow) {
        ctx.shadowColor = ef.athleteShadowColor || 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = ef.athleteShadowBlur ?? 8;
        ctx.shadowOffsetX = ef.athleteShadowOffsetX ?? 0;
        ctx.shadowOffsetY = ef.athleteShadowOffsetY ?? 2;
      }

      ctx.fillStyle = aColor;
      ctx.font = `${aWeight} ${aSize}px ${aFamily}`;
      ctx.letterSpacing = `${aSpacing}px`;
      ctx.textAlign = 'right';

      let rawAth = ef.athleteLabelText || ef.athleteLabel || athleteName || 'PACELAB ATHLETE';
      if (ef.athleteTextTransform === 'lowercase') rawAth = rawAth.toLowerCase();
      else if (ef.athleteTextTransform === 'capitalize') rawAth = rawAth.replace(/\b\w/g, c => c.toUpperCase());
      else rawAth = rawAth.toUpperCase();

      ctx.fillText(rawAth, ax, ay);
      ctx.restore();
    }

    // Chart Dimensions
    const plotX = footerX + padX;
    const plotW = footerW - (padX * 2);
    const plotY = footerY + 85;
    const plotH = footerH - 110;

    if (eleData && eleData.elevations.length > 1) {
      const rawElevations = eleData.elevations;
      const minEle = eleData.minEle;
      const maxEle = Math.max(minEle + 10, eleData.maxEle);
      const range = (maxEle - minEle) || 1;
      const vScale = Math.max(0.4, Math.min(2.5, ef.verticalScale || 1.0));

      const numPoints = Math.max(2, Math.floor(rawElevations.length * Math.min(1, Math.max(0.05, progressRatio))));
      const stepX = plotW / (rawElevations.length - 1);

      // Coordinates calculation
      const coords: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < numPoints; i++) {
        const ele = rawElevations[i];
        const norm = ((ele - minEle) / range) * vScale;
        const boundedNorm = Math.min(1, Math.max(0, norm));
        const x = plotX + (i * stepX);
        const y = (plotY + plotH) - (boundedNorm * (plotH - 50));
        coords.push({ x, y });
      }

      ctx.save();

      // 1. Fill Profile
      if (ef.fillMode !== 'lineOnly' && coords.length > 1) {
        ctx.beginPath();
        ctx.moveTo(coords[0].x, plotY + plotH);
        coords.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(coords[coords.length - 1].x, plotY + plotH);
        ctx.closePath();

        const fAlpha = Math.max(0, Math.min(1, (ef.fillOpacity || 70) / 100));

        if (ef.fillMode === 'solid') {
          ctx.fillStyle = hexToRgba(ef.fillColorTop || '#D4E157', fAlpha);
        } else {
          // Gradient fill
          const grad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
          grad.addColorStop(0, hexToRgba(ef.fillColorTop || '#D4E157', fAlpha));
          grad.addColorStop(1, hexToRgba(ef.fillColorBottom || 'rgba(212, 225, 87, 0.05)', 0.05));
          ctx.fillStyle = grad;
        }
        ctx.fill();
      }

      // 2. Stroke Top Contour Line
      ctx.beginPath();
      coords.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = ef.strokeColor || '#D4E157';
      ctx.lineWidth = ef.strokeWidth || 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 3. Min & Max Labels on plot (Números de Altimetria)
      if (ef.showMinMaxLabels && eleData) {
        ctx.save();
        const mmAlpha = Math.max(0, Math.min(1, (ef.minMaxOpacity ?? 100) / 100));
        const mmColor = hexToRgba(ef.minMaxColor || '#64748B', mmAlpha);
        const mmFontFam = resolveCourseDataFont(ef.minMaxFontFamily || cd.globalFont);
        const mmSize = ef.minMaxFontSize || 12;
        const mmWeight = ef.minMaxFontWeight || '600';
        const mmOffsetX = ef.minMaxOffsetX || 0;
        const mmOffsetY = ef.minMaxOffsetY || 0;

        if (ef.minMaxShadow) {
          const mms = typeof ef.minMaxShadow === 'object' ? ef.minMaxShadow : { enabled: true, color: ef.minMaxShadowColor, blur: ef.minMaxShadowBlur, offsetX: ef.minMaxShadowOffsetX, offsetY: ef.minMaxShadowOffsetY };
          if (mms.enabled !== false) {
            ctx.shadowColor = mms.color || ef.minMaxShadowColor || 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = mms.blur ?? ef.minMaxShadowBlur ?? 6;
            ctx.shadowOffsetX = mms.offsetX ?? ef.minMaxShadowOffsetX ?? 0;
            ctx.shadowOffsetY = mms.offsetY ?? ef.minMaxShadowOffsetY ?? 2;
          }
        }

        ctx.fillStyle = mmColor;
        ctx.font = `${mmWeight} ${mmSize}px ${mmFontFam}`;
        ctx.letterSpacing = `${ef.minMaxLetterSpacing ?? 1}px`;
        
        ctx.textAlign = 'left';
        ctx.fillText(ef.customMinLabel || `MIN: ${minEle}M`, plotX + mmOffsetX, plotY + plotH + 18 + mmOffsetY);
        
        ctx.textAlign = 'right';
        ctx.fillText(ef.customMaxLabel || `MAX: ${maxEle}M`, plotX + plotW + mmOffsetX, plotY + plotH + 18 + mmOffsetY);
        ctx.restore();
      }

      // 4. Peak Markers (Picos & Topos)
      if (cd.peakMarkers?.enabled && cd.peakMarkers.markers.length > 0) {
        cd.peakMarkers.markers.forEach(pm => {
          const pct = Math.max(0, Math.min(1, pm.pctPosition ?? 0.5));
          const ptIdx = Math.floor(pct * (rawElevations.length - 1));

          if (ptIdx < coords.length) {
            const peakCoord = coords[ptIdx];
            const tSize = pm.triangleSize || 12;
            const tColor = pm.triangleColor || ef.strokeColor || '#D4E157';

            // Draw downward pointing triangle
            if (pm.showTriangle !== false) {
              ctx.save();
              ctx.fillStyle = tColor;
              ctx.beginPath();
              ctx.moveTo(peakCoord.x - tSize / 2, peakCoord.y - tSize - 4);
              ctx.lineTo(peakCoord.x + tSize / 2, peakCoord.y - tSize - 4);
              ctx.lineTo(peakCoord.x, peakCoord.y - 4);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }

            // Draw label / number
            if (pm.showLabel !== false) {
              ctx.save();
              const pmAlpha = Math.max(0, Math.min(1, (pm.textOpacity ?? 100) / 100));
              ctx.fillStyle = hexToRgba(pm.textColor || '#FFFFFF', pmAlpha);
              const pmFont = resolveCourseDataFont(pm.fontFamily || cd.globalFont);
              ctx.font = `${pm.fontWeight || '600'} ${pm.fontSize || 14}px ${pmFont}`;
              ctx.letterSpacing = `${pm.letterSpacing ?? 1}px`;
              ctx.textAlign = 'center';

              const mx = peakCoord.x + (pm.xOffset ?? pm.offsetX ?? 0);
              const my = peakCoord.y - tSize - 12 + (pm.yOffset ?? pm.offsetY ?? 0);

              if (pm.rotation) {
                ctx.translate(mx, my);
                ctx.rotate((pm.rotation * Math.PI) / 180);
                ctx.translate(-mx, -my);
              }

              if (pm.textShadow !== false) {
                ctx.shadowColor = pm.textShadowColor || 'rgba(0, 0, 0, 0.9)';
                ctx.shadowBlur = pm.textShadowBlur ?? 6;
                ctx.shadowOffsetX = pm.textShadowOffsetX ?? 0;
                ctx.shadowOffsetY = pm.textShadowOffsetY ?? 2;
              }

              const lbl = `${pm.name ? pm.name + ' ' : ''}${pm.altitudeMeters || maxEle}M`;
              ctx.fillText(lbl, mx, my);
              ctx.restore();
            }
          }
        });
      }

      ctx.restore();
    } else {
      // Graceful empty elevation fallback
      ctx.fillStyle = '#64748B';
      ctx.font = '400 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PERFIL PLANO OU SEM DADOS ALTIMÉTRICOS', footerX + (footerW / 2), footerY + (footerH / 2) + 20);
    }

    ctx.restore();
  }

  // =========================================================================
  // LAYER 6: FLOATING TEXTS / ANNOTATIONS
  // =========================================================================
  if (cd.floatingTexts && cd.floatingTexts.length > 0) {
    cd.floatingTexts.forEach(ft => {
      if (ft.enabled === false) return;
      const fx = (CANVAS_WIDTH * ft.xPct) / 100 + (ft.xOffset || 0);
      const fy = (CANVAS_HEIGHT * ft.yPct) / 100 + (ft.yOffset || 0);

      ctx.save();
      ctx.translate(fx, fy);
      if (ft.rotation) {
        ctx.rotate((ft.rotation * Math.PI) / 180);
      }

      if (ft.shadow) {
        ctx.shadowColor = ft.shadowColor || 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = ft.shadowBlur ?? 8;
        ctx.shadowOffsetX = ft.shadowOffsetX ?? 0;
        ctx.shadowOffsetY = ft.shadowOffsetY ?? 2;
      }

      ctx.fillStyle = hexToRgba(ft.color || '#FFFFFF', Math.max(0, Math.min(1, (ft.opacity ?? 100) / 100)));
      const ftFont = resolveCourseDataFont(ft.fontFamily || cd.globalFont);
      ctx.font = `${ft.fontWeight || '600'} ${ft.fontSize || 18}px ${ftFont}`;
      ctx.letterSpacing = `${ft.letterSpacing ?? 1}px`;
      ctx.textAlign = 'center';

      let textStr = ft.text || '';
      if (ft.textTransform === 'uppercase') textStr = textStr.toUpperCase();
      else if (ft.textTransform === 'lowercase') textStr = textStr.toLowerCase();
      else if (ft.textTransform === 'capitalize') textStr = textStr.replace(/\b\w/g, c => c.toUpperCase());

      ctx.fillText(textStr, 0, 0);

      ctx.restore();
    });
  }
}

/**
 * Render optional map window inside Template 1
 */
function renderOptionalMap(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  mapConf: CourseDataConfig['optionalMap'],
  progressRatio: number
) {
  const mapW = (CANVAS_WIDTH * Math.max(40, Math.min(96, mapConf.widthPct || 90))) / 100;
  const mapH = Math.max(150, mapConf.heightPx || 320);
  const mapX = (CANVAS_WIDTH * (mapConf.xPct || 5)) / 100;
  const mapY = (CANVAS_HEIGHT * (mapConf.yPct || 40)) / 100;

  ctx.save();
  ctx.globalAlpha = Math.max(0.1, Math.min(1, (mapConf.opacity || 95) / 100));

  // Outer border & shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  drawRoundedRect(ctx, mapX, mapY, mapW, mapH, mapConf.borderRadius || 16);
  ctx.fillStyle = '#0F1218';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Clip content inside map window
  ctx.save();
  drawRoundedRect(ctx, mapX, mapY, mapW, mapH, mapConf.borderRadius || 16);
  ctx.clip();

  // Map background
  ctx.fillStyle = mapConf.mapStyle === 'light' ? '#E2E8F0' : '#141A24';
  ctx.fillRect(mapX, mapY, mapW, mapH);

  // Grid
  ctx.strokeStyle = mapConf.mapStyle === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let gx = mapX; gx < mapX + mapW; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, mapY);
    ctx.lineTo(gx, mapY + mapH);
    ctx.stroke();
  }
  for (let gy = mapY; gy < mapY + mapH; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(mapX, gy);
    ctx.lineTo(mapX + mapW, gy);
    ctx.stroke();
  }

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

    const latSpan = Math.max(0.0008, maxLat - minLat);
    const lonSpan = Math.max(0.0008, maxLon - minLon);
    const pad = 36;
    const projW = mapW - (pad * 2);
    const projH = mapH - (pad * 2);

    const projX = (lng: number) => mapX + pad + ((lng - minLon) / lonSpan) * projW;
    const projY = (lat: number) => (mapY + mapH - pad) - ((lat - minLat) / latSpan) * projH;

    const { points: animatedPoints, currentHead } = getRouteSliceAtRatio(interpolated, progressRatio);

    if (animatedPoints.length > 1) {
      // Glow / halo
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = (mapConf.routeWidth || 6) + 6;
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

      // Route
      ctx.strokeStyle = mapConf.routeColor || '#D4E157';
      ctx.lineWidth = mapConf.routeWidth || 6;
      ctx.beginPath();
      animatedPoints.forEach((pt: { lat: number; lng: number }, i: number) => {
        const px = projX(pt.lng);
        const py = projY(pt.lat);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Start & Finish Pins
      if (mapConf.showStartFinishPins) {
        const startX = projX(allPoints[0].lng);
        const startY = projY(allPoints[0].lat);
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(startX, startY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (currentHead) {
          const headX = projX(currentHead.lng);
          const headY = projY(currentHead.lat);
          ctx.fillStyle = '#D4E157';
          ctx.beginPath();
          ctx.arc(headX, headY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore(); // clip
  ctx.restore(); // alpha
}

/**
 * Utility: draw rounded rectangle
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
 * Utility: Convert hex color string to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex;
  }
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Resolve font family CSS string
 */
function getFontFamilyString(family: string): string {
  return resolveCourseDataFont(family);
}
