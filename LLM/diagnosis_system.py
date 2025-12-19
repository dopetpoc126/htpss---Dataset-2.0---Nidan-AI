import os
import json
import google.generativeai as genai
from typing import List, Dict, Tuple, Optional

# --- Configuration ---
# --- Configuration ---
# PASTE YOUR API KEY HERE
# You can either set it in your environment variables as GEMINI_API_KEY
# OR replace "YOUR_API_KEY_HERE" below with your actual key string.
API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyBfRtMF7bsNGy81yhoPHN-paVFxW2qdhAU" 

if not API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables.")

import time
import random

# ... imports ...

genai.configure(api_key=API_KEY)
# Switching to 'gemini-flash-latest' (1.5 Flash) which usually has better rate limits than 2.0 preview
model = genai.GenerativeModel('gemini-flash-latest')

def retry_api_call(func, retries=5, delay=4):
    """Retries an API call with exponential backoff."""
    for i in range(retries):
        try:
            return func()
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = delay * (2 ** i) + random.uniform(0, 1)
                print(f"Rate limit hit. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
            else:
                raise e
    print("Max retries exceeded.")
    return None

# --- Diagnosis System ---

class DiagnosisSystem:
    def __init__(self, symptoms_file: str = 'symptoms.json'):
        self.symptoms_list = self._load_symptoms(symptoms_file)
        
    def _load_symptoms(self, filepath: str) -> List[str]:
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading symptoms: {e}")
            return []

    def extract_symptoms_from_text(self, user_text: str) -> List[str]:
        """
        Uses LLM to extract valid symptoms from user description.
        """
        prompt = f"""
        You are a medical assistant. Parse the following user description and extract relevant symptoms.
        Map them EXACTLY to the following list of valid known symptoms.
        
        Valid Symptoms List:
        {", ".join(self.symptoms_list)}
        
        User Description: "{user_text}"
        
        Output ONLY a JSON array of the matching strings from the valid list. 
        If no matches found, output [].
        """
        
        try:
            response = retry_api_call(lambda: model.generate_content(prompt))
            if not response: return []
            
            # Cleanup Markdown code blocks if present
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            
            extracted = json.loads(text)
            
            # Strict filtering: Only allow symptoms that are strictly in the known list
            valid_extracted = [s for s in extracted if s in self.symptoms_list]
            return valid_extracted
        except Exception as e:
            print(f"Error executing symptom extraction: {e}")
            return []

    def generate_filtering_questions(self, symptoms: List[str], top_diseases: List[Dict]) -> List[str]:
        """
        Generates 3 filtering questions when confidence is low.
        """
        diseases_str = ", ".join([d['name'] for d in top_diseases])
        prompt = f"""
        The user has reported these symptoms: {symptoms}.
        The possible diseases are: {diseases_str}.
        The probability confidence is low (<70).
        
        Generate exactly 3 follow-up diagnostic questions to filter down the specific disease.
        Output ONLY the questions as a JSON array of strings.
        """
        
        try:
            response = retry_api_call(lambda: model.generate_content(prompt))
            if not response: return []

            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            return json.loads(text)
        except Exception as e:
            print(f"Error generating questions: {e}")
            return ["Can you describe exactly where the pain is?", "How long have you had these symptoms?", "Do you have a fever?"]

    def final_diagnosis(self, symptoms: List[str], initial_diseases: List[Dict], answers: List[str]) -> str:
        """
        Provides final diagnosis and doctor recommendation.
        """
        prompt = f"""
        Based on the following data, diagnose the most probable disease and recommend the type of doctor to visit.
        
        Symptoms: {symptoms}
        Initial Top Diseases (Automatic ML): {initial_diseases}
        Follow-up Q&A:
        {self._format_qa(initial_diseases, answers)} 
        # Note: Logic here is a bit tricky as we need the questions to map to answers. 
        # For simplicity, we assume the previous step's questions were stored or re-generated, 
        # but in a stateless LLM call we usually provide context.
        # Let's adjust the flow to pass the questions in.
        """
        # (Self-correction: I need to pass the questions too to make sense of answers)
        return "Error: Logic needs state of questions."

    def final_diagnosis_with_context(self, context: str) -> str:
        prompt = f"""
        You are a medical diagnostic expert. Analyze the following case context and provide:
        1. The most probable disease.
        2. The type of doctor to visit (e.g., Dermatologist, Cardiologist, General Physician).
        
        Context:
        {context}
        
        Output format:
        Disease: [Disease Name]
        Doctor: [Doctor Type]
        Reasoning: [Brief explanation]
        """
        try:
            response = retry_api_call(lambda: model.generate_content(prompt))
            if response:
                return response.text
            return "Error: Could not retrieve diagnosis due to API issues."
        except Exception as e:
             return f"Error in diagnosis: {e}"

    def _format_qa(self, questions, answers):
        return "\n".join([f"Q: {q}\nA: {a}" for q, a in zip(questions, answers)])

# --- Mocking the Independent ML Model ---
def mock_ml_model_predict(symptoms: List[str]) -> Tuple[List[Dict], float]:
    """
    Simulates the external ML model returns top 3 diseases and a top confidence score.
    """
    # This is a placeholder. In real use, this would call your ML model.
    # Returning dummy data for testing.
    return [
        {"name": "Fungal infection", "prob": 40},
        {"name": "Allergy", "prob": 30},
        {"name": "Drug Reaction", "prob": 20}
    ], 65.0 # Low confidence test

def main():
    system = DiagnosisSystem()
    
    print("--- Gemini Disease Diagnosis Assistant ---")
    
    # 1. User Input (Feeling)
    user_input = input("How are you feeling? (Describe your symptoms): ")
    if not user_input:
        user_input = "I have itching and skin patches" # Default test
    
    # 2. Symptom Extraction
    extracted_symptoms = system.extract_symptoms_from_text(user_input)
    print(f"\nExtracted Symptoms: {extracted_symptoms}")

    # 3. Receive External ML Model Inputs
    print("\n--- External ML Model Input ---")
    print("(Simulate the input from your ML model)")
    
    # In a real API, these would be passed as arguments. For CLI, we ask the user.
    try:
        # Defaulting for ease of testing if user hits enter
        d1 = input("Disease 1 (default: Fungal infection): ") or "Fungal infection"
        d2 = input("Disease 2 (default: Allergy): ") or "Allergy"
        d3 = input("Disease 3 (default: Drug Reaction): ") or "Drug Reaction"
        
        score_input = input("Confidence Score (0-100, default 65): ") or "65"
        confidence_score = float(score_input)
        
        top_diseases = [{"name": d1}, {"name": d2}, {"name": d3}]
        
    except ValueError:
        print("Invalid input. Using defaults.")
        top_diseases = [{"name": "Fungal infection"}, {"name": "Allergy"}, {"name": "Drug Reaction"}]
        confidence_score = 65.0

    print(f"Top 3: {[d['name'] for d in top_diseases]} | Confidence: {confidence_score}%")
    
    context = f"Symptoms: {extracted_symptoms}\nInitial ML Prediction: {top_diseases} (Confidence: {confidence_score})"
    
    # 4. Logic Check
    if confidence_score < 70:
        print("\nConfidence is low. Asking follow-up questions...")
        questions = system.generate_filtering_questions(extracted_symptoms, top_diseases)
        
        answers = []
        for q in questions:
            ans = input(f"{q} ")
            answers.append(ans)
            
        # Add Q&A to context
        qa_str = system._format_qa(questions, answers)
        context += f"\n\nFollow-up Q&A:\n{qa_str}"
        
    # 5. Final Diagnosis
    print("\nAnalyzing final diagnosis...")
    result = system.final_diagnosis_with_context(context)
    print("\n--- Diagnosis Result ---")
    print(result)

if __name__ == "__main__":
    main()
