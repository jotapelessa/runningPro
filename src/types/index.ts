export type RunnerLevel = 'beginner' | 'intermediate' | 'advanced';

export type DistanceType = 
  | '400m' 
  | '800m' 
  | '1500m' 
  | '1mile' 
  | '3000m' 
  | '2miles' 
  | '5k' 
  | '10k' 
  | '15k' 
  | '10miles' 
  | 'half_marathon' 
  | '30k' 
  | 'marathon' 
  | '50k'
  | 'custom';

export type AppTab = 'guide' | 'atividades' | 'importer' | 'zonas' | 'planilha' | 'previsoes' | 'recuperacao' | 'corridas';

export type PainSeverity = 'light' | 'moderate' | 'severe';
export type PainOccurrence = 'on_start' | 'during_run' | 'continuous';

export interface PainReport {
  id: string;
  location: string;
  severity: PainSeverity;
  occurrence: PainOccurrence;
  date: string;
  resolved: boolean;
  notes?: string;
}

export interface RunningShoe {
  id: string;
  name: string;
  mileageKm: number;
  maxMileageKm: number;
  active: boolean;
}

export interface TestRecord {
  id: string;
  date: string;
  type?: 'cooper' | '2400m' | 'vdot_direct' | 'race' | string;
  distanceId?: string;
  distanceMeters?: number;
  timeSeconds?: number;
  formattedTime?: string;
  value?: number;
  vo2max?: number;
  vdot: number;
  avgHr?: number;
  maxHr?: number;
  avgCadence?: number;
  elevationGainMeters?: number;
  location?: string;
  notes?: string;
}

export interface RunnerState {
  macHR?: number;
  maxHr?: number;
  restHR?: number;
  restingHr?: number;
  level?: RunnerLevel;
  weeklyVolume?: number;
  weeksActive?: number;
  currentVdot: number;
  currentVo2max?: number;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'M' | 'F';
  weight?: number;
  weightKg?: number;
  height?: number;
  heightCm?: number;
  trainingDays?: number;
  goal?: string;
  targetGoal?: string;
  targetRaceDistance?: string;
  targetDate?: string;
  injuries?: string;
  cadenceSpm?: number;
  verticalOscillationCm?: number;
  groundContactTimeMs?: number;
  strideLengthM?: number;
  isCalibrated?: boolean;
  calibrationSource?: string;
  shoes?: RunningShoe[];
  prRecords?: Partial<Record<DistanceType, number>>;
  history?: TestRecord[];
  pains?: PainReport[];
}

export interface RaceDistanceInfo {
  id: DistanceType;
  name: string;
  shortName: string;
  meters: number;
  category: 'track' | 'short_road' | 'long_road' | 'ultra';
}

export interface PaceZoneItem {
  key: 'E' | 'M' | 'T' | 'I' | 'R';
  name: string;
  subname: string;
  color: string;
  accentColor: string;
  description: string;
  descriptionSpeed?: string;
  hrPercentRange: string;
  hrBpmRange: [number, number];
  paceSecondsPerKm: number;
  paceMinSecondsPerKm: number;
  paceMaxSecondsPerKm: number;
  formattedPaceKm: string;
  formattedPaceMile: string;
  splits: {
    m200?: string;
    m300?: string;
    m400?: string;
    m600?: string;
    m800?: string;
    m1000?: string;
    m1200?: string;
    m1600?: string;
  };
  purpose: string;
}

export interface HeartRateZone {
  zone: number;
  name: string;
  pctRange: string;
  bpmMin: number;
  bpmMax: number;
  color: string;
  description: string;
  targetVdotZone: string;
}

export interface RacePrediction {
  distanceId: DistanceType;
  name: string;
  meters: number;
  predictedTimeSeconds: number;
  formattedTime: string;
  paceSecondsPerKm: number;
  formattedPaceKm: string;
  speedKmh: number;
  userPrSeconds?: number;
  deltaSeconds?: number;
}

export interface EnvironmentalAdjustment {
  temperatureC: number;
  humidityPct: number;
  altitudeMeters: number;
  paceAdjustmentPct: number;
  adjustedVdot: number;
}

export interface DailyWorkout {
  id: string;
  dayIndex: number;
  dayName: string;
  title: string;
  type: 'E' | 'M' | 'T' | 'I' | 'R' | 'REST' | 'TEST' | 'CROSS' | 'Easy' | 'Long Run' | 'Interval' | 'Threshold' | 'Repetition' | 'Rest';
  durationMinutes: number;
  totalKm: number;
  tss: number;
  intensity?: string;
  description?: string;
  warmup: string;
  mainBlock: string;
  cooldown: string;
  notes: string;
  completed: boolean;
  completedPace?: string;
  completedHr?: number;
  rpe?: number;
}

export interface TrainingWeek {
  weekNumber: number;
  phase: string;
  phaseCode: 'base' | 'threshold' | 'vo2max' | 'taper' | 'race';
  focus: string;
  totalKm: number;
  targetTss: number;
  ratioChange?: number;
  intensityLevel?: string;
  days: DailyWorkout[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  athleteName: string;
  vdot: number;
  targetGoal: '5k' | '10k' | '21k' | '42k' | 'base';
  weeklyFrequency: 3 | 4 | 5 | 6;
  createdAt: string;
  weeks: TrainingWeek[];
}

export interface DailyRecoveryCheckin {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  hrvMs: number;
  muscleSoreness: number;
  stressLevel: number;
  hydrationQuality: number;
  readinessScore: number;
  status: 'OPTIMAL' | 'MODERATE' | 'FATIGUE' | 'REST_REQUIRED';
  recommendation: string;
}

export interface ParsedWorkout {
  name: string;
  date: string;
  fileName: string;
  distanceKm: number;
  distanceMeters: number;
  durationSeconds: number;
  durationFormatted: string;
  paceSecondsPerKm: number;
  paceFormatted: string;
  avgHR: number | null;
  maxHR: number | null;
  avgCadence?: number | null;
  elevationGainMeters: number;
  vdot: number;
}

export interface MultiWorkoutTelemetrySummary {
  workouts: ParsedWorkout[];
  totalWorkouts: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  avgPaceSecondsPerKm: number;
  avgPaceFormatted: string;
  longestRunKm: number;
  bestVdot: number;
  bestVdotWorkout: ParsedWorkout | null;
  compositeVdot: number;
  maxHrOverall: number | null;
  avgHrOverall: number | null;
  avgCadenceOverall: number | null;
  totalElevationGainMeters: number;
  detectedWeeklyVolumeKm: number;
  detectedTrainingDays: number;
  detectedWeeksSpan: number;
  dateRange: { start: string; end: string };
  formatCounts: { gpx: number; tcx: number; fit: number };
}

export interface BrazilianRace {
  id: string;
  name: string;
  city: string;
  state: string;
  stateCode: string;
  date: string;
  distances: string[];
  elevationProfile: 'Plano' | 'Misto' | 'Técnico' | 'Montanhoso';
  elevationGainM: number;
  vdotOffset: number;
  tacticalAdvice: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export type ActivityType = 'run' | 'walk' | 'trail' | 'treadmill';
export type ActivitySource = 'manual' | 'google_fit' | 'health_connect' | 'gpx_import';

export interface RoutePoint {
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
  hr?: number;
  speed?: number;
  distanceFromStartM?: number;
}

export interface ActivitySplit {
  km: number;
  paceFormatted: string;
  paceSeconds: number;
  avgHr?: number;
  elevationDiffM?: number;
  durationSeconds: number;
}

export interface UserActivity {
  id: string;
  title: string;
  type: ActivityType;
  source: ActivitySource;
  sourceLabel?: string;
  date: string; // ISO format: e.g. "2026-09-19T07:15:00"
  distanceKm: number;
  distanceMeters: number;
  durationSeconds: number;
  durationFormatted: string;
  paceSecondsPerKm: number;
  paceFormatted: string;
  speedAvgKmh: number;
  speedMaxKmh?: number;
  avgHr?: number;
  maxHr?: number;
  calories?: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  cadenceSpm?: number;
  vdot?: number;
  notes?: string;
  shoeName?: string;
  route?: RoutePoint[];
  splits?: ActivitySplit[];
  syncId?: string;
  syncedAt?: string;
}

export interface ActivityFilter {
  type: 'all' | ActivityType;
  period: 'all' | 'week' | 'month' | 'year';
  source: 'all' | 'manual' | 'google_api';
  searchQuery: string;
}

export interface GoogleSyncState {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: string | null;
  serviceName: string;
  syncedCount: number;
  errorMessage?: string;
}

export interface CardPlacement {
  x: number; // px offset from center/base
  y: number; // px offset from default anchor
  scale: number; // 0.6 to 1.4 (default 1.0)
  visible: boolean;
  fontSizeScale?: number; // 0.7 to 1.5 (default 1.0) for fine-tuning text size
  transparentBackground?: boolean; // If true, card box background is removed (floating numbers)
  textColor?: string; // Custom primary text color override (e.g. '#FFFFFF', '#000000', '#FC4C02')
  labelColor?: string; // Custom secondary/label text color override
  textShadow?: boolean; // Enable text shadow for maximum readability over photos/maps
  textShadowStyle?: 'subtle' | 'strong' | 'outline' | 'glow'; // Type of shadow/glow
}

export interface CourseDataTableRow {
  id: string;
  enabled: boolean;
  label: string;
  value?: string;
  metricKey?: 'distance' | 'elevationGain' | 'minElevation' | 'maxElevation' | 'duration' | 'pace' | 'avgHr' | 'custom' | string;
  
  showLabel?: boolean;
  showValue?: boolean;

  labelColor?: string;
  labelOpacity?: number;
  labelFontSize?: number;
  labelFontWeight?: string;
  labelFontFamily?: string;
  labelLetterSpacing?: number;
  labelTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelXOffset?: number;
  labelYOffset?: number;
  labelRotation?: number;
  labelShadow?: boolean | { enabled: boolean; color?: string; blur?: number; offsetX?: number; offsetY?: number };
  labelShadowColor?: string;
  labelShadowBlur?: number;
  labelShadowOffsetX?: number;
  labelShadowOffsetY?: number;
  labelTypography?: TypographyConfig;

  valueColor?: string;
  valueOpacity?: number;
  valueFontSize?: number;
  valueFontWeight?: string;
  valueFontFamily?: string;
  valueLetterSpacing?: number;
  valueTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  valueOffsetX?: number;
  valueOffsetY?: number;
  valueXOffset?: number;
  valueYOffset?: number;
  valueRotation?: number;
  valueShadow?: boolean | { enabled: boolean; color?: string; blur?: number; offsetX?: number; offsetY?: number };
  valueShadowColor?: string;
  valueShadowBlur?: number;
  valueShadowOffsetX?: number;
  valueShadowOffsetY?: number;
  valueTypography?: TypographyConfig;
  
  fontSize?: number;
  fontWeight?: string;
  letterSpacing?: number;
  fontFamily?: string;
  rowHeight?: number;
}

export interface CourseDataPeakMarker {
  id: string;
  name: string;
  altitudeMeters: number;
  pctPosition: number; // 0 to 1
  triangleColor?: string;
  triangleSize?: number;
  textColor?: string;
  textOpacity?: number;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  letterSpacing?: number;
  offsetX?: number;
  offsetY?: number;
  xOffset?: number;
  yOffset?: number;
  rotation?: number;
  showTriangle: boolean;
  showLabel: boolean;
  textShadow?: boolean;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
  typography?: TypographyConfig;
}

export interface CourseDataFloatingText {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  xOffset?: number;
  yOffset?: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  fontWeight?: string;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
  fontFamily?: string;
  rotation?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  enabled?: boolean;
  typography?: TypographyConfig;
}

export interface CourseDataConfig {
  globalFont?: string;
  backgroundSource: 'photo' | 'map' | 'solid';
  solidBgColor: string;
  bwFilter: boolean;
  bwIntensity: number; // 0 to 100
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  blur: number; // 0 to 30
  overlayColor: string;
  overlayOpacity: number; // 0 to 100
  topGradient: { enabled: boolean; color: string; intensity: number; heightPct: number };
  bottomGradient: { enabled: boolean; color: string; intensity: number; heightPct: number };
  bgZoom: number;
  bgPanX: number;
  bgPanY: number;
  bgRotation: number;

  headerBar: {
    enabled: boolean;
    xOffsetPct?: number;
    heightPct: number;
    yOffsetPct: number;
    xPct?: number;
    yPct?: number;
    widthPct?: number;
    bgColor: string;
    bgOpacity: number;
    borderRadius: number;
    paddingX: number;
    paddingY: number;
    shadow: { color: string; blur: number; offsetY: number; opacity: number };
  };

  courseDataLabel: {
    enabled: boolean;
    text: string;
    xOffset: number;
    yOffset: number;
    fontSize: number;
    fontWeight: string;
    letterSpacing: number;
    lineHeight: number;
    color: string;
    opacity: number;
    align: 'left' | 'center' | 'right';
    textTransform: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
    fontFamily: string;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    shadow: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    stroke: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    rotation?: number;
    typography?: TypographyConfig;
  };

  activityName: {
    enabled: boolean;
    customText?: string;
    xOffset: number;
    yOffset: number;
    fontSize: number;
    fontWeight: string;
    letterSpacing: number;
    color: string;
    opacity?: number;
    align: 'left' | 'center' | 'right';
    textTransform: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
    fontFamily: string;
    italic?: boolean;
    shadow: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    rotation?: number;
    typography?: TypographyConfig;
  };

  dateText: {
    enabled: boolean;
    customText?: string;
    format: 'dd_mm_yyyy' | 'verbose' | 'month_year' | 'iso';
    xOffset: number;
    yOffset: number;
    fontSize: number;
    fontWeight: string;
    letterSpacing: number;
    color: string;
    opacity?: number;
    align: 'left' | 'center' | 'right';
    textTransform: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
    fontFamily?: string;
    italic?: boolean;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    rotation?: number;
    typography?: TypographyConfig;
  };

  dataTable: {
    enabled: boolean;
    xOffset: number;
    yOffset: number;
    widthPct: number;
    heightPx: number;
    bgColor: string;
    bgOpacity: number;
    borderRadius: number;
    shadow: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    showDividers?: boolean;
    dividerColor: string;
    dividerWidth: number;
    dividerOpacity: number;
    paddingX: number;
    paddingY?: number;
    rowSpacing: number;
    rows: CourseDataTableRow[];
    globalLabelColor?: string;
    globalValueColor?: string;
    globalFontSize?: number;
    globalFontFamily?: string;
  };

  elevationFooter: {
    enabled: boolean;
    xOffsetPct?: number;
    heightPct: number;
    yOffsetPct: number;
    xPct?: number;
    yPct?: number;
    widthPct?: number;
    bgColor: string;
    bgOpacity: number;
    borderRadius: number;
    shadow: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    paddingX?: number;
    paddingY?: number;

    athleteLabel?: string;
    athleteLabelText?: string;
    athleteLabelEnabled?: boolean;
    showAthleteLabel?: boolean;
    athleteLabelColor?: string;
    athleteColor?: string;
    athleteOpacity?: number;
    athleteLabelFontSize?: number;
    athleteFontSize?: number;
    athleteLabelFontWeight?: string;
    athleteLabelFontFamily?: string;
    athleteFontFamily?: string;
    athleteLabelLetterSpacing?: number;
    athleteLetterSpacing?: number;
    athleteLabelOffsetX?: number;
    athleteLabelOffsetY?: number;
    athleteXOffset?: number;
    athleteYOffset?: number;
    athleteRotation?: number;
    athleteShadow?: boolean;
    athleteShadowColor?: string;
    athleteShadowBlur?: number;
    athleteShadowOffsetX?: number;
    athleteShadowOffsetY?: number;
    athleteTextTransform?: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
    athleteLabelTypography?: TypographyConfig;

    titleText?: string;
    titleEnabled?: boolean;
    showTitle?: boolean;
    titleColor?: string;
    titleOpacity?: number;
    titleFontSize?: number;
    titleFontWeight?: string;
    titleFontFamily?: string;
    titleLetterSpacing?: number;
    titleOffsetX?: number;
    titleOffsetY?: number;
    titleXOffset?: number;
    titleYOffset?: number;
    titleRotation?: number;
    titleShadow?: boolean;
    titleShadowColor?: string;
    titleShadowBlur?: number;
    titleShadowOffsetX?: number;
    titleShadowOffsetY?: number;
    titleTextTransform?: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
    titleTypography?: TypographyConfig;

    showMinMaxLabels?: boolean;
    minMaxColor?: string;
    minMaxOpacity?: number;
    minMaxFontSize?: number;
    minMaxFontWeight?: string;
    minMaxFontFamily?: string;
    minMaxLetterSpacing?: number;
    minMaxOffsetX?: number;
    minMaxOffsetY?: number;
    minMaxShadow?: boolean | { enabled: boolean; color?: string; blur?: number; offsetX?: number; offsetY?: number };
    minMaxShadowColor?: string;
    minMaxShadowBlur?: number;
    minMaxShadowOffsetX?: number;
    minMaxShadowOffsetY?: number;
    customMinLabel?: string;
    customMaxLabel?: string;
    minMaxTypography?: TypographyConfig;

    fillMode: 'gradient' | 'solid' | 'lineOnly';
    fillColorTop: string;
    fillColorBottom: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWidth: number;
    smoothing: boolean;
    verticalScale: number;
  };

  peakMarkers: {
    enabled: boolean;
    markers: CourseDataPeakMarker[];
  };

  optionalMap: {
    enabled: boolean;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPx: number;
    borderRadius: number;
    opacity: number;
    mapStyle: 'dark' | 'light' | 'satellite' | 'terrain';
    routeColor: string;
    routeWidth: number;
    showStartFinishPins: boolean;
    zoom: number;
    panX: number;
    panY: number;
  };

  floatingTexts: CourseDataFloatingText[];
}

// ============================================================================
// TEMPLATE 2 — STRAVA APP SPECIFIC TYPES
// ============================================================================

export interface StravaAppBackgroundConfig {
  type: 'photo' | 'map' | 'solid';
  solidColor: string;
  customPhotoUrl?: string | null;
  filter: 'none' | 'grayscale' | 'sepia';
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  exposure: number;   // -100 to 100
  blur: number;       // 0 to 30px
  overlayColor: string;
  overlayOpacity: number; // 0 to 100%
  gradientTop: boolean;
  gradientTopColor: string;
  gradientTopHeightPct: number;
  gradientTopOpacity: number;
  gradientBottom: boolean;
  gradientBottomColor: string;
  gradientBottomHeightPct: number;
  gradientBottomOpacity: number;
  zoom: number;       // 0.5 to 3.0
  panX: number;       // -500 to 500
  panY: number;       // -500 to 500
  rotation: number;   // -45 to 45 deg
}

export interface TypographyConfig {
  fontFamily: string; // 'inherit' | 'Inter' | 'Space Grotesk' | 'JetBrains Mono' | 'Roboto' | 'Montserrat' | 'Oswald' | 'Bebas Neue' | 'Poppins' | 'Playfair Display' | 'System' | custom
  fontSize: number;   // size in px relative to 1080x1920 canvas
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  strikethrough: boolean;
  letterSpacing: number; // in px (-10 to 30)
  lineHeight: number;    // relative multiplier (0.8 to 2.5)
  wordSpacing: number;   // in px (-10 to 30)
  textAlign: 'left' | 'center' | 'right';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  offsetX: number;       // relative offset in px
  offsetY: number;       // relative offset in px
  rotation: number;      // in degrees (-180 to 180)
  color: string;         // hex / rgba
  opacity: number;       // 0 to 100
  gradientEnabled: boolean;
  gradientEndColor: string;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  bgBoxEnabled: boolean;
  bgBoxColor: string;
  bgBoxOpacity: number;
  bgBoxRadius: number;
  bgBoxPadding: number;
}

export interface StravaAppTopCardConfig {
  enabled: boolean;
  xPct: number;       // e.g. 5%
  yPct: number;       // e.g. 14%
  widthPct: number;   // e.g. 50%
  heightPct: number;  // e.g. 24%
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  borderColor?: string;
  borderWidth?: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  padding: number;
  linesOrder: ('brand' | 'activityType' | 'location' | 'date' | 'time')[];

  brand: {
    enabled: boolean;
    iconEnabled: boolean;
    iconType: 'strava' | 'run' | 'bolt' | 'flame' | 'trophy' | 'custom' | string;
    customIconUrl?: string;
    iconSize: number;
    iconColor: string;
    iconOffsetX?: number;
    iconOffsetY?: number;
    text: string;
    textEnabled: boolean;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | 'black' | string;
    letterSpacing: number;
    textColor: string;
    offsetX?: number;
    offsetY: number;
    typography?: TypographyConfig;
  };

  activityType: {
    enabled: boolean;
    text: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | 'black' | string;
    letterSpacing: number;
    textColor: string;
    opacity: number;
    textTransform: 'uppercase' | 'capitalize' | 'none';
    fontFamily: 'sans' | 'display' | 'mono' | string;
    align: 'left' | 'center' | 'right';
    offsetX?: number;
    offsetY: number;
    typography?: TypographyConfig;
  };

  location: {
    enabled: boolean;
    text: string;
    iconEnabled: boolean;
    iconType: 'pin' | 'globe' | 'compass' | string;
    iconSize: number;
    iconColor: string;
    iconOffsetX?: number;
    iconOffsetY?: number;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | string;
    letterSpacing: number;
    textColor: string;
    offsetX?: number;
    offsetY: number;
    typography?: TypographyConfig;
  };

  date: {
    enabled: boolean;
    text: string;
    format: 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'long' | 'custom' | string;
    iconEnabled: boolean;
    iconType: 'calendar' | 'clock' | string;
    iconSize: number;
    iconColor: string;
    iconOffsetX?: number;
    iconOffsetY?: number;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | string;
    letterSpacing: number;
    textColor: string;
    offsetX?: number;
    offsetY: number;
    typography?: TypographyConfig;
  };

  time: {
    enabled: boolean;
    text: string;
    format: '24h' | '12h' | 'custom' | string;
    iconEnabled: boolean;
    iconType: 'clock' | 'sun' | string;
    iconSize: number;
    iconColor: string;
    iconOffsetX?: number;
    iconOffsetY?: number;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | string;
    letterSpacing: number;
    textColor: string;
    offsetX?: number;
    offsetY: number;
    typography?: TypographyConfig;
  };
}

export interface StravaAppMapPanelConfig {
  enabled: boolean;
  xPct: number;       // e.g. 58%
  yPct: number;       // e.g. 14%
  widthPct: number;   // e.g. 37%
  heightPct: number;  // e.g. 38%
  borderRadius: number;
  opacity: number;
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  mapStyle: 'light' | 'dark' | 'satellite' | 'minimal';
  routeColor: string; // #FC4C02
  routeWidth: number;
  routeHaloColor: string;
  routeHaloWidth: number;
  smoothing: boolean;
  showStartPin: boolean;
  showFinishPin: boolean;
  pinStyle: 'circle' | 'pin' | 'flag';
  startPinColor: string;
  finishPinColor: string;
  pinSize: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface StravaAppMetricCardItem {
  id: string;
  enabled: boolean;
  cardBgColor?: string;
  cardBgOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  offsetX?: number;
  offsetY?: number;
  padding?: number;

  iconEnabled: boolean;
  iconType: 'stopwatch' | 'pin' | 'mountain' | 'heart' | 'flame' | 'gauge' | 'zap' | 'arrow' | 'clock' | 'sun' | 'run' | 'sparkles' | 'trophy' | 'custom' | string;
  iconColor: string;
  iconSize: number;
  iconOffsetX?: number;
  iconOffsetY?: number;

  label: string;
  labelEnabled: boolean;
  labelColor: string;
  labelFontSize: number;
  labelFontWeight: 'normal' | 'bold' | 'black' | string;
  labelTransform: 'uppercase' | 'none' | 'capitalize' | string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelTypography?: TypographyConfig;

  value: string; // If empty, dynamically computed
  valueEnabled: boolean;
  valueColor: string;
  valueFontSize: number;
  valueFontWeight: 'bold' | 'black' | 'normal' | string;
  valueOffsetX?: number;
  valueOffsetY?: number;
  valueTypography?: TypographyConfig;

  unit: string;
  unitEnabled: boolean;
  unitColor: string;
  unitFontSize: number;
  unitOffsetX?: number;
  unitOffsetY?: number;
  unitGap?: number;
  unitTypography?: TypographyConfig;

  textAlign: 'left' | 'center' | 'right';
  autoField: 'duration' | 'distance' | 'elevation' | 'pace' | 'hr' | 'calories' | 'custom';
}

export interface StravaAppMetricsRowConfig {
  enabled: boolean;
  xPct: number;       // e.g. 5%
  yPct: number;       // e.g. 56%
  widthPct: number;   // e.g. 90%
  gap: number;
  cardHeight: number;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  borderColor?: string;
  borderWidth?: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity: number;
  padding: number;
  cards: StravaAppMetricCardItem[];
}

export interface StravaAppElevationChartConfig {
  enabled: boolean;
  xPct: number;       // e.g. 5%
  yPct: number;       // e.g. 74%
  widthPct: number;   // e.g. 90%
  heightPct: number;  // e.g. 10%
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  borderColor?: string;
  borderWidth?: number;
  shadow: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  lineColor: string;  // #FC4C02
  lineWidth: number;
  smoothing: boolean;
  fillEnabled: boolean;
  fillTopColor: string;
  fillBottomColor: string;
  fillOpacity: number;
  guidelinesEnabled: boolean;
  guidelineColor: string;
  guidelineWidth: number;
  guidelineOpacity: number;
  yAxisEnabled: boolean;
  yAxisColor: string;
  yAxisFontSize: number;
  yAxisMarksCount: number;
  yAxisOffsetX?: number;
  yAxisOffsetY?: number;
  yAxisTypography?: TypographyConfig;
  verticalScale: number;
  horizontalStretch: number;
}

export interface StravaAppFloatingElement {
  id: string;
  type: 'text' | 'shape';
  text?: string;
  xPct: number;
  yPct: number;
  fontSize?: number;
  color?: string;
  shapeType?: 'line' | 'rect' | 'circle';
  widthPx?: number;
  heightPx?: number;
  typography?: TypographyConfig;
}

export interface StravaAppConfig {
  background: StravaAppBackgroundConfig;
  topCard: StravaAppTopCardConfig;
  mapPanel: StravaAppMapPanelConfig;
  metricsRow: StravaAppMetricsRowConfig;
  elevationChart: StravaAppElevationChartConfig;
  floatingElements: StravaAppFloatingElement[];
  accentColor: string;
  secondaryColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  cardBgColor: string;
  globalFont: 'sans' | 'display' | 'mono';
  baseFontSize: number;
  globalTypography?: {
    fontFamily: string;
    fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    baseScale: number;
    letterSpacing: number;
    color: string;
    primaryFont?: string;
    scaleMultiplier?: number;
  };
  customFonts?: Array<{ name: string; url: string }>;
}

export interface RunEditorialTopLocationConfig {
  enabled: boolean;
  text: string;
  xPct: number; // e.g. 92% (right-aligned)
  yPct: number; // e.g. 5%
  iconEnabled: boolean;
  iconType: 'pin' | 'navigation' | 'map' | 'globe';
  iconColor: string;
  iconSize: number;
  typography: TypographyConfig;
}

export interface RunEditorialMainTitleConfig {
  enabled: boolean;
  text: string; // e.g. 'RUN', 'WALK' or custom
  xPct: number; // e.g. 92%
  yPct: number; // e.g. 15%
  typography: TypographyConfig;
}

export interface RunEditorialSubtitleConfig {
  enabled: boolean;
  text: string; // e.g. 'at your own pace'
  xPct: number; // e.g. 92%
  yPct: number; // e.g. 21%
  typography: TypographyConfig;
}

export interface RunEditorialDateTimeConfig {
  enabled: boolean;
  dateEnabled: boolean;
  timeEnabled: boolean;
  separatorEnabled: boolean;
  dateText: string;
  timeText: string;
  separatorText: string; // e.g. '|'
  separatorColor: string;
  xPct: number; // e.g. 92%
  yPct: number; // e.g. 24.5%
  dateTypography: TypographyConfig;
  timeTypography: TypographyConfig;
  separatorTypography: TypographyConfig;
}

export interface RunEditorialUserQuoteConfig {
  enabled: boolean;
  text: string; // e.g. 'DAILY RUN TELEMETRY' or custom quote
  xPct: number; // e.g. 92%
  yPct: number; // e.g. 27.5%
  maxWidthPct: number; // e.g. 50%
  typography: TypographyConfig;
}

export interface RunEditorialDecorativeDotsConfig {
  enabled: boolean;
  style: 'dots' | 'line' | 'diamonds' | 'dash';
  count: number; // default 3
  size: number; // default 6
  spacing: number; // default 14
  color: string;
  opacity: number;
  xPct: number; // e.g. 92%
  yPct: number; // e.g. 30%
}

export interface RunEditorialMetricItem {
  id: string;
  enabled: boolean;
  iconEnabled: boolean;
  iconType: 'sparkles' | 'zap' | 'stopwatch' | 'mountain' | 'heart' | 'flame' | 'gauge';
  iconColor: string;
  iconSize: number;
  label: string;
  labelEnabled: boolean;
  labelTypography: TypographyConfig;
  value: string;
  valueEnabled: boolean;
  valueTypography: TypographyConfig;
  unit: string;
  unitEnabled: boolean;
  unitTypography: TypographyConfig;
  autoField: 'distance' | 'pace' | 'duration' | 'elevation' | 'hr' | 'calories' | 'custom';
}

export interface RunEditorialMetricsFooterConfig {
  enabled: boolean;
  layout: 'vertical' | 'horizontal'; // stacked vs side-by-side
  xPct: number; // e.g. 6%
  yPct: number; // e.g. 78%
  widthPct: number; // e.g. 45%
  gap: number; // spacing between metrics
  cardBgEnabled: boolean;
  cardBgColor: string;
  cardBgOpacity: number;
  cardBorderRadius: number;
  padding: number;
  items: RunEditorialMetricItem[];
}

export interface RunEditorialRouteIconConfig {
  enabled: boolean;
  mode: 'route' | 'icon' | 'custom_image';
  xPct: number; // e.g. 88%
  yPct: number; // e.g. 82%
  size: number; // default 180px
  strokeColor: string;
  strokeWidth: number;
  fillEnabled: boolean;
  fillColor: string;
  fillOpacity: number;
  glowEnabled: boolean;
  glowColor: string;
  glowBlur: number;
  rotation: number;
  bgBoxEnabled: boolean;
  bgBoxColor: string;
  bgBoxOpacity: number;
  bgBoxBorderRadius: number;
  customImageUrl?: string;
  showStartFinishPoints: boolean;
}

export interface RunEditorialBottomStripConfig {
  enabled: boolean;
  xPct: number; // 0%
  yPct: number; // 96%
  heightPx: number; // 48px
  bgColor: string;
  bgOpacity: number;
  dateText: string;
  locationText: string;
  separatorText: string; // e.g. '•'
  dateTypography: TypographyConfig;
  locationTypography: TypographyConfig;
  separatorTypography: TypographyConfig;
}

export interface RunEditorialOptionalMapConfig {
  enabled: boolean; // default false
  xPct: number; // e.g. 50%
  yPct: number; // e.g. 50%
  widthPct: number; // e.g. 88%
  heightPct: number; // e.g. 40%
  borderRadius: number;
  opacity: number;
  mapStyle: 'dark' | 'light' | 'satellite' | 'minimal';
  routeColor: string;
  routeWidth: number;
  routeGlow: boolean;
  zoom: number;
  panX: number;
  panY: number;
}

export interface RunEditorialBackgroundConfig {
  type: 'photo' | 'solid' | 'map';
  solidColor: string;
  filterMode: 'normal' | 'grayscale' | 'sepia';
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  blur: number; // 0 to 20
  overlayColor: string;
  overlayOpacity: number; // 0 to 100
  topVignetteOpacity: number; // 0 to 100
  bottomVignetteOpacity: number; // 0 to 100
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface RunEditorialFloatingElement {
  id: string;
  type: 'text' | 'shape' | 'icon';
  text?: string;
  xPct: number;
  yPct: number;
  shapeType?: 'line' | 'rect' | 'circle' | 'divider';
  widthPx?: number;
  heightPx?: number;
  color?: string;
  opacity?: number;
  typography?: TypographyConfig;
}

export interface RunEditorialConfig {
  background: RunEditorialBackgroundConfig;
  topLocation: RunEditorialTopLocationConfig;
  mainTitle: RunEditorialMainTitleConfig;
  subtitle: RunEditorialSubtitleConfig;
  dateTime: RunEditorialDateTimeConfig;
  userQuote: RunEditorialUserQuoteConfig;
  decorativeDots: RunEditorialDecorativeDotsConfig;
  metricsFooter: RunEditorialMetricsFooterConfig;
  routeIcon: RunEditorialRouteIconConfig;
  bottomStrip: RunEditorialBottomStripConfig;
  optionalMap: RunEditorialOptionalMapConfig;
  floatingElements: RunEditorialFloatingElement[];
  accentColor: string;
  textColor: string;
  secondaryTextColor: string;
  globalFont: 'sans' | 'display' | 'mono';
  globalTypography?: {
    fontFamily: string;
    fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    baseScale: number;
    letterSpacing: number;
    color: string;
    primaryFont?: string;
    scaleMultiplier?: number;
  };
}

// ==========================================
// TEMPLATE 4: EN ROUTE - ADVANCED CONFIG TYPES
// ==========================================

export interface EnRouteBackgroundConfig {
  type: 'photo' | 'solid' | 'map';
  solidColor: string;
  filterMode: 'normal' | 'grayscale' | 'sepia';
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  blur: number; // 0 to 30
  overlayColor: string;
  overlayOpacity: number; // 0 to 100
  gradientTop: boolean;
  gradientTopColor: string;
  gradientTopHeightPct: number;
  gradientTopOpacity: number;
  gradientBottom: boolean;
  gradientBottomColor: string;
  gradientBottomHeightPct: number;
  gradientBottomOpacity: number;
  zoom: number; // 0.5 to 3.0
  panX: number; // in px
  panY: number; // in px
  rotation: number; // -45 to 45
}

export interface EnRouteMainTitleConfig {
  enabled: boolean;
  text: string;
  xPct: number; // e.g. 50%
  yPct: number; // e.g. 9%
  textAlign: 'center' | 'left' | 'right';
  rotation: number;
  typography: TypographyConfig;
}

export interface EnRouteSubtitleConfig {
  enabled: boolean;
  text: string;
  separator: string; // e.g. " - "
  xPct: number; // e.g. 50%
  yPct: number; // e.g. 13%
  textAlign: 'center' | 'left' | 'right';
  typography: TypographyConfig;
  separatorTypography?: TypographyConfig;
}

export interface EnRouteMapConfig {
  enabled: boolean;
  xPct: number; // e.g. 50%
  yPct: number; // e.g. 45%
  widthPct: number; // e.g. 88%
  heightPct: number; // e.g. 51%
  borderRadius: number; // e.g. 20px
  opacity: number; // 0 to 100
  bgColor: string; // e.g. #F8FAFC
  borderColor: string;
  borderWidth: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
  mapStyle: 'light' | 'dark' | 'satellite' | 'minimal';
  routeColor: string; // e.g. #1565C0 (vibrant blue)
  routeWidth: number; // e.g. 7px
  routeOutlineColor: string; // e.g. #FFFFFF
  routeOutlineWidth: number; // e.g. 2px
  routeGlow: boolean;
  routeSmoothing: boolean;
  routeFillUnder: boolean;
  routeFillColor: string;
  routeFillOpacity: number;
  showStartMarker: boolean;
  showFinishMarker: boolean;
  markerStyle: 'circle' | 'pin' | 'flag';
  startMarkerColor: string;
  finishMarkerColor: string;
  markerSize: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface EnRouteWaypointMarker {
  id: string;
  enabled: boolean;
  label: string; // e.g. "BATUSANGKAR", "LARGADA", "CHEGADA", "MIRANTE"
  sublabel?: string; // e.g. "ALT 1.240m" or "KM 14"
  locationRatio: number; // 0 to 1 along the route (0 = start, 0.5 = midpoint, 1 = end)
  manualCoord?: { xPct: number; yPct: number }; // override inside map
  iconType: 'pin' | 'circle' | 'flag' | 'mountain' | 'camera' | 'water' | 'star';
  iconColor: string;
  iconSize: number;
  badgeBgColor: string;
  badgeBgOpacity: number;
  badgeBorderRadius: number;
  badgePaddingX: number;
  badgePaddingY: number;
  connectorLine: boolean;
  connectorColor: string;
  connectorWidth: number;
  labelTypography: TypographyConfig;
  sublabelTypography: TypographyConfig;
}

export interface EnRouteFloatingBadge {
  id: string;
  enabled: boolean;
  text: string;
  icon: 'clock' | 'road' | 'chat' | 'pace' | 'heart' | 'mountain' | 'star' | 'none';
  iconColor: string;
  iconSize: number;
  xPct: number; // 0 to 100%
  yPct: number; // 0 to 100%
  autoWidth: boolean;
  widthPx: number;
  heightPx: number;
  paddingX: number;
  paddingY: number;
  bgColor: string; // e.g. #FFFFFF
  bgOpacity: number; // e.g. 95%
  borderRadius: number; // e.g. 14px
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
  borderEnabled: boolean;
  borderColor: string;
  borderWidth: number;
  rotation: number;
  locked: boolean;
  typography: TypographyConfig;
}

export interface EnRouteCreditsConfig {
  enabled: boolean;
  creditsText: string; // e.g. "Instagram | Google Maps"
  separator: string; // e.g. " | "
  athleteName: string; // e.g. "@atleta"
  xPct: number; // e.g. 50%
  yPct: number; // e.g. 93%
  textAlign: 'center' | 'left' | 'right';
  creditsTypography: TypographyConfig;
  separatorTypography?: TypographyConfig;
  athleteTypography: TypographyConfig;
  bgBoxEnabled: boolean;
  bgBoxColor: string;
  bgBoxOpacity: number;
  bgBoxRadius: number;
  bgBoxPaddingX: number;
  bgBoxPaddingY: number;
}

export interface EnRouteFloatingElement {
  id: string;
  type: 'text' | 'shape' | 'icon';
  text?: string;
  xPct: number;
  yPct: number;
  shapeType?: 'line' | 'rect' | 'circle' | 'divider';
  widthPx?: number;
  heightPx?: number;
  color?: string;
  opacity?: number;
  typography?: TypographyConfig;
}

export interface EnRouteConfig {
  background: EnRouteBackgroundConfig;
  mainTitle: EnRouteMainTitleConfig;
  subtitle: EnRouteSubtitleConfig;
  map: EnRouteMapConfig;
  waypoints: EnRouteWaypointMarker[];
  badges: EnRouteFloatingBadge[];
  credits: EnRouteCreditsConfig;
  floatingElements: EnRouteFloatingElement[];
  accentColor: string; // #1565C0
  secondaryColor: string; // #0D47A1
  textPrimaryColor: string; // #FFFFFF
  textSecondaryColor: string; // #E2E8F0
  badgeBgColor: string; // #FFFFFF
  globalFont: 'sans' | 'display' | 'mono';
  globalTypography?: {
    fontFamily: string;
    fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    baseScale: number;
    letterSpacing: number;
    color: string;
    primaryFont?: string;
  };
}

export type StoryTemplateId = 0 | 1 | 2 | 3 | 4 | 5;

// ============================================================================
// TEMPLATE 5 — RACE COURSE MAP SPECIFIC TYPES
// ============================================================================

export interface RaceCourseMapBackgroundConfig {
  source: 'map' | 'photo' | 'solid';
  solidBgColor: string;
  mapBgDarkColor: string;
  mapStreetsColor: string;
  mapWaterColor: string;
  mapDetailLevel: 'low' | 'medium' | 'high';
  customPhotoUrl?: string | null;
  filter: 'none' | 'grayscale' | 'sepia';
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  blur: number;
  overlayColor: string;
  overlayOpacity: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface RaceCourseMapTitlePartConfig {
  text: string;
  enabled: boolean;
  typography: TypographyConfig;
}

export interface RaceCourseMapTitleConfig {
  enabled: boolean;
  xOffset: number;
  yOffset: number;
  align: 'left' | 'center' | 'right';
  part1: RaceCourseMapTitlePartConfig;
  part2: RaceCourseMapTitlePartConfig;
  registeredSymbol: RaceCourseMapTitlePartConfig;
  showTopBanner: boolean;
  topBannerColor: string;
  topBannerOpacity: number;
  topBannerHeightPx: number;
}

export interface RaceCourseMapRouteConfig {
  enabled: boolean;
  color: string;
  width: number;
  haloColor: string;
  haloWidth: number;
  smoothCurves: boolean;
  showDirectionArrows: boolean;
  arrowsCount: number;
  arrowsSize: number;
  arrowsSpacing: number;
  arrowsColor: string;
  showOuterGlow: boolean;
  outerGlowColor: string;
  outerGlowBlur: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface RaceCourseMapAidStation {
  id: string;
  name: string;
  symbolOrNumber: string;
  pctAlongRoute: number;
  iconType: 'circle' | 'square' | 'triangle' | 'flag' | 'drop' | 'bolt' | 'star';
  iconColor: string;
  iconSize: number;
  textColor: string;
  showLabel: boolean;
  labelTypography: TypographyConfig;
  xOffset: number;
  yOffset: number;
  enabled: boolean;
}

export interface RaceCourseMapMarkersConfig {
  showStartFinish: boolean;
  startFinishName: string;
  startFinishIcon: 'circle' | 'flag' | 'pin' | 'star';
  startFinishColor: string;
  startFinishSize: number;
  startFinishLabelTypography: TypographyConfig;
  aidStations: RaceCourseMapAidStation[];
}

export interface RaceCourseMapStreetName {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  rotation: number;
  locked: boolean;
  enabled: boolean;
  typography: TypographyConfig;
}

export interface RaceCourseMapNorthCompassConfig {
  enabled: boolean;
  xPct: number;
  yPct: number;
  size: number;
  circleBgColor: string;
  circleBorderColor: string;
  iconType: 'circle_N' | 'compass_rose' | 'arrow_N' | 'minimal_N';
  letterNColor: string;
  letterNTypography: TypographyConfig;
}

export interface RaceCourseMapLegendItem {
  id: string;
  enabled: boolean;
  iconType: 'route' | 'flag' | 'circle_num' | 'stop' | 'clock' | 'warning' | 'star' | 'info' | 'custom';
  iconUrl?: string;
  iconColor: string;
  iconSize: number;
  showIcon: boolean;
  text: string;
  showText: boolean;
  isWarning: boolean;
  warningIconColor: string;
  typography: TypographyConfig;
}

export interface RaceCourseMapSideLegendConfig {
  enabled: boolean;
  xPct: number;
  yPct: number;
  widthPct: number;
  verticalGap: number;
  iconTextGap: number;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  padding: number;
  borderColor: string;
  borderWidth: number;
  items: RaceCourseMapLegendItem[];
}

export interface RaceCourseMapFooterConfig {
  enabled: boolean;
  teamOrBrandName: RaceCourseMapTitlePartConfig;
  slogan: RaceCourseMapTitlePartConfig;
  patternIcon: {
    enabled: boolean;
    type: 'bars' | 'stripes' | 'dots' | 'trophy' | 'bolt' | 'flag';
    size: number;
    color: string;
  };
  xOffset: number;
  yOffset: number;
  align: 'left' | 'center' | 'right';
  showBottomBanner: boolean;
  bottomBannerColor: string;
  bottomBannerOpacity: number;
  bottomBannerHeightPx: number;
}

export interface RaceCourseMapMetricCardItem {
  id: string;
  enabled: boolean;
  metricKey: 'distance' | 'duration' | 'pace' | 'elevationGain' | 'avgHr' | 'calories' | 'custom';
  label: string;
  value: string;
  unit?: string;
  
  // Card Container
  xPct: number;
  yPct: number;
  widthPx: number;
  heightPx: number;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  paddingX: number;
  paddingY: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;

  // Icon
  showIcon: boolean;
  iconType: string;
  iconColor: string;
  iconSize: number;

  // Label (Text)
  showLabel: boolean;
  labelTypography: TypographyConfig;

  // Value (Number)
  showValue: boolean;
  valueTypography: TypographyConfig;
}

export interface RaceCourseMapMetricsPanelConfig {
  enabled: boolean;
  layout: 'floating_cards' | 'bottom_bar' | 'top_bar' | 'grid';
  xPct: number;
  yPct: number;
  gap: number;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  cards: RaceCourseMapMetricCardItem[];
}

export interface RaceCourseMapConfig {
  globalFont?: string;
  globalBaseFontSize?: number;
  globalBaseFontWeight?: string;
  globalBaseLetterSpacing?: number;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  darkBgColor: string;
  background: RaceCourseMapBackgroundConfig;
  title: RaceCourseMapTitleConfig;
  route: RaceCourseMapRouteConfig;
  markers: RaceCourseMapMarkersConfig;
  streetNames: RaceCourseMapStreetName[];
  northCompass: RaceCourseMapNorthCompassConfig;
  sideLegend: RaceCourseMapSideLegendConfig;
  footer: RaceCourseMapFooterConfig;
  metricsPanel?: RaceCourseMapMetricsPanelConfig;
  floatingTexts: CourseDataFloatingText[];
  floatingIcons: Array<{
    id: string;
    iconType: string;
    xPct: number;
    yPct: number;
    size: number;
    color: string;
    rotation: number;
    enabled: boolean;
  }>;
}

export interface StoryConfig {
  templateId?: StoryTemplateId; // 0: Padrão Atual, 1: Course Data, 2: Strava App, 3: Run Editorial, 4: En Route, 5: Race Course Map
  templateSettings?: Partial<Record<StoryTemplateId, Partial<StoryConfig>>>;
  courseData?: CourseDataConfig; // Total customization for Template 1: Course Data
  stravaApp?: StravaAppConfig;   // Total customization for Template 2: Strava App
  runEditorial?: RunEditorialConfig; // Total customization for Template 3: Run Editorial
  enRoute?: EnRouteConfig; // Total customization for Template 4: En Route
  raceCourseMap?: RaceCourseMapConfig; // Total customization for Template 5: Race Course Map
  theme: 'dark_obsidian' | 'minimalist' | 'neon_runner' | 'sunset_gold' | 'clean_white' | 'athletic_carbon';
  accentColor: string;
  fontStyle: 'sans' | 'mono' | 'display';
  mapStyle: 'dark' | 'satellite' | 'terrain' | 'light' | 'none';
  hideMap: boolean;
  hideRoute: boolean;
  obfuscatePrivacyMeters: boolean; // 200m start & finish
  mapZoom: number; // 0.5 to 3.5 (default 1.0)
  mapPanX: number; // offset in px (-500 to 500)
  mapPanY: number; // offset in px (-500 to 500)
  mapRotation: number; // degrees (-180 to 180)
  
  // Individual Card Transformations
  headerCard: CardPlacement;
  primaryMetricsCard: CardPlacement;
  secondaryMetricsCard: CardPlacement;
  brandingBadge?: CardPlacement;

  // Global fallback offsets
  cardScale?: number;
  cardOffsetY?: number;
  cardOffsetX?: number;

  animationStyle: 'progressive' | 'complete' | 'loop';

  // Background Options (Map vs Personal Photo)
  backgroundType: 'map' | 'photo';
  customPhotoUrl?: string | null;
  photoZoom?: number; // 1.0 to 3.0 (default 1.0)
  photoPanX?: number; // offset in px (-500 to 500)
  photoPanY?: number; // offset in px (-500 to 500)
  photoBrightness?: number; // -50 to 50 (default 0)
  photoContrast?: number; // -50 to 50 (default 0)
  photoOverlayOpacity?: number; // 0 to 80 (default 25)
  photoOverlayTheme?: 'dark' | 'light';

  visibleMetrics: {
    distance: boolean;
    duration: boolean;
    pace: boolean;
    avgHr: boolean;
    calories: boolean;
    elevation: boolean;
    cadence: boolean;
    vdot: boolean;
    athleteName: boolean;
    date: boolean;
    splits: boolean;
  };
  exportFormat: 'video' | 'image';
  videoDurationSeconds: number;
  showSafeZones: boolean;
  customTitle?: string;
}

// Aliases for compatibility
export type AthleteProfile = RunnerState;
export type TestHistoryEntry = TestRecord;

