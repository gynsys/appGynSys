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

@router.get("/endometriosis/stats")
def get_endometriosis_stats(
    db: Session = Depends(get_db)
):
    """
    Get aggregated statistics for endometriosis test results.
    """
    from sqlalchemy import func
    
    # Total count
    total_count = db.query(EndometriosisResult).count()
    
    # Group by result_level
    level_stats = db.query(
        EndometriosisResult.result_level, 
        func.count(EndometriosisResult.id)
    ).group_by(EndometriosisResult.result_level).all()
    
    # Format level stats for chart
    level_distribution = [
        {"name": level, "value": count} 
        for level, count in level_stats
    ]
    
    # Score distribution (0-10)
    score_stats = db.query(
        EndometriosisResult.score,
        func.count(EndometriosisResult.id)
    ).group_by(EndometriosisResult.score).order_by(EndometriosisResult.score).all()
    
    score_distribution = [
        {"score": score, "count": count}
        for score, count in score_stats
    ]

    return {
        "total": total_count,
        "level_distribution": level_distribution,
        "score_distribution": score_distribution
    }
