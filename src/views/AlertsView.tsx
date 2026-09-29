import React, { useState } from 'react';
import { EarlyWarningAlert } from '../types/landguard';
import {
  BellRing,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Filter,
  Printer,
  Radio,
  FileCheck,
  Building2,
  Hospital,
  School,
  Car,
  Users,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import { AppView } from '../components/Navbar';
import { useDemoIncident } from '../context/DemoIncidentContext';

interface AlertsViewProps {
  alerts: EarlyWarningAlert[];
  onSelectLocation: (locationId: string) => void;
  onNavigate: (view: AppView) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onSelectLocation,
  onNavigate,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const {
    state: demoState,
    togglePlay,
    restart,
    seekToStep,
    setSpeed,
  } = useDemoIncident();

  const filtered = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const phases = [
    { key: 'ATMOSPHERIC_INFLUX', label: '1. ATMOSPHERIC INFLUX', desc: 'Moisture accumulation & light drizzle' },
    { key: 'HEAVY_RAINFALL', label: '2. HEAVY RAINFALL', desc: 'Intensifying downpour, rapid saturation' },
    { key: 'CLOUDBURST_PEAK', label: '3. CLOUDBURST PEAK', desc: 'Torrential surge, pore-water head peak' },
    { key: 'CRITICAL_HOTSPOT', label: '4. CRITICAL HOTSPOT', desc: 'Maximum shear failure probability' },
    { key: 'PERSISTENT_SATURATION', label: '5. PERSISTENT SATURATION', desc: 'Rain easing, but subsoil remains saturated' },
    { key: 'RECOVERY', label: '6. RECOVERY & DRAINAGE', desc: 'Subsurface drainage & equilibrium' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              STATE EMERGENCY OPERATIONS CENTRE (SEOC) FEED
            </span>
            {demoState.active ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                DEMO / SIMULATION • EMERGENCY SCENARIO
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                LIVE TELEMETRY • SOURCE: OPEN-METEO • MODE: NORMAL
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display mt-0.5">
            AUTHORITY COMMAND CENTER & ACTIONABLE RESPONSE PROTOCOLS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative decision-support guidance for NDMA, SDRF, Border Roads Organisation (BRO), and District Disaster Authorities
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE DEMO INCIDENT COMMAND CENTER (Mandated Section 8) */}
      {/* ========================================================================= */}
      {demoState.active && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-950 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/60 space-y-6">
          {/* 1. Incident Alert Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-rose-500/40 pb-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center font-bold text-rose-300 shadow-lg shadow-rose-950/80 animate-pulse shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-rose-600 text-white tracking-wider">
                    {demoState.riskLevel === 'CRITICAL' ? '🚨 CRITICAL LANDSLIDE RISK' : '⚠ ELEVATED HAZARD RISK'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                    DEMO / SIMULATION • NOT LIVE WEATHER
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Step {demoState.stepIndex + 1}/{demoState.totalSteps}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white font-display mt-1">
                  {demoState.locationName}
                </h2>
                <div className="text-xs text-rose-200/90 font-mono mt-0.5 flex flex-wrap items-center gap-3">
                  <span>Risk Score: <strong className="text-white text-sm">{demoState.physicalRisk}/100</strong> ({demoState.riskLevel})</span>
                  <span>·</span>
                  <span>Rainfall: <strong className="text-cyan-300">{demoState.rainfallRateMmH.toFixed(1)} mm/h</strong></span>
                  <span>·</span>
                  <span>Antecedent 72h: <strong className="text-cyan-300">{demoState.antecedentSaturationMm.toFixed(0)} mm</strong></span>
                  <span>·</span>
                  <span>Pore Pressure Head: <strong className="text-amber-300">{(demoState.poreWaterRatio * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>

            {/* Playback Engine Quick Console */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-rose-500/40">
              <button
                onClick={togglePlay}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  demoState.isPlaying
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400 hover:bg-rose-500/40'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow'
                }`}
              >
                {demoState.isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Play
                  </>
                )}
              </button>

              <button
                onClick={restart}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                title="Restart simulation from Phase 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              <button
                onClick={() => onNavigate('timeline')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition shadow cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline Scrubber →</span>
              </button>
            </div>
          </div>

          {/* 2. Alert Escalation Status Ladder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-rose-400" />
                5. Alert Escalation Status Ladder:
              </span>
              <span className="text-slate-400">
                Current Level: <strong className="text-white uppercase font-bold">{demoState.alertLevel.replace('_', ' ')}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {[
                { level: 'NORMAL', label: 'NORMAL (SCORE < 25)', desc: 'Routine slope monitoring', color: 'border-slate-700 bg-slate-950 text-slate-400' },
                { level: 'WATCH', label: 'WATCH (SCORE 25-50)', desc: 'Field teams on alert', color: 'border-yellow-500/50 bg-yellow-950/30 text-yellow-300' },
                { level: 'WARNING', label: 'WARNING (SCORE 51-75)', desc: 'Traffic regulation & standby', color: 'border-orange-500/60 bg-orange-950/40 text-orange-300' },
                { level: 'EMERGENCY_EVACUATION', label: 'EMERGENCY (SCORE 76-100)', desc: 'Evacuation & highway closure', color: 'border-rose-500 bg-rose-950/60 text-white ring-2 ring-rose-500/50 animate-pulse' },
              ].map((ladder) => {
                const isCurrent =
                  demoState.alertLevel === ladder.level ||
                  (demoState.alertLevel === 'ADVISORY' && ladder.level === 'WATCH');

                return (
                  <div
                    key={ladder.level}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? `${ladder.color} shadow-lg font-bold`
                        : 'border-slate-800 bg-slate-950/40 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-tight">{ladder.label}</span>
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>}
                    </div>
                    <div className="text-[10px] mt-1 font-sans">{ladder.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Incident Phase Visual Pipeline Tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                3. Incident Phase Progression:
              </span>
              <span className="text-amber-300 font-bold">{demoState.phaseTitle}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {phases.map((p, pIdx) => {
                const isCurrentPhase = demoState.phase === p.key;
                return (
                  <div
                    key={p.key}
                    onClick={() => {
                      // Click to jump to phase
                      const stepTarget = pIdx === 0 ? 0 : pIdx === 1 ? 4 : pIdx === 2 ? 9 : pIdx === 3 ? 10 : pIdx === 4 ? 12 : 16;
                      seekToStep(stepTarget);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isCurrentPhase
                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-lg ring-1 ring-rose-400 font-bold'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-tight truncate">
                      {p.label}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">
                      {p.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Response Recommendations (Mandated Section 8) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                2. Decision-Support Response Recommendations (Active Directives):
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Advisory guidance for emergency commanders (Non-automated)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-200">
              {demoState.authorityRecommendations.map((rec, rIdx) => (
                <div
                  key={rIdx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Exposed Infrastructure Breakdown (Mandated Section 8) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                <Building2 className="w-4 h-4 text-amber-400" />
                4. Infrastructure Exposure Breakdown (Active {demoState.bufferRadiusKm} km Hazard Buffer):
              </div>
              <span className="text-[11px] font-mono text-slate-300">
                Total Exposed Assets: <strong className="text-white text-xs">{demoState.exposedCounts.total}</strong>
              </span>
            </div>

            {/* Category KPI summary pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-amber-400" /> Schools</span>
                <span className="font-bold text-white text-sm">{demoState.exposedCounts.schools}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Hospital className="w-3.5 h-3.5 text-rose-400" /> Hospitals</span>
                <span className="font-bold text-white text-sm">{demoState.exposedCounts.hospitals}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-sky-400" /> Roads</span>
                <span className="font-bold text-white text-sm">{demoState.exposedCounts.roads}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-emerald-400" /> Bridges</span>
                <span className="font-bold text-white text-sm">{demoState.exposedCounts.bridges}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-400" /> Settlements</span>
                <span className="font-bold text-white text-sm">{demoState.exposedCounts.settlements}</span>
              </div>
            </div>

            {/* List of specific exposed assets within buffer */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                Lifeline Assets Under Direct Proximity Threat (&le; {demoState.bufferRadiusKm} km):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {demoState.exposedInfrastructure.map((infra) => (
                  <div
                    key={infra.id}
                    className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">
                        {infra.type === 'hospital' ? '🏥' : infra.type === 'school' ? '🏫' : infra.type === 'settlement' ? '🏘' : infra.type === 'bridge' ? '🌉' : '🛣'}
                      </span>
                      <span className="text-slate-200 font-semibold truncate">{infra.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/80 shrink-0">
                      {infra.distanceKm} km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routine Bulletins Feed (Always Available for other monitored stations) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Monitored Regional Early Warning Bulletins ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400">
            Automated sensor trigger thresholds
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            No active early warning alerts match the selected filter.
          </div>
        ) : (
          filtered.map((alert) => {
            const isCrit = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCrit
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30'
                    : isHigh
                    ? 'bg-orange-950/20 border-orange-500/40 shadow-md'
                    : 'bg-yellow-950/20 border-yellow-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isCrit
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                          : isHigh
                          ? 'bg-orange-500 text-white shadow'
                          : 'bg-yellow-500 text-slate-950'
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">
                          {alert.locationName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 border border-slate-700 text-cyan-300">
                          {alert.state}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Issued: {new Date(alert.issuedAt).toLocaleTimeString()} IST</span>
                        <span>·</span>
                        <span>Priority Rank: #{alert.priorityRank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${
                        isCrit
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : isHigh
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                      }`}
                    >
                      {alert.severity} ({alert.riskScore}/100)
                    </span>

                    <button
                      onClick={() => {
                        onSelectLocation(alert.locationId);
                        onNavigate('location-analysis');
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                    >
                      <span>Inspect Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Trigger Reasoning */}
                <div className="mt-3 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-400 uppercase font-mono text-[11px]">Hazard Trigger:</strong>{' '}
                  <span>{alert.triggerReason}</span>
                </div>

                {/* Recommended Operational Actions */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" /> Recommended Decision-Support Directives
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                    {alert.recommendedActions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-1.5 rounded bg-slate-900/50 border border-slate-800/50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Authority Disclaimer Note */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 leading-relaxed">
        <strong>Authority Operating Standard:</strong> LANDGUARD AI bulletins assist decision makers in prioritizing physical slope reconnaissance, early traffic regulation, and emergency prepositioning. Mandatory evacuation orders remain under the statutory jurisdiction of the District Magistrate and State Disaster Management Authority (SDMA).
      </div>
    </div>
  );
};
