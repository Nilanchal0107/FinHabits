"""
Test script to diagnose AI insights issue
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 50)
print("AI Insights Diagnostic Test")
print("=" * 50)

# Check if API key is loaded
api_key = os.getenv('GEMINI_API_KEY')
print(f"\n1. API Key Check:")
print(f"   API Key exists: {bool(api_key)}")
print(f"   API Key length: {len(api_key) if api_key else 0}")
print(f"   API Key starts with: {api_key[:10] if api_key else 'N/A'}...")

# Try importing the library
print(f"\n2. Library Import Check:")
try:
    import google.generativeai as genai
    print(f"   ✓ google.generativeai imported successfully")
    print(f"   Version: {genai.__version__}")
except Exception as e:
    print(f"   ✗ Error importing: {e}")
    exit(1)

# Try configuring API
print(f"\n3. API Configuration Check:")
try:
    genai.configure(api_key=api_key)
    print(f"   ✓ API configured successfully")
except Exception as e:
    print(f"   ✗ Error configuring API: {e}")
    exit(1)

# Try creating a model
print(f"\n4. Model Creation Check:")
try:
    model = genai.GenerativeModel('gemini-pro')
    print(f"   ✓ Model created successfully")
except Exception as e:
    print(f"   ✗ Error creating model: {e}")
    exit(1)

# Try generating content
print(f"\n5. Content Generation Check:")
try:
    response = model.generate_content("Say 'Hello' in one word.")
    print(f"   ✓ Content generated successfully")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ✗ Error generating content: {e}")
    print(f"   Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("Test Complete!")
print("=" * 50)
