"""
Generate doctor-style PDF reports from a Prediction record.
"""
from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _risk_color(level: str) -> colors.Color:
    return {
        "low": colors.HexColor("#22c55e"),
        "moderate": colors.HexColor("#f59e0b"),
        "high": colors.HexColor("#ef4444"),
    }.get(level, colors.grey)


def build_report_pdf(
    *,
    user_email: str,
    user_full_name: str | None,
    disease_label: str,
    risk_score: float,
    risk_level: str,
    inputs: Dict[str, Any],
    explanation: List[Dict[str, Any]],
    suggestions: List[str],
) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title=f"Health Risk Report — {disease_label}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], fontSize=20, spaceAfter=8, textColor=colors.HexColor("#0f172a"))
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, spaceBefore=14, spaceAfter=6, textColor=colors.HexColor("#1e293b"))
    body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=10, leading=14, alignment=TA_LEFT)
    muted = ParagraphStyle("muted", parent=body, textColor=colors.HexColor("#64748b"))

    story = []
    story.append(Paragraph("Health Risk Assessment Report", title_style))
    story.append(Paragraph(
        f"Patient: <b>{user_full_name or user_email}</b> &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        muted,
    ))

    # Risk summary box
    story.append(Spacer(1, 0.4 * cm))
    risk_table = Table(
        [[
            Paragraph(f"<b>{disease_label}</b>", body),
            Paragraph(f"Risk Score: <b>{risk_score * 100:.1f}%</b>", body),
            Paragraph(f"Level: <b>{risk_level.upper()}</b>", body),
        ]],
        colWidths=[6 * cm, 5 * cm, 5 * cm],
    )
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (2, 0), (2, 0), _risk_color(risk_level)),
        ("TEXTCOLOR", (2, 0), (2, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(risk_table)

    # Inputs
    story.append(Paragraph("Patient Inputs", h2))
    rows = [["Field", "Value"]] + [[str(k), str(v)] for k, v in inputs.items()]
    inputs_table = Table(rows, colWidths=[8 * cm, 8 * cm])
    inputs_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(inputs_table)

    # Explanation
    story.append(Paragraph("Explainable AI — Top Contributing Factors", h2))
    exp_rows = [["Feature", "Your Value", "Impact on Risk"]]
    for c in explanation[:8]:
        impact = "↑ raised" if c["shap_value"] > 0 else "↓ lowered"
        exp_rows.append([
            str(c["feature"]),
            str(c["value"]),
            f"{impact} ({c['shap_value']:+.3f})",
        ])
    exp_table = Table(exp_rows, colWidths=[6 * cm, 5 * cm, 5 * cm])
    exp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(exp_table)

    # Suggestions
    story.append(Paragraph("Personalised Recommendations", h2))
    for tip in suggestions:
        story.append(Paragraph(f"• {tip}", body))

    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "Disclaimer: This report is AI-generated and intended for informational use only. "
        "It is not a substitute for professional medical advice, diagnosis, or treatment.",
        muted,
    ))

    doc.build(story)
    return buf.getvalue()
