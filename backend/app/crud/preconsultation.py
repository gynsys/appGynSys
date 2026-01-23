from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.preconsultation import PreconsultationQuestion
from app.schemas.preconsultation import PreconsultationQuestionCreate, PreconsultationQuestionUpdate

def get_question(db: Session, question_id: str):
    return db.query(PreconsultationQuestion).filter(PreconsultationQuestion.id == question_id).first()

def get_questions(db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
    return db.query(PreconsultationQuestion).filter(PreconsultationQuestion.doctor_id == doctor_id).order_by(PreconsultationQuestion.order).offset(skip).limit(limit).all()

def create_question(db: Session, question: PreconsultationQuestionCreate, doctor_id: int):
    # Ensure doctor_id is set
    db_question = PreconsultationQuestion(**question.dict(), doctor_id=doctor_id)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def update_question(db: Session, question_id: str, question: PreconsultationQuestionUpdate):
    db_question = get_question(db, question_id)
    if not db_question:
        return None
    
    update_data = question.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_question, key, value)
        
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def delete_question(db: Session, question_id: str):
    db_question = get_question(db, question_id)
    if db_question:
        db.delete(db_question)
        db.commit()
    return db_question

def delete_all_questions(db: Session, doctor_id: int):
    num_deleted = db.query(PreconsultationQuestion).filter(PreconsultationQuestion.doctor_id == doctor_id).delete()
    db.commit()
    return num_deleted
