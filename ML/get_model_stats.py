import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, top_k_accuracy_score
import os

# Define disease name mappings (stolen from fix_and_retrain.py)
DISEASE_NAME_MAP = {
    'Dengue': 'dengue fever',
    'Malaria': 'malaria',
    'AIDS': 'human immunodeficiency virus infection (hiv)',
    'Diabetes ': 'diabetes',
    'Tuberculosis': 'tuberculosis',
    'Pneumonia': 'pneumonia',
    'Common Cold': 'common cold',
    'Asthma': 'asthma',
    'Migraine': 'migraine',
    'GERD': 'gastroesophageal reflux disease (gerd)',
    'Fungal infection': 'fungal infection of the skin',
    'Gastroenteritis': 'infectious gastroenteritis',
    'Urinary tract infection': 'urinary tract infection',
    'Drug Reaction': 'drug reaction',
    'Allergy': 'allergy',
    'Arthritis': 'rheumatoid arthritis',
    'Acne': 'acne',
    'Bronchial Asthma': 'asthma',
    'Alcoholic hepatitis': 'alcoholic liver disease',
    'Heart attack': 'heart attack',
    'Psoriasis': 'psoriasis',
    'Impetigo': 'impetigo',
    'Hepatitis B': 'hepatitis B',
    'Hepatitis C': 'hepatitis C',
    'Hepatitis D': 'hepatitis D',
    'Hepatitis E': 'viral hepatitis',
    'hepatitis A': 'viral hepatitis',
    'Hyperthyroidism': 'graves disease',
    'Hypothyroidism': 'hypothyroidism',
    'Hypoglycemia': 'hypoglycemia',
    'Hypertension ': 'hypertensive heart disease',
    'Varicose veins': 'varicose veins',
    'Peptic ulcer diseae': 'gastroduodenal ulcer',
    'Typhoid': 'typhoid fever',
    'Chicken pox': 'chickenpox',
    'Dimorphic hemmorhoids(piles)': 'hemorrhoids',
    'Cervical spondylosis': 'degenerative disc disease',
    'Paralysis (brain hemorrhage)': 'intracerebral hemorrhage',
    'Jaundice': 'neonatal jaundice',
    'Chronic cholestasis': 'chronic cholestasis',
    'Osteoarthristis': 'osteoarthritis',
    '(vertigo) Paroymsal  Positional Vertigo': 'benign paroxysmal positional vertical (bppv)',
}

def standardize_disease_name(disease_name):
    if disease_name in DISEASE_NAME_MAP:
        return DISEASE_NAME_MAP[disease_name]
    return disease_name.lower().strip()

def main():
    print("Loading resources...")
    with open('mappings_100percent.pkl', 'rb') as f:
        mappings = pickle.load(f)
    
    symptom_to_idx = mappings['symptom_to_idx']
    disease_to_idx = mappings['disease_to_idx'] # Might be in mappings
    # Note: mappings might be a dict or a tuple depending on which script saved it.
    # api.py accesses it as: mappings['symptom_to_idx']
    
    with open('model_100percent.pkl', 'rb') as f:
        model = pickle.load(f)

    print("Loading datasets...")
    # Load and standardize same as fix_and_retrain.py
    df_small = pd.read_csv('DiseaseAndSymptoms.csv')
    df_small['Disease'] = df_small['Disease'].apply(standardize_disease_name)
    
    df_large = pd.read_csv('Disease and symptoms dataset.csv')
    disease_col = 'diseases' if 'diseases' in df_large.columns else 'disease'
    df_large[disease_col] = df_large[disease_col].apply(standardize_disease_name) # Ensure standardization happens!

    # Filter large dataset same as training
    disease_counts = df_large[disease_col].value_counts()
    valid_diseases = disease_counts[disease_counts >= 200].index.tolist()
    df_large_filtered = df_large[df_large[disease_col].isin(valid_diseases)]
    
    # Convert large to small format
    symptom_cols_large = [col for col in df_large_filtered.columns if col != disease_col]
    converted_data = []
    for idx, row in df_large_filtered.iterrows():
        disease = row[disease_col]
        # Get symptoms where value is 1
        symptoms = [col for col in symptom_cols_large if row[col] == 1]
        
        row_data = {'Disease': disease}
        for i, symptom in enumerate(symptoms[:17], 1):
            row_data[f'Symptom_{i}'] = symptom
        converted_data.append(row_data)
        
    df_large_converted = pd.DataFrame(converted_data)
    
    # Merge
    df_merged = pd.concat([df_small, df_large_converted], ignore_index=True)
    
    print(f"Dataset created: {len(df_merged)} samples")
    
    # Create Matrix X, y based on LOADED mappings
    print("Building X, y matrix...")
    X = np.zeros((len(df_merged), len(symptom_to_idx)), dtype=np.float32)
    y = np.zeros(len(df_merged), dtype=np.int32)
    
    for idx, row in df_merged.iterrows():
        if row['Disease'] in disease_to_idx:
            y[idx] = disease_to_idx[row['Disease']]
        
        for i in range(1, 18):
            col = f'Symptom_{i}'
            if col in row and pd.notna(row[col]):
                s = row[col]
                # Fuzzy match cleanup if needed, but assuming exact for now based on loading logic
                if s in symptom_to_idx:
                    X[idx, symptom_to_idx[s]] = 1
                elif s.strip() in symptom_to_idx: # Try strip
                    X[idx, symptom_to_idx[s.strip()]] = 1
                    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Evaluating...")
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    top3 = top_k_accuracy_score(y_test, y_proba, k=3)
    top5 = top_k_accuracy_score(y_test, y_proba, k=5)
    
    print("="*40)
    print(f"STATS_ACCURACY: {acc*100:.2f}%")
    print(f"STATS_TOP3: {top3*100:.2f}%")
    print(f"STATS_TOP5: {top5*100:.2f}%")
    print("="*40)

if __name__ == "__main__":
    main()
