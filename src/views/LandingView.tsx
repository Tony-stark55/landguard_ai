import React from 'react';
import {
  ShieldAlert,
  MapPin,
  CloudRain,
  Mountain,
  Users,
  BellRing,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { AppView } from '../components/Navbar';

interface LandingViewProps {
  onNavigate: (view: AppView) => void;
  onTriggerDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onTriggerDemo }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 mb-5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            NORTH EASTERN REGION (NER) OPERATIONAL INTELLIGENCE
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-display uppercase">
            LANDGUARD <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400">AI</span>
          </h1>

          <p className="mt-3 text-lg sm:text-xl font-medium text-slate-300 font-display">
            AI-Powered Landslide Risk Monitoring & Early Warning Decision Support System
          </p>

          <p className="mt-4 max-w-3xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
            Synthesizing <strong>real-world precipitation telemetry</strong>, <strong>high-resolution terrain slopes</strong>, <strong>GSI historical slip records</strong>, and <strong>OpenStreetMap infrastructure exposure</strong> into transparent, explainable landslide susceptibility intelligence for state and central disaster authorities.
          </p>

          {/* Scientific Positioning Disclaimer Banner */}
          <div className="mt-5 max-w-2xl mx-auto p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Scientific Protocol:</strong> Susceptibility estimation & early-warning decision support for authorities — not deterministic minute-by-minute prediction.
            </span>
          </div>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/20 transition cursor-pointer"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTriggerDemo}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer font-mono"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulate Incident Demo</span>
            </button>

            <button
              onClick={() => onNavigate('citizen')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <span>Citizen Safety View</span>
            </button>
          </div>
        </div>
      </section>

      {/* The 11-Step Rapid User Story Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            RAPID DEMO STORYLINE (2 MINUTES)
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            From Environmental Rainfall Surge to Actionable SDRF Early Warning
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl mx-auto">
            Experience how the multi-stage geospatial pipeline processes raw inputs and protects lives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center text-xs">
              01
            </div>
            <div className="text-xs font-bold text-white">Live Data Ingest</div>
            <p className="text-[11px] text-slate-400">
              Retrieves hourly precipitation & 72h antecedent rainfall from Open-Meteo API.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-xs">
              02
            </div>
            <div className="text-xs font-bold text-white">Terrain & GSI Cross</div>
            <p className="text-[11px] text-slate-400">
              Correlates slope gradients (&gt; 35°), fragile Daling phyllites, and prior slip planes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-mono font-bold flex items-center justify-center text-xs">
              03
            </div>
            <div className="text-xs font-bold text-white">Hotspot Detection</div>
            <p className="text-[11px] text-slate-400">
              Pore-pressure saturation flags critical hotspots (e.g. Gangtok NH-10 or Haflong).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center text-xs">
              04
            </div>
            <div className="text-xs font-bold text-white">Explainable AI</div>
            <p className="text-[11px] text-slate-400">
              Dynamically explains WHY risk is high using exact measured rainfall and slope parameters.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
              05
            </div>
            <div className="text-xs font-bold text-white">"Who Is At Risk?"</div>
            <p className="text-[11px] text-slate-400">
              Buffers 2.5km to identify vulnerable schools, hospitals, settlements, and highway lifelines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
              06
            </div>
            <div className="text-xs font-bold text-white">Decision Support</div>
            <p className="text-[11px] text-slate-400">
              Issues targeted actions for NDMA, SDRF, and PWD road clearance deployments.
            </p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Real-World Rainfall Data</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Monitors both instantaneous cloudburst rate (mm/h) and 72-hour antecedent rainfall. High antecedent moisture pre-saturates colluvium, dramatically lowering the threshold for slope collapse.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Mountain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Terrain & Elevation Model</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Derives slope gradient, aspect, and terrain ruggedness index (TRI). Fragile schists and highly cleaved Disang/Barail shales across Sikkim, Nagaland, and Assam are dynamically weighted.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">GSI Historical Catalogue</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Integrates Geological Survey of India historical records, including Tupul 2022 (61 casualties), Chungthang 2023, and New Haflong 2022 railway disruptions to calibrate susceptibility.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Geospatial Impact Analysis</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Crucial differentiator: Performs automated OpenStreetMap proximity buffers around every hotspot. Calculates Impact Priority Score based on vulnerable schools, hospitals, settlements, and highways.
            </p>
          </div>
        </div>
      </section>

      {/* Monitored Regions Coverage Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-cyan-400">
                ACTIVE OPERATIONAL COVERAGE
              </div>
              <h3 className="text-xl font-bold text-white mt-1">
                All 8 North Eastern States of India Monitored 24/7
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Sikkim (Gangtok, Mangan, Namchi), Meghalaya (Cherrapunji, Shillong, Mawsynram), Assam (Dima Hasao, Guwahati), Arunachal Pradesh (Itanagar, Tawang, Pasighat), Nagaland (Kohima, Mokokchung), Mizoram (Aizawl, Lunglei), Manipur (Noney, Churachandpur), Tripura (Jampui Hills).
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Explore Interactive GIS Map</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
