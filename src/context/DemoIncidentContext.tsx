import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  DemoIncidentState,
  DemoPhase,
  InfrastructureItem,
  RiskLevel,
} from '../types/landguard';
import { DEMO_INCIDENT_STEPS, GANGTOK_DEMO_INFRASTRUCTURE } from '../data/demoIncidentData';
import { triggerDemoIncident, resetDemoIncident } from '../services/apiClient';

interface DemoIncidentContextType {
  state: DemoIncidentState;
  triggerDemo: (targetLocationId?: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  restart: () => void;
  replay: () => void;
  seekToStep: (stepIndex: number) => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
}

const DEFAULT_STATE: DemoIncidentState = {
  active: false,
  phase: 'IDLE',
  stepIndex: 0,
  totalSteps: DEMO_INCIDENT_STEPS.length,
  locationId: 'sik-gangtok',
  locationName: 'Gangtok Corridor (NH-10 / 9th Mile)',
  locationState: 'Sikkim',
  locationDistrict: 'East Sikkim',
  timestamp: new Date().toISOString(),
  displayTime: 'Now',
  rainfallRateMmH: 0.8,
  antecedentSaturationMm: 28.0,
  poreWaterRatio: 0.15,
  physicalRisk: 16,
  mlRisk: 22,
  hybridRisk: 17,
  riskLevel: 'LOW',
  hotspotActive: false,
  bufferRadiusKm: 0.8,
  exposedInfrastructure: [],
  exposedCounts: { schools: 0, hospitals: 0, roads: 0, settlements: 0, bridges: 0, total: 0 },
  alertLevel: 'NORMAL',
  authorityRecommendations: [
    'Normal baseline telemetry monitoring across East Sikkim district.',
    'Routine slope inspection along NH-10 culverts and retaining gabions.',
  ],
  citizenGuidance: [
    'Current status: SAFE / NORMAL MONITORING.',
    'Normal road travel permitted across Gangtok and Singtam corridor.',
  ],
  isPlaying: false,
  playbackSpeed: 1,
  isComplete: false,
  phaseTitle: 'Normal Telemetry Baseline',
  scientificInsight: 'Pore-water pressure is negligible. Soil effective shear strength remains high.',
};

const DemoIncidentContext = createContext<DemoIncidentContextType | undefined>(undefined);

export const DemoIncidentProvider: React.FC<{
  children: React.ReactNode;
  onRefreshData?: () => void;
}> = ({ children, onRefreshData }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);

  // Compute the current step object
  const currentStep = useMemo(() => {
    const idx = Math.max(0, Math.min(DEMO_INCIDENT_STEPS.length - 1, currentStepIndex));
    return DEMO_INCIDENT_STEPS[idx];
  }, [currentStepIndex]);

  // Compute exposed infrastructure at the current step's buffer radius
  const exposedInfra = useMemo(() => {
    if (!isActive) return [];
    return GANGTOK_DEMO_INFRASTRUCTURE.filter((i) => i.distanceKm <= currentStep.bufferRadiusKm);
  }, [isActive, currentStep.bufferRadiusKm]);

  const exposedCounts = useMemo(() => {
    return {
      schools: exposedInfra.filter((i) => i.type === 'school').length,
      hospitals: exposedInfra.filter((i) => i.type === 'hospital').length,
      roads: exposedInfra.filter((i) => i.type === 'road' || i.type === 'railway').length,
      settlements: exposedInfra.filter((i) => i.type === 'settlement').length,
      bridges: exposedInfra.filter((i) => i.type === 'bridge').length,
      total: exposedInfra.length,
    };
  }, [exposedInfra]);

  const isComplete = currentStepIndex >= DEMO_INCIDENT_STEPS.length - 1;

  // Build the unified state
  const state: DemoIncidentState = useMemo(() => {
    if (!isActive) {
      return DEFAULT_STATE;
    }

    const now = new Date();
    // Simulate timestamps backwards from now based on step's hoursAgo
    const simTime = new Date(now.getTime() - currentStep.hoursAgo * 3600000);
    const displayTime =
      currentStep.hoursAgo === 0
        ? 'Now'
        : simTime.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

    return {
      active: true,
      phase: currentStep.phase,
      stepIndex: currentStep.stepIndex,
      totalSteps: DEMO_INCIDENT_STEPS.length,
      locationId: 'sik-gangtok',
      locationName: 'Gangtok Corridor (NH-10 / 9th Mile)',
      locationState: 'Sikkim',
      locationDistrict: 'East Sikkim',
      timestamp: simTime.toISOString(),
      displayTime,
      rainfallRateMmH: currentStep.rainfallRateMmH,
      antecedentSaturationMm: currentStep.accumulatedRain72hMm,
      poreWaterRatio: currentStep.poreWaterRatio,
      physicalRisk: currentStep.physicalRisk,
      mlRisk: currentStep.mlSusceptibility,
      hybridRisk: currentStep.hybridScore,
      riskLevel: currentStep.riskLevel,
      hotspotActive: currentStep.isHotspot,
      bufferRadiusKm: currentStep.bufferRadiusKm,
      exposedInfrastructure: exposedInfra,
      exposedCounts,
      alertLevel: currentStep.alertLevel,
      authorityRecommendations: currentStep.authorityRecommendations,
      citizenGuidance: currentStep.citizenGuidance,
      isPlaying,
      playbackSpeed,
      isComplete,
      phaseTitle: currentStep.phaseTitle,
      scientificInsight: currentStep.scientificInsight,
    };
  }, [isActive, currentStep, exposedInfra, exposedCounts, isPlaying, playbackSpeed, isComplete]);

  // Central playback loop timer
  // 18 steps = 17 transitions. At 3500ms per step at 1x speed, total duration is ~59.5 seconds (~60s).
  // At 2x speed: ~29.8s. At 4x speed: ~14.9s.
  useEffect(() => {
    if (!isActive || !isPlaying) return;

    const BASE_STEP_DURATION_MS = 3500;
    const intervalMs = Math.round(BASE_STEP_DURATION_MS / playbackSpeed);
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= DEMO_INCIDENT_STEPS.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isActive, isPlaying, playbackSpeed]);

  // Actions
  const triggerDemo = useCallback(async (targetLocationId = 'sik-gangtok') => {
    try {
      await triggerDemoIncident(targetLocationId);
    } catch (e) {
      console.warn('triggerDemo API call caught:', e);
    }
    setIsActive(true);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    if (onRefreshData) onRefreshData();
  }, [onRefreshData]);

  const resetDemo = useCallback(async () => {
    try {
      await resetDemoIncident();
    } catch (e) {
      console.warn('resetDemo API call caught:', e);
    }
    setIsPlaying(false);
    setIsActive(false);
    setCurrentStepIndex(0);
    if (onRefreshData) onRefreshData();
  }, [onRefreshData]);

  const play = useCallback(() => {
    if (currentStepIndex >= DEMO_INCIDENT_STEPS.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const restart = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, []);

  const replay = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, []);

  const seekToStep = useCallback((stepIndex: number) => {
    const valid = Math.max(0, Math.min(DEMO_INCIDENT_STEPS.length - 1, stepIndex));
    setCurrentStepIndex(valid);
  }, []);

  const setSpeed = useCallback((speed: 1 | 2 | 4) => {
    setPlaybackSpeed(speed);
  }, []);

  return (
    <DemoIncidentContext.Provider
      value={{
        state,
        triggerDemo,
        resetDemo,
        play,
        pause,
        togglePlay,
        restart,
        replay,
        seekToStep,
        setSpeed,
      }}
    >
      {children}
    </DemoIncidentContext.Provider>
  );
};

export const useDemoIncident = (): DemoIncidentContextType => {
  const context = useContext(DemoIncidentContext);
  if (!context) {
    throw new Error('useDemoIncident must be used within a DemoIncidentProvider');
  }
  return context;
};
