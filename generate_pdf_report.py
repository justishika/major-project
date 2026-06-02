"""
generate_pdf_report.py
Compiles all disease graphs from results/graphs/ into a well-organized PDF report.
Organized by disease with section headers, a simple TOC table, and a cover page.
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    Paragraph, Spacer, Image as RLImage,
    PageBreak, HRFlowable, Table, TableStyle
)
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from PIL import Image as PILImage

# ─── Configuration ────────────────────────────────────────────────────────────
GRAPHS_DIR = Path(r"c:\Users\ishik\Downloads\major project\results\graphs")
OUTPUT_PDF = Path(r"c:\Users\ishik\Downloads\major project\results\All_Disease_Graphs_Report.pdf")

PAGE_WIDTH, PAGE_HEIGHT = A4  # 595.27 x 841.89 points

# Friendly disease names (folder name -> display name)
# Note: avoid apostrophes in values used as TOC keys
DISEASE_NAMES = {
    "acute_nephritis":  "Acute Nephritis",
    "als":              "ALS (Amyotrophic Lateral Sclerosis)",
    "breast_cancer":    "Breast Cancer",
    "heart_disease":    "Heart Disease",
    "heart_failure":    "Heart Failure",
    "hepatitis_c":      "Hepatitis C",
    "indian_liver":     "Indian Liver Disease",
    "parkinsons":       "Parkinsons Disease",
    "thyroid_disease":  "Thyroid Disease",
    "wilsons_disease":  "Wilsons Disease",
}

# Friendly graph-type names derived from filename stems
GRAPH_LABELS = {
    "roc_curve":                  "ROC Curve",
    "precision_recall_curve":     "Precision–Recall Curve",
    "metric_heatmap":             "Metric Heatmap",
    "model_stability":            "Model Stability",
    "noise_sensitivity":          "Noise Sensitivity",
    "overfitting_behavior":       "Overfitting Behaviour",
    "accuracy_vs_size":           "Accuracy vs. Training Size",
    "train_accuracy_vs_size":     "Training Accuracy vs. Size",
    "f1_score_vs_size":           "F1 Score vs. Training Size",
    "roc_auc_vs_size":            "ROC-AUC vs. Training Size",
    "precision_vs_size":          "Precision vs. Training Size",
    "recall_vs_size":             "Recall vs. Training Size",
    "sensitivity_vs_size":        "Sensitivity vs. Training Size",
    "specificity_vs_size":        "Specificity vs. Training Size",
    "generalization_gap_vs_size": "Generalization Gap vs. Training Size",
    "runtime_s_vs_size":          "Runtime vs. Training Size",
    "confusion_matrix":           "Confusion Matrix",
}

# Desired display order of graph types (confusion matrices at the end)
GRAPH_ORDER = [
    "roc_curve",
    "precision_recall_curve",
    "metric_heatmap",
    "model_stability",
    "noise_sensitivity",
    "overfitting_behavior",
    "accuracy_vs_size",
    "train_accuracy_vs_size",
    "f1_score_vs_size",
    "roc_auc_vs_size",
    "precision_vs_size",
    "recall_vs_size",
    "sensitivity_vs_size",
    "specificity_vs_size",
    "generalization_gap_vs_size",
    "runtime_s_vs_size",
    "confusion_matrix",
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def graph_type_key(filename: str) -> str:
    """Return the graph-type key for a filename."""
    stem = Path(filename).stem
    for key in GRAPH_ORDER:
        if stem.startswith(key) or (f"_{key}_" in stem) or stem.endswith(f"_{key}"):
            return key
    # confusion matrix patterns like confusion_matrix_<disease>_<model>
    if "confusion_matrix" in stem:
        return "confusion_matrix"
    return stem

def graph_sort_key(filepath: Path) -> tuple:
    stem = filepath.stem
    gtype = graph_type_key(stem)
    try:
        order_idx = GRAPH_ORDER.index(gtype)
    except ValueError:
        order_idx = 99
    return (order_idx, stem)

def friendly_graph_name(filepath: Path, disease_folder: str) -> str:
    stem = filepath.stem
    gtype = graph_type_key(stem)
    label = GRAPH_LABELS.get(gtype, gtype.replace("_", " ").title())
    if gtype == "confusion_matrix":
        # Extract model name: confusion_matrix_<disease>_<model...>
        # e.g. confusion_matrix_parkinsons_Logistic_Regression
        suffix = stem.replace(f"confusion_matrix_{disease_folder}_", "")
        model = suffix.replace("_", " ")
        return f"Confusion Matrix — {model}"
    return label

def scale_image(img_path: Path, max_width: float, max_height: float):
    """Return (width, height) scaled to fit within max_width x max_height."""
    with PILImage.open(img_path) as im:
        w_px, h_px = im.size
    ratio = min(max_width / w_px, max_height / h_px, 1.0)
    return w_px * ratio, h_px * ratio

# ─── Custom Doc Template with headers/footers ─────────────────────────────────

class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            1.5 * cm, 2.0 * cm,
            PAGE_WIDTH - 3.0 * cm, PAGE_HEIGHT - 3.5 * cm,
            id="normal"
        )
        self.addPageTemplates([
            PageTemplate(id="main", frames=frame, onPage=self._draw_page)
        ])

    @staticmethod
    def _draw_page(canv: canvas.Canvas, doc):
        canv.saveState()
        # Top border line
        canv.setStrokeColor(colors.HexColor("#3B4A6B"))
        canv.setLineWidth(1.5)
        canv.line(1.5 * cm, PAGE_HEIGHT - 1.8 * cm,
                  PAGE_WIDTH - 1.5 * cm, PAGE_HEIGHT - 1.8 * cm)
        # Header text
        canv.setFont("Helvetica-Bold", 8)
        canv.setFillColor(colors.HexColor("#3B4A6B"))
        canv.drawString(1.5 * cm, PAGE_HEIGHT - 1.5 * cm,
                        "Hybrid Classical-Quantum ML — Disease Graph Report")
        canv.setFont("Helvetica", 8)
        canv.setFillColor(colors.HexColor("#888888"))
        canv.drawRightString(PAGE_WIDTH - 1.5 * cm, PAGE_HEIGHT - 1.5 * cm,
                             "Ishika | Major Project 2026")
        # Bottom border line
        canv.setStrokeColor(colors.HexColor("#3B4A6B"))
        canv.line(1.5 * cm, 1.8 * cm, PAGE_WIDTH - 1.5 * cm, 1.8 * cm)
        # Page number
        canv.setFont("Helvetica", 8)
        canv.setFillColor(colors.HexColor("#888888"))
        canv.drawCentredString(PAGE_WIDTH / 2, 1.2 * cm, f"— {doc.page} —")
        canv.restoreState()


# ─── Build story ──────────────────────────────────────────────────────────────

def build_pdf():
    styles = getSampleStyleSheet()

    # Custom styles
    cover_title = ParagraphStyle(
        "CoverTitle", parent=styles["Title"],
        fontSize=28, leading=36,
        textColor=colors.HexColor("#1A2440"),
        alignment=TA_CENTER, spaceAfter=12,
    )
    cover_subtitle = ParagraphStyle(
        "CoverSubtitle", parent=styles["Normal"],
        fontSize=14, leading=20,
        textColor=colors.HexColor("#3B4A6B"),
        alignment=TA_CENTER, spaceAfter=6,
    )
    cover_meta = ParagraphStyle(
        "CoverMeta", parent=styles["Normal"],
        fontSize=10, leading=14,
        textColor=colors.HexColor("#888888"),
        alignment=TA_CENTER,
    )
    disease_heading = ParagraphStyle(
        "DiseaseHeading", parent=styles["Heading1"],
        fontSize=18, leading=24,
        textColor=colors.HexColor("#1A2440"),
        spaceBefore=10, spaceAfter=6,
        borderPad=4,
    )
    graph_subheading = ParagraphStyle(
        "GraphSubheading", parent=styles["Heading2"],
        fontSize=11, leading=15,
        textColor=colors.HexColor("#3B4A6B"),
        spaceBefore=8, spaceAfter=4,
    )
    toc_row_style = ParagraphStyle(
        "TOCRow", parent=styles["Normal"],
        fontSize=11, leading=15,
        textColor=colors.HexColor("#1A2440"),
        leftIndent=0, spaceAfter=4,
    )

    story = []

    # ── Cover page ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 4 * cm))
    story.append(Paragraph("Disease Graph Report", cover_title))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="60%", thickness=2,
                             color=colors.HexColor("#3B4A6B"), spaceAfter=16,
                             hAlign="CENTER"))
    story.append(Paragraph(
        "Hybrid Classical-Quantum Machine Learning Pipeline", cover_subtitle))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        "Performance Visualizations Across All Disease Benchmarks", cover_subtitle))
    story.append(Spacer(1, 1.5 * cm))
    story.append(Paragraph("Ishika &nbsp;|&nbsp; Major Project 2026", cover_meta))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        f"Total diseases: {len(DISEASE_NAMES)}  |  All graphs auto-compiled",
        cover_meta))
    story.append(PageBreak())

    # ── Table of Contents (simple table, no bookmarks needed) ──────────────
    story.append(Paragraph("Table of Contents", disease_heading))
    story.append(HRFlowable(width="100%", thickness=1,
                             color=colors.HexColor("#CCCCCC"), spaceAfter=12))

    toc_data = []
    # Cross-disease summary
    cross_img_check = GRAPHS_DIR / "cross_disease_summary.png"
    if cross_img_check.exists():
        toc_data.append([
            Paragraph("Cross-Disease Summary", toc_row_style),
        ])
    # Per-disease entries
    for folder_key, dname in DISEASE_NAMES.items():
        if (GRAPHS_DIR / folder_key).is_dir():
            toc_data.append([
                Paragraph(f"  {dname}", toc_row_style),
            ])

    toc_table = Table(toc_data, colWidths=[PAGE_WIDTH - 4.0 * cm])
    toc_table.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1),
         [colors.HexColor("#F7F9FF"), colors.white]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
    ]))
    story.append(toc_table)
    story.append(PageBreak())

    # ── Cross-disease summary page ──────────────────────────────────────────
    cross_img = GRAPHS_DIR / "cross_disease_summary.png"
    if cross_img.exists():
        story.append(Paragraph("Cross-Disease Summary", disease_heading))
        story.append(HRFlowable(width="100%", thickness=1.5,
                                 color=colors.HexColor("#3B4A6B"), spaceAfter=10))
        max_w = PAGE_WIDTH - 3.5 * cm
        max_h = PAGE_HEIGHT * 0.72
        w, h = scale_image(cross_img, max_w, max_h)
        story.append(RLImage(str(cross_img), width=w, height=h, hAlign="CENTER"))
        story.append(PageBreak())

    # ── Per-disease sections ─────────────────────────────────────────────────
    disease_folders = sorted(
        [d for d in GRAPHS_DIR.iterdir() if d.is_dir()],
        key=lambda d: list(DISEASE_NAMES.keys()).index(d.name)
        if d.name in DISEASE_NAMES else 999
    )

    for disease_dir in disease_folders:
        folder_name = disease_dir.name
        display_name = DISEASE_NAMES.get(folder_name, folder_name.replace("_", " ").title())

        all_images = sorted(disease_dir.glob("*.png"), key=graph_sort_key)
        if not all_images:
            continue

        # Separate confusion matrices from other graphs
        regular_imgs = [p for p in all_images if "confusion_matrix" not in p.stem]
        cm_imgs = [p for p in all_images if "confusion_matrix" in p.stem]

        # Disease section header
        story.append(Paragraph(display_name, disease_heading))
        story.append(HRFlowable(width="100%", thickness=1.5,
                                 color=colors.HexColor("#3B4A6B"), spaceAfter=6))

        # ── Regular graphs: 2-per-row grid ───────────────────────────────
        story.append(Paragraph("Performance Metrics &amp; Curves", graph_subheading))

        # Pair up the regular graphs for 2-column layout
        img_w = (PAGE_WIDTH - 4.5 * cm) / 2
        img_h = img_w * 0.72   # approx aspect

        for i in range(0, len(regular_imgs), 2):
            row_imgs = regular_imgs[i:i+2]
            cells = []
            for img_path in row_imgs:
                gname = friendly_graph_name(img_path, folder_name)
                w, h = scale_image(img_path, img_w, img_h)
                cell_content = [
                    Paragraph(gname, graph_subheading),
                    RLImage(str(img_path), width=w, height=h),
                ]
                cells.append(cell_content)
            if len(cells) == 1:
                cells.append([""])  # fill empty second cell

            tbl = Table(cells, colWidths=[img_w + 0.3 * cm, img_w + 0.3 * cm])
            tbl.setStyle(TableStyle([
                ("VALIGN",     (0, 0), (-1, -1), "TOP"),
                ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING",  (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
            ]))
            story.append(tbl)

        # ── Confusion matrices: 2-per-row ──────────────────────────────
        if cm_imgs:
            story.append(Spacer(1, 0.3 * cm))
            story.append(Paragraph("Confusion Matrices", graph_subheading))
            cm_w = (PAGE_WIDTH - 4.5 * cm) / 2
            cm_h = cm_w * 0.85

            for i in range(0, len(cm_imgs), 2):
                row_imgs = cm_imgs[i:i+2]
                cells = []
                for img_path in row_imgs:
                    gname = friendly_graph_name(img_path, folder_name)
                    w, h = scale_image(img_path, cm_w, cm_h)
                    cell_content = [
                        Paragraph(gname, graph_subheading),
                        RLImage(str(img_path), width=w, height=h),
                    ]
                    cells.append(cell_content)
                if len(cells) == 1:
                    cells.append([""])

                tbl = Table(cells, colWidths=[cm_w + 0.3 * cm, cm_w + 0.3 * cm])
                tbl.setStyle(TableStyle([
                    ("VALIGN",     (0, 0), (-1, -1), "TOP"),
                    ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
                    ("LEFTPADDING",  (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
                ]))
                story.append(tbl)

        story.append(PageBreak())

    # ── Build doc ────────────────────────────────────────────────────────────
    doc = ReportDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        title="Disease Graph Report — Hybrid Classical-Quantum ML",
        author="Ishika",
        subject="All disease performance visualizations",
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
    )
    doc.multiBuild(story)
    print(f"\nPDF saved to: {OUTPUT_PDF}")
    print(f"   Pages generated: check the file!")


if __name__ == "__main__":
    build_pdf()
