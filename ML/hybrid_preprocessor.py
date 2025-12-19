"""
Hybrid Dataset Preprocessor
============================
Combines small clean dataset with filtered large dataset.

Strategy:
1. Keep ALL 41 diseases from small dataset (DiseaseAndSymptoms.csv)
2. Add well-represented diseases from large dataset (200+ samples)
3. Remove extreme outliers
4. Create balanced, comprehensive training set

Author: AI Assistant
Date: 2025-12-18
"""

import sys
import io
# Fix Unicode encoding issues
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import os

class HybridDatasetPreprocessor:
    """Preprocessor for hybrid dataset approach."""
    
    def __init__(self, small_dataset='DiseaseAndSymptoms.csv',
                 large_dataset='Disease and symptoms dataset.csv',
                 min_samples_threshold=200):
        """
        Initialize hybrid preprocessor.
        
        Args:
            small_dataset: Path to small clean dataset
            large_dataset: Path to large dataset
            min_samples_threshold: Minimum samples per disease for large dataset
        """
        self.small_dataset = small_dataset
        self.large_dataset = large_dataset
        self.min_samples_threshold = min_samples_threshold
        
        self.symptom_to_idx = {}
        self.idx_to_symptom = {}
        self.disease_to_idx = {}
        self.idx_to_disease = {}
        
    def load_and_filter_large_dataset(self):
        """Load large dataset and filter to well-represented diseases."""
        
        print("\n" + "="*80)
        print("📂 LOADING LARGE DATASET")
        print("="*80)
        
        print(f"\nReading: {self.large_dataset}")
        df_large = pd.read_csv(self.large_dataset)
        
        print(f"   Total samples: {len(df_large):,}")
        print(f"   Total features: {len(df_large.columns)}")
        
        # Get disease column
        disease_col = 'diseases' if 'diseases' in df_large.columns else 'disease'
        
        # Filter by sample count
        print(f"\n🔍 Filtering diseases with {self.min_samples_threshold}+ samples...")
        disease_counts = df_large[disease_col].value_counts()
        
        valid_diseases = disease_counts[disease_counts >= self.min_samples_threshold].index.tolist()
        
        print(f"   Before filter: {df_large[disease_col].nunique()} diseases")
        print(f"   After filter: {len(valid_diseases)} diseases")
        
        df_filtered = df_large[df_large[disease_col].isin(valid_diseases)].copy()
        
        print(f"   Samples kept: {len(df_filtered):,} / {len(df_large):,} ({len(df_filtered)/len(df_large)*100:.1f}%)")
        
        # Show top diseases
        print(f"\n   Top 10 diseases in filtered dataset:")
        for i, (disease, count) in enumerate(df_filtered[disease_col].value_counts().head(10).items(), 1):
            print(f"   {i:2d}. {disease:45s} {count:5,} samples")
        
        return df_filtered, disease_col
    
    def load_small_dataset(self):
        """Load the small clean dataset."""
        
        print("\n" + "="*80)
        print("📂 LOADING SMALL DATASET")
        print("="*80)
        
        print(f"\nReading: {self.small_dataset}")
        df_small = pd.read_csv(self.small_dataset)
        
        print(f"   Total samples: {len(df_small):,}")
        print(f"   Unique diseases: {df_small['Disease'].nunique()}")
        
        return df_small
    
    def convert_large_to_small_format(self, df_large, disease_col):
        """
        Convert large dataset format (binary columns) to small format (symptom names).
        
        Large format: disease, symptom1(0/1), symptom2(0/1), ...
        Small format: Disease, Symptom_1, Symptom_2, ...
        """
        
        print("\n" + "="*80)
        print("🔄 CONVERTING LARGE DATASET FORMAT")
        print("="*80)
        
        # Get symptom columns (all except disease)
        symptom_cols = [col for col in df_large.columns if col != disease_col]
        
        print(f"\n   Processing {len(df_large):,} samples...")
        print(f"   Symptom columns: {len(symptom_cols)}")
        
        converted_data = []
        
        for idx, row in df_large.iterrows():
            if idx % 10000 == 0:
                print(f"   Progress: {idx:,} / {len(df_large):,} ({idx/len(df_large)*100:.1f}%)")
            
            disease = row[disease_col]
            
            # Get symptoms where value is 1
            symptoms = [col for col in symptom_cols if row[col] == 1]
            
            # Create row with disease and up to 17 symptoms (to match small format)
            row_data = {'Disease': disease}
            for i, symptom in enumerate(symptoms[:17], 1):
                row_data[f'Symptom_{i}'] = symptom
            
            # Fill remaining columns with None
            for i in range(len(symptoms) + 1, 18):
                row_data[f'Symptom_{i}'] = None
            
            converted_data.append(row_data)
        
        df_converted = pd.DataFrame(converted_data)
        
        print(f"\n   ✅ Conversion complete!")
        print(f"   Converted shape: {df_converted.shape}")
        
        return df_converted
    
    def merge_datasets(self, df_small, df_large_converted):
        """Merge small and large datasets, handling duplicates."""
        
        print("\n" + "="*80)
        print("🔗 MERGING DATASETS")
        print("="*80)
        
        # Check for disease overlap
        small_diseases = set(df_small['Disease'].unique())
        large_diseases = set(df_large_converted['Disease'].unique())
        
        common_diseases = small_diseases & large_diseases
        
        print(f"\n   Small dataset diseases: {len(small_diseases)}")
        print(f"   Large dataset diseases: {len(large_diseases)}")
        print(f"   Common diseases: {len(common_diseases)}")
        
        if common_diseases:
            print(f"\n   📋 Common diseases (will prioritize small dataset):")
            for disease in sorted(common_diseases):
                small_count = (df_small['Disease'] == disease).sum()
                large_count = (df_large_converted['Disease'] == disease).sum()
                print(f"      • {disease}: Small={small_count}, Large={large_count}")
            
            # Remove common diseases from large dataset (keep small dataset version)
            print(f"\n   Removing {len(common_diseases)} diseases from large dataset (keeping small version)...")
            df_large_filtered = df_large_converted[~df_large_converted['Disease'].isin(common_diseases)].copy()
        else:
            df_large_filtered = df_large_converted.copy()
        
        # Merge
        print(f"\n   Merging datasets...")
        df_merged = pd.concat([df_small, df_large_filtered], ignore_index=True)
        
        print(f"\n   ✅ Merge complete!")
        print(f"      Small dataset: {len(df_small):,} samples")
        print(f"      Large dataset: {len(df_large_filtered):,} samples")
        print(f"      Merged total: {len(df_merged):,} samples")
        print(f"      Unique diseases: {df_merged['Disease'].nunique()}")
        
        return df_merged
    
    def create_symptom_disease_matrix(self, df_merged):
        """Create binary matrix from merged dataset."""
        
        print("\n" + "="*80)
        print("🔢 CREATING SYMPTOM-DISEASE MATRIX")
        print("="*80)
        
        # Extract all unique symptoms
        all_symptoms = set()
        symptom_cols = [f'Symptom_{i}' for i in range(1, 18)]
        
        for col in symptom_cols:
            if col in df_merged.columns:
                symptoms = df_merged[col].dropna().unique()
                all_symptoms.update(symptoms)
        
        all_symptoms = sorted(list(all_symptoms))
        
        print(f"\n   Total unique symptoms: {len(all_symptoms)}")
        print(f"   Sample symptoms: {all_symptoms[:10]}")
        
        # Create mappings
        self.symptom_to_idx = {symptom: idx for idx, symptom in enumerate(all_symptoms)}
        self.idx_to_symptom = {idx: symptom for symptom, idx in self.symptom_to_idx.items()}
        
        # Create disease mappings
        diseases = sorted(df_merged['Disease'].unique())
        self.disease_to_idx = {disease: idx for idx, disease in enumerate(diseases)}
        self.idx_to_disease = {idx: disease for disease, idx in self.disease_to_idx.items()}
        
        print(f"   Total unique diseases: {len(diseases)}")
        
        # Create binary matrix
        print(f"\n   Building binary matrix...")
        X = np.zeros((len(df_merged), len(all_symptoms)), dtype=np.float32)
        y = np.zeros(len(df_merged), dtype=np.int32)
        
        for idx, row in df_merged.iterrows():
            if idx % 10000 == 0:
                print(f"   Progress: {idx:,} / {len(df_merged):,}")
            
            # Get disease label
            y[idx] = self.disease_to_idx[row['Disease']]
            
            # Get symptoms
            for col in symptom_cols:
                if col in row and pd.notna(row[col]):
                    symptom = row[col]
                    if symptom in self.symptom_to_idx:
                        X[idx, self.symptom_to_idx[symptom]] = 1
        
        print(f"\n   ✅ Matrix created!")
        print(f"      Shape: {X.shape}")
        print(f"      Features (symptoms): {X.shape[1]}")
        print(f"      Samples: {X.shape[0]:,}")
        print(f"      Classes (diseases): {len(np.unique(y))}")
        
        return X, y
    
    def save_data(self, X_train, X_test, y_train, y_test, output_dir='models'):
        """Save processed data and mappings."""
        
        print("\n" + "="*80)
        print("💾 SAVING PROCESSED DATA")
        print("="*80)
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Save mappings
        mappings = {
            'symptom_to_idx': self.symptom_to_idx,
            'idx_to_symptom': self.idx_to_symptom,
            'disease_to_idx': self.disease_to_idx,
            'idx_to_disease': self.idx_to_disease
        }
        
        with open(f'{output_dir}/hybrid_mappings.pkl', 'wb') as f:
            pickle.dump(mappings, f)
        
        print(f"   ✅ Saved: {output_dir}/hybrid_mappings.pkl")
        
        # Create disease-symptom map for symptom analyzer
        disease_symptom_map = {}
        
        # Combine train and test data
        all_y = np.concatenate([y_train, y_test])
        all_X = np.vstack([X_train, X_test])
        
        for disease_idx, disease_name in self.idx_to_disease.items():
            # Get all samples for this disease
            disease_samples = all_X[all_y == disease_idx]
            
            # Get symptoms that appear in this disease
            symptom_indices = np.where(disease_samples.sum(axis=0) > 0)[0]
            symptoms = [self.idx_to_symptom[idx] for idx in symptom_indices]
            
            disease_symptom_map[disease_name] = symptoms
        
        with open(f'{output_dir}/hybrid_disease_symptom_map.pkl', 'wb') as f:
            pickle.dump(disease_symptom_map, f)
        
        print(f"   ✅ Saved: {output_dir}/hybrid_disease_symptom_map.pkl")
        
        # Save statistics
        stats = {
            'total_samples': len(y_train) + len(y_test),
            'train_samples': len(y_train),
            'test_samples': len(y_test),
            'num_symptoms': len(self.symptom_to_idx),
            'num_diseases': len(self.disease_to_idx),
            'diseases': list(self.idx_to_disease.values())
        }
        
        with open(f'{output_dir}/hybrid_stats.txt', 'w') as f:
            f.write("HYBRID DATASET STATISTICS\n")
            f.write("="*60 + "\n\n")
            for key, value in stats.items():
                if key != 'diseases':
                    f.write(f"{key}: {value}\n")
            f.write("\n\nDiseases:\n")
            f.write("-"*60 + "\n")
            for disease in sorted(stats['diseases']):
                count_train = (y_train == self.disease_to_idx[disease]).sum()
                count_test = (y_test == self.disease_to_idx[disease]).sum()
                f.write(f"{disease}: train={count_train}, test={count_test}, total={count_train+count_test}\n")
        
        print(f"   ✅ Saved: {output_dir}/hybrid_stats.txt")
        
        return stats
    
    def preprocess_hybrid_pipeline(self, test_size=0.2, random_state=42):
        """Complete hybrid preprocessing pipeline."""
        
        print("\n" + "="*80)
        print("🚀 HYBRID DATASET PREPROCESSING PIPELINE")
        print("="*80)
        
        # Step 1: Load and filter large dataset
        df_large_filtered, disease_col = self.load_and_filter_large_dataset()
        
        # Step 2: Load small dataset
        df_small = self.load_small_dataset()
        
        # Step 3: Convert large to small format
        df_large_converted = self.convert_large_to_small_format(df_large_filtered, disease_col)
        
        # Step 4: Merge datasets
        df_merged = self.merge_datasets(df_small, df_large_converted)
        
        # Step 5: Create matrix
        X, y = self.create_symptom_disease_matrix(df_merged)
        
        # Step 6: Train-test split with stratification
        print("\n" + "="*80)
        print("✂️ SPLITTING DATA")
        print("="*80)
        
        print(f"\n   Test size: {test_size*100}%")
        print(f"   Random state: {random_state}")
        print(f"   Using stratified split to maintain class balance...")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"\n   ✅ Split complete!")
        print(f"      Training: {len(y_train):,} samples")
        print(f"      Testing: {len(y_test):,} samples")
        
        # Step 7: Save
        stats = self.save_data(X_train, X_test, y_train, y_test)
        
        # Final summary
        print("\n" + "="*80)
        print("✅ PREPROCESSING COMPLETE!")
        print("="*80)
        
        print(f"\n📊 FINAL DATASET:")
        print(f"   Total samples: {stats['total_samples']:,}")
        print(f"   Training: {stats['train_samples']:,}")
        print(f"   Testing: {stats['test_samples']:,}")
        print(f"   Symptoms: {stats['num_symptoms']}")
        print(f"   Diseases: {stats['num_diseases']}")
        
        print(f"\n💾 Files created:")
        print(f"   • models/hybrid_mappings.pkl")
        print(f"   • models/hybrid_disease_symptom_map.pkl")
        print(f"   • models/hybrid_stats.txt")
        
        return X_train, X_test, y_train, y_test, stats


if __name__ == "__main__":
    preprocessor = HybridDatasetPreprocessor(min_samples_threshold=200)
    X_train, X_test, y_train, y_test, stats = preprocessor.preprocess_hybrid_pipeline()
    
    print("\n🎯 Ready for model training!")
    print(f"   Run: python train_hybrid_model.py")
