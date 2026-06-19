from fastapi import APIRouter, UploadFile, File
from fastapi.concurrency import run_in_threadpool
import whisper
import tempfile
import os

router = APIRouter()

model = whisper.load_model("tiny")

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):

    # original file ka extension use karo (webm, mp3, wav, etc.)
    suffix = os.path.splitext(file.filename)[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # run in threadpool so it doesn't block the server
        result = await run_in_threadpool(
            model.transcribe,
            tmp_path,
            fp16=False,
            language="en",
            temperature=0
        )
        text = result["text"]
    finally:
        os.remove(tmp_path)

    return {"text": text}