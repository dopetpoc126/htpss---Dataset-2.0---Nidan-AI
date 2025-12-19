// ML Model Compatible Symptoms (178 total)
// Using exact names from model (with underscores), displayed nicely in UI

export const commonSymptoms = [
    "fatigue", "weakness", "high_fever", "breathlessness", "sweating", "dehydration",
    "loss_of_appetite", "weight_loss", "weight_gain", "anxiety", "restlessness",
    "lethargy", "irritability", "headache", "dizziness", "nausea", "vomiting",
    "chills", "shivering", "cold_hands_and_feets", "mild_fever", "malaise",
    "muscle_pain", "lack_of_concentration", "obesity", "excessive_hunger"
];

export const localizedSymptoms: Record<string, string[]> = {
    "Head & Face": [
        "headache", "sunken_eyes", "yellowing_of_eyes", "yellow_crust_ooze",
        "dischromic_patches", "puffy_face_and_eyes", "altered_sensorium"
    ],
    "Eyes & Ears": [
        "watering_from_eyes", "redness_of_eyes", "blurred_and_distorted_vision",
        "visual_disturbances", "loss_of_smell"
    ],
    "Neck & Throat": [
        "throat_irritation", "swelled_lymph_nodes", "stiff_neck", "neck_pain",
        "patches_in_throat", "enlarged_thyroid", "ulcers_on_tongue"
    ],
    "Chest & Respiratory": [
        "breathlessness", "chest_pain", "cough", "phlegm", "fast_heart_rate",
        "rusty_sputum", "mucoid_sputum", "blood_in_sputum", "palpitations",
        "continuous_sneezing", "congestion", "runny_nose", "sinus_pressure"
    ],
    "Abdomen & Pelvic": [
        "stomach_pain", "acidity", "indigestion", "abdominal_pain", "belly_pain",
        "stomach_bleeding", "distention_of_abdomen", "constipation", "diarrhoea",
        "pain_during_bowel_movements", "bloody_stool", "passage_of_gases",
        "internal_itching", "swelling_of_stomach", "irritation_in_anus"
    ],
    "Reproductive & Urinary": [
        "burning_micturition", "spotting_urination", "continuous_feel_of_urine",
        "bladder_discomfort", "foul_smell_of_urine", "dark_urine", "yellow_urine",
        "polyuria", "abnormal_menstruation"
    ],
    "Skin": [
        "itching", "skin_rash", "pus_filled_pimples", "blackheads", "scurring",
        "skin_peeling", "silver_like_dusting", "small_dents_in_nails",
        "inflammatory_nails", "blister", "red_sore_around_nose", "nodal_skin_eruptions",
        "bruising", "red_spots_over_body", "yellowish_skin", "brittle_nails"
    ],
    "Back": [
        "back_pain", "muscle_wasting", "spinning_movements", "loss_of_balance"
    ],
    "Arms": [
        "muscle_weakness", "muscle_pain", "swelling_joints", "movement_stiffness",
        "weakness_in_limbs", "weakness_of_one_body_side"
    ],
    "Legs": [
        "knee_pain", "hip_joint_pain", "joint_pain", "painful_walking",
        "unsteadiness", "swollen_legs", "prominent_veins_on_calf", "swollen_extremeties"
    ]
};

// All ML symptoms for search (auto-generated reference)
export const allSymptoms = [
    "abdominal_pain", "abnormal_menstruation", "acidity", "acute_liver_failure",
    "altered_sensorium", "anxiety", "back_pain", "belly_pain", "blackheads",
    "bladder_discomfort", "blister", "blood_in_sputum", "bloody_stool",
    "blurred_and_distorted_vision", "breathlessness", "brittle_nails", "bruising",
    "burning_micturition", "chest_pain", "chills", "cold_hands_and_feets", "coma",
    "congestion", "constipation", "continuous_feel_of_urine", "continuous_sneezing",
    "cough", "cramps", "dark_urine", "dehydration", "depression", "diarrhoea",
    "dischromic_patches", "distention_of_abdomen", "dizziness", "drying_and_tingling_lips",
    "enlarged_thyroid", "excessive_hunger", "extra_marital_contacts", "family_history",
    "fast_heart_rate", "fatigue", "fluid_overload", "foul_smell_of_urine",
    "headache", "high_fever", "hip_joint_pain", "history_of_alcohol_consumption",
    "increased_appetite", "indigestion", "inflammatory_nails", "internal_itching",
    "irregular_sugar_level", "irritability", "irritation_in_anus", "itching",
    "joint_pain", "knee_pain", "lack_of_concentration", "lethargy", "loss_of_appetite",
    "loss_of_balance", "loss_of_smell", "malaise", "mild_fever", "mood_swings",
    "movement_stiffness", "mucoid_sputum", "muscle_pain", "muscle_weakness",
    "muscle_wasting", "nausea", "neck_pain", "nodal_skin_eruptions", "obesity",
    "pain_during_bowel_movements", "pain_in_anal_region", "painful_walking",
    "palpitations", "passage_of_gases", "patches_in_throat", "phlegm", "polyuria",
    "prominent_veins_on_calf", "puffy_face_and_eyes", "pus_filled_pimples",
    "receiving_blood_transfusion", "receiving_unsterile_injections", "red_sore_around_nose",
    "red_spots_over_body", "redness_of_eyes", "restlessness", "runny_nose",
    "rusty_sputum", "scurring", "shivering", "silver_like_dusting", "sinus_pressure",
    "skin_peeling", "skin_rash", "slurred_speech", "small_dents_in_nails",
    "spinning_movements", "spotting_urination", "stomach_bleeding", "stomach_pain",
    "stiff_neck", "sunken_eyes", "sweating", "swelled_lymph_nodes", "swelling_joints",
    "swelling_of_stomach", "swollen_blood_vessels", "swollen_extremeties",
    "swollen_legs", "throat_irritation", "toxic_look_(typhos)", "ulcers_on_tongue",
    "unsteadiness", "visual_disturbances", "vomiting", "watering_from_eyes",
    "weakness_in_limbs", "weakness_of_one_body_side", "weight_gain", "weight_loss",
    "yellow_crust_ooze", "yellow_urine", "yellowing_of_eyes", "yellowish_skin"
].sort();

export const regionThemeMap: Record<string, string> = {
    "Head & Face": "violet",
    "Eyes & Ears": "violet",
    "Neck & Throat": "violet",
    "Chest & Respiratory": "blue",
    "Back": "blue",
    "Abdomen & Pelvic": "emerald",
    "Reproductive & Urinary": "emerald",
    "Skin": "rose",
    "Arms": "amber",
    "Legs": "rose"
};

export const themeClasses: Record<string, any> = {
    violet: {
        menu: "bg-violet-500/10 text-violet-200 border-violet-500/30",
        tag: "bg-violet-500/20 text-violet-300 border-violet-500/30",
        dot: "bg-violet-400",
        checkbox: "bg-violet-500 border-violet-500",
        checkboxEmpty: "border-slate-600 group-hover:border-violet-400"
    },
    blue: {
        menu: "bg-blue-500/10 text-blue-200 border-blue-500/30",
        tag: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        dot: "bg-blue-400",
        checkbox: "bg-blue-500 border-blue-500",
        checkboxEmpty: "border-slate-600 group-hover:border-blue-400"
    },
    emerald: {
        menu: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
        tag: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        dot: "bg-emerald-400",
        checkbox: "bg-emerald-500 border-emerald-500",
        checkboxEmpty: "border-slate-600 group-hover:border-emerald-400"
    },
    amber: {
        menu: "bg-amber-500/10 text-amber-200 border-amber-500/30",
        tag: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        dot: "bg-amber-400",
        checkbox: "bg-amber-500 border-amber-500",
        checkboxEmpty: "border-slate-600 group-hover:border-amber-400"
    },
    rose: {
        menu: "bg-rose-500/10 text-rose-200 border-rose-500/30",
        tag: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        dot: "bg-rose-400",
        checkbox: "bg-rose-500 border-rose-500",
        checkboxEmpty: "border-slate-600 group-hover:border-rose-400"
    }
};

export const getSymptomTheme = (symptom: string): string => {
    for (const [part, symptoms] of Object.entries(localizedSymptoms)) {
        if (symptoms.includes(symptom)) {
            return regionThemeMap[part] || "blue";
        }
    }
    return "blue";
};

// Helper to display symptoms nicely (convert underscore to space, title case)
export const formatSymptomDisplay = (symptom: string): string => {
    return symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
