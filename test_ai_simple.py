"""
Simple test to check if AI insights work with correct error handling
"""
import sys
import os
from pathlib import Path

# Read .env manually
env_path = Path(__file__).parent / '.env'
api_key = None
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                api_key = line.strip().split('=', 1)[1]
                break

print("API Key found:", bool(api_key))

if not api_key:
    print("ERROR: No API key found in .env file")
    sys.exit(1)

try:
    import google.generativeai as genai
    print("Library imported successfully")
    
    genai.configure(api_key=api_key)
    print("API configured successfully")
    
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    print("Model created successfully")
    
    print("\nTesting content generation...")
    response = model.generate_content("Hello, respond with just 'Hi'")
    print(f"Response: {response.text}")
    print("\nSUCCESS: AI is working correctly!")
    
except Exception as e:
    print(f"\nERROR: {str(e)}")
    sys.exit(1)
