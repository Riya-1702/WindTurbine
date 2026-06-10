// src/components/Scene3D.jsx
import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import WindFarm from "./WindFarm";
import Terrain, { getSharedTerrainHeight } from "./Terrain";
import CameraController from "./CameraController";
import { turbineData } from "../data/turbines"; 

// --- TECHNICAL INFRASTRUCTURE PERIMETER HIGHWAY LIGHT POLES ---
function LightPolesInfrastructure({ isDay }) {
  const polePositions = useMemo(() => [
    [-11.5, -2.4, 6], [11.5, -2.4, 7], [-5, -2.4, -13], [9, -2.4, -9], [-12.5, -2.4, 19]
  ], []);

  return (
    <group>
      {polePositions.map((pos, idx) => (
        <group key={`pole-${idx}`} position={pos}>
          {/* Main heavy pole core frame */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.06, 2.5, 8]} />
            <meshStandardMaterial color={isDay ? "#475569" : "#334155"} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Outward outreach extended horizontal arm */}
          <mesh position={[0.2, 1.2, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.6, 8]} />
            <meshStandardMaterial color={isDay ? "#475569" : "#334155"} metalness={0.6} />
          </mesh>
          {/* Industrial terminal luminaire box header */}
          <mesh position={[0.45, 1.35, 0]}>
            <boxGeometry args={[0.22, 0.08, 0.14]} />
            <meshStandardMaterial color={isDay ? "#334155" : "#1e293b"} />
          </mesh>
          {/* Luminous emission source matrix node block */}
          <mesh position={[0.45, 1.3, 0]}>
            <boxGeometry args={[0.18, 0.02, 0.1]} />
            <meshStandardMaterial 
              color={isDay ? "#cbd5e1" : "#ffedd5"} 
              emissive={isDay ? "#000000" : "#d97706"} 
              emissiveIntensity={isDay ? 0 : 8.0} 
            />
          </mesh>
          {/* Embedded spotlight casting real cone footprint masks down over the asphalt */}
          {!isDay && (
            <spotLight
              position={[0.45, 1.2, 0]}
              angle={0.45}
              penumbra={0.75}
              intensity={2.2}
              color="#d97706"
              castShadow
              shadow-bias={-0.0005}
            />
          )}
        </group>
      ))}
    </group>
  );
}

// --- UNDERGROUND GEOMETRIC POWER INFRASTRUCTURE CONDUIT LINK ---
function UndergroundPowerGrid({ activeTurbineId, healthState }) {
  const pulseGroupRef = useRef();
  const substationPos = useMemo(() => new THREE.Vector3(0, -2.4, -2), []);

  const gridPaths = useMemo(() => {
    return turbineData.map((t) => {
      const start = new THREE.Vector3(t.position[0], -2.4, t.position[2]); 
      const end = substationPos.clone();
      const midPoint = new THREE.Vector3(start.x, -2.4, end.z); 
      return new THREE.CatmullRomCurve3([start, midPoint, end], false, "catmullrom", 0.1);
    });
  }, [substationPos]);

  useFrame((state) => {
    if (!pulseGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const children = pulseGroupRef.current.children;

    gridPaths.forEach((path, index) => {
      const mesh = children[index];
      if (!mesh) return;
      const isLinked = activeTurbineId === turbineData[index]?.id;
      const speedMultiplier = isLinked && healthState === "critical" ? 2.5 : isLinked && healthState === "warning" ? 1.8 : 1.0;
      const progress = (time * 0.3 * speedMultiplier + (index * 0.25)) % 1.0;
      mesh.position.copy(path.getPointAt(progress));
      const pulseGlow = 1.0 + Math.sin(time * 6 + index) * 0.2;
      mesh.scale.setScalar(isLinked ? pulseGlow * 1.5 : pulseGlow);
    });
  });

  const baseActiveColor = healthState === "critical" ? "#ef4444" : healthState === "warning" ? "#f59e0b" : "#10b981";

  return (
    <group>
      {/* HARDENED INDUSTRIAL TERMINAL TRANSFORMER UNIT */}
      <group position={[substationPos.x, substationPos.y + 0.4, substationPos.z]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.8, 2.0]} />
          <meshStandardMaterial 
            color="#0b0f19" roughness={0.4} metalness={0.95}
            emissive={activeTurbineId ? baseActiveColor : "#38bdf8"} 
            emissiveIntensity={activeTurbineId ? 1.2 : 0.3}
          />
        </mesh>
        {/* Anti-Climb Mesh Perimeter Foundation Layer */}
        <mesh position={[0, -0.38, 0]}>
          <boxGeometry args={[2.5, 0.06, 2.5]} />
          <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.5} />
        </mesh>
      </group>

      {/* CONCEALED PIPELINE RUN TRACE CHANNELS */}
      {gridPaths.map((path, index) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(40));
        const isLinked = activeTurbineId === turbineData[index]?.id;
        return (
          <line key={`trench-${index}`} geometry={geometry}>
            <lineBasicMaterial color={isLinked ? baseActiveColor : "#1e293b"} transparent opacity={isLinked ? 0.45 : 0.08} />
          </line>
        );
      })}

      {/* UNDERGROUND CONDUIT PHOTON ENERGY BULLETS */}
      <group ref={pulseGroupRef}>
        {gridPaths.map((_, index) => {
          const isLinked = activeTurbineId === turbineData[index]?.id;
          const pulseColor = isLinked ? baseActiveColor : "#38bdf8";
          return (
            <mesh key={`pulse-${index}`}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color={pulseColor} emissive={pulseColor} emissiveIntensity={isLinked ? 5.0 : 2.5} transparent opacity={0.95} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}


function WindStreamLines({ healthState, isDay }) {
  const lineRef = useRef();
  const streamCount = 90; 
  const pointsPerStream = 24; 

  const shearTracker = useRef({
    intensity: 0,
    targetIntensity: 0,
    nextTriggerTime: 2, 
    durationCounter: 0
  });

  const { geometries, initialData } = useMemo(() => {
    const geos = [];
    const data = [];

    for (let i = 0; i < streamCount; i++) {
      const startX = -120; 
      const startZ = (Math.random() - 0.5) * 80; 

      let streamTier = "valley";
      let baseHeightOffset = Math.random() * 8 + 4; 

      if (i % 3 === 1) {
        streamTier = "west_ridge";
        baseHeightOffset = Math.random() * 7 + 12; 
      } else if (i % 3 === 2) {
        streamTier = "east_ridge";
        baseHeightOffset = Math.random() * 7 + 10;
      }

      const randomDashSize = Math.random() * 2.5 + 1.2;
      const randomGapSize = Math.random() * 2.5 + 1.2;
      const randomThickness = Math.random() * 1.5 + 0.5; 

      const points = [];
      const streamVastRange = 240; 

      for (let j = 0; j < pointsPerStream; j++) {
        const posX = startX + (j * (streamVastRange / (pointsPerStream - 1)));
        
        const waveAngle = posX * 0.15 + startZ * 0.05;
        const turbulenceY = Math.sin(waveAngle) * 0.6 + Math.cos(posX * 0.4) * 0.2;
        const turbulenceZ = Math.cos(waveAngle * 0.8) * 1.2;
        
        const posZ = startZ + turbulenceZ;
        const groundElevation = getSharedTerrainHeight(posX, posZ);
        const posY = groundElevation + baseHeightOffset + turbulenceY;

        points.push(new THREE.Vector3(posX, posY, posZ));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(60); 
      const geo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      
      geos.push(geo);
      data.push({ 
        speedOffset: Math.random() * 0.5 + 0.85, 
        shift: Math.random() * Math.PI,
        dashSize: randomDashSize,
        gapSize: randomGapSize,
        linewidth: randomThickness,
        baseHeightOffset,
        startZ,
        streamTier
      });
    }
    return { geometries: geos, initialData: data };
  }, []);

  useFrame((state, delta) => {
    if (!lineRef.current) return;
    const time = state.clock.getElapsedTime();
    const tracker = shearTracker.current;

    if (time > tracker.nextTriggerTime) {
      if (tracker.targetIntensity === 0) {
        tracker.targetIntensity = Math.random() * 3.0 + 2.0; 
        tracker.durationCounter = time + Math.random() * 3.0 + 2.5; 
      }
    }

    if (tracker.targetIntensity > 0 && time > tracker.durationCounter) {
      tracker.targetIntensity = 0;
      tracker.nextTriggerTime = time + Math.random() * 8.0 + 6.0; 
    }

    tracker.intensity = THREE.MathUtils.lerp(tracker.intensity, tracker.targetIntensity, delta * 2.5);
    const baseWindSpeed = healthState === "critical" ? 6.5 : healthState === "warning" ? 4.2 : 2.4;
    
    const lines = lineRef.current.children;
    initialData.forEach((stream, index) => {
      const lineMesh = lines[index];
      if (lineMesh && lineMesh.material) {
        const tierModifier = stream.streamTier !== "valley" ? 1.45 : 1.0;
        const speed = baseWindSpeed + (tracker.intensity * 2.5);
        
        lineMesh.material.dashOffset -= delta * speed * stream.speedOffset * tierModifier;
        
        const naturalFlicker = Math.sin(time * 4.0 + stream.shift) * 0.015;
        const alphaMultiplier = stream.streamTier !== "valley" ? 0.22 : 0.12;
        
        // Balanced opacity parameters for day vs night
        const targetOpacity = tracker.intensity * alphaMultiplier * (isDay ? 1.4 : 1.0);
        lineMesh.material.opacity = Math.max(isDay ? 0.05 : 0.02, targetOpacity + naturalFlicker);

        const positionAttr = lineMesh.geometry.attributes.position;
        const arr = positionAttr.array;
        
        for (let k = 0; k < positionAttr.count; k++) {
          const posX = arr[k * 3 + 0];
          const posZ = arr[k * 3 + 2];
          
          const shearWaveY = Math.sin(posX * 0.25 + time * 6.0) * tracker.intensity * 0.35;
          const originalWaveAngle = posX * 0.15 + stream.startZ * 0.05;
          const baseTurbulenceY = Math.sin(originalWaveAngle) * 0.6 + Math.cos(posX * 0.4) * 0.2;
          const liveGroundHeight = getSharedTerrainHeight(posX, posZ);
          arr[k * 3 + 1] = liveGroundHeight + stream.baseHeightOffset + baseTurbulenceY + shearWaveY;
        }
        positionAttr.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={lineRef}>
      {geometries.map((geometry, index) => (
        <line key={`stream-${index}`} geometry={geometry}>
          <lineDashedMaterial
            color={isDay ? (initialData[index].streamTier !== "valley" ? "#0284c7" : "#0d9488") : (initialData[index].streamTier !== "valley" ? "#38bdf8" : "#99f6e4")} 
            dashSize={initialData[index].dashSize}
            gapSize={initialData[index].gapSize}
            linewidth={initialData[index].linewidth}
            transparent
            opacity={0.0} 
            blending={isDay ? THREE.NormalBlending : THREE.AdditiveBlending}
            depthWrite={false} 
          />
        </line>
      ))}
    </group>
  );
}

// --- MAIN 3D REALTIME VIEWPORT PLATFORM ---
export default function Scene3D({
  healthState = "healthy",
  selectedPart = null,
  hoveredPart = null,
  onPartClick,
  activeTurbineId,          
  activeTurbinePosition,    
  onTurbineSelect,
  partInfo = {},
  isDay = true
}) {
  // 🔥 FIXED: Toned down over-exposure parameters for true real-life daytime simulation
  const bg = isDay ? "#1a2e40" : "#010307";       // Balanced slate/industrial sky color 
  const fogColor = isDay ? "#1c2f42" : "#020408"; // Strict blending constraints to stop the washed-out white look

  const activePartMetadata = partInfo[selectedPart] || null;

  return (
    <div style={{ width: "100%", height: "100%", background: bg, position: "absolute", top: 0, left: 0 }}>
      
      {/* RUNTIME HUD TELEMETRY PANEL */}
      {activeTurbineId && activePartMetadata && (
        <div style={{
          position: "absolute", bottom: "24px", left: "20px", zIndex: 10,
          background: "rgba(6, 10, 23, 0.88)", border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "8px", padding: "12px 16px", maxWidth: "280px",
          backdropFilter: "blur(16px)", boxShadow: "0 12px 40px rgba(0,0,0,0.65)",
          pointerEvents: "none", transition: "all 0.3s ease"
        }}>
          <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#38bdf8", fontWeight: "800", letterSpacing: "1.5px" }}>
            Subsystem Diagnostics
          </div>
          <div style={{ fontSize: "16px", color: "#fff", fontWeight: "700", marginTop: "2px" }}>
            {activePartMetadata.label} Node
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", lineHeight: "1.4" }}>
            {activePartMetadata.summary}
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 24, 42], fov: 32, far: 2000 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        
        <color attach="background" args={[bg]} />
        
        <fog attach="fog" args={[fogColor, 20, 350]} />

        {/* 🔥 CALIBRATED INTENSITIES: Prevent vertex exposure burnout */}
        <ambientLight intensity={isDay ? 0.65 : 0.04} color={isDay ? "#e0f2fe" : "#0f172a"} />
        <hemisphereLight intensity={isDay ? 0.45 : 0.12} color={isDay ? "#ffffff" : "#38bdf8"} groundColor={isDay ? "#152013" : "#000000"} />
        
        <directionalLight 
          position={[60, 80, 40]} 
          intensity={isDay ? 2.2 : 0.6} // Toned down from 4.2 to stop color blowing artifacts
          color={isDay ? "#fffbeb" : "#7dd3fc"} 
          castShadow 
          shadow-bias={-0.00005} 
          shadow-mapSize={[4096, 4096]} 
        />
        
        <spotLight 
          position={[-15, 45, -10]} 
          angle={0.5} 
          penumbra={1} 
          intensity={isDay ? 0.8 : 4.5} 
          color="#0ea5e9" 
          castShadow 
        />

        {!isDay && <Stars radius={180} depth={60} count={2500} factor={4} saturation={0} fade />}

        <Suspense fallback={null}>
          <Terrain isDay={isDay} />
          
          <WindFarm 
            activeTurbineId={activeTurbineId}
            onTurbineSelect={onTurbineSelect}
            healthState={healthState}
            selectedPart={selectedPart}
            onPartClick={onPartClick}
          />
          
          <UndergroundPowerGrid activeTurbineId={activeTurbineId} healthState={healthState} />
          <WindStreamLines healthState={healthState} isDay={isDay} />
          <LightPolesInfrastructure isDay={isDay} />
          
          <Environment preset={isDay ? "city" : "night"} />
        </Suspense>

        <EffectComposer disableNormalPass>
          {/* Lowered bloom threshold boundaries for day mode to protect surface sharpness */}
          <Bloom luminanceThreshold={isDay ? 0.75 : 0.18} mipmapBlur intensity={isDay ? 0.6 : 2.5} radius={0.4} />
          <Vignette eskil={false} offset={0.15} darkness={isDay ? 0.55 : 0.95} />
        </EffectComposer>

        <CameraController activeTurbinePosition={activeTurbinePosition} />

      </Canvas>
    </div>
  );
}