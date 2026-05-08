/**
 * Maps PDF-extracted lab keys → disease form field names.
 *
 * The PDF parser (backend/app/services/pdf_parser.py) extracts a fixed set
 * of common lab values (glucose, cholesterol, creatinine, ALT, etc.).
 * Each disease form has its own field names — this dictionary connects them.
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
    // mostly lifestyle questions, no direct lab match
  },
}

/**
 * Given disease + extracted lab values, produce a partial form patch.
 * @param disease key like "heart"
 * @param labValues object from /api/reports/aggregated
 * @returns { fieldName: value, ... } subset to merge into form state
 */
export function pdfPatchForDisease(disease, labValues) {
  const map = LAB_TO_FEATURE[disease] || {}
  const patch = {}
  for (const [feature, labKey] of Object.entries(map)) {
    if (labValues[labKey] != null) {
      patch[feature] = labValues[labKey]
    }
  }
  return patch
}
