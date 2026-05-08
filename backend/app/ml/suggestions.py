"""
Rule-based lifestyle / clinical suggestions per disease.

Combines deterministic rules (e.g. BMI > 30 -> weight loss) with the top
SHAP contributors so the advice is tied to what actually drove the score.
"""
from __future__ import annotations

from typing import Any, Dict, List


def _num(d: Dict[str, Any], k: str, default=0.0) -> float:
    try:
        return float(d.get(k, default))
    except (TypeError, ValueError):
        return float(default)


def build_suggestions(
    disease: str,
    raw: Dict[str, Any],
    contributions: List[Dict[str, Any]],
) -> List[str]:
    tips: List[str] = []

    # ----- Generic lifestyle tips driven by inputs -----
    bmi = _num(raw, "bmi")
    if bmi:
        if bmi >= 30:
            tips.append("Your BMI indicates obesity — losing 5–10% body weight reduces nearly every cardiometabolic risk.")
        elif bmi >= 25:
            tips.append("Your BMI is in the overweight range — aim for a sustainable 250–500 kcal/day deficit with strength training.")

    if str(raw.get("smoker", "")).lower() in ("yes", "1", "true"):
        tips.append("Quitting smoking is the single highest-impact change you can make for both heart and lung health.")
    if str(raw.get("smoking_status", "")).lower() == "smokes":
        tips.append("Stopping smoking measurably lowers stroke risk within 2–5 years of cessation.")

    # ----- Disease-specific guidance -----
    if disease == "heart":
        if _num(raw, "chol") >= 240:
            tips.append("Cholesterol > 240 mg/dl — discuss lipid management; consider a Mediterranean-style diet rich in olive oil, nuts, and fatty fish.")
        if _num(raw, "trestbps") >= 140:
            tips.append("Resting BP is elevated — reduce sodium below 2,300 mg/day and add 150 min/week of moderate aerobic exercise.")
        if str(raw.get("exang", "")).lower() == "yes":
            tips.append("Exercise-induced angina warrants a cardiology consult before increasing exertion.")

    elif disease == "diabetes":
        if _num(raw, "glucose") >= 140:
            tips.append("Glucose level suggests possible impaired tolerance — request an HbA1c test to confirm.")
        if _num(raw, "bmi") >= 27:
            tips.append("Even 5% weight loss can cut new-onset diabetes risk by ~58% (DPP trial).")
        tips.append("Replace refined carbs with high-fibre whole grains, legumes, and non-starchy vegetables.")

    elif disease == "kidney":
        if _num(raw, "serum_creatinine") >= 1.5:
            tips.append("Elevated creatinine — book a nephrology review and avoid NSAIDs without medical advice.")
        if str(raw.get("hypertension", "")).lower() == "yes":
            tips.append("Strict BP control (<130/80) is the most effective way to slow kidney disease progression.")
        tips.append("Stay well hydrated and limit processed foods to control phosphorus and sodium load.")

    elif disease == "liver":
        if _num(raw, "alt") > 56 or _num(raw, "ast") > 40:
            tips.append("Liver enzymes are elevated — repeat in 4–6 weeks and review alcohol intake & medications.")
        if _num(raw, "total_bilirubin") > 1.2:
            tips.append("Bilirubin is above normal — get a clinical workup including viral hepatitis screening.")
        tips.append("A Mediterranean diet with reduced fructose and alcohol can reverse early fatty liver disease.")

    elif disease == "stroke":
        if _num(raw, "avg_glucose_level") >= 140:
            tips.append("Average glucose is high — tight glycemic control significantly cuts stroke risk.")
        if str(raw.get("hypertension", "")).lower() == "yes":
            tips.append("Hypertension is the #1 modifiable stroke risk factor — target <130/80 mm Hg.")
        tips.append("Aim for 150 min/week of brisk walking and a DASH-style diet (low sodium, rich in produce).")

    elif disease == "hypertension":
        if _num(raw, "salt_intake") > 6:
            tips.append("Daily salt intake is high — DASH guidelines recommend < 5–6 g/day.")
        if _num(raw, "exercise_hours") < 2.5:
            tips.append("Less than 150 min/week of exercise — even brisk 30-min walks five times a week reduce systolic BP by ~5–8 mm Hg.")
        if _num(raw, "stress_level") >= 7:
            tips.append("High self-reported stress — daily mindfulness or breathing practice can reduce BP.")
        if _num(raw, "alcohol_units") > 14:
            tips.append("Alcohol > 14 units/week is strongly linked to hypertension — reducing intake yields rapid BP improvement.")
        if _num(raw, "sleep_hours") < 6:
            tips.append("Short sleep increases sympathetic tone — aim for 7–9 hours nightly.")

    # Append a contextual note from the strongest SHAP contributor
    if contributions:
        top = contributions[0]
        direction = "raised" if top["shap_value"] > 0 else "lowered"
        tips.append(
            f"The factor that most {direction} your predicted risk was '{top['feature']}' (your value: {top['value']})."
        )

    # Always finish with safety disclaimer
    tips.append("This tool is for informational purposes only — please consult a qualified clinician before changing treatment.")
    return tips
