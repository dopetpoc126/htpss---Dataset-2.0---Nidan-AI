import pandas as pd
import json
import os

def create_finetuning_data():
    csv_path = 'DiseaseAndSymptoms.csv'
    output_path = 'gemini_finetuning_data.jsonl'
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    try:
        df = pd.read_csv(csv_path)
        # df structure: Disease, Symptom_1, Symptom_2, ...
        
        training_data = []
        
        for index, row in df.iterrows():
            disease = row['Disease']
            # Collect all symptoms for this row
            symptoms = []
            for col in df.columns:
                if 'Symptom' in col and isinstance(row[col], str):
                    s = row[col].strip().lower().replace(' ', '_')
                    if s:
                        symptoms.append(s)
            
            if not symptoms:
                continue
                
            # Create a training example
            # We want the model to learn to diagnose based on symptoms.
            # Format depends on the specific fine-tuning API requirements, 
            # usually: {"messages": [{"role": "user", "content": "..."}, {"role": "model", "content": "..."}]}
            
            symptoms_str = ", ".join(symptoms)
            
            # Simple direct diagnosis example
            entry = {
                "messages": [
                    {
                        "role": "user",
                        "content": f"I am experiencing the following symptoms: {symptoms_str}. What could be the issue?"
                    },
                    {
                        "role": "model",
                        "content": f"Based on these symptoms, you might have {disease}. You should worry about visiting a specialist." # Doctor type is hard to infer generically without a map, keeping it generic or we could add a map.
                    }
                ]
            }
            training_data.append(entry)
            
        # Write to JSONL
        with open(output_path, 'w') as f:
            for entry in training_data:
                json.dump(entry, f)
                f.write('\n')
                
        print(f"Generated {len(training_data)} training examples in {output_path}")
        print("To fine-tune, you would use the Gemini API to upload this file and start a tuning job.")
        
    except Exception as e:
        print(f"Error creating fine-tuning data: {e}")

if __name__ == "__main__":
    create_finetuning_data()
