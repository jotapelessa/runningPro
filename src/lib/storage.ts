import { RunnerState, DailyRecoveryCheckin, TestRecord, TrainingPlan, UserActivity } from '../types';
import { generateEightWeekPlan } from './planGenerator';
import { generateRunWalkPlan } from './runWalkEngine';
import { loadUserActivities, saveUserActivities, resetUserActivities } from './activitiesStorage';


const STORAGE_KEY_RUNNER = 'pacelab_runner_state_v3.5';
const STORAGE_KEY_HISTORY = 'pacelab_test_history_v3.5';
const STORAGE_KEY_PLAN = 'pacelab_training_plan_v3.5';
const STORAGE_KEY_RECOVERY = 'pacelab_recovery_logs_v3.5';

export const DEFAULT_RUNNER_STATE: RunnerState = {
  name: 'Carlos Oliveira',
  age: 32,
  gender: 'M',
  weight: 70,
  height: 177,
  heightCm: 177,
  restingHr: 52,
  maxHr: 188,
  currentVdot: 47.5,
  currentVo2max: 47.5,
  cadenceSpm: 178,
  weeklyVolume: 45,
  targetRaceDistance: '10k',
  targetGoal: '10k',
  targetDate: '2026-11-20',
  injuries: 'Sem lesões ativas',
  isCalibrated: true,
  shoes: [
    { id: '1', name: 'Nike Pegasus 40', mileageKm: 320, maxMileageKm: 700, active: true },
    { id: '2', name: 'Asics Novablast 4', mileageKm: 150, maxMileageKm: 800, active: true },
    { id: '3', name: 'Vaporfly Next% 3', mileageKm: 42, maxMileageKm: 350, active: true }
  ],
  prRecords: {
    '5k': 1260, // 21:00
    '10k': 2640, // 44:00
    'half_marathon': 5880, // 1:38:00
    'marathon': 12600 // 3:30:00
  }
};

export const UNCALIBRATED_RUNNER_STATE: RunnerState = {
  name: 'Novo Corredor',
  age: 30,
  gender: 'M',
  weight: 70,
  height: 175,
  heightCm: 175,
  restingHr: 55,
  maxHr: 190,
  macHR: 190,
  restHR: 55,
  currentVdot: 0,
  currentVo2max: 0,
  cadenceSpm: 0,
  weeklyVolume: 0,
  weeksActive: 0,
  trainingDays: 4,
  targetRaceDistance: '10k',
  targetGoal: 'Calibração Fisiológica',
  injuries: '',
  isCalibrated: false,
  shoes: [],
  prRecords: {},
  history: [],
  pains: []
};

export const INITIAL_TEST_HISTORY: TestRecord[] = [
  {
    id: 'test-1',
    date: '2026-06-15',
    distanceId: '5k',
    distanceMeters: 5000,
    timeSeconds: 1380, // 23:00
    formattedTime: '23:00',
    vdot: 43.1,
    avgHr: 175,
    avgCadence: 172,
    location: 'Pista de Atletismo',
    notes: 'Primeiro teste de calibração da temporada.'
  },
  {
    id: 'test-2',
    date: '2026-07-28',
    distanceId: '10k',
    distanceMeters: 10000,
    timeSeconds: 2790, // 46:30
    formattedTime: '46:30',
    vdot: 44.8,
    avgHr: 178,
    avgCadence: 175,
    location: 'Circuito Parque Ibirapuera',
    notes: 'Melhora sensível no ritmo de limiar aeróbio.'
  },
  {
    id: 'test-3',
    date: '2026-09-02',
    distanceId: '5k',
    distanceMeters: 5000,
    timeSeconds: 1260, // 21:00
    formattedTime: '21:00',
    vdot: 47.5,
    avgHr: 182,
    avgCadence: 179,
    location: 'Prova Oficial Noturna 5k',
    notes: 'Recorde pessoal (PR) alcançado com split negativo.'
  }
];

export const INITIAL_RECOVERY_LOGS: DailyRecoveryCheckin[] = [
  {
    date: '2026-09-18',
    sleepHours: 7.5,
    sleepQuality: 4,
    hrvMs: 68,
    muscleSoreness: 2,
    stressLevel: 2,
    hydrationQuality: 5,
    readinessScore: 88,
    status: 'OPTIMAL',
    recommendation: 'Corpo plenamente recuperado e sistema autônomo equilibrado. Treino de qualidade liberado.'
  },
  {
    date: '2026-09-19',
    sleepHours: 8.0,
    sleepQuality: 5,
    hrvMs: 74,
    muscleSoreness: 1,
    stressLevel: 1,
    hydrationQuality: 5,
    readinessScore: 94,
    status: 'OPTIMAL',
    recommendation: 'Excelente prontidão neuromotora e alta variabilidade cardíaca (HRV). Perfeito para estímulos de alta intensidade.'
  }
];

export function loadRunnerState(): RunnerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RUNNER);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Se foi salvo explicitamente como não calibrado / zerado, preserva o estado zerado
      if (parsed.isCalibrated === false) {
        return { ...UNCALIBRATED_RUNNER_STATE, ...parsed };
      }
      return { ...DEFAULT_RUNNER_STATE, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load runner state:', e);
  }
  return DEFAULT_RUNNER_STATE;
}

export function saveRunnerState(state: RunnerState): void {
  try {
    localStorage.setItem(STORAGE_KEY_RUNNER, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save runner state:', e);
  }
}

// Aliases for compatibility
export const loadAthleteProfile = loadRunnerState;
export const saveAthleteProfile = saveRunnerState;

export function loadTestHistory(): TestRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load test history:', e);
  }
  return INITIAL_TEST_HISTORY;
}

export function saveTestHistory(history: TestRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save test history:', e);
  }
}

export function loadTrainingPlan(nameOrProfile: string | RunnerState = 'Carlos Oliveira', vdot: number = 47.5): TrainingPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load training plan:', e);
  }
  const runnerName = typeof nameOrProfile === 'string' ? nameOrProfile : nameOrProfile.name;
  const runnerVdot = typeof nameOrProfile === 'string' ? vdot : nameOrProfile.currentVdot;
  const isTransition = typeof nameOrProfile !== 'string' && (nameOrProfile.level === 'sedentary_transition' || nameOrProfile.activityProfile === 'sedentary');

  if (isTransition) {
    return generateRunWalkPlan(runnerName, typeof nameOrProfile !== 'string' ? (nameOrProfile.trainingDays || 3) : 3);
  }

  return generateEightWeekPlan(
    runnerName,
    runnerVdot,
    '10k',
    4
  );
}


export function saveTrainingPlan(plan: TrainingPlan): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error('Failed to save training plan:', e);
  }
}

export function loadRecoveryLogs(): DailyRecoveryCheckin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECOVERY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load recovery logs:', e);
  }
  return INITIAL_RECOVERY_LOGS;
}

export function saveRecoveryLogs(logs: DailyRecoveryCheckin[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECOVERY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save recovery logs:', e);
  }
}

export function resetAllAppData(): {
  runnerState: RunnerState;
  testHistory: TestRecord[];
  trainingPlan: TrainingPlan;
  recoveryLogs: DailyRecoveryCheckin[];
  activities: UserActivity[];
} {
  try {
    localStorage.removeItem(STORAGE_KEY_RUNNER);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_PLAN);
    localStorage.removeItem(STORAGE_KEY_RECOVERY);
    localStorage.removeItem('pacelab_completed_calendar_dates');
    resetUserActivities();
    
    // Save clean uncalibrated state
    saveRunnerState(UNCALIBRATED_RUNNER_STATE);
    saveTestHistory([]);
    saveRecoveryLogs([]);
    const cleanPlan = generateEightWeekPlan(
      UNCALIBRATED_RUNNER_STATE.name,
      35.0, // baseline placeholder until calibrated
      '10k',
      4
    );
    saveTrainingPlan(cleanPlan);
  } catch (e) {
    console.error('Failed to clear app data:', e);
  }

  return {
    runnerState: UNCALIBRATED_RUNNER_STATE,
    testHistory: [],
    trainingPlan: generateEightWeekPlan(UNCALIBRATED_RUNNER_STATE.name, 35.0, '10k', 4),
    recoveryLogs: [],
    activities: []
  };
}
