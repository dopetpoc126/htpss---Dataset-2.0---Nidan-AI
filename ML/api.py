import pickle
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Symptom Analysis API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Resources
try:
    with open('model_100percent.pkl', 'rb') as f:
        model = pickle.load(f)
        
    with open('mappings_100percent.pkl', 'rb') as f:
        mappings = pickle.load(f)
        
    symptom_to_idx = mappings['symptom_to_idx']
    idx_to_disease = mappings['idx_to_disease']
    print(f"✅ Loaded model & {len(symptom_to_idx)} symptoms")
    
except Exception as e:
    print(f"❌ Initialization Error: {e}")
    model = None

class SymptomRequest(BaseModel):
    symptoms: list[str]

@app.post("/predict")
async def predict_disease(request: SymptomRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Model API not initialized correctly")

    # Initialize input vector
    input_vector = np.zeros((1, len(symptom_to_idx)))
    matched = []

    # Fuzzy match symptoms
    # The dataset has keys like ' itching' (leading space)
    # We clean both user input and map keys to compare
    normalized_map = {k.strip().lower(): v for k, v in symptom_to_idx.items()}

    for s in request.symptoms:
        clean_s = s.strip().lower()
        if clean_s in normalized_map:
            idx = normalized_map[clean_s]
            input_vector[0, idx] = 1
            matched.append(clean_s)

    if not matched:
        return {
            "error": "No symptoms matched",
            "message": "Try these: itching, skin rash, mild fever, etc."
        }

    # Predict
    probabilities = model.predict_proba(input_vector)[0]
    
    # associated disease indices sorted by probability
    sorted_indices = probabilities.argsort()[::-1]
    
    results = []
    for i in range(3): # Top 3
        idx = sorted_indices[i]
        prob = probabilities[idx]
        if prob > 0.05: # 5% threshold
            results.append({
                "disease": idx_to_disease[idx].title(),
                "confidence": f"{prob*100:.1f}%"
            })

    return {
        "final_prediction": results[0]["disease"] if results else "Uncertain",
        "analysis": results
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
