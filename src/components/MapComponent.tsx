import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationFullReport, HistoricalLandslide } from '../types/landguard';
import { ShieldAlert, Layers, Eye, MapPin, CloudRain, Hospital, School, AlertTriangle, Crosshair } from 'lucide-react';

interface MapComponentProps {
  locations: LocationFullReport[];
  historicalLandslides?: HistoricalLandslide[];
  selectedLocationId?: string | null;
  onSelectLocation: (locationId: string) => void;
  heightClass?: string;
  selectedRadiusKm?: number;
  highlightCriticalHotspots?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  locations,
  historicalLandslides = [],
  selectedLocationId,
  onSelectLocation,
  heightClass = 'h-[620px]',
  selectedRadiusKm = 2.5,
  highlightCriticalHotspots = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const riskLayerRef = useRef<L.LayerGroup | null>(null);
  const historicalLayerRef = useRef<L.LayerGroup | null>(null);
  const rainfallLayerRef = useRef<L.LayerGroup | null>(null);
  const infraLayerRef = useRef<L.LayerGroup | null>(null);
  const bufferCircleRef = useRef<L.Circle | null>(null);

  // Layer toggle states
  const [showRiskLayer, setShowRiskLayer] = useState(true);
  const [showHistoricalLayer, setShowHistoricalLayer] = useState(true);
  const [showRainfallLayer, setShowRainfallLayer] = useState(false);
  const [showInfraLayer, setShowInfraLayer] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on North-East India (Assam, Meghalaya, Sikkim, Arunachal corridor)
    const map = L.map(mapContainerRef.current, {
      center: [26.2, 92.8],
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
    });

    // Add zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // CartoDB Dark Matter tile layer for command-center look
    const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
    if (!cartoApiKey) {
      console.warn(
        '[LANDGUARD AI] CARTO basemap API key is missing. Set VITE_CARTO_API_KEY in your environment to authenticate CARTO Dark Matter raster tiles.'
      );
    }
    const tileUrl = cartoApiKey
      ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoApiKey}`
      : 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Initialize Layer Groups
    riskLayerRef.current = L.layerGroup().addTo(map);
    historicalLayerRef.current = L.layerGroup().addTo(map);
    rainfallLayerRef.current = L.layerGroup().addTo(map);
    infraLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Risk Hotspots layer
  useEffect(() => {
    if (!mapInstanceRef.current || !riskLayerRef.current) return;
    riskLayerRef.current.clearLayers();

    if (!showRiskLayer) return;

    locations.forEach((item) => {
      const { location, risk, weather } = item;
      const isSelected = selectedLocationId === location.id;

      // Color based on risk level
      let color = '#10b981'; // LOW emerald
      let pulseClass = '';
      if (risk.riskLevel === 'CRITICAL') {
        color = '#ef4444';
        pulseClass = highlightCriticalHotspots ? 'hotspot-pulse-critical' : '';
      } else if (risk.riskLevel === 'HIGH') {
        color = '#f97316';
        pulseClass = highlightCriticalHotspots ? 'hotspot-pulse-high' : '';
      } else if (risk.riskLevel === 'MODERATE') {
        color = '#eab308';
      }

      // Custom HTML Marker with radar pulse
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full ${pulseClass} flex items-center justify-center border-2 shadow-lg transition-transform duration-200 group-hover:scale-125" style="background-color: ${color}25; border-color: ${color};">
            <div class="w-3.5 h-3.5 rounded-full shadow" style="background-color: ${color};"></div>
          </div>
          ${
            isSelected
              ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border border-slate-900 animate-ping"></div>`
              : ''
          }
          <div class="absolute top-8 pointer-events-none whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight bg-slate-950/90 border border-slate-800 text-slate-200 shadow-md">
            ${location.name.split('(')[0].trim()} · <span style="color: ${color}">${risk.compositeScore}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-risk-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([location.lat, location.lng], { icon: customIcon });

      // Popup content with all 9 mandated hotspot inspection fields
      const popupHtml = `
        <div class="p-2.5 text-slate-100 font-sans text-xs min-w-[240px] max-w-[280px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
            <span class="font-bold text-sm tracking-wide text-white">${location.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style="background: ${color}20; color: ${color}; border: 1px solid ${color};">
              ${risk.riskLevel} (${risk.compositeScore}/100)
            </span>
          </div>
          <div class="space-y-1 text-slate-300 font-sans">
            <div><strong class="text-slate-400">Risk Score:</strong> <span class="font-mono font-bold" style="color: ${color}">${risk.compositeScore}/100 (${risk.riskLevel})</span></div>
            <div><strong class="text-slate-400">Rainfall:</strong> <span class="font-mono">${weather.currentRainfallMm.toFixed(1)} mm/h (${weather.accumulatedRain72hMm.toFixed(0)}mm 72h)</span></div>
            <div><strong class="text-slate-400">Slope:</strong> <span class="font-mono">${location.slope}° (${location.aspect})</span></div>
            <div><strong class="text-slate-400">Historical Activity:</strong> <span class="font-mono text-purple-300">${risk.historical.actualMetric}</span></div>
            <div><strong class="text-slate-400">Terrain:</strong> ${location.lithology.split('(')[0].trim()} (TRI ${location.ruggednessIndex})</div>
            <div><strong class="text-slate-400">Nearby Infra:</strong> <span class="text-slate-200">${item.impact.settlementsCount} settl., ${item.impact.schoolsCount} sch., ${item.impact.hospitalsCount} hosp., ${item.impact.majorRoadsCount} rds</span></div>
            <div><strong class="text-slate-400">Impact Priority:</strong> <span class="font-mono font-bold ${item.impact.overallPriority === 'URGENT' ? 'text-rose-400' : item.impact.overallPriority === 'HIGH' ? 'text-amber-400' : 'text-slate-300'}">${item.impact.overallPriority}</span></div>
            <div class="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
              Last Updated: ${new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button id="btn-inspect-${location.id}" class="mt-2.5 w-full py-1.5 text-center font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition shadow cursor-pointer">
            Inspect Full Site Intelligence →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'dark-leaflet-popup',
        closeButton: false,
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${location.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectLocation(location.id);
          };
        }
      });

      marker.on('click', () => {
        onSelectLocation(location.id);
      });

      riskLayerRef.current?.addLayer(marker);
    });
  }, [locations, showRiskLayer, selectedLocationId, highlightCriticalHotspots, onSelectLocation]);

  // Update Historical Landslides Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !historicalLayerRef.current) return;
    historicalLayerRef.current.clearLayers();

    if (!showHistoricalLayer) return;

    historicalLandslides.forEach((item) => {
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: 6,
        color: '#c084fc', // purple-400
        fillColor: '#9333ea',
        fillOpacity: 0.85,
        weight: 1.5,
      });

      const popupHtml = `
        <div class="p-2 text-slate-100 font-sans text-xs min-w-[210px]">
          <div class="flex items-center gap-1.5 text-purple-400 font-bold border-b border-slate-700 pb-1 mb-1">
            <span>⚠ Historical Slide Event</span>
            <span class="ml-auto text-[10px] text-slate-400 font-mono">${item.date}</span>
          </div>
          <div class="font-semibold text-white">${item.locationName}</div>
          <div class="text-[11px] text-slate-300 mt-1">
            <span class="text-slate-400">Trigger:</span> ${item.trigger}
          </div>
          <div class="text-[11px] text-slate-300">
            <span class="text-slate-400">Severity:</span> <span class="text-rose-400 font-bold">${item.severity}</span> (Casualties: ${item.casualties})
          </div>
          <div class="text-[10px] text-slate-400 italic mt-1.5 border-t border-slate-800 pt-1">
            ${item.damageSummary}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'dark-leaflet-popup' });
      historicalLayerRef.current?.addLayer(marker);
    });
  }, [historicalLandslides, showHistoricalLayer]);

  // Update Rainfall intensity Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !rainfallLayerRef.current) return;
    rainfallLayerRef.current.clearLayers();

    if (!showRainfallLayer) return;

    locations.forEach((item) => {
      const rain = item.weather.accumulatedRain72hMm;
      // Draw rain intensity circle
      const radius = Math.max(12000, rain * 250);
      const circle = L.circle([item.location.lat, item.location.lng], {
        radius,
        color: '#38bdf8',
        fillColor: '#0284c7',
        fillOpacity: Math.min(0.35, (rain / 250) * 0.35),
        weight: 1,
        dashArray: '4, 6',
      });

      circle.bindTooltip(`72h Precipitation: ${rain.toFixed(0)} mm`, { sticky: true });
      rainfallLayerRef.current?.addLayer(circle);
    });
  }, [locations, showRainfallLayer]);

  // Update Infrastructure Layer for the selected location (or all if selected)
  useEffect(() => {
    if (!mapInstanceRef.current || !infraLayerRef.current) return;
    infraLayerRef.current.clearLayers();

    if (!showInfraLayer) return;

    const targetLoc = locations.find((l) => l.location.id === selectedLocationId) || locations[0];
    if (!targetLoc) return;

    targetLoc.impact.nearbyInfrastructure.forEach((infra) => {
      let iconColor = '#38bdf8';
      let symbol = '📍';
      if (infra.type === 'hospital') {
        iconColor = '#ec4899';
        symbol = '🏥';
      } else if (infra.type === 'school') {
        iconColor = '#fbbf24';
        symbol = '🏫';
      } else if (infra.type === 'road' || infra.type === 'railway' || infra.type === 'bridge') {
        iconColor = '#60a5fa';
        symbol = '🛣';
      } else if (infra.type === 'settlement') {
        iconColor = '#34d399';
        symbol = '🏘';
      }

      const infraDiv = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full flex items-center justify-center text-[12px] bg-slate-900 border border-slate-700 shadow" title="${infra.name}">${symbol}</div>`,
        className: 'infra-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([infra.lat, infra.lng], { icon: infraDiv });
      marker.bindPopup(`
        <div class="p-1.5 text-xs text-slate-100">
          <div class="font-bold text-white capitalize">${infra.type}: ${infra.name}</div>
          <div class="text-slate-300 mt-0.5">${infra.details}</div>
          <div class="text-[10px] text-cyan-400 mt-1 font-mono">Distance: ${infra.distanceKm} km from slope trigger</div>
        </div>
      `, { className: 'dark-leaflet-popup' });

      infraLayerRef.current?.addLayer(marker);
    });
  }, [locations, selectedLocationId, showInfraLayer]);

  // Handle selected location camera pan & buffer radius circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing buffer circle
    if (bufferCircleRef.current) {
      map.removeLayer(bufferCircleRef.current);
      bufferCircleRef.current = null;
    }

    if (!selectedLocationId) return;
    const item = locations.find((l) => l.location.id === selectedLocationId);
    if (!item) return;

    map.flyTo([item.location.lat, item.location.lng], 10, {
      duration: 1.2,
    });

    // Add buffer radius circle (Who is at risk proximity buffer)
    const effectiveRadiusKm = item.impact?.radiusKm ?? selectedRadiusKm;
    const isCrit = item.risk.riskLevel === 'CRITICAL';
    const isHigh = item.risk.riskLevel === 'HIGH';
    const isMod = item.risk.riskLevel === 'MODERATE';

    const circleColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : isMod ? '#eab308' : '#06b6d4';
    const circleFill = isCrit ? '#f43f5e' : isHigh ? '#fb923c' : isMod ? '#facc15' : '#0891b2';
    const circleOpacity = isCrit ? 0.25 : isHigh ? 0.18 : isMod ? 0.15 : 0.12;

    const circle = L.circle([item.location.lat, item.location.lng], {
      radius: effectiveRadiusKm * 1000,
      color: circleColor,
      fillColor: circleFill,
      fillOpacity: circleOpacity,
      weight: isCrit ? 2.5 : 1.5,
      dashArray: isCrit ? '4, 4' : '6, 6',
    }).addTo(map);

    circle.bindTooltip(`Proximity Impact Buffer: ${effectiveRadiusKm.toFixed(1)} km • ${item.risk.riskLevel} (${item.impact.nearbyInfrastructure.length} assets monitored)`, {
      permanent: false,
      direction: 'top',
    });

    bufferCircleRef.current = circle;
  }, [selectedLocationId, selectedRadiusKm, locations]);

  // Center on entire NER
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([26.2, 92.8], 7, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map canvas */}
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Layer Controls Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-xl text-xs text-slate-200">
        <span className="flex items-center gap-1 px-2 py-1 font-semibold text-cyan-400 font-mono tracking-wider text-[11px] border-r border-slate-700 pr-2">
          <Layers className="w-3.5 h-3.5" /> GIS LAYERS
        </span>

        <button
          onClick={() => setShowRiskLayer(!showRiskLayer)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium cursor-pointer ${
            showRiskLayer
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Risk Hotspots
        </button>

        <button
          onClick={() => setShowHistoricalLayer(!showHistoricalLayer)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium cursor-pointer ${
            showHistoricalLayer
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Historical GSI Slides
        </button>

        <button
          onClick={() => setShowRainfallLayer(!showRainfallLayer)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium cursor-pointer ${
            showRainfallLayer
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-3 h-3 text-sky-400" />
          Precipitation Contour
        </button>

        <button
          onClick={() => setShowInfraLayer(!showInfraLayer)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition font-medium cursor-pointer ${
            showInfraLayer
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hospital className="w-3 h-3 text-emerald-400" />
          OSM Infrastructure
        </button>

        <button
          onClick={handleResetView}
          title="Fit North East Region View"
          className="ml-1 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 p-3 shadow-xl max-w-[280px]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1">
          <span className="tracking-wider uppercase font-mono text-cyan-400">Susceptibility Index</span>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-slate-400 hover:text-slate-200 text-[10px]"
          >
            {showLegend ? 'Hide' : 'Show'}
          </button>
        </div>

        {showLegend && (
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"></span>
                Critical (76 - 100)
              </span>
              <span className="font-mono text-rose-400 font-bold">Immediate Alert</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                High (51 - 75)
              </span>
              <span className="font-mono text-orange-400">Elevated Alert</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                Moderate (26 - 50)
              </span>
              <span className="font-mono text-yellow-400">Surveillance</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Low (0 - 25)
              </span>
              <span className="font-mono text-emerald-400">Nominal</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>GSI Historical Slide Record [DATASET]</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800 text-[9px] text-slate-400 font-mono leading-tight">
                <div><strong className="text-cyan-400">LANDGUARD LAYERS:</strong> Physical-Empirical Risk Engine, Open-Meteo Telemetry, GSI Catalogue</div>
                <div className="mt-1 pt-1 border-t border-slate-800 text-slate-500">
                  <strong>BASE MAP:</strong> OpenStreetMap & CartoDB Dark Matter (Third-Party Base Cartography)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Region Status Badge (Top Right) */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-800 text-xs shadow-xl">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="font-mono text-[11px] text-slate-300">
          NER SECTOR: <strong className="text-white">8 STATES / 18 HIGHWAYS</strong>
        </span>
      </div>
    </div>
  );
};
