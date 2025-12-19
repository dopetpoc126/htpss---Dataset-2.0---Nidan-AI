import requests
import json

BASE_URL = "http://localhost:8000"

def test(name, symptoms):
    print(f"\n--- {name} ---")
    print(f"Input: {symptoms}")
    try:
        r = requests.post(f"{BASE_URL}/diagnose", json={
            "symptoms": symptoms,
            "history": "",
            "medications": ""
        }, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Confidence: {data.get('confidence_score', 0):.1f}%")
            print(f"Action: {data.get('action_required')}")
            print(f"Top Disease: {data.get('top_diseases', [{}])[0].get('name', 'N/A')}")
            if data.get('follow_up_questions'):
                print(f"Questions: {data['follow_up_questions'][:2]}")
        else:
            print(f"❌ Error {r.status_code}: {r.text[:100]}")
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running! Start with: python main.py")
    except Exception as e:
        print(f"❌ {e}")

if __name__ == "__main__":
    test("Fungal (Clear)", ["itching", "skin_rash", "nodal_skin_eruptions"])
    test("Common Cold", ["continuous_sneezing", "chills", "fatigue"])
    test("Vague", ["headache", "fatigue"])
