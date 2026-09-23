import { 
  UserActivity, 
  StoryConfig, 
  RaceCourseMapConfig,
  RaceCourseMapLegendItem,
  RaceCourseMapStreetName,
  RaceCourseMapAidStation,
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
 * Utility: Hex to RGBA string helper
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
 * Draw crisp vector icons for legend and markers
 */
export function drawRaceVectorIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  centerX: number,
  centerY: number,
  size: number,
  color: string,
  customSymbol?: string
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
    case 'route':
      // Zigzag route line icon
      ctx.beginPath();
      ctx.moveTo(-h * 0.7, h * 0.5);
      ctx.lineTo(-h * 0.2, -h * 0.4);
      ctx.lineTo(h * 0.2, h * 0.2);
      ctx.lineTo(h * 0.7, -h * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(h * 0.7, -h * 0.6, Math.max(2, size * 0.12), 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'flag':
      // Finish Flag
      ctx.beginPath();
      ctx.moveTo(-h * 0.5, -h * 0.8);
      ctx.lineTo(-h * 0.5, h * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-h * 0.5, -h * 0.8);
      ctx.lineTo(h * 0.6, -h * 0.5);
      ctx.lineTo(-h * 0.5, -h * 0.1);
      ctx.closePath();
      ctx.fill();
      break;

    case 'circle_num':
      // Circle badge with inner number/letter
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2);
      ctx.fill();
      if (customSymbol) {
        ctx.fillStyle = '#0D0D0D';
        ctx.font = `bold ${Math.round(size * 0.5)}px 'Oswald', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(customSymbol, 0, 1);
      }
      break;

    case 'stop':
      // Octagon / Power stop
      ctx.beginPath();
      const r = h * 0.8;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 8;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0D0D0D';
      ctx.font = `bold ${Math.round(size * 0.4)}px 'Oswald', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customSymbol || 'P', 0, 1);
      break;

    case 'clock':
      // Clock icon
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h * 0.45);
      ctx.moveTo(0, 0);
      ctx.lineTo(h * 0.35, 0);
      ctx.stroke();
      break;

    case 'warning':
      // Alert triangle
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.85);
      ctx.lineTo(h * 0.85, h * 0.75);
      ctx.lineTo(-h * 0.85, h * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0D0D0D';
      ctx.font = `black ${Math.round(size * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, h * 0.15);
      break;

    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const aOuter = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const aInner = aOuter + Math.PI / 5;
        const xO = h * 0.8 * Math.cos(aOuter);
        const yO = h * 0.8 * Math.sin(aOuter);
        const xI = h * 0.35 * Math.cos(aInner);
        const yI = h * 0.35 * Math.sin(aInner);
        if (i === 0) ctx.moveTo(xO, yO);
        else ctx.lineTo(xO, yO);
        ctx.lineTo(xI, yI);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'pin':
      ctx.beginPath();
      ctx.arc(0, -h * 0.3, h * 0.5, Math.PI, 0);
      ctx.bezierCurveTo(h * 0.5, 0, 0, h * 0.8, 0, h);
      ctx.bezierCurveTo(0, h * 0.8, -h * 0.5, 0, -h * 0.5, -h * 0.3);
      ctx.fill();
      ctx.fillStyle = '#0D0D0D';
      ctx.beginPath();
      ctx.arc(0, -h * 0.3, h * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'info':
    default:
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.round(size * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('i', 0, 0);
      break;
  }

  ctx.restore();
}

/**
 * Standard factory default configuration for Template 5 — Race Course Map
 */
export function getDefaultRaceCourseMapConfig(activity?: UserActivity, athleteName?: string): RaceCourseMapConfig {
  const defaultFont = 'Oswald';

  return {
    primaryAccentColor: '#FFD400', // Vibrant Yellow
    secondaryAccentColor: '#FFFFFF',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#A3A3A3',
    darkBgColor: '#0D0D0D',

    background: {
      source: 'map',
      solidBgColor: '#0D0D0D',
      mapBgDarkColor: '#0D0D0D',
      mapStreetsColor: '#262626',
      mapWaterColor: '#05080D',
      mapDetailLevel: 'high',
      customPhotoUrl: null,
      filter: 'none',
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      blur: 0,
      overlayColor: '#000000',
      overlayOpacity: 20,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0
    },

    title: {
      enabled: true,
      xOffset: 0,
      yOffset: 0,
      align: 'center',
      showTopBanner: true,
      topBannerColor: '#000000',
      topBannerOpacity: 85,
      topBannerHeightPx: 140,
      part1: {
        text: 'LIVESTRONG',
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 54,
          fontWeight: '800',
          letterSpacing: 8,
          color: '#FFFFFF',
          textTransform: 'uppercase'
        })
      },
      part2: {
        text: 'HONOR 5K/10K',
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 54,
          fontWeight: '800',
          letterSpacing: 8,
          color: '#FFD400',
          textTransform: 'uppercase'
        })
      },
      registeredSymbol: {
        text: '®',
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: 0,
          color: '#FFD400',
          offsetY: -16
        })
      }
    },

    route: {
      enabled: true,
      color: '#FFD400',
      width: 9,
      haloColor: '#000000',
      haloWidth: 3,
      smoothCurves: true,
      showDirectionArrows: true,
      arrowsCount: 8,
      arrowsSize: 18,
      arrowsSpacing: 100,
      arrowsColor: '#0D0D0D',
      showOuterGlow: true,
      outerGlowColor: 'rgba(255, 212, 0, 0.4)',
      outerGlowBlur: 15,
      zoom: 1.0,
      panX: 0,
      panY: 0
    },

    markers: {
      showStartFinish: true,
      startFinishName: 'START / FINISH',
      startFinishIcon: 'flag',
      startFinishColor: '#FFD400',
      startFinishSize: 32,
      startFinishLabelTypography: createDefaultTypography({
        fontFamily: defaultFont,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#FFD400',
        textTransform: 'uppercase',
        shadowEnabled: true,
        shadowColor: 'rgba(0,0,0,0.9)',
        shadowBlur: 6
      }),
      aidStations: [
        {
          id: 'as-1',
          name: 'AID STATION 1',
          symbolOrNumber: '1',
          pctAlongRoute: 0.25,
          iconType: 'circle',
          iconColor: '#FFD400',
          iconSize: 24,
          textColor: '#0D0D0D',
          showLabel: true,
          labelTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1,
            color: '#E2E8F0'
          }),
          xOffset: 0,
          yOffset: -18,
          enabled: true
        },
        {
          id: 'as-2',
          name: 'POWER STOP',
          symbolOrNumber: 'P',
          pctAlongRoute: 0.60,
          iconType: 'square',
          iconColor: '#FFD400',
          iconSize: 24,
          textColor: '#0D0D0D',
          showLabel: true,
          labelTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1,
            color: '#E2E8F0'
          }),
          xOffset: 0,
          yOffset: -18,
          enabled: true
        }
      ]
    },

    streetNames: [
      {
        id: 'st-1',
        text: 'MAIN STREET',
        xPct: 38,
        yPct: 32,
        rotation: -18,
        locked: false,
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 3,
          color: '#A3A3A3',
          textTransform: 'uppercase'
        })
      },
      {
        id: 'st-2',
        text: 'PACIFIC AVENUE',
        xPct: 62,
        yPct: 46,
        rotation: 28,
        locked: false,
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 3,
          color: '#A3A3A3',
          textTransform: 'uppercase'
        })
      },
      {
        id: 'st-3',
        text: 'OCEAN DRIVE',
        xPct: 70,
        yPct: 68,
        rotation: -8,
        locked: false,
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 3,
          color: '#A3A3A3',
          textTransform: 'uppercase'
        })
      },
      {
        id: 'st-4',
        text: 'PARKWAY BLVD',
        xPct: 36,
        yPct: 78,
        rotation: 12,
        locked: false,
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 3,
          color: '#A3A3A3',
          textTransform: 'uppercase'
        })
      }
    ],

    northCompass: {
      enabled: true,
      xPct: 86,
      yPct: 18,
      size: 48,
      circleBgColor: '#FFD400',
      circleBorderColor: '#0D0D0D',
      iconType: 'circle_N',
      letterNColor: '#0D0D0D',
      letterNTypography: createDefaultTypography({
        fontFamily: defaultFont,
        fontSize: 22,
        fontWeight: '900',
        color: '#0D0D0D'
      })
    },

    sideLegend: {
      enabled: true,
      xPct: 6,
      yPct: 18,
      widthPct: 34,
      verticalGap: 16,
      iconTextGap: 12,
      bgColor: 'rgba(13, 13, 13, 0.88)',
      bgOpacity: 88,
      borderRadius: 12,
      padding: 18,
      borderColor: 'rgba(255, 212, 0, 0.25)',
      borderWidth: 1,
      items: [
        {
          id: 'leg-1',
          enabled: true,
          iconType: 'route',
          iconColor: '#FFD400',
          iconSize: 22,
          showIcon: true,
          text: 'COURSE',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 15,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#FFFFFF',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-2',
          enabled: true,
          iconType: 'flag',
          iconColor: '#FFD400',
          iconSize: 22,
          showIcon: true,
          text: 'START / FINISH',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 15,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#FFFFFF',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-3',
          enabled: true,
          iconType: 'circle_num',
          iconUrl: undefined,
          iconColor: '#FFD400',
          iconSize: 22,
          showIcon: true,
          text: '5K = 1 LAP',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#E2E8F0',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-4',
          enabled: true,
          iconType: 'circle_num',
          iconColor: '#FFD400',
          iconSize: 22,
          showIcon: true,
          text: '10K = 2 LAPS',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#E2E8F0',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-5',
          enabled: true,
          iconType: 'stop',
          iconColor: '#FFD400',
          iconSize: 22,
          showIcon: true,
          text: 'POWER STOP',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#E2E8F0',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-6',
          enabled: true,
          iconType: 'clock',
          iconColor: '#FFD400',
          iconSize: 20,
          showIcon: true,
          text: 'EVENT BEGINS AT 7:30 A.M.',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 1,
            color: '#CBD5E1',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-7',
          enabled: true,
          iconType: 'clock',
          iconColor: '#FFD400',
          iconSize: 20,
          showIcon: true,
          text: 'COURSES CLOSE AT 10:30 A.M.',
          showText: true,
          isWarning: false,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 1,
            color: '#CBD5E1',
            textTransform: 'uppercase'
          })
        },
        {
          id: 'leg-8',
          enabled: true,
          iconType: 'warning',
          iconColor: '#FFD400',
          iconSize: 22,
          showIcon: true,
          text: 'NO PARKING ON RACE ROUTE',
          showText: true,
          isWarning: true,
          warningIconColor: '#FFD400',
          typography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1,
            color: '#FFD400',
            textTransform: 'uppercase'
          })
        }
      ]
    },

    footer: {
      enabled: true,
      xOffset: 0,
      yOffset: 0,
      align: 'center',
      showBottomBanner: true,
      bottomBannerColor: '#000000',
      bottomBannerOpacity: 90,
      bottomBannerHeightPx: 120,
      teamOrBrandName: {
        text: 'AUSTIN RUN CLUB',
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 34,
          fontWeight: '800',
          letterSpacing: 6,
          color: '#FFFFFF',
          textTransform: 'uppercase'
        })
      },
      slogan: {
        text: 'EST. 2018 • AUSTIN, TEXAS',
        enabled: true,
        typography: createDefaultTypography({
          fontFamily: defaultFont,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: 4,
          color: '#A3A3A3',
          textTransform: 'uppercase',
          offsetY: 6
        })
      },
      patternIcon: {
        enabled: true,
        type: 'bars',
        size: 28,
        color: '#FFD400'
      }
    },

    metricsPanel: {
      enabled: true,
      layout: 'grid',
      xPct: 6,
      yPct: 62,
      gap: 12,
      bgColor: 'rgba(13, 13, 13, 0.88)',
      bgOpacity: 88,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 212, 0, 0.25)',
      padding: 16,
      shadowEnabled: true,
      shadowColor: 'rgba(0, 0, 0, 0.8)',
      shadowBlur: 10,
      cards: [
        {
          id: 'mc-dist',
          enabled: true,
          metricKey: 'distance',
          label: 'DISTÂNCIA',
          value: activity ? `${activity.distanceKm.toFixed(2)} km` : '21.10 km',
          xPct: 6,
          yPct: 62,
          widthPx: 160,
          heightPx: 70,
          bgColor: 'rgba(13, 13, 13, 0.85)',
          bgOpacity: 85,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(255, 212, 0, 0.3)',
          paddingX: 12,
          paddingY: 10,
          shadowEnabled: true,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          showIcon: true,
          iconType: 'route',
          iconColor: '#FFD400',
          iconSize: 18,
          showLabel: true,
          labelTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#A3A3A3',
            textTransform: 'uppercase'
          }),
          showValue: true,
          valueTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: 1,
            color: '#FFD400'
          })
        },
        {
          id: 'mc-dur',
          enabled: true,
          metricKey: 'duration',
          label: 'TEMPO',
          value: activity ? (activity.durationSeconds > 3600 ? `${Math.floor(activity.durationSeconds/3600)}h ${Math.floor((activity.durationSeconds%3600)/60)}m` : `${Math.floor(activity.durationSeconds/60)}m ${activity.durationSeconds%60}s`) : '1h 45m',
          xPct: 22,
          yPct: 62,
          widthPx: 160,
          heightPx: 70,
          bgColor: 'rgba(13, 13, 13, 0.85)',
          bgOpacity: 85,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(255, 212, 0, 0.3)',
          paddingX: 12,
          paddingY: 10,
          shadowEnabled: true,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          showIcon: true,
          iconType: 'clock',
          iconColor: '#FFD400',
          iconSize: 18,
          showLabel: true,
          labelTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#A3A3A3',
            textTransform: 'uppercase'
          }),
          showValue: true,
          valueTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: 1,
            color: '#FFFFFF'
          })
        },
        {
          id: 'mc-pace',
          enabled: true,
          metricKey: 'pace',
          label: 'RITMO MÉDIO',
          value: activity ? `${activity.paceFormatted}/km` : "4'58\"/km",
          xPct: 6,
          yPct: 71,
          widthPx: 160,
          heightPx: 70,
          bgColor: 'rgba(13, 13, 13, 0.85)',
          bgOpacity: 85,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(255, 212, 0, 0.3)',
          paddingX: 12,
          paddingY: 10,
          shadowEnabled: true,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          showIcon: true,
          iconType: 'bolt',
          iconColor: '#FFD400',
          iconSize: 18,
          showLabel: true,
          labelTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#A3A3A3',
            textTransform: 'uppercase'
          }),
          showValue: true,
          valueTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: 1,
            color: '#FFFFFF'
          })
        },
        {
          id: 'mc-elev',
          enabled: true,
          metricKey: 'elevationGain',
          label: 'GANHO ELEV.',
          value: activity ? `${activity.elevationGainMeters || 0} m` : '320 m',
          xPct: 22,
          yPct: 71,
          widthPx: 160,
          heightPx: 70,
          bgColor: 'rgba(13, 13, 13, 0.85)',
          bgOpacity: 85,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(255, 212, 0, 0.3)',
          paddingX: 12,
          paddingY: 10,
          shadowEnabled: true,
          shadowColor: 'rgba(0,0,0,0.8)',
          shadowBlur: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          showIcon: true,
          iconType: 'star',
          iconColor: '#FFD400',
          iconSize: 18,
          showLabel: true,
          labelTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 2,
            color: '#A3A3A3',
            textTransform: 'uppercase'
          }),
          showValue: true,
          valueTypography: createDefaultTypography({
            fontFamily: defaultFont,
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: 1,
            color: '#FFFFFF'
          })
        }
      ]
    },

    floatingTexts: [],
    floatingIcons: []
  };
}

/**
 * Main Template 5 "Race Course Map" Canvas 2D Renderer
 */
export function renderRaceCourseMapTemplate(
  ctx: CanvasRenderingContext2D,
  activity: UserActivity,
  athleteName: string,
  config: StoryConfig,
  progressRatio: number = 1
) {
  const conf: RaceCourseMapConfig = config.raceCourseMap || getDefaultRaceCourseMapConfig(activity, athleteName);

  // --------------------------------------------------------------------------
  // 1. BACKGROUND LAYER (Dark Stylized Map or Personal Photo or Solid)
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.fillStyle = conf.darkBgColor || '#0D0D0D';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let photoDrawn = false;
  if (conf.background.source === 'photo' && config.customPhotoUrl) {
    const customPhoto = config.customPhotoUrl;
    const img = storyImageCache.get(customPhoto) || (window as any).__storyPhotoCache?.get(customPhoto) ||
      (document.querySelector(`img[src="${customPhoto}"]`) as HTMLImageElement);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      const brightness = 100 + (conf.background.brightness || 0);
      const contrast = 100 + (conf.background.contrast || 0);
      const filterMode = conf.background.filter || 'none';

      if (filterMode === 'grayscale') {
        ctx.filter = `grayscale(100%) contrast(${contrast}%) brightness(${brightness}%)`;
      } else if (filterMode === 'sepia') {
        ctx.filter = `sepia(80%) contrast(${contrast}%) brightness(${brightness}%)`;
      } else {
        ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
      }

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const baseScale = Math.max(CANVAS_WIDTH / naturalW, CANVAS_HEIGHT / naturalH);
      const zoom = baseScale * (conf.background.zoom || 1.0);
      const dw = naturalW * zoom;
      const dh = naturalH * zoom;
      const dx = (CANVAS_WIDTH - dw) / 2 + (conf.background.panX || 0);
      const dy = (CANVAS_HEIGHT - dh) / 2 + (conf.background.panY || 0);

      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
      ctx.restore();
      photoDrawn = true;

      // Photo overlay
      const overlayOpacity = (conf.background.overlayOpacity ?? 20) / 100;
      if (overlayOpacity > 0) {
        ctx.fillStyle = hexToRgba(conf.background.overlayColor || '#000000', overlayOpacity);
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
  }

  // Draw Dark Stylized Map Grid if no photo or background.source === 'map'
  if (!photoDrawn && conf.background.source !== 'solid') {
    ctx.save();
    // Dark water area polygons (synthesized stylized bay/river)
    ctx.fillStyle = conf.background.mapWaterColor || '#05080D';
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH * 0.7, 0);
    ctx.bezierCurveTo(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.3, CANVAS_WIDTH * 0.95, CANVAS_HEIGHT * 0.6, CANVAS_WIDTH, CANVAS_HEIGHT * 0.85);
    ctx.lineTo(CANVAS_WIDTH, 0);
    ctx.closePath();
    ctx.fill();

    // Stylized Street Network Lines (Fine grid)
    ctx.strokeStyle = conf.background.mapStreetsColor || '#262626';
    ctx.lineWidth = 2.5;

    const gridRows = 24;
    const gridCols = 16;
    const stepY = CANVAS_HEIGHT / gridRows;
    const stepX = CANVAS_WIDTH / gridCols;

    for (let i = 0; i <= gridRows; i++) {
      const y = i * stepY;
      ctx.beginPath();
      ctx.moveTo(0, y + (i % 2 === 0 ? 0 : 8));
      ctx.lineTo(CANVAS_WIDTH, y - (i % 3 === 0 ? 12 : 0));
      ctx.stroke();
    }

    for (let j = 0; j <= gridCols; j++) {
      const x = j * stepX;
      ctx.beginPath();
      ctx.moveTo(x + (j % 3 === 0 ? 15 : 0), 0);
      ctx.lineTo(x - (j % 2 === 0 ? 10 : 0), CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();

  // --------------------------------------------------------------------------
  // 2. TOP BANNER & TITLE LAYER
  // --------------------------------------------------------------------------
  if (conf.title.enabled) {
    ctx.save();
    const titleY = SAFE_TOP + 20 + conf.title.yOffset;

    if (conf.title.showTopBanner) {
      const topBannerH = conf.title.topBannerHeightPx || 140;
      ctx.fillStyle = hexToRgba(conf.title.topBannerColor || '#000000', (conf.title.topBannerOpacity ?? 85) / 100);
      ctx.fillRect(0, 0, CANVAS_WIDTH, topBannerH);
    }

    let centerX = CANVAS_WIDTH / 2 + conf.title.xOffset;
    if (conf.title.align === 'left') centerX = SAFE_SIDE + 20 + conf.title.xOffset;
    if (conf.title.align === 'right') centerX = CANVAS_WIDTH - SAFE_SIDE - 20 + conf.title.xOffset;

    // Title consists of Part 1 (e.g. LIVESTRONG) + space + Part 2 (e.g. HONOR 5K/10K) + symbol ®
    const textPart1 = conf.title.part1.enabled ? conf.title.part1.text : '';
    const textPart2 = conf.title.part2.enabled ? conf.title.part2.text : '';
    const textSymbol = conf.title.registeredSymbol.enabled ? conf.title.registeredSymbol.text : '';

    if (conf.title.align === 'center') {
      // Calculate split text positioning
      ctx.font = `800 ${conf.title.part1.typography.fontSize || 54}px 'Oswald', sans-serif`;
      const w1 = textPart1 ? ctx.measureText(textPart1).width : 0;
      ctx.font = `800 ${conf.title.part2.typography.fontSize || 54}px 'Oswald', sans-serif`;
      const w2 = textPart2 ? ctx.measureText(textPart2).width : 0;
      const spacing = textPart1 && textPart2 ? 18 : 0;
      const totalWidth = w1 + spacing + w2;

      let startX = centerX - totalWidth / 2;

      if (textPart1) {
        renderCustomTypographyText(
          ctx,
          textPart1,
          startX + w1 / 2,
          titleY,
          conf.title.part1.typography,
          { align: 'center' }
        );
      }

      if (textPart2) {
        renderCustomTypographyText(
          ctx,
          textPart2,
          startX + w1 + spacing + w2 / 2,
          titleY,
          conf.title.part2.typography,
          { align: 'center' }
        );

        if (textSymbol) {
          renderCustomTypographyText(
            ctx,
            textSymbol,
            startX + w1 + spacing + w2 + 8,
            titleY,
            conf.title.registeredSymbol.typography,
            { align: 'left' }
          );
        }
      }
    } else {
      let currX = centerX;
      if (textPart1) {
        renderCustomTypographyText(
          ctx,
          textPart1,
          currX,
          titleY,
          conf.title.part1.typography,
          { align: conf.title.align }
        );
      }
      if (textPart2) {
        renderCustomTypographyText(
          ctx,
          textPart2,
          currX + (textPart1 ? 280 : 0),
          titleY,
          conf.title.part2.typography,
          { align: conf.title.align }
        );
      }
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 3. MAP ROUTE & WAYPOINTS LAYER
  // --------------------------------------------------------------------------
  let routePoints: RoutePoint[] = activity.route || [];

  // Fallback route loop if activity has no GPX points
  if (routePoints.length < 5) {
    routePoints = [];
    const steps = 60;
    const centerLat = -23.5505;
    const centerLng = -46.6333;
    for (let i = 0; i <= steps; i++) {
      const angle = (Math.PI * 2 * i) / steps;
      const r = 0.015 + Math.sin(angle * 3) * 0.005;
      routePoints.push({
        lat: centerLat + Math.sin(angle) * r,
        lng: centerLng + Math.cos(angle) * r
      });
    }
  }

  if (conf.route.enabled && routePoints.length >= 2) {
    ctx.save();
    // Slice route for video progress animation
    const interpolated = getCachedInterpolatedRoute(activity.id, routePoints, false);
    const { points: animatedPoints } = getRouteSliceAtRatio(interpolated, progressRatio);

    // Compute Lat/Lng bounding box
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    routePoints.forEach((p: RoutePoint) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const mapAreaX = CANVAS_WIDTH * 0.38;
    const mapAreaY = CANVAS_HEIGHT * 0.22;
    const mapAreaW = CANVAS_WIDTH * 0.56;
    const mapAreaH = CANVAS_HEIGHT * 0.62;

    const latSpan = Math.max(0.001, maxLat - minLat);
    const lngSpan = Math.max(0.001, maxLng - minLng);

    const scaleX = (mapAreaW * 0.75 * conf.route.zoom) / lngSpan;
    const scaleY = (mapAreaH * 0.75 * conf.route.zoom) / latSpan;
    const scale = Math.min(scaleX, scaleY);

    const centerRouteX = (minLng + maxLng) / 2;
    const centerRouteY = (minLat + maxLat) / 2;

    const project = (pt: { lat: number; lng: number }) => {
      const px = mapAreaX + mapAreaW / 2 + (pt.lng - centerRouteX) * scale + conf.route.panX;
      const py = mapAreaY + mapAreaH / 2 - (pt.lat - centerRouteY) * scale + conf.route.panY;
      return { x: px, y: py };
    };

    const canvasPts = animatedPoints.map(project);

    // Outer Glow
    if (conf.route.showOuterGlow && canvasPts.length > 1) {
      ctx.save();
      ctx.shadowColor = conf.route.outerGlowColor || 'rgba(255, 212, 0, 0.5)';
      ctx.shadowBlur = conf.route.outerGlowBlur || 15;
      ctx.strokeStyle = conf.route.color || '#FFD400';
      ctx.lineWidth = conf.route.width;
      ctx.beginPath();
      canvasPts.forEach((p: { x: number; y: number }, i: number) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Halo Outline
    if (conf.route.haloWidth > 0 && canvasPts.length > 1) {
      ctx.save();
      ctx.strokeStyle = conf.route.haloColor || '#000000';
      ctx.lineWidth = conf.route.width + conf.route.haloWidth * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      canvasPts.forEach((p: { x: number; y: number }, i: number) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Primary Route Line
    if (canvasPts.length > 1) {
      ctx.save();
      ctx.strokeStyle = conf.route.color || '#FFD400';
      ctx.lineWidth = conf.route.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      canvasPts.forEach((p: { x: number; y: number }, i: number) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Direction Arrows along Route
    if (conf.route.showDirectionArrows && canvasPts.length > 5) {
      ctx.save();
      const count = conf.route.arrowsCount || 8;
      const step = Math.floor(canvasPts.length / (count + 1));
      ctx.fillStyle = conf.route.arrowsColor || '#0D0D0D';

      for (let i = 1; i <= count; i++) {
        const idx = i * step;
        if (idx < canvasPts.length - 1) {
          const curr = canvasPts[idx];
          const next = canvasPts[idx + 1];
          const angle = Math.atan2(next.y - curr.y, next.x - curr.x);

          ctx.save();
          ctx.translate(curr.x, curr.y);
          ctx.rotate(angle);
          const sz = conf.route.arrowsSize || 18;

          ctx.beginPath();
          ctx.moveTo(sz * 0.5, 0);
          ctx.lineTo(-sz * 0.4, -sz * 0.4);
          ctx.lineTo(-sz * 0.2, 0);
          ctx.lineTo(-sz * 0.4, sz * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // Start / Finish Marker
    if (conf.markers.showStartFinish && canvasPts.length > 0) {
      const startPt = canvasPts[0];
      drawRaceVectorIcon(
        ctx,
        conf.markers.startFinishIcon || 'flag',
        startPt.x,
        startPt.y - 8,
        conf.markers.startFinishSize || 32,
        conf.markers.startFinishColor || '#FFD400'
      );

      if (conf.markers.startFinishName) {
        renderCustomTypographyText(
          ctx,
          conf.markers.startFinishName,
          startPt.x,
          startPt.y - 32,
          conf.markers.startFinishLabelTypography,
          { align: 'center' }
        );
      }
    }

    // Aid Stations
    if (conf.markers.aidStations && conf.markers.aidStations.length > 0) {
      conf.markers.aidStations.forEach(as => {
        if (!as.enabled) return;
        const idx = Math.min(canvasPts.length - 1, Math.floor(as.pctAlongRoute * canvasPts.length));
        const pt = canvasPts[idx];
        if (!pt) return;

        const posX = pt.x + as.xOffset;
        const posY = pt.y + as.yOffset;

        drawRaceVectorIcon(
          ctx,
          as.iconType === 'circle' ? 'circle_num' : as.iconType === 'square' ? 'stop' : 'pin',
          posX,
          posY,
          as.iconSize || 24,
          as.iconColor || '#FFD400',
          as.symbolOrNumber
        );

        if (as.showLabel && as.name) {
          renderCustomTypographyText(
            ctx,
            as.name,
            posX,
            posY - (as.iconSize / 2 + 10),
            as.labelTypography,
            { align: 'center' }
          );
        }
      });
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. STREET NAMES & LANDMARKS LAYER
  // --------------------------------------------------------------------------
  if (conf.streetNames && conf.streetNames.length > 0) {
    conf.streetNames.forEach(st => {
      if (!st.enabled || !st.text) return;
      const x = (st.xPct / 100) * CANVAS_WIDTH;
      const y = (st.yPct / 100) * CANVAS_HEIGHT;

      ctx.save();
      ctx.translate(x, y);
      if (st.rotation) {
        ctx.rotate((st.rotation * Math.PI) / 180);
      }

      renderCustomTypographyText(
        ctx,
        st.text,
        0,
        0,
        st.typography,
        { align: 'center' }
      );
      ctx.restore();
    });
  }

  // --------------------------------------------------------------------------
  // 5. NORTH COMPASS INDICATOR LAYER
  // --------------------------------------------------------------------------
  if (conf.northCompass.enabled) {
    ctx.save();
    const cx = (conf.northCompass.xPct / 100) * CANVAS_WIDTH;
    const cy = (conf.northCompass.yPct / 100) * CANVAS_HEIGHT;
    const sz = conf.northCompass.size || 48;

    ctx.fillStyle = conf.northCompass.circleBgColor || '#FFD400';
    ctx.strokeStyle = conf.northCompass.circleBorderColor || '#0D0D0D';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw "N" letter
    renderCustomTypographyText(
      ctx,
      'N',
      cx,
      cy,
      conf.northCompass.letterNTypography,
      { align: 'center' }
    );
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 6. SIDE LEGEND LAYER
  // --------------------------------------------------------------------------
  if (conf.sideLegend.enabled && conf.sideLegend.items && conf.sideLegend.items.length > 0) {
    ctx.save();
    const legX = (conf.sideLegend.xPct / 100) * CANVAS_WIDTH;
    const legY = (conf.sideLegend.yPct / 100) * CANVAS_HEIGHT;
    const legW = (conf.sideLegend.widthPct / 100) * CANVAS_WIDTH;
    const pad = conf.sideLegend.padding || 18;
    const vGap = conf.sideLegend.verticalGap || 16;
    const iconGap = conf.sideLegend.iconTextGap || 12;

    const visibleItems = conf.sideLegend.items.filter(it => it.enabled);
    const itemHeight = 26;
    const totalContentH = visibleItems.length * (itemHeight + vGap) - vGap;
    const cardH = totalContentH + pad * 2;

    // Draw Legend Background Box
    ctx.fillStyle = hexToRgba(conf.sideLegend.bgColor || '#0D0D0D', (conf.sideLegend.bgOpacity ?? 88) / 100);
    drawRoundedRect(ctx, legX, legY, legW, cardH, conf.sideLegend.borderRadius || 12);
    ctx.fill();

    if (conf.sideLegend.borderWidth > 0) {
      ctx.strokeStyle = conf.sideLegend.borderColor || 'rgba(255,212,0,0.3)';
      ctx.lineWidth = conf.sideLegend.borderWidth;
      ctx.stroke();
    }

    // Render Each Legend Item
    let currY = legY + pad + 12;
    visibleItems.forEach((item, idx) => {
      const itemX = legX + pad;

      // Draw Icon
      if (item.showIcon) {
        const iconColor = item.isWarning ? (item.warningIconColor || '#FFD400') : item.iconColor;
        drawRaceVectorIcon(
          ctx,
          item.iconType,
          itemX + item.iconSize / 2,
          currY,
          item.iconSize || 22,
          iconColor,
          item.text.includes('1 LAP') ? '1' : item.text.includes('2 LAPS') ? '2' : undefined
        );
      }

      // Draw Item Text
      if (item.showText && item.text) {
        const textX = item.showIcon ? itemX + item.iconSize + iconGap : itemX;
        renderCustomTypographyText(
          ctx,
          item.text,
          textX,
          currY,
          item.typography,
          { align: 'left' }
        );
      }

      currY += itemHeight + vGap;
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 6.5 METRIC CARDS & BADGES LAYER
  // --------------------------------------------------------------------------
  if (conf.metricsPanel && conf.metricsPanel.enabled && conf.metricsPanel.cards) {
    const enabledCards = conf.metricsPanel.cards.filter(c => c.enabled);

    if (enabledCards.length > 0) {
      ctx.save();

      enabledCards.forEach(card => {
        const cx = (card.xPct / 100) * CANVAS_WIDTH;
        const cy = (card.yPct / 100) * CANVAS_HEIGHT;
        const cw = card.widthPx || 160;
        const ch = card.heightPx || 70;
        const padX = card.paddingX || 12;
        const padY = card.paddingY || 10;

        if (card.shadowEnabled) {
          ctx.save();
          ctx.shadowColor = card.shadowColor || 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = card.shadowBlur || 8;
          ctx.shadowOffsetX = card.shadowOffsetX || 0;
          ctx.shadowOffsetY = card.shadowOffsetY || 4;
        }

        // Card Container Box
        ctx.fillStyle = hexToRgba(card.bgColor || '#0D0D0D', (card.bgOpacity ?? 85) / 100);
        drawRoundedRect(ctx, cx, cy, cw, ch, card.borderRadius || 10);
        ctx.fill();

        if (card.borderWidth > 0) {
          ctx.strokeStyle = card.borderColor || 'rgba(255, 212, 0, 0.3)';
          ctx.lineWidth = card.borderWidth;
          ctx.stroke();
        }

        if (card.shadowEnabled) {
          ctx.restore();
        }

        let currX = cx + padX;
        let contentY = cy + padY + 12;

        // Draw Card Icon
        if (card.showIcon) {
          drawRaceVectorIcon(
            ctx,
            card.iconType || 'route',
            currX + (card.iconSize || 18) / 2,
            contentY,
            card.iconSize || 18,
            card.iconColor || '#FFD400'
          );
          currX += (card.iconSize || 18) + 8;
        }

        // Draw Card Label Text
        if (card.showLabel && card.label) {
          renderCustomTypographyText(
            ctx,
            card.label,
            currX,
            contentY - 2,
            card.labelTypography,
            { align: 'left' }
          );
        }

        // Draw Card Number/Value
        if (card.showValue && card.value) {
          renderCustomTypographyText(
            ctx,
            card.value,
            cx + padX,
            cy + ch - padY - 6,
            card.valueTypography,
            { align: 'left' }
          );
        }
      });

      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 7. FOOTER LAYER (LOGOS, BRAND & SLOGAN)
  // --------------------------------------------------------------------------
  if (conf.footer.enabled) {
    ctx.save();
    const footerY = CANVAS_HEIGHT - SAFE_BOTTOM - 20 + conf.footer.yOffset;

    if (conf.footer.showBottomBanner) {
      const bannerH = conf.footer.bottomBannerHeightPx || 120;
      ctx.fillStyle = hexToRgba(conf.footer.bottomBannerColor || '#000000', (conf.footer.bottomBannerOpacity ?? 90) / 100);
      ctx.fillRect(0, CANVAS_HEIGHT - bannerH, CANVAS_WIDTH, bannerH);
    }

    let centerX = CANVAS_WIDTH / 2 + conf.footer.xOffset;
    if (conf.footer.align === 'left') centerX = SAFE_SIDE + 20 + conf.footer.xOffset;
    if (conf.footer.align === 'right') centerX = CANVAS_WIDTH - SAFE_SIDE - 20 + conf.footer.xOffset;

    // Pattern Icon (e.g. 4 vertical bars)
    if (conf.footer.patternIcon.enabled) {
      ctx.fillStyle = conf.footer.patternIcon.color || '#FFD400';
      const barW = 6;
      const barH = conf.footer.patternIcon.size || 28;
      const barGap = 4;
      const barsCount = 4;
      const totalBarsW = barsCount * barW + (barsCount - 1) * barGap;

      const barsX = centerX - totalBarsW / 2;
      for (let b = 0; b < barsCount; b++) {
        ctx.fillRect(barsX + b * (barW + barGap), footerY - barH - 24, barW, barH);
      }
    }

    // Team / Brand Name
    if (conf.footer.teamOrBrandName.enabled && conf.footer.teamOrBrandName.text) {
      renderCustomTypographyText(
        ctx,
        conf.footer.teamOrBrandName.text,
        centerX,
        footerY - 10,
        conf.footer.teamOrBrandName.typography,
        { align: conf.footer.align }
      );
    }

    // Slogan
    if (conf.footer.slogan.enabled && conf.footer.slogan.text) {
      renderCustomTypographyText(
        ctx,
        conf.footer.slogan.text,
        centerX,
        footerY + 22,
        conf.footer.slogan.typography,
        { align: conf.footer.align }
      );
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 8. CUSTOM FLOATING TEXTS & ICONS LAYER
  // --------------------------------------------------------------------------
  if (conf.floatingTexts && conf.floatingTexts.length > 0) {
    conf.floatingTexts.forEach(ft => {
      if (!ft.enabled || !ft.text) return;
      const fx = (ft.xPct / 100) * CANVAS_WIDTH;
      const fy = (ft.yPct / 100) * CANVAS_HEIGHT;

      ctx.save();
      ctx.translate(fx, fy);
      if (ft.rotation) {
        ctx.rotate((ft.rotation * Math.PI) / 180);
      }

      if (ft.typography) {
        renderCustomTypographyText(ctx, ft.text, 0, 0, ft.typography, { align: 'center' });
      } else {
        ctx.fillStyle = ft.color || '#FFFFFF';
        ctx.font = `${ft.fontWeight || 'bold'} ${ft.fontSize || 20}px 'Oswald', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, 0, 0);
      }
      ctx.restore();
    });
  }
}
