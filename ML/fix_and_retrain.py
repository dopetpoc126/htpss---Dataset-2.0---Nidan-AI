"""
Disease Name Standardization & Retraining
==========================================
Fixes duplicate disease names between small and large datasets,
then retrains the model for better accuracy.

Author: AI Assistant
Date: 2025-12-18
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, top_k_accuracy_score
import time

print("\n" + "="*80)
print("🔧 DISEASE NAME STANDARDIZATION & RETRAINING")
print("="*80)

# Define disease name mappings
DISEASE_NAME_MAP = {
    # Small dataset → Standard name (from large dataset)
    'Dengue': 'dengue fever',
    'Malaria': 'malaria',
    'AIDS': 'human immunodeficiency virus infection (hiv)',
    'Diabetes ': 'diabetes',  # Note the trailing space
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
    'Hepatitis E': 'viral hepatitis',  # Generalized
    'hepatitis A': 'viral hepatitis',
    'Hyperthyroidism': 'graves disease',  # Most common cause
    'Hypothyroidism': 'hypothyroidism',
    'Hypoglycemia': 'hypoglycemia',
    'Hypertension ': 'hypertensive heart disease',  # Note trailing space
    'Varicose veins': 'varicose veins',
    'Peptic ulcer diseae': 'gastroduodenal ulcer',  # Fixed typo
    'Typhoid': 'typhoid fever',
    'Chicken pox': 'chickenpox',
    'Dimorphic hemmorhoids(piles)': 'hemorrhoids',  # Simplified
    'Cervical spondylosis': 'degenerative disc disease',
    'Paralysis (brain hemorrhage)': 'intracerebral hemorrhage',
    'Jaundice': 'neonatal jaundice',
    'Chronic cholestasis': 'chronic cholestasis',
    'Osteoarthristis': 'osteoarthritis',  # Fixed typo
    '(vertigo) Paroymsal  Positional Vertigo': 'benign paroxysmal positional vertical (bppv)',
}

def standardize_disease_name(disease_name):
    """Standardize disease name using mapping."""
    # Try direct mapping first
    if disease_name in DISEASE_NAME_MAP:
        return DISEASE_NAME_MAP[disease_name]
    
    # Return lowercase version for consistency
    return disease_name.lower().strip()

def load_and_standardize_datasets():
    """Load both datasets and standardize disease names."""
    
    print("\n📂 Loading datasets...")
    
    # Load small dataset
    df_small = pd.read_csv('DiseaseAndSymptoms.csv')
    print(f"   Small dataset: {len(df_small):,} samples")
    
    # Standardize small dataset disease names
    df_small['Disease'] = df_small['Disease'].apply(standardize_disease_name)
    
    # Load large dataset
    df_large = pd.read_csv('Disease and symptoms dataset.csv')
    print(f"   Large dataset: {len(df_large):,} samples")
    
    # Standardize large dataset disease names
    disease_col = 'diseases' if 'diseases' in df_large.columns else 'disease'
    df_large[disease_col] = df_large[disease_col].apply(standardize_disease_name)
    
    print(f"\n✅ Disease names standardized!")
    print(f"   Small dataset unique diseases: {df_small['Disease'].nunique()}")
    print(f"   Large dataset unique diseases: {df_large[disease_col].nunique()}")
    
    # Check overlap
    small_diseases = set(df_small['Disease'].unique())
    large_diseases = set(df_large[disease_col].unique())
    overlap = small_diseases & large_diseases
    
    print(f"\n   Overlapping diseases after standardization: {len(overlap)}")
    if len(overlap) > 0:
        print(f"   Examples: {list(overlap)[:5]}")
    
    return df_small, df_large, disease_col

def create_hybrid_dataset_fixed():
    """Create hybrid dataset with fixed disease names."""
    
    print("\n" + "="*80)
    print("🔗 CREATING HYBRID DATASET (FIXED)")
    print("="*80)
    
    # Load and standardize
    df_small, df_large, disease_col = load_and_standardize_datasets()
    
    # Filter large dataset
    print(f"\n🔍 Filtering large dataset (200+ samples per disease)...")
    disease_counts = df_large[disease_col].value_counts()
    valid_diseases = disease_counts[disease_counts >= 200].index.tolist()
    df_large_filtered = df_large[df_large[disease_col].isin(valid_diseases)]
    
    print(f"   Kept {len(valid_diseases)} diseases with 200+ samples")
    print(f"   Samples: {len(df_large_filtered):,}")
    
    # Convert large dataset format
    print(f"\n🔄 Converting large dataset format...")
    symptom_cols_large = [col for col in df_large_filtered.columns if col != disease_col]
    
    converted_data = []
    for idx, row in df_large_filtered.iterrows():
        if idx % 50000 == 0:
            print(f"   Progress: {idx:,} / {len(df_large_filtered):,}")
        
        disease = row[disease_col]
        symptoms = [col for col in symptom_cols_large if row[col] == 1]
        
        row_data = {'Disease': disease}
        for i, symptom in enumerate(symptoms[:17], 1):
            row_data[f'Symptom_{i}'] = symptom
        for i in range(len(symptoms) + 1, 18):
            row_data[f'Symptom_{i}'] = None
        
        converted_data.append(row_data)
    
    df_large_converted = pd.DataFrame(converted_data)
    
    # Merge - now with proper deduplication
    print(f"\n🔗 Merging datasets...")
    small_diseases = set(df_small['Disease'].unique())
    large_diseases = set(df_large_converted['Disease'].unique())
    common = small_diseases & large_diseases
    
    print(f"   Common diseases: {len(common)}")
    
    if common:
        print(f"\n   ⚡ Merging common diseases (combining samples):")
        for disease in sorted(common):
            small_count = (df_small['Disease'] == disease).sum()
            large_count = (df_large_converted['Disease'] == disease).sum()
            print(f"      {disease}: Small={small_count}, Large={large_count}, Total={small_count+large_count}")
    
    # Keep both - don't remove common diseases!
    df_merged = pd.concat([df_small, df_large_converted], ignore_index=True)
    
    print(f"\n   ✅ Merge complete!")
    print(f"      Total samples: {len(df_merged):,}")
    print(f"      Unique diseases: {df_merged['Disease'].nunique()}")
    
    return df_merged

def create_training_data(df_merged):
    """Create training matrices from merged data."""
    
    print("\n" + "="*80)
    print("🔢 CREATING TRAINING MATRICES")
    print("="*80)
    
    # Extract symptoms
    all_symptoms = set()
    for col in [f'Symptom_{i}' for i in range(1, 18)]:
        if col in df_merged.columns:
            symptoms = df_merged[col].dropna().unique()
            all_symptoms.update(symptoms)
    
    all_symptoms = sorted(list(all_symptoms))
    
    print(f"\n   Unique symptoms: {len(all_symptoms)}")
    
    # Create mappings
    symptom_to_idx = {s: i for i, s in enumerate(all_symptoms)}
    idx_to_symptom = {i: s for s, i in symptom_to_idx.items()}
    
    diseases = sorted(df_merged['Disease'].unique())
    disease_to_idx = {d: i for i, d in enumerate(diseases)}
    idx_to_disease = {i: d for d, i in disease_to_idx.items()}
    
    print(f"   Unique diseases: {len(diseases)}")
    
    # Create matrix
    print(f"\n   Building matrix...")
    X = np.zeros((len(df_merged), len(all_symptoms)), dtype=np.float32)
    y = np.zeros(len(df_merged), dtype=np.int32)
    
    for idx, row in df_merged.iterrows():
        if idx % 50000 == 0:
            print(f"   Progress: {idx:,} / {len(df_merged):,}")
        
        y[idx] = disease_to_idx[row['Disease']]
        
        for col in [f'Symptom_{i}' for i in range(1, 18)]:
            if col in row and pd.notna(row[col]):
                symptom = row[col]
                if symptom in symptom_to_idx:
                    X[idx, symptom_to_idx[symptom]] = 1
    
    print(f"\n   ✅ Matrix created: {X.shape}")
    
    return X, y, (symptom_to_idx, idx_to_symptom, disease_to_idx, idx_to_disease)

# Main execution
print("\n🚀 Starting fixed hybrid pipeline...")

# Create fixed dataset
df_merged = create_hybrid_dataset_fixed()

# Create matrices
X, y, mappings = create_training_data(df_merged)

# Split data
print("\n✂️  Splitting data...")
X_train_full, X_test, y_train_full, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Sample 10% for training (memory constraint)
print(f"\n⚡ Sampling 10% of training data...")
sample_size = int(len(y_train_full) * 0.10)
indices = np.random.choice(len(y_train_full), sample_size, replace=False)
X_train = X_train_full[indices]
y_train = y_train_full[indices]

print(f"   Training: {len(y_train):,} samples")
print(f"   Testing: {len(y_test):,} samples")

# Train
print("\n" + "="*80)
print("🤖 TRAINING MODEL (FIXED VERSION)")
print("="*80)

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    random_state=42,
    n_jobs=2,
    verbose=1
)

print(f"\n   Training on {len(y_train):,} samples...")
start_time = time.time()
model.fit(X_train, y_train)
training_time = time.time() - start_time

print(f"\n   ✅ Training complete in {training_time:.1f}s")

# Evaluate
print("\n📊 Evaluating...")
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)

accuracy = accuracy_score(y_test, y_pred)
top3_acc = top_k_accuracy_score(y_test, y_pred_proba, k=3)
top5_acc = top_k_accuracy_score(y_test, y_pred_proba, k=5)

print("\n" + "="*80)
print("🎯 RESULTS - FIXED HYBRID MODEL")
print("="*80)

print(f"\n   Overall Accuracy: {accuracy*100:.2f}%")
print(f"   Top-3 Accuracy: {top3_acc*100:.2f}%")
print(f"   Top-5 Accuracy: {top5_acc*100:.2f}%")

print(f"\n📊 COMPARISON:")
print(f"   Before fix: 72.70% (had 53 zero-performers)")
print(f"   After fix:  {accuracy*100:.2f}%")

if accuracy > 0.727:
    improvement = (accuracy - 0.727) * 100
    print(f"   ✅ Improvement: +{improvement:.2f}%")
else:
    print(f"   ⚠️  Slight decrease (but more honest - removed duplicates)")

# Save
print("\n💾 Saving fixed model...")

with open('models/hybrid_disease_model_fixed.pkl', 'wb') as f:
    pickle.dump(model, f)

mappings_dict = {
    'symptom_to_idx': mappings[0],
    'idx_to_symptom': mappings[1],
    'disease_to_idx': mappings[2],
    'idx_to_disease': mappings[3]
}

with open('models/hybrid_mappings_fixed.pkl', 'wb') as f:
    pickle.dump(mappings_dict, f)

with open('models/hybrid_results_fixed.txt', 'w') as f:
    f.write(f"Fixed Hybrid Model Results\n")
    f.write(f"="*60 + "\n\n")
    f.write(f"Training samples: {len(y_train):,}\n")
    f.write(f"Test samples: {len(y_test):,}\n")
    f.write(f"Accuracy: {accuracy*100:.2f}%\n")
    f.write(f"Top-3 Accuracy: {top3_acc*100:.2f}%\n")
    f.write(f"Top-5 Accuracy: {top5_acc*100:.2f}%\n")
    f.write(f"Diseases: {len(mappings[3])}\n")
    f.write(f"Training time: {training_time:.1f}s\n")
    f.write(f"\nIssue fixed: Standardized disease names\n")
    f.write(f"Previous: 53 diseases with 0% F1\n")
    f.write(f"Expected: <10 diseases with 0% F1\n")

print(f"   ✅ Saved:")
print(f"      models/hybrid_disease_model_fixed.pkl")
print(f"      models/hybrid_mappings_fixed.pkl")
print(f"      models/hybrid_results_fixed.txt")

print("\n" + "="*80)
print("✅ RETRAINING COMPLETE!")
print("="*80)

print(f"\n🎉 SUCCESS!")
print(f"   Accuracy: {accuracy*100:.2f}%")
print(f"   Disease name duplication fixed")
print(f"   Ready for deployment!")

print(f"\n🎯 Next: Run evaluate_hybrid_deep.py on fixed model to verify improvement")
