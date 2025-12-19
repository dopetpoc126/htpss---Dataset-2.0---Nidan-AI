
import os
import json
from typing import List, Dict
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Default model - Llama 3.3 70B for high quality responses
DEFAULT_MODEL = "llama-3.3-70b-versatile"

class LLMService:
    def __init__(self, model: str = None):
        self.model = model or DEFAULT_MODEL

    def _chat_completion(self, prompt: str, system_prompt: str = None) -> str:
        """Helper method to call Groq chat completion API"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.5,
            max_tokens=1024,
        )
        return response.choices[0].message.content

    def _clean_json_response(self, text: str) -> str:
        """Clean markdown code blocks from JSON response"""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    # ===== HIGH CONFIDENCE (≥70%) - Direct Report =====
    
    def generate_comprehensive_report(self, symptoms: List[str], top_diseases: List[Dict]) -> dict:
        """Generate a comprehensive diagnosis report when ML confidence is high (≥70%)"""
        
        # Get the top disease name for strict enforcement
        top_disease_name = top_diseases[0]['name'] if top_diseases else "Unknown"
        
        # Format diseases with their confidence scores - numbered for reference
        diseases_info = "\n".join([
            f"{i+1}. {d['name']}: {d.get('probability', d.get('score', 0)):.1f}% confidence" 
            for i, d in enumerate(top_diseases)
        ])
        
        system_prompt = """You are a professional medical assistant. You MUST use the ML model's predictions.
You are NOT allowed to suggest any disease outside the provided ML predictions.
Always respond with valid JSON only."""

        prompt = f"""Generate a diagnosis report for the #1 ranked ML prediction.

PATIENT SYMPTOMS: {', '.join(symptoms)}

ML MODEL PREDICTIONS (USE #1 AS THE DIAGNOSIS):
{diseases_info}

IMPORTANT: The "disease" field MUST be exactly "{top_disease_name}".

TRIAGE LEVELS (choose one based on condition severity):
- "immediate" - Life-threatening, needs emergency care (heart attack, stroke, severe bleeding)
- "delayed" - Serious but stable, can wait hours (fractures, moderate infections)
- "minimal" - Minor condition, outpatient care (common cold, minor pain)
- "expectant" - Chronic/terminal conditions requiring palliative care

Generate a JSON report:
{{
    "disease": "{top_disease_name}",
    "confidence": "High",
    "specialist": "Type of specialist",
    "reasoning": "2-3 sentence explanation",
    "advice": "Actionable next steps",
    "triage_level": "immediate/delayed/minimal/expectant"
}}

Return ONLY valid JSON."""

        try:
            text = self._chat_completion(prompt, system_prompt)
            text = self._clean_json_response(text)
            result = json.loads(text)
            # Force the disease name to be from ML predictions
            result['disease'] = top_disease_name
            # Ensure triage_level exists
            if 'triage_level' not in result:
                result['triage_level'] = 'minimal'
            return result
        except Exception as e:
            print(f"Groq LLM Error in comprehensive report: {e}")
            return {
                "disease": top_disease_name,
                "confidence": "High",
                "specialist": "General Physician",
                "reasoning": f"Based on ML prediction for {top_disease_name}. Please consult a healthcare professional.",
                "advice": "Schedule an appointment with a doctor for proper evaluation.",
                "triage_level": "minimal"
            }

    # ===== LOW CONFIDENCE (<70%) - Iterative Questions =====
    
    def generate_single_question(self, symptoms: List[str], top_diseases: List[Dict], 
                                  qa_history: List[Dict], question_number: int) -> str:
        """
        Generate a single diagnostic question to narrow down between ML's top 3 diseases.
        """
        
        # Extract disease names for reference
        disease_names = [d['name'] for d in top_diseases]
        
        # Format diseases with scores - numbered
        diseases_info = "\n".join([
            f"{i+1}. {d['name']}: {d.get('probability', d.get('score', 0)):.1f}%" 
            for i, d in enumerate(top_diseases)
        ])
        
        # Format previous Q&A
        if qa_history:
            qa_text = "\n".join([
                f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}" 
                for i, qa in enumerate(qa_history)
            ])
        else:
            qa_text = "None yet"
        
        system_prompt = f"""You are a medical diagnostician. Your ONLY goal is to determine which of these 3 conditions is most likely:
1. {disease_names[0] if len(disease_names) > 0 else 'Unknown'}
2. {disease_names[1] if len(disease_names) > 1 else 'Unknown'}
3. {disease_names[2] if len(disease_names) > 2 else 'Unknown'}

You must ask questions that DIFFERENTIATE between ONLY these 3 options.
Do NOT consider any other diseases."""

        prompt = f"""Ask ONE yes/no question to help determine which of the 3 ML predictions is correct.

PATIENT SYMPTOMS: {', '.join(symptoms)}

ML's TOP 3 PREDICTIONS (you must narrow down to ONE of these):
{diseases_info}

PREVIOUS Q&A:
{qa_text}

QUESTION {question_number} of 3:
{"Ask about a symptom that is common in one condition but rare in the others." if question_number == 1 else "Based on previous answers, ask about a distinguishing feature between remaining candidates." if question_number == 2 else "Ask the decisive question to pick the single most likely condition from the 3 options."}

Return ONLY the question text. No numbering, no prefix."""

        try:
            question = self._chat_completion(prompt, system_prompt)
            return question.strip().strip('"')
        except Exception as e:
            print(f"Groq LLM Error generating question: {e}")
            fallback_questions = [
                "Has this condition lasted more than a week?",
                "Is the symptom getting progressively worse?",
                "Have you experienced this condition before?"
            ]
            return fallback_questions[min(question_number - 1, 2)]

    def generate_final_narrowed_report(self, symptoms: List[str], top_diseases: List[Dict], 
                                        qa_history: List[Dict]) -> dict:
        """
        Generate final diagnosis report after 3 Q&A rounds.
        ALWAYS uses ML's #1 prediction to match the progress bar display.
        """
        
        # ALWAYS use ML's top prediction
        final_disease = top_diseases[0]['name'] if top_diseases else "Unable to determine"
        other_diseases = [d['name'] for d in top_diseases[1:]] if len(top_diseases) > 1 else []
        
        # Format Q&A for context
        qa_text = "; ".join([
            f"Q: {qa['question']} A: {qa['answer']}" 
            for qa in qa_history
        ])
        
        system_prompt = f"""You are a medical assistant. The diagnosis is already determined: {final_disease}.
Your job is to provide a brief explanation, advice, and triage level. Keep responses SHORT.
Always respond with valid JSON only."""

        prompt = f"""The ML model has determined the diagnosis is **{final_disease}**.

Patient symptoms: {', '.join(symptoms)}
Q&A context: {qa_text}

TRIAGE LEVELS (choose based on severity):
- "immediate" - Life-threatening emergency
- "delayed" - Serious but can wait hours
- "minimal" - Minor, outpatient care
- "expectant" - Chronic/palliative care

Generate a SHORT report:
{{
    "disease": "{final_disease}",
    "confidence": "Moderate",
    "specialist": "Specialist type",
    "reasoning": "1-2 sentences explaining match",
    "advice": "1 sentence advice",
    "triage_level": "immediate/delayed/minimal/expectant"
}}

Return ONLY valid JSON."""

        try:
            text = self._chat_completion(prompt, system_prompt)
            text = self._clean_json_response(text)
            result = json.loads(text)
            
            # FORCE the disease to be ML's #1 - no exceptions
            result['disease'] = final_disease
            result['ruled_out'] = other_diseases
            # Ensure triage_level exists
            if 'triage_level' not in result:
                result['triage_level'] = 'minimal'
            
            return result
        except Exception as e:
            print(f"Groq LLM Error in final narrowed report: {e}")
            return {
                "disease": final_disease,
                "confidence": "Moderate",
                "specialist": "General Physician",
                "reasoning": f"Symptoms align with {final_disease}. Consult a doctor for confirmation.",
                "ruled_out": other_diseases,
                "advice": "Schedule an appointment for evaluation.",
                "triage_level": "minimal"
            }

    # ===== Legacy methods for backward compatibility =====
    
    def generate_filtering_questions(self, symptoms: List[str], top_diseases: List[Dict]) -> List[str]:
        """Legacy method - now wraps generate_single_question for first question"""
        question = self.generate_single_question(symptoms, top_diseases, [], 1)
        return [question]

    def generate_final_diagnosis(self, symptoms: List[str], top_diseases: List[dict], 
                                  user_input_history: str) -> dict:
        """Legacy method for compatibility"""
        return self.generate_comprehensive_report(symptoms, top_diseases)
