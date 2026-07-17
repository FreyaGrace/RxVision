from pydoc import text

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from .ai import parse_prescription
from .ocr import read_text

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex = r"https://.*\.vercel\.app",
    allow_origins=[
        "https://rx-vision-2wvtaf9hx-fatimagraceapinan-6557s-projects.vercel.app",
        "https://rx-vision-nine.vercel.app",
        "https://rx-vision-k3gj2dikg-fatimagraceapinan-6557s-projects.vercel.app",
       "http://localhost:5173",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.get("/")
def home():
    return {"message": "Welcome to RxVision OCR API 🚀"}

@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = read_text(file_location)
    structured = parse_prescription(text)

    if text == "OCR Failed" or text.startswith("Request failed"):
        return {
        "ocr_text": text,
        "structured": None,
    }
    return {
    "ocr_text": text,
    "structured": structured,
 }