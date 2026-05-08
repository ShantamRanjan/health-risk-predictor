"""
Synthetic medically-plausible dataset generators.

Used as a fallback when real public datasets cannot be downloaded.
Each generator follows known clinical relationships so the trained models
behave reasonably (high glucose -> higher diabetes risk, etc.).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def _binary(p: np.ndarray) -> np.ndarray:
    return (RNG.random(p.shape) < p).astype(int)


def heart_synth(n: int = 4000) -> pd.DataFrame:
    age = RNG.integers(29, 78, n)
    sex = RNG.integers(0, 2, n)  # 1=male, 0=female
    cp = RNG.integers(0, 4, n)  # chest pain type 0..3
    trestbps = RNG.normal(130, 18, n).clip(90, 200).astype(int)
    chol = RNG.normal(245, 50, n).clip(120, 560).astype(int)
    fbs = (RNG.random(n) < 0.15).astype(int)
    thalach = RNG.normal(150, 23, n).clip(70, 210).astype(int)
    exang = (RNG.random(n) < 0.30).astype(int)
    oldpeak = RNG.gamma(1.5, 0.7, n).clip(0, 6.5)
    smoker = (RNG.random(n) < 0.32).astype(int)

    logit = (
        -7.5
        + 0.045 * (age - 50)
        + 0.6 * sex
        + 0.5 * cp
        + 0.022 * (trestbps - 120)
        + 0.005 * (chol - 200)
        + 0.4 * fbs
        - 0.025 * (thalach - 150)
        + 1.1 * exang
        + 0.7 * oldpeak
        + 0.6 * smoker
    )
    target = _binary(_sigmoid(logit))
    return pd.DataFrame({
        "age": age, "sex": sex, "cp": cp, "trestbps": trestbps, "chol": chol,
        "fbs": fbs, "thalach": thalach, "exang": exang, "oldpeak": oldpeak,
        "smoker": smoker, "target": target,
    })


def diabetes_synth(n: int = 4000) -> pd.DataFrame:
    pregnancies = RNG.poisson(3, n).clip(0, 17)
    glucose = RNG.normal(120, 32, n).clip(40, 250).astype(int)
    blood_pressure = RNG.normal(72, 12, n).clip(30, 130).astype(int)
    skin_thickness = RNG.normal(20, 16, n).clip(0, 99).astype(int)
    insulin = RNG.gamma(2.0, 60, n).clip(0, 850).astype(int)
    bmi = RNG.normal(31, 7, n).clip(15, 60)
    pedigree = RNG.gamma(1.4, 0.4, n).clip(0.05, 2.5)
    age = RNG.integers(21, 81, n)

    logit = (
        -7.0
        + 0.035 * (glucose - 100)
        + 0.07 * (bmi - 25)
        + 0.04 * (age - 30)
        + 0.9 * pedigree
        + 0.02 * pregnancies
        + 0.015 * (blood_pressure - 70)
    )
    target = _binary(_sigmoid(logit))
    return pd.DataFrame({
        "pregnancies": pregnancies, "glucose": glucose, "blood_pressure": blood_pressure,
        "skin_thickness": skin_thickness, "insulin": insulin, "bmi": bmi,
        "pedigree": pedigree, "age": age, "target": target,
    })


def kidney_synth(n: int = 4000) -> pd.DataFrame:
    age = RNG.integers(2, 90, n)
    blood_pressure = RNG.normal(80, 15, n).clip(50, 200).astype(int)
    specific_gravity = RNG.choice([1.005, 1.010, 1.015, 1.020, 1.025], n)
    albumin = RNG.choice([0, 1, 2, 3, 4, 5], n, p=[0.55, 0.15, 0.1, 0.1, 0.06, 0.04])
    blood_glucose_random = RNG.normal(140, 60, n).clip(60, 490).astype(int)
    blood_urea = RNG.gamma(2.0, 25, n).clip(5, 200).astype(int)
    serum_creatinine = RNG.gamma(2.0, 0.7, n).clip(0.4, 18)
    hemoglobin = RNG.normal(13.5, 2.5, n).clip(4, 18)
    hypertension = (RNG.random(n) < 0.30).astype(int)
    diabetes_mellitus = (RNG.random(n) < 0.25).astype(int)

    logit = (
        -2.5
        + 0.9 * albumin
        + 0.6 * serum_creatinine
        + 0.015 * blood_urea
        - 0.35 * (hemoglobin - 13)
        + 0.9 * hypertension
        + 0.8 * diabetes_mellitus
        + 0.01 * (age - 40)
        - 50 * (specific_gravity - 1.020)
    )
    target = _binary(_sigmoid(logit))
    return pd.DataFrame({
        "age": age, "blood_pressure": blood_pressure, "specific_gravity": specific_gravity,
        "albumin": albumin, "blood_glucose_random": blood_glucose_random,
        "blood_urea": blood_urea, "serum_creatinine": serum_creatinine,
        "hemoglobin": hemoglobin, "hypertension": hypertension,
        "diabetes_mellitus": diabetes_mellitus, "target": target,
    })


def liver_synth(n: int = 4000) -> pd.DataFrame:
    age = RNG.integers(4, 90, n)
    sex = RNG.integers(0, 2, n)
    total_bilirubin = RNG.gamma(2.0, 1.0, n).clip(0.1, 70)
    direct_bilirubin = (total_bilirubin * RNG.uniform(0.2, 0.5, n)).clip(0.05, 19)
    alk_phosphate = RNG.gamma(2.0, 100, n).clip(60, 2100).astype(int)
    alt = RNG.gamma(1.6, 40, n).clip(5, 1900).astype(int)
    ast = RNG.gamma(1.6, 50, n).clip(5, 4900).astype(int)
    total_proteins = RNG.normal(6.5, 1.0, n).clip(2.5, 9.5)
    albumin = RNG.normal(3.2, 0.8, n).clip(0.8, 5.5)
    ag_ratio = (albumin / (total_proteins - albumin + 1e-3)).clip(0.2, 2.5)

    logit = (
        -3.0
        + 0.10 * total_bilirubin
        + 0.20 * direct_bilirubin
        + 0.002 * alk_phosphate
        + 0.004 * alt
        + 0.003 * ast
        - 0.50 * albumin
        - 0.20 * ag_ratio
        + 0.012 * (age - 35)
        + 0.20 * sex
    )
    target = _binary(_sigmoid(logit))
    return pd.DataFrame({
        "age": age, "sex": sex, "total_bilirubin": total_bilirubin,
        "direct_bilirubin": direct_bilirubin, "alk_phosphate": alk_phosphate,
        "alt": alt, "ast": ast, "total_proteins": total_proteins,
        "albumin": albumin, "ag_ratio": ag_ratio, "target": target,
    })


def stroke_synth(n: int = 4000) -> pd.DataFrame:
    age = RNG.integers(1, 90, n)
    sex = RNG.integers(0, 2, n)
    hypertension = (RNG.random(n) < 0.10).astype(int)
    heart_disease = (RNG.random(n) < 0.06).astype(int)
    ever_married = (RNG.random(n) < 0.65).astype(int)
    work_type = RNG.choice([0, 1, 2, 3, 4], n, p=[0.55, 0.18, 0.13, 0.12, 0.02])
    residence_type = RNG.integers(0, 2, n)  # 1=urban
    avg_glucose_level = RNG.normal(106, 45, n).clip(55, 290)
    bmi = RNG.normal(28, 7, n).clip(12, 55)
    smoking_status = RNG.choice([0, 1, 2, 3], n, p=[0.45, 0.20, 0.20, 0.15])

    logit = (
        -8.0
        + 0.060 * age
        + 1.4 * hypertension
        + 1.5 * heart_disease
        + 0.005 * (avg_glucose_level - 100)
        + 0.020 * (bmi - 25)
        + 0.5 * (smoking_status == 2).astype(int)
        + 0.25 * (smoking_status == 1).astype(int)
        + 0.1 * sex
    )
    target = _binary(_sigmoid(logit))
    return pd.DataFrame({
        "age": age, "sex": sex, "hypertension": hypertension,
        "heart_disease": heart_disease, "ever_married": ever_married,
        "work_type": work_type, "residence_type": residence_type,
        "avg_glucose_level": avg_glucose_level, "bmi": bmi,
        "smoking_status": smoking_status, "target": target,
    })


def hypertension_synth(n: int = 4000) -> pd.DataFrame:
    age = RNG.integers(18, 90, n)
    sex = RNG.integers(0, 2, n)
    bmi = RNG.normal(27, 5, n).clip(14, 55)
    salt_intake = RNG.gamma(2.0, 3.0, n).clip(0.5, 22)
    exercise_hours = RNG.gamma(1.5, 1.5, n).clip(0, 25)
    smoker = (RNG.random(n) < 0.27).astype(int)
    alcohol_units = RNG.gamma(1.8, 4, n).clip(0, 80)
    stress_level = RNG.integers(1, 11, n)
    family_history = (RNG.random(n) < 0.30).astype(int)
    sleep_hours = RNG.normal(7, 1.4, n).clip(3, 12)

    logit = (
        -5.5
        + 0.05 * (age - 30)
        + 0.10 * (bmi - 24)
        + 0.18 * salt_intake
        - 0.18 * exercise_hours
        + 0.6 * smoker
        + 0.04 * alcohol_units
        + 0.18 * stress_level
        + 0.7 * family_history
        - 0.20 * (sleep_hours - 7)
        + 0.15 * sex
    )
    target = _binary(_sigmoid(logit))
    return pd.DataFrame({
        "age": age, "sex": sex, "bmi": bmi, "salt_intake": salt_intake,
        "exercise_hours": exercise_hours, "smoker": smoker,
        "alcohol_units": alcohol_units, "stress_level": stress_level,
        "family_history": family_history, "sleep_hours": sleep_hours,
        "target": target,
    })


GENERATORS = {
    "heart": heart_synth,
    "diabetes": diabetes_synth,
    "kidney": kidney_synth,
    "liver": liver_synth,
    "stroke": stroke_synth,
    "hypertension": hypertension_synth,
}
