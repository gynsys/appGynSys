from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'gyntrack-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    average_cycle_length: int = 28
    average_period_length: int = 5
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    average_cycle_length: Optional[int] = None
    average_period_length: Optional[int] = None

class CycleLogCreate(BaseModel):
    start_date: str  # ISO format date
    end_date: Optional[str] = None
    notes: Optional[str] = None

class CycleLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    start_date: str
    end_date: Optional[str] = None
    cycle_length: Optional[int] = None
    notes: Optional[str] = None
    created_at: str

class SymptomLogCreate(BaseModel):
    date: str  # ISO format date
    flow_intensity: Optional[str] = None  # light, medium, heavy
    pain_level: Optional[int] = None  # 0-10
    mood: Optional[str] = None  # happy, sad, anxious, irritable, calm
    symptoms: Optional[List[str]] = []  # headache, cramps, bloating, fatigue, etc.
    notes: Optional[str] = None

class SymptomLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    date: str
    flow_intensity: Optional[str] = None
    pain_level: Optional[int] = None
    mood: Optional[str] = None
    symptoms: List[str] = []
    notes: Optional[str] = None
    created_at: str

class PredictionResponse(BaseModel):
    next_period_start: str
    next_period_end: str
    ovulation_date: str
    fertile_window_start: str
    fertile_window_end: str
    pregnancy_probability: str  # low, medium, high
    cycle_day: int
    phase: str  # menstrual, follicular, ovulation, luteal

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_predictions(last_period_start: str, cycle_length: int = 28, period_length: int = 5) -> dict:
    """Calculate menstrual predictions based on last period"""
    last_start = datetime.fromisoformat(last_period_start.replace('Z', '+00:00')).date()
    today = datetime.now(timezone.utc).date()
    
    # Calculate cycle day
    days_since_start = (today - last_start).days
    cycle_day = (days_since_start % cycle_length) + 1
    
    # Next period
    cycles_passed = days_since_start // cycle_length
    next_period_start = last_start + timedelta(days=(cycles_passed + 1) * cycle_length)
    if next_period_start <= today:
        next_period_start = last_start + timedelta(days=(cycles_passed + 2) * cycle_length)
    next_period_end = next_period_start + timedelta(days=period_length - 1)
    
    # Ovulation (typically 14 days before next period)
    ovulation_date = next_period_start - timedelta(days=14)
    
    # Fertile window (5 days before ovulation + ovulation day)
    fertile_window_start = ovulation_date - timedelta(days=5)
    fertile_window_end = ovulation_date + timedelta(days=1)
    
    # Determine phase
    if cycle_day <= period_length:
        phase = "menstrual"
    elif cycle_day <= cycle_length - 14:
        phase = "follicular"
    elif cycle_day <= cycle_length - 12:
        phase = "ovulation"
    else:
        phase = "luteal"
    
    # Pregnancy probability based on cycle day
    days_to_ovulation = (ovulation_date - today).days
    if -1 <= days_to_ovulation <= 1:
        pregnancy_probability = "high"
    elif -3 <= days_to_ovulation <= 3:
        pregnancy_probability = "medium"
    else:
        pregnancy_probability = "low"
    
    return {
        "next_period_start": next_period_start.isoformat(),
        "next_period_end": next_period_end.isoformat(),
        "ovulation_date": ovulation_date.isoformat(),
        "fertile_window_start": fertile_window_start.isoformat(),
        "fertile_window_end": fertile_window_end.isoformat(),
        "pregnancy_probability": pregnancy_probability,
        "cycle_day": cycle_day,
        "phase": phase
    }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "average_cycle_length": 28,
        "average_period_length": 5,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        average_cycle_length=28,
        average_period_length=5,
        created_at=now
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        average_cycle_length=user.get("average_cycle_length", 28),
        average_period_length=user.get("average_period_length", 5),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.put("/auth/me", response_model=UserResponse)
async def update_me(updates: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
        current_user.update(update_data)
    return UserResponse(**current_user)

# ==================== CYCLE ROUTES ====================

@api_router.post("/cycles", response_model=CycleLogResponse)
async def create_cycle(cycle_data: CycleLogCreate, current_user: dict = Depends(get_current_user)):
    cycle_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate cycle length if end_date provided
    cycle_length = None
    if cycle_data.end_date:
        start = datetime.fromisoformat(cycle_data.start_date)
        end = datetime.fromisoformat(cycle_data.end_date)
        cycle_length = (end - start).days + 1
    
    cycle_doc = {
        "id": cycle_id,
        "user_id": current_user["id"],
        "start_date": cycle_data.start_date,
        "end_date": cycle_data.end_date,
        "cycle_length": cycle_length,
        "notes": cycle_data.notes,
        "created_at": now
    }
    
    await db.cycles.insert_one(cycle_doc)
    return CycleLogResponse(**cycle_doc)

@api_router.get("/cycles", response_model=List[CycleLogResponse])
async def get_cycles(current_user: dict = Depends(get_current_user)):
    cycles = await db.cycles.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("start_date", -1).to_list(100)
    return [CycleLogResponse(**c) for c in cycles]

@api_router.put("/cycles/{cycle_id}", response_model=CycleLogResponse)
async def update_cycle(cycle_id: str, cycle_data: CycleLogCreate, current_user: dict = Depends(get_current_user)):
    cycle = await db.cycles.find_one({"id": cycle_id, "user_id": current_user["id"]}, {"_id": 0})
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    
    cycle_length = None
    if cycle_data.end_date:
        start = datetime.fromisoformat(cycle_data.start_date)
        end = datetime.fromisoformat(cycle_data.end_date)
        cycle_length = (end - start).days + 1
    
    update_data = {
        "start_date": cycle_data.start_date,
        "end_date": cycle_data.end_date,
        "cycle_length": cycle_length,
        "notes": cycle_data.notes
    }
    
    await db.cycles.update_one({"id": cycle_id}, {"$set": update_data})
    cycle.update(update_data)
    return CycleLogResponse(**cycle)

@api_router.delete("/cycles/{cycle_id}")
async def delete_cycle(cycle_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cycles.delete_one({"id": cycle_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return {"message": "Cycle deleted"}

# ==================== SYMPTOM ROUTES ====================

@api_router.post("/symptoms", response_model=SymptomLogResponse)
async def create_symptom(symptom_data: SymptomLogCreate, current_user: dict = Depends(get_current_user)):
    symptom_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    symptom_doc = {
        "id": symptom_id,
        "user_id": current_user["id"],
        "date": symptom_data.date,
        "flow_intensity": symptom_data.flow_intensity,
        "pain_level": symptom_data.pain_level,
        "mood": symptom_data.mood,
        "symptoms": symptom_data.symptoms or [],
        "notes": symptom_data.notes,
        "created_at": now
    }
    
    await db.symptoms.insert_one(symptom_doc)
    return SymptomLogResponse(**symptom_doc)

@api_router.get("/symptoms", response_model=List[SymptomLogResponse])
async def get_symptoms(current_user: dict = Depends(get_current_user)):
    symptoms = await db.symptoms.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("date", -1).to_list(100)
    return [SymptomLogResponse(**s) for s in symptoms]

@api_router.get("/symptoms/{date}", response_model=Optional[SymptomLogResponse])
async def get_symptom_by_date(date: str, current_user: dict = Depends(get_current_user)):
    symptom = await db.symptoms.find_one(
        {"user_id": current_user["id"], "date": date}, 
        {"_id": 0}
    )
    if symptom:
        return SymptomLogResponse(**symptom)
    return None

@api_router.put("/symptoms/{symptom_id}", response_model=SymptomLogResponse)
async def update_symptom(symptom_id: str, symptom_data: SymptomLogCreate, current_user: dict = Depends(get_current_user)):
    symptom = await db.symptoms.find_one({"id": symptom_id, "user_id": current_user["id"]}, {"_id": 0})
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom log not found")
    
    update_data = symptom_data.model_dump()
    await db.symptoms.update_one({"id": symptom_id}, {"$set": update_data})
    symptom.update(update_data)
    return SymptomLogResponse(**symptom)

# ==================== PREDICTION ROUTES ====================

@api_router.get("/predictions", response_model=PredictionResponse)
async def get_predictions(current_user: dict = Depends(get_current_user)):
    # Get the most recent cycle
    last_cycle = await db.cycles.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0},
        sort=[("start_date", -1)]
    )
    
    if not last_cycle:
        # No cycles recorded, return default predictions based on today
        today = datetime.now(timezone.utc).date().isoformat()
        predictions = calculate_predictions(
            today,
            current_user.get("average_cycle_length", 28),
            current_user.get("average_period_length", 5)
        )
    else:
        predictions = calculate_predictions(
            last_cycle["start_date"],
            current_user.get("average_cycle_length", 28),
            current_user.get("average_period_length", 5)
        )
    
    return PredictionResponse(**predictions)

@api_router.get("/calendar-data")
async def get_calendar_data(current_user: dict = Depends(get_current_user)):
    """Get all data needed for calendar display"""
    cycles = await db.cycles.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).to_list(100)
    
    symptoms = await db.symptoms.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).to_list(365)
    
    # Get predictions
    predictions = None
    if cycles:
        last_cycle = max(cycles, key=lambda x: x["start_date"])
        predictions = calculate_predictions(
            last_cycle["start_date"],
            current_user.get("average_cycle_length", 28),
            current_user.get("average_period_length", 5)
        )
    
    return {
        "cycles": cycles,
        "symptoms": symptoms,
        "predictions": predictions,
        "user_settings": {
            "average_cycle_length": current_user.get("average_cycle_length", 28),
            "average_period_length": current_user.get("average_period_length", 5)
        }
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "GynTrack API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router and setup middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
