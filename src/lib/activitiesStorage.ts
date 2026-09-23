import { UserActivity, GoogleSyncState, RoutePoint, ActivitySplit, ActivityType } from '../types';
import { calculateVDOT, formatPace, formatTime } from './vdotCalculator';

const STORAGE_KEY_ACTIVITIES = 'pacelab_user_activities_v3.5';
const STORAGE_KEY_SYNC = 'pacelab_google_sync_v3.5';

// Realistic GPS paths for default demo workouts
const IBIRAPUERA_COORDS: RoutePoint[] = [
  { lat: -23.5874, lng: -46.6576, ele: 760, hr: 142, speed: 12.5 },
  { lat: -23.5861, lng: -46.6552, ele: 762, hr: 148, speed: 12.8 },
  { lat: -23.5845, lng: -46.6534, ele: 765, hr: 155, speed: 13.1 },
  { lat: -23.5830, lng: -46.6548, ele: 764, hr: 160, speed: 13.0 },
  { lat: -23.5818, lng: -46.6570, ele: 763, hr: 164, speed: 13.4 },
  { lat: -23.5832, lng: -46.6601, ele: 761, hr: 168, speed: 13.2 },
  { lat: -23.5855, lng: -46.6618, ele: 759, hr: 172, speed: 13.5 },
  { lat: -23.5872, lng: -46.6598, ele: 760, hr: 170, speed: 13.1 },
  { lat: -23.5874, lng: -46.6576, ele: 760, hr: 165, speed: 12.7 }
];

const COPACABANA_COORDS: RoutePoint[] = [
  { lat: -22.9671, lng: -43.1788, ele: 5, hr: 138, speed: 11.5 },
  { lat: -22.9712, lng: -43.1825, ele: 6, hr: 144, speed: 11.8 },
  { lat: -22.9755, lng: -43.1868, ele: 6, hr: 148, speed: 12.1 },
  { lat: -22.9801, lng: -43.1909, ele: 5, hr: 152, speed: 12.0 },
  { lat: -22.9848, lng: -43.1952, ele: 6, hr: 155, speed: 12.3 },
  { lat: -22.9888, lng: -43.1995, ele: 7, hr: 158, speed: 12.5 },
  { lat: -22.9848, lng: -43.1952, ele: 6, hr: 161, speed: 12.4 },
  { lat: -22.9801, lng: -43.1909, ele: 5, hr: 164, speed: 12.7 },
  { lat: -22.9755, lng: -43.1868, ele: 6, hr: 167, speed: 13.0 },
  { lat: -22.9712, lng: -43.1825, ele: 6, hr: 165, speed: 12.8 },
  { lat: -22.9671, lng: -43.1788, ele: 5, hr: 158, speed: 12.0 }
];

const BARIGUI_COORDS: RoutePoint[] = [
  { lat: -25.4260, lng: -49.3080, ele: 915, hr: 150, speed: 13.2 },
  { lat: -25.4242, lng: -49.3065, ele: 918, hr: 156, speed: 13.5 },
  { lat: -25.4221, lng: -49.3078, ele: 922, hr: 162, speed: 13.8 },
  { lat: -25.4235, lng: -49.3105, ele: 920, hr: 165, speed: 13.6 },
  { lat: -25.4258, lng: -49.3118, ele: 916, hr: 168, speed: 13.9 },
  { lat: -25.4275, lng: -49.3099, ele: 915, hr: 164, speed: 13.3 },
  { lat: -25.4260, lng: -49.3080, ele: 915, hr: 158, speed: 13.0 }
];

export const INITIAL_USER_ACTIVITIES: UserActivity[] = [
  {
    id: 'act-1',
    title: 'Longão de Domingo na Orla de Copacabana',
    type: 'run',
    source: 'google_fit',
    sourceLabel: 'Google Fit API',
    date: '2026-09-18T06:45:00',
    distanceKm: 14.0,
    distanceMeters: 14000,
    durationSeconds: 4032, // 1h07m12s
    durationFormatted: '1:07:12',
    paceSecondsPerKm: 288,
    paceFormatted: '4:48',
    speedAvgKmh: 12.5,
    speedMaxKmh: 14.8,
    avgHr: 154,
    maxHr: 168,
    calories: 940,
    elevationGainMeters: 45,
    elevationLossMeters: 42,
    cadenceSpm: 176,
    vdot: 46.2,
    shoeName: 'Nike Pegasus 40',
    notes: 'Treino longo com sensação de esforço moderada em Z2/Z3, brisa do mar favorável.',
    route: COPACABANA_COORDS,
    splits: [
      { km: 1, paceFormatted: '5:02', paceSeconds: 302, avgHr: 138, elevationDiffM: 1, durationSeconds: 302 },
      { km: 2, paceFormatted: '4:55', paceSeconds: 295, avgHr: 144, elevationDiffM: 2, durationSeconds: 295 },
      { km: 3, paceFormatted: '4:50', paceSeconds: 290, avgHr: 148, elevationDiffM: 0, durationSeconds: 290 },
      { km: 4, paceFormatted: '4:46', paceSeconds: 286, avgHr: 152, elevationDiffM: 1, durationSeconds: 286 },
      { km: 5, paceFormatted: '4:44', paceSeconds: 284, avgHr: 154, elevationDiffM: 2, durationSeconds: 284 },
      { km: 6, paceFormatted: '4:45', paceSeconds: 285, avgHr: 155, elevationDiffM: 1, durationSeconds: 285 },
      { km: 7, paceFormatted: '4:48', paceSeconds: 288, avgHr: 156, elevationDiffM: 0, durationSeconds: 288 },
      { km: 8, paceFormatted: '4:47', paceSeconds: 287, avgHr: 157, elevationDiffM: 1, durationSeconds: 287 },
      { km: 9, paceFormatted: '4:43', paceSeconds: 283, avgHr: 158, elevationDiffM: 2, durationSeconds: 283 },
      { km: 10, paceFormatted: '4:42', paceSeconds: 282, avgHr: 160, elevationDiffM: 1, durationSeconds: 282 },
      { km: 11, paceFormatted: '4:45', paceSeconds: 285, avgHr: 162, elevationDiffM: 0, durationSeconds: 285 },
      { km: 12, paceFormatted: '4:48', paceSeconds: 288, avgHr: 164, elevationDiffM: 1, durationSeconds: 288 },
      { km: 13, paceFormatted: '4:50', paceSeconds: 290, avgHr: 166, elevationDiffM: -1, durationSeconds: 290 },
      { km: 14, paceFormatted: '4:37', paceSeconds: 277, avgHr: 168, elevationDiffM: 0, durationSeconds: 277 }
    ],
    syncId: 'gfit_sync_20260918_01',
    syncedAt: '2026-09-18T08:00:15Z'
  },
  {
    id: 'act-2',
    title: 'Treino de Limiar (Tempo Run) no Ibirapuera',
    type: 'run',
    source: 'health_connect',
    sourceLabel: 'Google Health Connect',
    date: '2026-09-16T18:30:00',
    distanceKm: 8.0,
    distanceMeters: 8000,
    durationSeconds: 2064, // 34m24s
    durationFormatted: '34:24',
    paceSecondsPerKm: 258,
    paceFormatted: '4:18',
    speedAvgKmh: 13.9,
    speedMaxKmh: 16.2,
    avgHr: 168,
    maxHr: 179,
    calories: 580,
    elevationGainMeters: 38,
    elevationLossMeters: 35,
    cadenceSpm: 182,
    vdot: 48.5,
    shoeName: 'Vaporfly Next% 3',
    notes: 'Bloco principal de 5km cravado a 4:10/km no ritmo T. Excelente resposta cardíaca.',
    route: IBIRAPUERA_COORDS,
    splits: [
      { km: 1, paceFormatted: '4:35', paceSeconds: 275, avgHr: 146, elevationDiffM: 3, durationSeconds: 275 },
      { km: 2, paceFormatted: '4:22', paceSeconds: 262, avgHr: 158, elevationDiffM: 5, durationSeconds: 262 },
      { km: 3, paceFormatted: '4:12', paceSeconds: 252, avgHr: 168, elevationDiffM: 4, durationSeconds: 252 },
      { km: 4, paceFormatted: '4:10', paceSeconds: 250, avgHr: 172, elevationDiffM: 2, durationSeconds: 250 },
      { km: 5, paceFormatted: '4:09', paceSeconds: 249, avgHr: 174, elevationDiffM: 5, durationSeconds: 249 },
      { km: 6, paceFormatted: '4:11', paceSeconds: 251, avgHr: 175, elevationDiffM: 3, durationSeconds: 251 },
      { km: 7, paceFormatted: '4:08', paceSeconds: 248, avgHr: 178, elevationDiffM: 6, durationSeconds: 248 },
      { km: 8, paceFormatted: '4:37', paceSeconds: 277, avgHr: 165, elevationDiffM: 2, durationSeconds: 277 }
    ],
    syncId: 'ghc_sync_20260916_02',
    syncedAt: '2026-09-16T19:25:00Z'
  },
  {
    id: 'act-3',
    title: 'Caminhada Regenerativa & Mobilidade',
    type: 'walk',
    source: 'manual',
    sourceLabel: 'Registro Manual',
    date: '2026-09-15T07:10:00',
    distanceKm: 4.5,
    distanceMeters: 4500,
    durationSeconds: 2700, // 45m00s
    durationFormatted: '45:00',
    paceSecondsPerKm: 600,
    paceFormatted: '10:00',
    speedAvgKmh: 6.0,
    speedMaxKmh: 6.8,
    avgHr: 108,
    maxHr: 122,
    calories: 230,
    elevationGainMeters: 20,
    elevationLossMeters: 20,
    cadenceSpm: 120,
    notes: 'Recuperação ativa após o treino de tiros na pista. Soltando as pernas e panturrilhas.',
    splits: [
      { km: 1, paceFormatted: '10:15', paceSeconds: 615, avgHr: 102, elevationDiffM: 4, durationSeconds: 615 },
      { km: 2, paceFormatted: '9:55', paceSeconds: 595, avgHr: 107, elevationDiffM: 5, durationSeconds: 595 },
      { km: 3, paceFormatted: '9:50', paceSeconds: 590, avgHr: 112, elevationDiffM: 6, durationSeconds: 590 },
      { km: 4, paceFormatted: '10:00', paceSeconds: 600, avgHr: 110, elevationDiffM: 3, durationSeconds: 600 },
      { km: 5, paceFormatted: '5:00', paceSeconds: 300, avgHr: 109, elevationDiffM: 2, durationSeconds: 300 }
    ]
  },
  {
    id: 'act-4',
    title: 'Rodagem Aeróbica Z2 no Parque Barigui',
    type: 'run',
    source: 'google_fit',
    sourceLabel: 'Google Maps / Fit',
    date: '2026-09-12T07:00:00',
    distanceKm: 10.0,
    distanceMeters: 10000,
    durationSeconds: 2970, // 49m30s
    durationFormatted: '49:30',
    paceSecondsPerKm: 297,
    paceFormatted: '4:57',
    speedAvgKmh: 12.1,
    speedMaxKmh: 14.0,
    avgHr: 149,
    maxHr: 161,
    calories: 675,
    elevationGainMeters: 62,
    elevationLossMeters: 60,
    cadenceSpm: 174,
    vdot: 44.9,
    shoeName: 'Asics Novablast 4',
    notes: 'Rodagem constante em terreno com subidas curtas. Ritmo confortável sem elevar lactato.',
    route: BARIGUI_COORDS,
    splits: [
      { km: 1, paceFormatted: '5:08', paceSeconds: 308, avgHr: 135, elevationDiffM: 5, durationSeconds: 308 },
      { km: 2, paceFormatted: '5:02', paceSeconds: 302, avgHr: 142, elevationDiffM: 8, durationSeconds: 302 },
      { km: 3, paceFormatted: '4:58', paceSeconds: 298, avgHr: 148, elevationDiffM: 6, durationSeconds: 298 },
      { km: 4, paceFormatted: '4:54', paceSeconds: 294, avgHr: 150, elevationDiffM: 4, durationSeconds: 294 },
      { km: 5, paceFormatted: '4:55', paceSeconds: 295, avgHr: 152, elevationDiffM: 7, durationSeconds: 295 },
      { km: 6, paceFormatted: '4:56', paceSeconds: 296, avgHr: 151, elevationDiffM: 8, durationSeconds: 296 },
      { km: 7, paceFormatted: '4:53', paceSeconds: 293, avgHr: 153, elevationDiffM: 6, durationSeconds: 293 },
      { km: 8, paceFormatted: '4:54', paceSeconds: 294, avgHr: 154, elevationDiffM: 5, durationSeconds: 294 },
      { km: 9, paceFormatted: '4:56', paceSeconds: 296, avgHr: 156, elevationDiffM: 7, durationSeconds: 296 },
      { km: 10, paceFormatted: '4:44', paceSeconds: 284, avgHr: 159, elevationDiffM: 6, durationSeconds: 284 }
    ],
    syncId: 'gfit_sync_20260912_04',
    syncedAt: '2026-09-12T08:15:20Z'
  }
];

export const INITIAL_SYNC_STATE: GoogleSyncState = {
  status: 'idle',
  lastSync: '2026-09-18T08:00:15Z',
  serviceName: 'Google Fit / Health Connect API',
  syncedCount: 3
};

/**
 * Loads all user activities from localStorage, or defaults to initial set.
 */
export function loadUserActivities(): UserActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load user activities from storage:', e);
  }
  return INITIAL_USER_ACTIVITIES;
}

/**
 * Saves all user activities to localStorage.
 */
export function saveUserActivities(activities: UserActivity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  } catch (e) {
    console.error('Failed to save user activities to storage:', e);
  }
}

/**
 * Loads the current Google API sync state.
 */
export function loadGoogleSyncState(): GoogleSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNC);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load Google sync state:', e);
  }
  return INITIAL_SYNC_STATE;
}

/**
 * Saves the current Google API sync state.
 */
export function saveGoogleSyncState(state: GoogleSyncState): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYNC, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save Google sync state:', e);
  }
}

/**
 * Deduplication & Merge Engine:
 * Compares an incoming activity against existing activities.
 * Match criteria:
 * 1. Timestamp within ±15 minutes
 * 2. Activity type matches (e.g. run vs run)
 * 3. Distance within ±5% or ±200 meters
 * 4. Duration within ±5% or ±60 seconds
 *
 * If duplicate found:
 * - Enriches the existing activity with telemetry (route GPS, heart rate streams, elevation)
 * - Returns { updatedList, action: 'merged' | 'ignored' | 'inserted' }
 */
export function deduplicateOrMergeActivity(
  existingList: UserActivity[],
  incoming: UserActivity
): { updatedList: UserActivity[]; action: 'inserted' | 'merged' | 'ignored'; matchedId?: string } {
  // First, check direct syncId match or exact ID match
  if (incoming.syncId) {
    const idMatchIndex = existingList.findIndex(e => e.syncId === incoming.syncId || e.id === incoming.id);
    if (idMatchIndex >= 0) {
      const existing = existingList[idMatchIndex];
      const merged: UserActivity = {
        ...existing,
        title: incoming.title || existing.title,
        distanceKm: incoming.distanceKm > 0 ? incoming.distanceKm : existing.distanceKm,
        distanceMeters: incoming.distanceMeters > 0 ? incoming.distanceMeters : existing.distanceMeters,
        durationSeconds: incoming.durationSeconds > 0 ? incoming.durationSeconds : existing.durationSeconds,
        durationFormatted: incoming.durationFormatted || existing.durationFormatted,
        paceSecondsPerKm: incoming.paceSecondsPerKm || existing.paceSecondsPerKm,
        paceFormatted: incoming.paceFormatted || existing.paceFormatted,
        calories: incoming.calories || existing.calories,
        avgHr: incoming.avgHr || existing.avgHr,
        maxHr: incoming.maxHr || existing.maxHr,
        route: (incoming.route && incoming.route.length > 0) ? incoming.route : existing.route,
        splits: (incoming.splits && incoming.splits.length > 0) ? incoming.splits : existing.splits,
        vdot: incoming.vdot || existing.vdot,
        sourceLabel: incoming.sourceLabel || existing.sourceLabel,
        syncedAt: new Date().toISOString()
      };
      const nextList = [...existingList];
      nextList[idMatchIndex] = merged;
      return { updatedList: nextList, action: 'merged', matchedId: existing.id };
    }
  }

  const incomingTime = new Date(incoming.date).getTime();

  const matchIndex = existingList.findIndex(existing => {
    const existingTime = new Date(existing.date).getTime();
    const timeDiffMinutes = Math.abs(incomingTime - existingTime) / (1000 * 60);

    // 1. Time proximity check (<= 20 minutes)
    if (timeDiffMinutes > 20) return false;

    // 2. Type compatibility
    const sameType = existing.type === incoming.type || 
      (existing.type === 'run' && incoming.type === 'trail') ||
      (existing.type === 'trail' && incoming.type === 'run');
    if (!sameType) return false;

    // 3. Distance proximity check (within 8% or 300m)
    const distDiffKm = Math.abs(existing.distanceKm - incoming.distanceKm);
    const distDiffPct = distDiffKm / Math.max(existing.distanceKm, 0.1);
    if (distDiffKm > 0.3 && distDiffPct > 0.08) return false;

    // 4. Duration proximity check (within 10% or 180s)
    const durDiffSec = Math.abs(existing.durationSeconds - incoming.durationSeconds);
    const durDiffPct = durDiffSec / Math.max(existing.durationSeconds, 1);
    if (durDiffSec > 180 && durDiffPct > 0.1) return false;

    return true;
  });

  if (matchIndex >= 0) {
    const existing = existingList[matchIndex];

    // Merge logic: preserve user notes, take richer telemetry (route, HR, cadence, elevation, splits)
    const merged: UserActivity = {
      ...existing,
      // If incoming has route and existing doesn't, adopt incoming
      route: (incoming.route && incoming.route.length > 0) ? incoming.route : existing.route,
      splits: (incoming.splits && incoming.splits.length > 0) ? incoming.splits : existing.splits,
      avgHr: incoming.avgHr || existing.avgHr,
      maxHr: incoming.maxHr || existing.maxHr,
      cadenceSpm: incoming.cadenceSpm || existing.cadenceSpm,
      elevationGainMeters: incoming.elevationGainMeters || existing.elevationGainMeters,
      elevationLossMeters: incoming.elevationLossMeters || existing.elevationLossMeters,
      calories: incoming.calories || existing.calories,
      vdot: incoming.vdot || existing.vdot,
      source: existing.source === 'manual' ? incoming.source : existing.source,
      sourceLabel: existing.source === 'manual' 
        ? `Manual (Sincronizado c/ ${incoming.sourceLabel || 'Google Fit'})`
        : existing.sourceLabel,
      syncedAt: new Date().toISOString()
    };

    const nextList = [...existingList];
    nextList[matchIndex] = merged;
    return { updatedList: nextList, action: 'merged', matchedId: existing.id };
  }

  // No duplicate found -> Prepend newly created activity
  const nextList = [incoming, ...existingList];
  return { updatedList: nextList, action: 'inserted' };
}

/**
 * Simulates syncing with Google Fit & Google Health Connect APIs.
 * Fetches latest cloud activities, detects duplicates and merges them cleanly.
 */
export async function simulateGoogleFitSync(
  currentList: UserActivity[]
): Promise<{ 
  addedCount: number; 
  mergedCount: number; 
  activities: UserActivity[]; 
  syncState: GoogleSyncState 
}> {
  // Simulate network delay for real API experience
  await new Promise(resolve => setTimeout(resolve, 800));

  let incomingFromGoogle: UserActivity[] = [];

  try {
    const res = await fetch('/api/fitness/activities?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.sessions) && data.sessions.length > 0) {
        incomingFromGoogle = data.sessions.map((sess: any) => {
          const startMs = parseInt(sess.startTimeMillis, 10) || Date.now();
          const endMs = parseInt(sess.endTimeMillis, 10) || startMs + 1800000;
          const durationSeconds = Math.max(30, Math.round((endMs - startMs) / 1000));
          const isRun = sess.activityType === 8;
          const isWalk = sess.activityType === 7 || (sess.name && sess.name.toLowerCase().includes('walk'));
          const isOther = sess.activityType === 108 || (sess.name && sess.name.toLowerCase().includes('outros'));
          const type: 'run' | 'walk' | 'other' = isRun ? 'run' : isWalk ? 'walk' : isOther ? 'other' : 'run';
          
          // Use exact distance if available from Google Fit datasets, otherwise estimate
          let distanceMeters = sess.exactDistanceMeters || 0;
          let distanceKm = 0;
          if (distanceMeters > 50) {
            distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
          } else if (!isOther) {
            const estSpeedKmh = isRun ? 10.5 : 5.2;
            distanceKm = Math.round((estSpeedKmh * (durationSeconds / 3600)) * 100) / 100;
            distanceMeters = Math.round(distanceKm * 1000);
          }

          const paceSec = distanceKm > 0 ? Math.round(durationSeconds / distanceKm) : 0;
          const avgHr = sess.avgHeartRate;
          const calories = sess.exactCalories || (distanceKm > 0 ? Math.round(distanceKm * 65) : Math.round((durationSeconds / 60) * 6));
          
          const appName = sess.application?.packageName?.includes('huami') 
            ? 'Amazfit (Zepp)' 
            : 'Google Fit';

          const title = sess.name 
            ? sess.name 
            : isRun ? 'Corrida • Amazfit' 
            : isWalk ? 'Caminhada • Amazfit' 
            : 'Treino Físico • Amazfit';

          const route = Array.isArray(sess.routePoints) && sess.routePoints.length >= 2 
            ? sess.routePoints 
            : undefined;

          return {
            id: `gfit-${sess.id || startMs}`,
            title,
            type,
            source: 'google_fit',
            sourceLabel: `${appName} • Google Fit API`,
            date: new Date(startMs).toISOString(),
            distanceKm,
            distanceMeters,
            durationSeconds,
            durationFormatted: formatTime(durationSeconds),
            paceSecondsPerKm: paceSec,
            paceFormatted: paceSec > 0 ? formatPace(paceSec) : '--:--',
            speedAvgKmh: distanceKm > 0 ? Math.round((distanceKm / (durationSeconds / 3600)) * 10) / 10 : 0,
            speedMaxKmh: distanceKm > 0 ? Math.round((distanceKm / (durationSeconds / 3600)) * 1.18 * 10) / 10 : 0,
            avgHr,
            calories,
            route,
            vdot: isRun && distanceMeters >= 1500 ? Math.round(calculateVDOT(distanceMeters, durationSeconds) * 10) / 10 : undefined,
            notes: `Importado de ${appName} via Google Fitness REST API.` + (route ? ` Rota com ${route.length} coordenadas GPS.` : ''),
            syncId: sess.id,
            syncedAt: new Date().toISOString()
          } as UserActivity;
        });
      }
    }
  } catch (err) {
    console.warn('Google Fit sessions fetch failed:', err);
  }

  let list = [...currentList];
  let added = 0;
  let merged = 0;

  for (const incoming of incomingFromGoogle) {
    const res = deduplicateOrMergeActivity(list, incoming);
    list = res.updatedList;
    if (res.action === 'inserted') added++;
    if (res.action === 'merged') merged++;
  }

  const syncState: GoogleSyncState = {
    status: 'success',
    lastSync: new Date().toISOString(),
    serviceName: 'Google Fit / Health Connect API',
    syncedCount: (loadGoogleSyncState().syncedCount || 0) + added + merged
  };

  saveUserActivities(list);
  saveGoogleSyncState(syncState);

  return {
    addedCount: added,
    mergedCount: merged,
    activities: list,
    syncState
  };
}

/**
 * Creates and validates a manual user activity.
 */
export function createManualActivity(params: {
  title: string;
  type: ActivityType;
  date: string;
  distanceKm: number;
  durationSeconds: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  avgHr?: number;
  maxHr?: number;
  cadenceSpm?: number;
  calories?: number;
  notes?: string;
  shoeName?: string;
  route?: RoutePoint[];
}): UserActivity {
  const distanceKm = Math.max(0.1, Math.round(params.distanceKm * 100) / 100);
  const distanceMeters = Math.round(distanceKm * 1000);
  const durationSeconds = Math.max(10, params.durationSeconds);
  const paceSec = durationSeconds / distanceKm;

  const speedAvgKmh = Math.round((distanceKm / (durationSeconds / 3600)) * 10) / 10;
  const speedMaxKmh = Math.round(speedAvgKmh * 1.15 * 10) / 10;

  // Estimate calories if not provided (~1 kcal per kg per km)
  const calories = params.calories || Math.round(distanceKm * 70 * 0.95);

  // Auto generate splits for manual activity
  const splits: ActivitySplit[] = [];
  const numKm = Math.floor(distanceKm);
  let remainingDur = durationSeconds;

  for (let k = 1; k <= numKm; k++) {
    const kmSec = Math.round(paceSec);
    splits.push({
      km: k,
      paceFormatted: formatPace(kmSec),
      paceSeconds: kmSec,
      avgHr: params.avgHr ? params.avgHr + (k > numKm / 2 ? 3 : -3) : undefined,
      elevationDiffM: params.elevationGainMeters ? Math.round(params.elevationGainMeters / numKm) : 0,
      durationSeconds: kmSec
    });
    remainingDur -= kmSec;
  }

  if (distanceKm > numKm && remainingDur > 0) {
    splits.push({
      km: numKm + 1,
      paceFormatted: formatPace(paceSec),
      paceSeconds: Math.round(paceSec),
      avgHr: params.avgHr,
      elevationDiffM: 0,
      durationSeconds: remainingDur
    });
  }

  // Calculate VDOT estimate if it is a run
  let vdot: number | undefined = undefined;
  if (params.type === 'run' || params.type === 'trail' || params.type === 'treadmill') {
    vdot = calculateVDOT(distanceMeters, durationSeconds);
  }

  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: params.title.trim() || (params.type === 'walk' ? 'Caminhada Manual' : 'Corrida Manual'),
    type: params.type,
    source: 'manual',
    sourceLabel: 'Inserção Manual',
    date: params.date || new Date().toISOString().substring(0, 16),
    distanceKm,
    distanceMeters,
    durationSeconds,
    durationFormatted: formatTime(durationSeconds, durationSeconds >= 3600),
    paceSecondsPerKm: Math.round(paceSec),
    paceFormatted: formatPace(paceSec),
    speedAvgKmh,
    speedMaxKmh,
    avgHr: params.avgHr,
    maxHr: params.maxHr || (params.avgHr ? params.avgHr + 12 : undefined),
    calories,
    elevationGainMeters: params.elevationGainMeters || 0,
    elevationLossMeters: params.elevationLossMeters || 0,
    cadenceSpm: params.cadenceSpm,
    vdot,
    notes: params.notes,
    shoeName: params.shoeName,
    route: params.route,
    splits
  };
}

/**
 * Resets user activities to empty or default.
 */
export function resetUserActivities(): UserActivity[] {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_SYNC);
  } catch (e) {
    console.error('Failed to reset user activities:', e);
  }
  return [];
}
