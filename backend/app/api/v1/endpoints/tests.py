from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.base import get_db
# from app.api.v1.endpoints.auth import get_current_user_optional, get_current_user
from app.db.models.endometriosis_result import EndometriosisResult
from app.db.models.doctor import Doctor

router = APIRouter()

class TestResultCreate(BaseModel):
    doctor_id: int
    score: int
    total_questions: int
    result_level: str
    patient_identifier: str | None = None

@router.post("/endometriosis")
def save_endometriosis_test(
    result_in: TestResultCreate,
    db: Session = Depends(get_db)
):
    """
    Save an anonymous or identified endometriosis test result.
    """
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == result_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    db_obj = EndometriosisResult(
        doctor_id=result_in.doctor_id,
        score=result_in.score,
        total_questions=result_in.total_questions,
        result_level=result_in.result_level,
        patient_identifier=result_in.patient_identifier
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return {"status": "success", "id": db_obj.id}
