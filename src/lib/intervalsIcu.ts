/**
 * Cliente para a API do Intervals.icu
 */
import { UserActivity } from '../types';

const BASE_URL = 'https://intervals.icu/api/v1';

export interface IntervalsAthlete {
  id: string;
  name: string;
  email?: string;
  ftp?: number;
  restingHR?: number;
  maxHR?: number;
  threshold_pace?: number;
}

export interface IntervalsActivity {
  id: string;
  start_date_local: string;
  type: string;
  name: string;
  distance: number; // metros
  moving_time: number; // segundos
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number; // m/s
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  icu_ftp?: number;
  icu_training_load?: number;
  icu_intensity?: number;
  icu_hr_zones?: number[];
  pace?: number;
}

/**
 * Cria o Header de Autenticação usando Basic Auth.
 */
function getAuthHeaders(athleteId: string, apiKey: string): HeadersInit {
  // A documentação do Intervals.icu requer que o username seja "API_KEY" 
  // e o password seja a própria API Key.
  const username = 'API_KEY';
  const credentials = btoa(`${username}:${apiKey}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Valida a conexão buscando o perfil do atleta.
 */
export async function fetchIntervalsProfile(athleteId: string, apiKey: string): Promise<IntervalsAthlete> {
  const targetId = athleteId || '0'; // '0' aponta para o atleta autenticado
  const response = await fetch(`${BASE_URL}/athlete/${targetId}`, {
    method: 'GET',
    headers: getAuthHeaders(athleteId, apiKey)
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Credenciais inválidas. Verifique seu ID e API Key do Intervals.icu.');
    }
    throw new Error(`Falha na API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca atividades concluídas do atleta num intervalo de datas.
 */
export async function fetchIntervalsActivities(
  athleteId: string, 
  apiKey: string,
  oldestDate: string,
  newestDate: string
): Promise<IntervalsActivity[]> {
  const targetId = athleteId || '0';
  
  // oldest e newest precisam estar no formato YYYY-MM-DDTHH:MM:SS
  // ou simplesmente YYYY-MM-DD (a API aceita strings de data)
  
  const query = new URLSearchParams({
    oldest: oldestDate,
    newest: newestDate
  });

  const response = await fetch(`${BASE_URL}/athlete/${targetId}/activities?${query.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(athleteId, apiKey)
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar atividades: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mapeia uma atividade do Intervals.icu para o formato interno UserActivity do PaceLab
 */
export function mapIntervalsToUserActivity(activity: IntervalsActivity): UserActivity {
  
  // average_speed está em m/s. km/h = m/s * 3.6
  const speedAvgKmh = activity.average_speed ? Math.round(activity.average_speed * 3.6 * 10) / 10 : 0;
  
  // paceSecondsPerKm = 1000 / average_speed
  let paceSecondsPerKm = 0;
  if (activity.average_speed && activity.average_speed > 0) {
    paceSecondsPerKm = Math.round(1000 / activity.average_speed);
  } else if (activity.distance > 0 && activity.moving_time > 0) {
    paceSecondsPerKm = Math.round((activity.moving_time / activity.distance) * 1000);
  }

  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = paceSecondsPerKm % 60;
  const paceFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  const durMins = Math.floor(activity.moving_time / 60);
  const durSecs = activity.moving_time % 60;
  let durationFormatted = `${durMins}:${durSecs.toString().padStart(2, '0')}`;
  if (durMins >= 60) {
    const hrs = Math.floor(durMins / 60);
    const remMins = durMins % 60;
    durationFormatted = `${hrs}:${remMins.toString().padStart(2, '0')}:${durSecs.toString().padStart(2, '0')}`;
  }

  // Verificar cadência:
  let cadence = activity.average_cadence;
  if (cadence) {
    // Se cadência for < 120 e for corrida, provavelmente é rpm em vez de spm
    if (cadence < 120 && (activity.type.toLowerCase() === 'run' || activity.type.toLowerCase() === 'virtualrun')) {
      cadence = Math.round(cadence * 2);
    } else {
      cadence = Math.round(cadence);
    }
  }

  return {
    id: `intervals-${activity.id}`,
    title: activity.name || 'Treino Intervals.icu',
    type: activity.type.toLowerCase() === 'run' || activity.type.toLowerCase() === 'virtualrun' ? 'run' : 'other',
    source: 'intervals.icu',
    sourceLabel: 'Intervals.icu',
    date: activity.start_date_local,
    distanceMeters: activity.distance,
    distanceKm: Math.round((activity.distance / 1000) * 100) / 100,
    durationSeconds: activity.moving_time,
    durationFormatted,
    paceSecondsPerKm,
    paceFormatted,
    speedAvgKmh,
    speedMaxKmh: activity.max_speed ? Math.round(activity.max_speed * 3.6 * 10) / 10 : 0,
    avgHr: activity.average_heartrate ? Math.round(activity.average_heartrate) : undefined,
    maxHr: activity.max_heartrate ? Math.round(activity.max_heartrate) : undefined,
    cadenceSpm: cadence,
    elevationGainMeters: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : 0,
    notes: `Sincronizado do Intervals.icu (Carga: ${activity.icu_training_load || 'N/A'})`,
  };
}
