import React, { useState } from 'react';
import { LocationFullReport, HistoricalLandslide } from '../types/landguard';
import { MapComponent } from '../components/MapComponent';
import {
  MapPin,
  Search,
  Filter,
  Sliders,
  AlertOctagon,
  CloudRain,
  Mountain,
  Compass,
  Building,
  Hospital,
  School,
  Maximize2,
  History,
  Clock,
} from 'lucide-react';

interface MapViewProps {
  locations: LocationFullReport[];
  historicalLandslides: HistoricalLandslide[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  onNavigateToTimeline?: (id: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  historicalLandslides,
  selectedLocationId,
  onSelectLocation,
  onNavigateToTimeline,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL');
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(2.5);
  const [onlyHotspots, setOnlyHotspots] = useState(false);

  const states = ['ALL', ...Array.from(new Set(locations.map((l) => l.location.state)))];
  const riskLevels = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

  const filtered = locations.filter((item) => {
    const matchesSearch =
      item.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'ALL' || item.location.state === selectedState;
    const matchesRisk = selectedRiskLevel === 'ALL' || item.risk.riskLevel === selectedRiskLevel;
    const matchesHotspot = !onlyHotspots || item.risk.isHotspot;
    return matchesSearch && matchesState && matchesRisk && matchesHotspot;
  });

  const selectedItem = locations.find((l) => l.location.id === selectedLocationId) || locations[0];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Filter and Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            GIS INTERACTIVE LANDSLIDE RISK MAP
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cartographic multi-layer spatial analysis: Slope stability, antecedent precipitation & OSM asset vulnerability
          </p>
        </div>

        {/* Buffer Radius Selector */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-slate-400 uppercase">Impact Buffer Radius:</span>
          {[1.0, 2.5, 5.0].map((radius) => (
            <button
              key={radius}
              onClick={() => setSelectedRadiusKm(radius)}
              className={`px-2 py-0.5 rounded cursor-pointer transition font-bold ${
                selectedRadiusKm === radius
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {radius} km
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Left Filters & Station Selector (3 Cols), Right Map (9 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar: Search, State Filters & Station List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search sector, district, highway..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            {/* State filter buttons */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">State Filter:</span>
              <div className="flex flex-wrap gap-1">
                {states.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedState(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition cursor-pointer ${
                      selectedState === st
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Level filter buttons */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Risk Level:</span>
              <div className="flex flex-wrap gap-1">
                {riskLevels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedRiskLevel(lvl)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition cursor-pointer ${
                      selectedRiskLevel === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                          : lvl === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                          : lvl === 'MODERATE'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                          : lvl === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Only Hotspots toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pt-1 border-t border-slate-800">
              <input
                type="checkbox"
                checked={onlyHotspots}
                onChange={(e) => setOnlyHotspots(e.target.checked)}
                className="rounded border-slate-700 text-rose-500 focus:ring-0"
              />
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> Only Active Hotspots (Score ≥ 72)
              </span>
            </label>
          </div>

          {/* Station List */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filtered.map((item) => {
              const { location, risk, weather, impact } = item;
              const isSelected = selectedLocationId === location.id;

              return (
                <div
                  key={location.id}
                  onClick={() => onSelectLocation(location.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{location.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {location.state} · {location.district}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          risk.riskLevel === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                            : risk.riskLevel === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                        }`}
                      >
                        {risk.compositeScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono bg-slate-950/60 p-1.5 rounded border border-slate-800/80 text-center">
                    <div>
                      <span className="text-slate-500">Rain 72h:</span>{' '}
                      <span className="text-sky-300 font-bold">
                        {weather.accumulatedRain72hMm.toFixed(0)}mm
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Slope:</span>{' '}
                      <span className="text-amber-300 font-bold">{location.slope}°</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Priority:</span>{' '}
                      <span className="text-cyan-300 font-bold">{impact.overallPriority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Map (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Base Map vs LANDGUARD Risk Layers Explicit Separation Disclosure */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
            <div>
              <span className="text-slate-500 font-bold uppercase">Base Map:</span>{' '}
              <span>CartoDB Dark Matter / © OpenStreetMap contributors (External Open Basemap)</span>
            </div>
            <div>
              <span className="text-cyan-400 font-bold uppercase">LANDGUARD Risk Layers:</span>{' '}
              <span>Calculated Multi-Factor Risk • GSI Inventory Dataset • Open-Meteo Weather</span>
            </div>
          </div>

          <MapComponent
            locations={filtered}
            historicalLandslides={historicalLandslides}
            selectedLocationId={selectedLocationId}
            onSelectLocation={onSelectLocation}
            heightClass="h-[620px]"
            selectedRadiusKm={selectedRadiusKm}
          />

          {/* Selected Hotspot Intelligence Panel */}
          {selectedItem && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h2 className="text-base font-bold text-white tracking-tight">{selectedItem.location.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      selectedItem.risk.riskLevel === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10 border-rose-500/40' :
                      selectedItem.risk.riskLevel === 'HIGH' ? 'text-orange-400 bg-orange-500/10 border-orange-500/40' :
                      selectedItem.risk.riskLevel === 'MODERATE' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40' :
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
                    }`}>
                      {selectedItem.risk.riskLevel} ({selectedItem.risk.compositeScore}/100)
                    </span>
                    {selectedItem.risk.isHotspot && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                        ACTIVE HOTSPOT
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {selectedItem.location.state} · {selectedItem.location.district} · Coordinates: {selectedItem.location.lat.toFixed(4)}°N, {selectedItem.location.lng.toFixed(4)}°E
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right font-mono text-[10px] text-slate-400">
                    <div>Impact Priority: <strong className="text-cyan-300">{selectedItem.impact.overallPriority}</strong></div>
                    <div>Last Updated: <span className="text-slate-300">{new Date(selectedItem.risk.computedAt).toLocaleTimeString()}</span></div>
                  </div>
                  {onNavigateToTimeline && (
                    <button
                      onClick={() => onNavigateToTimeline(selectedItem.location.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-950"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timeline</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-sky-400" /> Rainfall Telemetry
                  </div>
                  <div className="text-sm font-bold text-sky-300 mt-1">
                    {selectedItem.weather.accumulatedRain72hMm.toFixed(0)} mm <span className="text-[10px] text-slate-400 font-normal">(72h)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Rate: {selectedItem.weather.currentRainfallMm.toFixed(1)} mm/h ({selectedItem.risk.rainfall.score}/100)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Mountain className="w-3 h-3 text-amber-400" /> Slope & Aspect
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {selectedItem.location.slope}° <span className="text-[10px] text-slate-400 font-normal">({selectedItem.location.aspect})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Elevation: {selectedItem.location.elevation}m ({selectedItem.risk.slope.score}/100)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <History className="w-3 h-3 text-purple-400" /> Historical Activity
                  </div>
                  <div className="text-sm font-bold text-purple-300 mt-1 truncate">
                    {selectedItem.risk.historical.actualMetric}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Score: {selectedItem.risk.historical.score}/100
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Hospital className="w-3 h-3 text-emerald-400" /> Nearby Infrastructure
                  </div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">
                    {selectedItem.impact.nearbyInfrastructure.length} Assets
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {selectedItem.impact.settlementsCount} towns, {selectedItem.impact.hospitalsCount} hosp, {selectedItem.impact.schoolsCount} schl
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-cyan-400 font-mono">Geotechnical Rationale: </strong>
                  {selectedItem.risk.explanation}
                </div>
                <div className="text-[11px] text-slate-400 font-mono shrink-0">
                  Terrain: <strong className="text-white">{selectedItem.location.lithology.split('(')[0].trim()}</strong> (TRI {selectedItem.location.ruggednessIndex}/100)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
