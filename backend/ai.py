import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API"))


def parse_prescription(text: str):
    prompt = f"""
You are a medical prescription parser.

Extract the information below.

Return ONLY valid JSON.

{{
  "patient_name":"",
  "doctor":"",
  "clinic":"",
  "date":"",
  "medications":[
      {{
        "name":"",
        "strength":"",
        "dosage":"",
        "frequency":"",
        "duration":""
      }}
  ],
  "notes":""
}}

Prescription:

{text}
"""

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt,
    )

    return json.loads(response.text)