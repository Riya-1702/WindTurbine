// src/components/WindFarm.jsx
import React, { useState, useMemo } from "react";
import { Html } from "@react-three/drei";
import TurbineModel from "./TurbineModel";
import { turbineData } from "../data/turbines"; 
import { getSharedTerrainHeight } from "./Terrain"; 

export default function WindFarm({ 
  onTurbineSelect, 
  activeTurbineId, 
  healthState, 
  selectedPart, 
  hoveredPart, 
  onPartClick 
}) {
  const [hoveredId, setHoveredId] = useState(null);

  // --- COUPLING ENGINE CONFIGURATION FOR REPLICATED GRID COORDS ---
  const terrainCoordinates = useMemo(() => {
    return turbineData.map((t) => {
      // Calculate precise vertical ground elevation from Muppandal Valley Pass Map
      const targetGroundHeight = getSharedTerrainHeight(t.position[0], t.position[2]);
      
      // Perfectly balances model origin scale factor offset onto terrain anchor boundary
      return targetGroundHeight + (2.5 * 1.2);
    });
  }, []);

  const handlePointerOver = (e, id) => {
    e.stopPropagation();
    if (!activeTurbineId) {
      setHoveredId(id);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredId(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e, turbine, index) => {
    e.stopPropagation();
    if (activeTurbineId === turbine.id) return;

    // Isolate exact base platform height coordinate values for camera transitions
    const basePlatformY = terrainCoordinates[index] - (2.5 * 1.2); 
    const structuralTargetVector = [turbine.position[0], basePlatformY, turbine.position[2]];
    
    onTurbineSelect?.(turbine.id, structuralTargetVector);
  };

  return (
    <group>
      {turbineData.map((turbine, index) => {
        const isActive = activeTurbineId === turbine.id;
        const isHovered = hoveredId === turbine.id;

        const statusColor = 
          turbine.state === "critical" ? "#ef4444" : 
          turbine.state === "warning" ? "#f59e0b" : "#34d399";

        // Assign Muppandal calibrated dynamic positioning values to group
        const absoluteWorldPosition = [turbine.position[0], terrainCoordinates[index], turbine.position[2]];

        return (
          <group
            key={turbine.id}
            position={absoluteWorldPosition}
            scale={isActive ? [1, 1, 1] : isHovered ? [1.03, 1.03, 1.03] : [1, 1, 1]}
            onPointerOver={(e) => handlePointerOver(e, turbine.id)}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(e, turbine, index)}
          >
            {/* LABELS HUD DESIGN CONSOLE */}
            {!isActive && (
              <Html 
                position={[0, 6.5, 0]} 
                center 
                distanceFactor={22} // Scaled up distance dampening factor for wide zoom stability
                className="select-none pointer-events-none"
              >
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(6, 10, 23, 0.94)",
                    border: `1px solid ${isHovered ? statusColor : "rgba(255,255,255,0.12)"}`,
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(4px)",
                    boxShadow: isHovered ? `0 0 12px ${statusColor}44` : "0 4px 10px rgba(0,0,0,0.4)",
                    transition: "all 0.2s ease"
                  }}
                >
                  Turbine {turbine.id}
                </div>
              </Html>
            )}

            <TurbineModel
              healthState={isActive ? healthState : turbine.state} 
              selectedPart={isActive ? selectedPart : null}
              hoveredPart={isActive ? hoveredPart : null}
              onPartClick={isActive ? onPartClick : null} 
              isHoveredTurbine={isHovered && !isActive}
              isActiveTurbine={isActive}
            />
          </group>
        );
      })}
    </group>
  );
}