import React, { useState } from 'react';
import { HistoricalLandslide } from '../types/landguard';
import {
  History,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  MapPin,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

interface HistoricalViewProps {
  historicalLandslides: HistoricalLandslide[];
  onSelectOnMap?: (locationName: string) => void;
}

export const HistoricalView: React.FC<HistoricalViewProps> = ({
  historicalLandslides,
  onSelectOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('ALL');

  const states = ['ALL', ...Array.from(new Set(historicalLandslides.map((h) => h.state)))];
  const triggers = ['ALL', ...Array.from(new Set(historicalLandslides.map((h) => h.trigger)))];

  const filtered = historicalLandslides.filter((item) => {
    const matchesSearch =
      item.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.damageSummary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'ALL' || item.state === selectedState;
    const matchesTrigger = selectedTrigger === 'ALL' || item.trigger === selectedTrigger;
    return matchesSearch && matchesState && matchesTrigger;
  });

  const totalCasualties = historicalLandslides.reduce((acc, curr) => acc + curr.casualties, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            GEOLOGICAL SURVEY OF INDIA & REGIONAL ARCHIVE
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight font-display mt-0.5">
            HISTORICAL LANDSLIDE REPOSITORY & TRENDS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Archival records of major slope failures, triggers, and impact analysis across North East India
          </p>
        </div>

        {/* Top summary badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Total Recorded Casualties:</span>{' '}
            <strong className="text-rose-400">{totalCasualties} souls</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search incident, location, or damage report..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-400 font-mono cursor-pointer"
          >
            {states.map((st) => (
              <option key={st} value={st}>
                State: {st}
              </option>
            ))}
          </select>

          {/* Trigger Filter */}
          <select
            value={selectedTrigger}
            onChange={(e) => setSelectedTrigger(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-400 font-mono cursor-pointer"
          >
            {triggers.map((tr) => (
              <option key={tr} value={tr}>
                Trigger: {tr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Historical Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                    {item.state}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">{item.locationName}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  District: {item.district} (Lat: {item.lat.toFixed(4)}°, Lng: {item.lng.toFixed(4)}°)
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    item.severity === 'Catastrophic'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                      : item.severity === 'Severe'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                  }`}
                >
                  {item.severity}
                </span>
                {item.casualties > 0 && (
                  <div className="text-[11px] text-rose-400 font-mono font-semibold mt-1">
                    {item.casualties} Casualties
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
              <div>
                <strong className="text-slate-400">Trigger Mechanism:</strong>{' '}
                <span className="text-amber-300 font-medium">{item.trigger}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{item.damageSummary}</p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
              <span className="truncate pr-2">Official Record: {item.source}</span>
              <span className="shrink-0 font-mono text-purple-400 font-medium">Verified GSI Archive</span>
            </div>
          </div>
        ))}
      </div>

      {/* Structural Mitigation Learnings Section */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Key Structural Engineering Learnings for North East India
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-cyan-400">Pore-Water Drainage</strong>
            <p className="text-slate-400">
              Perforated sub-surface horizontal PVC drains relieve hydrostatic pressures behind colluvial mantles before failure.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-amber-400">Soil Nailing & Bio-engineering</strong>
            <p className="text-slate-400">
              Deep soil nailing combined with vetiver grass root reinforcement stabilizes fragile phyllite cut-slopes along NH-10 and NH-29.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-rose-400">Toe Support & Catchment Walls</strong>
            <p className="text-slate-400">
              Heavy gabion and reinforced concrete retaining walls prevent river toe erosion and channel blockages along mountain torrents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
