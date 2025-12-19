
import requests
import json
import sys

try:
    print("Testing Backend Connection...")
    # 1. Test Root
    r = requests.get("http://localhost:8000/")
    print(f"Root Endpoint: Status {r.status_code}")
    print(f"Response: {r.text}")
    
    if r.status_code != 200:
        print("❌ Backend root not 200 OK.")
        sys.exit(1)

    # 2. Test Diagnose
    print("\nTesting Diagnosis Endpoint...")
    payload = {
        "symptoms": ["itching", "skin_rash"],
        "history": "None",
        "medications": "None"
    }
    r = requests.post("http://localhost:8000/diagnose", json=payload)
    print(f"Diagnose Endpoint: Status {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print("✅ SUCCESS! Backend is working.")
        print("Response Snippet:", json.dumps(data, indent=2)[:200], "...")
    else:
        print(f"❌ Diagnosis failed: {r.text}")
        
except requests.exceptions.ConnectionError:
    print("\n❌ CRITICAL: Could not connect to http://localhost:8000")
    print("The backend server is NOT running.")
    print("Please open a terminal, cd to backend, and run 'python main.py'")
except Exception as e:
    print(f"\n❌ Error: {e}")
