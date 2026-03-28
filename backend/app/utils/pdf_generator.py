import os
import io
import json
import logging
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import letter, legal
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
import html
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.colors import Color, HexColor
# import qrcode
from reportlab.lib.utils import ImageReader
from sqlalchemy.orm import Session
from app.db.models.doctor import Doctor
from app.core.config import settings
from app.utils.medical_report_builder import (
    format_simple_antecedente,
    format_family_history,
    build_narrative_summary
)

logger = logging.getLogger(__name__)

def safe_p(text: str, style: ParagraphStyle) -> Paragraph:
    """
    Safely creates a ReportLab Paragraph by escaping HTML special characters,
    but preserving specific clinical formatting tags like <br/>, <b>, and <u>.
    """
    if not text:
        return Paragraph("", style)
    
    # Escape all HTML special chars (e.g., & -> &amp;)
    escaped = html.escape(str(text))
    
    # Restore specific tags used for clinical formatting
    escaped = escaped.replace("&lt;br/&gt;", "<br/>")
    escaped = escaped.replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    escaped = escaped.replace("&lt;u&gt;", "<u>").replace("&lt;/u&gt;", "</u>")
    
    return Paragraph(escaped, style)

# --- HELPERS ---

def get_local_path_from_url(url_or_path: str) -> str:
    """
    Tries to resolve a URL or path to a local file path.
    Handles full URLs (http://...) by extracting the /uploads/ part if present.
    """
    if not url_or_path:
        return None
        
    # 1. If it's an absolute path that exists
    if os.path.exists(url_or_path):
        return url_or_path
        
    # 2. If it contains 'uploads/', try to find it locally
    if "uploads/" in url_or_path:
        # Split by 'uploads/' and take the last part
        part = url_or_path.split("uploads/", 1)[1]
        # Construct local path assuming we are in backend root or app root
        # We try multiple base paths
        candidates = [
            os.path.abspath(os.path.join("uploads", part)),
            os.path.abspath(os.path.join("app", "uploads", part)),
            os.path.abspath(os.path.join("..", "uploads", part)),
            os.path.abspath(os.path.join("..", "..", "appgynsys", "uploads", part)),
        ]
        for cand in candidates:
            if os.path.exists(cand):
                return cand
    return None
                
    # 3. If it starts with /, try relative to CWD
    if url_or_path.startswith("/"):
        cand = os.path.abspath(url_or_path.lstrip("/"))
        if os.path.exists(cand):
            return cand
            
    return None

# QR Code generation removed as per request
# def create_qr_image(payload: dict, width=1.2*inch, height=1.2*inch): ...

# --- MAIN GENERATOR ---

SPANISH_MONTHS = {
    1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
    5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
    9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
}

def format_date_spanish(date: datetime = None) -> str:
    if date is None:
        date = datetime.now()
    day = date.day
    month = SPANISH_MONTHS[date.month]
    year = date.year
    return f"{day} de {month} de {year}"

def format_ci_v(ci_str: str) -> str:
    """Formats a number with dots as thousand separators (e.g. 23812988 -> 23.812.988)"""
    if not ci_str: return ""
    # Clean non-numeric except maybe prefix
    prefix = ""
    if "-" in str(ci_str):
        parts = str(ci_str).split("-", 1)
        prefix = parts[0] + "-"
        num_part = parts[1]
    else:
        num_part = str(ci_str)
    
    # Keep only digits for formatting
    digits = "".join(filter(str.isdigit, num_part))
    if not digits: return str(ci_str)
    
    try:
        formatted = f"{int(digits):,}".replace(",", ".")
        return f"{prefix}{formatted}"
    except:
        return str(ci_str)

def _get_header_logos(pdf_config, doctor):
    # Logo 1 (Left)
    logo_source_left = pdf_config.get('logo_header_1') or (doctor.logo_url if doctor else None)
    logo_left = None
    if logo_source_left:
        try:
            logo_path = get_local_path_from_url(logo_source_left)
            if logo_path and os.path.exists(logo_path):
                img_reader = ImageReader(logo_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                logo_left = Image(logo_path, width=1.1*inch, height=(1.1*inch)*aspect)
                logo_left.hAlign = 'CENTER'
        except Exception as e:
            logger.error(f"Error loading left logo: {e}")

    # Logo 2 (Right)
    logo_source_right = pdf_config.get('logo_header_2')
    logo_right = None
    if logo_source_right:
        try:
            logo_path_right = get_local_path_from_url(logo_source_right)
            if logo_path_right and os.path.exists(logo_path_right):
                img_reader_right = ImageReader(logo_path_right)
                iw_r, ih_r = img_reader_right.getSize()
                aspect_r = ih_r / float(iw_r)
                logo_right = Image(logo_path_right, width=1.1*inch, height=(1.1*inch)*aspect_r)
                logo_right.hAlign = 'CENTER'
        except Exception as e:
            logger.error(f"Error loading right logo: {e}")
            
    return logo_left, logo_right

# --- Premium Color Layout Constants & Helpers ---
BRAND_LILAC_DARK = HexColor('#4A148C')
BRAND_LILAC_MEDIUM = HexColor('#9C27B0')
BRAND_LILAC_LIGHT = HexColor('#E1BEE7')
BRAND_LILAC_BG = colors.white

def draw_color_background(canvas, doc):
    canvas.saveState()
    width, height = doc.pagesize
    
    # Base fill to eliminate any white gaps
    canvas.setFillColor(BRAND_LILAC_BG)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    
    # 1. Background Image (Full Page) - Restored over white background for premium feel
    bg_path = os.path.join(os.path.dirname(__file__), "..", "assets", "backgrounds", "lilac_premium.png")
    if os.path.exists(bg_path):
        canvas.saveState()
        canvas.setFillAlpha(0.35) # Texture over white
        canvas.drawImage(bg_path, 0, 0, width=width, height=height, mask='auto')
        canvas.restoreState()
    
    # 2. Watermark Logo (Dynamic implementation)
    include_watermark = getattr(doc, 'include_watermark', True)
    if include_watermark:
        logo_path = getattr(doc, 'watermark_path', None)
        
        # Fallback to default if none provided or doesn't exist
        if not logo_path or not os.path.exists(logo_path):
            logo_path = os.path.join(os.path.dirname(__file__), "..", "assets", "logos", "dr_logo_watermark.png")
            
        if os.path.exists(logo_path):
            canvas.saveState()
            # Watermark sizing
            w_width = 5*inch
            w_height = 5*inch
            try:
                img_reader = ImageReader(logo_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                w_height = w_width * aspect
            except:
                pass
                
            canvas.setFillAlpha(0.12) # Subtle but visible
            canvas.drawImage(logo_path, (width - w_width)/2, (height - w_height)/2, 
                             width=w_width, height=w_height, mask='auto', 
                             preserveAspectRatio=True)
            canvas.restoreState()
    
    # 3. Fixed Footer Elements (Logo/QR ONLY - info removed as requested)
    footer_data = getattr(doc, 'footer_fixed_data', None)
    if footer_data:
        canvas.saveState()
        # Doctor Info Right Side REMOVED as requested (it was duplicated with signature)
        
        # Left Side: QR / Logo (Repositioned 15px lower as requested)
        qr_path = footer_data.get('qr_path')
        if qr_path and os.path.exists(qr_path):
            try:
                img_reader = ImageReader(qr_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                qr_w = 1.1 * inch
                qr_h = qr_w * aspect
                qr_y = 0.5 * inch - (15 / 72.0) 
                canvas.drawImage(qr_path, 0.75*inch, qr_y, width=qr_w, height=qr_h, mask='auto', preserveAspectRatio=True)
            except:
                pass
        canvas.restoreState()

    # 4. Bottom Center URL (Scale increased 30%: 10 -> 13)
    canvas.saveState()
    canvas.setFont("Helvetica", 13)
    canvas.setFillColor(BRAND_LILAC_DARK)
    footer_url = getattr(doc, 'footer_url', "www.gynsys.net")
    canvas.drawCentredString(width/2, 0.3*inch, footer_url)
    canvas.restoreState()
    
    canvas.restoreState()

def generate_summary_report(report_data: dict, doctor_id: int, db: Session = None, use_color: bool = False) -> io.BytesIO:
    """
    Genera el PDF del Informe Médico Resumido (tamaño carta).
    """
    # Build narrative
    report_context = build_narrative_summary(report_data)

    # Fetch doctor data
    # Fetch doctor data
    doctor = None
    pdf_config = {}
    if db:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if doctor and doctor.pdf_config:
            pdf_config = doctor.pdf_config

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
    
    # Watermark Toggle & Dynamic Watermark
    doc.include_watermark = str(report_data.get('include_watermark', 'true')).lower() == 'true'
    watermark_source = pdf_config.get('logo_header_1') or (doctor.logo_url if doctor else None)
    doc.watermark_path = get_local_path_from_url(watermark_source)
    
    # Build dynamic footer URL based on doctor's slug or config
    base_domain = "www.gynsys.net"
    if doctor and doctor.slug_url:
        doc.footer_url = pdf_config.get('doctor_url') or f"{base_domain}/{doctor.slug_url}"
    else:
        doc.footer_url = pdf_config.get('doctor_url') or base_domain
        
    # Fixed Footer Data (QR ONLY - Info removed)
    doc.footer_fixed_data = {
        'qr_path': get_local_path_from_url(pdf_config.get('logo_header_2'))
    }
    
    story = []

    styles = getSampleStyleSheet()
    styleN = ParagraphStyle(name='Normal', fontName='Helvetica', fontSize=12, leading=14)
    styleB = ParagraphStyle(name='Bold', fontName='Helvetica-Bold', fontSize=12, leading=14)
    styleH1 = ParagraphStyle(name='Heading1', fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER, spaceAfter=6, textColor=BRAND_LILAC_MEDIUM if use_color else colors.black)

    style_narrative = ParagraphStyle(
        name='Narrative',
        parent=styleN,
        alignment=TA_JUSTIFY,
        leading=20,
        firstLineIndent=0   # Sin sangría inicial para el texto narrativo
    )
    
    # Estilo para el plan numerado (1., 2., etc.)
    style_plan = ParagraphStyle(
        name='Plan',
        parent=styleN,
        alignment=TA_JUSTIFY,  # Justificado como el texto narrativo
        leading=16,
        leftIndent=18,      # Sangría izquierda para los números
        firstLineIndent=0 # Compensar la primera línea para alinear números
    )
    style_patient_data = ParagraphStyle(name='PatientData', parent=styleN, spaceAfter=2)

    # Header
    doctor_name = pdf_config.get('doctor_name') or (doctor.nombre_completo if doctor else "Médico Especialista")
    specialty = pdf_config.get('specialty') or (doctor.especialidad if doctor else "Ginecología y Obstetricia")
    location = pdf_config.get('location') or ""
    phones = pdf_config.get('phones') or ""
    
    header_text = f"<b>{doctor_name}</b><br/>{specialty}<br/>{location}<br/>Citas: {phones}"
    
    logo_image, logo_image_right = _get_header_logos(pdf_config, doctor)

    # Header Table: 3 columns [Logo Left | Info Center | Logo Right]
    # Center text alignment
    style_center = ParagraphStyle(name='HeaderCenter', parent=styleN, alignment=TA_CENTER)
    # In color mode, remove left logo and center text for minimalist look
    # (Background image already provides the visual identity)
    if use_color:
        header_data = [["", "", ""]]
    else:
        header_data = [[
            logo_image if logo_image else "",
            safe_p(header_text, style_center),
            logo_image_right if logo_image_right else ""
        ]]
    
    # Total width ~ 7.0 inches. 1.2 + 4.6 + 1.2 = 7.0
    header_table = Table(header_data, colWidths=[1.2*inch, 4.6*inch, 1.2*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.white if use_color else colors.black),
    ]))
    story.append(header_table)

    if not use_color:
        line_table = Table([['']], colWidths=[7.5*inch])
        line_table.setStyle(TableStyle([('LINEBELOW', (0,0), (-1,-1), 1, colors.black)]))
        story.append(line_table)
    story.append(Spacer(1, 0.25*inch))
    
    report_title = pdf_config.get('report_title') or "INFORME MÉDICO"
    story.append(safe_p(f"<u>{report_title}</u>", styleH1))
    story.append(Spacer(1, 0.25*inch))

    story.append(safe_p(f"<b>Nombre y Apellidos:</b> {report_context.get('full_name')}", style_patient_data))
    story.append(safe_p(f"<b>Edad:</b> {report_context.get('age')}", style_patient_data))
    story.append(safe_p(f"<b>C.I.:</b> {format_ci_v(report_context.get('ci'))}", style_patient_data))
    story.append(Spacer(1, 0.3*inch))

    # Unified Report Content Priority
    unified_content = report_data.get('medical_report_content')
    if unified_content:
        # Convert newlines to <br/> for ReportLab
        formatted_content = str(unified_content).replace('\n', '<br/>')
        story.append(safe_p(formatted_content, style_narrative))
    else:
        # Fallback to narrative building if no unified content
        narrative_content = report_context.get('narrative_summary')
        if narrative_content:
            # Separar el texto narrativo del plan (que tiene viñetas)
            # El plan comienza después de "Se indica como plan:"
            plan_marker = "Se indica como plan:"
            
            if plan_marker in narrative_content:
                # Dividir en texto narrativo y plan
                parts = narrative_content.split(plan_marker, 1)
                if len(parts) > 0:
                    narrative_text = parts[0].strip()
                    plan_text = parts[1].strip() if len(parts) > 1 else None
                    
                    # Renderizar texto narrativo
                    if narrative_text:
                        narrative_paragraph = Paragraph(narrative_text, style_narrative)
                        story.append(narrative_paragraph)
                    
                    # Renderizar el texto "Se indica como plan:" y luego el plan
                    if plan_text:
                        # Primero el texto introductorio
                        intro_paragraph = safe_p("Se indica como plan:", style_narrative)
                        story.append(intro_paragraph)
                        
                        # Renderizar cada item del plan por separado para asegurar sangría correcta
                        # Dividir por <br/> para obtener cada item
                        plan_items = [item.strip() for item in plan_text.split('<br/>') if item.strip()]
                        for item in plan_items:
                            plan_item_paragraph = safe_p(item, style_plan)
                            story.append(plan_item_paragraph)
            else:
                # No hay plan, solo texto narrativo
                narrative_paragraph = safe_p(narrative_content, style_narrative)
                story.append(narrative_paragraph)

    # Render Observations (Only if NOT using unified content, to avoid duplication)
    if not unified_content:
        observations_content = report_context.get('observations_formatted')
        if observations_content:
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph("Observaciones:", style_narrative))
            obs_items = [item.strip() for item in observations_content.split('<br/>') if item.strip()]
            for item in obs_items:
                story.append(Paragraph(item, style_plan))

    story.append(Spacer(1, 0.3*inch))
    footer_city = pdf_config.get('footer_city') or "Guarenas"
    
    # Use custom report date if provided
    report_at_raw = report_data.get('report_at')
    if report_at_raw:
        try:
            from dateutil.parser import parse
            report_at = parse(report_at_raw) if isinstance(report_at_raw, str) else report_at_raw
            today_str = format_date_spanish(report_at)
        except Exception as e:
            logger.error(f"Error parsing custom report date {report_at_raw}: {e}")
            today_str = format_date_spanish()
    else:
        today_str = format_date_spanish()
        
    pre_signature_text = f"Sin otro particular se suscribe en {footer_city} a los {today_str}."
    story.append(Paragraph(pre_signature_text, ParagraphStyle(name='PreFooter', fontSize=12, alignment=TA_CENTER, spaceAfter=24)))

    # Signature
    sig_name = doctor_name
    sig_specialty = pdf_config.get('specialty') or "Ginecólogo Obstetra - UCV"
    
    mpps = pdf_config.get('mpps_number', '')
    cmdm = pdf_config.get('cmdm_number', '')
    sig_ids = f"MPPS: {mpps} / CMDM: {cmdm}" if (mpps or cmdm) else ""
    
    doctor_ci_val = pdf_config.get('doctor_ci', '')
    sig_ci = f"C.I.: {format_ci_v(doctor_ci_val)}" if doctor_ci_val else ""
    
    # Signature Image
    signature_source = pdf_config.get('logo_signature')
    signature_image = None
    if signature_source:
        try:
            sig_path = get_local_path_from_url(signature_source)
            if sig_path and os.path.exists(sig_path):
                # Signature usually wider
                img_reader = ImageReader(sig_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                # Limit width to 2.5 inch
                target_width = 2.5*inch
                target_height = target_width * aspect
                # But limit height to 1 inch
                if target_height > 1*inch:
                    target_height = 1*inch
                    target_width = target_height / aspect
                
                signature_image = Image(sig_path, width=target_width, height=target_height)
                signature_image.hAlign = 'CENTER'
        except Exception as e:
            logger.error(f"Error loading signature: {e}")

    if signature_image:
        story.append(signature_image)
    else:
        story.append(Paragraph("_________________________", ParagraphStyle(name='SignatureLine', alignment=TA_CENTER)))
        
    story.append(Paragraph(f"<b>{sig_name}</b>", ParagraphStyle(name='SigName', alignment=TA_CENTER, fontSize=12, spaceBefore=6)))
    story.append(Paragraph(sig_specialty, ParagraphStyle(name='SigSpec', alignment=TA_CENTER, fontSize=10)))
    story.append(Paragraph(sig_ids, ParagraphStyle(name='SigIDs', alignment=TA_CENTER, fontSize=10)))
    story.append(Paragraph(sig_ci, ParagraphStyle(name='SigCI', alignment=TA_CENTER, fontSize=10)))
    
    # In color mode, we move the signature to the bottom right and the second logo to the bottom left
    # In color mode, we already handled footer drawing in draw_color_background callback
    if use_color:
        story.append(Spacer(1, 1*inch)) # Placeholder space to avoid overlap
    else:
        # Build composite bottom table for non-color mode
        footer_sig_style = ParagraphStyle(name='FooterSig', fontSize=12, alignment=TA_RIGHT, leading=14)
        footer_col_left = [logo_image_right] if logo_image_right else [""]
        footer_col_right = [
            Paragraph(f"<b>{sig_name}</b>", footer_sig_style),
            Paragraph(sig_specialty, footer_sig_style),
            Paragraph(sig_ids, footer_sig_style)
        ]
        
        footer_table_data = [[footer_col_left, footer_col_right]]
        footer_table = Table(footer_table_data, colWidths=[3.0*inch, 4.0*inch])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('TOPPADDING', (0,0), (-1,-1), 20),
        ]))
        story.append(Spacer(1, 0.5*inch))
        story.append(footer_table)
    
    # --- PAGE 2: IMAGES (Optional) ---
    if report_data.get('include_images') and report_data.get('assets'):
        from reportlab.platypus import PageBreak
        story.append(PageBreak())
        
        # Patient info
        patient_name = report_data.get('full_name') or report_data.get('patient_name', 'Paciente')
        patient_ci = format_ci_v(report_data.get('ci') or report_data.get('patient_ci', 'V-00.000.000'))
        patient_age = report_data.get('age') or report_data.get('patient_age', '00')
        patient_phone = report_data.get('phone') or report_data.get('patient_phone', '0000-0000000')
        
        # Determine title based on consultation type
        c_type = (report_data.get('consultation_type') or "").lower()
        if "prenatal" in c_type or "obstetrica" in c_type:
            img_title = "ULTRASONIDO OBSTÉTRICO"
        else:
            img_title = "ULTRASONIDO GINECOLÓGICO"
            
        # Repeat Header (already updated to 3 cols if we use same logic)
        header_data_p2 = [[
            logo_image if logo_image else "",
            safe_p(header_text, ParagraphStyle(name='HeaderCenterP2', parent=styleN, alignment=TA_CENTER)),
            logo_image_right if (logo_image_right and not use_color) else ""
        ]]
        header_table_p2 = Table(header_data_p2, colWidths=[1.2*inch, 4.6*inch, 1.2*inch])
        header_table_p2.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'CENTER'),
            ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ]))
        story.append(header_table_p2)
        story.append(line_table)
        story.append(Spacer(1, 0.25*inch))
        story.append(Paragraph(f"<u>{img_title}</u>", styleH1))
        story.append(Spacer(1, 0.2*inch))
        
        # Patient Info Small
        story.append(Paragraph(f"<b>Paciente:</b> {report_context.get('full_name')} | <b>C.I.:</b> {report_context.get('ci')}", styleN))
        story.append(Spacer(1, 0.25*inch))
        
        # Grid of 4 images
        assets = [a for a in report_data.get('assets', []) if "image" in (a.get('file_type') or "").lower()][:4]
        
        grid_data = []
        # We need a 2x2 grid
        for i in range(0, 4, 2):
            row = []
            for j in range(2):
                idx = i + j
                if idx < len(assets):
                    asset = assets[idx]
                    path = get_local_path_from_url(asset.get('file_path'))
                    if path and os.path.exists(path):
                        img_reader = ImageReader(path)
                        iw, ih = img_reader.getSize()
                        aspect = ih / float(iw)
                        
                        # Max dimensions for the block
                        max_w = 3.2*inch
                        max_h = 3.2*inch
                        
                        if aspect > 1: # Vertical
                            h = max_h
                            w = h / aspect
                        else: # Horizontal
                            w = max_w
                            h = w * aspect
                            
                        block_img = Image(path, width=w, height=h)
                        row.append(block_img)
                    else:
                        row.append("")
                else:
                    row.append("")
            grid_data.append(row)
            
        # If we have less than 4, ensure grid is consistent
        while len(grid_data) < 2:
            grid_data.append(["", ""])
            
        img_table = Table(grid_data, colWidths=[3.5*inch, 3.5*inch], rowHeights=[3.5*inch, 3.5*inch])
        
        # Custom Dash Style
        img_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            # Gray dashed border for each cell
            ('GRID', (0,0), (-1,-1), 1, colors.gray, None, (2,2)), # 2 on, 2 off dash
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        
        story.append(img_table)

    try:
        if use_color:
            doc.build(story, onFirstPage=draw_color_background, onLaterPages=draw_color_background)
        else:
            doc.build(story)
    except Exception as e:
        logger.error(f"Error building summary PDF: {e}", exc_info=True)
        raise
    buffer.seek(0)
    return buffer

def generate_medical_report(report_data: dict, doctor_id: int, db: Session = None, use_color: bool = False) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=legal, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []

    styleN = ParagraphStyle(name='Normal', fontName='Helvetica', fontSize=10, leading=12)
    styleB = ParagraphStyle(name='Bold', fontName='Helvetica-Bold', fontSize=10, leading=12)
    styleH1 = ParagraphStyle(name='Heading1', fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER, spaceAfter=6, textColor=BRAND_LILAC_MEDIUM if use_color else colors.black)
    styleJustify = ParagraphStyle(name='Justify', parent=styleN, alignment=TA_JUSTIFY)

    def get_str(key, default=''):
        value = report_data.get(key)
        if value is None or str(value).strip() == 'None':
            return default
        return str(value)

    # Fetch doctor data
    doctor = None
    pdf_config = {}
    if db:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if doctor and doctor.pdf_config:
            pdf_config = doctor.pdf_config

    # Header
    doctor_name = pdf_config.get('doctor_name') or (doctor.nombre_completo if doctor else "Médico Especialista")
    specialty = pdf_config.get('specialty') or (doctor.especialidad if doctor else "Ginecología y Obstetricia")
    location = pdf_config.get('location') or ""
    phones = pdf_config.get('phones') or ""
    
    header_text = f"<b>{doctor_name}</b><br/>{specialty}<br/>{location}<br/>Citas: {phones}"
    
    logo_image, logo_image_right = _get_header_logos(pdf_config, doctor)

    # Header Table: 3 columns
    style_center = ParagraphStyle(name='HeaderCenterMed', parent=styleN, alignment=TA_CENTER)
    header_data = [[
        logo_image if logo_image else "",
        safe_p(header_text, style_center),
        logo_image_right if (logo_image_right and not use_color) else ""
    ]]
    header_table = Table(header_data, colWidths=[1.2*inch, 4.6*inch, 1.2*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.white if use_color else colors.black),
    ]))
    story.append(header_table)
    
    report_title =  "HISTORIA MÉDICA"
    story.append(Paragraph(f"<u>{report_title}</u>", styleH1))
    story.append(Spacer(1, 0.2*inch))

    # Patient Table
    patient_table_data = [
        [safe_p("<b>Nombre:</b>", styleB), safe_p(get_str('full_name').title(), styleN),
         safe_p("<b>Edad:</b>", styleB), safe_p(get_str('age'), styleN)],
        [safe_p("<b>C.I.:</b>", styleB), safe_p(format_ci_v(get_str('ci')), styleN),
         safe_p("<b>TLF:</b>", styleB), safe_p(get_str('phone'), styleN)],
        [safe_p("<b>Dirección:</b>", styleB), safe_p(get_str('address').title(), styleN),
         safe_p("<b>Ocupación:</b>", styleB), safe_p(get_str('occupation').title(), styleN)],
        [safe_p("<b>N° Historia:</b>", styleB), safe_p(get_str('history_number', 'Pendiente'), styleN),
         safe_p("", styleN), safe_p("", styleN)],
    ]
    patient_table = Table(patient_table_data, colWidths=[1.5*inch, 3.0*inch, 1.0*inch, 2.0*inch])
    patient_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0,-1), (-1,-1), 0.5, colors.Color(0.8, 0.8, 0.8))
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 0.2*inch))

    # Body
    body_rows = []
    
    # PART 1: Preconsultation Data (shown ONCE)
    preconsulta_sections = [
        ("Motivo de consulta", get_str('reason_for_visit'), styleN),
        ("Antecedentes Familiares", format_family_history(get_str('family_history_mother'), get_str('family_history_father')), styleN),
        ("Antecedentes Personales", format_simple_antecedente(get_str('personal_history')), styleN),
        ("Suplementos", format_simple_antecedente(get_str('supplements')), styleN),
        ("Antecedentes Quirúrgicos", format_simple_antecedente(get_str('surgical_history')), styleN),
        ("Gineco-Obstétricos", get_str('summary_gyn_obstetric'), styleJustify),
        ("Examen Funcional", get_str('summary_functional_exam'), styleJustify),
        ("Hábitos", get_str('summary_habits'), styleJustify),
        ("Tabaco", get_str('habits_smoking'), styleN),
        ("Alcohol", get_str('habits_alcohol'), styleN),
        ("Actividad Física", get_str('habits_physical_activity'), styleN),
        ("Otras Sustancias", get_str('habits_substance_use'), styleN),
    ]

    for label, content, style_or_type in preconsulta_sections:
        if not content or content.isspace():
            continue
        
        label_p = safe_p(f"<b>{label}:</b>", styleB)
        value_p_list = []
        
        if isinstance(style_or_type, ParagraphStyle):
            paragraphs = content.strip().split('<br/>')
            for p_text in paragraphs:
                if p_text.strip():
                    value_p_list.append(safe_p(p_text, style_or_type))
        else:
            items = [item.strip() for item in content.strip().split('\n') if item.strip()]
            list_style = ParagraphStyle(name='ListItem', parent=styleN, leftIndent=12)
            for item_text in items:
                value_p_list.append(safe_p(f"• {item_text}", list_style))
        
        if not value_p_list:
            value_p_list.append(safe_p("No reportado.", styleN))

        body_rows.append([label_p, value_p_list])

    # PART 2: All Consultations (chronologically)
    all_consultations = report_data.get('all_consultations', [])
    
    if all_consultations:
        # Add separator/header for consultations section with gray background
        consultas_header_style = ParagraphStyle(
            name='ConsultaHeader',
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=colors.HexColor('#2D3748'),
            spaceAfter=6
        )
        body_rows.append([
            Paragraph("<b>CONSULTAS MÉDICAS:</b>", consultas_header_style),
            []
        ])
    
        for idx, consultation in enumerate(all_consultations):
            # Consultation header with date
            consulta_date = consultation.get('created_at')
            date_str = ""
            if consulta_date:
                try:
                    if isinstance(consulta_date, str):
                        from dateutil.parser import parse
                        consulta_date = parse(consulta_date)
                    date_str = format_date_spanish(consulta_date)
                except:
                    date_str = str(consulta_date)
            
            consulta_num = idx + 1  # Forward numbering: 1, 2, 3...
            
            # Create consultation header spanning both columns to prevent line breaks
            consulta_header_style = ParagraphStyle(
                name='ConsultaNum',
                fontName='Helvetica-Bold',
                fontSize=11,
                textColor=colors.HexColor('#2D3748'),
                spaceAfter=4,
                leading=14
            )
            consulta_header = Paragraph(f"<b>Consulta #{consulta_num}</b> ({date_str})", consulta_header_style)
            
            # Add header row that spans both columns
            body_rows.append([consulta_header, ''])  # Empty second cell will be merged
            
            # Consultation data
            consultation_sections = [
                ("Examen Físico", consultation.get('physical_exam', ''), styleJustify),
                ("Ultrasonido", consultation.get('ultrasound', ''), styleJustify),
                ("Diagnóstico", consultation.get('diagnosis', ''), 'bullet'),
                ("Plan", consultation.get('plan', ''), 'bullet'),
                ("Observaciones", consultation.get('observations', ''), 'bullet'),
            ]
            
            for label, content, style_or_type in consultation_sections:
                label_p = safe_p(f"<b>{label}:</b>", styleB)
                value_p_list = []
                
                # Only process content if it exists and is not empty
                if content and not content.isspace():
                    if isinstance(style_or_type, ParagraphStyle):
                        paragraphs = content.strip().split('<br/>')
                        for p_text in paragraphs:
                            if p_text.strip():
                                value_p_list.append(safe_p(p_text, style_or_type))
                    else:
                        # List handling
                        items = [item.strip() for item in content.strip().split('\n') if item.strip()]
                        list_style = ParagraphStyle(name='ListItem', parent=styleN, leftIndent=12)
                        for item_text in items:
                            value_p_list.append(safe_p(f"• {item_text}", list_style))
                
                # Always show the field, even if empty
                if not value_p_list:
                    value_p_list.append(safe_p("No reportado.", styleN))

                body_rows.append([label_p, value_p_list])

    if body_rows:
        # Track which rows are headers for background styling
        header_rows = []
        for idx, row in enumerate(body_rows):
            # Check if it's a section header (CONSULTAS MÉDICAS or Consulta #X)
            if row[0] and hasattr(row[0], 'text'):
                text = row[0].text
                if 'CONSULTAS MÉDICAS' in text or 'Consulta #' in text:
                    header_rows.append(idx)
        
        body_table = Table(body_rows, colWidths=[2.2*inch, 5.3*inch])
        
        # Base table style
        table_style = [
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 0), (-1, -1), 0.25, colors.Color(0.8, 0.8, 0.8)),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]
        
        # Add gray background and span to header rows
        for row_idx in header_rows:
            table_style.append(('SPAN', (0, row_idx), (1, row_idx)))  # Merge both columns
            table_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.Color(0.95, 0.95, 0.95)))
            table_style.append(('TOPPADDING', (0, row_idx), (-1, row_idx), 8))
            table_style.append(('BOTTOMPADDING', (0, row_idx), (-1, row_idx), 8))
        
        body_table.setStyle(TableStyle(table_style))
        story.append(body_table)

    # Footer removed - medical history is cumulative document without signature

    try:
        # Watermark Toggle & Dynamic Watermark & URL
        doc.include_watermark = str(report_data.get('include_watermark', 'true')).lower() == 'true'
        watermark_source = pdf_config.get('logo_header_1') or (doctor.logo_url if doctor else None)
        doc.watermark_path = get_local_path_from_url(watermark_source)
        
        base_domain = "www.gynsys.net"
        if doctor and doctor.slug_url:
            doc.footer_url = pdf_config.get('doctor_url') or f"{base_domain}/{doctor.slug_url}"
        else:
            doc.footer_url = pdf_config.get('doctor_url') or base_domain
            
        # Fixed Footer Data (QR ONLY)
        if use_color:
            doc.footer_fixed_data = {
                'qr_path': get_local_path_from_url(pdf_config.get('logo_header_2'))
            }

        if use_color:
            doc.build(story, onFirstPage=draw_color_background, onLaterPages=draw_color_background)
        else:
            doc.build(story)
    except Exception as e:
        logger.error(f"Error building medical history PDF: {e}", exc_info=True)
        raise
    buffer.seek(0)
    return buffer

def convert_pdf_to_image(pdf_buffer: io.BytesIO) -> io.BytesIO:
    """
    Convierte la primera página de un PDF en una imagen PNG.
    Útil para previsualizaciones rápidas en móviles.
    """
    pdf_buffer.seek(0)
    # Abrir el PDF desde el stream de bytes
    import fitz
    doc = fitz.open(stream=pdf_buffer.read(), filetype="pdf")
    
    if len(doc) == 0:
        raise ValueError("El PDF no tiene páginas.")

    # Cargar la primera página
    page = doc.load_page(0)
    
    # Renderizar la página a una imagen (pixmap)
    # Por defecto es 72 DPI, aumentamos a 150 para mejor legibilidad
    zoom = 150 / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
    
    # Guardar en un buffer de bytes como PNG
    img_buffer = io.BytesIO(pix.tobytes("png"))
    doc.close()
    img_buffer.seek(0)
    return img_buffer
