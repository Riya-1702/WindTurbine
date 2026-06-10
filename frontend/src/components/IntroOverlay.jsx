import React from "react";

export default function IntroOverlay({
  focused,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        left: 30,
        zIndex: 100,
        transition: "all 0.8s ease",
        opacity: focused ? 0 : 1,
        transform: focused
          ? "translateY(-20px)"
          : "translateY(0px)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 14,
          letterSpacing: 6,
          color: "#6ee7b7",
          marginBottom: 14,
        }}
      >
        WIND FARM DIGITAL TWIN
      </div>

      <div
        style={{
          fontSize: 62,
          fontWeight: 800,
          lineHeight: 1,
          color: "white",
          maxWidth: 700,
        }}
      >
        Real-Time Wind Intelligence
      </div>

      <div
        style={{
          marginTop: 20,
          color: "#cbd5e1",
          fontSize: 18,
          maxWidth: 580,
          lineHeight: 1.7,
        }}
      >
        Predictive monitoring, live
        telemetry and AI-driven turbine
        diagnostics across the wind farm.
      </div>
    </div>
  );
}