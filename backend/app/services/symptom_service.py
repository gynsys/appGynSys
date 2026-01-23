"""
Service layer for symptom tracking operations.
Handles business logic and database interactions for symptoms.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date
from typing import List, Optional
from app.db.models.cycle_predictor import SymptomLog
from app.schemas.symptom import SymptomCreate, SymptomUpdate


def create_symptom(
    db: Session,
    cycle_user_id: int,
    doctor_id: int,
    symptom_data: SymptomCreate
) -> SymptomLog:
    """
    Create a new symptom log.
    
    Args:
        db: Database session
        cycle_user_id: ID of the cycle user
        doctor_id: ID of the doctor (for multi-tenancy)
        symptom_data: Symptom data to create
        
    Returns:
        Created SymptomLog instance
    """
    db_symptom = SymptomLog(
        cycle_user_id=cycle_user_id,
        doctor_id=doctor_id,
        date=symptom_data.date,
        flow_intensity=symptom_data.flow_intensity,
        pain_level=symptom_data.pain_level,
        mood=symptom_data.mood,
        symptoms=symptom_data.symptoms,
        notes=symptom_data.notes
    )
    db.add(db_symptom)
    db.commit()
    db.refresh(db_symptom)
    return db_symptom


def get_symptoms(
    db: Session,
    cycle_user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[SymptomLog]:
    """
    Get all symptom logs for a user, optionally filtered by date range.
    
    Args:
        db: Database session
        cycle_user_id: ID of the cycle user
        start_date: Optional start date for filtering
        end_date: Optional end date for filtering
        
    Returns:
        List of SymptomLog instances
    """
    query = db.query(SymptomLog).filter(SymptomLog.cycle_user_id == cycle_user_id)
    
    if start_date:
        query = query.filter(SymptomLog.date >= start_date)
    if end_date:
        query = query.filter(SymptomLog.date <= end_date)
    
    return query.order_by(SymptomLog.date.desc()).all()


def get_symptom(
    db: Session,
    symptom_id: int,
    cycle_user_id: int
) -> Optional[SymptomLog]:
    """
    Get a single symptom log by ID with ownership check.
    
    Args:
        db: Database session
        symptom_id: ID of the symptom log
        cycle_user_id: ID of the cycle user (for ownership verification)
        
    Returns:
        SymptomLog instance or None
    """
    return db.query(SymptomLog).filter(
        and_(
            SymptomLog.id == symptom_id,
            SymptomLog.cycle_user_id == cycle_user_id
        )
    ).first()


def update_symptom(
    db: Session,
    symptom_id: int,
    cycle_user_id: int,
    update_data: SymptomUpdate
) -> Optional[SymptomLog]:
    """
    Update a symptom log with ownership check.
    
    Args:
        db: Database session
        symptom_id: ID of the symptom log
        cycle_user_id: ID of the cycle user (for ownership verification)
        update_data: Data to update
        
    Returns:
        Updated SymptomLog instance or None if not found
    """
    db_symptom = get_symptom(db, symptom_id, cycle_user_id)
    if not db_symptom:
        return None
    
    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_symptom, field, value)
    
    db.commit()
    db.refresh(db_symptom)
    return db_symptom


def delete_symptom(
    db: Session,
    symptom_id: int,
    cycle_user_id: int
) -> bool:
    """
    Delete a symptom log with ownership check.
    
    Args:
        db: Database session
        symptom_id: ID of the symptom log
        cycle_user_id: ID of the cycle user (for ownership verification)
        
    Returns:
        True if deleted, False if not found
    """
    db_symptom = get_symptom(db, symptom_id, cycle_user_id)
    if not db_symptom:
        return False
    
    db.delete(db_symptom)
    db.commit()
    return True
