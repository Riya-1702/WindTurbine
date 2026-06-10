// src/hooks/useLiveData.js
import { useEffect, useMemo, useRef, useState } from "react";
import { predictTurbineState } from "../services/api";

const INITIAL_SENSORS = {
  wind_speed_mps: 11.5,
  ambient_temp_c: 29.0,
  humidity_pct: 55.0,
  rotor_rpm: 14.0,
  generator_rpm: 1250.0,
  power_kw: 1650.0,
  pitch_angle_deg: 3.5,
  yaw_error_deg: 1.2,
  gearbox_temp_c: 61.0,
  generator_temp_c: 58.0,
  nacelle_temp_c: 56.0,
  oil_temp_c: 47.0,
  oil_pressure_bar: 2.4,
  hydraulic_pressure_bar: 175.0,
  vibration_mm_s: 2.8,
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round(v, digits = 2) {
  return Number(v.toFixed(digits));
}

// Deterministic baseline offset engine to provide structural data separation per turbine ID
function getTurbineBaselineOffsets(turbineId) {
  if (!turbineId) return { vibration: 0, gearbox: 0, power: 0 };
  const seed = turbineId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  if (turbineId === "T-04") {
    return { vibration: 6.5, gearbox: 15.0, power: -350 };
  }
  if (turbineId === "T-07") {
    return { vibration: 14.5, gearbox: 32.5, power: -950 };
  }
  return {
    vibration: (seed % 3) * 0.45,
    gearbox: (seed % 5) * 1.3,
    power: (seed % 4) * 50 - 80
  };
}

function mutateSensors(prev, turbineId) {
  const next = { ...prev };
  const offsets = getTurbineBaselineOffsets(turbineId);

  next.wind_speed_mps = clamp(prev.wind_speed_mps + (Math.random() - 0.5) * 1.8, 2, 24);
  next.ambient_temp_c = clamp(prev.ambient_temp_c + (Math.random() - 0.5) * 0.6, 15, 45);
  next.humidity_pct = clamp(prev.humidity_pct + (Math.random() - 0.5) * 2.2, 20, 95);
  next.rotor_rpm = clamp(prev.rotor_rpm + (Math.random() - 0.5) * 0.9, 4, 22);
  next.generator_rpm = clamp(prev.generator_rpm + (Math.random() - 0.5) * 40, 400, 1800);
  next.pitch_angle_deg = clamp(prev.pitch_angle_deg + (Math.random() - 0.5) * 0.6, 0, 20);
  next.yaw_error_deg = clamp(prev.yaw_error_deg + (Math.random() - 0.5) * 0.4, 0, 8);
  next.oil_temp_c = clamp(prev.oil_temp_c + (Math.random() - 0.5) * 0.6, 30, 95);
  next.oil_pressure_bar = clamp(prev.oil_pressure_bar + (Math.random() - 0.5) * 0.08, 1.2, 4.5);
  next.hydraulic_pressure_bar = clamp(prev.hydraulic_pressure_bar + (Math.random() - 0.5) * 2.5, 110, 240);
  next.generator_temp_c = clamp(prev.generator_temp_c + (Math.random() - 0.5) * 0.7, 35, 110);
  next.nacelle_temp_c = clamp(prev.nacelle_temp_c + (Math.random() - 0.5) * 0.7, 35, 100);

  next.vibration_mm_s = clamp(prev.vibration_mm_s + (Math.random() - 0.5) * 0.8 + offsets.vibration * 0.04, 0.2, 35);
  next.gearbox_temp_c = clamp(prev.gearbox_temp_c + (Math.random() - 0.5) * 0.8 + offsets.gearbox * 0.04, 40, 115);
  next.power_kw = clamp(prev.power_kw + (Math.random() - 0.5) * 120 + offsets.power * 0.04, 150, 3200);

  return Object.fromEntries(
    Object.entries(next).map(([k, v]) => [k, round(v, 2)])
  );
}

function fallbackPredict(sensorData) {
  const vib = sensorData.vibration_mm_s;
  const gearbox = sensorData.gearbox_temp_c;
  const generator = sensorData.generator_temp_c;
  const nacelle = sensorData.nacelle_temp_c;
  const yaw = sensorData.yaw_error_deg;

  let state = "healthy";
  if (vib > 15 || gearbox > 90 || generator > 92 || nacelle > 88) state = "critical";
  else if (vib > 7 || gearbox > 76 || generator > 78 || yaw > 4.2) state = "warning";

  const probabilities = {
    healthy: state === "healthy" ? 0.83 : 0.12,
    warning: state === "warning" ? 0.71 : 0.16,
    critical: state === "critical" ? 0.89 : 0.05,
  };

  const alerts =
    state === "critical"
      ? ["Critical anomaly detected", "Immediate inspection recommended"]
      : state === "warning"
      ? ["Early degradation detected", "Watch vibration and thermal trend"]
      : ["Operating within expected range"];

  const recommendations =
    state === "critical"
      ? ["Reduce load", "Inspect gearbox and generator", "Prepare shutdown"]
      : state === "warning"
      ? ["Monitor vibration", "Review thermal trend", "Plan inspection"]
      : ["Continue normal operation", "Keep trend monitoring active"];

  return {
    state,
    prediction: state,
    confidence: state === "healthy" ? 0.83 : state === "warning" ? 0.71 : 0.89,
    health_score: state === "healthy" ? 0.24 : state === "warning" ? 0.61 : 0.91,
    probabilities,
    alerts,
    recommendations,
    sensor_data: sensorData,
  };
}

export function useLiveData(activeTurbineId) {
  const targetId = activeTurbineId || "T-01";

  const [sensorData, setSensorData] = useState(() => {
    const offsets = getTurbineBaselineOffsets(targetId);
    return {
      ...INITIAL_SENSORS,
      vibration_mm_s: clamp(INITIAL_SENSORS.vibration_mm_s + offsets.vibration, 0.2, 35),
      gearbox_temp_c: clamp(INITIAL_SENSORS.gearbox_temp_c + offsets.gearbox, 40, 115),
      power_kw: clamp(INITIAL_SENSORS.power_kw + offsets.power, 150, 3200),
    };
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState(null);

  const timeoutRef = useRef(null);
  const latestSensorsRef = useRef(sensorData);

  useEffect(() => {
    const offsets = getTurbineBaselineOffsets(targetId);
    const initialConfig = {
      ...INITIAL_SENSORS,
      vibration_mm_s: clamp(INITIAL_SENSORS.vibration_mm_s + offsets.vibration, 0.2, 35),
      gearbox_temp_c: clamp(INITIAL_SENSORS.gearbox_temp_c + offsets.gearbox, 40, 115),
      power_kw: clamp(INITIAL_SENSORS.power_kw + offsets.power, 150, 3200),
    };
    latestSensorsRef.current = initialConfig;
    setSensorData(initialConfig);
  }, [targetId]);

  const healthState = prediction?.state || "healthy";

  const uiState = useMemo(
    () => ({
      sensorData,
      prediction,
      loading,
      connection,
      error,
      healthState,
    }),
    [sensorData, prediction, loading, connection, error, healthState]
  );

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      if (!mounted) return;
      
      const nextSensors = mutateSensors(latestSensorsRef.current, targetId);
      latestSensorsRef.current = nextSensors;
      setSensorData(nextSensors);

      try {
        // Injected current live targetId to ensure fetch routes hit /predict/:turbineId accurately
        const result = await predictTurbineState(nextSensors, targetId);
        if (!mounted) return;
        setPrediction(result);
        setConnection("online");
        setError(null);
      } catch (e) {
        if (!mounted) return;
        const fallback = fallbackPredict(nextSensors);
        setPrediction(fallback);
        setConnection("offline-fallback");
        setError(e?.message || "Backend unreachable");
      } finally {
        if (mounted) {
          setLoading(false);
          timeoutRef.current = setTimeout(tick, 2500);
        }
      }
    };

    tick();

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [targetId]);

  return uiState;
}