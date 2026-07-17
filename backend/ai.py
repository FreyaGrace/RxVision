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
You are an expert medical prescription parser.

Your task is to convert OCR text from a handwritten prescription into structured JSON.

Rules:

1. Correct only obvious OCR spelling mistakes in medicine names.
2. Never invent or guess medicine names.
3. If a medicine name is unreadable or ambiguous, return "unknown".
4. Preserve dosage, strength, frequency, and duration exactly as they appear.
5. Never change numbers (mg, mL, tablet count, etc.).
6. Do not infer missing information.
7. If a field is missing or unreadable, return "unknown".
8. Preserve abbreviations such as BID,TID, QID, PRN, HS, AC, PC exactly as written.
9. Return ONLY valid JSON matching the provided schema.
10. Do not include markdown, explanations, comments, or code fences.
11. If no medicines are detected, return an empty medications array.
12. Do not identify medicines based on medical knowledge alone—only use what is visible in the OCR text.
13. Patient name, doctor, clinic, date, and notes should be extracted only if clearly visible. Otherwise return "unknown".

OCR TEXT:

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
                            "duration": {"type": "STRING"},
                            "confidence": {"type": "STRING"}
                        },
                        "required": [
                                        "name",
                                        "strength",
                                        "dosage",
                                        "frequency",
                                        "duration",
                                        "confidence"
                                        ]
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
            model="gemini-3.1-flash-lite", 
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