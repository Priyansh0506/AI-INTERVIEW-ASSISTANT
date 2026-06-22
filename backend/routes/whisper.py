from fastapi import APIRouter, UploadFile, File
from fastapi.concurrency import run_in_threadpool
from faster_whisper import WhisperModel
import tempfile
import os

router = APIRouter()

model = WhisperModel("tiny", device="cpu", compute_type="int8")

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        segments, _ = await run_in_threadpool(
            lambda: list(model.transcribe(tmp_path, language="en"))
        )
        text = " ".join([s.text for s in segments])
        return {"text": text.strip()}
    finally:
        os.remove(tmp_path)
