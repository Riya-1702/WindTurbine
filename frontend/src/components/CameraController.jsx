// src/components/CameraController.jsx
import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getSharedTerrainHeight } from "./Terrain"; // 1:1 Shared Height Map Sync Engine

export default function CameraController({ activeTurbinePosition }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 2500);
    return () => clearTimeout(timer);
  }, [activeTurbinePosition]);

  const targetCamPos = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();

  useFrame((_, delta) => {
    if (!isAnimating) return;

    if (activeTurbinePosition) {
      const turbineX = activeTurbinePosition[0];
      const turbineZ = activeTurbinePosition[2];

      // CRITICAL FIX: Direct calculation node block matching Terrain.jsx fractal loops height.
      // This ensures the camera perfectly aligns with the turbine's exact runtime ground surface anchor position.
      const rawTerrainHeight = getSharedTerrainHeight(turbineX, turbineZ);
      
      // Compensate for the internal model displacement offset: Y = Height + (2.5 * 1.2)
      const exactTurbineWorldY = rawTerrainHeight + (2.5 * 1.2);

      const isBackTurbine = turbineZ < -5;

      // FIXED RELATIVE CAMERA OFFSETS MATRICES
      const sideOffset = isBackTurbine ? 14.0 : 10.0;
      const heightOffset = isBackTurbine ? 11.0 : 7.0; 
      const depthOffset = isBackTurbine ? 18.0 : 12.0;
      
      // Focus look-at height targets base vectors tracking
      const focusHeight = isBackTurbine ? 4.5 : 5.5;

      targetCamPos.set(
        turbineX + sideOffset,
        exactTurbineWorldY + heightOffset, 
        turbineZ + depthOffset
      );
      
      targetLookAt.set(
        turbineX,
        exactTurbineWorldY + focusHeight, 
        turbineZ
      );
    } else {
      // GLOBAL OVERHEAD WIND FARM VIEWPORT DEFAULT
      targetCamPos.set(0, 32, 55); 
      targetLookAt.set(0, 2, -8); 
    }

    // Smooth cinematic viewport translation updates
    camera.position.lerp(targetCamPos, delta * 3.0);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, delta * 3.0);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false} 
      enableZoom={true}
      enableDamping={true} 
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.1} 
      minDistance={5}
      maxDistance={300} 
    />
  );
}