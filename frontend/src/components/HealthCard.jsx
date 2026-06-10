import React from "react";

export default function HealthCard({ healthState, prediction, probabilities, topStats, error }) {
  const stateColor =
    healthState === "critical" ? "#ef4444" : healthState === "warning" ? "#f59e0b" : "#10b981";

  // Safeguard values from prediction loops
  const pHealthy = probabilities?.healthy ?? 0.0;
  const pWarning = probabilities?.warning ?? 0.0;
  const pCritical = probabilities?.critical ?? 0.0;

  // Extract real-time analytical vectors injected from backend pipeline
  const ttf = prediction?.time_to_failure_hrs ?? 168.0;
  const featureImportance = prediction?.feature_importance || {};

  return (
    <div className="card health-card" style={{ borderTop: `4px solid ${stateColor}`, display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="card-title">AI Core Prediction Engine</h3>
        {error && <span className="error-badge">Fallback Mode</span>}
      </div>

      {/* Top Stats Grid */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", margin: "4px 0" }}>
        {topStats.map((stat, i) => (
          <div key={i} className="stat-box" style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>{stat.label}</div>
            <div style={{ fontSize: "16px", fontWeight: "700", marginTop: "4px", color: stat.label === "Health" ? stateColor : "#f8fafc" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* --- FEATURE 1: PREDICTIVE TIME-TO-FAILURE (RUL) PANEL --- */}
      <div style={{
        background: "rgba(6, 10, 23, 0.4)", 
        border: `1px dashed ${healthState === "healthy" ? "rgba(255,255,255,0.08)" : stateColor}`,
        borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Estimated Time To Failure
          </div>
          <div style={{ fontSize: "11px", color: healthState === "healthy" ? "#64748b" : "#94a3b8", marginTop: "2px" }}>
            {healthState === "healthy" ? "Systems nominal / No active threats" : "Predictive maintenance window"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "20px", fontWeight: "900", fontFamily: "monospace", color: stateColor, letterSpacing: "0.5px" }}>
            {ttf >= 24 ? `${Math.floor(ttf / 24)}d ${Math.floor(ttf % 24)}h` : `${ttf.toFixed(1)}h`}
          </span>
        </div>
      </div>

      <div className="divider" style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }}></div>

      {/* PROBABILITY DISTRIBUTION BARS */}
      <div className="probability-section">
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", letterSpacing: "0.5px", marginBottom: "12px" }}>
          MODEL PROBABILITY DISTRIBUTION
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Healthy Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#cbd5e1" }}>Healthy State</span>
              <span style={{ color: "#10b981", fontWeight: "600" }}>{Math.round(pHealthy * 100)}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${pHealthy * 100}%`, height: "100%", background: "#10b981", transition: "width 0.4s ease" }}></div>
            </div>
          </div>

          {/* Warning Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#cbd5e1" }}>Early Degradation</span>
              <span style={{ color: "#f59e0b", fontWeight: "600" }}>{Math.round(pWarning * 100)}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${pWarning * 100}%`, height: "100%", background: "#f59e0b", transition: "width 0.4s ease" }}></div>
            </div>
          </div>

          {/* Critical Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#cbd5e1" }}>Critical Anomaly</span>
              <span style={{ color: "#ef4444", fontWeight: "600" }}>{Math.round(pCritical * 100)}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${pCritical * 100}%`, height: "100%", background: "#ef4444", transition: "width 0.4s ease" }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }}></div>

      {/* --- FEATURE 4: EXPLAINABLE AI (XAI) ATTRIBUTION ENGINE --- */}
      <div className="xai-section" style={{ paddingBottom: "6px" }}>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", letterSpacing: "0.5px", marginBottom: "12px" }}>
          ROOT CAUSE FAULT ATTRIBUTION (SHAP WEIGHTS)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.keys(featureImportance).length > 0 ? (
            Object.entries(featureImportance).map(([sensorKey, weight]) => {
              const formattedLabel = sensorKey.replace("_mps", "").replace("_c", "").replace("_deg", "").replace("_mm_s", "").toUpperCase().replace("_", " ");
              return (
                <div key={sensorKey}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "#94a3b8" }}>{formattedLabel}</span>
                    <span style={{ color: "#38bdf8", fontWeight: "600" }}>{weight}%</span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${weight}%`, 
                      height: "100%", 
                      background: sensorKey.includes("vibration") || sensorKey.includes("temp") ? stateColor : "#38bdf8", 
                      transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" 
                    }}></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>Calculating SHAP node profiles...</div>
          )}
        </div>
      </div>

    </div>
  );
}