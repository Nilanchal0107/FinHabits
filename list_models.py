"""
List available models to find the correct model name
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

if not api_key:
    print("ERROR: No API key found")
    sys.exit(1)

try:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    
    print("Available models:")
    print("=" * 50)
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"Model: {model.name}")
            print(f"  Display Name: {model.display_name}")
            print(f"  Description: {model.description}")
            print()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
