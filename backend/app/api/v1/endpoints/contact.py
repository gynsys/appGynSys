from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.crud import admin as crud_admin
from app.tasks.email_tasks import _send_smtp_email

router = APIRouter()

class ContactRequest(BaseModel):
    doctor_slug: str
    name: str
    email: EmailStr
    phone: str
    message: str

@router.post("/", status_code=200)
def send_contact_email(
    contact_data: ContactRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Send a contact email to the doctor.
    """
    doctor = crud_admin.get_tenant_by_slug(db, slug=contact_data.doctor_slug)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Determine recipient email
    recipient_email = doctor.contact_email or doctor.email
    
    if not recipient_email:
        raise HTTPException(status_code=500, detail="Doctor has no email configured")

    # Construct email content
    subject = f"Nuevo mensaje de contacto de {contact_data.name}"
    html_content = f"""
    <html>
        <body>
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> {contact_data.name}</p>
            <p><strong>Email:</strong> {contact_data.email}</p>
            <p><strong>Teléfono:</strong> {contact_data.phone}</p>
            <p><strong>Mensaje:</strong></p>
            <p>{contact_data.message}</p>
            <br>
            <p>Este mensaje fue enviado desde tu sitio web GynSys.</p>
        </body>
    </html>
    """

    # Send email (using background task to avoid blocking)
    background_tasks.add_task(
        _send_smtp_email,
        to_email=recipient_email,
        subject=subject,
        html_content=html_content
    )

    return {"message": "Email sent successfully"}
