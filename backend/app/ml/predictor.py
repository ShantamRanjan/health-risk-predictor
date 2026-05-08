"""
Runtime ML loader & predictor with SHAP explanations and lifestyle suggestions.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import shap

from app.core.config import settings
from app.ml.encoders import encode_value
from app.ml.suggestions import build_suggestions

MODEL_DIR = Path(settings.MODEL_DIR)


class DiseaseModel:
    def __init__(self, payload: Dict[str, Any]):
        self.disease: str = payload["disease"]
        self.pipeline = payload["pipeline"]
        self.feature_names: List[str] = payload["feature_names"]
        self.background = payload["background"]
        self.metrics = payload.get("metrics", {})
        self._explainer: shap.Explainer | None = None

    @property
    def explainer(self) -> shap.Explainer:
        if self._explainer is None:
            # Use scaled background so SHAP operates on the underlying classifier
            scaler = self.pipeline.named_steps["scaler"]
            clf = self.pipeline.named_steps["clf"]
            bg_scaled = scaler.transform(self.background)
            self._explainer = shap.TreeExplainer(clf, bg_scaled)
        return self._explainer

    def predict(self, raw_inputs: Dict[str, Any]):
        # Build feature vector in the order the model expects
        vector = []
        for name in self.feature_names:
            if name not in raw_inputs:
                raise ValueError(f"Missing feature '{name}' for {self.disease}")
            vector.append(encode_value(self.disease, name, raw_inputs[name]))
        x = np.array(vector, dtype=float).reshape(1, -1)

        prob = float(self.pipeline.predict_proba(x)[0, 1])
        risk_level = (
            "low" if prob < 0.30 else
            "moderate" if prob < 0.60 else
            "high"
        )

        # SHAP — explain the scaled instance
        scaler = self.pipeline.named_steps["scaler"]
        x_scaled = scaler.transform(x)
        sv = self.explainer.shap_values(x_scaled)
        # Some SHAP versions return a list for binary classification
        if isinstance(sv, list):
            sv = sv[1] if len(sv) > 1 else sv[0]
        sv = np.asarray(sv).reshape(-1)

        contributions = [
            {
                "feature": name,
                "value": raw_inputs[name],
                "shap_value": float(sv[i]),
            }
            for i, name in enumerate(self.feature_names)
        ]
        contributions.sort(key=lambda c: abs(c["shap_value"]), reverse=True)

        suggestions = build_suggestions(self.disease, raw_inputs, contributions)

        return {
            "disease": self.disease,
            "risk_score": prob,
            "risk_level": risk_level,
            "explanation": contributions,
            "suggestions": suggestions,
        }


class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, DiseaseModel] = {}
        self.metadata: Dict[str, Any] = {}

    def load_all(self):
        if not MODEL_DIR.exists():
            return
        meta_file = MODEL_DIR / "metadata.json"
        if meta_file.exists():
            self.metadata = json.loads(meta_file.read_text())
        for path in MODEL_DIR.glob("*.pkl"):
            payload = joblib.load(path)
            model = DiseaseModel(payload)
            self._models[model.disease] = model

    def get(self, disease: str) -> DiseaseModel:
        if disease not in self._models:
            raise KeyError(
                f"Model for '{disease}' not loaded. Run `python -m ml_training.train` first."
            )
        return self._models[disease]

    def diseases(self) -> List[str]:
        return list(self._models.keys())


registry = ModelRegistry()
