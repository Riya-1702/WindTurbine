// src/components/TurbineModel.jsx
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Hotspot from "./Hotspot";

const STATE_STYLE = {
  healthy: { emissive: "#34d399", intensity: 0.55, glow: "#34d399" },
  warning: { emissive: "#f59e0b", intensity: 0.9, glow: "#f59e0b" },
  critical: { emissive: "#ef4444", intensity: 1.25, glow: "#ef4444" },
};

function Blade({ rotation = [0, 0, 0], emissive = "#34d399", intensity = 0.14 }) {
  const bladeRef = useRef();

  useFrame((state) => {
    if (bladeRef.current) {
      bladeRef.current.rotation.x = 0.05 + Math.sin(state.clock.elapsedTime * 2.5) * 0.008;
    }
  });

  return (
    <group rotation={rotation}>
      <group ref={bladeRef} rotation={[0, 0.25, 0]}>
        {/* Blade Base Connector */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.18, 0.7, 32]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Main Aerodynamic Blade Structure */}
        <mesh position={[0, 2.5, 0]} scale={[1, 1, 0.12]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.18, 4.0, 32]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.2}
            metalness={0.3}
            emissive={new THREE.Color(emissive)}
            emissiveIntensity={intensity * 0.2}
          />
        </mesh>
        {/* Signal Danger Red Tip */}
        <mesh position={[0, 4.7, 0]} scale={[1, 1, 0.12]}>
          <cylinderGeometry args={[0.01, 0.03, 0.4, 32]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export default function TurbineModel({
  healthState = "healthy",
  selectedPart = null,
  hoveredPart = null,
  onPartClick,
  isHoveredTurbine = false,
  isActiveTurbine = false
}) {
  const rootRef = useRef();
  const rotorRef = useRef();

  const style = STATE_STYLE[healthState] || STATE_STYLE.healthy;
  const currentIntensity = isHoveredTurbine ? style.intensity * 3.5 : style.intensity;

  // Real-time compensated spatial coordinates mapping nodes vector maps
  const hotspotPositions = useMemo(() => ({
    blade: [0, 8.2, 1.4],      
    nacelle: [0, 7.8, -0.6],    
    tower: [0, 3.8, 0.7],      
  }), []);

  useFrame((_, delta) => {
    if (rootRef.current) {
      rootRef.current.rotation.z = Math.sin(Date.now() * 0.0005) * 0.0015;
    }
    if (rotorRef.current) {
      const speed = healthState === "critical" ? 0.08 : healthState === "warning" ? 0.6 : 1.2;
      rotorRef.current.rotation.z -= delta * speed;
    }
  });

  const handleLabelClick = (partName, event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation(); 
    }
    if (onPartClick) {
      onPartClick(partName);
    }
  };

  return (
    // CRITICAL UPDATE: Modified scope layer base layout parameters. 
    // Normalized position bounds from [0, -2.5, 0] scale to stable origin [0, -2.5, 0] base grid tracking
    <group ref={rootRef} position={[0, -2.5, 0]} scale={1.2}>
      
      {/* Base Platform */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.3, 0.4, 32]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Main Structural Tower Cylinder */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.85, 7.5, 64, 1, false]} />
        <meshStandardMaterial color={isHoveredTurbine ? "#f8fafc" : "#f1f5f9"} roughness={0.25} metalness={0.3} />
      </mesh>

      {/* Nacelle System Assembly Box */}
      <group position={[0, 7.2, 0]}>
        
        {/* Main Capsule Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.2]} castShadow receiveShadow>
          <capsuleGeometry args={[0.45, 1.5, 32, 64]} />
          <meshStandardMaterial color={isHoveredTurbine ? "#f1f5f9" : "#ffffff"} roughness={0.15} metalness={0.2} />
        </mesh>

        {/* Rear Cooling Exhaust Mount */}
        <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.5, 32]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.5} />
        </mesh>

        {/* Aviation Beacon Safety Light */}
        <mesh position={[0, 0.52, -0.8]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={isHoveredTurbine ? 3 : 1.5} />
        </mesh>

        {/* Rotor Connector & Rotating Blades */}
        <group ref={rotorRef} position={[0, 0, 0.8]} rotation={[0, 0, 0]}>
          <mesh position={[0, 0, 0.2]} scale={[1, 1, 1.4]} castShadow receiveShadow>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color={isHoveredTurbine ? "#e2e8f0" : "#ffffff"} roughness={0.2} metalness={0.3} />
          </mesh>

          <Blade rotation={[0, 0, 0]} emissive={style.emissive} intensity={currentIntensity} />
          <Blade rotation={[0, 0, (Math.PI * 2) / 3]} emissive={style.emissive} intensity={currentIntensity} />
          <Blade rotation={[0, 0, -(Math.PI * 2) / 3]} emissive={style.emissive} intensity={currentIntensity} />
        </group>
      </group>

      {/* Interactive Labels */}
      {isActiveTurbine && (
        <>
          <Hotspot
            partKey="blade" 
            label="Blade" 
            position={hotspotPositions.blade}
            active={hoveredPart === "blade" || selectedPart === "blade"} 
            selected={selectedPart === "blade"}
            healthState={healthState} 
            onClick={(e) => handleLabelClick("blade", e)}
          />
          <Hotspot
            partKey="nacelle" 
            label="Nacelle" 
            position={hotspotPositions.nacelle}
            active={hoveredPart === "nacelle" || selectedPart === "nacelle"} 
            selected={selectedPart === "nacelle"}
            healthState={healthState} 
            onClick={(e) => handleLabelClick("nacelle", e)}
          />
          <Hotspot
            partKey="tower" 
            label="Tower" 
            position={hotspotPositions.tower}
            active={hoveredPart === "tower" || selectedPart === "tower"} 
            selected={selectedPart === "tower"}
            healthState={healthState} 
            onClick={(e) => handleLabelClick("tower", e)}
          />
        </>
      )}
    </group>
  );
}