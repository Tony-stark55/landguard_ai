import { DemoIncidentStep, InfrastructureItem } from '../types/landguard';
import { NEARBY_INFRASTRUCTURE } from './nerData';

export const GANGTOK_DEMO_INFRASTRUCTURE: InfrastructureItem[] =
  NEARBY_INFRASTRUCTURE['sik-gangtok'] || [];

export const DEMO_INCIDENT_STEPS: DemoIncidentStep[] = [
  // =========================================================================
  // Phase 1: Atmospheric Baseline / Influx Precursor (Steps 0 - 2)
  // Low rainfall, low saturation, low risk
  // =========================================================================
  {
    stepIndex: 0,
    phase: 'ATMOSPHERIC_INFLUX',
    phaseCategory: 'ATMOSPHERIC_INFLUX',
    phaseTitle: 'Phase 1: Pre-Monsoon Atmospheric Calm & Baseline',
    hoursAgo: 17.0,
    rainfallRateMmH: 0.8,
    accumulatedRain72hMm: 28.0,
    poreWaterRatio: 0.15,
    physicalRisk: 16,
    mlSusceptibility: 22,
    hybridScore: 17,
    riskLevel: 'LOW',
    isHotspot: false,
    bufferRadiusKm: 0.8,
    alertLevel: 'NORMAL',
    authorityRecommendations: [
      'Normal baseline telemetry monitoring across East Sikkim district.',
      'Routine slope inspection along NH-10 culverts and retaining gabions.',
      'Verify communications link with Gangtok Emergency Operations Centre (EOC).'
    ],
    citizenGuidance: [
      'Current status: SAFE / NORMAL MONITORING.',
      'Normal road travel permitted across Gangtok and Singtam corridor.',
      'Maintain awareness of local daily weather forecasts.'
    ],
    summary: 'Calm overcast conditions over Gangtok ridge; subsoil moisture well within normal drainage capacity.',
    scientificInsight: 'Pore-water pressure is negligible. Soil effective shear strength (Mohr-Coulomb) remains high; Factor of Safety (FoS) > 2.1.'
  },
  {
    stepIndex: 1,
    phase: 'ATMOSPHERIC_INFLUX',
    phaseCategory: 'ATMOSPHERIC_INFLUX',
    phaseTitle: 'Phase 1: Light Foothill Showers & Orographic Condensation',
    hoursAgo: 16.0,
    rainfallRateMmH: 1.4,
    accumulatedRain72hMm: 32.0,
    poreWaterRatio: 0.19,
    physicalRisk: 19,
    mlSusceptibility: 24,
    hybridScore: 20,
    riskLevel: 'LOW',
    isHotspot: false,
    bufferRadiusKm: 0.8,
    alertLevel: 'NORMAL',
    authorityRecommendations: [
      'Maintain standard automated hydrometric sensor polling at 15-minute intervals.',
      'Keep road maintenance squads on scheduled readiness.',
      'Log atmospheric pressure drop across Teesta river basin.'
    ],
    citizenGuidance: [
      'Current status: SAFE / MONITORING.',
      'Light drizzle observed on upper slopes; roads wet but stable.',
      'Drive with headlights on along steep ghat roads.'
    ],
    summary: 'Light mountain drizzle. Intermittent hill fog with modest ground water infiltration.',
    scientificInsight: 'Capillary fringe saturation beginning in superficial colluvial layer (0-0.5m depth). Slope stability intact.'
  },
  {
    stepIndex: 2,
    phase: 'ATMOSPHERIC_INFLUX',
    phaseCategory: 'ATMOSPHERIC_INFLUX',
    phaseTitle: 'Phase 1: Moisture Influx Gathering Along Teesta Corridor',
    hoursAgo: 15.0,
    rainfallRateMmH: 2.6,
    accumulatedRain72hMm: 38.0,
    poreWaterRatio: 0.25,
    physicalRisk: 23,
    mlSusceptibility: 27,
    hybridScore: 24,
    riskLevel: 'LOW',
    isHotspot: false,
    bufferRadiusKm: 0.8,
    alertLevel: 'NORMAL',
    authorityRecommendations: [
      'Observe regional radar for convective thunderstorm cells approaching South/East Sikkim.',
      'Verify water level sensors on Rani Chu river basin.',
      'Ensure Border Roads Organisation (BRO / Project Swastik) heavy equipment is fueled.'
    ],
    citizenGuidance: [
      'Current status: SAFE / NORMAL CONDITIONS.',
      'No disruption to schools or transit along NH-10.',
      'Check local disaster authority radio for weather updates.'
    ],
    summary: 'Moisture-laden low pressure cell tracking northwards along Teesta valley; light steady rain.',
    scientificInsight: 'Matric suction in unsaturated phyllite saprolite begins decreasing as moisture content advances.'
  },

  // =========================================================================
  // Phase 2: Influx Intensification & Saturation Onset (Steps 3 - 6)
  // Rainfall increases, saturation begins increasing, risk moves toward MODERATE
  // =========================================================================
  {
    stepIndex: 3,
    phase: 'ATMOSPHERIC_INFLUX',
    phaseCategory: 'ATMOSPHERIC_INFLUX',
    phaseTitle: 'Phase 2: Convective Precipitation Escalation',
    hoursAgo: 13.5,
    rainfallRateMmH: 6.2,
    accumulatedRain72hMm: 48.0,
    poreWaterRatio: 0.33,
    physicalRisk: 31,
    mlSusceptibility: 34,
    hybridScore: 32,
    riskLevel: 'MODERATE',
    isHotspot: false,
    bufferRadiusKm: 1.4,
    alertLevel: 'ADVISORY',
    authorityRecommendations: [
      'Issue internal meteorological advisory to Sikkim State Disaster Management Authority (SSDMA).',
      'Deploy patrol vehicle along NH-10 9th Mile sinking stretch.',
      'Inspect roadside drainage channelling near Tadong Senior Secondary School.'
    ],
    citizenGuidance: [
      'Current status: ELEVATED RISK / WATCHFUL AWARENESS.',
      'Moderate showers commencing across Gangtok municipal area.',
      'Avoid loitering near steep unreinforced road embankments.'
    ],
    summary: 'Rainfall intensifies to 6.2 mm/h. Subsurface soil moisture gradient rising across upper slopes.',
    scientificInsight: 'Wetting front penetrating to 1.2m depth. Shear resistance along weathered schist foliation planes slightly reduced.'
  },
  {
    stepIndex: 4,
    phase: 'HEAVY_RAINFALL',
    phaseCategory: 'HEAVY_RAINFALL',
    phaseTitle: 'Phase 2: Persistent Orographic Rain Bands',
    hoursAgo: 12.0,
    rainfallRateMmH: 11.5,
    accumulatedRain72hMm: 64.0,
    poreWaterRatio: 0.42,
    physicalRisk: 39,
    mlSusceptibility: 41,
    hybridScore: 40,
    riskLevel: 'MODERATE',
    isHotspot: false,
    bufferRadiusKm: 1.4,
    alertLevel: 'ADVISORY',
    authorityRecommendations: [
      'Advise commercial truck traffic on NH-10 to exercise caution on hairpins.',
      'Review standby arrangements for Sikkim Police Disaster Response Force.',
      'Inspect Ranipool settlement culverts for siltation.'
    ],
    citizenGuidance: [
      'Current status: ELEVATED RISK / MODERATE CAUTION.',
      'Surface runoff accumulating on steep roads; slow down vehicular speed.',
      'Residents in valley settlement margins should monitor perimeter runoff.'
    ],
    summary: 'Steady downpour of 11.5 mm/h. Soil moisture entering moderate saturation threshold.',
    scientificInsight: 'Infiltration rate approaches hydraulic conductivity (Ksat ~ 3.2 x 10^-5 m/s). Shallow interflow initiated.'
  },
  {
    stepIndex: 5,
    phase: 'HEAVY_RAINFALL',
    phaseCategory: 'HEAVY_RAINFALL',
    phaseTitle: 'Phase 2: Escalating Rain Influx & Saturation Threshold',
    hoursAgo: 10.5,
    rainfallRateMmH: 16.8,
    accumulatedRain72hMm: 84.0,
    poreWaterRatio: 0.51,
    physicalRisk: 48,
    mlSusceptibility: 49,
    hybridScore: 48,
    riskLevel: 'MODERATE',
    isHotspot: false,
    bufferRadiusKm: 1.4,
    alertLevel: 'WATCH',
    authorityRecommendations: [
      'Escalate status to WATCH bulletin across East Sikkim District Magistrate office.',
      'Place BRO bulldozers on 15-minute standby at 9th Mile and Ranipool.',
      'Check structural status of 9th Mile suspension pedestrian bridge.'
    ],
    citizenGuidance: [
      'Current status: ELEVATED RISK / WATCH LEVEL.',
      'Heavy rain occurring; avoid non-essential hillside pedestrian movement.',
      'Keep emergency flashlights and family safety contacts ready.'
    ],
    summary: 'Rainfall reaching 16.8 mm/h; cumulative 72-hr precipitation approaches 84 mm.',
    scientificInsight: 'Pore-water pressure beginning to register in piezometric modeling. Soil cohesion declining toward critical threshold.'
  },
  {
    stepIndex: 6,
    phase: 'HEAVY_RAINFALL',
    phaseCategory: 'HEAVY_RAINFALL',
    phaseTitle: 'Phase 2: Rapid Soil Saturation & Transition to High Hazard',
    hoursAgo: 9.0,
    rainfallRateMmH: 22.4,
    accumulatedRain72hMm: 112.0,
    poreWaterRatio: 0.60,
    physicalRisk: 56,
    mlSusceptibility: 57,
    hybridScore: 56,
    riskLevel: 'HIGH',
    isHotspot: true,
    bufferRadiusKm: 2.0,
    alertLevel: 'WATCH',
    authorityRecommendations: [
      'Issue official Landslide WATCH advisory for NH-10 corridor.',
      'Deploy traffic police to control single-lane convoy movement at 9th Mile scarp.',
      'Alert STNM Hospital trauma wing for potential mass casualty readiness.'
    ],
    citizenGuidance: [
      'Current status: HIGH LANDSLIDE RISK / WATCH ISSUED.',
      'Stay away from toe-cut slopes, quarry faces, and steep ravines.',
      'Drivers on NH-10 should avoid parking beneath overhanging rock faces.'
    ],
    summary: 'Heavy downpour exceeding 22 mm/h. Antecedent precipitation crosses 110 mm. Hotspot indicator activated.',
    scientificInsight: 'Seepage forces aligned parallel to slope surface; Factor of Safety drops to 1.35. Micro-fissures opening in road shoulders.'
  },

  // =========================================================================
  // Phase 3: Severe Rainfall Surge & Rapid Pore Pressure Build-up (Steps 7 - 8)
  // Heavy rainfall, saturation increases rapidly, risk enters HIGH
  // =========================================================================
  {
    stepIndex: 7,
    phase: 'HEAVY_RAINFALL',
    phaseCategory: 'HEAVY_RAINFALL',
    phaseTitle: 'Phase 3: Torrential Cloud Front & Rapid Hydrostatic Build-up',
    hoursAgo: 7.5,
    rainfallRateMmH: 28.5,
    accumulatedRain72hMm: 152.0,
    poreWaterRatio: 0.72,
    physicalRisk: 68,
    mlSusceptibility: 69,
    hybridScore: 68,
    riskLevel: 'HIGH',
    isHotspot: true,
    bufferRadiusKm: 2.0,
    alertLevel: 'WARNING',
    authorityRecommendations: [
      'Issue formal LANDSLIDE WARNING bulletin to all regional media and civil defence.',
      'Halt heavy commercial multi-axle freight traffic on NH-10 between Rangpo and Gangtok.',
      'Pre-position State Disaster Response Force (SDRF) squads at Tadong.'
    ],
    citizenGuidance: [
      'Current status: HIGH LANDSLIDE RISK / WARNING IN EFFECT.',
      'Postpone all non-essential road travel along NH-10 immediately.',
      'If living on steep colluvial slopes, identify designated community shelter.'
    ],
    summary: 'Violent convective cloud front over Gangtok; intense rain rate of 28.5 mm/h.',
    scientificInsight: 'Positive pore-water pressures developing throughout 2-3m depth profile. Hydrostatic surcharge rapidly degrading soil shear capacity.'
  },
  {
    stepIndex: 8,
    phase: 'HEAVY_RAINFALL',
    phaseCategory: 'HEAVY_RAINFALL',
    phaseTitle: 'Phase 3: Severe Cloudburst Influx & Pre-Peak Surcharge',
    hoursAgo: 6.0,
    rainfallRateMmH: 33.2,
    accumulatedRain72hMm: 195.0,
    poreWaterRatio: 0.81,
    physicalRisk: 74,
    mlSusceptibility: 76,
    hybridScore: 74,
    riskLevel: 'HIGH',
    isHotspot: true,
    bufferRadiusKm: 2.0,
    alertLevel: 'WARNING',
    authorityRecommendations: [
      'Prepare emergency evacuation staging at Tadong Higher Secondary School.',
      'Inspect culverts and bypass drains near STNM Hospital Sochakgang.',
      'Notify District Magistrate (East Sikkim) of imminent slope failure probability.'
    ],
    citizenGuidance: [
      'Current status: HIGH RISK / DANGER LEVEL ELEVATED.',
      'Prepare emergency go-bag (documents, medications, torch, water).',
      'Do not cross swollen mountain torrents or muddy debris sheets on roads.'
    ],
    summary: 'Rainfall surges to 33.2 mm/h. Subsurface pore pressures approaching rupture conditions.',
    scientificInsight: 'Effective normal stress approaching zero in basal shear zone. Factor of Safety drops to 1.08; incipient creep detected.'
  },

  // =========================================================================
  // Phase 4: Peak Cloudburst & Critical Hotspot Activation (Steps 9 - 11)
  // Cloudburst peak, very high rainfall, high saturation, risk reaches CRITICAL
  // Hotspot beacon activated, 2.5 km impact buffer prominent
  // =========================================================================
  {
    stepIndex: 9,
    phase: 'CLOUDBURST_PEAK',
    phaseCategory: 'CLOUDBURST_PEAK',
    phaseTitle: 'Phase 4: PEAK CLOUDBURST DELUGE (Critical Hotspot Activated)',
    hoursAgo: 5.0,
    rainfallRateMmH: 38.4,
    accumulatedRain72hMm: 245.0,
    poreWaterRatio: 0.94,
    physicalRisk: 89,
    mlSusceptibility: 88,
    hybridScore: 89,
    riskLevel: 'CRITICAL',
    isHotspot: true,
    bufferRadiusKm: 2.5,
    alertLevel: 'EMERGENCY_EVACUATION',
    authorityRecommendations: [
      'ACTIVATE EMERGENCY EVACUATION PROTOCOL for settlements within 2.5 km corridor.',
      'Total closure of National Highway 10 at 9th Mile; divert via alternate single-track passes.',
      'Deploy SDRF, BRO Swastik, and district rescue teams to high-vulnerability sectors.',
      'Inspect exposed STNM Hospital foundation perimeter and Tadong school buildings.',
      'Transmit urgent bulletin to National Disaster Management Authority (NDMA) New Delhi.'
    ],
    citizenGuidance: [
      'Current status: CRITICAL LANDSLIDE EMERGENCY / DANGER IMMEDIATE.',
      'Evacuate immediately if ordered by local police or disaster wardens.',
      'Move completely away from slope edges, ravines, and drainage torrents.',
      'Do NOT attempt to drive through or clear mudslides on NH-10.',
      'Follow designated safe routes to district evacuation centers.'
    ],
    summary: 'EXTREME CLOUDBURST PEAK: 38.4 mm/h rainfall; 245 mm antecedent accumulation. 2.5 km critical hazard zone active.',
    scientificInsight: 'Critical Mohr-Coulomb failure envelope breached. Factor of Safety < 0.98. Debris slide initiation imminent along Daling schist joint planes.'
  },
  {
    stepIndex: 10,
    phase: 'CRITICAL_HOTSPOT',
    phaseCategory: 'CRITICAL_HOTSPOT',
    phaseTitle: 'Phase 4: Maximum Hydrostatic Head & Peak Structural Exposure',
    hoursAgo: 4.0,
    rainfallRateMmH: 36.8,
    accumulatedRain72hMm: 278.0,
    poreWaterRatio: 0.98,
    physicalRisk: 87,
    mlSusceptibility: 86,
    hybridScore: 87,
    riskLevel: 'CRITICAL',
    isHotspot: true,
    bufferRadiusKm: 2.5,
    alertLevel: 'EMERGENCY_EVACUATION',
    authorityRecommendations: [
      'Maintain complete highway blockade; monitor bridge abutments at 9th Mile Suspension Bridge.',
      'Establish incident command post at Singtam bypass junction.',
      'Safeguard medical oxygen and fuel supply lines into STNM Hospital.',
      'Coordinate aerial drone reconnaissance for identifying slope headscarps.'
    ],
    citizenGuidance: [
      'Current status: CRITICAL LANDSLIDE EMERGENCY.',
      'Remain inside reinforced concrete shelters on stable ridge tops.',
      'Do not return to evacuated hillside homes until officially declared safe.',
      'Tune into All India Radio Gangtok for emergency civil instructions.'
    ],
    summary: 'Sustained torrential downpour: 36.8 mm/h; 278 mm antecedent saturation. Maximum pore-water pressure surcharge.',
    scientificInsight: 'Total liquefaction of superficial colluvium. High pore pressures actively reducing shear resistance along entire 38-degree slope.'
  },
  {
    stepIndex: 11,
    phase: 'CRITICAL_HOTSPOT',
    phaseCategory: 'CRITICAL_HOTSPOT',
    phaseTitle: 'Phase 4: Sustained Saturation Deluge & Severe Slumping',
    hoursAgo: 3.2,
    rainfallRateMmH: 32.5,
    accumulatedRain72hMm: 292.0,
    poreWaterRatio: 0.96,
    physicalRisk: 84,
    mlSusceptibility: 83,
    hybridScore: 84,
    riskLevel: 'CRITICAL',
    isHotspot: true,
    bufferRadiusKm: 2.5,
    alertLevel: 'EMERGENCY_EVACUATION',
    authorityRecommendations: [
      'Ensure heavy earthmovers clear toe debris without destabilizing upper slope.',
      'Maintain active shelter camps for Ranipool and Burtuk evacuees.',
      'Alert public health teams for water contamination prevention.'
    ],
    citizenGuidance: [
      'Current status: CRITICAL LANDSLIDE RISK.',
      'Stay away from cracked roads, tilted telephone poles, and leaning trees.',
      'Report any new bubbling ground springs or muddy hillside water leaks immediately.'
    ],
    summary: 'Maximum cumulative rainfall reaches 292 mm. Soil sublayer fully saturated with extreme hydrostatic pressure.',
    scientificInsight: 'Saturated hydraulic conductivity fully exceeded; overland flow coefficient > 0.85; active retrogressive slumping underway.'
  },

  // =========================================================================
  // Phase 5: Rain Decreasing, BUT Antecedent Saturation Persists! (Steps 12 - 14)
  // Demonstrating the core principle:
  // RAIN FALLING ≠ IMMEDIATE LANDSLIDE
  // ANTECEDENT SATURATION KEEPS RISK HIGH EVEN AFTER RAINFALL DROPS!
  // =========================================================================
  {
    stepIndex: 12,
    phase: 'PERSISTENT_SATURATION',
    phaseCategory: 'PERSISTENT_SATURATION',
    phaseTitle: 'Phase 5: Rain Eases by 55%, High Pore Pressure Persists (CRITICAL)',
    hoursAgo: 2.5,
    rainfallRateMmH: 16.5,
    accumulatedRain72hMm: 284.0,
    poreWaterRatio: 0.91,
    physicalRisk: 78,
    mlSusceptibility: 79,
    hybridScore: 78,
    riskLevel: 'CRITICAL',
    isHotspot: true,
    bufferRadiusKm: 2.5,
    alertLevel: 'WARNING',
    authorityRecommendations: [
      'DO NOT PREMATURELY REOPEN HIGHWAY: High pore-water pressure persists despite falling rain rate.',
      'Geotechnical teams must inspect slope crest for tension cracks before any clearance begins.',
      'Maintain emergency shelter status for evacuated vulnerable settlements.'
    ],
    citizenGuidance: [
      'Current status: HIGH HAZARD PERSISTS DESPITE LIGHTER RAIN.',
      'DO NOT return to unstable hillside houses just because rainfall has reduced.',
      'Saturated soil remains extremely heavy and fragile; secondary slips remain highly likely.'
    ],
    summary: 'Rain rate dropped from 38.4 to 16.5 mm/h (down 57%), BUT 284 mm antecedent saturation keeps slope in CRITICAL condition.',
    scientificInsight: 'CORE PHYSICAL INSIGHT: Rainfall rate dropped, but subsurface pore-water pressure dissipates slowly (pore drainage lag). Factor of Safety remains < 1.05.'
  },
  {
    stepIndex: 13,
    phase: 'PERSISTENT_SATURATION',
    phaseCategory: 'PERSISTENT_SATURATION',
    phaseTitle: 'Phase 5: Lightening Rain, Residual Hydrostatic Surcharge',
    hoursAgo: 1.8,
    rainfallRateMmH: 8.2,
    accumulatedRain72hMm: 265.0,
    poreWaterRatio: 0.85,
    physicalRisk: 72,
    mlSusceptibility: 73,
    hybridScore: 72,
    riskLevel: 'HIGH',
    isHotspot: true,
    bufferRadiusKm: 2.0,
    alertLevel: 'WARNING',
    authorityRecommendations: [
      'Continue controlled traffic diversion; prevent public vehicles entering 9th Mile corridor.',
      'Inspect STNM hospital access road retaining wall for lateral deflection.',
      'Verify integrity of high-voltage transmission towers along Tadong ridge.'
    ],
    citizenGuidance: [
      'Current status: HIGH RISK PERSISTENT / RESIDUAL DANGER.',
      'Continue following official evacuation directives.',
      'Listen for rumbling sounds, cracking trees, or snapping utilities on slopes.'
    ],
    summary: 'Rainfall down to 8.2 mm/h. Subsoil remains 85% saturated with 265 mm antecedent moisture.',
    scientificInsight: 'Delayed landslide release phase: Colluvial blanket remains near buoyant state. Shear stress along failure plane remains elevated.'
  },
  {
    stepIndex: 14,
    phase: 'PERSISTENT_SATURATION',
    phaseCategory: 'PERSISTENT_SATURATION',
    phaseTitle: 'Phase 5: Scattered Drizzle, Saturated Subsoil (High Residual Risk)',
    hoursAgo: 1.2,
    rainfallRateMmH: 3.8,
    accumulatedRain72hMm: 238.0,
    poreWaterRatio: 0.76,
    physicalRisk: 63,
    mlSusceptibility: 65,
    hybridScore: 63,
    riskLevel: 'HIGH',
    isHotspot: false,
    bufferRadiusKm: 2.0,
    alertLevel: 'WARNING',
    authorityRecommendations: [
      'Commence preliminary damage and clearance survey by BRO engineering unit.',
      'Maintain emergency convoy protocol for essential medical and food transport only.',
      'Prepare geotechnical report for District Disaster Management Authority (DDMA).'
    ],
    citizenGuidance: [
      'Current status: HIGH CAUTION / RESIDUAL SATURATION.',
      'Only authorized emergency vehicles permitted on NH-10.',
      'Exercise extreme vigilance when walking near wet cut slopes.'
    ],
    summary: 'Passing drizzle of only 3.8 mm/h, yet antecedent saturation is 238 mm. Risk remains HIGH due to moisture retention.',
    scientificInsight: 'Drainage lag: Low permeability phyllite clay matrices release pore water at slow rate (hydraulic lag ~ 12-24 hours).'
  },

  // =========================================================================
  // Phase 6: Subsurface Drainage & Stabilization Recovery (Steps 15 - 17)
  // Drainage/recovery, saturation slowly decreases, risk gradually decreases
  // =========================================================================
  {
    stepIndex: 15,
    phase: 'RECOVERY',
    phaseCategory: 'RECOVERY',
    phaseTitle: 'Phase 6: Slow Colluvial Drainage & Pore Pressure Dissipation',
    hoursAgo: 0.8,
    rainfallRateMmH: 1.8,
    accumulatedRain72hMm: 192.0,
    poreWaterRatio: 0.62,
    physicalRisk: 46,
    mlSusceptibility: 48,
    hybridScore: 46,
    riskLevel: 'MODERATE',
    isHotspot: false,
    bufferRadiusKm: 1.4,
    alertLevel: 'WATCH',
    authorityRecommendations: [
      'Authorize single-lane cleared traffic under strict BRO speed regulation (20 km/h).',
      'Begin clearing fallen rocks and minor debris slides from road gutters.',
      'Inspect structural foundation of Burtuk and Tadong schools before reopening.'
    ],
    citizenGuidance: [
      'Current status: MODERATE RISK / CAUTIOUS RECOVERY.',
      'Single-lane travel opened for emergency and stranded civilian vehicles.',
      'Observe all flag signals and road safety markers posted by BRO.'
    ],
    summary: 'Rain almost stopped (1.8 mm/h); antecedent saturation declining to 192 mm. Risk moderates.',
    scientificInsight: 'Pore-water pressure has dissipated by 40%. Factor of Safety recovers to 1.28. Effective stress regenerating.'
  },
  {
    stepIndex: 16,
    phase: 'RECOVERY',
    phaseCategory: 'RECOVERY',
    phaseTitle: 'Phase 6: Subsurface Drainage Stage 2 & Debris Clearance',
    hoursAgo: 0.4,
    rainfallRateMmH: 0.8,
    accumulatedRain72hMm: 142.0,
    poreWaterRatio: 0.45,
    physicalRisk: 34,
    mlSusceptibility: 36,
    hybridScore: 34,
    riskLevel: 'MODERATE',
    isHotspot: false,
    bufferRadiusKm: 1.4,
    alertLevel: 'ADVISORY',
    authorityRecommendations: [
      'Complete safety assessment of 9th Mile suspension bridge; confirm pedestrian safety.',
      'Restore municipal water mains and optical fiber cables damaged by minor slope slumps.',
      'De-escalate emergency operations centre status to elevated monitoring.'
    ],
    citizenGuidance: [
      'Current status: ADVISORY / RECOVERY IN PROGRESS.',
      'Evacuees may begin returning under civil defence coordination.',
      'Report any newly formed ground cracks to local ward councillor.'
    ],
    summary: 'Atmospheric stability returning. Active colluvial drainage restoring slope equilibrium.',
    scientificInsight: 'Water table lowering below slip plane; matrix suction re-establishing. Slope stability factor of safety > 1.55.'
  },
  {
    stepIndex: 17,
    phase: 'RECOVERY',
    phaseCategory: 'RECOVERY',
    phaseTitle: 'Phase 6: Hydrostatic Equilibrium Restored & Incident Resolution',
    hoursAgo: 0.0,
    rainfallRateMmH: 0.2,
    accumulatedRain72hMm: 88.0,
    poreWaterRatio: 0.28,
    physicalRisk: 22,
    mlSusceptibility: 25,
    hybridScore: 23,
    riskLevel: 'LOW',
    isHotspot: false,
    bufferRadiusKm: 0.8,
    alertLevel: 'NORMAL',
    authorityRecommendations: [
      'Conduct final post-incident debrief with Sikkim Disaster Management Authority and BRO.',
      'Log full temporal sensor timeline into GSI NLSM permanent geotechnical archive.',
      'Resume normal two-way vehicular transit along National Highway 10.'
    ],
    citizenGuidance: [
      'Current status: SAFE / NORMAL CONDITIONS RESTORED.',
      'All emergency warnings lifted. Normal community and school activities resume.',
      'Thank you for following LANDGUARD AI early warning advisories.'
    ],
    summary: 'Simulation Complete. Slope restored to stable equilibrium (Risk: 22/100, LOW).',
    scientificInsight: 'Hydrologic cycle complete: Full subsurface dissipation of pore pressure head. Slope Factor of Safety returned to stable baseline > 1.95.'
  },
];
