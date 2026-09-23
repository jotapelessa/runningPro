import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Navigation, 
  Heart, 
  Flame, 
  TrendingUp, 
  Clock, 
  Gauge, 
  Footprints,
  Activity as ActivityIcon,
  Compass,
  Sun,
  Moon
} from 'lucide-react';
import { UserActivity, RoutePoint } from '../types';

interface ActivityHudMapProps {
  activity: UserActivity;
  className?: string;
}

export const ActivityHudMap: React.FC<ActivityHudMapProps> = ({ activity, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const route = activity.route || [];
  const hasRoute = route.length >= 2;

  // Compute SVG projection bounds with comfortable margin
  const getBounds = () => {
    if (!hasRoute) return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    route.forEach(p => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latSpan = Math.max(maxLat - minLat, 0.001);
    const lngSpan = Math.max(maxLng - minLng, 0.001);

    const latPad = latSpan * 0.18;
    const lngPad = lngSpan * 0.18;

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad
    };
  };

  const bounds = getBounds();

  // Convert lat/lng to SVG coordinates [0..1000, 0..560]
  const projectPoint = (lat: number, lng: number): [number, number] => {
    if (!hasRoute) return [500, 280];
    const width = 1000;
    const height = 560;
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return [Math.max(40, Math.min(960, x)), Math.max(40, Math.min(520, y))];
  };

  // Build SVG polyline path
  const svgPath = hasRoute
    ? route.map((p, i) => {
        const [x, y] = projectPoint(p.lat, p.lng);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ')
    : '';

  // Current active point for telemetry during replay
  const currentPoint: RoutePoint = hasRoute
    ? route[Math.min(replayIndex, route.length - 1)]
    : { lat: 0, lng: 0, hr: activity.avgHr, speed: activity.speedAvgKmh, ele: activity.elevationGainMeters };

  // Route Replay animation loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && hasRoute) {
      const intervalMs = Math.max(40, 350 / playbackSpeed);
      timer = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= route.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, hasRoute, route.length]);

  // Current replay telemetry values
  const progressRatio = hasRoute ? (replayIndex / Math.max(1, route.length - 1)) : 1;
  const currentDistanceKm = (activity.distanceKm * progressRatio).toFixed(2);
  const currentSeconds = Math.round(activity.durationSeconds * progressRatio);
  const currentFormattedTime = currentSeconds >= 3600
    ? `${Math.floor(currentSeconds / 3600)}:${Math.floor((currentSeconds % 3600) / 60).toString().padStart(2, '0')}:${(currentSeconds % 60).toString().padStart(2, '0')}`
    : `${Math.floor(currentSeconds / 60)}:${(currentSeconds % 60).toString().padStart(2, '0')}`;
  
  const currentHr = currentPoint.hr || activity.avgHr || 0;
  const currentSpeed = currentPoint.speed || activity.speedAvgKmh || 0;
  const currentPaceSec = currentSpeed > 0 ? Math.round(3600 / currentSpeed) : activity.paceSecondsPerKm;
  const currentPaceFormatted = `${Math.floor(currentPaceSec / 60)}:${(currentPaceSec % 60).toString().padStart(2, '0')}`;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const startCoord = hasRoute ? projectPoint(route[0].lat, route[0].lng) : [500, 280];
  const endCoord = hasRoute ? projectPoint(route[route.length - 1].lat, route[route.length - 1].lng) : [500, 280];
  const replayCoord = hasRoute ? projectPoint(currentPoint.lat, currentPoint.lng) : [500, 280];

  const isDark = themeMode === 'dark';

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden border shadow-xl flex flex-col justify-between select-none transition-colors duration-300 ${
        isDark ? 'bg-[#0f1115] border-white/10 text-white' : 'bg-[#f4f4f6] border-slate-200 text-slate-900'
      } ${className}`}
      style={{ minHeight: '520px' }}
    >
      {/* 1. MAP BACKGROUND LAYER (Soft Strava-style Cartography) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {isDark ? (
          // Dark Map Canvas
          <div className="w-full h-full bg-[#111317]">
            {/* Soft Geographic Features */}
            <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stravaRoadsDark" width="120" height="120" patternUnits="userSpaceOnUse">
                  <path d="M 0 30 Q 60 40 120 20 M 30 0 Q 45 60 40 120 M 90 0 L 90 120 M 0 90 Q 60 75 120 95" stroke="#222834" strokeWidth="2.5" fill="none" />
                </pattern>
                <pattern id="stravaParksDark" width="300" height="300" patternUnits="userSpaceOnUse">
                  <circle cx="80" cy="80" r="50" fill="#13241c" />
                  <circle cx="240" cy="220" r="70" fill="#13241c" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stravaParksDark)" />
              <rect width="100%" height="100%" fill="url(#stravaRoadsDark)" />
            </svg>
            <div className="absolute inset-0 bg-radial from-transparent via-[#111317]/50 to-[#111317]/90" />
          </div>
        ) : (
          // Light Map Canvas
          <div className="w-full h-full bg-[#f1f3f5]">
            {/* Soft Geographic Features */}
            <svg className="w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stravaRoadsLight" width="120" height="120" patternUnits="userSpaceOnUse">
                  <path d="M 0 30 Q 60 40 120 20 M 30 0 Q 45 60 40 120 M 90 0 L 90 120 M 0 90 Q 60 75 120 95" stroke="#e2e6ea" strokeWidth="3" fill="none" />
                </pattern>
                <pattern id="stravaParksLight" width="300" height="300" patternUnits="userSpaceOnUse">
                  <circle cx="80" cy="80" r="50" fill="#e3f0e8" />
                  <circle cx="240" cy="220" r="70" fill="#e3f0e8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stravaParksLight)" />
              <rect width="100%" height="100%" fill="url(#stravaRoadsLight)" />
            </svg>
            <div className="absolute inset-0 bg-radial from-transparent via-[#f1f3f5]/40 to-[#f1f3f5]/80" />
          </div>
        )}
      </div>

      {/* 2. SVG VECTOR ROUTE (Authentic Strava Orange #FC4C02 with Halo Underlay) */}
      {hasRoute ? (
        <svg 
          viewBox="0 0 1000 560" 
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Contrast Halo / Underlay */}
          <path
            d={svgPath}
            fill="none"
            stroke={isDark ? '#0b0c10' : '#ffffff'}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isDark ? '0.9' : '0.95'}
          />

          {/* Strava Official Orange Polyline (#FC4C02) */}
          <path
            d={svgPath}
            fill="none"
            stroke="#FC4C02"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start Point (Discrete Green Circle) */}
          <circle cx={startCoord[0]} cy={startCoord[1]} r="7.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />

          {/* Finish Point (Discrete Black/Finish Circle) */}
          <circle cx={endCoord[0]} cy={endCoord[1]} r="7.5" fill={isDark ? '#FFFFFF' : '#0F172A'} stroke="#FC4C02" strokeWidth="2.5" />

          {/* Interactive Replay Animated Point */}
          {isPlaying && (
            <g>
              <circle cx={replayCoord[0]} cy={replayCoord[1]} r="16" fill="#FC4C02" opacity="0.3" className="animate-ping" />
              <circle cx={replayCoord[0]} cy={replayCoord[1]} r="7" fill="#FC4C02" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
          )}
        </svg>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-black/20">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-500 shadow-sm border border-slate-200'
          }`}>
            <Navigation className="w-6 h-6 text-[#FC4C02]" />
          </div>
          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Percurso GPS Não Disponível
          </h4>
          <p className={`text-xs max-w-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Esta atividade foi inserida sem dados de geolocalização. As métricas e telemetria abaixo foram calculadas com exatidão.
          </p>
        </div>
      )}

      {/* 3. TOP FLOATING HEADER (Strava Header Bar) */}
      <div className="relative z-20 p-4 sm:p-5 flex items-center justify-between gap-3">
        {/* Left: Sport Icon + Title + Meta */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm backdrop-blur-md transition-colors ${
          isDark ? 'bg-[#18191d]/90 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
        }`}>
          <div className="p-2 rounded-lg bg-[#FC4C02]/10 text-[#FC4C02]">
            {activity.type === 'walk' ? <Compass className="w-5 h-5" /> : <ActivityIcon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                {activity.title}
              </h3>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                activity.source === 'google_fit' || activity.source === 'health_connect'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-500/30'
                  : 'bg-orange-50 text-[#FC4C02] border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-500/30'
              }`}>
                {activity.sourceLabel || activity.source}
              </span>
            </div>
            <div className={`flex items-center gap-2 text-xs font-normal mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span>{new Date(activity.date).toLocaleDateString('pt-BR')} às {new Date(activity.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              {activity.shoeName && <span>• 👟 {activity.shoeName}</span>}
            </div>
          </div>
        </div>

        {/* Right: Quick Controls (Theme Toggle & Fullscreen) */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border shadow-sm backdrop-blur-md ${
          isDark ? 'bg-[#18191d]/90 border-white/10' : 'bg-white/95 border-slate-200'
        }`}>
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4. BOTTOM FLOATING HUD: STRAVA BIG THREE + SECONDARY TELEMETRY */}
      <div className="relative z-20 p-4 sm:p-5 space-y-3 mt-auto">
        {/* THE "BIG THREE" HERO METRICS (Distância | Tempo | Pace) */}
        <div className={`rounded-xl border shadow-lg backdrop-blur-md overflow-hidden transition-colors ${
          isDark ? 'bg-[#18191d]/95 border-white/10' : 'bg-white/95 border-slate-200'
        }`}>
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/10">
            {/* 1. Distância */}
            <div className="p-3 sm:p-4 text-center">
              <span className={`block text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Distância
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {isPlaying ? currentDistanceKm : activity.distanceKm.toFixed(2)}
                </span>
                <span className={`text-xs sm:text-sm font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  km
                </span>
              </div>
            </div>

            {/* 2. Tempo em Movimento */}
            <div className="p-3 sm:p-4 text-center">
              <span className={`block text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Tempo
              </span>
              <div className="mt-1 flex items-baseline justify-center">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {isPlaying ? currentFormattedTime : activity.durationFormatted}
                </span>
              </div>
            </div>

            {/* 3. Ritmo Médio (Pace) */}
            <div className="p-3 sm:p-4 text-center">
              <span className={`block text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Ritmo Médio
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {isPlaying ? currentPaceFormatted : activity.paceFormatted}
                </span>
                <span className={`text-xs sm:text-sm font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  /km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY METRICS ROW (Elevação, FC Média, Calorias, Cadência) */}
        <div className={`p-3 rounded-xl border shadow-sm backdrop-blur-md flex flex-wrap items-center justify-around gap-4 text-xs font-semibold ${
          isDark ? 'bg-[#14161a]/90 border-white/10 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'
        }`}>
          {/* Elevação */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Ganho Elev.</span>
              <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activity.elevationGainMeters || 0} m
              </span>
            </div>
          </div>

          {/* Frequência Cardíaca */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">FC Média</span>
              <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isPlaying ? (currentHr || '--') : (activity.avgHr || '--')} bpm
              </span>
            </div>
          </div>

          {/* Calorias */}
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Calorias</span>
              <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activity.calories || Math.round(activity.distanceKm * 68)} kcal
              </span>
            </div>
          </div>

          {/* Cadência */}
          {activity.cadenceSpm && (
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Cadência</span>
                <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activity.cadenceSpm} spm
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. REPLAY TIMELINE CONTROL (Clean Strava Replay) */}
        {hasRoute && (
          <div className={`p-2.5 sm:p-3 rounded-xl border shadow-sm backdrop-blur-md flex items-center gap-3 transition-colors ${
            isDark ? 'bg-[#14161a]/90 border-white/10' : 'bg-white/90 border-slate-200'
          }`}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#e04302] text-white font-bold text-xs shadow transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isPlaying ? 'Pausar' : 'Replay'}</span>
            </button>

            <button
              onClick={() => {
                setReplayIndex(0);
                setIsPlaying(false);
              }}
              title="Reiniciar Rota"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 text-[11px] font-mono">
              {[1, 2, 5].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-[#FC4C02] text-white font-bold'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Scrubber */}
            <input
              type="range"
              min="0"
              max={Math.max(1, route.length - 1)}
              value={replayIndex}
              onChange={(e) => {
                setReplayIndex(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg accent-[#FC4C02] cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
