import google.generativeai as genai
import os

API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyBfRtMF7bsNGy81yhoPHN-paVFxW2qdhAU"
genai.configure(api_key=API_KEY)

print("Testing gemini-flash-latest...\n")

try:
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Say 'LLM is working!'")
    print(f"✅ SUCCESS!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAILED: {e}")
