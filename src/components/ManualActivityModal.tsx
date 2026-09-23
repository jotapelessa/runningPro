import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  UploadCloud, 
  Calendar, 
  Clock, 
  Navigation, 
  Heart, 
  Flame, 
  TrendingUp, 
  Footprints, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  Sparkles,
  CheckCheck,
  Activity as ActivityIcon
} from 'lucide-react';
import { UserActivity, ActivityType, RoutePoint, RunningShoe } from '../types';
import { createManualActivity } from '../lib/activitiesStorage';
import { parseGpxDetails } from '../lib/workoutParser';

interface ManualActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveActivity: (activity: UserActivity) => void;
  availableShoes?: RunningShoe[];
}

export const ManualActivityModal: React.FC<ManualActivityModalProps> = ({
  isOpen,
  onClose,
  onSaveActivity,
  availableShoes = []
}) => {
  if (!isOpen) return null;

  // Form State
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<ActivityType>('run');
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  });

  // Duration
  const [durationHours, setDurationHours] = useState<string>('0');
  const [durationMinutes, setDurationMinutes] = useState<string>('45');
  const [durationSeconds, setDurationSeconds] = useState<string>('00');

  // Distance
  const [distanceKm, setDistanceKm] = useState<string>('10.0');

  // Optional Metrics
  const [avgHr, setAvgHr] = useState<string>('155');
  const [maxHr, setMaxHr] = useState<string>('168');
  const [elevationGain, setElevationGain] = useState<string>('40');
  const [cadence, setCadence] = useState<string>('176');
  const [calories, setCalories] = useState<string>('');
  const [selectedShoe, setSelectedShoe] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Optional GPX Route Attachment & Parsing Feedback
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const [parsedRoute, setParsedRoute] = useState<RoutePoint[] | undefined>(undefined);
  const [gpxSuccessMessage, setGpxSuccessMessage] = useState<string | null>(null);
  const [isGpxParsing, setIsGpxParsing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle GPX upload for manual activity with full telemetry auto-fill
  const handleGpxFile = (file: File) => {
    setIsGpxParsing(true);
    setErrorMessage(null);
    setGpxSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error('O arquivo GPX está vazio.');
        }

        const parsed = parseGpxDetails(text, file.name);

        // 1. Pre-fill Distance
        setDistanceKm(parsed.distanceKm.toFixed(2));

        // 2. Pre-fill Duration
        setDurationHours(parsed.durationHours.toString());
        setDurationMinutes(parsed.durationMinutes.toString().padStart(2, '0'));
        setDurationSeconds(parsed.durationSecondsOnly.toString().padStart(2, '0'));

        // 3. Pre-fill Date & Time
        if (parsed.startTimeIso) {
          setDate(parsed.startTimeIso);
        }

        // 4. Pre-fill Title if appropriate
        if (parsed.name) {
          setTitle(parsed.name);
        } else {
          setTitle(parsed.activityType === 'walk' ? `Caminhada de ${parsed.distanceKm.toFixed(1)} km` : `Treino de ${parsed.distanceKm.toFixed(1)} km`);
        }

        // 5. Pre-fill Activity Type
        if (parsed.activityType) {
          setType(parsed.activityType);
        }

        // 6. Pre-fill Heart Rate (Avg & Max)
        if (parsed.avgHR) {
          setAvgHr(parsed.avgHR.toString());
        }
        if (parsed.maxHR) {
          setMaxHr(parsed.maxHR.toString());
        }

        // 7. Pre-fill Elevation Gain
        if (parsed.elevationGainMeters !== undefined && parsed.elevationGainMeters >= 0) {
          setElevationGain(parsed.elevationGainMeters.toString());
        }

        // 8. Pre-fill Cadence
        if (parsed.avgCadence) {
          setCadence(parsed.avgCadence.toString());
        }

        // 9. Pre-fill Calories
        if (parsed.calories) {
          setCalories(parsed.calories.toString());
        }

        // 10. Store Full High-Fidelity Route for Map & Stories
        setParsedRoute(parsed.routePoints);
        setGpxFileName(file.name);

        const hrInfo = parsed.avgHR ? ` • FC: ${parsed.avgHR} bpm` : '';
        const cadInfo = parsed.avgCadence ? ` • Cad: ${parsed.avgCadence} spm` : '';
        const eleInfo = parsed.elevationGainMeters ? ` • +${parsed.elevationGainMeters}m` : '';

        setGpxSuccessMessage(
          `✨ GPX importado com sucesso: ${parsed.distanceKm.toFixed(2)} km em ${parsed.durationFormatted} (${parsed.paceFormatted}/km)${hrInfo}${cadInfo}${eleInfo}`
        );
      } catch (err: any) {
        console.error('Failed to parse optional GPX:', err);
        setErrorMessage(err.message || 'Erro ao processar o arquivo GPX. Verifique se o formato está correto.');
      } finally {
        setIsGpxParsing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo GPX.');
      setIsGpxParsing(false);
    };

    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const dist = parseFloat(distanceKm.replace(',', '.'));
    if (isNaN(dist) || dist <= 0) {
      setErrorMessage('Por favor, informe uma distância válida maior que zero.');
      return;
    }

    const h = parseInt(durationHours) || 0;
    const m = parseInt(durationMinutes) || 0;
    const s = parseInt(durationSeconds) || 0;
    const totalSec = (h * 3600) + (m * 60) + s;

    if (totalSec <= 0) {
      setErrorMessage('Por favor, informe uma duração total maior que zero.');
      return;
    }

    // Check future date
    const selectedTime = new Date(date).getTime();
    const nowTime = Date.now() + (24 * 60 * 60 * 1000); // allow slight timezone leeway
    if (selectedTime > nowTime) {
      setErrorMessage('A data da atividade não pode ser no futuro.');
      return;
    }

    const newActivity = createManualActivity({
      title: title.trim() || (type === 'walk' ? `Caminhada de ${dist} km` : `Treino de ${dist} km`),
      type,
      date,
      distanceKm: dist,
      durationSeconds: totalSec,
      elevationGainMeters: parseInt(elevationGain) || undefined,
      avgHr: parseInt(avgHr) || undefined,
      maxHr: parseInt(maxHr) || undefined,
      cadenceSpm: parseInt(cadence) || undefined,
      calories: parseInt(calories) || undefined,
      shoeName: selectedShoe || undefined,
      notes: notes.trim() || undefined,
      route: parsedRoute
    });

    onSaveActivity(newActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#0e0e11] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#121216] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF4E00]/20 border border-[#FF4E00]/40 text-[#FF4E00]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                Registrar Atividade Manual
              </h2>
              <p className="text-xs text-slate-400">
                Adicione treinos realizados sem relógio ou anexe arquivos GPX (Zepp, Garmin, Strava, etc.)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {gpxSuccessMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-mono-data text-xs leading-relaxed">{gpxSuccessMessage}</span>
            </div>
          )}

          {/* Activity Type Selector */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Tipo de Atividade *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'run' as ActivityType, label: 'Corrida', icon: ActivityIcon },
                { id: 'walk' as ActivityType, label: 'Caminhada', icon: Compass },
                { id: 'trail' as ActivityType, label: 'Trilha / Trail', icon: TrendingUp },
                { id: 'treadmill' as ActivityType, label: 'Esteira', icon: Footprints }
              ].map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    type === t.id
                      ? 'bg-[#18110D] border-[#FF4E00] text-white font-bold shadow-md shadow-[#FF4E00]/20'
                      : 'bg-[#121214] border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <t.icon className={`w-4 h-4 ${type === t.id ? 'text-[#FF4E00]' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Título do Treino (Opcional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Rodagem Z2 no Parque"
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4E00]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Data e Horário *
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF4E00]"
              />
            </div>
          </div>

          {/* Distance and Duration (Mandatory) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#121214] p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                <Navigation className="w-3.5 h-3.5 text-[#FF4E00]" />
                Distância Total (km) *
              </label>
              <input
                type="text"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="Ex: 10.0"
                required
                className="w-full bg-[#080808] border border-white/10 rounded-xl px-3 py-2 text-white font-mono-data font-bold text-sm focus:outline-none focus:border-[#FF4E00]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Duração Total (H : Min : Seg) *
              </label>
              <div className="flex items-center gap-1.5 font-mono-data">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-1/3 bg-[#080808] border border-white/10 rounded-xl px-2 py-2 text-white text-center font-bold"
                  placeholder="0h"
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-1/3 bg-[#080808] border border-white/10 rounded-xl px-2 py-2 text-white text-center font-bold"
                  placeholder="45m"
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="w-1/3 bg-[#080808] border border-white/10 rounded-xl px-2 py-2 text-white text-center font-bold"
                  placeholder="00s"
                />
              </div>
            </div>
          </div>

          {/* Optional Physiological Metrics */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 font-mono-data uppercase block">
              Métricas Fisiológicas Complementares (Opcional)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono-data">
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">FC Média (bpm)</label>
                <input
                  type="number"
                  value={avgHr}
                  onChange={(e) => setAvgHr(e.target.value)}
                  placeholder="155"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-rose-400 focus:outline-none focus:border-[#FF4E00]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Elevação (+m)</label>
                <input
                  type="number"
                  value={elevationGain}
                  onChange={(e) => setElevationGain(e.target.value)}
                  placeholder="40"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-cyan-400 focus:outline-none focus:border-[#FF4E00]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Cadência (spm)</label>
                <input
                  type="number"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value)}
                  placeholder="176"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-emerald-400 focus:outline-none focus:border-[#FF4E00]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Calorias (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Auto"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-orange-400 focus:outline-none focus:border-[#FF4E00]"
                />
              </div>
            </div>
          </div>

          {/* Optional Footwear & GPX Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tênis Utilizado
              </label>
              <select
                value={selectedShoe}
                onChange={(e) => setSelectedShoe(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-white"
              >
                <option value="">Selecione ou deixe em branco</option>
                {availableShoes.map(shoe => (
                  <option key={shoe.id} value={shoe.name}>
                    {shoe.name} ({shoe.mileageKm} km rodados)
                  </option>
                ))}
                <option value="Nike Pegasus 40">Nike Pegasus 40</option>
                <option value="Asics Novablast 4">Asics Novablast 4</option>
                <option value="Vaporfly Next% 3">Vaporfly Next% 3</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Anexar Trajeto GPX (Opcional)
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full bg-[#121214] hover:bg-[#18181c] border border-dashed rounded-xl px-3 py-2 text-center cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                  gpxFileName ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20' : 'border-white/20 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isGpxParsing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FF4E00] border-t-transparent rounded-full animate-spin" />
                    <span>Lendo dados do GPX...</span>
                  </>
                ) : gpxFileName ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span className="truncate font-medium">{gpxFileName}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#FF4E00]" />
                    <span className="truncate">Selecionar arquivo .GPX</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleGpxFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Observações & Sensações do Treino
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Treino progressivo, cansaço baixo, hidratação a cada 3km..."
              rows={2}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4E00]"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold font-heading shadow-md shadow-[#FF4E00]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Atividade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

