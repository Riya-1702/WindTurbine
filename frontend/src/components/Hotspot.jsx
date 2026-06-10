import React from "react";
import { Html } from "@react-three/drei";

const STATE_COLORS = {
  healthy: "#34d399",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export default function Hotspot({
  partKey,
  label,
  position = [0, 0, 0],
  active = false,
  healthState = "healthy",
  selected = false,
  onClick,
}) {
  const color = STATE_COLORS[healthState] || STATE_COLORS.healthy;

  // Unified execution handler to bypass R3F click pipeline bubbles completely
  const handlePartSelection = (e) => {
    if (e) {
      if (e.stopPropagation) e.stopPropagation();
      if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    }
    if (onClick) {
      onClick(partKey);
    }
  };

  return (
    <group position={position}>
      {/* Mesh Node */}
      <mesh
        onClick={handlePartSelection}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected || active ? 2.7 : 1.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Ring Ring Geometry */}
      <mesh scale={selected || active ? 1.8 : 1.25} onClick={handlePartSelection}>
        <ringGeometry args={[0.18, 0.28, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={2} />
      </mesh>

      {/* HTML Annotation Label */}
      <Html 
        center 
        distanceFactor={10} 
        transform
        style={{ pointerEvents: "none" }} // Allows transparency for R3F raycasting beneath
      >
        <div
          onClick={handlePartSelection} // Captures direct click override onto DOM node text container
          style={{
            pointerEvents: "auto", // Keeps the tag container reactive
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 999,
            background: selected ? color : "rgba(8, 12, 20, 0.82)",
            border: `1px solid ${color}`,
            color: selected ? "#080c14" : "#e5eefc",
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            boxShadow: selected || active ? `0 0 18px ${color}` : `0 0 18px ${color}66`,
            transform: "translateY(-24px)",
            transition: "all 0.15s ease-in-out"
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}