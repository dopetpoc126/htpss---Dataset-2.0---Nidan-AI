from putergenai import PuterClient
import inspect

print("Methods in PuterClient:")
client = PuterClient()
for name, method in inspect.getmembers(client):
    if not name.startswith('_'):
        print(f" - {name}")

print("\nDir of client:")
print(dir(client))
