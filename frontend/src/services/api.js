// src/services/api.js
const API_BASE = "http://localhost:5000"; // Directly hardcoded to bypass any .env variable desync loops

async function requestJSON(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds resilient timeout block

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
      body: options.body,
    });
    
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.details || data?.error || `Request failed: ${res.status}`);
    }
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timed out (Backend network socket unreachable)");
    }
    throw error;
  }
}

export async function checkBackend() {
  return requestJSON("/health");
}

// 🔥 THE ULTIMATE RESILIENT ROUTER TRANSITION PIPELINE
// Formats string interpolation to guarantee seamless endpoint path matching on the Flask side
export async function predictTurbineState(sensorData, turbineId = "T-01") {
  const cleanId = String(turbineId).trim();
  return requestJSON(`/predict/${cleanId}`, {
    method: "POST",
    body: JSON.stringify({ sensor_data: sensorData }),
  });
}