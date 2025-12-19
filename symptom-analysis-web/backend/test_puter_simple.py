from putergenai import PuterClient

# Quick test
print("Testing Puter.js connection...")
puter = PuterClient()

try:
    print("Sending request...")
    # Using the correct method: ai_chat with messages list
    response = puter.ai_chat(
        messages=[{"role": "user", "content": "Say 'Puter.js is working!' in one sentence."}],
        model="gpt-4o-mini"
    )
    
    # Handle response struct
    if isinstance(response, dict) and 'message' in response:
        content = response['message']['content'] if isinstance(response['message'], dict) else response['message']
    else:
        content = response
        
    print(f"✅ SUCCESS: {content}")
except Exception as e:
    print(f"❌ ERROR: {e}")
