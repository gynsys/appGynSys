import google.generativeai as genai
import os
import sys

api_key = sys.argv[1] if len(sys.argv) > 1 else os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# These were in the list_models() output
models_to_try = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite'
]

for model_name in models_to_try:
    print(f"Testing model: {model_name}...", end=" ")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi", generation_config={"max_output_tokens": 10})
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {str(e)[:100]}...")
