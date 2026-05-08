/**
 * Maps PDF-extracted lab keys → disease form field names + derived values.
 *
 * Two layers:
 *   1. Direct mapping (LAB_TO_FEATURE) — 1:1 lab → field
 *   2. Derived rules (DERIVED) — compute fields from labs
 *      e.g. glucose>120 → fbs="yes" on the heart form
 */

export const LAB_TO_FEATURE = {
  heart: {
    chol: 'total_cholesterol',
    trestbps: 'systolic_bp',
  },
  diabetes: {
    glucose: 'glucose',
    blood_pressure: 'diastolic_bp',
  },
  kidney: {
    serum_creatinine: 'creatinine',
    blood_urea: 'urea',
    hemoglobin: 'hemoglobin',
    blood_pressure: 'systolic_bp',
    blood_glucose_random: 'glucose',
  },
  liver: {
    total_bilirubin: 'bilirubin_total',
    alt: 'alt',
    ast: 'ast',
    alk_phosphate: 'alk_phosphate',
    albumin: 'albumin',
  },
  stroke: {
    avg_glucose_level: 'glucose',
  },
  hypertension: {
    // mostly lifestyle questions, but BP itself can hint at hypertension
  },
}

/**
 * Per-disease derivation rules. Receives the labValues, returns a partial patch.
 */
const DERIVED = {
  heart: (labs) => {
    const p = {}
    if (labs.glucose != null) p.fbs = labs.glucose > 120 ? 'yes' : 'no'
    return p
  },
  diabetes: (labs) => {
    const p = {}
    // diastolic BP backup if PDF had a combined reading
    if (labs.diastolic_bp != null) p.blood_pressure = labs.diastolic_bp
    return p
  },
  kidney: (labs) => {
    const p = {}
    // If a person has hypertension/diabetes labs, hint Yes on those toggles
    if (labs.glucose != null && labs.glucose > 140) p.diabetes_mellitus = 'yes'
    if (labs.systolic_bp != null && labs.systolic_bp >= 140) p.hypertension = 'yes'
    return p
  },
  liver: () => ({}),
  stroke: (labs) => {
    const p = {}
    if (labs.systolic_bp != null && labs.systolic_bp >= 140) p.hypertension = 'yes'
    return p
  },
  hypertension: () => ({}),
}

/**
 * Build a partial form-state patch for the chosen disease from the PDF labs.
 */
export function pdfPatchForDisease(disease, labValues) {
  const map = LAB_TO_FEATURE[disease] || {}
  const patch = {}
  for (const [feature, labKey] of Object.entries(map)) {
    if (labValues[labKey] != null) patch[feature] = labValues[labKey]
  }
  const derived = DERIVED[disease]?.(labValues) || {}
  for (const [k, v] of Object.entries(derived)) {
    if (patch[k] == null) patch[k] = v   // direct mapping wins over derived
  }
  return patch
}

/**
 * Recommend the disease with the most lab coverage.
 * Returns { disease, matchCount } or null if nothing matches.
 */
export function recommendDisease(labValues) {
  if (!labValues || Object.keys(labValues).length === 0) return null
  const scores = Object.keys(LAB_TO_FEATURE).map((d) => ({
    disease: d,
    matchCount: Object.keys(pdfPatchForDisease(d, labValues)).length,
  }))
  scores.sort((a, b) => b.matchCount - a.matchCount)
  return scores[0].matchCount > 0 ? scores[0] : null
}

/**
 * Pretty display label for a lab key — used in the PDF-summary panel.
 */
export const LAB_LABELS = {
  glucose: 'Glucose',
  hba1c: 'HbA1c',
  total_cholesterol: 'Total Cholesterol',
  hdl: 'HDL',
  ldl: 'LDL',
  triglycerides: 'Triglycerides',
  creatinine: 'Creatinine',
  urea: 'Urea',
  hemoglobin: 'Hemoglobin',
  alt: 'ALT (SGPT)',
  ast: 'AST (SGOT)',
  bilirubin_total: 'Total Bilirubin',
  alk_phosphate: 'Alkaline Phosphatase',
  albumin: 'Albumin',
  systolic_bp: 'Systolic BP',
  diastolic_bp: 'Diastolic BP',
}
