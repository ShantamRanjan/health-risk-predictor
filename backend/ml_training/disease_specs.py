"""
Disease feature specifications.

Each spec defines:
  - feature names
  - human-readable labels
  - input ranges (for frontend form generation + validation)
  - units / categorical options

These are reused by the training scripts AND served from the backend so the
frontend can render a dynamic prediction form.
"""
from typing import Any, Dict, List, TypedDict


class FeatureSpec(TypedDict):
    name: str
    label: str
    type: str  # "number" | "category"
    min: float | None
    max: float | None
    unit: str | None
    options: List[str] | None
    description: str


DISEASES: Dict[str, Dict[str, Any]] = {
    "heart": {
        "label": "Heart Disease",
        "description": "Risk of coronary heart disease based on common clinical indicators.",
        "features": [
            {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "unit": "years"},
            {"name": "sex", "label": "Sex", "type": "category", "options": ["male", "female"]},
            {"name": "cp", "label": "Chest Pain Type", "type": "category",
             "options": ["typical_angina", "atypical_angina", "non_anginal", "asymptomatic"]},
            {"name": "trestbps", "label": "Resting Blood Pressure", "type": "number", "min": 80, "max": 220, "unit": "mm Hg"},
            {"name": "chol", "label": "Cholesterol", "type": "number", "min": 100, "max": 600, "unit": "mg/dl"},
            {"name": "fbs", "label": "Fasting Blood Sugar > 120 mg/dl", "type": "category", "options": ["yes", "no"]},
            {"name": "thalach", "label": "Max Heart Rate Achieved", "type": "number", "min": 60, "max": 220, "unit": "bpm"},
            {"name": "exang", "label": "Exercise-Induced Angina", "type": "category", "options": ["yes", "no"]},
            {"name": "oldpeak", "label": "ST Depression (Exercise)", "type": "number", "min": 0, "max": 10, "unit": ""},
            {"name": "smoker", "label": "Smoker", "type": "category", "options": ["yes", "no"]},
        ],
    },
    "diabetes": {
        "label": "Type 2 Diabetes",
        "description": "Risk of type 2 diabetes (Pima Indians-style features).",
        "features": [
            {"name": "pregnancies", "label": "Pregnancies", "type": "number", "min": 0, "max": 20, "unit": ""},
            {"name": "glucose", "label": "Plasma Glucose (2-hr OGTT)", "type": "number", "min": 0, "max": 300, "unit": "mg/dl"},
            {"name": "blood_pressure", "label": "Diastolic BP", "type": "number", "min": 0, "max": 150, "unit": "mm Hg"},
            {"name": "skin_thickness", "label": "Triceps Skinfold", "type": "number", "min": 0, "max": 100, "unit": "mm"},
            {"name": "insulin", "label": "Serum Insulin", "type": "number", "min": 0, "max": 900, "unit": "mu U/ml"},
            {"name": "bmi", "label": "BMI", "type": "number", "min": 10, "max": 70, "unit": "kg/m²"},
            {"name": "pedigree", "label": "Diabetes Pedigree Function", "type": "number", "min": 0, "max": 3, "unit": ""},
            {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "unit": "years"},
        ],
    },
    "kidney": {
        "label": "Chronic Kidney Disease",
        "description": "Risk of chronic kidney disease.",
        "features": [
            {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "unit": "years"},
            {"name": "blood_pressure", "label": "Blood Pressure", "type": "number", "min": 50, "max": 220, "unit": "mm Hg"},
            {"name": "specific_gravity", "label": "Urine Specific Gravity", "type": "number", "min": 1.0, "max": 1.04, "unit": ""},
            {"name": "albumin", "label": "Albumin Level", "type": "number", "min": 0, "max": 5, "unit": ""},
            {"name": "blood_glucose_random", "label": "Random Blood Glucose", "type": "number", "min": 50, "max": 500, "unit": "mg/dl"},
            {"name": "blood_urea", "label": "Blood Urea", "type": "number", "min": 5, "max": 200, "unit": "mg/dl"},
            {"name": "serum_creatinine", "label": "Serum Creatinine", "type": "number", "min": 0.1, "max": 20, "unit": "mg/dl"},
            {"name": "hemoglobin", "label": "Hemoglobin", "type": "number", "min": 3, "max": 20, "unit": "g/dl"},
            {"name": "hypertension", "label": "Hypertension", "type": "category", "options": ["yes", "no"]},
            {"name": "diabetes_mellitus", "label": "Diabetes Mellitus", "type": "category", "options": ["yes", "no"]},
        ],
    },
    "liver": {
        "label": "Liver Disease",
        "description": "Risk of chronic liver disease (ILPD-style features).",
        "features": [
            {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "unit": "years"},
            {"name": "sex", "label": "Sex", "type": "category", "options": ["male", "female"]},
            {"name": "total_bilirubin", "label": "Total Bilirubin", "type": "number", "min": 0, "max": 75, "unit": "mg/dl"},
            {"name": "direct_bilirubin", "label": "Direct Bilirubin", "type": "number", "min": 0, "max": 20, "unit": "mg/dl"},
            {"name": "alk_phosphate", "label": "Alkaline Phosphotase", "type": "number", "min": 50, "max": 2200, "unit": "IU/L"},
            {"name": "alt", "label": "ALT (SGPT)", "type": "number", "min": 5, "max": 2000, "unit": "IU/L"},
            {"name": "ast", "label": "AST (SGOT)", "type": "number", "min": 5, "max": 5000, "unit": "IU/L"},
            {"name": "total_proteins", "label": "Total Proteins", "type": "number", "min": 2, "max": 10, "unit": "g/dl"},
            {"name": "albumin", "label": "Albumin", "type": "number", "min": 0.5, "max": 6, "unit": "g/dl"},
            {"name": "ag_ratio", "label": "Albumin/Globulin Ratio", "type": "number", "min": 0.1, "max": 3, "unit": ""},
        ],
    },
    "stroke": {
        "label": "Stroke",
        "description": "Risk of stroke based on lifestyle and clinical factors.",
        "features": [
            {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "unit": "years"},
            {"name": "sex", "label": "Sex", "type": "category", "options": ["male", "female"]},
            {"name": "hypertension", "label": "Hypertension", "type": "category", "options": ["yes", "no"]},
            {"name": "heart_disease", "label": "Heart Disease", "type": "category", "options": ["yes", "no"]},
            {"name": "ever_married", "label": "Ever Married", "type": "category", "options": ["yes", "no"]},
            {"name": "work_type", "label": "Work Type", "type": "category",
             "options": ["private", "self_employed", "govt_job", "children", "never_worked"]},
            {"name": "residence_type", "label": "Residence Type", "type": "category", "options": ["urban", "rural"]},
            {"name": "avg_glucose_level", "label": "Average Glucose Level", "type": "number", "min": 50, "max": 300, "unit": "mg/dl"},
            {"name": "bmi", "label": "BMI", "type": "number", "min": 10, "max": 60, "unit": "kg/m²"},
            {"name": "smoking_status", "label": "Smoking Status", "type": "category",
             "options": ["never_smoked", "formerly_smoked", "smokes", "unknown"]},
        ],
    },
    "hypertension": {
        "label": "Hypertension",
        "description": "Risk of high blood pressure based on lifestyle and biometrics.",
        "features": [
            {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "unit": "years"},
            {"name": "sex", "label": "Sex", "type": "category", "options": ["male", "female"]},
            {"name": "bmi", "label": "BMI", "type": "number", "min": 10, "max": 60, "unit": "kg/m²"},
            {"name": "salt_intake", "label": "Daily Salt Intake", "type": "number", "min": 0, "max": 25, "unit": "g/day"},
            {"name": "exercise_hours", "label": "Exercise per Week", "type": "number", "min": 0, "max": 30, "unit": "hours"},
            {"name": "smoker", "label": "Smoker", "type": "category", "options": ["yes", "no"]},
            {"name": "alcohol_units", "label": "Alcohol Units / Week", "type": "number", "min": 0, "max": 100, "unit": ""},
            {"name": "stress_level", "label": "Stress Level (1-10)", "type": "number", "min": 1, "max": 10, "unit": ""},
            {"name": "family_history", "label": "Family History of HTN", "type": "category", "options": ["yes", "no"]},
            {"name": "sleep_hours", "label": "Sleep per Night", "type": "number", "min": 2, "max": 14, "unit": "hours"},
        ],
    },
}
