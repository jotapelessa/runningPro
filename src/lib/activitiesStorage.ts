import { UserActivity, RoutePoint, ActivitySplit, ActivityType } from '../types';
import { calculateVDOT, formatPace, formatTime } from './vdotCalculator';

const STORAGE_KEY_ACTIVITIES = 'pacelab_user_activities_v3.5';

export const INITIAL_USER_ACTIVITIES: UserActivity[] = [];



/**
 * Loads all user activities from localStorage, or defaults to initial set.
 * Filters out any legacy Google Fit or Zepp data to ensure full sanitization.
 */
export function loadUserActivities(): UserActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sanitize legacy data
        const sanitized = parsed.filter(act => 
          act.source !== 'google_fit' && 
          act.source !== 'zepp' &&
          !(act.notes && act.notes.includes('Google Fitness REST API'))
        );
        return sanitized;
      }
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

    // 1. Time proximity check (up to 4 hours to catch timezone offsets)
    if (timeDiffMinutes > 240) return false;

    // 2. Type compatibility
    const sameType = existing.type === incoming.type || 
      (existing.type === 'run' && incoming.type === 'trail') ||
      (existing.type === 'trail' && incoming.type === 'run');
    if (!sameType) return false;

    const distDiffKm = Math.abs(existing.distanceKm - incoming.distanceKm);
    const distDiffPct = distDiffKm / Math.max(existing.distanceKm, 0.1);
    
    const durDiffSec = Math.abs(existing.durationSeconds - incoming.durationSeconds);
    const durDiffPct = durDiffSec / Math.max(existing.durationSeconds, 1);

    if (timeDiffMinutes > 20) {
      // If time diff is large (timezone bug likely), require STRICT distance and duration match
      if (distDiffKm > 0.05 && distDiffPct > 0.02) return false;
      if (durDiffSec > 60 && durDiffPct > 0.05) return false;
    } else {
      // Normal checks for activities recorded at the same time
      if (distDiffKm > 0.3 && distDiffPct > 0.08) return false;
      if (durDiffSec > 180 && durDiffPct > 0.1) return false;
    }

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
        ? `Manual (Sincronizado c/ ${incoming.sourceLabel || 'Intervals.icu'})`
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
  } catch (e) {
    console.error('Failed to reset user activities:', e);
  }
  return [];
}
