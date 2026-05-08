/**
 * Helpers for the user profile: BMI calculation, BMI categorisation,
 * and mapping profile fields to disease prediction form fields.
 */

export function computeBmi(heightCm, weightKg) {
  const h = parseFloat(heightCm)
  const w = parseFloat(weightKg)
  if (!h || !w || h < 30 || w < 2) return null
  const m = h / 100
  return w / (m * m)
}

export function bmiCategory(bmi) {
  if (bmi < 18.5) return {
    label: 'Underweight',
    dot: 'inline-block w-2.5 h-2.5 rounded-full bg-amber-400',
    description: 'A BMI below 18.5 may suggest insufficient body mass — consider a clinical review of nutrition and underlying causes.',
  }
  if (bmi < 25) return {
    label: 'Normal',
    dot: 'inline-block w-2.5 h-2.5 rounded-full bg-mint-500',
    description: 'A BMI in the 18.5–24.9 range is associated with the lowest cardiometabolic risk for most adults.',
  }
  if (bmi < 30) return {
    label: 'Overweight',
    dot: 'inline-block w-2.5 h-2.5 rounded-full bg-amber-500',
    description: 'BMI 25–29.9 — losing 5–10% of body weight is associated with measurable improvements in BP, glucose, and lipids.',
  }
  return {
    label: 'Obese',
    dot: 'inline-block w-2.5 h-2.5 rounded-full bg-red-500',
    description: 'BMI ≥ 30 — strongly linked to type-2 diabetes, hypertension, fatty liver and cardiovascular disease. Sustained 5–10% weight loss yields major risk reductions.',
  }
}

/**
 * Build a profile-driven patch for the chosen disease form.
 * Returns { age?, sex?, bmi? } where applicable.
 */
export function profilePatchForDisease(user, disease) {
  if (!user) return {}
  const out = {}

  // Age — common across most forms
  if (user.age != null && user.age !== '') {
    if (['heart','diabetes','kidney','liver','stroke','hypertension'].includes(disease)) {
      out.age = user.age
    }
  }

  // Sex — encoded as "male"/"female" on the forms that ask for it
  if (user.sex && ['male','female'].includes(user.sex)) {
    if (['heart','liver','stroke','hypertension'].includes(disease)) {
      out.sex = user.sex
    }
  }

  // BMI — derived from height + weight
  const bmi = computeBmi(user.height_cm, user.weight_kg)
  if (bmi != null) {
    const rounded = Math.round(bmi * 10) / 10
    if (['diabetes','stroke','hypertension'].includes(disease)) {
      out.bmi = rounded
    }
  }

  return out
}
