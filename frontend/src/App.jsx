// src/App.jsx
import React, { useMemo, useState } from "react";
import Scene3D from "./components/Scene3D";
import SensorPanel from "./components/SensorPanel";
import HealthCard from "./components/HealthCard";
import AlertPanel from "./components/AlertPanel";
import RecommendationPanel from "./components/RecommendationPanel";
import { useLiveData } from "./hooks/useLiveData";

const PART_INFO = {
  blade: {
    label: "Blade",
    summary: "Tracks aerodynamic load, structural vibration, and sudden strain spikes from wind sheer variation.",
  },
  nacelle: {
    label: "Nacelle",
    summary: "Contains core drive train transmission, gearbox mechanics, thermal data, and oil pressure loops.",
  },
  tower: {
    label: "Tower",
    summary: "Monitors base tower axial stability, dynamic mass load transfer, and low frequency wave oscillations.",
  },
};

export default function App() {
  // CAMERA TRANSITION ARCHITECTURE MATRIX
  const [activeTurbineId, setActiveTurbineId] = useState(null); //
  const [activeTurbinePosition, setActiveTurbinePosition] = useState(null); //

  // CORE 3-WAY STATE MACHINE: 'normal' | 'minimized' | 'full'
  const [panelMode, setPanelMode] = useState("normal"); //

  // 🔥 NEW FUNCTIONALITY: AUTOMATIC REALTIME HOUR DETECTION & OVERRIDE STATE
  const [isDay, setIsDay] = useState(() => {
    const currentHour = new Date().getHours();
    // Subah 6 baje se shaam ke 6 baje (18:00) tak true (Day), baaki false (Night)
    return currentHour >= 6 && currentHour < 18;
  });

  // Pass 'global' contextual reference fallback directly if no explicit turbine selection active
  const effectiveIdForHook = activeTurbineId || "global"; //
  const { sensorData, prediction, loading, connection, error } = useLiveData(effectiveIdForHook); //
  
  // Default structure maps directly to nacelle component safely
  const [selectedPart, setSelectedPart] = useState("nacelle"); //

  const healthState = prediction?.state || "healthy"; //

  const probabilities = useMemo(() => {
    if (!prediction?.probabilities) return { healthy: 1.0, warning: 0.0, critical: 0.0 };
    return prediction.probabilities;
  }, [prediction]);

  const topStats = useMemo(() => {
    if (!sensorData) {
      return [
        { label: "Target Context", value: activeTurbineId ? `NODE ${activeTurbineId}` : "FLEET OVERVIEW" }, //
        { label: "Confidence", value: `${Math.round((prediction?.confidence || 0) * 100)}%` }, //
        { label: "Connection", value: connection?.toUpperCase() || "ONLINE" }, //
      ];
    }
    return [
      { label: "Target Context", value: activeTurbineId ? `NODE ${activeTurbineId}` : "FLEET OVERVIEW" }, //
      { label: "Confidence", value: `${Math.round((prediction?.confidence || 0) * 100)}%` }, //
      { label: "Connection", value: connection?.toUpperCase() || "ONLINE" }, //
    ];
  }, [activeTurbineId, sensorData, prediction?.confidence, connection]);

  const alerts = useMemo(() => {
    if (!prediction?.alerts || prediction.alerts.length === 0) {
      return ["All edge sub-systems reporting normative tracking streams."];
    }
    return prediction.alerts;
  }, [prediction]);

  const recommendations = useMemo(() => {
    if (!prediction?.recommendations || prediction.recommendations.length === 0) {
      return ["No active degradation events flagged. Maintain standard analytics schedules."];
    }
    return prediction.recommendations;
  }, [prediction]);

  // FIXED REVERSE ACTION LOOP SYSTEM: Buttons text perfectly aligned with active state triggers
  const handlePanelCycle = () => {
    setPanelMode((prev) => {
      if (prev === "normal") return "minimized"; //
      if (prev === "minimized") return "full";     //
      return "normal";                            //
    });
  };

  const handleTurbineSelect = (id, position) => {
    setActiveTurbineId(id); //
    setActiveTurbinePosition(position); //
    setSelectedPart("nacelle"); //
  };

  const handleResetView = () => {
    setActiveTurbineId(null); //
    setActiveTurbinePosition(null); //
  };

  // Dynamic grid template columns layout width adjustment
  const getGridLayout = () => {
    if (panelMode === "minimized") return "1fr 60px"; //
    if (panelMode === "full") return "0px 1fr"; //
    return "1.7fr 0.9fr"; //
  };

  return (
    <div className="app-shell" style={{ position: "relative", width: "100%", height: "100%" }}>
      
      {/* GLOBAL TELEMETRY HEADER OVERLAY */}
      <header className="top-bar" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "70px",
        background: "linear-gradient(to bottom, rgba(3,7,18,0.95) 70%, rgba(3,7,18,0))",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 30px", zIndex: 150, pointerEvents: "none",
        opacity: panelMode === "full" ? 0 : 1,
        transform: panelMode === "full" ? "translateY(-30px)" : "translateY(0)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        <div style={{ pointerEvents: "auto" }}>
          <div className="eyebrow" style={{ letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "11px", margin: 0 }}>
            Wind Turbine Digital Twin
          </div>
          <h1 className="title" style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "800" }}>
            3D Interactive Health Intelligence
          </h1>
        </div>

        {/* 🔥 HIGH-TECH MANUAL DAY / NIGHT TOGGLE CONTROLLER HOUSING */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", pointerEvents: "auto" }}>
          <button
            onClick={() => setIsDay((prev) => !prev)}
            style={{
              background: isDay ? "rgba(245, 158, 11, 0.12)" : "rgba(56, 189, 248, 0.08)",
              border: isDay ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(56, 189, 248, 0.35)",
              color: isDay ? "#f59e0b" : "#38bdf8",
              padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
              fontSize: "11px", fontWeight: "700", letterSpacing: "1px",
              backdropFilter: "blur(12px)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: "6px"
            }}
          >
            <span>{isDay ? "☀️ DAY MODE" : "🌙 NIGHT MODE"}</span>
          </button>

          <div className={`status-pill ${healthState}`}>
            {loading ? "SYNCING LIVE DATA" : activeTurbineId ? `TURBINE ${activeTurbineId} : ${healthState.toUpperCase()}` : `FLEET SYSTEMS NOMINAL`}
          </div>
        </div>
      </header>

      {/* DYNAMIC WORKSPACE GRID LAYOUT */}
      <main className="dashboard-grid" style={{
        display: "grid",
        gridTemplateColumns: getGridLayout(),
        width: "100%",
        height: "100%",
        paddingTop: panelMode === "full" ? "0px" : "70px",
        boxSizing: "border-box",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        
        {/* INTERACTIVE 3D SCENE COMPONENT PANEL */}
        <section className="scene-panel" style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          opacity: panelMode === "full" ? 0 : 1,
          pointerEvents: panelMode === "full" ? "none" : "auto",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {panelMode !== "full" && (
            <Scene3D
              healthState={healthState}
              selectedPart={selectedPart}
              onPartClick={setSelectedPart}
              activeTurbineId={activeTurbineId}
              activeTurbinePosition={activeTurbinePosition}
              onTurbineSelect={handleTurbineSelect}
              partInfo={PART_INFO}
              isDay={isDay} // 🔥 OVERRIDE VALUE INJECTED INTO SHADER ENGINE
            />
          )}

          {/* ESCAPE MECHANISM CAPTURE RESET BUTTON */}
          {activeTurbineId && panelMode !== "full" && (
            <button
              onClick={handleResetView}
              style={{
                position: "absolute", top: "24px", left: "24px", zIndex: 160,
                background: "rgba(15, 23, 42, 0.85)", border: "1px solid #10b981",
                color: "#10b981", padding: "8px 16px", borderRadius: "6px",
                cursor: "pointer", fontWeight: "700", backdropFilter: "blur(8px)",
                fontSize: "11px", letterSpacing: "0.5px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
              }}
            >
              ← RESET VIEW
            </button>
          )}
        </section>

        {/* METRICS SIDEBAR ADAPTIVE HOUSING */}
        <aside className="side-panel visible" style={{
          display: "flex",
          flexDirection: "column",
          gap: panelMode === "minimized" ? "0px" : "20px",
          padding: panelMode === "minimized" ? "100px 4px 20px 4px" : panelMode === "full" ? "40px" : "inherit",
          overflowY: panelMode === "minimized" ? "hidden" : "auto",
          overflowX: "hidden",
          background: panelMode === "minimized" ? "rgba(7, 10, 16, 0.6)" : "var(--panel)",
          borderLeft: panelMode === "full" ? "none" : "1px solid var(--panel-border)",
          justifyContent: panelMode === "minimized" ? "center" : "flex-start",
          alignItems: panelMode === "minimized" ? "center" : "stretch",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative"
        }}>
          
          {/* FIXED ACTION INTERACTION SWITCH BUTTON */}
          <button 
            onClick={handlePanelCycle}
            style={{
              position: panelMode === "full" ? "fixed" : "absolute",
              top: "20px",
              right: "24px",
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(143, 179, 255, 0.35)",
              color: "#8fb3ff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1px",
              zIndex: 300,
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
            }}
          >
            <span>
              {panelMode === "normal" && "🔳 MAXIMIZE 3D"}
              {panelMode === "minimized" && "📊 FULL METRICS"}
              {panelMode === "full" && "🔲 SPLIT VIEW"}
            </span>
            <span style={{ fontSize: "11px" }}>
              {panelMode === "normal" && "◀"}
              {panelMode === "minimized" && "▶"}
              {panelMode === "full" && "🔄"}
            </span>
          </button>

          {/* CONDITIONAL RENDER WORKFLOW */}
          {panelMode !== "minimized" ? (
            <>
              {/* Context active aggregates label info bar */}
              {!activeTurbineId && (
                <div style={{ 
                  fontSize: "10px", color: "var(--blue)", fontWeight: "800", 
                  letterSpacing: "1px", textTransform: "uppercase", 
                  background: "rgba(143, 179, 255, 0.05)", padding: "8px 12px", 
                  borderRadius: "6px", border: "1px solid rgba(143, 179, 255, 0.15)",
                  marginTop: panelMode === "full" ? "50px" : "0px",
                  maxWidth: panelMode === "full" ? "320px" : "100%"
                }}>
                  📊 Micro-Asset Fleet Aggregations Active
                </div>
              )}

              {/* Dynamic Sub-Grid Alignment System */}
              {activeTurbineId ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: panelMode === "full" ? "1fr 1fr" : "1fr",
                  gap: "20px",
                  marginTop: panelMode === "full" ? "40px" : "0px",
                  transition: "all 0.3s ease"
                }}>
                  {/* Column One Frame Block */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid var(--panel-border)", paddingBottom: "6px", fontWeight: "600" }}>
                      Active Target: <span style={{ color: "#fff", fontWeight: "800" }}>Turbine {activeTurbineId}</span>
                    </div>
                    
                    <HealthCard
                      healthState={healthState}
                      prediction={prediction}
                      probabilities={probabilities}
                      topStats={topStats}
                      error={error}
                    />

                    <SensorPanel 
                      sensorData={sensorData} 
                      selectedPart={selectedPart} 
                      onPartClick={setSelectedPart} 
                    />
                  </div>

                  {/* Column Two Frame Block */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: panelMode === "full" ? "24px" : "0px" }}>
                    <AlertPanel alerts={alerts} />
                    <RecommendationPanel recommendations={recommendations} />
                  </div>
                </div>
              ) : (
                /* WELCOME STATE */
                <div className="side-panel empty-state-panel" style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", 
                  color: "#64748b", textTransform: "uppercase", fontSize: "11px", 
                  letterSpacing: "1.5px", textAlign: "center", padding: "20px",
                  marginTop: panelMode === "full" ? "40px" : "0px", minHeight: "200px",
                  border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.01)"
                }}>
                  <div>Select a wind turbine from the farm map to initiate deep diagnostics</div>
                </div>
              )}
            </>
          ) : (
            /* MINIMIZED GLASS HUD VERTICAL METRICS STRIP INDICATOR */
            <div style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              textTransform: "uppercase",
              letterSpacing: "4px",
              color: "var(--muted)",
              fontSize: "11px",
              fontWeight: "700",
              whiteSpace: "nowrap",
              opacity: 0.6,
              userSelect: "none",
              marginTop: "20px"
            }}>
              {activeTurbineId ? `TRACKING NODE BLOCK T-${activeTurbineId}` : "FLEET DIAGNOSTICS VERTICAL MUX"}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}