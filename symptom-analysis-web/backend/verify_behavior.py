
import requests
import json
import time

BASE_URL = "http://localhost:8000/diagnose"

def test_scenario(name, symptoms, description=""):
    print(f"\n--- Testing Scenario: {name} ---")
    print(f"Symptoms: {symptoms}")
    try:
        start = time.time()
        payload = {"symptoms": symptoms, "history": "None", "medications": "None"}
        response = requests.post(BASE_URL, json=payload)
        duration = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success ({duration:.2f}s)")
            print(f"Confidence: {data.get('confidence_score')}")
            print(f"Action: {data.get('action_required')}")
            
            if data.get('action_required') == 'show_result':
                print(f"Diagnosis: {data.get('final_diagnosis')}")
                print(f"Top Diseases: {[d['name'] for d in data.get('top_diseases', [])]}")
            else:
                print("Questions from LLM:")
                for q in data.get('follow_up_questions', []):
                    print(f"  - {q}")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # 1. Clear Case (Should be Fungal Infection or similar)
    test_scenario("Clear Case (Fungal)", ["itching", "skin_rash", "nodal_skin_eruptions"])

    # 2. Vague Case (Should trigger LLM)
    test_scenario("Vague Case", ["fatigue", "headache", "nausea"])
    
    # 3. Random/Empty
    test_scenario("Just Tired", ["fatigue"])
