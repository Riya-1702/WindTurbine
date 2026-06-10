// src/components/Terrain.jsx
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

// 1:1 DETACHED HEIGHT GENERATION MAP - MUPPANDAL VALLEY PASS REAL GEOGRAPHY
export function getSharedTerrainHeight(x, z) {
  const coreScale = 40; //
  const normX = THREE.MathUtils.clamp(x / coreScale, -1.0, 1.0); //

  // 1. Core Muppandal Geography: Deep Valley Trough along the Z-axis (Pass Section)
  const mountainPassTrough = Math.pow(Math.abs(normX * coreScale) * 0.16, 2.2) - 2.8; //

  // 2. Continuous Western Ghats Ridges (Fractal extension across infinite plane)
  const ridgeWave1 = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 2.8; //
  const ridgeWave2 = Math.cos(x * 0.05) * Math.sin(z * 0.04) * 4.5; //
  const microNoise = Math.sin(x * 1.5) * Math.cos(z * 1.5) * 0.08; //

  // Dampen mountains in the trough center (Region of Interest)
  const centralSmoothingFactor = THREE.MathUtils.clamp(Math.abs(normX) * 2.0, 0.1, 1.0); //
  let height = mountainPassTrough + (ridgeWave1 + ridgeWave2 + microNoise) * centralSmoothingFactor; //

  // 3. Flattening for infrastructure (Roads & Substation) - Remain at 1:1 local units
  const roadFormula = Math.abs(z - Math.sin(x * 0.08) * 12 - 2); //
  if (roadFormula < 1.8) { //
    return -2.45; //
  }

  const distanceFromCenter = Math.sqrt(x * x + z * z); //
  if (distanceFromCenter < 14) { //
    return THREE.MathUtils.lerp(-2.5, height * 0.10 - 2.3, distanceFromCenter / 14); //
  }

  return Math.max(-4.5, Math.min(22.0, height)); //
}

export default function Terrain({ isDay }) {
  const meshRef = useRef(); //
  
  const largeSize = 400; //
  const vertexDensity = 250; //

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(largeSize, largeSize, vertexDensity, vertexDensity); //
    geo.rotateX(-Math.PI / 2); //

    const pos = geo.attributes.position; //
    const colorArray = new Float32Array(pos.count * 3); //

    // 🔥 IMPROVED: DYNAMIC REAL-LIFE DAY vs NIGHT PALETTE MATRIX BASED ON ISDAY PROP
    const valleyGrassColor = isDay ? new THREE.Color("#4ade80") : new THREE.Color("#14532d");   // Bright lime grass vs night dark forest green
    const hillsideSlopeColor = isDay ? new THREE.Color("#22c55e") : new THREE.Color("#166534");  // Mid green slopes
    const rockyRidgeColor = isDay ? new THREE.Color("#94a3b8") : new THREE.Color("#334155");     // Slate sun-baked hills vs night deep blue cliffs
    const asphaltRoadColor = isDay ? new THREE.Color("#475569") : new THREE.Color("#0f172a");     // Warm grey access roads
    const substationPadColor = isDay ? new THREE.Color("#64748b") : new THREE.Color("#475569");   // Substation platform foundation layer

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); //
      const z = pos.getZ(i); //

      const height = getSharedTerrainHeight(x, z); //
      pos.setY(i, height); //

      let vertexColor = valleyGrassColor;
      const roadFormula = Math.abs(z - Math.sin(x * 0.08) * 12 - 2); //
      
      if (roadFormula < 1.8) { //
        vertexColor = asphaltRoadColor;
      } else {
        const distanceFromCenter = Math.sqrt(x * x + z * z); //
        if (distanceFromCenter < 14) { //
          vertexColor = distanceFromCenter < 4 ? substationPadColor : rockyRidgeColor; //
        } else {
          if (height > 4.5) { //
            vertexColor = rockyRidgeColor; //
          } else if (height > 0.5) { //
            vertexColor = hillsideSlopeColor.clone().lerp(rockyRidgeColor, 0.4); //
          } else {
            vertexColor = valleyGrassColor.clone().lerp(hillsideSlopeColor, (height + 3) * 0.25); //
          }
        }
      }

      colorArray[i * 3] = vertexColor.r; //
      colorArray[i * 3 + 1] = vertexColor.g; //
      colorArray[i * 3 + 2] = vertexColor.b; //
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3)); //
    geo.computeVertexNormals(); //
    return { geometry: geo };
  }, [isDay]); // 🔥 CRITICAL FIX: isDay change hote hi landscape full recolor re-render trigger karega!

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow> {/* */}
        <meshStandardMaterial
          vertexColors
          roughness={isDay ? 0.88 : 0.98} // Day time par sunlight bounce badhane ke liye roughness choti ki
          metalness={0.01} //
          flatShading={false} //
        />
      </mesh>

      <mesh geometry={geometry} position={[0, 0.01, 0]}> {/* */}
        <meshStandardMaterial
          color={isDay ? "#0284c7" : "#0ea5e9"} //
          wireframe //
          transparent //
          opacity={isDay ? 0.006 : 0.035} // Day mode wireframe fade-out layer taaki background clean bright lage
        />
      </mesh>
    </group>
  );
}