import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OCR_API")

def read_text(image_path):
    with open(image_path, "rb") as image:
        response = requests.post(
            "https://api.ocr.space/parse/image",
            files={"filename": image},
            data={
                "apikey": API_KEY,
                "language": "eng",
                "OCREngine": 2
            }
        )

    result = response.json()

    if result["IsErroredOnProcessing"]:
        return "OCR Failed"

    return result["ParsedResults"][0]["ParsedText"]