import os
import io
import json
import logging
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import legal, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.units import inch
from reportlab.lib import colors
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

def generate_summary_report(report_data: dict, doctor_id: int, db: Session = None) -> io.BytesIO:
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
    story = []

    styles = getSampleStyleSheet()
    styleN = ParagraphStyle(name='Normal', fontName='Helvetica', fontSize=12, leading=14)
    styleB = ParagraphStyle(name='Bold', fontName='Helvetica-Bold', fontSize=12, leading=14)
    styleH1 = ParagraphStyle(name='Heading1', fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER, spaceAfter=6)

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
    doctor_name = pdf_config.get('doctor_name') or (doctor.nombre_completo if doctor else "Dra. Mariel Herrera")
    specialty = pdf_config.get('specialty') or (doctor.especialidad if doctor else "Especialista en Ginecología y Obstetricia")
    location = pdf_config.get('location') or "Caracas-Guarenas Guatire"
    phones = pdf_config.get('phones') or "04244281876-04127738918"
    
    header_text = f"<b>{doctor_name}</b><br/>{specialty}<br/>{location}<br/>Citas: {phones}"
    
    # Logo
    logo_image = ""
    # Prefer logo from config, then doctor profile
    logo_source = pdf_config.get('logo_header_1') or (doctor.logo_url if doctor else None)
    
    if logo_source:
        try:
            logo_path = get_local_path_from_url(logo_source)
            
            if logo_path and os.path.exists(logo_path):
                img = Image(logo_path, width=1.2*inch, height=1.2*inch)
                img.hAlign = 'CENTER'
                # Maintain aspect ratio
                img_reader = ImageReader(logo_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                img = Image(logo_path, width=1.2*inch, height=(1.2*inch)*aspect)
                img.hAlign = 'CENTER'
                logo_image = img
            else:
                logger.warning(f"Logo file not found for source: {logo_source}")
        except Exception as e:
            logger.error(f"Error loading logo: {e}")

    # Header Table
    # Logo on left (col 0), Text on right (col 1)
    header_data = [[logo_image if logo_image else "", Paragraph(header_text, styleN)]]
    header_table = Table(header_data, colWidths=[1.5*inch, 5.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,0), 'CENTER'),
        ('ALIGN', (1,0), (1,0), 'LEFT'),
    ]))
    story.append(header_table)

    line_table = Table([['']], colWidths=[7.5*inch])
    line_table.setStyle(TableStyle([('LINEBELOW', (0,0), (-1,-1), 1, colors.black)]))
    story.append(line_table)
    story.append(Spacer(1, 0.25*inch))
    
    report_title = pdf_config.get('report_title') or "INFORME MÉDICO"
    story.append(Paragraph(f"<u>{report_title}</u>", styleH1))
    story.append(Spacer(1, 0.25*inch))

    story.append(Paragraph(f"<b>Nombre y Apellidos:</b> {report_context.get('full_name')}", style_patient_data))
    story.append(Paragraph(f"<b>Edad:</b> {report_context.get('age')}", style_patient_data))
    story.append(Paragraph(f"<b>C.I.:</b> {report_context.get('ci')}", style_patient_data))
    story.append(Spacer(1, 0.3*inch))

    narrative_content = report_context.get('narrative_summary')
    if narrative_content:
        # Separar el texto narrativo del plan (que tiene viñetas)
        # El plan comienza después de "Se indica como plan:"
        plan_marker = "Se indica como plan:"
        
        if plan_marker in narrative_content:
            # Dividir en texto narrativo y plan
            parts = narrative_content.split(plan_marker, 1)
            narrative_text = parts[0].strip()
            plan_text = parts[1].strip() if len(parts) > 1 else None
            
            # Renderizar texto narrativo
            if narrative_text:
                narrative_paragraph = Paragraph(narrative_text, style_narrative)
                story.append(narrative_paragraph)
            
            # Renderizar el texto "Se indica como plan:" y luego el plan
            if plan_text:
                # Primero el texto introductorio
                intro_paragraph = Paragraph("Se indica como plan:", style_narrative)
                story.append(intro_paragraph)
                
                # Renderizar cada item del plan por separado para asegurar sangría correcta
                # Dividir por <br/> para obtener cada item
                plan_items = [item.strip() for item in plan_text.split('<br/>') if item.strip()]
                for item in plan_items:
                    plan_item_paragraph = Paragraph(item, style_plan)
                    story.append(plan_item_paragraph)
        else:
            # No hay plan, solo texto narrativo
            narrative_paragraph = Paragraph(narrative_content, style_narrative)
            story.append(narrative_paragraph)

    # Render Observations
    observations_content = report_context.get('observations_formatted')
    if observations_content:
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph("Observaciones:", style_narrative))
        obs_items = [item.strip() for item in observations_content.split('<br/>') if item.strip()]
        for item in obs_items:
            story.append(Paragraph(item, style_plan))

    story.append(Spacer(1, 0.3*inch))
    footer_city = pdf_config.get('footer_city') or "Guarenas"
    today_str = format_date_spanish()
    pre_signature_text = f"Sin otro particular se suscribe en {footer_city} a los {today_str}."
    story.append(Paragraph(pre_signature_text, ParagraphStyle(name='PreFooter', fontSize=12, alignment=TA_CENTER, spaceAfter=24)))

    # Signature
    sig_name = doctor_name
    sig_specialty = pdf_config.get('specialty') or "Ginecólogo Obstetra - UCV"
    
    mpps = pdf_config.get('mpps_number', '140.795')
    cmdm = pdf_config.get('cmdm_number', '38.789')
    sig_ids = f"MPPS: {mpps} / CMDM: {cmdm}"
    
    ci = pdf_config.get('doctor_id', '13409534')
    sig_ci = f"C.I.: {ci}"
    
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
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_medical_report(report_data: dict, doctor_id: int, db: Session = None) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=legal, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
    story = []

    styleN = ParagraphStyle(name='Normal', fontName='Helvetica', fontSize=10, leading=12)
    styleB = ParagraphStyle(name='Bold', fontName='Helvetica-Bold', fontSize=10, leading=12)
    styleH1 = ParagraphStyle(name='Heading1', fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER, spaceAfter=6)
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
    doctor_name = pdf_config.get('doctor_name') or (doctor.nombre_completo if doctor else "Dra. Mariel Herrera")
    specialty = pdf_config.get('specialty') or (doctor.especialidad if doctor else "Especialista en Ginecología y Obstetricia")
    location = pdf_config.get('location') or "Caracas-Guarenas Guatire"
    phones = pdf_config.get('phones') or "04244281876-04127738918"
    
    header_text = f"<b>{doctor_name}</b><br/>{specialty}<br/>{location}<br/>Citas: {phones}"
    
    # Logo
    logo_image = ""
    logo_source = pdf_config.get('logo_header_1') or (doctor.logo_url if doctor else None)
    
    if logo_source:
        try:
            logo_path = get_local_path_from_url(logo_source)
            
            if logo_path and os.path.exists(logo_path):
                img_reader = ImageReader(logo_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                img = Image(logo_path, width=1.2*inch, height=(1.2*inch)*aspect)
                img.hAlign = 'CENTER'
                logo_image = img
        except Exception as e:
            logger.error(f"Error loading logo: {e}")
    
    # Header Table
    # Logo on left (col 0), Text on right (col 1)
    header_data = [[logo_image if logo_image else "", Paragraph(header_text, styleN)]]
    header_table = Table(header_data, colWidths=[1.5*inch, 5.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,0), 'CENTER'), # Logo centered in its cell
        ('ALIGN', (1,0), (1,0), 'LEFT'),   # Text left aligned next to logo
    ]))
    story.append(header_table)
    
    report_title =  "HISTORIA MÉDICA"
    story.append(Paragraph(f"<u>{report_title}</u>", styleH1))
    story.append(Spacer(1, 0.2*inch))

    # Patient Table
    patient_table_data = [
        [Paragraph("<b>Nombre:</b>", styleB), Paragraph(get_str('full_name').title(), styleN),
         Paragraph("<b>Edad:</b>", styleB), Paragraph(get_str('age'), styleN)],
        [Paragraph("<b>C.I.:</b>", styleB), Paragraph(get_str('ci'), styleN),
         Paragraph("<b>TLF:</b>", styleB), Paragraph(get_str('phone'), styleN)],
        [Paragraph("<b>Dirección:</b>", styleB), Paragraph(get_str('address').title(), styleN),
         Paragraph("<b>Ocupación:</b>", styleB), Paragraph(get_str('occupation').title(), styleN)],
        [Paragraph("<b>N° Historia:</b>", styleB), Paragraph(get_str('history_number', 'Pendiente'), styleN),
         Paragraph("", styleN), Paragraph("", styleN)],
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
        ("Antecedentes quirúrgicos", format_simple_antecedente(get_str('surgical_history')), styleN),
        ("Gineco-Obstétricos", get_str('summary_gyn_obstetric'), styleJustify),
        ("Examen Funcional", get_str('summary_functional_exam'), styleJustify),
        ("Hábitos", get_str('summary_habits'), styleJustify),
    ]

    for label, content, style_or_type in preconsulta_sections:
        if not content or content.isspace():
            continue
        
        label_p = Paragraph(f"<b>{label}:</b>", styleB)
        value_p_list = []
        
        if isinstance(style_or_type, ParagraphStyle):
            paragraphs = content.strip().split('<br/>')
            for p_text in paragraphs:
                if p_text.strip():
                    value_p_list.append(Paragraph(p_text, style_or_type))
        else:
            items = [item.strip() for item in content.strip().split('\n') if item.strip()]
            list_style = ParagraphStyle(name='ListItem', parent=styleN, leftIndent=12)
            for item_text in items:
                value_p_list.append(Paragraph(f"• {item_text}", list_style))
        
        if not value_p_list:
            value_p_list.append(Paragraph("No reportado.", styleN))

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
                label_p = Paragraph(f"<b>{label}:</b>", styleB)
                value_p_list = []
                
                # Only process content if it exists and is not empty
                if content and not content.isspace():
                    if isinstance(style_or_type, ParagraphStyle):
                        paragraphs = content.strip().split('<br/>')
                        for p_text in paragraphs:
                            if p_text.strip():
                                value_p_list.append(Paragraph(p_text, style_or_type))
                    else:
                        # List handling
                        items = [item.strip() for item in content.strip().split('\n') if item.strip()]
                        list_style = ParagraphStyle(name='ListItem', parent=styleN, leftIndent=12)
                        for item_text in items:
                            value_p_list.append(Paragraph(f"• {item_text}", list_style))
                
                # Always show the field, even if empty
                if not value_p_list:
                    value_p_list.append(Paragraph("No reportado.", styleN))

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

    doc.build(story)
    buffer.seek(0)
    return buffer
