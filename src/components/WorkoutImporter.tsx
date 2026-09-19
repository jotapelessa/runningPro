import React, { useState, useRef } from 'react';
import { 
  Watch, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Zap, 
  Flame, 
  Heart, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  FileText,
  Sparkles
} from 'lucide-react';
import { RunnerState } from '../types';
import { parseGPX, parseTCX, ParsedWorkout } from '../lib/gpxParser';

interface WorkoutImporterProps {
  runnerState: RunnerState;
  onApplyWorkout: (workout: ParsedWorkout) => void;
}

export default function WorkoutImporter({ runnerState, onApplyWorkout }: WorkoutImporterProps) {
  const [workout, setWorkout] = useState<ParsedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'gpx' && extension !== 'tcx') {
      setError('Formato não suportado. Por favor, envie um arquivo .gpx ou .tcx exportado do app Zepp / Amazfit.');
      return;
    }

    try {
      const text = await file.text();
      let parsed: ParsedWorkout;

      if (extension === 'gpx') {
        parsed = parseGPX(text, file.name);
      } else {
        parsed = parseTCX(text, file.name);
      }

      setWorkout(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar o arquivo. Verifique se o treino possui dados de GPS.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl">
      
      {/* Header com identificação do Amazfit */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-[#FF4E00] flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,78,0,0.4)]">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base uppercase tracking-wider font-display">
                Importar do Amazfit T-Rex Pro
              </h3>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                Zepp GPX / TCX
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Exporte o treino no app Zepp (Opções &gt; Exportar faixa) e solte o arquivo aqui para calibrar seu VDOT.
            </p>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
          isDragging 
            ? 'border-[#FF4E00] bg-[#FF4E00]/10 scale-[1.01]' 
            : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".gpx,.tcx" 
          onChange={handleFileSelect} 
          className="hidden" 
        />
        
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
          <UploadCloud className="w-6 h-6 text-[#FF4E00]" />
        </div>

        <div>
          <span className="text-sm font-bold text-white block">
            Clique ou arraste o arquivo <span className="text-[#FF4E00]">.GPX</span> ou <span className="text-[#FF4E00]">.TCX</span> aqui
          </span>
          <span className="text-xs text-zinc-500 mt-1 block">
            Compatível com Amazfit (Zepp), Garmin, Strava e Coros
          </span>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado do Treino Importado */}
      {workout && (
        <div className="bg-[#121212] border border-white/15 rounded-2xl p-5 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Treino Analisado</span>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF4E00]" />
                {workout.activityName}
              </h4>
              <span className="text-xs text-zinc-400">{workout.startTime} • {workout.filename}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#FF4E00]/15 border border-[#FF4E00]/30 px-3.5 py-1.5 rounded-xl text-center self-start sm:self-center">
              <div>
                <span className="text-[9px] font-mono text-zinc-400 uppercase block font-bold">VDOT da Corrida</span>
                <span className="text-lg font-black text-[#FF4E00] font-mono leading-none">
                  {workout.calculatedVDOT.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de Estatísticas Extraídas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">Distância Total</span>
              <span className="text-base font-bold text-white">{workout.totalDistanceKm} km</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">Duração Real</span>
              <span className="text-base font-bold text-white">{workout.timeFormatted}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">Pace Médio</span>
              <span className="text-base font-bold text-[#FF4E00]">{workout.paceFormatted}</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">FC Média / Máx</span>
              <span className="text-base font-bold text-rose-400">
                {workout.avgHeartRate ? `${workout.avgHeartRate} / ${workout.maxHeartRate || '--'} bpm` : 'Não registrada'}
              </span>
            </div>
          </div>

          {/* Comparativo com VDOT Atual */}
          <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF4E00] shrink-0" />
              <span>
                Seu VDOT atual: <strong className="text-white">{runnerState.currentVdot.toFixed(1)}</strong> 
                {' ➔ '} 
                Treino importado: <strong className="text-[#FF4E00]">{workout.calculatedVDOT.toFixed(1)}</strong>
              </span>
            </div>

            <button
              onClick={() => onApplyWorkout(workout)}
              className="px-4 py-2 bg-[#FF4E00] hover:bg-amber-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(255,78,0,0.3)] transition uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Aplicar ao meu Perfil</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tutorial rápido de como exportar do Zepp */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs text-zinc-400 space-y-2">
        <span className="text-white font-bold block flex items-center gap-1.5">
          <Watch className="w-3.5 h-3.5 text-[#FF4E00]" />
          Como exportar o treino do seu Amazfit T-Rex Pro no celular:
        </span>
        <ol className="list-decimal list-inside space-y-1 text-zinc-400">
          <li>Abra o aplicativo <strong>Zepp</strong> no seu smartphone.</li>
          <li>Acesse a aba <strong>Exercício / Histórico</strong> e toque na corrida desejada.</li>
          <li>Toque no ícone de <strong>Compartilhar / Opções (...)</strong> no canto superior direito.</li>
          <li>Escolha <strong>Exportar faixa</strong> e selecione o formato <strong>GPX</strong> ou <strong>TCX</strong>.</li>
          <li>Envie o arquivo para o seu computador (ou abra o site pelo celular) e arraste para esta área!</li>
        </ol>
      </div>

    </div>
  );
}
