import React, { useState } from 'react';
import { LocationFullReport } from '../types/landguard';
import {
  ShieldAlert,
  Navigation,
  CloudRain,
  PhoneCall,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MapPin,
  Compass,
  ArrowRight,
  Info,
  Clock,
  Radio,
  Eye,
} from 'lucide-react';
import { calculateDistanceKm } from '../services/riskEngine';
import { useDemoIncident } from '../context/DemoIncidentContext';

interface CitizenViewProps {
  locations: LocationFullReport[];
  onSelectLocation: (id: string) => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({ locations, onSelectLocation }) => {
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.location.id || 'sik-gangtok');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('Select your area below or enable GPS');

  const { state: demoState } = useDemoIncident();

  // Attempt HTML5 geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by browser.');
      return;
    }

    setGeoStatus('Locating your position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        // Find nearest NER monitored city
        let closest = locations[0];
        let minDist = Infinity;
        locations.forEach((item) => {
          const d = calculateDistanceKm(latitude, longitude, item.location.lat, item.location.lng);
          if (d < minDist) {
            minDist = d;
            closest = item;
          }
        });

        setSelectedLocId(closest.location.id);
        setGeoStatus(`Nearest monitored sector: ${closest.location.name} (~${minDist.toFixed(1)} km)`);
      },
      () => {
        setGeoStatus('Location access declined. Choose your sector from the list.');
      },
      { timeout: 8000 }
    );
  };

  const current = locations.find((l) => l.location.id === selectedLocId) || locations[0];

  if (!current) return null;

  // When demo is active and Gangtok is selected, use the central simulated values!
  const isDemoInspecting = demoState.active && (selectedLocId === demoState.locationId || selectedLocId === 'sik-gangtok');

  const activeRiskLevel = isDemoInspecting ? demoState.riskLevel : current.risk.riskLevel;
  const activeRiskScore = isDemoInspecting ? demoState.physicalRisk : current.risk.compositeScore;
  const activeRainfall = isDemoInspecting ? demoState.rainfallRateMmH : current.weather.currentRainfallMm;
  const activeAccum = isDemoInspecting ? demoState.antecedentSaturationMm : current.weather.accumulatedRain72hMm;

  // Simplified citizen-friendly risk label (Mandated in Section 9)
  let citizenStatusLabel = 'SAFE / MONITORING';
  let citizenColorBadge = 'bg-emerald-500 text-white';
  let citizenBorder = 'border-emerald-500/40 bg-emerald-950/20';

  if (activeRiskLevel === 'CRITICAL') {
    citizenStatusLabel = 'CRITICAL LANDSLIDE RISK';
    citizenColorBadge = 'bg-rose-600 text-white animate-pulse';
    citizenBorder = 'border-rose-500/60 bg-rose-950/40 shadow-xl shadow-rose-950/40';
  } else if (activeRiskLevel === 'HIGH') {
    citizenStatusLabel = 'HIGH LANDSLIDE RISK';
    citizenColorBadge = 'bg-orange-500 text-white';
    citizenBorder = 'border-orange-500/50 bg-orange-950/30';
  } else if (activeRiskLevel === 'MODERATE') {
    citizenStatusLabel = 'ELEVATED RISK';
    citizenColorBadge = 'bg-amber-400 text-slate-950 font-bold';
    citizenBorder = 'border-yellow-500/40 bg-yellow-950/20';
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
      {/* Citizen Welcome Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              CITIZEN SAFETY ADVISORY PORTAL
            </span>
          </div>

          {demoState.active ? (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950 shadow-sm animate-pulse">
              DEMO SIMULATION • NOT LIVE WEATHER
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              LIVE TELEMETRY • SOURCE: OPEN-METEO • MODE: NORMAL
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Check Landslide Safety For Your Area
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Stay informed about current slope hazard conditions, rainfall saturation, and practical safety precautions across North East India.
        </p>

        {/* GPS Location Locator Button & Dropdown */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleRequestLocation}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Use My Exact Location (GPS)</span>
          </button>

          {/* Quick Dropdown Picker */}
          <select
            value={selectedLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
          >
            {locations.map((l) => (
              <option key={l.location.id} value={l.location.id}>
                {l.location.name} ({l.location.state}) {demoState.active && l.location.id === demoState.locationId ? '⚡ [SIMULATED SCENARIO TARGET]' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{geoStatus}</span>
        </div>
      </div>

      {/* Demo Simulation Notice Banner (When Active) */}
      {demoState.active && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs space-y-1">
          <div className="font-bold font-mono flex items-center gap-1.5 text-amber-300">
            <Radio className="w-4 h-4 animate-pulse text-amber-400" />
            <span>DEMO SIMULATION ACTIVE: Simulated Cloudburst Progression</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            This demonstration shows how rapid rain influx and antecedent soil moisture translate into citizen safety recommendations. Values shown for Gangtok are synthetic and for demonstration only.
          </p>
        </div>
      )}

      {/* Main Status Badge Card */}
      <div className={`p-6 rounded-2xl border transition-all ${citizenBorder} space-y-5 bg-slate-900/90 shadow-2xl`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400">Current Area Under Inspection</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{current.location.name}</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              {current.location.district}, {current.location.state}
            </div>
          </div>

          <div className="sm:text-right">
            <span className={`inline-block px-4 py-1.5 rounded-xl text-xs sm:text-sm font-mono font-bold shadow ${citizenColorBadge}`}>
              {citizenStatusLabel}
            </span>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Safety Indicator: <strong className="text-white">{activeRiskScore}/100</strong>
            </div>
          </div>
        </div>

        {/* Current Weather / Conditions */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Rainfall & Slope Moisture Status</div>
              <div className="text-xs text-slate-400">
                {isDemoInspecting
                  ? `${activeRainfall.toFixed(1)} mm/h precipitation · ${demoState.phaseTitle}`
                  : `${current.weather.weatherDescription} · Temp: ${current.weather.tempC}°C`}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <div className="text-sky-400 font-bold">{activeAccum.toFixed(0)} mm</div>
            <div className="text-[10px] text-slate-500">72-hr moisture accumulation</div>
          </div>
        </div>

        {/* Citizen Safety Actions (Mandated Section 9) */}
        <div className="space-y-3">
          <div className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Citizen-Friendly Action Directives:
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-200">
            {activeRiskLevel === 'CRITICAL' ? (
              <>
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-300">Avoid the Affected Corridor:</strong> Total road blockage & debris flows are occurring along the NH-10 / 9th Mile hill scarp. Do not travel on this highway.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Move Away from Unstable Slopes:</strong> If your residence is adjacent to steep road cuts, retaining walls, or natural rainwater gullies, proceed to designated ridge community centers.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Follow Official Emergency Instructions:</strong> Comply immediately with civil defence, Sikkim Police, and SDRF field personnel.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Monitor Further Warnings:</strong> Keep mobile battery charged; monitor official All India Radio announcements on 100.8 MHz.
                  </div>
                </div>
              </>
            ) : activeRiskLevel === 'HIGH' ? (
              <>
                <div className="p-3 rounded-xl bg-orange-950/50 border border-orange-500/50 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-orange-300">Avoid Unnecessary Travel Through the Hazard Zone:</strong> Wet hill slopes are heavily saturated. Avoid driving along steep mountain passes unless absolutely necessary.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Move Away from Cut Slopes:</strong> Keep clear of unprotected rock cuttings and recently widened roadside earth banks.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Watch for Water Inundation:</strong> Do not cross overflowing culverts or walking trails where muddy water is flowing.
                  </div>
                </div>
              </>
            ) : activeRiskLevel === 'MODERATE' ? (
              <>
                <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/40 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-yellow-200">Elevated Precaution on Ghat Roads:</strong> Rain showers are increasing subsoil moisture. Drive with caution; watch for minor falling rocks.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Keep Roadside Drains Clear:</strong> Ensure rainwater is flowing freely through neighborhood gutters without damming.
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Safe / Normal Conditions:</strong> Current rainfall and slope factors indicate nominal risk. Maintain standard environmental awareness.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Essential Safety Disclaimer (Mandated Section 9) */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong>Safety Disclaimer:</strong> LANDGUARD AI provides predictive decision-support and does not guarantee individual safety. LANDGUARD does not automatically issue real emergency instructions to external municipal systems. Always follow directives from local disaster management authorities (SDMA/DDMA) and emergency services.
          </div>
        </div>
      </div>

      {/* Emergency Helpline Contacts */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <PhoneCall className="w-4 h-4" /> 24/7 Disaster Emergency Helplines (North East India)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-lg font-bold font-mono text-rose-400">112</div>
            <div className="text-[10px] text-slate-400 mt-0.5">National Emergency Helpline</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-lg font-bold font-mono text-cyan-400">1070</div>
            <div className="text-[10px] text-slate-400 mt-0.5">State SDMA Control Room</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-lg font-bold font-mono text-amber-400">1077</div>
            <div className="text-[10px] text-slate-400 mt-0.5">District Disaster Helpline (DDMA)</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-lg font-bold font-mono text-emerald-400">108</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Medical Ambulance Emergency</div>
          </div>
        </div>
      </div>
    </div>
  );
};
