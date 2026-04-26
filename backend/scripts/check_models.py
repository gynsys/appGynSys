import google.generativeai as genai
import os
import sys

# Try to get API key from environment or arg
api_key = sys.argv[1] if len(sys.argv) > 1 else os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: No API Key provided")
    sys.exit(1)

try:
    genai.configure(api_key=api_key)
    print("Listing available models for generateContent:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
