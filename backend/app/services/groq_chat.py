"""
Groq-powered health & dietitian chatbot.

The system prompt strictly limits responses to:
  - General health & wellness
  - Nutrition & dieting
  - Exercise & lifestyle
  - Disease prevention & explanations
  - Mental & sleep health

Out-of-scope requests are politely refused.
"""
from __future__ import annotations

from typing import List

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


groq_service = GroqChatService()
