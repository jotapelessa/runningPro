import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Mountain, 
  Calendar, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Code, 
  Database, 
  Server, 
  Clock, 
  ExternalLink,
  Flame,
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { BrazilianRace, RunnerState } from '../types';
import { calculateTrainingPaces, predictRaceTime, formatTime, formatPace } from '../lib/vdotCalculator';

interface RacesTabProps {
  runnerState: RunnerState;
  onSelectTargetRace?: (dist: string) => void;
}

const BRAZIL_STATES = [
  'ALL', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 
  'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const RacesTab: React.FC<RacesTabProps> = ({ runnerState, onSelectTargetRace }) => {
  const [races, setRaces] = useState<BrazilianRace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedElevation, setSelectedElevation] = useState('ALL');
  const [selectedRace, setSelectedRace] = useState<BrazilianRace | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'scraper' | 'ddl' | 'cron'>('catalog');

  // Live Scraper state
  const [scraperQuery, setScraperQuery] = useState('');
  const [scraperState, setScraperState] = useState('SP');
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperResults, setScraperResults] = useState<any>(null);

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scrape-races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateCode: 'ALL' }),
      });
      const data = await res.json();
      if (data && data.races) {
        setRaces(data.races);
        if (data.races.length > 0 && !selectedRace) {
          setSelectedRace(data.races[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load races:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestScraper = async () => {
    setScraperLoading(true);
    try {
      const res = await fetch('/api/scrape-races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scraperQuery, stateCode: scraperState }),
      });
      const data = await res.json();
      setScraperResults(data);
    } catch (err: any) {
      setScraperResults({ error: err.message });
    } finally {
      setScraperLoading(false);
    }
  };

  // Filtered races list
  const filteredRaces = races.filter((r) => {
    const matchesState = selectedState === 'ALL' || r.stateCode.toUpperCase() === selectedState;
    const matchesElevation = selectedElevation === 'ALL' || r.elevationProfile === selectedElevation;
    const matchesQuery = searchQuery === '' || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.distances.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesState && matchesElevation && matchesQuery;
  });

  // Calculate adjusted pacing for selected race
  const calculateAdjustedPacing = (race: BrazilianRace, distanceMeters: number) => {
    const standardVdot = runnerState.currentVdot;
    const adjustedVdot = Math.max(15, standardVdot + race.vdotOffset);

    const standardTimeSec = predictRaceTime(distanceMeters, standardVdot);
    const adjustedTimeSec = predictRaceTime(distanceMeters, adjustedVdot);

    const standardPaceSec = (standardTimeSec / distanceMeters) * 1000;
    const adjustedPaceSec = (adjustedTimeSec / distanceMeters) * 1000;

    return {
      standardTime: formatTime(standardTimeSec, distanceMeters >= 15000),
      adjustedTime: formatTime(adjustedTimeSec, distanceMeters >= 15000),
      standardPace: formatPace(standardPaceSec),
      adjustedPace: formatPace(adjustedPaceSec),
      diffSeconds: adjustedTimeSec - standardTimeSec,
      adjustedVdot,
    };
  };

  // Generate tactical splits for 5k, 10k, 21k, or 42k
  const getTacticalSplits = (race: BrazilianRace) => {
    let distMeters = 10000;
    let distName = '10k';
    if (race.distances.includes('42.2k')) { distMeters = 42195; distName = '42.2k'; }
    else if (race.distances.includes('21.1k')) { distMeters = 21097.5; distName = '21.1k'; }
    else if (race.distances.includes('10k')) { distMeters = 10000; distName = '10k'; }
    else if (race.distances.includes('5k')) { distMeters = 5000; distName = '5k'; }

    const pacing = calculateAdjustedPacing(race, distMeters);
    const targetPaceSec = (predictRaceTime(distMeters, pacing.adjustedVdot) / distMeters) * 1000;

    const totalKm = Math.floor(distMeters / 1000);
    const splits: Array<{ km: number; pace: string; strategy: string; hrTarget: string }> = [];

    for (let k = 1; k <= Math.min(totalKm, 10); k++) {
      let mod = 0;
      let strat = 'Ritmo Alvo Constante';
      if (k === 1) {
        mod = +6; // First km conservative
        strat = 'Controle Emocional / Largada Cautelosa';
      } else if (k === Math.floor(totalKm / 2)) {
        mod = 0;
        strat = 'Sustentação Aeróbica Estável';
      } else if (k === totalKm) {
        mod = -6; // Final kick
        strat = 'Aceleração Final / Sprint';
      }

      const athleteMaxHr = runnerState.macHR || runnerState.maxHr || 188;
      splits.push({
        km: k,
        pace: `${formatPace(targetPaceSec + mod)}/km`,
        strategy: strat,
        hrTarget: `${Math.round(athleteMaxHr * 0.88)} - ${Math.round(athleteMaxHr * 0.93)} bpm`,
      });
    }

    return { distName, pacing, splits };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            Circuito Nacional de Corridas
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-heading">
            Corridas no Brasil & Telemetria Geográfica
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Compensação de VDOT para altimetria, clima e perfil de relevo das maiores provas brasileiras.
          </p>
        </div>

        {/* Sub-tabs selector */}
        <div className="flex items-center gap-1.5 bg-[#121214] p-1.5 rounded-xl border border-white/10">
          <button
            id="subtab-btn-catalog"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Catálogo & Tática
          </button>
          <button
            id="subtab-btn-scraper"
            onClick={() => setActiveSubTab('scraper')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'scraper'
                ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hub Scraper IA
          </button>
          <button
            id="subtab-btn-ddl"
            onClick={() => setActiveSubTab('ddl')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'ddl'
                ? 'bg-[#FF4E00] text-white shadow-md shadow-[#FF4E00]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Esquema DDL
          </button>
        </div>
      </div>

      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="telemetry-card p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-race"
                type="text"
                placeholder="Buscar por nome da prova, cidade ou distância (ex: Maratona, São Paulo, 21k)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4E00]"
              />
            </div>

            {/* State UF select */}
            <div className="flex items-center gap-2">
              <select
                id="select-race-state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF4E00]"
              >
                <option value="ALL">Todos os Estados (27 UFs)</option>
                {BRAZIL_STATES.filter((s) => s !== 'ALL').map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>

              {/* Elevation select */}
              <select
                id="select-race-elevation"
                value={selectedElevation}
                onChange={(e) => setSelectedElevation(e.target.value)}
                className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#FF4E00]"
              >
                <option value="ALL">Qualquer Altimetria</option>
                <option value="Plano">Plano (Mais Rápido)</option>
                <option value="Misto">Misto / Ondulado</option>
                <option value="Técnico">Técnico / Pontes</option>
                <option value="Montanhoso">Montanhoso (Desafiador)</option>
              </select>
            </div>
          </div>

          {/* 2-Columns: Race List (5 Cols) + Race Intelligence Hub (7 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List */}
            <div className="lg:col-span-5 space-y-3 max-h-[680px] overflow-y-auto pr-1">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Provas Encontradas ({filteredRaces.length})</span>
                <span>Selecione para calibrar</span>
              </div>

              {filteredRaces.map((r) => {
                const isSelected = selectedRace?.id === r.id;
                return (
                  <div
                    key={r.id}
                    id={`race-card-${r.id}`}
                    onClick={() => setSelectedRace(r)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#140F0C] border-[#FF4E00] shadow-lg shadow-[#FF4E00]/20'
                        : 'bg-[#0A0A0A] border-white/10 hover:border-white/20 hover:bg-[#121214]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF4E00]/10 text-[#FF4E00] border border-[#FF4E00]/30 uppercase font-mono-data">
                          {r.stateCode} • {r.city}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                          {r.name}
                        </h4>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                        r.elevationProfile === 'Plano' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                        r.elevationProfile === 'Montanhoso' ? 'bg-red-950/60 text-red-400 border border-red-500/30' :
                        'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                      }`}>
                        {r.elevationProfile} (+{r.elevationGainM}m)
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {r.distances.map((dist, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono-data">
                          {dist}
                        </span>
                      ))}
                      <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1 font-mono-data">
                        <Calendar className="w-3 h-3" />
                        {r.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Race Intelligence Panel */}
            <div className="lg:col-span-7">
              {selectedRace ? (
                <div 
                  id="selected-race-telemetry-panel"
                  className="telemetry-card p-6 rounded-2xl border border-[#FF4E00]/30 space-y-6 bg-gradient-to-br from-[#0A0A0A] via-[#0D0907] to-[#120E0B]"
                >
                  {/* Header */}
                  <div className="border-b border-white/10 pb-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#FF4E00] font-bold uppercase tracking-wider">
                      <Trophy className="w-4 h-4" />
                      Análise de Percurso & Projeção Científica
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                      {selectedRace.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF4E00]" />
                        {selectedRace.city} - {selectedRace.state} ({selectedRace.stateCode})
                      </span>
                      <span className="flex items-center gap-1">
                        <Mountain className="w-3.5 h-3.5 text-amber-400" />
                        Altimetria: {selectedRace.elevationProfile} (+{selectedRace.elevationGainM}m)
                      </span>
                      <span className="flex items-center gap-1 font-mono-data text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Data prevista: {selectedRace.date}
                      </span>
                    </div>
                  </div>

                  {/* Comparative VDOT: Standard vs Adjusted */}
                  {(() => {
                    const tactical = getTacticalSplits(selectedRace);
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-1">
                            <div className="text-[11px] text-slate-400 font-semibold uppercase">
                              Projeção Padrão (VDOT {runnerState.currentVdot.toFixed(1)})
                            </div>
                            <div className="text-xl font-bold text-white font-mono-data">
                              {tactical.pacing.standardTime}
                            </div>
                            <div className="text-xs text-slate-400">
                              Pace Médio: <strong className="text-slate-200">{tactical.pacing.standardPace}/km</strong>
                            </div>
                          </div>

                          <div className="bg-[#18110D] p-4 rounded-xl border border-[#FF4E00]/40 space-y-1">
                            <div className="text-[11px] text-[#FF4E00] font-bold uppercase flex items-center justify-between">
                              <span>Ritmo Calibrado para Esta Prova</span>
                              <span className="text-[10px] font-mono-data">VDOT {tactical.pacing.adjustedVdot.toFixed(1)}</span>
                            </div>
                            <div className="text-xl font-bold text-[#FF4E00] font-mono-data">
                              {tactical.pacing.adjustedTime}
                            </div>
                            <div className="text-xs text-slate-300">
                              Pace Alvo: <strong className="text-white">{tactical.pacing.adjustedPace}/km</strong>
                              {tactical.pacing.diffSeconds !== 0 && (
                                <span className={`ml-1.5 font-semibold ${tactical.pacing.diffSeconds > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  ({tactical.pacing.diffSeconds > 0 ? `+${tactical.pacing.diffSeconds}s` : `${tactical.pacing.diffSeconds}s`})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tactical Advice */}
                        <div className="bg-[#050505] p-4 rounded-xl border border-white/10 space-y-2">
                          <div className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider flex items-center gap-1.5">
                            <Flame className="w-4 h-4" />
                            Diretrizes Táticas do Fisiologista
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {selectedRace.tacticalAdvice}
                          </p>
                        </div>

                        {/* Splits Table */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Parciais Estratégicas Sugeridas ({tactical.distName})
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="text-[11px] text-slate-400 bg-[#121214] border-b border-white/10 uppercase font-mono-data">
                                <tr>
                                  <th className="py-2 px-3">Quilômetro</th>
                                  <th className="py-2 px-3">Pace Sugerido</th>
                                  <th className="py-2 px-3">FC Alvo</th>
                                  <th className="py-2 px-3">Tática do Trecho</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono-data">
                                {tactical.splits.map((s) => (
                                  <tr key={s.km} className="hover:bg-white/[0.02]">
                                    <td className="py-2 px-3 font-bold text-white">KM {s.km}</td>
                                    <td className="py-2 px-3 text-[#FF4E00] font-bold">{s.pace}</td>
                                    <td className="py-2 px-3 text-slate-300">{s.hrTarget}</td>
                                    <td className="py-2 px-3 text-slate-400 font-sans">{s.strategy}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="telemetry-card p-12 text-center text-slate-500 text-xs">
                  Selecione uma corrida da lista ao lado para ver a análise tática completa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Scraper Test Hub */}
      {activeSubTab === 'scraper' && (
        <div className="space-y-6">
          <div className="telemetry-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider">
              <Server className="w-4 h-4" />
              ScrapingArchitect API Tester
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              Testador de Busca de Corridas em Tempo Real
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Consulte a API backend <code>POST /api/scrape-races</code> para capturar provas por palavras-chave e estado brasileiro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <input
                type="text"
                placeholder="Palavra-chave (ex: Noturna, Maratona, 10k)..."
                value={scraperQuery}
                onChange={(e) => setScraperQuery(e.target.value)}
                className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
              <select
                value={scraperState}
                onChange={(e) => setScraperState(e.target.value)}
                className="bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                {BRAZIL_STATES.map((uf) => (
                  <option key={uf} value={uf}>{uf === 'ALL' ? 'Todos os Estados' : uf}</option>
                ))}
              </select>
              <button
                onClick={handleTestScraper}
                disabled={scraperLoading}
                className="px-4 py-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {scraperLoading ? 'Consultando API...' : 'Executar Chamada API'}
              </button>
            </div>

            {scraperResults && (
              <div className="pt-4">
                <div className="text-xs text-slate-400 font-mono-data mb-1.5">Resultado JSON da API:</div>
                <pre className="bg-[#050505] p-4 rounded-xl border border-white/10 text-[11px] text-slate-300 font-mono-data overflow-x-auto max-h-72">
                  {JSON.stringify(scraperResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SubTab 3: DDL Schema */}
      {activeSubTab === 'ddl' && (
        <div className="space-y-6">
          <div className="telemetry-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              Esquema DDL PostgreSQL (Supabase / Cloud SQL)
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              Estrutura de Banco de Dados para Corridas Brasileiras
            </h3>
            <pre className="bg-[#050505] p-4 rounded-xl border border-white/10 text-xs text-[#22C55E] font-mono-data overflow-x-auto">
{`-- Tabela de Corridas do Brasil com Telemetria e Altimetria
CREATE TABLE IF NOT EXISTS brazilian_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  state_code VARCHAR(2) NOT NULL,
  date DATE NOT NULL,
  distances TEXT[] NOT NULL,
  elevation_profile VARCHAR(50) DEFAULT 'Plano',
  elevation_gain_m INT DEFAULT 0,
  vdot_offset NUMERIC(3,1) DEFAULT 0.0,
  tactical_advice TEXT,
  source_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX idx_races_state_code ON brazilian_races(state_code);
CREATE INDEX idx_races_date ON brazilian_races(date);
CREATE INDEX idx_races_elevation ON brazilian_races(elevation_profile);`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
