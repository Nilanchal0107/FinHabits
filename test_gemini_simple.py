# Quick test to verify Gemini API works
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY', '')
print(f"API Key: {api_key}")
print(f"API Key length: {len(api_key)}")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('models/gemini-2.5-flash')
    response = model.generate_content("What is a budget in one sentence?")
    print(f"SUCCESS: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")
