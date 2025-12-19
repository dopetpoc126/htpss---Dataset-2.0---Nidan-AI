
import pickle
import pprint
import sys

path = r"c:\Users\shriy\OneDrive\Desktop\ML\mappings_100percent.pkl"

try:
    with open(path, 'rb') as f:
        data = pickle.load(f)
    
    with open("mappings_dump.txt", "w") as out:
        pprint.pprint(data, stream=out)
        
    print("Dumped mappings to mappings_dump.txt")
except Exception as e:
    print(f"Error: {e}")
