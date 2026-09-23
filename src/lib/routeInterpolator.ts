import { RoutePoint } from '../types';

/**
 * Geometric Route Interpolator & Continuous Telemetry Resampler
 * Parameterizes sparse or dense GPS waypoints into an arc-length continuous curve
 * with synchronized distance, elapsed time, elevation, heart rate, and speed streams.
 */

export interface InterpolatedRoutePoint {
  lat: number;
  lng: number;
  dist: number; // cumulative meters from start
  ele?: number;
  hr?: number;
  speed?: number; // km/h
  elapsedSec?: number;
  cumEleGain?: number;
}

export interface ArcLengthRoute {
  points: InterpolatedRoutePoint[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalElevationGainMeters: number;
}

/**
 * Calculate distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Clean and parameterize GPS route by cumulative arc-length distance and resample telemetry
 */
export function buildContinuousArcLengthRoute(
  rawPoints: RoutePoint[],
  stepDistanceMeters: number = 2.0 // High density: 1 interpolated point every 2 meters
): ArcLengthRoute {
  if (!rawPoints || rawPoints.length === 0) {
    return {
      points: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalElevationGainMeters: 0,
    };
  }

  // 1. Sanitize raw points (filter out 0,0 invalid coords & duplicate stationary jitter < 0.2m)
  const cleaned: RoutePoint[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const pt = rawPoints[i];
    if (!pt || isNaN(pt.lat) || isNaN(pt.lng) || (pt.lat === 0 && pt.lng === 0)) continue;
    if (cleaned.length > 0) {
      const prev = cleaned[cleaned.length - 1];
      const d = haversineDistanceMeters(prev.lat, prev.lng, pt.lat, pt.lng);
      if (d < 0.2 && i < rawPoints.length - 1) continue; // skip micro jitter unless last point
    }
    cleaned.push(pt);
  }

  if (cleaned.length === 0) {
    return {
      points: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalElevationGainMeters: 0,
    };
  }

  if (cleaned.length === 1) {
    const p = cleaned[0];
    return {
      points: [{ lat: p.lat, lng: p.lng, dist: 0, ele: p.ele, hr: p.hr, speed: p.speed, elapsedSec: 0, cumEleGain: 0 }],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalElevationGainMeters: 0,
    };
  }

  // 2. Compute cumulative distances, timestamps and elevation gains along raw waypoints
  const startTimeStr = cleaned[0].time;
  const endTimeStr = cleaned[cleaned.length - 1].time;
  const firstTime = startTimeStr ? new Date(startTimeStr).getTime() : null;
  const lastTime = endTimeStr ? new Date(endTimeStr).getTime() : null;
  const rawTotalSec = (firstTime !== null && lastTime !== null && !isNaN(firstTime) && !isNaN(lastTime) && lastTime > firstTime)
    ? (lastTime - firstTime) / 1000
    : 0;

  let totalDist = 0;
  let totalEleGain = 0;
  let prevEle = cleaned[0].ele;

  const rawWithDist: (RoutePoint & { cumDist: number; elapsedSec: number; cumEleGain: number })[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const pt = cleaned[i];
    if (i > 0) {
      const prev = cleaned[i - 1];
      const d = haversineDistanceMeters(prev.lat, prev.lng, pt.lat, pt.lng);
      totalDist += d;

      if (pt.ele !== undefined && prevEle !== undefined && pt.ele > prevEle) {
        const diff = pt.ele - prevEle;
        if (diff < 100) totalEleGain += diff;
      }
    }
    if (pt.ele !== undefined) prevEle = pt.ele;

    let elapsed = 0;
    if (pt.time && firstTime !== null) {
      const t = new Date(pt.time).getTime();
      if (!isNaN(t) && t >= firstTime) {
        elapsed = (t - firstTime) / 1000;
      }
    }

    rawWithDist.push({
      ...pt,
      cumDist: totalDist,
      elapsedSec: elapsed,
      cumEleGain: totalEleGain
    });
  }

  // If time stamps were missing, estimate elapsedSec proportionally to distance
  if (rawTotalSec > 0) {
    // Fill any gap in elapsedSec if missing
    for (let i = 0; i < rawWithDist.length; i++) {
      if (rawWithDist[i].elapsedSec === 0 && i > 0 && totalDist > 0) {
        rawWithDist[i].elapsedSec = (rawWithDist[i].cumDist / totalDist) * rawTotalSec;
      }
    }
  } else if (totalDist > 0) {
    // Fallback: assume average running pace ~ 5 min/km (300 s/km)
    const estSec = (totalDist / 1000) * 300;
    for (let i = 0; i < rawWithDist.length; i++) {
      rawWithDist[i].elapsedSec = (rawWithDist[i].cumDist / totalDist) * estSec;
    }
  }

  const finalTotalSec = rawWithDist[rawWithDist.length - 1].elapsedSec || 0;

  if (totalDist <= 0) {
    return {
      points: cleaned.map((p) => ({ lat: p.lat, lng: p.lng, dist: 0, ele: p.ele, hr: p.hr, speed: p.speed, elapsedSec: 0, cumEleGain: 0 })),
      totalDistanceMeters: 0,
      totalDurationSeconds: finalTotalSec,
      totalElevationGainMeters: totalEleGain,
    };
  }

  // 3. Resample at uniform distance intervals (Arc-length parameterization)
  const interpolatedPoints: InterpolatedRoutePoint[] = [];
  const numSteps = Math.max(10, Math.ceil(totalDist / stepDistanceMeters));
  const actualStep = totalDist / numSteps;

  let rawIdx = 0;
  for (let s = 0; s <= numSteps; s++) {
    const targetDist = s * actualStep;

    // Advance raw index until segment [rawIdx, rawIdx + 1] contains targetDist
    while (
      rawIdx < rawWithDist.length - 2 &&
      rawWithDist[rawIdx + 1].cumDist <= targetDist
    ) {
      rawIdx++;
    }

    const p1 = rawWithDist[rawIdx];
    const p2 = rawWithDist[Math.min(rawWithDist.length - 1, rawIdx + 1)];

    const segmentDist = p2.cumDist - p1.cumDist;
    const t = segmentDist > 0 ? Math.max(0, Math.min(1, (targetDist - p1.cumDist) / segmentDist)) : 0;

    // Precise linear interpolation along arc-length segment (guarantees NO artificial loops or overshoots)
    const lat = p1.lat + t * (p2.lat - p1.lat);
    const lng = p1.lng + t * (p2.lng - p1.lng);

    // Telemetry interpolation
    const ele = (p1.ele !== undefined && p2.ele !== undefined)
      ? p1.ele + t * (p2.ele - p1.ele)
      : (p1.ele ?? p2.ele);

    const hr = (p1.hr !== undefined && p2.hr !== undefined)
      ? Math.round(p1.hr + t * (p2.hr - p1.hr))
      : (p1.hr ?? p2.hr);

    const speed = (p1.speed !== undefined && p2.speed !== undefined)
      ? p1.speed + t * (p2.speed - p1.speed)
      : (p1.speed ?? p2.speed);

    const elapsedSec = p1.elapsedSec + t * (p2.elapsedSec - p1.elapsedSec);
    const cumEleGain = p1.cumEleGain + t * (p2.cumEleGain - p1.cumEleGain);

    interpolatedPoints.push({
      lat,
      lng,
      dist: targetDist,
      ele: ele !== undefined ? Math.round(ele * 10) / 10 : undefined,
      hr,
      speed: speed !== undefined ? Math.round(speed * 10) / 10 : undefined,
      elapsedSec: Math.round(elapsedSec),
      cumEleGain: Math.round(cumEleGain)
    });
  }

  return {
    points: interpolatedPoints,
    totalDistanceMeters: totalDist,
    totalDurationSeconds: Math.round(finalTotalSec),
    totalElevationGainMeters: Math.round(totalEleGain)
  };
}

/**
 * Extract sub-slice of route based on exact animated distance ratio (0.0 to 1.0)
 * Guarantees constant linear distance speed per frame regardless of original waypoint spacing.
 */
export function getRouteSliceAtRatio(
  resampledRoute: ArcLengthRoute,
  ratio: number
): { points: InterpolatedRoutePoint[]; currentHead: InterpolatedRoutePoint | null } {
  const pts = resampledRoute.points;
  if (!pts || pts.length === 0) {
    return { points: [], currentHead: null };
  }
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  if (clampedRatio <= 0) {
    return { points: [pts[0]], currentHead: pts[0] };
  }
  if (clampedRatio >= 1) {
    return { points: pts, currentHead: pts[pts.length - 1] };
  }

  const targetIndex = Math.max(1, Math.min(pts.length - 1, Math.floor(clampedRatio * (pts.length - 1))));
  const subPoints = pts.slice(0, targetIndex + 1);

  return {
    points: subPoints,
    currentHead: subPoints[subPoints.length - 1] || null,
  };
}

