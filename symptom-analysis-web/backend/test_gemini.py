import google.generativeai as genai
import os

API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyBfRtMF7bsNGy81yhoPHN-paVFxW2qdhAU"
genai.configure(api_key=API_KEY)

print("Testing Gemini model names...\n")

models_to_test = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.5-pro",
]

for model_name in models_to_test:
    try:
        print(f"Testing: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello")
        print(f"  ✅ SUCCESS: {response.text[:50]}")
        break
    except Exception as e:
        print(f"  ❌ FAILED: {str(e)[:100]}")

print("\n--- Available Models ---")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"  • {m.name}")
