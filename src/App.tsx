import React, { useState, useEffect, useMemo } from 'react';
import {
  LocationFullReport,
  SystemStats,
  HistoricalLandslide,
  EarlyWarningAlert,
  PriorityLevel,
} from './types/landguard';
import {
  fetchSystemStatus,
  fetchAllLocations,
  fetchHistoricalLandslides,
  fetchAlerts,
} from './services/apiClient';
import { Navbar, AppView } from './components/Navbar';
import { DemoBar } from './components/DemoBar';
import { LocationDetailModal } from './components/LocationDetailModal';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { TimelineView } from './views/TimelineView';
import { MapView } from './views/MapView';
import { LocationAnalysisView } from './views/LocationAnalysisView';
import { HistoricalView } from './views/HistoricalView';
import { AlertsView } from './views/AlertsView';
import { CitizenView } from './views/CitizenView';
import { AIAssistantView } from './views/AIAssistantView';
import { AboutView } from './views/AboutView';
import { DemoIncidentProvider, useDemoIncident } from './context/DemoIncidentContext';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [locations, setLocations] = useState<LocationFullReport[]>([]);
  const [historicalLandslides, setHistoricalLandslides] = useState<HistoricalLandslide[]>([]);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>('sik-gangtok');
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { state: demoState, triggerDemo, resetDemo } = useDemoIncident();

  // Initial load
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, locsData, histData, alertsData] = await Promise.all([
        fetchSystemStatus(),
        fetchAllLocations(),
        fetchHistoricalLandslides(),
        fetchAlerts(),
      ]);

      setStats(statsData);
      setLocations(locsData);
      setHistoricalLandslides(histData);
      setAlerts(alertsData);
    } catch (e) {
      console.error('Failed to load initial LANDGUARD AI data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle selecting a location (from map or list)
  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id);
    setIsDetailDrawerOpen(true);
  };

  // Trigger Demo Incident mode
  const handleTriggerDemo = async () => {
    setIsDetailDrawerOpen(false);
    await triggerDemo('sik-gangtok');
    setSelectedLocationId('sik-gangtok');
    setCurrentView('timeline');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Demo mode
  const handleResetDemo = async () => {
    await resetDemo();
    await loadData();
  };

  // Direct AI ask query on location
  const handleAskAI = (locationId: string) => {
    setSelectedLocationId(locationId);
    setIsDetailDrawerOpen(false);
    setCurrentView('ai-assistant');
  };

  // Navigate to full report
  const handleOpenFullReport = (locationId: string) => {
    setSelectedLocationId(locationId);
    setIsDetailDrawerOpen(false);
    setCurrentView('location-analysis');
  };

  // Dynamic synchronized locations during demo incident
  const effectiveLocations = useMemo(() => {
    if (!demoState.active) return locations;

    return locations.map((item) => {
      if (item.location.id === demoState.locationId) {
        return {
          ...item,
          weather: {
            ...item.weather,
            currentRainfallMm: demoState.rainfallRateMmH,
            accumulatedRain72hMm: demoState.antecedentSaturationMm,
            weatherDescription:
              demoState.riskLevel === 'CRITICAL'
                ? 'Severe Cloudburst Deluge (DEMO / SIMULATION)'
                : demoState.riskLevel === 'HIGH'
                ? 'Heavy Rain Surcharge (DEMO / SIMULATION)'
                : 'Simulated Influx (DEMO / SIMULATION)',
            isRealApi: false,
            source: 'Simulated Cloudburst Incident (DEMO / SIMULATION)',
          },
          risk: {
            ...item.risk,
            compositeScore: demoState.physicalRisk,
            physicalScore: demoState.physicalRisk,
            mlSusceptibility: demoState.mlRisk,
            hybridScore: demoState.hybridRisk,
            riskLevel: demoState.riskLevel,
            isHotspot: demoState.hotspotActive,
            explanation: demoState.scientificInsight,
          },
          impact: {
            ...item.impact,
            radiusKm: demoState.bufferRadiusKm,
            nearbyInfrastructure: demoState.exposedInfrastructure,
            settlementsCount: demoState.exposedCounts.settlements,
            schoolsCount: demoState.exposedCounts.schools,
            hospitalsCount: demoState.exposedCounts.hospitals,
            majorRoadsCount: demoState.exposedCounts.roads,
            overallPriority: (demoState.riskLevel === 'CRITICAL'
              ? 'URGENT'
              : demoState.riskLevel === 'HIGH'
              ? 'HIGH'
              : demoState.riskLevel === 'MODERATE'
              ? 'MODERATE'
              : 'LOW') as PriorityLevel,
          },
        };
      }
      return item;
    });
  }, [locations, demoState]);

  const inspectedReport =
    effectiveLocations.find((l) => l.location.id === selectedLocationId) || effectiveLocations[0] || null;

  // Synthesize simulated alert for Gangtok when demo is active
  const effectiveAlerts = useMemo(() => {
    if (!demoState.active || demoState.alertLevel === 'NORMAL') {
      return alerts;
    }

    const demoAlert: EarlyWarningAlert = {
      id: `alert-demo-${demoState.locationId}`,
      locationId: demoState.locationId,
      locationName: demoState.locationName,
      state: demoState.locationState,
      severity: demoState.riskLevel,
      riskScore: demoState.physicalRisk,
      issuedAt: demoState.timestamp,
      status: 'ACTIVE',
      triggerReason: `[DEMO SIMULATION] ${demoState.scientificInsight}`,
      priorityRank: demoState.riskLevel === 'CRITICAL' ? 1 : 2,
      recommendedActions: demoState.authorityRecommendations,
    };

    return [demoAlert, ...alerts.filter((a) => a.locationId !== demoState.locationId)];
  }, [alerts, demoState]);

  const criticalCount = effectiveLocations.filter((l) => l.risk.riskLevel === 'CRITICAL').length;
  const effectiveAlertCount = demoState.active
    ? effectiveAlerts.length
    : (stats?.activeAlerts ?? alerts.length);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeAlertCount={effectiveAlertCount}
        criticalCount={criticalCount}
      />

      {/* Demo Incident Simulation Banner (Prominently featured for presentations) */}
      <DemoBar
        onSelectHotspot={(id) => {
          setSelectedLocationId(id);
          setIsDetailDrawerOpen(true);
        }}
        onNavigateToTimeline={() => {
          setSelectedLocationId('sik-gangtok');
          setCurrentView('timeline');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {currentView === 'landing' && (
          <LandingView
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTriggerDemo={handleTriggerDemo}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            stats={stats}
            locations={effectiveLocations}
            historicalLandslides={historicalLandslides}
            alerts={effectiveAlerts}
            selectedLocationId={selectedLocationId}
            onSelectLocation={handleSelectLocation}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRefreshData={loadData}
            isLoading={isLoading}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            locations={effectiveLocations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(id) => setSelectedLocationId(id)}
            onNavigateToMap={(id) => {
              setSelectedLocationId(id);
              setCurrentView('map');
            }}
            isDemoActive={demoState.active}
            onTriggerDemo={handleTriggerDemo}
            onResetDemo={handleResetDemo}
          />
        )}

        {currentView === 'map' && (
          <MapView
            locations={effectiveLocations}
            historicalLandslides={historicalLandslides}
            selectedLocationId={selectedLocationId}
            onSelectLocation={handleSelectLocation}
            onNavigateToTimeline={(id) => {
              setSelectedLocationId(id);
              setCurrentView('timeline');
            }}
          />
        )}

        {currentView === 'location-analysis' && (
          <LocationAnalysisView
            locations={effectiveLocations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(id) => setSelectedLocationId(id)}
            onNavigate={(view) => setCurrentView(view)}
            onAskAI={handleAskAI}
          />
        )}

        {currentView === 'historical' && (
          <HistoricalView
            historicalLandslides={historicalLandslides}
            onSelectOnMap={(name) => {
              const matched = effectiveLocations.find((l) => l.location.name.includes(name));
              if (matched) {
                setSelectedLocationId(matched.location.id);
                setCurrentView('map');
              }
            }}
          />
        )}

        {currentView === 'alerts' && (
          <AlertsView
            alerts={effectiveAlerts}
            onSelectLocation={handleSelectLocation}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'citizen' && (
          <CitizenView
            locations={effectiveLocations}
            onSelectLocation={(id) => setSelectedLocationId(id)}
          />
        )}

        {currentView === 'ai-assistant' && (
          <AIAssistantView
            locations={effectiveLocations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(id) => setSelectedLocationId(id)}
          />
        )}

        {currentView === 'about' && <AboutView />}
      </main>

      {/* Slide-in Inspection Drawer for Map Node Clicks */}
      {isDetailDrawerOpen && (
        <LocationDetailModal
          report={inspectedReport}
          onClose={() => setIsDetailDrawerOpen(false)}
          onOpenFullReport={handleOpenFullReport}
          onOpenTimeline={(id) => {
            setSelectedLocationId(id);
            setIsDetailDrawerOpen(false);
            setCurrentView('timeline');
          }}
          onAskAI={handleAskAI}
        />
      )}

      {/* Global Command Center Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-300">LANDGUARD.AI</span>
            <span>— North Eastern Region Landslide Risk Monitoring & Early Warning System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Open-Meteo & IMD Telemetry</span>
            <span>·</span>
            <span>GSI NLSM Archive</span>
            <span>·</span>
            <span>OpenStreetMap</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DemoIncidentProvider>
      <AppContent />
    </DemoIncidentProvider>
  );
}
