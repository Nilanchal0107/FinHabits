import requests
import json

# Test the chatbot endpoint
url = 'http://localhost:5000/api/chatbot'

# You'll need to be logged in for this to work
# This is just a test script

payload = {
    'message': 'What is savings?'
}

try:
    # Note: This won't work without proper session cookies
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"JSON: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
