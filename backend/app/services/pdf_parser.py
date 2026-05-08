"""
Parse uploaded health report PDFs.

Strategy: extract raw text via pdfplumber, then use a library of regex
patterns to pull common lab values (glucose, cholesterol, creatinine, ...).

Returned values are best-effort hints — the user can still edit them in
the UI before running a prediction.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict

import pdfplumber

# (lab_name, regex with a `value` named group, optional unit hint)
PATTERNS: list[tuple[str, str]] = [
    ("glucose",            r"(?:fasting\s+)?(?:plasma\s+|blood\s+)?glucose[^0-9]{0,40}(?P<value>\d{2,3}(?:\.\d+)?)"),
    ("hba1c",              r"hba1c[^0-9]{0,20}(?P<value>\d{1,2}\.\d+)"),
    ("total_cholesterol",  r"(?:total\s+)?cholesterol[^0-9]{0,30}(?P<value>\d{2,3}(?:\.\d+)?)"),
    ("hdl",                r"hdl(?:\s*-?\s*c)?[^0-9]{0,30}(?P<value>\d{2,3}(?:\.\d+)?)"),
    ("ldl",                r"ldl(?:\s*-?\s*c)?[^0-9]{0,30}(?P<value>\d{2,3}(?:\.\d+)?)"),
    ("triglycerides",      r"triglycerides?[^0-9]{0,30}(?P<value>\d{2,4}(?:\.\d+)?)"),
    ("creatinine",         r"creatinine[^0-9]{0,30}(?P<value>\d{1,2}\.\d+)"),
    ("urea",               r"(?:blood\s+)?urea[^0-9]{0,30}(?P<value>\d{1,3}(?:\.\d+)?)"),
    ("hemoglobin",         r"h(?:a)?emoglobin[^0-9]{0,30}(?P<value>\d{1,2}\.\d+)"),
    ("alt",                r"\b(?:alt|sgpt)\b[^0-9]{0,30}(?P<value>\d{1,4})"),
    ("ast",                r"\b(?:ast|sgot)\b[^0-9]{0,30}(?P<value>\d{1,4})"),
    ("bilirubin_total",    r"(?:total\s+)?bilirubin[^0-9]{0,30}(?P<value>\d{1,2}\.\d+)"),
    ("alk_phosphate",      r"(?:alkaline\s+phosphatase|alk\.?\s*phos)[^0-9]{0,30}(?P<value>\d{2,4})"),
    ("albumin",            r"\balbumin\b[^0-9]{0,30}(?P<value>\d{1,2}\.\d+)"),
    ("systolic_bp",        r"(?:systolic|sbp)[^0-9]{0,20}(?P<value>\d{2,3})"),
    ("diastolic_bp",       r"(?:diastolic|dbp)[^0-9]{0,20}(?P<value>\d{2,3})"),
]


def extract_text(path: str | Path) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            text_parts.append(t)
    return "\n".join(text_parts)


def extract_lab_values(text: str) -> Dict[str, Any]:
    """Return best-guess numeric lab values from raw text."""
    found: Dict[str, Any] = {}
    lower = text.lower()
    for name, pattern in PATTERNS:
        m = re.search(pattern, lower)
        if m:
            try:
                found[name] = float(m.group("value"))
            except (ValueError, IndexError):
                continue
    return found


def parse_pdf(path: str | Path) -> Dict[str, Any]:
    """
    Two-stage extraction:
      1. Ask Groq to pull structured values (handles any layout).
      2. Run regex over the same text and fill any keys the LLM missed.
    Result: maximum recall across diverse report formats.
    """
    text = extract_text(path)
    return {
        "text": text,
        "values": extract_all(text),
    }


def extract_all(text: str) -> Dict[str, Any]:
    """Combine LLM + regex extraction. LLM wins on conflicts."""
    # Lazy import to avoid a hard dependency loop / failure if Groq isn't configured
    try:
        from app.services.groq_chat import groq_service
        llm_values = groq_service.extract_lab_values(text)
    except Exception:
        llm_values = {}

    regex_values = extract_lab_values(text)

    merged: Dict[str, Any] = {}
    merged.update(regex_values)   # baseline
    merged.update(llm_values)     # LLM overrides regex when both have a key
    return merged
