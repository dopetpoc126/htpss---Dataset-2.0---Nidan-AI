"""
Supabase service using direct HTTP calls (no C++ dependencies).
Handles user authentication, profile management, and event logging.
"""
import os
import httpx
from typing import Optional, Dict, List
from dotenv import load_dotenv
from encryption_service import EncryptionService

load_dotenv()

class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.url or not self.service_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env")
        
        self.encryption = EncryptionService()
        
        # Headers for API requests
        self.auth_headers = {
            "apikey": self.anon_key,
            "Content-Type": "application/json"
        }
        self.service_headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    # ===== AUTHENTICATION =====
    
    def register_user(self, email: str, password: str) -> Dict:
        """Register a new user with email and password."""
        try:
            with httpx.Client() as client:
                response = client.post(
                    f"{self.url}/auth/v1/signup",
                    headers=self.auth_headers,
                    json={"email": email, "password": password}
                )
                data = response.json()
                print(f"[DEBUG] Supabase signup response: {response.status_code} - {data}")
                
                # Handle both response formats:
                # 1. With session: {"user": {...}, "access_token": "..."}
                # 2. Without session (email confirm): {"id": "...", "email": "..."}
                user_data = data.get("user") or data
                
                if response.status_code == 200 and user_data.get("id"):
                    return {
                        "success": True,
                        "user_id": user_data["id"],
                        "email": user_data.get("email"),
                        "access_token": data.get("access_token")  # May be None if email confirm enabled
                    }
                else:
                    error_msg = data.get("error_description") or data.get("msg") or data.get("error") or "Registration failed"
                    return {"success": False, "error": error_msg}
                    
        except Exception as e:
            print(f"[DEBUG] Signup exception: {e}")
            return {"success": False, "error": str(e)}
    
    def login_user(self, email: str, password: str) -> Dict:
        """Login user and return session token."""
        try:
            with httpx.Client() as client:
                response = client.post(
                    f"{self.url}/auth/v1/token?grant_type=password",
                    headers=self.auth_headers,
                    json={"email": email, "password": password}
                )
                data = response.json()
                print(f"[DEBUG] Login response: {response.status_code} - {data}")
                
                if response.status_code == 200 and data.get("access_token"):
                    return {
                        "success": True,
                        "user_id": data["user"]["id"],
                        "email": data["user"]["email"],
                        "access_token": data["access_token"],
                        "refresh_token": data.get("refresh_token")
                    }
                else:
                    # Handle specific errors
                    error_msg = data.get("error_description") or data.get("msg") or data.get("error") or "Invalid credentials"
                    # Check for unconfirmed email
                    if "not confirmed" in str(error_msg).lower() or data.get("error") == "invalid_grant":
                        error_msg = "Please confirm your email before logging in. Check your inbox."
                    return {"success": False, "error": error_msg}
                    
        except Exception as e:
            print(f"[DEBUG] Login exception: {e}")
            return {"success": False, "error": str(e)}
    
    def verify_token(self, access_token: str) -> Optional[Dict]:
        """Verify JWT token and return user info."""
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.url}/auth/v1/user",
                    headers={
                        "apikey": self.anon_key,
                        "Authorization": f"Bearer {access_token}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "user_id": data["id"],
                        "email": data["email"]
                    }
                return None
        except Exception:
            return None
    
    # ===== USER PROFILE =====
    
    def create_profile(self, user_id: str, email: str, profile_data: Dict) -> Dict:
        """Create user profile with encrypted sensitive fields."""
        try:
            encrypted_data = {
                "id": user_id,
                "email": email,
                "name": profile_data.get("name", ""),
                "dob": self.encryption.encrypt(profile_data.get("dob", "")),
                "gender": profile_data.get("gender", ""),
                "medical_history": self.encryption.encrypt(profile_data.get("medical_history", "")),
                "medications": self.encryption.encrypt(profile_data.get("medications", ""))
            }
            
            print(f"[DEBUG] Creating profile for user {user_id}")
            
            with httpx.Client() as client:
                response = client.post(
                    f"{self.url}/rest/v1/user_profiles",
                    headers=self.service_headers,
                    json=encrypted_data
                )
                
                print(f"[DEBUG] Profile creation response: {response.status_code} - {response.text}")
                
                if response.status_code in [200, 201]:
                    return {"success": True}
                else:
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            print(f"[DEBUG] Profile creation exception: {e}")
            return {"success": False, "error": str(e)}
    
    def get_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile and decrypt sensitive fields."""
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.url}/rest/v1/user_profiles",
                    headers=self.service_headers,
                    params={"id": f"eq.{user_id}", "select": "*"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        profile = data[0]
                        return {
                            "id": profile["id"],
                            "email": profile["email"],
                            "name": profile.get("name", ""),
                            "dob": self.encryption.decrypt(profile.get("dob", "")),
                            "gender": profile.get("gender", ""),
                            "medical_history": self.encryption.decrypt(profile.get("medical_history", "")),
                            "medications": self.encryption.decrypt(profile.get("medications", "")),
                            "created_at": profile.get("created_at")
                        }
            return None
            
        except Exception as e:
            print(f"Get profile error: {e}")
            return None
    
    def update_profile(self, user_id: str, profile_data: Dict) -> Dict:
        """Update user profile with encrypted sensitive fields."""
        try:
            update_data = {}
            
            if "name" in profile_data:
                update_data["name"] = profile_data["name"]
            if "dob" in profile_data:
                update_data["dob"] = self.encryption.encrypt(profile_data["dob"])
            if "gender" in profile_data:
                update_data["gender"] = profile_data["gender"]
            if "medical_history" in profile_data:
                update_data["medical_history"] = self.encryption.encrypt(profile_data["medical_history"])
            if "medications" in profile_data:
                update_data["medications"] = self.encryption.encrypt(profile_data["medications"])
            
            with httpx.Client() as client:
                response = client.patch(
                    f"{self.url}/rest/v1/user_profiles",
                    headers=self.service_headers,
                    params={"id": f"eq.{user_id}"},
                    json=update_data
                )
                
                if response.status_code in [200, 204]:
                    return {"success": True}
                else:
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ===== DIAGNOSTIC EVENTS =====
    
    def log_diagnostic_event(self, user_id: str, event_data: Dict) -> Dict:
        """Log a diagnostic event for the user."""
        try:
            event = {
                "user_id": user_id,
                "symptoms": event_data.get("symptoms", []),
                "predicted_disease": event_data.get("disease", "Unknown"),
                "confidence_score": event_data.get("confidence", 0),
                "triage_level": event_data.get("triage_level", "minimal"),
                "specialist_recommended": event_data.get("specialist", "General Physician")
            }
            
            with httpx.Client() as client:
                response = client.post(
                    f"{self.url}/rest/v1/diagnostic_events",
                    headers=self.service_headers,
                    json=event
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    return {"success": True, "event_id": result[0]["id"] if result else None}
                else:
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            print(f"Log event error: {e}")
            return {"success": False, "error": str(e)}
    
    def get_diagnostic_history(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get user's diagnostic history."""
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.url}/rest/v1/diagnostic_events",
                    headers=self.service_headers,
                    params={
                        "user_id": f"eq.{user_id}",
                        "select": "*",
                        "order": "created_at.desc",
                        "limit": limit
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                return []
                
        except Exception as e:
            print(f"Get history error: {e}")
            return []
