from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta, timezone
from app.db.base import get_db
from app.db.models.doctor import Doctor
from app.db.models.cycle_predictor import CycleLog, SymptomLog
from app.cycle_predictor import schemas
from app.api.v1.endpoints.auth import get_current_user
from app.crud.admin import get_enabled_tenant_modules

router = APIRouter(prefix="/cycle-predictor", tags=["Cycle Predictor"])

# Module verification dependency
from app.db.models.cycle_user import CycleUser
from app.api.v1.endpoints.cycle_users import oauth2_scheme
from app.core.security import verify_access_token
from typing import Union

# Dependency to get either Doctor or CycleUser
def get_current_actor(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Union[Doctor, CycleUser]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    user_type: str = payload.get("user_type")
    
    if user_type == "cycle_user":
        user = db.query(CycleUser).filter(CycleUser.email == email).first()
    else:
        # Fallback to Doctor (assuming doctor emails are unique across system or managed here)
        # Note: In a real system, we should strictly check user_type/role
        user = db.query(Doctor).filter(Doctor.email == email).first()
        
    if user is None:
        raise credentials_exception
        
    return user

# Module verification dependency (Modified to allow CycleUser)
async def check_cycle_predictor_enabled(
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    """Verify cycle predictor module is enabled for this tenant/doctor."""
    doctor_id = current_actor.id if isinstance(current_actor, Doctor) else current_actor.doctor_id
    
    enabled_modules = get_enabled_tenant_modules(db, doctor_id)
    module_codes = [m.code for m in enabled_modules]
    
    if 'cycle_predictor' not in module_codes:
        raise HTTPException(
            status_code=403,
            detail="Cycle predictor module is not enabled"
        )
    return True

from app.cycle_predictor.logic import calculate_predictions

@router.get("/predictions", response_model=schemas.PredictionResponse, dependencies=[Depends(check_cycle_predictor_enabled)])
def get_predictions(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    # Determine filter
    if isinstance(current_actor, Doctor):
        filter_kwargs = {"doctor_id": current_actor.id}
    else:
        # Check if cycle_user_id column exists (robustness)
        # Assuming it exists now
        filter_kwargs = {"cycle_user_id": current_actor.id}

    # Get the most recent cycle
    last_cycle = db.query(CycleLog).filter_by(**filter_kwargs).order_by(CycleLog.start_date.desc()).first()
    
    # For now, we use defaults or doctor settings if we had them
    avg_cycle = 28
    avg_period = 5
    
    if not last_cycle:
        # No cycles recorded, return default predictions based on today
        start_date = date.today()
    else:
        start_date = last_cycle.start_date
        
    predictions = calculate_predictions(start_date, avg_cycle, avg_period)
    return predictions

@router.get("/stats", response_model=schemas.CycleStats, dependencies=[Depends(check_cycle_predictor_enabled)])
def get_stats(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    if isinstance(current_actor, Doctor):
        filter_kwargs = {"doctor_id": current_actor.id}
    else:
        filter_kwargs = {"cycle_user_id": current_actor.id}

    cycles = db.query(CycleLog).filter_by(**filter_kwargs).order_by(CycleLog.start_date.desc()).all()
    
    total_cycles = len(cycles)
    
    if total_cycles == 0:
        return {
            "total_cycles": 0,
            "avg_cycle_length": 28,
            "avg_period_length": 5,
            "cycle_range_min": 0,
            "cycle_range_max": 0
        }

    # Calculate Avg Period Length (duration of bleeding)
    total_period_days = 0
    valid_period_count = 0
    for c in cycles:
        if c.end_date:
            days = (c.end_date - c.start_date).days + 1
            total_period_days += days
            valid_period_count += 1
    
    avg_period = round(total_period_days / valid_period_count) if valid_period_count > 0 else 5

    # Calculate Avg Cycle Length (days between starts)
    # We can use stored cycle_length if available, or compute from start dates
    cycle_lengths = []
    
    # Method 1: Use stored values if robust
    # Method 2: Compute intervals between consecutive cycles (sorted desc)
    # Let's use computed intervals for better accuracy if stored values are missing
    sorted_cycles = sorted(cycles, key=lambda x: x.start_date)
    for i in range(len(sorted_cycles) - 1):
        length = (sorted_cycles[i+1].start_date - sorted_cycles[i].start_date).days
        if 20 <= length <= 45: # Filter reasonable cycle lengths
            cycle_lengths.append(length)

    if cycle_lengths:
        avg_cycle = round(sum(cycle_lengths) / len(cycle_lengths))
        min_cycle = min(cycle_lengths)
        max_cycle = max(cycle_lengths)
    else:
        avg_cycle = 28
        min_cycle = 28
        max_cycle = 28

    return {
        "total_cycles": total_cycles,
        "avg_cycle_length": avg_cycle,
        "avg_period_length": avg_period,
        "cycle_range_min": min_cycle,
        "cycle_range_max": max_cycle
    }


@router.get("/cycles", response_model=List[schemas.CycleLog], dependencies=[Depends(check_cycle_predictor_enabled)])
def get_cycles(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    if isinstance(current_actor, Doctor):
        # Doctors see ONLY logs they created for themselves? Or logs of their users?
        # Current logic (doctor_id == current.id) implies "Personal Doctor Logs" or "All Logs for Doctor".
        # Let's assume personal or all. 
        # Ideally: Doctor sees ALL logs associated with their doctor_id.
        return db.query(CycleLog).filter(CycleLog.doctor_id == current_actor.id).order_by(CycleLog.start_date.desc()).all()
    else:
        return db.query(CycleLog).filter(CycleLog.cycle_user_id == current_actor.id).order_by(CycleLog.start_date.desc()).all()

@router.post("/cycles", response_model=schemas.CycleLog, dependencies=[Depends(check_cycle_predictor_enabled)])
def create_cycle(
    cycle_in: schemas.CycleLogCreate,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    cycle_length = None
    if cycle_in.end_date:
        cycle_length = (cycle_in.end_date - cycle_in.start_date).days + 1
        
    db_cycle = CycleLog(
        start_date=cycle_in.start_date,
        end_date=cycle_in.end_date,
        cycle_length=cycle_length,
        notes=cycle_in.notes
    )

    if isinstance(current_actor, Doctor):
        db_cycle.doctor_id = current_actor.id
    else:
        db_cycle.cycle_user_id = current_actor.id
        db_cycle.doctor_id = current_actor.doctor_id # Associate with doctor too
        
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

@router.put("/cycles/{cycle_id}", response_model=schemas.CycleLog, dependencies=[Depends(check_cycle_predictor_enabled)])
def update_cycle(
    cycle_id: int,
    cycle_in: schemas.CycleLogUpdate,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    if isinstance(current_actor, Doctor):
        db_cycle = db.query(CycleLog).filter(CycleLog.id == cycle_id, CycleLog.doctor_id == current_actor.id).first()
    else:
        db_cycle = db.query(CycleLog).filter(CycleLog.id == cycle_id, CycleLog.cycle_user_id == current_actor.id).first()
        
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    
    update_data = cycle_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cycle, key, value)
    
    if db_cycle.start_date and db_cycle.end_date:
        db_cycle.cycle_length = (db_cycle.end_date - db_cycle.start_date).days + 1
    
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

@router.delete("/cycles/{cycle_id}", dependencies=[Depends(check_cycle_predictor_enabled)])
def delete_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    if isinstance(current_actor, Doctor):
        db_cycle = db.query(CycleLog).filter(CycleLog.id == cycle_id, CycleLog.doctor_id == current_actor.id).first()
    else:
         db_cycle = db.query(CycleLog).filter(CycleLog.id == cycle_id, CycleLog.cycle_user_id == current_actor.id).first()
         
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    
    db.delete(db_cycle)
    db.commit()
    return {"message": "Cycle deleted"}

@router.delete("/reset", dependencies=[Depends(check_cycle_predictor_enabled)])
def delete_all_data(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    cycle_user_id = current_actor.id if isinstance(current_actor, CycleUser) else None
    doctor_id = current_actor.id if isinstance(current_actor, Doctor) else None

    if cycle_user_id:
        filter_kwargs = {"cycle_user_id": cycle_user_id}
    else:
        # Doctor deleting their own logs (unlikely but supported for consistency)
        filter_kwargs = {"doctor_id": doctor_id}

    # Delete Cycles
    db.query(CycleLog).filter_by(**filter_kwargs).delete()
    
    # Delete Symptoms
    db.query(SymptomLog).filter_by(**filter_kwargs).delete()
    
    # Delete Pregnancy Logs (Only applicable for Cycle Users)
    if cycle_user_id:
        db.query(PregnancyLog).filter(PregnancyLog.cycle_user_id == cycle_user_id).delete()
        
    db.commit()
    return {"message": "All data deleted"}

@router.get("/symptoms", response_model=List[schemas.SymptomLog], dependencies=[Depends(check_cycle_predictor_enabled)])
def get_symptoms(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    if isinstance(current_actor, Doctor):
        return db.query(SymptomLog).filter(SymptomLog.doctor_id == current_actor.id).order_by(SymptomLog.date.desc()).all()
    else:
        return db.query(SymptomLog).filter(SymptomLog.cycle_user_id == current_actor.id).order_by(SymptomLog.date.desc()).all()

@router.post("/symptoms", response_model=schemas.SymptomLog, dependencies=[Depends(check_cycle_predictor_enabled)])
def create_symptom(
    symptom_in: schemas.SymptomLogCreate,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    db_symptom = SymptomLog(
        **symptom_in.model_dump()
    )
    
    if isinstance(current_actor, Doctor):
        db_symptom.doctor_id = current_actor.id
    else:
        db_symptom.cycle_user_id = current_actor.id
        db_symptom.doctor_id = current_actor.doctor_id

    db.add(db_symptom)
    db.commit()
    db.refresh(db_symptom)
    return db_symptom

@router.put("/symptoms/{symptom_id}", response_model=schemas.SymptomLog, dependencies=[Depends(check_cycle_predictor_enabled)])
def update_symptom(
    symptom_id: int,
    symptom_in: schemas.SymptomLogUpdate,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    if isinstance(current_actor, Doctor):
        db_symptom = db.query(SymptomLog).filter(SymptomLog.id == symptom_id, SymptomLog.doctor_id == current_actor.id).first()
    else:
        db_symptom = db.query(SymptomLog).filter(SymptomLog.id == symptom_id, SymptomLog.cycle_user_id == current_actor.id).first()
        
    if not db_symptom:
        raise HTTPException(status_code=404, detail="Symptom log not found")
    
    update_data = symptom_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_symptom, key, value)
        
    db.commit()
    db.refresh(db_symptom)
    return db_symptom

# --- Notification Settings ---

from app.db.models.cycle_predictor import CycleNotificationSettings, PregnancyLog

@router.get("/settings", response_model=schemas.NotificationSettings, dependencies=[Depends(check_cycle_predictor_enabled)])
def get_settings(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    cycle_user_id = current_actor.id if isinstance(current_actor, CycleUser) else None
    
    if not cycle_user_id:
         # Doctors might want to debug, but primary use is user
         raise HTTPException(status_code=400, detail="Settings only available for cycle users")

    settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == cycle_user_id).first()
    
    if not settings:
        # Create default
        settings = CycleNotificationSettings(cycle_user_id=cycle_user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    # Fetch custom rules from the user's doctor
    # We need to know the doctor_id. CycleUser has doctor_id.
    user = db.query(CycleUser).filter(CycleUser.id == cycle_user_id).first()
    if user and user.doctor_id:
        from app.db.models.notification import NotificationRule, NotificationType
        custom_rules = db.query(NotificationRule).filter(
            NotificationRule.tenant_id == user.doctor_id,
            NotificationRule.notification_type == 'custom', # Match enum value 'custom'
            NotificationRule.is_active == True
        ).all()
        
        # Populate logical available rules list
        settings.available_rules = [
            {"id": r.id, "name": r.name, "message_template": r.message_template}
            for r in custom_rules
        ]
    else:
        settings.available_rules = []

    return settings

from fastapi import BackgroundTasks
from app.tasks.email_tasks import send_settings_updated_email

@router.put("/settings", response_model=schemas.NotificationSettings, dependencies=[Depends(check_cycle_predictor_enabled)])
def update_settings(
    settings_in: schemas.NotificationSettingsUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    cycle_user_id = current_actor.id if isinstance(current_actor, CycleUser) else None
    if not cycle_user_id:
         raise HTTPException(status_code=400, detail="Settings only available for cycle users")
         
    db_settings = db.query(CycleNotificationSettings).filter(CycleNotificationSettings.cycle_user_id == cycle_user_id).first()
    
    if not db_settings:
        db_settings = CycleNotificationSettings(cycle_user_id=cycle_user_id)
        db.add(db_settings)
    
    update_data = settings_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_settings, key, value)
        
    db.commit()
    db.refresh(db_settings)
    
    # Send confirmation email
    background_tasks.add_task(send_settings_updated_email, cycle_user_id)
    
    return db_settings

# --- Pregnancy Mode ---

@router.post("/pregnancy", response_model=schemas.PregnancyLog, dependencies=[Depends(check_cycle_predictor_enabled)])
def start_pregnancy(
    pregnancy_in: schemas.PregnancyLogCreate,
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    cycle_user_id = current_actor.id if isinstance(current_actor, CycleUser) else None
    if not cycle_user_id:
         raise HTTPException(status_code=400, detail="Only users can log pregnancy")

    # Deactivate any active pregnancy
    active_preg = db.query(PregnancyLog).filter(PregnancyLog.cycle_user_id == cycle_user_id, PregnancyLog.is_active == True).first()
    if active_preg:
        active_preg.is_active = False
        active_preg.ended_at = datetime.now()
        
    # Create new log
    due_date = pregnancy_in.due_date
    if not due_date and pregnancy_in.last_period_date:
        # Simplified Naegele's rule: LMP + 280 days
        due_date = pregnancy_in.last_period_date + timedelta(days=280)

    db_log = PregnancyLog(
        cycle_user_id=cycle_user_id,
        is_active=True,
        last_period_date=pregnancy_in.last_period_date,
        due_date=due_date,
        notifications_enabled=pregnancy_in.notifications_enabled,
        created_at=datetime.now()
    )
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/pregnancy", response_model=Optional[schemas.PregnancyLog], dependencies=[Depends(check_cycle_predictor_enabled)])
def get_active_pregnancy(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    cycle_user_id = current_actor.id if isinstance(current_actor, CycleUser) else None
    if not cycle_user_id:
        return None

    active_preg = db.query(PregnancyLog).filter(PregnancyLog.cycle_user_id == cycle_user_id, PregnancyLog.is_active == True).first()
    return active_preg

@router.delete("/pregnancy", dependencies=[Depends(check_cycle_predictor_enabled)])
def end_pregnancy(
    db: Session = Depends(get_db),
    current_actor: Union[Doctor, CycleUser] = Depends(get_current_actor)
):
    """End active pregnancy and return to normal cycle tracking mode."""
    cycle_user_id = current_actor.id if isinstance(current_actor, CycleUser) else None
    if not cycle_user_id:
        raise HTTPException(status_code=400, detail="Only users can end pregnancy")

    active_preg = db.query(PregnancyLog).filter(
        PregnancyLog.cycle_user_id == cycle_user_id, 
        PregnancyLog.is_active == True
    ).first()
    
    if not active_preg:
        raise HTTPException(status_code=404, detail="No active pregnancy found")
    
    # Mark pregnancy as ended
    active_preg.is_active = False
    active_preg.ended_at = datetime.now()
    
    db.commit()
    return {"message": "Pregnancy ended successfully", "ended_at": active_preg.ended_at}
