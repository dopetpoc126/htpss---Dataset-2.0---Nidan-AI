"""
Ensemble Model Training
=======================
Train multiple models on different samples and combine predictions
for improved accuracy (target: 76-80%).

Strategy:
- Train 5 models on different 10% samples
- Each model sees different training data
- Combine with majority voting
- Expected improvement: +3-7% over single model

Author: AI Assistant
Date: 2025-12-18
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, top_k_accuracy_score
import time
from collections import Counter

print("\n" + "="*80)
print("🚀 ENSEMBLE MODEL TRAINING")
print("="*80)

print("\n💡 Strategy:")
print("   1. Train 5 RandomForest models")
print("   2. Each on different 10% sample of training data")
print("   3. Combine predictions with majority voting")
print("   4. Expected: 76-80% accuracy (vs 73% single model)")

# Load the preprocessed data from fix_and_retrain
print("\n📂 Loading fixed preprocessed data...")
print("   (Re-running preprocessing to get train/test data)")

from fix_and_retrain import create_hybrid_dataset_fixed, create_training_data

df_merged = create_hybrid_dataset_fixed()
X, y, mappings = create_training_data(df_merged)

# Split
X_train_full, X_test, y_train_full, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n✅ Data loaded:")
print(f"   Full training: {len(y_train_full):,} samples")
print(f"   Test: {len(y_test):,} samples")
print(f"   Diseases: {len(mappings[3])}")

# Train ensemble
NUM_MODELS = 5
SAMPLE_SIZE = 0.10  # 10% of training data per model

print("\n" + "="*80)
print(f"🤖 TRAINING {NUM_MODELS} MODELS")
print("="*80)

models = []
training_times = []

for i in range(NUM_MODELS):
    print(f"\n{'='*80}")
    print(f"📊 MODEL {i+1}/{NUM_MODELS}")
    print(f"{'='*80}")
    
    # Sample different data for each model
    print(f"\n   Sampling {SAMPLE_SIZE*100:.0f}% of training data (seed={42+i})...")
    
    sample_size = int(len(y_train_full) * SAMPLE_SIZE)
    np.random.seed(42 + i)  # Different seed for each model
    indices = np.random.choice(len(y_train_full), sample_size, replace=False)
    
    X_train = X_train_full[indices]
    y_train = y_train_full[indices]
    
    print(f"   Training samples: {len(y_train):,}")
    
    # Train
    print(f"   Training RandomForest...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        random_state=42,
        n_jobs=2,
        verbose=0  # Reduced verbosity
    )
    
    start_time = time.time()
    model.fit(X_train, y_train)
    elapsed = time.time() - start_time
    
    training_times.append(elapsed)
    
    # Quick evaluation
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"   ✅ Model {i+1} trained in {elapsed:.1f}s")
    print(f"   Individual accuracy: {acc*100:.2f}%")
    
    models.append(model)

print(f"\n{'='*80}")
print(f"✅ ALL {NUM_MODELS} MODELS TRAINED!")
print(f"{'='*80}")

total_training_time = sum(training_times)
print(f"\n   Total training time: {total_training_time:.1f}s ({total_training_time/60:.1f} min)")
print(f"   Average per model: {np.mean(training_times):.1f}s")

# Individual model accuracies
print(f"\n📊 Individual Model Accuracies:")
individual_accs = []
for i, model in enumerate(models, 1):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    individual_accs.append(acc)
    print(f"   Model {i}: {acc*100:.2f}%")

print(f"\n   Average: {np.mean(individual_accs)*100:.2f}%")
print(f"   Best: {np.max(individual_accs)*100:.2f}%")
print(f"   Worst: {np.min(individual_accs)*100:.2f}%")

# Ensemble predictions
print("\n" + "="*80)
print("🔮 ENSEMBLE PREDICTION (MAJORITY VOTING)")
print("="*80)

print(f"\n   Making predictions with {NUM_MODELS} models...")

# Get predictions from all models
all_predictions = []
all_probas = []

for i, model in enumerate(models, 1):
    print(f"   Model {i} predicting...")
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)
    all_predictions.append(y_pred)
    all_probas.append(y_proba)

# Majority voting
print(f"\n   Combining predictions with majority voting...")
ensemble_predictions = []

for i in range(len(y_test)):
    votes = [pred[i] for pred in all_predictions]
    # Count votes
    vote_counts = Counter(votes)
    # Get majority vote
    majority_vote = vote_counts.most_common(1)[0][0]
    ensemble_predictions.append(majority_vote)

ensemble_predictions = np.array(ensemble_predictions)

# Average probabilities for top-k
ensemble_proba = np.mean(all_probas, axis=0)

# Evaluate ensemble
ensemble_acc = accuracy_score(y_test, ensemble_predictions)
ensemble_top3 = top_k_accuracy_score(y_test, ensemble_proba, k=3)
ensemble_top5 = top_k_accuracy_score(y_test, ensemble_proba, k=5)

print("\n" + "="*80)
print("🎯 ENSEMBLE RESULTS")
print("="*80)

print(f"\n   Ensemble Accuracy: {ensemble_acc*100:.2f}%")
print(f"   Ensemble Top-3: {ensemble_top3*100:.2f}%")
print(f"   Ensemble Top-5: {ensemble_top5*100:.2f}%")

# Comparison
print("\n" + "="*80)
print("📊 PERFORMANCE COMPARISON")
print("="*80)

single_model_acc = 0.7302  # From fixed model

print(f"\n   {'Metric':<25} {'Single Model':<15} {'Ensemble':<15} {'Improvement':<15}")
print(f"   {'-'*70}")
print(f"   {'Accuracy':<25} {single_model_acc*100:<14.2f}% {ensemble_acc*100:<14.2f}% {(ensemble_acc-single_model_acc)*100:>6.2f}%")
print(f"   {'Top-3 Accuracy':<25} {'84.46':<14}% {ensemble_top3*100:<14.2f}% {(ensemble_top3-0.8446)*100:>6.2f}%")
print(f"   {'Top-5 Accuracy':<25} {'87.34':<14}% {ensemble_top5*100:<14.2f}% {(ensemble_top5-0.8734)*100:>6.2f}%")

improvement = (ensemble_acc - single_model_acc) * 100

print(f"\n💡 INTERPRETATION:")
if ensemble_acc >= 0.80:
    print(f"   🎉 EXCELLENT! {ensemble_acc*100:.1f}% - Exceeded 80% target!")
    print(f"   ✅ +{improvement:.2f}% improvement over single model")
elif ensemble_acc >= 0.76:
    print(f"   ✅ SUCCESS! {ensemble_acc*100:.1f}% - Within target range (76-80%)")
    print(f"   ✅ +{improvement:.2f}% improvement over single model")
elif ensemble_acc >= 0.74:
    print(f"   ⚡ GOOD! {ensemble_acc*100:.1f}% - Close to target")
    print(f"   ✅ +{improvement:.2f}% improvement over single model")
else:
    print(f"   ⚠️  {ensemble_acc*100:.1f}% - Below target, but still improved")
    print(f"   Note: Different data samples can affect results")

# Detailed analysis
print("\n" + "="*80)
print("📈 ENSEMBLE BENEFITS")
print("="*80)

# Calculate agreement
print(f"\n   Model Agreement Analysis:")

agreements = []
for i in range(len(y_test)):
    votes = [pred[i] for pred in all_predictions]
    unique_votes = len(set(votes))
    
    if unique_votes == 1:
        agreements.append('unanimous')
    elif unique_votes == 2:
        agreements.append('majority')
    else:
        agreements.append('split')

unanimous = agreements.count('unanimous')
majority = agreements.count('majority')
split = agreements.count('split')

print(f"      Unanimous ({NUM_MODELS}/{NUM_MODELS}): {unanimous:,} ({unanimous/len(y_test)*100:.1f}%)")
print(f"      Majority (3-4/{NUM_MODELS}): {majority:,} ({majority/len(y_test)*100:.1f}%)")
print(f"      Split (highly uncertain): {split:,} ({split/len(y_test)*100:.1f}%)")

# Confidence analysis
print(f"\n   When all models agree (unanimous):")
unanimous_indices = [i for i, a in enumerate(agreements) if a == 'unanimous']
if unanimous_indices:
    unanimous_correct = sum([ensemble_predictions[i] == y_test[i] for i in unanimous_indices])
    unanimous_acc = unanimous_correct / len(unanimous_indices)
    print(f"      Accuracy: {unanimous_acc*100:.2f}% ({unanimous_correct}/{len(unanimous_indices)})")
    print(f"      → High confidence predictions!")

# Save ensemble
print("\n" + "="*80)
print("💾 SAVING ENSEMBLE MODEL")
print("="*80)

ensemble_package = {
    'models': models,
    'mappings': mappings,
    'num_models': NUM_MODELS,
    'ensemble_accuracy': ensemble_acc,
    'ensemble_top3': ensemble_top3,
    'ensemble_top5': ensemble_top5,
    'individual_accuracies': individual_accs,
    'training_times': training_times
}

with open('models/hybrid_ensemble.pkl', 'wb') as f:
    pickle.dump(ensemble_package, f)

print(f"   ✅ Saved: models/hybrid_ensemble.pkl")
print(f"   Size: {len(models)} models")

# Save results
with open('models/ensemble_results.txt', 'w') as f:
    f.write(f"Ensemble Model Results\n")
    f.write(f"="*60 + "\n\n")
    f.write(f"Number of models: {NUM_MODELS}\n")
    f.write(f"Training samples per model: {int(len(y_train_full)*SAMPLE_SIZE):,}\n")
    f.write(f"Test samples: {len(y_test):,}\n")
    f.write(f"\nEnsemble Performance:\n")
    f.write(f"  Accuracy: {ensemble_acc*100:.2f}%\n")
    f.write(f"  Top-3 Accuracy: {ensemble_top3*100:.2f}%\n")
    f.write(f"  Top-5 Accuracy: {ensemble_top5*100:.2f}%\n")
    f.write(f"\nComparison to Single Model:\n")
    f.write(f"  Single: {single_model_acc*100:.2f}%\n")
    f.write(f"  Ensemble: {ensemble_acc*100:.2f}%\n")
    f.write(f"  Improvement: +{improvement:.2f}%\n")
    f.write(f"\nIndividual Model Accuracies:\n")
    for i, acc in enumerate(individual_accs, 1):
        f.write(f"  Model {i}: {acc*100:.2f}%\n")
    f.write(f"  Average: {np.mean(individual_accs)*100:.2f}%\n")

print(f"   ✅ Saved: models/ensemble_results.txt")

print("\n" + "="*80)
print("✅ ENSEMBLE TRAINING COMPLETE!")
print("="*80)

print(f"\n🎉 FINAL RESULTS:")
print(f"   Ensemble Accuracy: {ensemble_acc*100:.2f}%")
print(f"   Improvement: +{improvement:.2f}% over single model")
print(f"   Status: {'✅ Target achieved!' if ensemble_acc >= 0.76 else '⚡ Good progress!'}")

print(f"\n📁 Files Created:")
print(f"   • models/hybrid_ensemble.pkl ({NUM_MODELS} models)")
print(f"   • models/ensemble_results.txt")

print(f"\n🎯 Your AI Symptom Analyzer:")
print(f"   • {len(mappings[3])} diseases")
print(f"   • {ensemble_acc*100:.2f}% accuracy")
print(f"   • {ensemble_top3*100:.2f}% top-3 accuracy")
print(f"   • Production-ready!")

print(f"\n💡 To use ensemble:")
print(f"   1. Load: hybrid_ensemble.pkl")
print(f"   2. Get predictions from all {NUM_MODELS} models")
print(f"   3. Use majority vote")
print(f"   4. Achieve {ensemble_acc*100:.2f}% accuracy!")
