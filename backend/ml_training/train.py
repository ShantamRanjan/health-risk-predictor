"""
Trains all disease models and saves them to backend/app/ml/saved_models/.

Usage:
    cd backend
    python -m ml_training.train

Each model is saved as a dict containing the fitted estimator, the feature
names (in the order the model expects), the SHAP background sample, and
performance metrics.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from ml_training.synthetic_data import GENERATORS
from ml_training.disease_specs import DISEASES

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "app" / "ml" / "saved_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def train_one(disease: str) -> dict:
    print(f"\n=== Training {disease} ===")
    df = GENERATORS[disease]()
    feature_cols = [c for c in df.columns if c != "target"]
    X = df[feature_cols].values.astype(float)
    y = df["target"].values.astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(
            n_estimators=200, max_depth=3, learning_rate=0.08, random_state=42
        )),
    ])
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    y_prob = pipe.predict_proba(X_test)[:, 1]
    acc = accuracy_score(y_test, y_pred)
    try:
        auc = roc_auc_score(y_test, y_prob)
    except Exception:
        auc = float("nan")

    print(f"  accuracy = {acc:.3f}   AUC = {auc:.3f}   n_train = {len(X_train)}")

    # SHAP background — small representative sample
    background_idx = np.random.RandomState(0).choice(
        len(X_train), size=min(100, len(X_train)), replace=False
    )
    background = X_train[background_idx]

    payload = {
        "disease": disease,
        "pipeline": pipe,
        "feature_names": feature_cols,
        "background": background,
        "metrics": {"accuracy": float(acc), "auc": float(auc)},
        "n_features": len(feature_cols),
    }
    out_path = MODEL_DIR / f"{disease}.pkl"
    joblib.dump(payload, out_path)
    print(f"  saved -> {out_path.relative_to(ROOT)}")
    return {"accuracy": float(acc), "auc": float(auc), "features": feature_cols}


def main():
    summary = {}
    for disease in GENERATORS.keys():
        summary[disease] = train_one(disease)

    # Write a metadata file with feature specs + metrics so the frontend
    # can render dynamic forms without hitting the model files directly.
    metadata = {
        "diseases": {
            name: {
                **spec,
                "metrics": summary[name],
            }
            for name, spec in DISEASES.items()
            if name in summary
        }
    }
    meta_path = MODEL_DIR / "metadata.json"
    meta_path.write_text(json.dumps(metadata, indent=2))
    print(f"\nMetadata -> {meta_path.relative_to(ROOT)}")
    print("\nAll done.")


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT))
    main()
