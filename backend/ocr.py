import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OCR_API")

def read_text(image_path):
    try:
        with open(image_path, "rb") as image:
            response = requests.post(
                "https://api.ocr.space/parse/image",
                files={"filename": image},
                data={
                    "apikey": API_KEY,
                    "language": "eng",
                    "OCREngine": 2,
                }
            )
            
        result = response.json()

        # Safely check for API-side processing errors
        if result.get("IsErroredOnProcessing"):
            return "OCR Failed"

        # Safely extract the text to avoid KeyError or IndexError if no text is found
        parsed_results = result.get("ParsedResults")
        if parsed_results:
            return parsed_results[0].get("ParsedText", "")
        
        return "No text detected in the image."

    except Exception as e:
        return f"Request failed: {str(e)}"