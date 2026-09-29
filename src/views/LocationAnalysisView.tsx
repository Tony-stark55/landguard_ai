import React, { useState } from 'react';
import { LocationFullReport } from '../types/landguard';
import {
  ShieldAlert,
  CloudRain,
  Mountain,
  History,
  Activity,
  Users,
  Building,
  School,
  Hospital,
  AlertOctagon,
  ArrowRight,
  Printer,
  Sparkles,
  Share2,
  MapPin,
  Compass,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  Brain,
  GitCompare,
  Clock,
} from 'lucide-react';
import { AppView } from '../components/Navbar';

interface LocationAnalysisViewProps {
  locations: LocationFullReport[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
  onNavigate: (view: AppView) => void;
  onAskAI?: (locationId: string) => void;
}

export const LocationAnalysisView: React.FC<LocationAnalysisViewProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onNavigate,
  onAskAI,
}) => {
  const currentItem =
    locations.find((l) => l.location.id === selectedLocationId) || locations[0];

  if (!currentItem) {
    return <div className="p-8 text-center text-slate-400">Loading location data...</div>;
  }

  const { location, weather, risk, impact, alert, historicalNearby } = currentItem;

  const riskColor =
    risk.riskLevel === 'CRITICAL'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/40'
      : risk.riskLevel === 'HIGH'
      ? 'text-orange-400 bg-orange-500/10 border-orange-500/40'
      : risk.riskLevel === 'MODERATE'
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';

  const riskBarColor =
    risk.riskLevel === 'CRITICAL'
      ? 'bg-rose-500 shadow-rose-500/50'
      : risk.riskLevel === 'HIGH'
      ? 'bg-orange-500 shadow-orange-500/50'
      : risk.riskLevel === 'MODERATE'
      ? 'bg-yellow-400 shadow-yellow-400/50'
      : 'bg-emerald-500 shadow-emerald-500/50';

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const reportData = {
      location,
      weather,
      riskAssessment: risk,
      impactAssessment: impact,
      earlyWarningAlert: alert || null,
      generatedAt: new Date().toISOString(),
      system: 'LANDGUARD AI - North Eastern Region Landslide Decision Support System',
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `landguard-report-${location.id}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            LOCATION RISK REPORT & SITE INTELLIGENCE
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight font-display mt-0.5">
            {location.name}
          </h1>
          <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-3">
            <span>District: {location.district}</span>
            <span>State: {location.state}</span>
            <span>Elevation: {location.elevation}m</span>
            <span>Slope: {location.slope}° ({location.aspect})</span>
          </div>
        </div>

        {/* Location Switcher Dropdown & Print button */}
        <div className="flex items-center gap-2">
          <select
            value={currentItem.location.id}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
          >
            {locations.map((l) => (
              <option key={l.location.id} value={l.location.id}>
                {l.location.name} ({l.risk.riskLevel} - {l.risk.compositeScore})
              </option>
            ))}
          </select>

          <button
            onClick={() => onNavigate('timeline')}
            title="Inspect Dynamic Time-Series Risk Evolution"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Timeline Scrubber</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print or Save PDF Brief"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={handleExportJson}
            title="Download GeoJSON/JSON Telemetry Payload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {onAskAI && (
            <button
              onClick={() => onAskAI(location.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Analysis Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Risk Score & 4 Factor Breakdown (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Risk Score Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Landslide Susceptibility Assessment
              </span>
              <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${riskColor}`}>
                {risk.riskLevel} SUSCEPTIBILITY
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-black font-display text-white">
                {risk.compositeScore}
              </span>
              <span className="text-slate-400 text-base font-mono">/ 100</span>

              <div className="flex-1 ml-4">
                <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 shadow-lg ${riskBarColor}`}
                    style={{ width: `${risk.compositeScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Explainable AI statement */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <Sparkles className="w-4 h-4" /> Explainable Risk Rationale
              </div>
              <p>{risk.explanation}</p>
            </div>

            {/* Feature 8: "Why Did Risk Change?" (Temporal Delta Analysis) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <GitCompare className="w-4 h-4" /> Why Did Risk Change? (Temporal Delta)
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {risk.previousScore !== undefined ? 'Cycle Comparison' : 'Baseline Assessment'}
                </span>
              </div>

              {risk.previousScore !== undefined && risk.scoreDelta !== undefined ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Previous Risk</div>
                      <div className="text-lg font-bold font-mono text-slate-300 mt-0.5">
                        {risk.previousScore}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Current Risk</div>
                      <div className="text-lg font-bold font-mono text-white mt-0.5">
                        {risk.compositeScore}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Net Change</div>
                      <div className={`text-lg font-bold font-mono mt-0.5 flex items-center justify-center gap-1 ${
                        risk.scoreDelta > 0 ? 'text-rose-400' : risk.scoreDelta < 0 ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {risk.scoreDelta > 0 ? <TrendingUp className="w-4 h-4" /> : risk.scoreDelta < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        {risk.scoreDelta > 0 ? `+${risk.scoreDelta}` : `${risk.scoreDelta}`}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    <span className="font-bold text-amber-300">Main Driver: </span>
                    {risk.deltaDriver}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    <div>Rain: <span className={risk.scoreDelta !== 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{weather.accumulatedRain72hMm.toFixed(0)}mm (72h)</span></div>
                    <div>Slope: <span className="text-emerald-400">{location.slope}° (Static)</span></div>
                    <div>Historical: <span className="text-emerald-400">{risk.historical.actualMetric} (Static)</span></div>
                    <div>Lithology: <span className="text-emerald-400">{location.lithology.split('(')[0].trim().slice(0, 15)} (Static)</span></div>
                  </div>
                </>
              ) : (
                <div className="p-3.5 text-center text-xs text-slate-400 font-mono bg-slate-900/50 rounded-lg border border-slate-800">
                  No previous assessment available.
                </div>
              )}
            </div>
          </div>

          {/* Feature 7: Hybrid Intelligence (Physical Risk + Research ML Susceptibility) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> Hybrid Intelligence: Physical Engine + Research ML
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                Research / Supporting Signal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40">
                <div className="text-[10px] text-cyan-400 uppercase font-bold">PHYSICAL RISK</div>
                <div className="text-2xl font-black text-white mt-1">
                  {risk.physicalScore ?? risk.compositeScore}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Authoritative decision-support signal</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40">
                <div className="text-[10px] text-purple-400 uppercase font-bold">ML SUSCEPTIBILITY</div>
                <div className="text-2xl font-black text-purple-300 mt-1">
                  {risk.mlSusceptibility ?? 76}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Research baseline</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-inner">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">HYBRID SCORE</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">
                  {risk.hybridScore ?? risk.compositeScore}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Combined decision-support indicator</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <strong className="text-amber-300">Methodology Note: </strong>
              ML output is experimental and trained on a limited curated dataset. It is not an official prediction. The physical-empirical model remains the primary authoritative decision-support signal (80% weight).
            </p>
          </div>

          {/* Feature 9: "Why This Risk?" (Factor Math & Exact Point Contributions) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Why This Risk? (Factor Math Breakdown)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Configurable Prototype Weights
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 bg-slate-950/60">
                    <th className="py-2 px-2.5">Hazard Factor</th>
                    <th className="py-2 px-2.5">Observed Metric</th>
                    <th className="py-2 px-2.5">Score (0-100)</th>
                    <th className="py-2 px-2.5">Weight</th>
                    <th className="py-2 px-2.5 text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-sky-400 flex items-center gap-1">
                      <CloudRain className="w-3 h-3" /> Rainfall
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">{weather.accumulatedRain72hMm.toFixed(0)}mm 72h / {weather.currentRainfallMm.toFixed(1)}mm/h</td>
                    <td className="py-2 px-2.5 font-bold">{risk.rainfall.score}</td>
                    <td className="py-2 px-2.5 text-slate-400">35%</td>
                    <td className="py-2 px-2.5 text-right font-bold text-sky-300">
                      {risk.contributions?.rainfallPts ?? (risk.rainfall.score * 0.35).toFixed(1)} pts
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-amber-400 flex items-center gap-1">
                      <Mountain className="w-3 h-3" /> Terrain Slope
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">{location.slope}° incline ({location.aspect})</td>
                    <td className="py-2 px-2.5 font-bold">{risk.slope.score}</td>
                    <td className="py-2 px-2.5 text-slate-400">30%</td>
                    <td className="py-2 px-2.5 text-right font-bold text-amber-300">
                      {risk.contributions?.slopePts ?? (risk.slope.score * 0.30).toFixed(1)} pts
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-purple-400 flex items-center gap-1">
                      <History className="w-3 h-3" /> Historical Slip
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">{risk.historical.actualMetric}</td>
                    <td className="py-2 px-2.5 font-bold">{risk.historical.score}</td>
                    <td className="py-2 px-2.5 text-slate-400">20%</td>
                    <td className="py-2 px-2.5 text-right font-bold text-purple-300">
                      {risk.contributions?.historicalPts ?? (risk.historical.score * 0.20).toFixed(1)} pts
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-emerald-400 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Lithology & TRI
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">TRI {location.ruggednessIndex} • {location.lithology.split('(')[0].slice(0, 20)}</td>
                    <td className="py-2 px-2.5 font-bold">{risk.terrain.score}</td>
                    <td className="py-2 px-2.5 text-slate-400">15%</td>
                    <td className="py-2 px-2.5 text-right font-bold text-emerald-300">
                      {risk.contributions?.terrainPts ?? (risk.terrain.score * 0.15).toFixed(1)} pts
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-700 bg-slate-950 font-bold text-white">
                    <td colSpan={4} className="py-2.5 px-2.5 text-slate-300">
                      SUM OF CONTRIBUTING FACTOR POINTS:
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-cyan-400 text-sm">
                      {risk.compositeScore} / 100
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Empirical Formula: Risk Score = (Rainfall × 0.35) + (Slope × 0.30) + (Historical × 0.20) + (Terrain × 0.15)
            </div>
          </div>

          {/* 4 Contributing Factors Cards */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Factor-by-Factor Telemetry Breakdown
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
                Prototype empirical/configurable weights (Rain: 35%, Slope: 30%, Hist: 20%, Terrain: 15%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Rainfall Factor */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <CloudRain className="w-4 h-4 text-sky-400" /> Rainfall Factor
                  </span>
                  <span className="font-mono font-bold text-sky-400">{risk.rainfall.score}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full"
                    style={{ width: `${risk.rainfall.score}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-300">
                  Current: <strong className="text-white">{weather.currentRainfallMm} mm/h</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  72-Hr Total: <strong className="text-white">{weather.accumulatedRain72hMm} mm</strong>
                </div>
                <div className="text-[10px] text-slate-500 italic border-t border-slate-800 pt-1.5">
                  Source: {weather.source} • Configurable Weight: 35%
                </div>
              </div>

              {/* Slope Factor */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Mountain className="w-4 h-4 text-amber-400" /> Terrain Slope Factor
                  </span>
                  <span className="font-mono font-bold text-amber-400">{risk.slope.score}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${risk.slope.score}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-300">
                  Slope Gradient: <strong className="text-white">{location.slope}° incline</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Slope Aspect: <strong className="text-white">{location.aspect} orientation</strong>
                </div>
                <div className="text-[10px] text-slate-500 italic border-t border-slate-800 pt-1.5">
                  SRTM / ASTER Elevation Model • Configurable Weight: 30%
                </div>
              </div>

              {/* Historical Landslide Factor */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <History className="w-4 h-4 text-purple-400" /> Historical Slide Proximity
                  </span>
                  <span className="font-mono font-bold text-purple-400">{risk.historical.score}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full"
                    style={{ width: `${risk.historical.score}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {risk.historical.summary}
                </div>
                <div className="text-[10px] text-slate-500 italic border-t border-slate-800 pt-1.5">
                  GSI NLSM Records • Configurable Weight: 20%
                </div>
              </div>

              {/* Lithology & Terrain Factor */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Activity className="w-4 h-4 text-emerald-400" /> Lithology & Cover
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{risk.terrain.score}/100</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${risk.terrain.score}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-300">
                  Lithology: <strong className="text-white">{location.lithology.split('(')[0]}</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Cover: <strong className="text-white">{location.vegetationCover}</strong>
                </div>
                <div className="text-[10px] text-slate-500 italic border-t border-slate-800 pt-1.5">
                  TRI Ruggedness: {location.ruggednessIndex}/100 • Configurable Weight: 15%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: "Who Is At Risk?" Impact Analysis & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Who Is At Risk Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> "Who Is At Risk?" Proximity Analysis
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Geospatial buffer radius: 2.5 km around hazard slope
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  impact.overallPriority === 'URGENT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500'
                    : impact.overallPriority === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500'
                }`}
              >
                {impact.overallPriority} PRIORITY
              </span>
            </div>

            {/* Exposure Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xl font-bold font-mono text-white">{impact.settlementsCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Settlements</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xl font-bold font-mono text-white">{impact.schoolsCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Schools</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xl font-bold font-mono text-white">{impact.hospitalsCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Hospitals</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-xl font-bold font-mono text-white">{impact.majorRoadsCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Roads/Rails</div>
              </div>
            </div>

            {/* Impact Priority Formula Breakdown */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Impact Priority Score Composition</div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Environmental Risk (45%):</span>
                  <span className="text-rose-400 font-bold">{impact.environmentalRiskScore}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Infrastructure Exposure (30%):</span>
                  <span className="text-amber-400 font-bold">{impact.infrastructureExposureScore}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Population Exposure (25%):</span>
                  <span className="text-cyan-400 font-bold">{impact.populationExposureScore}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span>Composite Priority Index:</span>
                  <span className="text-cyan-400">{impact.impactPriorityScore}/100</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {impact.priorityReason}
            </p>

            {/* List of identified assets */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Vulnerable Assets in Impact Zone:
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {impact.nearbyInfrastructure.map((infra) => (
                  <div
                    key={infra.id}
                    className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {infra.type === 'hospital' && <Hospital className="w-3.5 h-3.5 text-rose-400" />}
                        {infra.type === 'school' && <School className="w-3.5 h-3.5 text-amber-400" />}
                        {infra.type === 'road' && <Building className="w-3.5 h-3.5 text-sky-400" />}
                        {infra.type === 'settlement' && <Users className="w-3.5 h-3.5 text-emerald-400" />}
                        {infra.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{infra.details}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2 font-mono text-cyan-400 font-bold">
                      {infra.distanceKm} km
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decision-Support Early Warning Card */}
          {alert && (
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Decision-Support Actions for Authorities</span>
              </div>
              <p className="text-xs text-rose-200">
                <strong>Trigger:</strong> {alert.triggerReason}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {alert.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold font-mono">▸</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 text-[10px] text-slate-400 border-t border-rose-500/20 italic">
                Advisory dispatched to SEOC / District Emergency Operations Center (DEOC).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
