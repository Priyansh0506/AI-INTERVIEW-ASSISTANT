from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import FrameBreak
import io
from datetime import datetime


def safe(val, default="N/A"):
    if val is None:
        return default
    return str(val)


def score_color(score):
    try:
        s = float(score)
        if s >= 8:
            return colors.HexColor("#4A7C59")
        if s >= 5:
            return colors.HexColor("#B5894A")
        return colors.HexColor("#A0524A")
    except:
        return colors.HexColor("#A0524A")


def generate_pdf(data) -> bytes:
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=(595, 842),  # A4
        topMargin=48,
        bottomMargin=48,
        leftMargin=52,
        rightMargin=52,
    )

    # ── Palette ──
    C_BG        = colors.HexColor("#FAFAF8")
    C_DARK      = colors.HexColor("#1C1C1E")
    C_MID       = colors.HexColor("#6B6560")
    C_MUTED     = colors.HexColor("#B0AAA4")
    C_BORDER    = colors.HexColor("#E8E4DE")
    C_ACCENT    = colors.HexColor("#D97757")
    C_CARD      = colors.HexColor("#F4F1EE")
    C_GOOD      = colors.HexColor("#4A7C59")
    C_WARN      = colors.HexColor("#B5894A")
    C_DANGER    = colors.HexColor("#A0524A")

    styles = getSampleStyleSheet()
    W = 491  # usable width (595 - 52 - 52)

    # ── Styles ──
    def style(name, **kw):
        base = kw.pop("parent", styles["Normal"])
        return ParagraphStyle(name, parent=base, **kw)

    title_s = style("Title",
        fontSize=22, textColor=C_DARK,
        alignment=TA_CENTER, spaceAfter=4, fontName="Helvetica-Bold",
        leading=28,
    )
    subtitle_s = style("Sub",
        fontSize=10.5, textColor=C_MID,
        alignment=TA_CENTER, spaceAfter=0,
    )
    date_s = style("Date",
        fontSize=9, textColor=C_MUTED,
        alignment=TA_CENTER, spaceBefore=3,
    )
    label_s = style("Label",
        fontSize=8, textColor=C_MUTED,
        alignment=TA_CENTER, fontName="Helvetica",
        leading=12, spaceAfter=3,
    )
    stat_s = style("Stat",
        fontSize=18, textColor=C_DARK,
        alignment=TA_CENTER, fontName="Helvetica-Bold",
        leading=24,
    )
    section_s = style("Section",
        fontSize=9, textColor=C_ACCENT,
        fontName="Helvetica-Bold", spaceBefore=20, spaceAfter=6,
        leading=12,
    )
    body_s = style("Body",
        fontSize=10, textColor=C_DARK,
        leading=16, spaceAfter=4,
    )
    body_muted_s = style("BodyMuted",
        fontSize=9.5, textColor=C_MID,
        leading=15, spaceAfter=4,
    )
    kw_s = style("KW",
        fontSize=9, textColor=C_ACCENT,
        leading=14,
    )
    footer_s = style("Footer",
        fontSize=8.5, textColor=C_MUTED,
        alignment=TA_CENTER,
    )
    verdict_s = style("Verdict",
        fontSize=10, textColor=C_MID,
        leading=15, alignment=TA_CENTER,
    )

    story = []

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # HEADER
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 6))
    story.append(Paragraph("Interview Performance Report", title_s))

    role       = safe(data.get("role"), "Unknown Role")
    difficulty = safe(data.get("difficulty"), "")
    level_txt  = f"{role}  ·  {difficulty} Level" if difficulty and difficulty != "N/A" else role
    story.append(Paragraph(level_txt, subtitle_s))

    today = datetime.now().strftime("%d %B %Y")
    story.append(Paragraph(today, date_s))
    story.append(Spacer(1, 18))
    story.append(HRFlowable(width="100%", color=C_BORDER, thickness=1))
    story.append(Spacer(1, 20))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # SCORE OVERVIEW — 3 cards
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    score       = data.get("final_score", data.get("score", 0)) or 0
    integrity   = data.get("integrity_score", 0) or 0
    eye_contact = data.get("eye_contact_score", 0) or 0

    try:
        score_f = float(score)
    except:
        score_f = 0

    s_color = score_color(score_f)

    score_label_row = [
        Paragraph("SCORE",       label_s),
        Paragraph("INTEGRITY",   label_s),
        Paragraph("EYE CONTACT", label_s),
    ]

    score_val_style = ParagraphStyle("ScoreVal",
        parent=styles["Normal"],
        fontSize=20, fontName="Helvetica-Bold",
        alignment=TA_CENTER, leading=26,
        textColor=s_color,
    )
    other_val_style = ParagraphStyle("OtherVal",
        parent=styles["Normal"],
        fontSize=18, fontName="Helvetica-Bold",
        alignment=TA_CENTER, leading=24,
        textColor=C_DARK,
    )

    score_val_row = [
        Paragraph(f"{score}/10",      score_val_style),
        Paragraph(f"{integrity}%",    other_val_style),
        Paragraph(f"{eye_contact}%",  other_val_style),
    ]

    # verdict
    if score_f >= 8:
        verdict = "Excellent performance. You are well prepared."
    elif score_f >= 5:
        verdict = "Good effort. A few refinements will take you far."
    else:
        verdict = "Keep practicing. Every session makes you stronger."

    col_w = W / 3

    cards = Table(
        [score_label_row, score_val_row],
        colWidths=[col_w, col_w, col_w],
    )
    cards.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_CARD),
        ("BOX",           (0, 0), (-1, -1), 1,   C_BORDER),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, C_BORDER),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [4]),
    ]))

    story.append(KeepTogether([cards]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(verdict, verdict_s))
    story.append(Spacer(1, 22))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FEEDBACK SECTION
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    feedback    = safe(data.get("feedback"),  "No feedback available.")
    strong      = safe(data.get("good"),      "N/A")
    improvement = safe(data.get("improve"),   "N/A")

    def section_block(label, text, accent_hex):
        accent_c = colors.HexColor(accent_hex)
        label_p = Paragraph(label.upper(), ParagraphStyle(
            f"SL_{label}", parent=styles["Normal"],
            fontSize=8, fontName="Helvetica-Bold",
            textColor=accent_c, leading=12, spaceAfter=5,
        ))
        text_p = Paragraph(text, body_s)

        inner = Table(
            [[label_p], [text_p]],
            colWidths=[W - 28],
        )
        inner.setStyle(TableStyle([
            ("TOPPADDING",    (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ]))

        outer = Table(
            [[inner]],
            colWidths=[W],
        )
        outer.setStyle(TableStyle([
            ("LEFTPADDING",   (0, 0), (0, 0), 16),
            ("RIGHTPADDING",  (0, 0), (0, 0), 12),
            ("TOPPADDING",    (0, 0), (0, 0), 12),
            ("BOTTOMPADDING", (0, 0), (0, 0), 12),
            ("BACKGROUND",    (0, 0), (0, 0), C_CARD),
            ("BOX",           (0, 0), (0, 0), 1, C_BORDER),
            ("LINEBEFORE",    (0, 0), (0, 0), 3, accent_c),
        ]))
        return outer

    story.append(Paragraph("FEEDBACK", section_s))
    story.append(section_block("Feedback", feedback, "#8A9EC8"))
    story.append(Spacer(1, 8))
    story.append(section_block("Strong Point", strong, "#4A7C59"))
    story.append(Spacer(1, 8))
    story.append(section_block("Areas for Improvement", improvement, "#B5894A"))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # NLP ANALYSIS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    nlp_score     = data.get("nlp_score")
    similarity    = data.get("similarity")
    keyword_match = data.get("keyword_match")

    if nlp_score is not None:
        story.append(Spacer(1, 10))
        story.append(Paragraph("NLP ANALYSIS", section_s))

        def nlp_color(val, max_val=1):
            try:
                ratio = float(val) / float(max_val)
                if ratio >= 0.7: return C_GOOD
                if ratio >= 0.4: return C_WARN
                return C_DANGER
            except:
                return C_MUTED

        nlp_rows = [
            ["NLP Score",     f"{safe(nlp_score, '0')}/10",              nlp_color(nlp_score, 10)],
            ["Similarity",    f"{round((similarity or 0) * 100)}%",      nlp_color(similarity)],
            ["Keyword Match", f"{round((keyword_match or 0) * 100)}%",   nlp_color(keyword_match)],
        ]

        nlp_table_data = []
        for row_label, row_val, row_color in nlp_rows:
            val_style = ParagraphStyle(f"NV_{row_label}",
                parent=styles["Normal"],
                fontSize=10.5, fontName="Helvetica-Bold",
                textColor=row_color, alignment=TA_RIGHT, leading=16,
            )
            nlp_table_data.append([
                Paragraph(row_label, body_muted_s),
                Paragraph(row_val, val_style),
            ])

        nlp_tbl = Table(nlp_table_data, colWidths=[W * 0.65, W * 0.35])
        nlp_tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), C_CARD),
            ("BOX",           (0, 0), (-1, -1), 1, C_BORDER),
            ("LINEBELOW",     (0, 0), (-1, -2), 0.5, C_BORDER),
            ("TOPPADDING",    (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(nlp_tbl)

        nlp_feedback = data.get("nlp_feedback")
        if nlp_feedback:
            story.append(Spacer(1, 8))
            story.append(Paragraph(safe(nlp_feedback), body_muted_s))

        matched_keywords = data.get("matched_keywords")
        if matched_keywords and len(matched_keywords) > 0:
            story.append(Spacer(1, 8))
            kw_text = "  ·  ".join(matched_keywords)
            story.append(Paragraph(
                f'<font color="#9B9590">Matched keywords: </font>'
                f'<font color="#D97757">{kw_text}</font>',
                kw_s,
            ))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FOOTER
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 28))
    story.append(HRFlowable(width="100%", color=C_BORDER, thickness=0.8))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"InterviewAI  ·  {today}", footer_s))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()