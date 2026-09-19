import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Heart, 
  HelpCircle,
  TrendingDown,
  Sparkles,
  Info
} from 'lucide-react';
import { PainReport, PainSeverity, PainOccurrence, RunnerState } from '../types';

interface PainTrackerProps {
  runnerState: RunnerState;
  onUpdatePains: (updatedPains: PainReport[]) => void;
}

export default function PainTracker({ runnerState, onUpdatePains }: PainTrackerProps) {
  const [location, setLocation] = useState<string>('Joelho (Patela / ITB)');
  const [severity, setSeverity] = useState<PainSeverity>('moderate');
  const [occurrence, setOccurrence] = useState<PainOccurrence>('during_run');
  const [notes, setNotes] = useState<string>('');

  const commonLocations = [
    'Joelho (Patela / ITB)',
    'Canela (Canelite / Tíbia)',
    'Têndão de Aquiles',
    'Pé (Fascite Plantar / Arco)',
    'Tornozelo (Lateral / Medial)',
    'Quadril / Glúteo',
    'Posterior da Coxa (Isquiotibiais)',
    'Quadríceps',
    'Coluna / Lombares'
  ];

  const activePains = (runnerState.pains || []).filter(p => !p.resolved);
  const resolvedPains = (runnerState.pains || []).filter(p => p.resolved);

  // Calculate Readiness Index (0 - 100%)
  const calculateReadiness = (): { score: number; label: string; color: string } => {
    if (activePains.length === 0) {
      return { score: 100, label: 'Excelente (Pronto para Evoluir)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }

    let penalty = 0;
    activePains.forEach(p => {
      let base = p.severity === 'severe' ? 40 : p.severity === 'moderate' ? 20 : 10;
      let occMult = p.occurrence === 'continuous' ? 1.5 : p.occurrence === 'during_run' ? 1.2 : 1.0;
      penalty += base * occMult;
    });

    const score = Math.max(10, Math.round(100 - penalty));

    if (score >= 80) {
      return { score, label: 'Atenção Leve (Carga Mantida com Cuidado)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    } else if (score >= 50) {
      return { score, label: 'Modo de Segurança (Intensidades Reduzidas)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    } else {
      return { score, label: 'Alerta Vermelho (Priorize Regenerativo e Descanso)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
  };

  const readiness = calculateReadiness();

  const handleAddPain = (e: React.FormEvent) => {
    e.preventDefault();
    const newPain: PainReport = {
      id: Date.now().toString(),
      location,
      severity,
      occurrence,
      date: new Date().toLocaleDateString('pt-BR'),
      resolved: false,
      notes: notes.trim() || undefined
    };

    onUpdatePains([...(runnerState.pains || []), newPain]);
    setNotes('');
  };

  const handleToggleResolve = (id: string) => {
    const updated = (runnerState.pains || []).map(p => {
      if (p.id === id) {
        return { ...p, resolved: !p.resolved };
      }
      return p;
    });
    onUpdatePains(updated);
  };

  const handleDelete = (id: string) => {
    const updated = (runnerState.pains || []).filter(p => p.id !== id);
    onUpdatePains(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Status Indicator (Readiness Index) */}
      <div className={`p-5 rounded-2xl border ${readiness.color} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center font-mono text-xl font-black shrink-0">
            {readiness.score}%
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/50">Índice de Prontidão Fisiológica</div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">{readiness.label}</h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              {activePains.length === 0 
                ? 'Nenhuma dor ativa reportada. Planilha ajustada para máximo desempenho!' 
                : `${activePains.length} incômodo(s) ativo(s) detectado(s). O sistema recalibrou automaticamente as cargas dos seus treinos.`}
            </p>
          </div>
        </div>

        {activePains.length > 0 && (
          <div className="text-xs font-mono bg-black/40 px-3 py-2 rounded-xl border border-white/10 text-amber-300 flex items-center gap-2 self-start md:self-center shrink-0">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <span>Fator de Carga Adaptado na Planilha</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Form para novo registro */}
        <div className="lg:col-span-5 bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider font-display">
            <Plus className="w-4 h-4 text-[#FF4E00]" />
            <span>Registrar Novo Incômodo / Dor</span>
          </div>

          <form onSubmit={handleAddPain} className="space-y-4 text-xs">
            
            {/* Local da Dor */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium">Local do Incômodo / Articulação:</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#121212] border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-sans focus:outline-none focus:border-[#FF4E00] transition"
              >
                {commonLocations.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Nível de Intensidade */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium">Nível de Intensidade da Dor:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity('light')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-[11px] ${
                    severity === 'light' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  🟢 Leve (Suportável)
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('moderate')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-[11px] ${
                    severity === 'moderate' 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  🟡 Moderada (Altera Passada)
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('severe')}
                  className={`py-2 px-2 rounded-xl font-bold border transition text-[11px] ${
                    severity === 'severe' 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' 
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  🔴 Forte (Aguda / Dói Muito)
                </button>
              </div>
            </div>

            {/* Comportamento da Dor */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium">Comportamento da Dor:</label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  occurrence === 'on_start' ? 'bg-[#FF4E00]/10 border-[#FF4E00]/40 text-white' : 'bg-white/5 border-white/5 text-zinc-400'
                }`}>
                  <input
                    type="radio"
                    name="occurrence"
                    value="on_start"
                    checked={occurrence === 'on_start'}
                    onChange={() => setOccurrence('on_start')}
                    className="accent-[#FF4E00]"
                  />
                  <span>⚡ Apenas ao aquecer / trocar de ritmo</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  occurrence === 'during_run' ? 'bg-[#FF4E00]/10 border-[#FF4E00]/40 text-white' : 'bg-white/5 border-white/5 text-zinc-400'
                }`}>
                  <input
                    type="radio"
                    name="occurrence"
                    value="during_run"
                    checked={occurrence === 'during_run'}
                    onChange={() => setOccurrence('during_run')}
                    className="accent-[#FF4E00]"
                  />
                  <span>🏃 Durante a corrida (persistente em movimento)</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  occurrence === 'continuous' ? 'bg-[#FF4E00]/10 border-[#FF4E00]/40 text-white' : 'bg-white/5 border-white/5 text-zinc-400'
                }`}>
                  <input
                    type="radio"
                    name="occurrence"
                    value="continuous"
                    checked={occurrence === 'continuous'}
                    onChange={() => setOccurrence('continuous')}
                    className="accent-[#FF4E00]"
                  />
                  <span>⚠️ Contínua (dói em repouso, ao andar e correndo)</span>
                </label>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium">Observações adicionais (opcional):</label>
              <input
                type="text"
                placeholder="Ex: Começou após o treino de tiro de terça-feira..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#121212] border border-white/15 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-[#FF4E00] transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FF4E00] hover:bg-amber-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(255,78,0,0.3)] transition uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Incômodo</span>
            </button>

          </form>
        </div>

        {/* Lista de registros ativos e histórico */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-display flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF4E00]" />
              <span>Dores & Incômodos Ativos ({activePains.length})</span>
            </h4>
          </div>

          {activePains.length === 0 ? (
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <div className="text-sm font-bold text-white">Nenhum Incômodo Ativo</div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Você não possui dores registradas no momento. Mantenha os treinos estruturados e desfrute da sua evolução contínua!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePains.map((pain) => (
                <div 
                  key={pain.id}
                  className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 space-y-3 hover:border-white/20 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        pain.severity === 'severe' ? 'bg-rose-500' : pain.severity === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                      <h5 className="font-bold text-white text-sm">{pain.location}</h5>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{pain.date}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 font-sans">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block">Intensidade:</span>
                      <span className="font-bold capitalize">
                        {pain.severity === 'severe' ? '🔴 Forte' : pain.severity === 'moderate' ? '🟡 Moderada' : '🟢 Leve'}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block">Ocorrência:</span>
                      <span className="font-medium text-amber-200">
                        {pain.occurrence === 'continuous' ? 'Contínua (Repouso e Treino)' : pain.occurrence === 'during_run' ? 'Durante a Corrida' : 'Ao trocar de ritmo / aquecer'}
                      </span>
                    </div>
                  </div>

                  {pain.notes && (
                    <div className="text-xs text-zinc-400 italic bg-white/5 p-2 rounded-lg">
                      "{pain.notes}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleToggleResolve(pain.id)}
                      className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar como Recuperado</span>
                    </button>

                    <button
                      onClick={() => handleDelete(pain.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1.5 transition cursor-pointer"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Histórico de Recuperados */}
          {resolvedPains.length > 0 && (
            <div className="pt-4 space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">Histórico de Incômodos Curados ({resolvedPains.length})</span>
              <div className="space-y-2">
                {resolvedPains.map((pain) => (
                  <div key={pain.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="line-through">{pain.location} ({pain.severity})</span>
                    </div>
                    <button 
                      onClick={() => handleToggleResolve(pain.id)}
                      className="text-[10px] text-zinc-500 hover:text-white font-mono underline cursor-pointer"
                    >
                      Reabrir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
