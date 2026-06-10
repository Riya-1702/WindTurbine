import React, { useState, useEffect } from "react";

// Native Lightweight Sparkline component for Enterprise Trend Visualization
function TelemetrySparkline({ variant = "info" }) {
  const [points, setPoints] = useState([]);
  
  useEffect(() => {
    // Generate initial history wave
    const initialPoints = Array.from({ length: 12 }, () => Math.random() * 15 + 5);
    setPoints(initialPoints);

    const interval = setInterval(() => {
      setPoints((prev) => {
        const next = [...prev.slice(1), Math.random() * 15 + 5];
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const color = variant === "critical" ? "#ef4444" : "#38bdf8";
  const svgPath = points
    .map((p, i) => `${i * 12},${30 - p}`)
    .reduce((acc, curr, i) => (i === 0 ? `M ${curr}` : `${acc} L ${curr}`), "");

  return (
    <svg width="130" height="30" style={{ overflow: "visible", opacity: 0.85 }}>
      <path d={svgPath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SensorPanel({ sensorData, selectedPart, onPartClick }) {
  const [activeTab, setActiveTab] = useState(selectedPart || "nacelle");

  // Sync tab layout if user clicks inside the 3D Canvas Hotspots
  useEffect(() => {
    if (selectedPart) {
      setActiveTab(selectedPart);
    }
  }, [selectedPart]);

  // CRITICAL FIX: Propagates the tab switch back up to the parent App state
  const handleTabToggle = (tab) => {
    setActiveTab(tab);
    if (onPartClick) {
      onPartClick(tab);
    }
  };

  const fmt = (val, suffix = "") => (val !== undefined && val !== null ? `${val} ${suffix}` : "N/A");

  const isVibrationCritical = (sensorData?.vibration_mm_s ?? 0) > 15.0;
  const isGearboxCritical = (sensorData?.gearbox_temp_c ?? 0) > 90.0;

  return (
    <div className="card sensor-panel" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      
      {/* CARD INTERACTION ACTION BAR */}
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
        <h3 className="card-title" style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>Live Telemetry Stream</h3>
        <span style={{
          fontSize: "10px", padding: "4px 10px", borderRadius: "20px",
          background: "rgba(14, 165, 233, 0.12)", color: "#38bdf8",
          fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px",
          border: "1px solid rgba(14, 165, 233, 0.25)"
        }}>
          Live Matrix
        </span>
      </div>

      {/* INDUSTRIAL HARDWARE FILTER TABS */}
      <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "2px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
        {["blade", "nacelle", "tower"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabToggle(tab)}
            style={{
              flex: 1, padding: "8px 0", background: activeTab === tab ? "rgba(30, 41, 59, 0.9)" : "transparent",
              border: "none", borderRadius: "6px", color: activeTab === tab ? "#38bdf8" : "#64748b",
              fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px",
              cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: activeTab === tab ? "0 4px 12px rgba(0,0,0,0.25)" : "none",
              borderBottom: activeTab === tab ? "1px solid rgba(56, 189, 248, 0.3)" : "none"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="sensor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        
        {/* --- BLADE COMPONENT DOMAIN MATRIX --- */}
        {activeTab === "blade" && (
          <>
            <div className="sensor-item" style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(56,189,248,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.06)" }}>
              <div>
                <div className="sensor-label" style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b" }}>Blade Load Trend</div>
                <div style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: "600", marginTop: "2px" }}>Aerodynamic Stresses</div>
              </div>
              <TelemetrySparkline variant="info" />
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "10px", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Wind Speed</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.wind_speed_mps, "m/s")}</div>
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "10px", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Rotor Speed</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.rotor_rpm, "RPM")}</div>
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "10px", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Blade Pitch Angle</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.pitch_angle_deg, "°")}</div>
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "10px", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Yaw Error Angle</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.yaw_error_deg, "°")}</div>
            </div>
          </>
        )}

        {/* --- NACELLE COMPONENT DOMAIN MATRIX --- */}
        {activeTab === "nacelle" && (
          <>
            <div className="sensor-item" style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", background: isGearboxCritical ? "rgba(239,68,68,0.03)" : "rgba(56,189,248,0.02)", padding: "10px", borderRadius: "8px", border: isGearboxCritical ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(56,189,248,0.06)" }}>
              <div>
                <div className="sensor-label" style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b" }}>Drive Train Thermal</div>
                <div style={{ fontSize: "12px", color: isGearboxCritical ? "#ef4444" : "#e2e8f0", fontWeight: "600", marginTop: "2px" }}>Gearbox Signatures</div>
              </div>
              <TelemetrySparkline variant={isGearboxCritical ? "critical" : "info"} />
            </div>

            <div className="sensor-item" style={{ 
              borderLeft: "3px solid #38bdf8", padding: "10px", borderRadius: "0 6px 6px 0",
              background: isGearboxCritical ? "rgba(239, 68, 68, 0.05)" : "rgba(255,255,255,0.01)",
              borderRight: isGearboxCritical ? "1px solid rgba(239, 68, 68, 0.2)" : "none"
            }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Gearbox Temp</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px", color: isGearboxCritical ? "#ef4444" : "#f8fafc" }}>
                {fmt(sensorData?.gearbox_temp_c, "°C")}
              </div>
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", padding: "10px", background: "rgba(255,255,255,0.01)", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Generator Temp</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.generator_temp_c, "°C")}</div>
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "10px", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Lubrication Oil</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.oil_temp_c, "°C")}</div>
            </div>

            <div className="sensor-item" style={{ borderLeft: "3px solid #38bdf8", paddingLeft: "10px", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "0 6px 6px 0" }}>
              <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Oil Pressure</div>
              <div className="sensor-value" style={{ fontSize: "18px", fontWeight: "700", marginTop: "4px" }}>{fmt(sensorData?.oil_pressure_bar, "bar")}</div>
            </div>
          </>
        )}

        {/* --- TOWER COMPONENT DOMAIN MATRIX --- */}
        {activeTab === "tower" && (
          <>
            <div className="sensor-item" style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", background: isVibrationCritical ? "rgba(239,68,68,0.03)" : "rgba(56,189,248,0.02)", padding: "10px", borderRadius: "8px", border: isVibrationCritical ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(56,189,248,0.06)" }}>
              <div>
                <div className="sensor-label" style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b" }}>Structural Frequency</div>
                <div style={{ fontSize: "12px", color: isVibrationCritical ? "#ef4444" : "#e2e8f0", fontWeight: "600", marginTop: "2px" }}>Oscillation Realtime Data</div>
              </div>
              <TelemetrySparkline variant={isVibrationCritical ? "critical" : "info"} />
            </div>

            <div className="sensor-item" style={{ 
              gridColumn: "1 / -1", borderLeft: "3px solid #38bdf8", padding: "12px", borderRadius: "0 6px 6px 0",
              background: isVibrationCritical ? "rgba(239, 68, 68, 0.05)" : "rgba(255,255,255,0.01)",
              borderRight: isVibrationCritical ? "1px solid rgba(239, 68, 68, 0.2)" : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div className="sensor-label" style={{ color: "#64748b", fontSize: "11px" }}>Structural Vibration Frequency</div>
                <div className="sensor-value" style={{ fontSize: "22px", fontWeight: "900", color: isVibrationCritical ? "#ef4444" : "#f8fafc", marginTop: "4px" }}>
                  {fmt(sensorData?.vibration_mm_s, "mm/s")}
                </div>
              </div>
              {isVibrationCritical && (
                <span style={{ fontSize: "10px", background: "#ef4444", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontWeight: "800", letterSpacing: "0.5px" }}>
                  CRITICAL SHIFT
                </span>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}