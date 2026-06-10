import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

DATA_PATH = "dataset/turbine_data.csv"
MODEL_PATH = "models/model.pkl"

LABEL_MAP = {
    "healthy": 0,
    "warning": 1,
    "critical": 2
}

REVERSE_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}


def main():
    os.makedirs("models", exist_ok=True)

    df = pd.read_csv(DATA_PATH)

    # Clean column names if needed
    df.columns = [c.strip() for c in df.columns]

    if "operating_state" not in df.columns:
        raise ValueError("Target column 'operating_state' not found in dataset.")

    # Drop non-training columns
    drop_cols = [c for c in ["timestamp", "turbine_id", "operating_state"] if c in df.columns]
    X = df.drop(columns=drop_cols)
    y = df["operating_state"].astype(str).str.strip().str.lower()

    # Encode labels
    if not set(y.unique()).issubset(set(LABEL_MAP.keys())):
        raise ValueError(f"Unexpected labels found: {sorted(y.unique())}")

    y = y.map(LABEL_MAP)

    # Keep only numeric columns
    numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
    X = X[numeric_cols].copy()

    if X.empty:
        raise ValueError("No numeric feature columns found in dataset.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", RandomForestClassifier(
            n_estimators=300,
            max_depth=14,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ))
    ])

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)

    acc = accuracy_score(y_test, preds)
    report = classification_report(y_test, preds, target_names=["healthy", "warning", "critical"], output_dict=True)
    cm = confusion_matrix(y_test, preds)

    bundle = {
        "pipeline": pipeline,
        "feature_columns": numeric_cols,
        "label_map": LABEL_MAP,
        "reverse_label_map": REVERSE_LABEL_MAP,
        "accuracy": acc,
        "classification_report": report,
        "confusion_matrix": cm.tolist()
    }

    joblib.dump(bundle, MODEL_PATH)

    print("Model trained and saved successfully.")
    print(f"Saved to: {MODEL_PATH}")
    print(f"Accuracy: {acc:.4f}")
    print("Confusion Matrix:")
    print(cm)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()