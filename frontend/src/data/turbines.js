// src/data/turbines.js

export const turbineData = [
  // --- CLUSTER A: HILLSIDE ROW ARRAYS (Western Ghats Elevation Grid) ---
  { id: "T-01", position: [-28.0, 0, -22.0], state: "healthy" },
  { id: "T-02", position: [-24.0, 0, -5.0],  state: "healthy" },
  { id: "T-03", position: [-26.0, 0, 15.0],  state: "warning" },

  // --- CLUSTER B: CENTRAL VALLEY PASS GRID (High-Velocity Wind Channels) ---
  { id: "T-04", position: [-6.0,  0, -28.0], state: "healthy" },
  { id: "T-05", position: [2.0,   0, -14.0], state: "critical" },
  { id: "T-06", position: [-2.0,  0, 4.0],   state: "healthy" },
  { id: "T-07", position: [6.0,   0, 22.0],  state: "healthy" },

  // --- CLUSTER C: EASTERN RIDGE RECEPTACLE ARRAYS ---
  { id: "T-08", position: [26.0,  0, -18.0], state: "healthy" },
  { id: "T-09", position: [24.0,  0, 8.0],   state: "healthy" }
];