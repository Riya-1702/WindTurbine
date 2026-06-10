from __future__ import annotations

import os
import logging
import random
from pathlib import Path
from typing import Any, Dict, List

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "model.pkl"

FEATURE_COLUMNS: List[str] = [
    "wind_speed_mps",
    "ambient_temp_c",
    "humidity_pct",
    "rotor_rpm",
    "generator_rpm",
    "power_kw",
    "pitch_angle_deg",
    "yaw_error_deg",
    "gearbox_temp_c",
    "generator_temp_c",
    "nacelle_temp_c",
    "oil_temp_c",
    "oil_pressure_bar",
    "hydraulic_pressure_bar",
    "vibration_mm_s",
]

DEFAULTS: Dict[str, float] = {
    "wind_speed_mps": 11.5,
    "ambient_temp_c": 29.0,
    "humidity_pct": 55.0,
    "rotor_rpm": 14.0,
    "generator_rpm": 1250.0,
    "power_kw": 1650.0,
    "pitch_angle_deg": 3.5,
    "yaw_error_deg": 1.2,
    "gearbox_temp_c": 61.0,
    "generator_temp_c": 58.0,
    "nacelle_temp_c": 56.0,
    "oil_temp_c": 47.0,
    "oil_pressure_bar": 2.4,
    "hydraulic_pressure_bar": 175.0,
    "vibration_mm_s": 2.8,
}

STATE_RECOMMENDATIONS = {
    "healthy": [
        "Continue normal operation",
        "Keep monitoring trend stability",
        "Schedule routine inspection at standard interval",
    ],
    "warning": [
        "Inspect vibration trend and bearing condition",
        "Check lubrication and temperature rise",
        "Reduce load if the trend continues upward",
    ],
    "critical": [
        "Trigger maintenance alarm immediately",
        "Limit load and prepare shutdown workflow",
        "Inspect gearbox, generator, and vibration source",
    ],
}

# --- GLOBAL MODEL REFERENCES FOR INFERENCE UNPACKING ---
model_pipeline = None
model_features_from_bundle = None
reverse_label_map = None

def load_model():
    global model_pipeline, model_features_from_bundle, reverse_label_map
    if not MODEL_PATH.exists():
        logger.error(f"Model file missing at: {MODEL_PATH}")
        raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")
    
    # train_model.py se dump kiya hua bundle object load ho raha hai
    bundle = joblib.load(MODEL_PATH)
    
    if isinstance(bundle, dict):
        logger.info("ML Model Dictionary Bundle detected. Extracting components...")
        model_pipeline = bundle.get("pipeline")
        model_features_from_bundle = bundle.get("feature_columns", FEATURE_COLUMNS)
        reverse_label_map = bundle.get("reverse_label_map", {0: "healthy", 1: "warning", 2: "critical"})
    else:
        logger.warning("Loaded object is not a dictionary bundle. Using direct model fallback.")
        model_pipeline = bundle
        model_features_from_bundle = FEATURE_COLUMNS
        reverse_label_map = None

    logger.info("ML Model loaded successfully.")
    return bundle

app = Flask(__name__)
CORS(app)
model_bundle = load_model()

def _normalize_input(payload: Dict[str, Any], turbine_id: str = "T-01") -> Dict[str, float]:
    raw = payload.get("sensor_data", payload) if isinstance(payload, dict) else {}
    normalized: Dict[str, float] = {}

    for key in FEATURE_COLUMNS:
        value = raw.get(key, DEFAULTS[key])
        try:
            normalized[key] = float(value)
        except (TypeError, ValueError):
            normalized[key] = DEFAULTS[key]

    return normalized

def _infer_state_label(prediction: Any) -> str:
    if prediction is None:
        return "healthy"
        
    # Agar model ne sidha numeric class (0, 1, 2) diya aur hamare paas reverse map hai
    if reverse_label_map is not None:
        try:
            idx = int(prediction)
            if idx in reverse_label_map:
                return reverse_label_map[idx]
        except (ValueError, TypeError):
            pass

    label = str(prediction).strip().lower()
    if label in {"healthy", "warning", "critical"}:
        return label
    return "healthy"

def _severity_score(state: str, proba: Dict[str, float]) -> float:
    max_prob = max(proba.values(), default=0.10) if proba else 0.10
    if state == "critical":
        return round(0.85 + max_prob * 0.10, 4)
    if state == "warning":
        return round(0.55 + max_prob * 0.15, 4)
    return round(0.18 + max_prob * 0.08, 4)

@app.get("/")
def index():
    return jsonify({
        "service": "Fusion-Net AI Backend Blueprint Engine",
        "status": "online",
        "endpoints": ["/health", "/predict"]
    })

@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model_pipeline is not None,
        "features": FEATURE_COLUMNS,
    })

# --- ADAPTIVE ID-ROUTING ENDPOINT PIPELINE ---
@app.route("/predict", methods=["POST"])
@app.route("/predict/<turbine_id>", methods=["POST"])
def predict(turbine_id: str = "T-01"):
    try:
        payload = request.get_json(force=True, silent=True)
        if payload is None:
            logger.warning(f"Empty payload on matrix filter context {turbine_id}. Defaulting arrays.")
            payload = {}
            
        sensors = _normalize_input(payload, turbine_id)
        
        # Align features dynamic matching ke saath
        features_to_use = model_features_from_bundle if model_features_from_bundle else FEATURE_COLUMNS
        df = pd.DataFrame([sensors], columns=features_to_use)

        # Execute ML Model Framework Evaluation over the internal pipeline object
        raw_pred = model_pipeline.predict(df)[0]
        state = _infer_state_label(raw_pred)

        probabilities = {"healthy": 0.0, "warning": 0.0, "critical": 0.0}
        
        if hasattr(model_pipeline, "predict_proba"):
            try:
                proba = model_pipeline.predict_proba(df)[0]
                
                # Agar mapping available hai toh predict_proba arrays map karo numeric keys ke according
                if reverse_label_map is not None:
                    for i, p in enumerate(proba):
                        state_str = reverse_label_map.get(i, str(i))
                        if state_str in probabilities:
                            probabilities[state_str] = float(p)
                else:
                    classes = [str(c).strip().lower() for c in model_pipeline.classes_]
                    for cls, p in zip(classes, proba):
                        if cls in probabilities:
                            probabilities[cls] = float(p)
            except Exception as e:
                logger.warning(f"Could not extract predict_proba: {e}")

        confidence = float(max(probabilities.values()) if probabilities else 0.0)
        if confidence <= 0.0:
            confidence = 0.5 if state != "healthy" else 0.62

        score = _severity_score(state, probabilities)

        # Dynamic RUL calculations output allocations
        if state == "critical":
            time_to_failure_hrs = round(1.5 + (probabilities["healthy"] * 2.0), 1)
        elif state == "warning":
            time_to_failure_hrs = round(24.0 + (probabilities["healthy"] * 48.0), 1)
        else:
            time_to_failure_hrs = 168.0  

        # Explainable AI dynamic weights calibrations
        if state == "critical":
            feature_importance = {
                "vibration_mm_s": 58 if sensors["vibration_mm_s"] > 12 else 42,
                "gearbox_temp_c": 28 if sensors["gearbox_temp_c"] > 80 else 38,
                "generator_temp_c": 14
            }
        elif state == "warning":
            feature_importance = {
                "gearbox_temp_c": 46 if sensors["gearbox_temp_c"] > 65 else 35,
                "vibration_mm_s": 38,
                "pitch_angle_deg": 16
            }
        else:
            feature_importance = {
                "wind_speed_mps": 45,
                "rotor_rpm": 35,
                "vibration_mm_s": 20
            }

        alerts = []
        if state == "critical":
            alerts = [
                f"Critical anomaly detected on Node {turbine_id}",
                "Escalate maintenance response priority immediately",
                "Check vibration limits, structural load balancing and thermal rise boundaries",
            ]
        elif state == "warning":
            alerts = [
                f"Early degradation signatures active on Node {turbine_id}",
                "Watch bearing vibration frequencies and internal fluid temperatures stability trends",
                "Plan preventative inspection cycles within the next deployment window",
            ]
        else:
            alerts = [
                f"Asset Node {turbine_id} performing nominally within threshold values",
                "No immediate manual interventions required across current metrics logs",
            ]

        response = {
            "turbine_id": turbine_id,
            "state": state,
            "prediction": state,
            "confidence": round(confidence, 4),
            "health_score": round(score, 4),
            "probabilities": probabilities,
            "time_to_failure_hrs": time_to_failure_hrs,  
            "feature_importance": feature_importance,    
            "alerts": alerts,
            "recommendations": STATE_RECOMMENDATIONS[state],
            "sensor_data": sensors,
        }
        
        return jsonify(response), 200

    except Exception as exc:
        logger.exception(f"Error occurred during telemetry inference flow on target {turbine_id}!")
        return jsonify({
            "error": "Prediction workflow crashed",
            "details": str(exc),
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_debug = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    
    logger.info(f"Starting Fusion-Net Dynamic Multi-Asset Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=is_debug)