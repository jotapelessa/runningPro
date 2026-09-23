import React, { useState, useRef } from 'react';
import { 
  Watch, 
  UploadCloud, 
  AlertCircle, 
  Activity, 
  Sparkles,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  Star,
  CheckCheck
} from 'lucide-react';
import { ParsedWorkout, RunnerState, MultiWorkoutTelemetrySummary } from '../types';
import { parseMultipleWorkoutFiles, aggregateWorkoutTelemetry } from '../lib/workoutParser';

interface WorkoutImporterProps {
  runnerState?: RunnerState;
  onApplyVdot?: (newVdot: number, source: string) => void;
  onApplyWorkout?: (workout: ParsedWorkout) => void;
}

export const WorkoutImporter: React.FC<WorkoutImporterProps> = ({ 
  runnerState, 
  onApplyVdot,
  onApplyWorkout 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkout[]>([]);
  const [multiSummary, setMultiSummary] = useState<MultiWorkoutTelemetrySummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Demo Loaders
  const loadDemoWorkout = (type: '5k' | '10k' | '21k') => {
    setIsParsing(true);
    setErrorMessage(null);

    setTimeout(() => {
      let demo: ParsedWorkout;
      if (type === '5k') {
        demo = {
          name: 'Treino de Ritmo 5k (Amazfit)',
          date: new Date().toISOString().split('T')[0],
          fileName: 'amazfit_zepp_5k_tempo.tcx',
          distanceKm: 5.0,
          distanceMeters: 5000,
          durationSeconds: 1245,
          durationFormatted: '20:45',
          paceSecondsPerKm: 249,
          paceFormatted: '4:09',
          avgHR: 168,
          maxHR: 178,
          avgCadence: 176,
          elevationGainMeters: 35,
          vdot: 49.2,
        };
      } else if (type === '10k') {
        demo = {
          name: 'Corrida Contínua 10k (Strava GPX)',
          date: new Date().toISOString().split('T')[0],
          fileName: 'strava_10k_progression.gpx',
          distanceKm: 10.0,
          distanceMeters: 10000,
          durationSeconds: 2712,
          durationFormatted: '45:12',
          paceSecondsPerKm: 271,
          paceFormatted: '4:31',
          avgHR: 164,
          maxHR: 174,
          avgCadence: 172,
          elevationGainMeters: 80,
          vdot: 45.4,
        };
      } else {
        demo = {
          name: 'Longão de Meia Maratona (Garmin FIT)',
          date: new Date().toISOString().split('T')[0],
          fileName: 'garmin_long_run_21k.fit',
          distanceKm: 21.1,
          distanceMeters: 21100,
          durationSeconds: 5910,
          durationFormatted: '1:38:30',
          paceSecondsPerKm: 280,
          paceFormatted: '4:40',
          avgHR: 158,
          maxHR: 170,
          avgCadence: 174,
          elevationGainMeters: 140,
          vdot: 46.8,
        };
      }

      setParsedWorkouts([demo]);
      setMultiSummary(aggregateWorkoutTelemetry([demo]));
      setIsParsing(false);
    }, 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    setIsParsing(true);
    setErrorMessage(null);
    try {
      const { parsedWorkouts: newParsed, errors } = await parseMultipleWorkoutFiles(files);
      
      if (errors.length > 0 && newParsed.length === 0) {
        setErrorMessage(errors.join(' | '));
      } else if (newParsed.length > 0) {
        const combined = [...parsedWorkouts, ...newParsed];
        setParsedWorkouts(combined);
        const agg = aggregateWorkoutTelemetry(combined);
        setMultiSummary(agg);

        if (errors.length > 0) {
          setErrorMessage(`Processados ${newParsed.length} arquivos. Avisos em: ${errors.join(', ')}`);
        }
      }
    } catch (err: any) {
      console.error('Error parsing workout files:', err);
      setErrorMessage(err.message || 'Erro ao processar arquivos. Verifique se o formato é .GPX, .TCX ou .FIT válido.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveWorkout = (indexToRemove: number) => {
    const updated = parsedWorkouts.filter((_, idx) => idx !== indexToRemove);
    setParsedWorkouts(updated);
    if (updated.length > 0) {
      const agg = aggregateWorkoutTelemetry(updated);
      setMultiSummary(agg);
    } else {
      setMultiSummary(null);
    }
  };

  const handleClearAll = () => {
    setParsedWorkouts([]);
    setMultiSummary(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Target deviation calculation
  const effectiveVdot = multiSummary ? multiSummary.compositeVdot : 0;
  const currentProfileVdot = runnerState?.currentVdot || 47.5;
  const vdotDifference = effectiveVdot > 0 ? effectiveVdot - currentProfileVdot : 0;

  const isUncalibrated = runnerState?.isCalibrated === false || (runnerState?.currentVdot || 0) <= 0;

  const handleApply = () => {
    const workoutToApply = multiSummary?.bestVdotWorkout || parsedWorkouts[0];
    if (!workoutToApply) return;

    if (onApplyWorkout) {
      const calibratedWorkout = {
        ...workoutToApply,
        vdot: effectiveVdot,
      };
      onApplyWorkout(calibratedWorkout);
    } else if (onApplyVdot) {
      const sourceStr = multiSummary && multiSummary.totalWorkouts > 1 
        ? `${multiSummary.totalWorkouts} Arquivos (${multiSummary.formatCounts.fit} FIT, ${multiSummary.formatCounts.gpx} GPX, ${multiSummary.formatCounts.tcx} TCX)` 
        : `Treino: ${workoutToApply.fileName}`;
      onApplyVdot(effectiveVdot, sourceStr);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Uncalibrated Status Banner */}
      {isUncalibrated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#18110D] to-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300 font-heading">
                  Sistema Pronto para Calibração de Condição Física
                </span>
                <span className="text-[10px] uppercase font-mono-data bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Status: Zerado
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Envie 1 ou múltiplos arquivos (<strong>.GPX, .TCX, .FIT</strong>) juntos de corridas recentes. O PaceLab diagnosticará automaticamente seu <strong>VDOT, VO2máx Composto, Frequência Cardíaca Máxima, Zonas de Ritmo e gerará sua Planilha de Treino</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider font-mono-data">
            <Watch className="w-4 h-4" />
            Telemetria de Dispositivos Vestíveis
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-heading">
            Importar Treinos do Relógio (.GPX, .TCX, .FIT)
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Compatível com Garmin (.FIT), Strava (.GPX), Coros, Polar e Amazfit (.TCX). Suporte a carregamento simultâneo de múltiplos arquivos para calibração fisiológica completa.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Tutorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Results Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dropzone */}
          <div
            id="gpx-tcx-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`telemetry-card p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
              isDragging
                ? 'border-[#FF4E00] bg-[#FF4E00]/10 scale-[1.01]'
                : 'border-white/15 hover:border-[#FF4E00]/50 hover:bg-white/[0.02]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".gpx,.tcx,.fit"
              multiple
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00] mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-white font-bold text-base mb-1 font-heading">
              Arraste seus arquivos .GPX, .TCX ou .FIT aqui
            </h3>
            <p className="text-slate-400 text-xs max-w-sm mb-4">
              Você pode carregar <strong>os 3 tipos de uma vez</strong> (.GPX + .TCX + .FIT) para calcular perfeitamente o perfil atlético.
            </p>

            <span className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/10 transition-colors">
              Selecionar Arquivos do Computador
            </span>
          </div>

          {/* Quick Demo Pre-loaded Workouts */}
          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4E00]" />
                Não tem um arquivo agora? Teste com telemetrias reais de exemplo:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-demo-5k"
                onClick={() => loadDemoWorkout('5k')}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-[#FF4E00]/15 border border-white/10 hover:border-[#FF4E00]/40 text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white">5k Rápido (TCX)</div>
                <div className="text-[10px] text-slate-400 font-mono-data">5.0km • 20:45 (4:09/km)</div>
              </button>
              <button
                type="button"
                id="btn-demo-10k"
                onClick={() => loadDemoWorkout('10k')}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-[#FF4E00]/15 border border-white/10 hover:border-[#FF4E00]/40 text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white">10k Limiar (GPX)</div>
                <div className="text-[10px] text-slate-400 font-mono-data">10.0km • 45:12 (4:31/km)</div>
              </button>
              <button
                type="button"
                id="btn-demo-21k"
                onClick={() => loadDemoWorkout('21k')}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-[#FF4E00]/15 border border-white/10 hover:border-[#FF4E00]/40 text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white">Meia 21.1k (FIT)</div>
                <div className="text-[10px] text-slate-400 font-mono-data">21.1km • 1:38:30 (4:40/km)</div>
              </button>
            </div>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Aviso no processamento de atividades:</span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isParsing && (
            <div className="telemetry-card p-6 text-center text-slate-300 text-xs space-y-2">
              <RefreshCw className="w-6 h-6 text-[#FF4E00] animate-spin mx-auto" />
              <p>Processando telemetria cinética (.GPX, .TCX, .FIT) e agregando perfil VDOT...</p>
            </div>
          )}

          {/* Multi-Workout Consolidated Result Card */}
          {multiSummary && parsedWorkouts.length > 0 && (
            <div 
              id="parsed-workout-result"
              className="telemetry-card p-6 rounded-2xl border border-[#FF4E00]/40 space-y-5 bg-gradient-to-br from-[#0A0A0A] to-[#120E0B]"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/20 border border-[#FF4E00]/40 flex items-center justify-center text-[#FF4E00]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                      <span>{parsedWorkouts.length === 1 ? parsedWorkouts[0].name : `${parsedWorkouts.length} Corridas Consolidadas`}</span>
                      <span className="text-[10px] uppercase font-mono-data bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                        {multiSummary.formatCounts.fit > 0 ? `${multiSummary.formatCounts.fit} FIT ` : ''}
                        {multiSummary.formatCounts.gpx > 0 ? `${multiSummary.formatCounts.gpx} GPX ` : ''}
                        {multiSummary.formatCounts.tcx > 0 ? `${multiSummary.formatCounts.tcx} TCX` : ''}
                      </span>
                    </h4>
                    <span className="text-slate-400 text-xs font-mono-data">
                      {parsedWorkouts.length === 1 
                        ? `${parsedWorkouts[0].date} • ${parsedWorkouts[0].fileName}`
                        : `Intervalo: ${multiSummary.dateRange.start} até ${multiSummary.dateRange.end}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-semibold">
                      {parsedWorkouts.length > 1 ? 'VDOT Composto' : 'VDOT do Treino'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#FF4E00] font-mono-data">
                      {effectiveVdot.toFixed(1)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 transition-colors text-xs cursor-pointer"
                    title="Limpar telemetrias"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Consolidated Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase font-mono-data">Distância Total</div>
                  <div className="text-lg font-bold text-white font-mono-data">
                    {multiSummary.totalDistanceKm.toFixed(2)} <span className="text-xs text-slate-400 font-normal">km</span>
                  </div>
                </div>

                <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase font-mono-data">Tempo Acumulado</div>
                  <div className="text-lg font-bold text-white font-mono-data">
                    {multiSummary.totalDurationFormatted}
                  </div>
                </div>

                <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase font-mono-data">Pace Médio Global</div>
                  <div className="text-lg font-bold text-[#FF4E00] font-mono-data">
                    {multiSummary.avgPaceFormatted}<span className="text-xs text-slate-400 font-normal">/km</span>
                  </div>
                </div>

                <div className="bg-[#121214] p-3 rounded-xl border border-white/10">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase font-mono-data">FC Máx / Ganho</div>
                  <div className="text-lg font-bold text-white font-mono-data">
                    {multiSummary.maxHrOverall ? `${multiSummary.maxHrOverall} bpm` : '--'} <span className="text-xs text-slate-400 font-normal">({multiSummary.totalElevationGainMeters}m)</span>
                  </div>
                </div>
              </div>

              {/* Multi-Session Individual Rows */}
              {parsedWorkouts.length > 1 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Sessões Carregadas ({parsedWorkouts.length})</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#FF4E00] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Mais Arquivos
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {parsedWorkouts.map((w, idx) => {
                      const ext = w.fileName.split('.').pop()?.toUpperCase() || 'GPX';
                      const isPeak = w.vdot === multiSummary.bestVdot;

                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                            isPeak ? 'bg-[#18120E] border-[#FF4E00]/40' : 'bg-[#0A0A0A] border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`text-[9px] font-mono-data font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0 ${
                              ext === 'FIT' 
                                ? 'bg-blue-950/60 text-blue-300 border-blue-500/40' 
                                : ext === 'TCX' 
                                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' 
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            }`}>
                              .{ext}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[260px]">{w.fileName}</span>
                                {isPeak && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#FF4E00] bg-[#FF4E00]/15 px-1 rounded border border-[#FF4E00]/30 font-mono-data flex-shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-[#FF4E00]" /> Pico de VDOT
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono-data flex items-center gap-2 mt-0.5">
                                <span>{w.distanceKm.toFixed(2)} km</span>
                                <span>•</span>
                                <span>{w.durationFormatted}</span>
                                <span>•</span>
                                <span>{w.paceFormatted}/km</span>
                                {w.avgHR && <span>• {w.avgHR} bpm</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right font-mono-data">
                              <span className="text-[9px] text-slate-500 block">VDOT</span>
                              <span className="font-extrabold text-[#FF4E00] text-xs">{w.vdot.toFixed(1)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveWorkout(idx)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deviation Analysis */}
              <div className="bg-[#050505] p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-mono-data">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FF4E00]" />
                  Comparação com Perfil Atual ({currentProfileVdot.toFixed(1)}):
                </span>
                <span className={`font-bold font-mono-data ${vdotDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {vdotDifference >= 0 ? `+${vdotDifference.toFixed(1)} VDOT (Evolução)` : `${vdotDifference.toFixed(1)} VDOT`}
                </span>
              </div>

              {/* Apply Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#050505] p-4 rounded-xl border border-white/10">
                <div className="text-xs text-slate-300">
                  {isUncalibrated ? (
                    <span>Detectamos <strong>VDOT de {effectiveVdot.toFixed(1)}</strong> ({parsedWorkouts.length} atividade(s)). Deseja calibrar sua condição física atual?</span>
                  ) : (
                    <span>Deseja atualizar seu <strong>VDOT principal para {effectiveVdot.toFixed(1)}</strong> e recalcular todas as zonas?</span>
                  )}
                </div>
                <button
                  id="btn-apply-workout-vdot"
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2.5 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF4E00]/25 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Diagnosticar & Aplicar ao Perfil
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tutorial Zepp App & Smartwatches (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="telemetry-card p-6 space-y-4 border border-white/10">
            <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider font-mono-data">
              <HelpCircle className="w-4 h-4" />
              Passo a Passo
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              Como exportar do Zepp App (Amazfit) & Relógios
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              O ecossistema Amazfit, Garmin, Strava e Polar permite exportar seus arquivos para alimentar o motor PaceLab:
            </p>

            <ol className="space-y-3 pt-1">
              <li className="flex items-start gap-3 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-[#FF4E00]/20 text-[#FF4E00] font-bold flex items-center justify-center flex-shrink-0 text-[10px] font-mono-data mt-0.5">
                  1
                </span>
                <span>Abra o aplicativo <strong>Zepp</strong> (Amazfit), <strong>Garmin Connect</strong> ou <strong>Strava</strong>.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-[#FF4E00]/20 text-[#FF4E00] font-bold flex items-center justify-center flex-shrink-0 text-[10px] font-mono-data mt-0.5">
                  2
                </span>
                <span>Acesse o treino de corrida e selecione a opção de exportar <strong>.GPX, .TCX ou .FIT</strong>.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-[#FF4E00]/20 text-[#FF4E00] font-bold flex items-center justify-center flex-shrink-0 text-[10px] font-mono-data mt-0.5">
                  3
                </span>
                <span>Você pode selecionar <strong>vários arquivos de uma vez só</strong> ao clicar no botão ou arrastá-los para cá.</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-[#FF4E00]/20 text-[#FF4E00] font-bold flex items-center justify-center flex-shrink-0 text-[10px] font-mono-data mt-0.5">
                  4
                </span>
                <span>O algoritmo combina o histórico para calcular seu <strong>VDOT real e risco articular</strong>.</span>
              </li>
            </ol>

            <div className="pt-2 p-3 rounded-lg bg-[#121214] border border-white/5 text-[11px] text-slate-400">
              💡 <strong>Suporte Completo aos 3 Formatos:</strong>
              <div className="mt-1 space-y-0.5 text-[10px] font-mono-data">
                <div className="text-blue-400">● .FIT: Garmin Connect, Wahoo, Zwift</div>
                <div className="text-emerald-400">● .GPX: Strava, Coros, Komoot, Wikiloc</div>
                <div className="text-amber-400">● .TCX: Amazfit (Zepp), Polar Flow, Suunto</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
