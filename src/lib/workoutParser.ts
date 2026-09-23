import { ParsedWorkout, MultiWorkoutTelemetrySummary } from '../types';
import { calculateVDOT, formatPace, formatTime } from './vdotCalculator';
// @ts-ignore
import FitParser from 'fit-file-parser';

/**
 * Haversine formula for calculating GPS distances between coordinate points in meters
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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

export interface ParsedGpxDetails extends ParsedWorkout {
  startTimeIso: string;
  durationHours: number;
  durationMinutes: number;
  durationSecondsOnly: number;
  calories?: number;
  activityType?: 'run' | 'walk' | 'trail' | 'treadmill';
  routePoints: { lat: number; lng: number; ele?: number; time?: string; hr?: number; speed?: number; distanceFromStartM?: number }[];
}

/**
 * Extracts numeric value from an XML element searching multiple tag variations and namespaces
 */
function findNumberInNode(element: Element, tagNames: string[]): number | null {
  for (const name of tagNames) {
    // 1. Check direct querySelector
    try {
      const el = element.querySelector(name);
      if (el && el.textContent) {
        const val = parseFloat(el.textContent);
        if (!isNaN(val)) return val;
      }
    } catch (_) {}

    // 2. Check getElementsByTagName
    try {
      const els = element.getElementsByTagName(name);
      if (els.length > 0 && els[0].textContent) {
        const val = parseFloat(els[0].textContent);
        if (!isNaN(val)) return val;
      }
    } catch (_) {}

    // 3. Namespace-agnostic search over all children
    const allChildren = element.getElementsByTagName('*');
    for (let i = 0; i < allChildren.length; i++) {
      const child = allChildren[i];
      const local = (child.localName || child.nodeName || '').toLowerCase();
      if (local === name.toLowerCase() || local.endsWith(':' + name.toLowerCase())) {
        const text = child.textContent?.trim();
        if (text) {
          const val = parseFloat(text);
          if (!isNaN(val)) return val;
        }
      }
    }
  }
  return null;
}

/**
 * Parses GPX (GPS Exchange Format XML) with full telemetry extraction
 */
export function parseGpxDetails(content: string, fileName: string): ParsedGpxDetails {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Arquivo GPX com formato XML inválido.');
  }

  const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));
  if (trkpts.length === 0) {
    // Try route points or waypoints if trkpt not found
    const rtepts = Array.from(xmlDoc.querySelectorAll('rtept'));
    if (rtepts.length > 0) {
      trkpts.push(...rtepts);
    }
  }

  if (trkpts.length < 2) {
    throw new Error('Arquivo GPX não contém pontos de GPS suficientes (mínimo 2 pontos).');
  }

  let totalDistanceMeters = 0;
  let elevationGainMeters = 0;
  let prevEle: number | null = null;
  let hrSum = 0;
  let hrCount = 0;
  let maxHrFound = 0;
  let cadSum = 0;
  let cadCount = 0;

  let startTime: number | null = null;
  let endTime: number | null = null;

  const rawPoints: { lat: number; lng: number; ele?: number; time?: string; hr?: number; speed?: number; distanceFromStartM?: number }[] = [];

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') || pt.getAttribute('latitude') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || pt.getAttribute('longitude') || pt.getAttribute('lng') || '0');

    if (lat === 0 || lon === 0) continue;

    // Elevation
    let currentEle: number | undefined = undefined;
    const eleVal = findNumberInNode(pt, ['ele', 'altitude', 'alt']);
    if (eleVal !== null && !isNaN(eleVal)) {
      currentEle = eleVal;
      if (prevEle !== null && currentEle > prevEle) {
        const diff = currentEle - prevEle;
        if (diff < 150) { // filter altitude spikes
          elevationGainMeters += diff;
        }
      }
      prevEle = currentEle;
    }

    // Time
    let pointTimeIso: string | undefined = undefined;
    const timeNode = pt.querySelector('time') || pt.getElementsByTagName('time')[0];
    if (timeNode && timeNode.textContent) {
      const text = timeNode.textContent.trim();
      const t = new Date(text).getTime();
      if (!isNaN(t)) {
        pointTimeIso = text;
        if (startTime === null || t < startTime) startTime = t;
        if (endTime === null || t > endTime) endTime = t;
      }
    }

    // Heart Rate in extensions (Zepp, Garmin, Strava, Polar, Wahoo)
    const hrVal = findNumberInNode(pt, ['hr', 'heartrate', 'heartRate', 'hrbpm']);
    if (hrVal !== null && hrVal > 35 && hrVal < 250) {
      hrSum += hrVal;
      hrCount++;
      if (hrVal > maxHrFound) maxHrFound = hrVal;
    }

    // Cadence
    const cadVal = findNumberInNode(pt, ['cad', 'cadence', 'runcadence', 'spm']);
    if (cadVal !== null && cadVal > 30) {
      let cad = Math.round(cadVal);
      if (cad < 120) cad = cad * 2; // single-foot to SPM
      cadSum += cad;
      cadCount++;
    }

    // Speed in m/s
    const speedVal = findNumberInNode(pt, ['speed', 'velocity']);

    // Distance accumulation
    if (rawPoints.length > 0) {
      const prevPt = rawPoints[rawPoints.length - 1];
      const d = haversineDistance(prevPt.lat, prevPt.lng, lat, lon);
      if (d < 500) { // skip teleport jumps
        totalDistanceMeters += d;
      }
    }

    rawPoints.push({
      lat,
      lng: lon,
      ele: currentEle,
      time: pointTimeIso,
      hr: hrVal ? Math.round(hrVal) : undefined,
      speed: speedVal ? speedVal * 3.6 : undefined, // km/h
      distanceFromStartM: Math.round(totalDistanceMeters)
    });
  }

  // Fallback to metadata time if point timestamps were missing
  if (startTime === null) {
    const metaTime = xmlDoc.querySelector('metadata > time, gpx > time');
    if (metaTime && metaTime.textContent) {
      const t = new Date(metaTime.textContent.trim()).getTime();
      if (!isNaN(t)) {
        startTime = t;
      }
    }
  }

  // Filename timestamp fallback (e.g. Zepp20260914161932.gpx or 2026-09-14-16-19-32.gpx)
  if (startTime === null) {
    const dateMatch = fileName.match(/(\d{4})[_\-]?(\d{2})[_\-]?(\d{2})[_\-T]?(\d{2})[_\-]?(\d{2})[_\-]?(\d{2})?/i);
    if (dateMatch) {
      const [, year, month, day, hour = '07', min = '00', sec = '00'] = dateMatch;
      const parsedDate = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
      if (!isNaN(parsedDate.getTime())) {
        startTime = parsedDate.getTime();
      }
    }
  }

  if (startTime === null) {
    startTime = Date.now();
  }

  let durationSeconds = 0;
  if (endTime !== null && endTime > startTime) {
    durationSeconds = Math.round((endTime - startTime) / 1000);
  }

  // Safety fallback duration based on distance if timestamps missing
  if (durationSeconds <= 0 && totalDistanceMeters > 0) {
    durationSeconds = Math.round((totalDistanceMeters / 1000) * 330); // ~5:30/km
  }

  if (totalDistanceMeters < 50 && rawPoints.length < 2) {
    throw new Error('A distância detectada no GPX é insuficiente. Selecione um arquivo de GPS válido.');
  }

  const distanceKm = Math.max(0.1, totalDistanceMeters / 1000);
  const paceSecondsPerKm = durationSeconds > 0 ? Math.round(durationSeconds / distanceKm) : 300;
  const vdot = calculateVDOT(totalDistanceMeters, durationSeconds);

  // Activity Name
  const nameNode = xmlDoc.querySelector('trk > name, metadata > name, gpx > name');
  let activityName = nameNode?.textContent?.trim() || '';
  if (!activityName || activityName.toLowerCase().includes('export') || activityName.toLowerCase() === 'gpx') {
    const roundedDist = Math.round(distanceKm * 10) / 10;
    activityName = `Treino GPX de ${roundedDist} km`;
  }

  // Activity Type
  let detectedType: 'run' | 'walk' | 'trail' | 'treadmill' = 'run';
  const typeNode = xmlDoc.querySelector('trk > type, metadata > type, sport');
  const typeText = (typeNode?.textContent || fileName).toLowerCase();
  if (typeText.includes('walk') || typeText.includes('caminhada') || typeText.includes('hike')) {
    detectedType = 'walk';
  } else if (typeText.includes('trail') || typeText.includes('trilha') || elevationGainMeters > 200) {
    detectedType = 'trail';
  } else if (typeText.includes('treadmill') || typeText.includes('esteira')) {
    detectedType = 'treadmill';
  }

  // Calories in XML extensions or accurate METs estimate
  let calories = findNumberInNode(xmlDoc.documentElement, ['calories', 'calorie', 'total_calories', 'kcal']);
  if (!calories || calories <= 0) {
    // Standard running formula: ~68 kcal per km for average runner
    calories = Math.round(distanceKm * 68);
  }

  // Date formatted for datetime-local (local ISO)
  const startDateObj = new Date(startTime);
  const offset = startDateObj.getTimezoneOffset() * 60000;
  const localIso = new Date(startDateObj.getTime() - offset).toISOString().slice(0, 16);
  const workoutDate = new Date(startTime).toISOString().split('T')[0];

  const durationHours = Math.floor(durationSeconds / 3600);
  const durationMinutes = Math.floor((durationSeconds % 3600) / 60);
  const durationSecondsOnly = durationSeconds % 60;

  // Intelligently downsample route points up to 1200 points for smooth canvas rendering
  const maxPts = 1200;
  let sampledRoute: { lat: number; lng: number; ele?: number; time?: string; hr?: number; speed?: number; distanceFromStartM?: number }[] = [];
  if (rawPoints.length <= maxPts) {
    sampledRoute = rawPoints;
  } else {
    const step = rawPoints.length / maxPts;
    for (let i = 0; i < maxPts; i++) {
      const idx = Math.min(rawPoints.length - 1, Math.floor(i * step));
      sampledRoute.push(rawPoints[idx]);
    }
    // ensure last point is included
    if (sampledRoute[sampledRoute.length - 1] !== rawPoints[rawPoints.length - 1]) {
      sampledRoute.push(rawPoints[rawPoints.length - 1]);
    }
  }

  return {
    name: activityName,
    date: workoutDate,
    startTimeIso: localIso,
    fileName,
    distanceKm: Math.round(distanceKm * 100) / 100,
    distanceMeters: Math.round(totalDistanceMeters),
    durationSeconds,
    durationHours,
    durationMinutes,
    durationSecondsOnly,
    durationFormatted: formatTime(durationSeconds),
    paceSecondsPerKm,
    paceFormatted: formatPace(paceSecondsPerKm),
    avgHR: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    maxHR: maxHrFound > 0 ? maxHrFound : null,
    avgCadence: cadCount > 0 ? Math.round(cadSum / cadCount) : null,
    elevationGainMeters: Math.round(elevationGainMeters),
    calories: Math.round(calories),
    activityType: detectedType,
    routePoints: sampledRoute,
    vdot
  };
}

/**
 * Parses GPX (GPS Exchange Format XML) - Backwards compatible
 */
export function parseGpxContent(content: string, fileName: string): ParsedWorkout {
  return parseGpxDetails(content, fileName);
}

/**
 * Parses TCX (Training Center XML)
 */
export function parseTcxContent(content: string, fileName: string): ParsedWorkout {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Arquivo TCX com formato XML inválido.');
  }

  // Distance in meters from TCX Lap or Trackpoints
  let totalDistanceMeters = 0;
  const lapDistanceNodes = Array.from(xmlDoc.querySelectorAll('Lap > DistanceMeters'));
  if (lapDistanceNodes.length > 0) {
    totalDistanceMeters = lapDistanceNodes.reduce((acc, curr) => acc + (parseFloat(curr.textContent || '0') || 0), 0);
  }

  let totalTimeSeconds = 0;
  const lapTimeNodes = Array.from(xmlDoc.querySelectorAll('Lap > TotalTimeSeconds'));
  if (lapTimeNodes.length > 0) {
    totalTimeSeconds = lapTimeNodes.reduce((acc, curr) => acc + (parseFloat(curr.textContent || '0') || 0), 0);
  }

  // Parse Trackpoints for HR, Cadence, Elevation and GPS if lap totals were 0
  const trackpoints = Array.from(xmlDoc.querySelectorAll('Trackpoint'));
  let hrSum = 0;
  let hrCount = 0;
  let maxHrFound = 0;
  let cadSum = 0;
  let cadCount = 0;
  let elevationGainMeters = 0;
  let prevAltitude: number | null = null;
  let calculatedDistFromPoints = 0;

  for (let i = 0; i < trackpoints.length; i++) {
    const pt = trackpoints[i];

    // Heart Rate
    const hrNode = pt.querySelector('HeartRateBpm > Value');
    if (hrNode && hrNode.textContent) {
      const hr = parseInt(hrNode.textContent, 10);
      if (!isNaN(hr) && hr > 40 && hr < 240) {
        hrSum += hr;
        hrCount++;
        if (hr > maxHrFound) maxHrFound = hr;
      }
    }

    // Cadence
    const cadNode = pt.querySelector('Cadence, RunCadence');
    if (cadNode && cadNode.textContent) {
      let cad = parseInt(cadNode.textContent, 10);
      if (!isNaN(cad) && cad > 40) {
        if (cad < 120) cad = cad * 2;
        cadSum += cad;
        cadCount++;
      }
    }

    // Altitude
    const altNode = pt.querySelector('AltitudeMeters');
    if (altNode && altNode.textContent) {
      const alt = parseFloat(altNode.textContent);
      if (!isNaN(alt)) {
        if (prevAltitude !== null && alt > prevAltitude) {
          const diff = alt - prevAltitude;
          if (diff < 100) elevationGainMeters += diff;
        }
        prevAltitude = alt;
      }
    }

    // GPS distance if totalDistanceMeters was 0
    if (totalDistanceMeters === 0 && i > 0) {
      const prevPt = trackpoints[i - 1];
      const lat1 = parseFloat(pt.querySelector('Position > LatitudeDegrees')?.textContent || '0');
      const lon1 = parseFloat(pt.querySelector('Position > LongitudeDegrees')?.textContent || '0');
      const lat2 = parseFloat(prevPt.querySelector('Position > LatitudeDegrees')?.textContent || '0');
      const lon2 = parseFloat(prevPt.querySelector('Position > LongitudeDegrees')?.textContent || '0');

      if (lat1 !== 0 && lon1 !== 0 && lat2 !== 0 && lon2 !== 0) {
        const d = haversineDistance(lat2, lon2, lat1, lon1);
        if (d < 500) calculatedDistFromPoints += d;
      }
    }
  }

  if (totalDistanceMeters === 0) {
    totalDistanceMeters = calculatedDistFromPoints;
  }

  // Duration from timestamps if totalTimeSeconds was 0
  if (totalTimeSeconds === 0 && trackpoints.length >= 2) {
    const firstTimeStr = trackpoints[0].querySelector('Time')?.textContent;
    const lastTimeStr = trackpoints[trackpoints.length - 1].querySelector('Time')?.textContent;
    if (firstTimeStr && lastTimeStr) {
      const t1 = new Date(firstTimeStr).getTime();
      const t2 = new Date(lastTimeStr).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        totalTimeSeconds = Math.round((t2 - t1) / 1000);
      }
    }
  }

  if (totalDistanceMeters < 100) {
    throw new Error('A distância detectada no TCX é inferior a 100 metros. Selecione uma corrida válida.');
  }

  const distanceKm = totalDistanceMeters / 1000;
  const paceSecondsPerKm = totalTimeSeconds > 0 ? Math.round(totalTimeSeconds / distanceKm) : 300;
  const vdot = calculateVDOT(totalDistanceMeters, totalTimeSeconds);

  // Date from first trackpoint or Activity Id
  const idNode = xmlDoc.querySelector('Activity > Id, Trackpoint > Time');
  const workoutDate = idNode?.textContent ? new Date(idNode.textContent).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    name: `Corrida TCX (${distanceKm.toFixed(1)}k)`,
    date: workoutDate,
    fileName,
    distanceKm: Math.round(distanceKm * 100) / 100,
    distanceMeters: Math.round(totalDistanceMeters),
    durationSeconds: Math.round(totalTimeSeconds),
    durationFormatted: formatTime(Math.round(totalTimeSeconds)),
    paceSecondsPerKm,
    paceFormatted: formatPace(paceSecondsPerKm),
    avgHR: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    maxHR: maxHrFound > 0 ? maxHrFound : null,
    avgCadence: cadCount > 0 ? Math.round(cadSum / cadCount) : null,
    elevationGainMeters: Math.round(elevationGainMeters),
    vdot
  };
}

/**
 * Parses FIT (Garmin Flexible and Interoperable Data Transfer binary format)
 */
export function parseFitBuffer(buffer: ArrayBuffer, fileName: string): Promise<ParsedWorkout> {
  return new Promise((resolve, reject) => {
    try {
      // Initialize FitParser
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'm/s',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true
      });

      fitParser.parse(buffer, (error: any, data: any) => {
        if (error) {
          return reject(new Error(`Erro ao decodificar arquivo FIT: ${error.message || error}`));
        }

        if (!data || (!data.records && !data.sessions && !data.laps)) {
          return reject(new Error('Arquivo FIT vazio ou sem registros de atividade legíveis.'));
        }

        let totalDistanceMeters = 0;
        let totalDurationSeconds = 0;
        let avgHR: number | null = null;
        let maxHR: number | null = null;
        let avgCadence: number | null = null;
        let elevationGainMeters = 0;
        let activityDate = new Date().toISOString().split('T')[0];
        let activityName = `Corrida FIT: ${fileName.replace(/\.[^/.]+$/, '')}`;

        // 1. Check sessions or laps first for clean aggregated metrics
        if (data.sessions && data.sessions.length > 0) {
          const session = data.sessions[0];
          if (session.total_distance) totalDistanceMeters = session.total_distance;
          if (session.total_timer_time) totalDurationSeconds = session.total_timer_time;
          else if (session.total_elapsed_time) totalDurationSeconds = session.total_elapsed_time;

          if (session.avg_heart_rate) avgHR = Math.round(session.avg_heart_rate);
          if (session.max_heart_rate) maxHR = Math.round(session.max_heart_rate);
          if (session.avg_cadence) {
            avgCadence = session.avg_cadence < 120 ? Math.round(session.avg_cadence * 2) : Math.round(session.avg_cadence);
          }
          if (session.total_ascent) elevationGainMeters = Math.round(session.total_ascent);
          if (session.start_time) {
            activityDate = new Date(session.start_time).toISOString().split('T')[0];
          }
        }

        // 2. Fallback to records if session summaries were zero or missing
        if (data.records && data.records.length > 0) {
          const records = data.records;
          let hrSum = 0;
          let hrCount = 0;
          let cadSum = 0;
          let cadCount = 0;
          let calculatedEleGain = 0;
          let prevAlt: number | null = null;

          const lastRecord = records[records.length - 1];
          const firstRecord = records[0];

          if (firstRecord && firstRecord.timestamp) {
            activityDate = new Date(firstRecord.timestamp).toISOString().split('T')[0];
          }

          if (totalDistanceMeters === 0 && lastRecord && lastRecord.distance !== undefined) {
            totalDistanceMeters = lastRecord.distance;
          }

          if (totalDurationSeconds === 0 && firstRecord.timestamp && lastRecord.timestamp) {
            const t1 = new Date(firstRecord.timestamp).getTime();
            const t2 = new Date(lastRecord.timestamp).getTime();
            if (t2 > t1) totalDurationSeconds = Math.round((t2 - t1) / 1000);
          }

          for (const rec of records) {
            if (rec.heart_rate) {
              hrSum += rec.heart_rate;
              hrCount++;
              if (maxHR === null || rec.heart_rate > maxHR) maxHR = rec.heart_rate;
            }

            if (rec.cadence) {
              let c = rec.cadence;
              if (c < 120) c = c * 2;
              cadSum += c;
              cadCount++;
            }

            if (rec.altitude !== undefined) {
              if (prevAlt !== null && rec.altitude > prevAlt) {
                const diff = rec.altitude - prevAlt;
                if (diff < 50) calculatedEleGain += diff;
              }
              prevAlt = rec.altitude;
            }
          }

          if (avgHR === null && hrCount > 0) avgHR = Math.round(hrSum / hrCount);
          if (avgCadence === null && cadCount > 0) avgCadence = Math.round(cadSum / cadCount);
          if (elevationGainMeters === 0) elevationGainMeters = Math.round(calculatedEleGain);
        }

        if (totalDistanceMeters < 100) {
          return reject(new Error('A distância detectada no arquivo .FIT é inferior a 100 metros.'));
        }

        const distanceKm = totalDistanceMeters / 1000;
        const paceSecondsPerKm = totalDurationSeconds > 0 ? Math.round(totalDurationSeconds / distanceKm) : 300;
        const vdot = calculateVDOT(totalDistanceMeters, totalDurationSeconds);

        resolve({
          name: activityName,
          date: activityDate,
          fileName,
          distanceKm: Math.round(distanceKm * 100) / 100,
          distanceMeters: Math.round(totalDistanceMeters),
          durationSeconds: Math.round(totalDurationSeconds),
          durationFormatted: formatTime(Math.round(totalDurationSeconds)),
          paceSecondsPerKm,
          paceFormatted: formatPace(paceSecondsPerKm),
          avgHR,
          maxHR,
          avgCadence,
          elevationGainMeters,
          vdot
        });
      });
    } catch (err: any) {
      reject(new Error(`Falha no processador de arquivos FIT: ${err.message || err}`));
    }
  });
}

/**
 * Universal Workout File Parser (.fit, .tcx, .gpx)
 */
export async function parseUniversalWorkoutFile(file: File): Promise<ParsedWorkout> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'fit') {
    const buffer = await file.arrayBuffer();
    return parseFitBuffer(buffer, file.name);
  }

  const textContent = await file.text();

  if (ext === 'tcx' || textContent.includes('<TrainingCenterDatabase') || textContent.includes('<Activity Sport=')) {
    return parseTcxContent(textContent, file.name);
  }

  if (ext === 'gpx' || textContent.includes('<gpx') || textContent.includes('<trk>')) {
    return parseGpxContent(textContent, file.name);
  }

  // Auto-detect based on text content if extension was missing
  if (textContent.includes('<TrainingCenterDatabase')) {
    return parseTcxContent(textContent, file.name);
  }

  if (textContent.includes('<gpx')) {
    return parseGpxContent(textContent, file.name);
  }

  throw new Error('Formato não suportado. Por favor, envie um arquivo .GPX, .TCX ou .FIT.');
}

/**
 * Aggregates multiple workouts (from mixed .gpx, .tcx, .fit files)
 * into a single unified physiological profile.
 */
export function aggregateWorkoutTelemetry(workouts: ParsedWorkout[]): MultiWorkoutTelemetrySummary {
  if (!workouts || workouts.length === 0) {
    throw new Error('Nenhum treino fornecido para consolidação.');
  }

  // Sort by date ascending
  const sorted = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let totalDistanceKm = 0;
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  let totalElevationGainMeters = 0;
  let hrSum = 0;
  let hrWeightSum = 0;
  let maxHrOverall: number | null = null;
  let cadSum = 0;
  let cadWeightSum = 0;

  let bestVdot = 0;
  let bestVdotWorkout: ParsedWorkout | null = null;
  let longestRunKm = 0;

  const formatCounts = { gpx: 0, tcx: 0, fit: 0 };

  for (const w of sorted) {
    totalDistanceKm += w.distanceKm;
    totalDistanceMeters += w.distanceMeters;
    totalDurationSeconds += w.durationSeconds;
    totalElevationGainMeters += w.elevationGainMeters;

    if (w.distanceKm > longestRunKm) {
      longestRunKm = w.distanceKm;
    }

    if (w.vdot > bestVdot) {
      bestVdot = w.vdot;
      bestVdotWorkout = w;
    }

    if (w.maxHR && (maxHrOverall === null || w.maxHR > maxHrOverall)) {
      maxHrOverall = w.maxHR;
    }

    if (w.avgHR && w.durationSeconds > 0) {
      hrSum += w.avgHR * w.durationSeconds;
      hrWeightSum += w.durationSeconds;
    }

    if (w.avgCadence && w.durationSeconds > 0) {
      cadSum += w.avgCadence * w.durationSeconds;
      cadWeightSum += w.durationSeconds;
    }

    const ext = w.fileName.split('.').pop()?.toLowerCase();
    if (ext === 'gpx') formatCounts.gpx++;
    else if (ext === 'tcx') formatCounts.tcx++;
    else if (ext === 'fit') formatCounts.fit++;
  }

  const avgHrOverall = hrWeightSum > 0 ? Math.round(hrSum / hrWeightSum) : null;
  const avgCadenceOverall = cadWeightSum > 0 ? Math.round(cadSum / cadWeightSum) : null;

  const avgPaceSecondsPerKm = totalDistanceKm > 0 ? Math.round(totalDurationSeconds / totalDistanceKm) : 300;

  // Calculate Date Span & Frequency
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const dayDiff = Math.max(1, Math.round(Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksSpan = Math.max(1, Math.round((dayDiff / 7) * 10) / 10);

  // Group workouts by calendar week to see real weekly volume
  const detectedWeeklyVolumeKm = Math.round((totalDistanceKm / weeksSpan) * 10) / 10;
  const detectedTrainingDays = Math.min(6, Math.max(2, Math.round(workouts.length / weeksSpan)));

  // Composite VDOT:
  // Best performance is primary indicator of VO2max capacity.
  // If we have multiple workouts, we weight the best VDOT at 75% and top-2 average at 25%.
  const vdotList = sorted.map(w => w.vdot).sort((a, b) => b - a);
  let compositeVdot = bestVdot;
  if (vdotList.length >= 2) {
    compositeVdot = Math.round(((vdotList[0] * 0.75) + (vdotList[1] * 0.25)) * 10) / 10;
  }

  return {
    workouts: sorted,
    totalWorkouts: workouts.length,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalDurationSeconds,
    totalDurationFormatted: formatTime(totalDurationSeconds),
    avgPaceSecondsPerKm,
    avgPaceFormatted: formatPace(avgPaceSecondsPerKm),
    longestRunKm: Math.round(longestRunKm * 100) / 100,
    bestVdot: Math.round(bestVdot * 10) / 10,
    bestVdotWorkout,
    compositeVdot,
    maxHrOverall,
    avgHrOverall,
    avgCadenceOverall,
    totalElevationGainMeters: Math.round(totalElevationGainMeters),
    detectedWeeklyVolumeKm: Math.max(8, detectedWeeklyVolumeKm),
    detectedTrainingDays: Math.min(6, Math.max(2, detectedTrainingDays)),
    detectedWeeksSpan: weeksSpan,
    dateRange: {
      start: sorted[0].date,
      end: sorted[sorted.length - 1].date
    },
    formatCounts
  };
}

/**
 * Universal Multi-Workout File Parser: accepts multiple files (.fit, .tcx, .gpx) simultaneously
 */
export async function parseMultipleWorkoutFiles(files: FileList | File[]): Promise<{
  parsedWorkouts: ParsedWorkout[];
  errors: string[];
  summary: MultiWorkoutTelemetrySummary | null;
}> {
  const fileArray = Array.from(files);
  const parsedWorkouts: ParsedWorkout[] = [];
  const errors: string[] = [];

  for (const file of fileArray) {
    try {
      const workout = await parseUniversalWorkoutFile(file);
      parsedWorkouts.push(workout);
    } catch (err: any) {
      errors.push(`${file.name}: ${err.message || 'Falha ao processar'}`);
    }
  }

  let summary: MultiWorkoutTelemetrySummary | null = null;
  if (parsedWorkouts.length > 0) {
    summary = aggregateWorkoutTelemetry(parsedWorkouts);
  }

  return {
    parsedWorkouts,
    errors,
    summary
  };
}

