import google.generativeai as genai
import os
import sys

api_key = sys.argv[1] if len(sys.argv) > 1 else os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_try = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-2.0-flash'
]

for model_name in models_to_try:
    print(f"Testing model: {model_name}...", end=" ")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi", generation_config={"max_output_tokens": 10})
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {str(e)[:100]}...")
