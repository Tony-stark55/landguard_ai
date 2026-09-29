import { LocationData, WeatherObservation } from '../types/landguard';

// Fallback baseline conditions representative of seasonal precipitation patterns in NER
const BASELINE_WEATHER: Record<string, Partial<WeatherObservation>> = {
  'sik-gangtok': { currentRainfallMm: 14.2, accumulatedRain72hMm: 112.5, tempC: 17.5, humidityPercent: 92, forecastRain24hMm: 45.0, windSpeedKmh: 12 },
  'sik-mangan': { currentRainfallMm: 18.6, accumulatedRain72hMm: 148.0, tempC: 16.0, humidityPercent: 95, forecastRain24hMm: 62.0, windSpeedKmh: 14 },
  'sik-namchi': { currentRainfallMm: 5.4, accumulatedRain72hMm: 42.0, tempC: 20.2, humidityPercent: 78, forecastRain24hMm: 18.0, windSpeedKmh: 8 },
  'meg-sohra': { currentRainfallMm: 22.8, accumulatedRain72hMm: 185.0, tempC: 18.1, humidityPercent: 98, forecastRain24hMm: 80.0, windSpeedKmh: 24 },
  'meg-shillong': { currentRainfallMm: 6.2, accumulatedRain72hMm: 48.0, tempC: 19.4, humidityPercent: 82, forecastRain24hMm: 22.0, windSpeedKmh: 10 },
  'meg-mawsynram': { currentRainfallMm: 24.5, accumulatedRain72hMm: 194.2, tempC: 18.0, humidityPercent: 99, forecastRain24hMm: 88.0, windSpeedKmh: 22 },
  'asm-haflong': { currentRainfallMm: 16.5, accumulatedRain72hMm: 135.0, tempC: 23.0, humidityPercent: 91, forecastRain24hMm: 52.0, windSpeedKmh: 11 },
  'asm-guwahati': { currentRainfallMm: 3.2, accumulatedRain72hMm: 28.0, tempC: 28.5, humidityPercent: 74, forecastRain24hMm: 12.0, windSpeedKmh: 9 },
  'aru-itanagar': { currentRainfallMm: 12.0, accumulatedRain72hMm: 98.0, tempC: 24.2, humidityPercent: 86, forecastRain24hMm: 38.0, windSpeedKmh: 10 },
  'aru-tawang': { currentRainfallMm: 15.2, accumulatedRain72hMm: 122.0, tempC: 8.5, humidityPercent: 89, forecastRain24hMm: 42.0, windSpeedKmh: 18 },
  'aru-pasighat': { currentRainfallMm: 8.4, accumulatedRain72hMm: 65.0, tempC: 26.0, humidityPercent: 80, forecastRain24hMm: 25.0, windSpeedKmh: 11 },
  'nag-kohima': { currentRainfallMm: 13.8, accumulatedRain72hMm: 118.0, tempC: 19.0, humidityPercent: 88, forecastRain24hMm: 44.0, windSpeedKmh: 13 },
  'nag-mokokchung': { currentRainfallMm: 7.2, accumulatedRain72hMm: 54.0, tempC: 21.0, humidityPercent: 81, forecastRain24hMm: 20.0, windSpeedKmh: 9 },
  'miz-aizawl': { currentRainfallMm: 17.1, accumulatedRain72hMm: 138.5, tempC: 22.4, humidityPercent: 93, forecastRain24hMm: 58.0, windSpeedKmh: 15 },
  'miz-lunglei': { currentRainfallMm: 9.5, accumulatedRain72hMm: 76.0, tempC: 23.1, humidityPercent: 84, forecastRain24hMm: 30.0, windSpeedKmh: 10 },
  'man-noney': { currentRainfallMm: 19.4, accumulatedRain72hMm: 155.0, tempC: 22.0, humidityPercent: 94, forecastRain24hMm: 65.0, windSpeedKmh: 12 },
  'man-churachandpur': { currentRainfallMm: 4.8, accumulatedRain72hMm: 38.0, tempC: 24.5, humidityPercent: 77, forecastRain24hMm: 16.0, windSpeedKmh: 8 },
  'tri-jampui': { currentRainfallMm: 5.0, accumulatedRain72hMm: 35.0, tempC: 25.2, humidityPercent: 76, forecastRain24hMm: 15.0, windSpeedKmh: 7 },
};

// In-memory cache to prevent spamming open-meteo
const weatherCache = new Map<string, { observation: WeatherObservation; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchLocationWeather(
  location: LocationData,
  isDemoActive = false,
  demoTargetId = 'sik-gangtok'
): Promise<WeatherObservation> {
  const now = new Date().toISOString();

  // If this location is the target of an active demo incident, return simulated extreme downpour
  if (isDemoActive && location.id === demoTargetId) {
    return {
      locationId: location.id,
      timestamp: now,
      currentRainfallMm: 36.8, // Heavy cloudburst peak
      accumulatedRain72hMm: 278.0, // Severe antecedent saturation
      tempC: 14.8,
      humidityPercent: 99,
      forecastRain24hMm: 110.0,
      windSpeedKmh: 42,
      weatherDescription: 'Severe Cloudburst & Torrential Deluge (DEMO / SIMULATION)',
      isRealApi: false,
      source: 'Simulated Cloudburst Incident (DEMO / SIMULATION)',
    };
  }

  // Check cache
  const cached = weatherCache.get(location.id);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.observation;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&daily=precipitation_sum&timezone=Asia%2FKolkata`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const current = data.current || {};
      const daily = data.daily || {};

      // 72h accumulation from daily sum
      const dailySums: number[] = daily.precipitation_sum || [];
      const threeDaySum = dailySums.slice(0, 3).reduce((a, b) => a + (b || 0), 0);

      // Current precipitation (mm)
      const currentRain = Number((current.precipitation ?? current.rain ?? 0).toFixed(1));
      const temp = Number((current.temperature_2m ?? 20).toFixed(1));
      const hum = Number((current.relative_humidity_2m ?? 80).toFixed(0));
      const wind = Number((current.wind_speed_10m ?? 10).toFixed(1));
      const forecast24 = dailySums[0] ? Number(dailySums[0].toFixed(1)) : 25;

      const observation: WeatherObservation = {
        locationId: location.id,
        timestamp: now,
        currentRainfallMm: currentRain,
        accumulatedRain72hMm: Math.max(currentRain * 3, Number(threeDaySum.toFixed(1))),
        tempC: temp,
        humidityPercent: hum,
        forecastRain24hMm: forecast24,
        windSpeedKmh: wind,
        weatherDescription: currentRain > 10 ? 'Intense Rain Shower' : currentRain > 2 ? 'Light to Moderate Rain' : 'Overcast / High Humidity',
        isRealApi: true,
        source: 'Open-Meteo Live Surface Telemetry',
      };

      weatherCache.set(location.id, {
        observation,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return observation;
    }
  } catch {
    // Graceful fallback on network timeout or offline
  }

  // Baseline fallback with small natural noise
  const base = BASELINE_WEATHER[location.id] || {
    currentRainfallMm: 10.0,
    accumulatedRain72hMm: 85.0,
    tempC: 20.0,
    humidityPercent: 85,
    forecastRain24hMm: 35.0,
    windSpeedKmh: 12,
  };

  const observation: WeatherObservation = {
    locationId: location.id,
    timestamp: now,
    currentRainfallMm: base.currentRainfallMm ?? 10,
    accumulatedRain72hMm: base.accumulatedRain72hMm ?? 85,
    tempC: base.tempC ?? 20,
    humidityPercent: base.humidityPercent ?? 85,
    forecastRain24hMm: base.forecastRain24hMm ?? 35,
    windSpeedKmh: base.windSpeedKmh ?? 12,
    weatherDescription: (base.currentRainfallMm ?? 0) > 15 ? 'Heavy Monsoon Downpour' : 'Intermittent Hill Showers',
    isRealApi: false,
    source: 'NER Meteorological Baseline Cache (IMD/Regional Pattern)',
  };

  weatherCache.set(location.id, {
    observation,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return observation;
}

/**
 * Fetch or reconstruct hourly historical weather time series for time-series risk evolution
 */
export async function fetchLocationHourlyHistory(
  location: LocationData,
  timeRange: '1H' | '6H' | '12H' | '24H' | '72H' = '24H',
  isDemoActive = false,
  demoTargetId = 'sik-gangtok'
): Promise<WeatherObservation[]> {
  const isDemo = isDemoActive && location.id === demoTargetId;
  const now = new Date();

  // Determine number of points and step in minutes
  let totalHours = 24;
  let stepMinutes = 60;
  if (timeRange === '1H') {
    totalHours = 1;
    stepMinutes = 10; // 7 points (0m, -10m, -20m...)
  } else if (timeRange === '6H') {
    totalHours = 6;
    stepMinutes = 30; // 13 points
  } else if (timeRange === '12H') {
    totalHours = 12;
    stepMinutes = 60; // 13 points
  } else if (timeRange === '24H') {
    totalHours = 24;
    stepMinutes = 60; // 25 points
  } else if (timeRange === '72H') {
    totalHours = 72;
    stepMinutes = 120; // 37 points (every 2 hours)
  }

  const numPoints = Math.floor((totalHours * 60) / stepMinutes) + 1;

  // If this is the active demo incident location, generate a dramatic, scientifically realistic 6-phase cloudburst progression
  if (isDemo && location.id === demoTargetId) {
    // 18-step incident progression covering 6 distinct causal phases:
    const incidentSteps = [
      // Phase 1: Baseline Calm (Low rainfall, low saturation, low risk)
      { hoursAgo: 17.0, rain: 0.8, accum: 28.0, temp: 21.2, hum: 68, wind: 8, desc: 'Calm / Overcast Foothills (Phase 1: Baseline)' },
      { hoursAgo: 16.0, rain: 1.4, accum: 32.0, temp: 20.8, hum: 72, wind: 10, desc: 'Light Mountain Drizzle (Phase 1: Baseline)' },
      { hoursAgo: 15.0, rain: 2.6, accum: 38.0, temp: 20.2, hum: 76, wind: 12, desc: 'Intermittent Hill Showers (Phase 1: Baseline)' },

      // Phase 2: Influx Begins (Rainfall increasing, saturation increasing, risk gradually increases)
      { hoursAgo: 13.5, rain: 6.2, accum: 48.0, temp: 19.5, hum: 82, wind: 15, desc: 'Steady Monsoon Influx (Phase 2: Onset)' },
      { hoursAgo: 12.0, rain: 11.5, accum: 64.0, temp: 18.8, hum: 86, wind: 18, desc: 'Moderate Orographic Rain (Phase 2: Intensifying)' },
      { hoursAgo: 10.5, rain: 16.8, accum: 84.0, temp: 18.0, hum: 90, wind: 22, desc: 'Intensifying Ridge Downpour (Phase 2: Escalating)' },
      { hoursAgo: 9.0, rain: 22.4, accum: 112.0, temp: 17.2, hum: 94, wind: 26, desc: 'Heavy Downpour, Rising Saturation (Phase 2: Rapid Fill)' },

      // Phase 3: Heavy Rainfall / Rapid Saturation Increase (Risk enters HIGH)
      { hoursAgo: 7.5, rain: 28.5, accum: 152.0, temp: 16.5, hum: 97, wind: 32, desc: 'Torrential Convective Storm (Phase 3: High Hazard)' },
      { hoursAgo: 6.0, rain: 33.2, accum: 195.0, temp: 15.8, hum: 98, wind: 38, desc: 'Severe Cloudburst Front Influx (Phase 3: Pre-Peak)' },

      // Phase 4: Peak Cloudburst & High Saturation (Risk enters CRITICAL / HOTSPOT)
      { hoursAgo: 5.0, rain: 38.4, accum: 245.0, temp: 15.0, hum: 99, wind: 44, desc: 'Peak Cloudburst & Extreme Runoff (Phase 4: CRITICAL HOTSPOT)' },
      { hoursAgo: 4.0, rain: 36.8, accum: 278.0, temp: 14.8, hum: 99, wind: 42, desc: 'Maximum Hydrostatic Head (Phase 4: CRITICAL HOTSPOT)' },
      { hoursAgo: 3.2, rain: 32.5, accum: 292.0, temp: 15.2, hum: 99, wind: 38, desc: 'Sustained Critical Saturation (Phase 4: CRITICAL HOTSPOT)' },

      // Phase 5: Rainfall Decreases, but Antecedent Saturation Persists!
      { hoursAgo: 2.5, rain: 16.5, accum: 284.0, temp: 16.0, hum: 96, wind: 28, desc: 'Rain Easing 55%, High Pore Pressure (Phase 5: Persistent Saturation)' },
      { hoursAgo: 1.8, rain: 8.2, accum: 265.0, temp: 16.8, hum: 92, wind: 20, desc: 'Lightening Rain, Residual Hydrostatic Surcharge (Phase 5: Persistent Saturation)' },
      { hoursAgo: 1.2, rain: 3.8, accum: 238.0, temp: 17.5, hum: 88, wind: 16, desc: 'Scattered Showers, Saturated Subsoil (Phase 5: High Residual Risk)' },

      // Phase 6: Saturation Slowly Decays (Risk gradually decreases)
      { hoursAgo: 0.8, rain: 1.8, accum: 192.0, temp: 18.2, hum: 82, wind: 12, desc: 'Passing Drizzle, Slow Colluvial Drainage (Phase 6: Pore Discharge)' },
      { hoursAgo: 0.4, rain: 0.8, accum: 142.0, temp: 19.0, hum: 76, wind: 10, desc: 'Overcast, Subsurface Drainage Stage 2 (Phase 6: Recovery)' },
      { hoursAgo: 0.0, rain: 0.2, accum: 88.0, temp: 20.0, hum: 70, wind: 6, desc: 'Stabilizing Hydrostatic Equilibrium (Phase 6: Stabilized)' },
    ];

    const points: WeatherObservation[] = incidentSteps.map((step) => {
      // Scale hoursAgo to the requested time horizon so range selectors (1H, 6H, 12H, 24H, 72H) match cleanly
      const normalizedRatio = step.hoursAgo / 17.0; // 1.0 (start) down to 0.0 (end/now)
      const scaledHoursAgo = Number((normalizedRatio * totalHours).toFixed(2));
      const pointTime = new Date(now.getTime() - scaledHoursAgo * 3600000);
      return {
        locationId: location.id,
        timestamp: pointTime.toISOString(),
        currentRainfallMm: step.rain,
        accumulatedRain72hMm: step.accum,
        tempC: step.temp,
        humidityPercent: step.hum,
        forecastRain24hMm: Math.round(step.accum * 0.4),
        windSpeedKmh: step.wind,
        weatherDescription: step.desc,
        isRealApi: false,
        source: 'Simulated Cloudburst Incident (DEMO / SIMULATION)',
      };
    });

    return points;
  }

  // Attempt to fetch actual hourly data from Open-Meteo
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&hourly=precipitation,rain,temperature_2m,relative_humidity_2m&past_days=3&forecast_days=1&timezone=Asia%2FKolkata`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const hourly = data.hourly || {};
      const times: string[] = hourly.time || [];
      const precip: number[] = hourly.precipitation || [];
      const temps: number[] = hourly.temperature_2m || [];
      const hums: number[] = hourly.relative_humidity_2m || [];

      if (times.length > 0 && precip.length > 0) {
        // Find index closest to current local time
        const nowMs = now.getTime();
        let currentIdx = -1;
        let minDiff = Infinity;
        times.forEach((t, idx) => {
          const tMs = new Date(t + '+05:30').getTime();
          const diff = Math.abs(tMs - nowMs);
          if (diff < minDiff) {
            minDiff = diff;
            currentIdx = idx;
          }
        });
        if (currentIdx === -1) {
          currentIdx = Math.max(0, Math.min(times.length - 1, times.length - 24));
        }

        const points: WeatherObservation[] = [];

        for (let i = numPoints - 1; i >= 0; i--) {
          const minutesAgo = i * stepMinutes;
          const hoursAgo = minutesAgo / 60;
          const pointTime = new Date(now.getTime() - minutesAgo * 60000);

          // Find closest hour in hourly data
          const targetIdx = Math.max(0, Math.min(precip.length - 1, Math.round(currentIdx - hoursAgo)));
          const currentRain = precip[targetIdx] !== undefined ? Number(precip[targetIdx].toFixed(1)) : 0.0;

          // Compute antecedent sum up to targetIdx (up to 72 hours before)
          const startIdx = Math.max(0, targetIdx - 72);
          const antecedentSum = precip.slice(startIdx, targetIdx + 1).reduce((a, b) => a + (b || 0), 0);
          const totalAccum = Math.max(currentRain * 2, Number(antecedentSum.toFixed(1)));

          points.push({
            locationId: location.id,
            timestamp: pointTime.toISOString(),
            currentRainfallMm: currentRain,
            accumulatedRain72hMm: totalAccum,
            tempC: temps[targetIdx] !== undefined ? Number(temps[targetIdx].toFixed(1)) : 20.0,
            humidityPercent: hums[targetIdx] !== undefined ? Math.round(hums[targetIdx]) : 82,
            forecastRain24hMm: BASELINE_WEATHER[location.id]?.forecastRain24hMm ?? 35,
            windSpeedKmh: 12,
            weatherDescription: currentRain > 15 ? 'Heavy Downpour' : currentRain > 2 ? 'Intermittent Showers' : 'Overcast / Mountain Mist',
            isRealApi: true,
            source: 'Open-Meteo Hourly Telemetry (Near-Real-Time)',
          });
        }

        return points;
      }
    }
  } catch {
    // Network fallback
  }

  // Baseline diurnal pattern fallback
  const base = BASELINE_WEATHER[location.id] || {
    currentRainfallMm: 8.0,
    accumulatedRain72hMm: 78.0,
    tempC: 21.0,
    humidityPercent: 84,
  };

  const points: WeatherObservation[] = [];
  for (let i = numPoints - 1; i >= 0; i--) {
    const minutesAgo = i * stepMinutes;
    const hoursAgo = minutesAgo / 60;
    const pointTime = new Date(now.getTime() - minutesAgo * 60000);

    // Diurnal variation wave
    const wave = Math.sin((pointTime.getHours() / 24) * Math.PI * 2);
    const rain = Math.max(0.5, Number(((base.currentRainfallMm ?? 8) * (0.8 + 0.4 * wave)).toFixed(1)));
    const accum = Number(((base.accumulatedRain72hMm ?? 78) - (hoursAgo * 0.4) + wave * 3).toFixed(1));

    points.push({
      locationId: location.id,
      timestamp: pointTime.toISOString(),
      currentRainfallMm: rain,
      accumulatedRain72hMm: Math.max(20, accum),
      tempC: Number(((base.tempC ?? 21) + wave * 2).toFixed(1)),
      humidityPercent: Math.min(98, Math.round((base.humidityPercent ?? 84) - wave * 5)),
      forecastRain24hMm: base.forecastRain24hMm ?? 35,
      windSpeedKmh: 11,
      weatherDescription: rain > 12 ? 'Heavy Rain' : 'Mountain Mist & Showers',
      isRealApi: false,
      source: 'NER Meteorological Baseline Cache (Diurnal Model)',
    });
  }

  return points;
}
