export type RunnerLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TestRecord {
  id: string;
  date: string;
  type: 'cooper' | '2400m' | 'vdot_direct';
  value: number; // meters for Cooper, seconds for 2400m, VDOT score for direct
  vo2max: number;
  vdot: number;
}

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

export interface RunnerState {
  macHR: number; // Max HR
  restHR: number; // Resting HR
  level: RunnerLevel;
  weeklyVolume: number; // in km
  weeksActive: number; // how many weeks they have been running (for beginner checking)
  currentVdot: number;
  currentVo2max: number;
  history: TestRecord[];
  pains?: PainReport[];
  
  // Extended profile fields
  age?: number;
  gender?: 'male' | 'female';
  weight?: number;
  trainingDays?: number;
  goal?: string;
  injuries?: string;
}

export interface PaceZone {
  key: 'E' | 'M' | 'T' | 'I' | 'R';
  name: string;
  description: string;
  descriptionSpeed: string;
  pctRange: string;
  paceStr: string;
  paceRangeStr: string;
  color: string;
}

export interface HRZone {
  zone: number;
  name: string;
  intensityRange: string;
  hrRangeStr: string;
  description: string;
  color: string;
}

export interface RacePrediction {
  name: string;
  distanceMeters: number;
  timeStr: string;
  paceStr: string;
  totalSeconds: number;
}

export interface DayWorkout {
  dayName: string; // e.g. "Segunda", "Terça", etc.
  type: 'Easy' | 'Long Run' | 'Interval' | 'Threshold' | 'Repetition' | 'Rest';
  title: string;
  distanceKm: number;
  intensity: string;
  description: string;
}

export interface WeekPlan {
  weekNum: number;
  periodLabel: string; // e.g., "Combustível Aeróbico", "Recuperação Ativa"
  totalVolumeKm: number;
  ratioChange: number; // Volume change percent compared to previous week
  intensityLevel: string; // Level label
  workouts: DayWorkout[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface CoachResponse {
  message: string;
}
