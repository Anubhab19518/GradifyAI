import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print("Key length:", len(api_key) if api_key else 0)
genai.configure(api_key=api_key, transport="rest")

model_name = "gemini-3.5-flash"
print(f"Testing model: {model_name}")
try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello")
    print("Success:", response.text)
except Exception as e:
    print(f"Error for {model_name}:", type(e).__name__, str(e))

model_name = "gemini-1.5-flash"
print(f"\nTesting model: {model_name}")
try:
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello")
    print("Success:", response.text)
except Exception as e:
    print(f"Error for {model_name}:", type(e).__name__, str(e))
