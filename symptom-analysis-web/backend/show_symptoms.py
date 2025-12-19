import pickle

# Load and print all symptoms the model knows
with open(r'c:\Users\shriy\OneDrive\Desktop\ML\mappings_100percent.pkl', 'rb') as f:
    mappings = pickle.load(f)

symptoms = mappings['symptom_to_idx']
print(f"Total symptoms: {len(symptoms)}")
print("\nFirst 30 symptoms:")
for i, s in enumerate(list(symptoms.keys())[:30]):
    print(f"  {i+1}. '{s}'")

# Check for itching/rash specifically
print("\n--- Searching for 'itch' and 'rash' ---")
for s in symptoms.keys():
    if 'itch' in s.lower() or 'rash' in s.lower():
        print(f"  Found: '{s}'")
