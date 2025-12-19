
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from ml_service import MLService
from llm_service import LLMService
import os

from fastapi.middleware.cors import CORSMiddleware

# Try to import Supabase service (graceful fallback if not configured)
try:
    from supabase_service import SupabaseService
    supabase_service = SupabaseService()
    SUPABASE_ENABLED = True
except Exception as e:
    print(f"Supabase not configured: {e}")
    supabase_service = None
    SUPABASE_ENABLED = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "Backend is running", 
        "service": "Symptom Analysis API",
        "supabase_enabled": SUPABASE_ENABLED
    }

# Paths - Using relative paths for portability
# Backend is in: Dataset 2/symptom-analysis-web/backend
# ML folder is in: Dataset 2/ML
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)  # symptom-analysis-web
DATASET_ROOT = os.path.dirname(PROJECT_ROOT)  # Dataset 2

ML_PATH = os.path.join(DATASET_ROOT, "ML")
MODEL_PATH = os.path.join(ML_PATH, "model_100percent.pkl")
MAPPINGS_PATH = os.path.join(ML_PATH, "mappings_100percent.pkl")

# Initialize Services
ml_service = MLService(MODEL_PATH, MAPPINGS_PATH)
llm_service = LLMService()

# Confidence threshold
CONFIDENCE_THRESHOLD = 70

# ===== Auth Helper =====

async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict]:
    """Extract and verify user from Authorization header."""
    if not authorization or not SUPABASE_ENABLED:
        return None
    
    try:
        # Expect "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        user = supabase_service.verify_token(token)
        return user
    except Exception:
        return None

# ===== Request/Response Models =====

class DiagnoseRequest(BaseModel):
    symptoms: List[str]
    history: Optional[str] = ""
    medications: Optional[str] = ""

class AskRequest(BaseModel):
    """Request for iterative Q&A (questions 2 and 3)"""
    symptoms: List[str]
    top_diseases: List[Dict]
    question_number: int  # Current question number (1, 2, or 3)
    qa_history: List[Dict]  # Previous Q&A: [{"question": "...", "answer": "yes/no"}, ...]

class DiagnoseResponse(BaseModel):
    action: str  # "show_report" or "ask_question"
    confidence_score: float
    top_diseases: Optional[List[Dict]] = None
    # For show_report
    report: Optional[Dict] = None
    # For ask_question
    question: Optional[str] = None
    question_number: Optional[int] = None

class AskResponse(BaseModel):
    action: str  # "ask_question" or "show_report"
    # For ask_question
    question: Optional[str] = None
    question_number: Optional[int] = None
    # For show_report (after 3rd question answered)
    report: Optional[Dict] = None

# ===== Auth Models =====

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    dob: Optional[str] = ""
    gender: Optional[str] = ""
    medical_history: Optional[str] = ""
    medications: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    medications: Optional[str] = None

# ===== Auth Endpoints =====

@app.post("/auth/register")
async def register(request: RegisterRequest):
    """Register a new user with email/password and profile data."""
    if not SUPABASE_ENABLED:
        raise HTTPException(status_code=503, detail="Authentication service not configured")
    
    try:
        # Register user
        result = supabase_service.register_user(request.email, request.password)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Registration failed"))
        
        user_id = result["user_id"]
        
        # Create profile with encrypted data (non-blocking - log errors but don't fail)
        try:
            profile_result = supabase_service.create_profile(
                user_id=user_id,
                email=request.email,
                profile_data={
                    "name": request.name,
                    "dob": request.dob,
                    "gender": request.gender,
                    "medical_history": request.medical_history,
                    "medications": request.medications
                }
            )
            if not profile_result.get("success"):
                print(f"Profile creation warning: {profile_result.get('error')}")
        except Exception as profile_err:
            print(f"Profile creation error (non-fatal): {profile_err}")
        
        return {
            "success": True,
            "user_id": user_id,
            "access_token": result.get("access_token"),
            "email": request.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Login with email/password and get JWT token."""
    if not SUPABASE_ENABLED:
        raise HTTPException(status_code=503, detail="Authentication service not configured")
    
    try:
        result = supabase_service.login_user(request.email, request.password)
        
        if not result.get("success"):
            raise HTTPException(status_code=401, detail=result.get("error", "Invalid credentials"))
        
        # Get profile
        profile = supabase_service.get_profile(result["user_id"])
        
        return {
            "success": True,
            "user_id": result["user_id"],
            "email": result["email"],
            "access_token": result["access_token"],
            "refresh_token": result.get("refresh_token"),
            "profile": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me")
async def get_me(user: Optional[Dict] = Depends(get_current_user)):
    """Get current user profile."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    profile = supabase_service.get_profile(user["user_id"])
    # Return empty profile if not found (user exists but profile wasn't created)
    if not profile:
        profile = {
            "id": user["user_id"],
            "email": user.get("email", ""),
            "name": "",
            "dob": "",
            "gender": "",
            "medical_history": "",
            "medications": ""
        }
    
    return {"success": True, "profile": profile}

@app.put("/auth/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    user: Optional[Dict] = Depends(get_current_user)
):
    """Update user profile."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = request.model_dump(exclude_none=True)
    result = supabase_service.update_profile(user["user_id"], update_data)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return {"success": True, "message": "Profile updated"}

@app.get("/events")
async def get_events(user: Optional[Dict] = Depends(get_current_user)):
    """Get user's diagnostic history."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    events = supabase_service.get_diagnostic_history(user["user_id"])
    return {"success": True, "events": events}

# ===== Diagnosis Endpoints =====

@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(
    request: DiagnoseRequest,
    user: Optional[Dict] = Depends(get_current_user)
):
    """
    Initial diagnosis endpoint.
    - If confidence >= 70%: Returns comprehensive report directly
    - If confidence < 70%: Returns first question for iterative Q&A
    """
    try:
        # Get ML Prediction
        current_symptoms = request.symptoms
        top_diseases, confidence = ml_service.predict(current_symptoms)
        
        # Check Confidence Threshold
        if confidence >= CONFIDENCE_THRESHOLD:
            # HIGH CONFIDENCE - Generate comprehensive report directly
            report = llm_service.generate_comprehensive_report(current_symptoms, top_diseases)
            
            # Log event if user is authenticated
            if user and SUPABASE_ENABLED:
                supabase_service.log_diagnostic_event(user["user_id"], {
                    "symptoms": current_symptoms,
                    "disease": report.get("disease"),
                    "confidence": confidence,
                    "triage_level": report.get("triage_level"),
                    "specialist": report.get("specialist")
                })
            
            return {
                "action": "show_report",
                "confidence_score": confidence,
                "top_diseases": top_diseases,
                "report": report
            }
        else:
            # LOW CONFIDENCE - Start iterative Q&A
            # Generate first question
            question = llm_service.generate_single_question(
                symptoms=current_symptoms,
                top_diseases=top_diseases,
                qa_history=[],
                question_number=1
            )
            return {
                "action": "ask_question",
                "confidence_score": confidence,
                "top_diseases": top_diseases,
                "question": question,
                "question_number": 1
            }

    except Exception as e:
        print(f"Error in /diagnose: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask", response_model=AskResponse)
async def ask_followup(
    request: AskRequest,
    user: Optional[Dict] = Depends(get_current_user)
):
    """
    Iterative Q&A endpoint for low-confidence diagnoses.
    
    - Call after receiving an answer to generate the next question
    - After 3 Q&A rounds, returns the final narrowed report
    """
    try:
        # Validate question number
        if request.question_number < 1 or request.question_number > 3:
            raise HTTPException(status_code=400, detail="question_number must be 1, 2, or 3")
        
        # Check if we have enough Q&A history
        if len(request.qa_history) != request.question_number:
            raise HTTPException(
                status_code=400, 
                detail=f"Expected {request.question_number} Q&A pairs in history, got {len(request.qa_history)}"
            )
        
        if request.question_number < 3:
            # Generate next question (2 or 3)
            next_question_number = request.question_number + 1
            question = llm_service.generate_single_question(
                symptoms=request.symptoms,
                top_diseases=request.top_diseases,
                qa_history=request.qa_history,
                question_number=next_question_number
            )
            return {
                "action": "ask_question",
                "question": question,
                "question_number": next_question_number
            }
        else:
            # All 3 questions answered - Generate final narrowed report
            report = llm_service.generate_final_narrowed_report(
                symptoms=request.symptoms,
                top_diseases=request.top_diseases,
                qa_history=request.qa_history
            )
            
            # Log event if user is authenticated
            if user and SUPABASE_ENABLED:
                # Get confidence from first disease
                confidence = request.top_diseases[0].get("probability", 0) if request.top_diseases else 0
                supabase_service.log_diagnostic_event(user["user_id"], {
                    "symptoms": request.symptoms,
                    "disease": report.get("disease"),
                    "confidence": confidence,
                    "triage_level": report.get("triage_level"),
                    "specialist": report.get("specialist")
                })
            
            return {
                "action": "show_report",
                "report": report
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== Legacy Endpoint (for compatibility) =====

class FinalizeRequest(BaseModel):
    symptoms: List[str]
    top_diseases: List[dict]
    conversation_history: str

@app.post("/finalize")
async def finalize_diagnosis(request: FinalizeRequest):
    """Legacy endpoint - kept for backward compatibility"""
    try:
        report = llm_service.generate_comprehensive_report(
            request.symptoms, 
            request.top_diseases
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
