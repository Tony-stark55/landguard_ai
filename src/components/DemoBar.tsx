import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useDemoIncident } from '../context/DemoIncidentContext';

interface DemoBarProps {
  onSelectHotspot: (locationId: string) => void;
  onNavigateToTimeline?: () => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({
  onSelectHotspot,
  onNavigateToTimeline,
}) => {
  const {
    state,
    triggerDemo,
    resetDemo,
    togglePlay,
    restart,
    replay,
    seekToStep,
    setSpeed,
  } = useDemoIncident();

  const {
    active,
    phase,
    phaseTitle,
    stepIndex,
    totalSteps,
    rainfallRateMmH,
    antecedentSaturationMm,
    physicalRisk,
    riskLevel,
    hotspotActive,
    alertLevel,
    isPlaying,
    playbackSpeed,
    isComplete,
  } = state;

  return (
    <div
      className={`w-full border-b transition-all duration-300 ${
        active
          ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-xl shadow-rose-950/50'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Mode Title & Live Data Truth */}
        <div className="flex items-center gap-2.5">
          {active ? (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide font-mono uppercase">
                {active
                  ? '⚡ DEMO INCIDENT ACTIVE'
                  : 'LIVE TELEMETRY • SOURCE: OPEN-METEO • MODE: NORMAL'}
              </span>
              {active && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950 uppercase">
                  DEMO / SIMULATION
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-300 hidden md:block mt-0.5">
              {active
                ? `Simulated cloudburst & pore-water surge on Gangtok NH-10 (${stepIndex + 1}/${totalSteps}: ${phaseTitle})`
                : 'Direct surface telemetry from Open-Meteo near-real-time sensor network'}
            </div>
          </div>
        </div>

        {/* Center: When Demo is Active, show full Playback Engine Controls */}
        {active ? (
          <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-rose-500/40 shadow-inner">
            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                isPlaying
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Play Scenario'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Restart Button */}
            <button
              onClick={restart}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              title="Restart simulation from Phase 1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESTART</span>
            </button>

            {/* Playback Speed (1x, 2x, 4x) */}
            <div className="flex items-center gap-1 bg-slate-900 px-1 py-0.5 rounded border border-slate-700/80">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeed(spd as 1 | 2 | 4)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                    playbackSpeed === spd
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Step Slider & Counter */}
            <div className="hidden lg:flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={totalSteps - 1}
                value={stepIndex}
                onChange={(e) => seekToStep(Number(e.target.value))}
                className="w-24 h-1.5 accent-rose-500 cursor-pointer bg-slate-800 rounded"
              />
              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                Step {stepIndex + 1}/{totalSteps}
              </span>
            </div>

            {/* Live Metrics Tag */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] pl-2 border-l border-slate-800">
              <span className="text-cyan-300 font-bold">{rainfallRateMmH.toFixed(1)} mm/h</span>
              <span className="text-slate-500">·</span>
              <span
                className={`font-bold ${
                  riskLevel === 'CRITICAL'
                    ? 'text-rose-400'
                    : riskLevel === 'HIGH'
                    ? 'text-orange-400'
                    : riskLevel === 'MODERATE'
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                Risk: {physicalRisk}/100 ({riskLevel})
              </span>
            </div>

            {/* Completion Tag */}
            {isComplete && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-600 text-white animate-pulse">
                INCIDENT COMPLETE
              </span>
            )}
          </div>
        ) : null}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {active ? (
            <>
              {isComplete ? (
                <button
                  onClick={replay}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REPLAY INCIDENT</span>
                </button>
              ) : null}

              <button
                onClick={() => onSelectHotspot('sik-gangtok')}
                className="flex items-center gap-1 px-3 py-1 rounded-md font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer text-xs"
              >
                <span>Inspect Gangtok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => resetDemo()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer text-xs"
                title="Reset simulation and return to live Open-Meteo weather data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET TO LIVE TELEMETRY</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => triggerDemo('sik-gangtok')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 hover:text-white shadow-lg shadow-amber-950/40 transition font-mono tracking-tight cursor-pointer text-xs animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>SIMULATE DEMO INCIDENT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
