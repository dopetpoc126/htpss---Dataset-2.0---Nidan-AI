import pickle

# Load ML symptoms
with open(r'c:\Users\shriy\OneDrive\Desktop\ML\mappings_100percent.pkl', 'rb') as f:
    mappings = pickle.load(f)

symptoms = [s.strip() for s in mappings['symptom_to_idx'].keys()]

# Common/General symptoms
common = ['fatigue', 'weakness', 'high_fever', 'breathlessness', 'sweating', 'dehydration', 
          'loss_of_appetite', 'weight_loss', 'weight_gain', 'anxiety', 'restlessness',
          'lethargy', 'irritability', 'mood_swings', 'depression', 'headache', 'dizziness',
          'lack_of_concentration', 'visual_disturbances', 'coma', 'nausea', 'vomiting']

# Body-localized
head_face = ['headache', 'sunken_eyes', 'yellowing_of_eyes', 'yellow_crust_ooze',
             'dischromic_patches', 'watering_from_eyes', 'redness_of_eyes']

neck_throat = ['throat_irritation', 'swelled_lymph_nodes', 'painful_walking']

chest_respiratory = ['breathlessness', 'chest_pain', 'cough', 'phlegm', 'fast_heart_rate',
                     'rusty_sputum', 'mucoid_sputum', 'blood_in_sputum', 'palpitations']

abdomen = ['stomach_pain', 'acidity', 'indigestion', 'abdominal_pain', 'belly_pain',
           'stomach_bleeding', 'distention_of_abdomen', 'constipation', 'diarrhoea',
           'pain_during_bowel_movements', 'bloody_stool', 'passage_of_gases']

skin = ['itching', 'skin_rash', 'pus_filled_pimples', 'blackheads', 'scurring',
        'skin_peeling', 'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails',
        'blister', 'red_sore_around_nose', 'yellow_crust_ooze', 'nodal_skin_eruptions',
        'dischromic_patches', 'bruising', 'red_spots_over_body', 'patches_in_throat']

back = ['back_pain', 'neck_pain', 'knee_pain', 'hip_joint_pain', 'muscle_wasting',
        'painful_walking', 'movement_stiffness', 'spinning_movements', 'loss_of_balance',
        'unsteadiness', 'muscle_weakness', 'stiff_neck', 'swelling_joints',
        'pain_in_anal_region']

urinary = ['burning_micturition', 'spotting_urination', 'continuous_feel_of_urine',
           'bladder_discomfort', 'foul_smell_of_urine', 'dark_urine', 'yellow_urine',
           'polyuria', 'abnormal_menstruation']

general_symptoms = ['chills', 'shivering', 'cold_hands_and_feets', 'mild_fever',
                   'high_fever', 'sweating', 'malaise', 'muscle_pain', 'altered_sensorium',
                   'family_history', 'lack_of_concentration', 'receiving_blood_transfusion',
                   'receiving_unsterile_injections', 'obesity', 'excessive_hunger',
                   'increased_appetite', 'loss_of_appetite']

# Print TypeScript format
print("// Common Symptoms")
print("export const commonSymptoms = [")
for s in common:
    if s in symptoms:
        display = s.replace('_', ' ').title()
        print(f'  "{display}",')
print("];\n")

print("// Localized Symptoms")
print("export const localizedSymptoms: Record<string, string[]> = {")

categories = {
    "Head & Face": head_face,
    "Neck & Throat": neck_throat,
    "Chest & Respiratory": chest_respiratory,
    "Abdomen & Digestive": abdomen,
    "Skin": skin,
    "Back & Joints": back,
    "Urinary & Reproductive": urinary,
}

for cat_name, symptom_list in categories.items():
    print(f'  "{cat_name}": [')
    for s in symptom_list:
        if s in symptoms:
            display = s.replace('_', ' ').title()
            print(f'    "{display}",')
    print('  ],')

print("};")
