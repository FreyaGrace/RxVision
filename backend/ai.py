import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Pass your custom env variable key here if it's not named GEMINI_API_KEY
client = genai.Client(api_key=os.getenv("GEMINI_API"))

def parse_prescription(text: str):
    prompt = f"""
You are a medical prescription parser.
Extract the information below into the specified structure.

Prescription:
{text}
"""

    # We enforce JSON mode through config so Gemini behaves predictably
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema={
            "type": "OBJECT",
            "properties": {
                "patient_name": {"type": "STRING"},
                "doctor": {"type": "STRING"},
                "clinic": {"type": "STRING"},
                "date": {"type": "STRING"},
                "medications": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "name": {"type": "STRING"},
                            "strength": {"type": "STRING"},
                            "dosage": {"type": "STRING"},
                            "frequency": {"type": "STRING"},
                            "duration": {"type": "STRING"}
                        },
                        "required": ["name"]
                    }
                },
                "notes": {"type": "STRING"}
            },
            "required": ["medications"]
        },
        temperature=0.1  # Lower temperature means more accurate extractions
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt,
            config=config
        )

        print("===== GEMINI RESPONSE =====")
        print(repr(response.text))
        print("===========================")

        # Clean up Markdown wrappers safely
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]  # Remove '```json'
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]  # Remove '```'
            
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3] # Remove trailing '```'
            
        clean_text = clean_text.strip()

        return json.loads(clean_text)

    except Exception as e:
        print(f"Error parsing prescription: {e}")
        return {"error": "Failed to extract medical data."}