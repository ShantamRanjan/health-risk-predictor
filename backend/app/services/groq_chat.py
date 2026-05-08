"""
Groq-powered services:
  1. Health & dietitian chatbot (scope-restricted)
  2. Structured lab-value extractor for uploaded PDFs

Out-of-scope chatbot requests are politely refused.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from groq import Groq

from app.core.config import settings

SYSTEM_PROMPT = """You are MedAdvisor, an AI dietitian and health-coach assistant.

YOUR SCOPE — strictly health-related topics only:
- Nutrition, diets (Mediterranean, DASH, keto, vegan, low-FODMAP, diabetic, etc.)
- Meal planning, recipes, calorie/macro guidance
- Fitness, exercise programming, recovery
- Sleep hygiene & stress management
- General disease information (causes, symptoms, prevention, lifestyle management)
- Explaining medical lab values in plain language
- Helping users interpret AI risk-prediction results from this app

REFUSAL POLICY — politely refuse and redirect when asked about:
- Programming / coding / homework / unrelated trivia
- Politics, finance, entertainment, celebrities
- Anything outside health, nutrition, fitness, and wellness

If asked off-topic, reply briefly:
  "I'm a health & nutrition assistant — I can only help with diet, fitness, and medical-wellness topics. Is there a health question I can help with instead?"

CLINICAL SAFETY:
- You are NOT a doctor and you must say so when users ask for diagnosis, prescriptions, or dosage.
- Always recommend professional medical consultation for serious symptoms.
- Never recommend stopping prescribed medication.
- For emergency symptoms (chest pain, stroke signs, suicidal ideation), tell the user to call emergency services immediately.

STYLE:
- Warm, evidence-based, non-judgmental.
- Use bullet points and short paragraphs.
- Cite general guidelines when helpful (e.g. "WHO recommends 150 min/week of moderate exercise").
- Keep responses focused — avoid overwhelming users with information.
"""


# ----------------------------------------------------------------------
# Lab-value extraction
# ----------------------------------------------------------------------
EXTRACTION_SYSTEM = (
    "You are a medical-data extraction engine. You read raw lab-report text and "
    "return ONLY a JSON object with the requested numeric values. "
    "Never explain, never add commentary, never use markdown — only valid JSON."
)

EXTRACTION_USER_TEMPLATE = """Extract the most recent value of each lab parameter below from the report text.
- Use ONLY numeric values (no units, no commas, no ranges)
- Use null if not present
- For glucose, prefer fasting; otherwise random/post-prandial
- For systolic_bp/diastolic_bp, parse from "120/80" style readings
- Return EXACTLY this JSON shape, no extra keys:

{{
  "glucose": number|null,
  "hba1c": number|null,
  "total_cholesterol": number|null,
  "hdl": number|null,
  "ldl": number|null,
  "triglycerides": number|null,
  "creatinine": number|null,
  "urea": number|null,
  "hemoglobin": number|null,
  "alt": number|null,
  "ast": number|null,
  "bilirubin_total": number|null,
  "alk_phosphate": number|null,
  "albumin": number|null,
  "systolic_bp": number|null,
  "diastolic_bp": number|null
}}

Report text:
---
{text}
---

Return only the JSON object."""


class GroqChatService:
    def __init__(self):
        self._client: Groq | None = None

    @property
    def client(self) -> Groq:
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError(
                    "GROQ_API_KEY is not configured. Add it to your .env file."
                )
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def chat(self, user_message: str, history: List[dict]) -> str:
        """
        history: list of {"role": "user"|"assistant", "content": str}, oldest first.
        """
        # Keep last 12 turns to bound context
        trimmed = history[-12:] if len(history) > 12 else history
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for turn in trimmed:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})

        completion = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=900,
        )
        return completion.choices[0].message.content or ""

    # ------------------------------------------------------------------
    # Structured extraction
    # ------------------------------------------------------------------
    def extract_lab_values(self, report_text: str) -> Dict[str, float]:
        """
        Send the raw PDF text to Groq and ask it to return a JSON object
        of normalised lab values. Robust to nearly any report layout.
        Returns {} on any failure (caller can fall back to regex).
        """
        text = (report_text or "").strip()
        if len(text) < 10:
            return {}
        # Cap input — most lab reports < 8K chars; stays under model context
        text = text[:8000]

        messages = [
            {"role": "system", "content": EXTRACTION_SYSTEM},
            {"role": "user", "content": EXTRACTION_USER_TEMPLATE.format(text=text)},
        ]

        try:
            # Try JSON-mode first (supported by most current Groq models)
            try:
                completion = self.client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=messages,
                    temperature=0.0,
                    max_tokens=500,
                    response_format={"type": "json_object"},
                )
            except Exception:
                # Fallback if the model doesn't support response_format
                completion = self.client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=messages,
                    temperature=0.0,
                    max_tokens=500,
                )

            raw = completion.choices[0].message.content or "{}"
            # Pull the first {...} block in case the model wrapped it
            match = re.search(r"\{[\s\S]*\}", raw)
            if not match:
                return {}
            data = json.loads(match.group(0))
        except (json.JSONDecodeError, RuntimeError, Exception):
            return {}

        # Filter to numeric values only
        out: Dict[str, float] = {}
        for k, v in data.items():
            if v is None:
                continue
            try:
                out[k] = float(v)
            except (TypeError, ValueError):
                continue
        return out


groq_service = GroqChatService()
