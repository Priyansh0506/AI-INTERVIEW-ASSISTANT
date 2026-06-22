from fastapi import APIRouter, UploadFile, File
<<<<<<< Updated upstream
from fastapi.concurrency import run_in_threadpool
from faster_whisper import WhisperModel
=======
>>>>>>> Stashed changes
import tempfile
import os
from groq import Groq

router = APIRouter()

<<<<<<< Updated upstream
model = WhisperModel("tiny", device="cpu", compute_type="int8")
=======
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
>>>>>>> Stashed changes

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
<<<<<<< Updated upstream
        segments, _ = await run_in_threadpool(
            lambda: list(model.transcribe(tmp_path, language="en"))
        )
        text = " ".join([s.text for s in segments])
        return {"text": text.strip()}
    finally:
        os.remove(tmp_path)
=======
        with open(tmp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                language="en"
            )
        return {"text": transcription.text.strip()}
    finally:
        os.remove(tmp_path)
>>>>>>> Stashed changes
