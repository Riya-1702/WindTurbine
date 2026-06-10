import React from "react";

export default function RecommendationPanel({ recommendations }) {
  const hasRecs = recommendations && recommendations.length > 0;

  return (
    <div className="card recommendation-panel">
      <div className="card-header">
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#38bdf8" }}>⚙</span> Intelligent Action Directives
        </h3>
      </div>

      <div className="recommendation-content" style={{ marginTop: "10px" }}>
        {hasRecs ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.0) 100%)",
                padding: "10px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.03)"
              }}>
                {/* Step Action Counter Number Wrapper */}
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minWidth: "18px", height: "18px", borderRadius: "50%",
                  background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8",
                  fontSize: "11px", fontWeight: "700"
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.4" }}>{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-text" style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
            System operating nominal. Standard routine scheduling applied.
          </div>
        )}
      </div>
    </div>
  );
}