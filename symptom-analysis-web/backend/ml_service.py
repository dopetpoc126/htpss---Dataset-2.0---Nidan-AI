import pickle
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLService:
    def __init__(self, model_path: str, mappings_path: str):
        self.model = None
        self.symptom_to_idx = {}
        self.idx_to_disease = {}
        self.normalized_symptoms = {}  # Clean name -> original key
        
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
                
            with open(mappings_path, 'rb') as f:
                mappings = pickle.load(f)
                
            self.symptom_to_idx = mappings['symptom_to_idx']
            self.idx_to_disease = mappings['idx_to_disease']
            
            # Pre-build normalized lookup: clean versions -> original key
            for original_key, idx in self.symptom_to_idx.items():
                # Normalize: strip spaces, lowercase, replace underscore with space
                clean = original_key.strip().lower().replace('_', ' ')
                self.normalized_symptoms[clean] = original_key
                # Also store underscore version
                self.normalized_symptoms[clean.replace(' ', '_')] = original_key
                # Also store just the key words (for partial matching)
                words = clean.split()
                for word in words:
                    if len(word) > 3:  # Only meaningful words
                        if word not in self.normalized_symptoms:
                            self.normalized_symptoms[word] = original_key
            
            logger.info(f"ML Model loaded with {len(self.symptom_to_idx)} symptoms, {len(self.normalized_symptoms)} normalized variants")
            
        except Exception as e:
            logger.error(f"Error loading ML assets: {e}")
            raise e

    def predict(self, symptoms: list[str]) -> tuple[list[dict], float]:
        """Predicts disease based on symptoms."""
        try:
            input_vector = np.zeros((1, len(self.symptom_to_idx)))
            matched = []

            for s in symptoms:
                # Normalize user input
                clean_s = s.strip().lower().replace('_', ' ')
                
                original_key = None
                
                # Strategy 1: Direct lookup
                if clean_s in self.normalized_symptoms:
                    original_key = self.normalized_symptoms[clean_s]
                
                # Strategy 2: Underscore version
                if not original_key:
                    underscore_s = clean_s.replace(' ', '_')
                    if underscore_s in self.normalized_symptoms:
                        original_key = self.normalized_symptoms[underscore_s]
                
                # Strategy 3: Keyword extraction
                # "Itching of skin" -> try "itching", "skin"
                if not original_key:
                    words = clean_s.split()
                    for word in words:
                        if word in self.normalized_symptoms:
                            original_key = self.normalized_symptoms[word]
                            break
                
                # Strategy 4: Partial match
                if not original_key:
                    for norm_key, orig_key in self.normalized_symptoms.items():
                        if clean_s in norm_key or norm_key in clean_s:
                            original_key = orig_key
                            break
                
                if original_key:
                    idx = self.symptom_to_idx[original_key]
                    input_vector[0, idx] = 1
                    matched.append(original_key.strip())

            logger.info(f"Matched {len(matched)} symptoms: {matched}")

            if not matched:
                return [{"name": "No symptoms recognized", "prob": 0}], 0.0

            # Predict
            probabilities = self.model.predict_proba(input_vector)[0]
            sorted_indices = probabilities.argsort()[::-1]

            results = []
            for i in range(3):
                idx = sorted_indices[i]
                prob = probabilities[idx]
                results.append({
                    "name": self.idx_to_disease[idx].title(),
                    "prob": float(prob * 100)
                })

            return results, results[0]['prob']

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return [{"name": f"Error: {str(e)[:50]}", "prob": 0}], 0.0
