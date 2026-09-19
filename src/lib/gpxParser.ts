import { calculateVDOT, formatPace, formatTimeStr } from './vdot';

export interface ParsedWorkout {
  filename: string;
  fileType: 'gpx' | 'tcx';
  activityName?: string;
  startTime?: string;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  totalTimeSeconds: number;
  paceSecondsPerKm: number;
  paceFormatted: string;
  timeFormatted: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calculatedVDOT: number;
  elevationGainMeters?: number;
  pointsCount: number;
}

// Haversine formula to compute distance between GPS lat/lon
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Parses raw GPX XML string (from Amazfit / Zepp / Garmin / Strava)
 */
export function parseGPX(xmlText: string, filename: string): ParsedWorkout {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Arquivo GPX corrompido ou formato XML inválido.');
  }

  const nameEl = xml.querySelector('trk > name') || xml.querySelector('name');
  const activityName = nameEl?.textContent || 'Corrida Amazfit T-Rex Pro';

  const trkpts = Array.from(xml.querySelectorAll('trkpt'));
  if (trkpts.length === 0) {
    throw new Error('Nenhum ponto de GPS encontrado no arquivo GPX.');
  }

  let totalDistance = 0;
  let heartRates: number[] = [];
  let elevationGain = 0;
  let lastEle: number | null = null;

  let firstTime: Date | null = null;
  let lastTime: Date | null = null;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');

    // Time
    const timeEl = pt.querySelector('time');
    if (timeEl && timeEl.textContent) {
      const ptTime = new Date(timeEl.textContent);
      if (!firstTime) firstTime = ptTime;
      lastTime = ptTime;
    }

    // Elevation
    const eleEl = pt.querySelector('ele');
    if (eleEl && eleEl.textContent) {
      const ele = parseFloat(eleEl.textContent);
      if (lastEle !== null && ele > lastEle) {
        elevationGain += ele - lastEle;
      }
      lastEle = ele;
    }

    // Distance calculation
    if (i > 0) {
      const prevPt = trkpts[i - 1];
      const prevLat = parseFloat(prevPt.getAttribute('lat') || '0');
      const prevLon = parseFloat(prevPt.getAttribute('lon') || '0');
      totalDistance += getDistanceFromLatLonInMeters(prevLat, prevLon, lat, lon);
    }

    // Heart rate extraction (standard TrackPointExtension / hr tag)
    const hrEl =
      pt.querySelector('hr') ||
      pt.querySelector('heartrate') ||
      pt.querySelector('TrackPointExtension > hr');
    if (hrEl && hrEl.textContent) {
      const hr = parseInt(hrEl.textContent, 10);
      if (!isNaN(hr) && hr > 30 && hr < 240) {
        heartRates.push(hr);
      }
    }
  }

  // Calculate elapsed time
  let totalSeconds = 0;
  if (firstTime && lastTime) {
    totalSeconds = Math.round((lastTime.getTime() - firstTime.getTime()) / 1000);
  }
  if (totalSeconds <= 0) {
    // Fallback: estimate 5 min/km if time is missing
    totalSeconds = Math.round((totalDistance / 1000) * 300);
  }

  const totalDistanceKm = Math.round((totalDistance / 1000) * 100) / 100;
  const paceSecondsPerKm = totalDistanceKm > 0 ? Math.round(totalSeconds / totalDistanceKm) : 0;
  const calculatedVDOT = Math.round(calculateVDOT(totalDistance, totalSeconds) * 10) / 10;

  const avgHeartRate =
    heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : undefined;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : undefined;

  return {
    filename,
    fileType: 'gpx',
    activityName,
    startTime: firstTime ? firstTime.toLocaleString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
    totalDistanceMeters: Math.round(totalDistance),
    totalDistanceKm,
    totalTimeSeconds: totalSeconds,
    paceSecondsPerKm,
    paceFormatted: formatPace(paceSecondsPerKm),
    timeFormatted: formatTimeStr(totalSeconds),
    avgHeartRate,
    maxHeartRate,
    calculatedVDOT,
    elevationGainMeters: Math.round(elevationGain),
    pointsCount: trkpts.length
  };
}

/**
 * Parses raw TCX XML string (from Zepp / Amazfit / Garmin Training Center)
 */
export function parseTCX(xmlText: string, filename: string): ParsedWorkout {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Arquivo TCX corrompido ou formato XML inválido.');
  }

  // Total Distance & Time from Lap summary or trackpoints
  let totalDistance = 0;
  let totalSeconds = 0;

  const distMetersEl = xml.querySelector('Lap > DistanceMeters');
  if (distMetersEl && distMetersEl.textContent) {
    totalDistance = parseFloat(distMetersEl.textContent);
  }

  const totalTimeSecondsEl = xml.querySelector('Lap > TotalTimeSeconds');
  if (totalTimeSecondsEl && totalTimeSecondsEl.textContent) {
    totalSeconds = parseFloat(totalTimeSecondsEl.textContent);
  }

  const trackpoints = Array.from(xml.querySelectorAll('Trackpoint'));
  let heartRates: number[] = [];

  trackpoints.forEach(pt => {
    const hrEl = pt.querySelector('HeartRateBpm > Value');
    if (hrEl && hrEl.textContent) {
      const hr = parseInt(hrEl.textContent, 10);
      if (!isNaN(hr) && hr > 30 && hr < 240) {
        heartRates.push(hr);
      }
    }
  });

  // If distance was not in Lap summary, compute from last trackpoint DistanceMeters
  if (totalDistance === 0 && trackpoints.length > 0) {
    const lastDistEl = trackpoints[trackpoints.length - 1].querySelector('DistanceMeters');
    if (lastDistEl && lastDistEl.textContent) {
      totalDistance = parseFloat(lastDistEl.textContent);
    }
  }

  const totalDistanceKm = Math.round((totalDistance / 1000) * 100) / 100;
  const paceSecondsPerKm = totalDistanceKm > 0 && totalSeconds > 0 ? Math.round(totalSeconds / totalDistanceKm) : 0;
  const calculatedVDOT = Math.round(calculateVDOT(totalDistance, totalSeconds) * 10) / 10;

  const avgHeartRate =
    heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : undefined;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : undefined;

  const startTimeEl = xml.querySelector('Lap')?.getAttribute('StartTime');

  return {
    filename,
    fileType: 'tcx',
    activityName: 'Corrida Amazfit T-Rex Pro',
    startTime: startTimeEl ? new Date(startTimeEl).toLocaleString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
    totalDistanceMeters: Math.round(totalDistance),
    totalDistanceKm,
    totalTimeSeconds: Math.round(totalSeconds),
    paceSecondsPerKm,
    paceFormatted: formatPace(paceSecondsPerKm),
    timeFormatted: formatTimeStr(Math.round(totalSeconds)),
    avgHeartRate,
    maxHeartRate,
    calculatedVDOT,
    pointsCount: trackpoints.length
  };
}
