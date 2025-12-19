import pickle
import json

# Load ML symptoms
with open(r'c:\Users\shriy\OneDrive\Desktop\ML\mappings_100percent.pkl', 'rb') as f:
    mappings = pickle.load(f)

symptoms = list(mappings['symptom_to_idx'].keys())

# Clean and convert to readable format
cleaned = []
for s in symptoms:
    # Remove leading space and convert underscore to space for display
    clean = s.strip().replace('_', ' ').title()
    # Store both display and ML format
    cleaned.append({
        "display": clean,
        "ml_format": s.strip()  # Keep original format for backend
    })

# Sort alphabetically
cleaned.sort(key=lambda x: x['display'])

# Write to JSON for inspection
with open('all_ml_symptoms.json', 'w') as f:
    json.dump(cleaned, f, indent=2)

print(f"Exported {len(cleaned)} symptoms to all_ml_symptoms.json")
print("\nFirst 20:")
for i, s in enumerate(cleaned[:20]):
    print(f"  {i+1}. {s['display']} -> {s['ml_format']}")
