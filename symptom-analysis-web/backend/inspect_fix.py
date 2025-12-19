
import pandas as pd
import google.generativeai as genai
import os
import sys

with open("inspection_result.txt", "w") as out:
    # 1. Inspect CSVs
    try:
        path1 = r"c:\Users\shriy\OneDrive\Desktop\LLM\DiseaseAndSymptoms.csv"
        if os.path.exists(path1):
            df = pd.read_csv(path1, nrows=5)
            out.write(f"\n--- {path1} ---\n")
            out.write(f"Shape: {df.shape}\n")
            out.write(f"Columns: {list(df.columns)}\n")
        else:
            out.write(f"{path1} not found\n")

        path2 = r"c:\Users\shriy\OneDrive\Desktop\LLM\Disease and symptoms dataset.csv"
        if os.path.exists(path2):
            # Just read header
            with open(path2, 'r') as f:
                header = f.readline().strip().split(',')
            out.write(f"\n--- {path2} ---\n")
            out.write(f"Col Count: {len(header)}\n")
            # out.write(f"First 10 Cols: {header[:10]}\n")
        else:
            out.write(f"{path2} not found\n")

    except Exception as e:
        out.write(f"CSV Error: {e}\n")

    # 2. List Models
    try:
        API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyBfRtMF7bsNGy81yhoPHN-paVFxW2qdhAU"
        genai.configure(api_key=API_KEY)
        out.write("\n--- Available Gemini Models ---\n")
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    out.write(f"{m.name}\n")
        except Exception as api_err:
             out.write(f"API List Error: {api_err}\n")
             
    except Exception as e:
        out.write(f"GenAI Error: {e}\n")
