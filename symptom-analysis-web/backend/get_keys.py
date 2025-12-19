
import pickle
import sys

try:
    path = r"c:\Users\shriy\OneDrive\Desktop\ML\mappings_100percent.pkl"
    with open(path, 'rb') as f:
        d = pickle.load(f)
    
    with open("keys.txt", "w") as out:
        if isinstance(d, dict):
            out.write(f"Keys: {list(d.keys())}\n")
            for k in d.keys():
                val = d[k]
                out.write(f"Key '{k}' type: {type(val)}\n")
                if hasattr(val, '__len__'):
                    out.write(f"Key '{k}' len: {len(val)}\n")
        else:
            out.write(f"Type: {type(d)}\n")
            out.write(f"Content: {d}\n")
            
    print("Done writing keys.txt")
except Exception as e:
    with open("keys.txt", "w") as out:
        out.write(f"Error: {e}")
