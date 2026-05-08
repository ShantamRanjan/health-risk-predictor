"""
Encodes user-facing categorical inputs into the numeric form the model expects.

The training scripts use simple integer encodings — we mirror them here so
incoming JSON like {"sex": "male"} is correctly converted to 1.
"""
from __future__ import annotations

CATEGORY_ENCODINGS = {
    "heart": {
        "sex": {"female": 0, "male": 1},
        "cp": {"typical_angina": 0, "atypical_angina": 1, "non_anginal": 2, "asymptomatic": 3},
        "fbs": {"no": 0, "yes": 1},
        "exang": {"no": 0, "yes": 1},
        "smoker": {"no": 0, "yes": 1},
    },
    "diabetes": {},
    "kidney": {
        "hypertension": {"no": 0, "yes": 1},
        "diabetes_mellitus": {"no": 0, "yes": 1},
    },
    "liver": {
        "sex": {"female": 0, "male": 1},
    },
    "stroke": {
        "sex": {"female": 0, "male": 1},
        "hypertension": {"no": 0, "yes": 1},
        "heart_disease": {"no": 0, "yes": 1},
        "ever_married": {"no": 0, "yes": 1},
        "work_type": {"private": 0, "self_employed": 1, "govt_job": 2, "children": 3, "never_worked": 4},
        "residence_type": {"rural": 0, "urban": 1},
        "smoking_status": {"never_smoked": 0, "formerly_smoked": 1, "smokes": 2, "unknown": 3},
    },
    "hypertension": {
        "sex": {"female": 0, "male": 1},
        "smoker": {"no": 0, "yes": 1},
        "family_history": {"no": 0, "yes": 1},
    },
}


def encode_value(disease: str, feature: str, value):
    encoding = CATEGORY_ENCODINGS.get(disease, {}).get(feature)
    if encoding is None:
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    key = str(value).strip().lower().replace(" ", "_").replace("-", "_")
    if key not in encoding:
        raise ValueError(f"Invalid value '{value}' for {disease}.{feature}. Expected one of {list(encoding)}")
    return float(encoding[key])
