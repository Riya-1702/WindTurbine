import React from "react";

export default function AlertPanel({ alerts }) {
  const hasAlerts = alerts && alerts.length > 0;
  
  // Custom smart text override parser based on component state content strings
  const isCritical = alerts.some(a => a.toLowerCase().includes("critical") || a.toLowerCase().includes("escalate"));
  const isWarning = alerts.some(a => a.toLowerCase().includes("early") || a.toLowerCase().includes("watch"));

  const panelColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";
  const bgAlpha = isCritical ? "rgba(239, 68, 68, 0.03)" : isWarning ? "rgba(245, 158, 11, 0.03)" : "rgba(16, 185, 129, 0.03)";

  return (
    <div className="card alert-panel" style={{ background: bgAlpha, borderLeft: `3px solid ${panelColor}` }}>
      <div className="card-header">
        <h3 className="card-title" style={{ color: panelColor, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: panelColor }}></span>
          Telemetry Diagnosis Faults
        </h3>
      </div>

      <div className="alert-content" style={{ marginTop: "10px" }}>
        {hasAlerts ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {alerts.map((alert, i) => (
              <li key={i} style={{ 
                fontSize: "13px", color: "#cbd5e1", display: "flex", gap: "8px", 
                alignItems: "flex-start", background: "rgba(255,255,255,0.01)", 
                padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.03)"
              }}>
                <span style={{ color: panelColor, fontWeight: "bold" }}>➔</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-text" style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
            No diagnostic anomalies broadcasted from the Random Forest listener loop.
          </div>
        )}
      </div>
    </div>
  );
}