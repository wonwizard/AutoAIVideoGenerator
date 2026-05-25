import asyncio
import logging
import os
import platform
import re
import shutil
import subprocess
import uuid
from pathlib import Path


class _SuppressJobPoll(logging.Filter):
    _pat = re.compile(r'"GET /api/job/[^"]+\" 200')

    def filter(self, record: logging.LogRecord) -> bool:
        return not self._pat.search(record.getMessage())


logging.getLogger("uvicorn.access").addFilter(_SuppressJobPoll())

# genmedia가 PATH에 없을 경우 알려진 설치 경로를 직접 주입
if platform.system() == "Windows":
    _genmedia_bin = Path(os.environ.get("LOCALAPPDATA", "C:\\Users\\Default\\AppData\\Local")) / "genmedia" / "bin"
    if _genmedia_bin.is_dir() and str(_genmedia_bin) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(_genmedia_bin) + os.pathsep + os.environ.get("PATH", "")
        print(f"INFO: genmedia PATH 주입 완료: {_genmedia_bin}")

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from backend import jobs
from backend.models import GenerateRequest, JobResponse
from backend.pipeline import runner

app = FastAPI(title="Auto AI Video Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("outputs").mkdir(exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")


@app.on_event("startup")
async def startup_check():
    for cmd in ["ffmpeg", "genmedia"]:
        found = await asyncio.to_thread(shutil.which, cmd)
        if found:
            print(f"OK: '{cmd}' found at {found}")
        else:
            print(f"WARNING: '{cmd}' not found in PATH. Pipeline will fail at runtime.")


# ── Step 1: 스토리 생성 ──────────────────────────────────────────
@app.post("/api/generate", response_model=JobResponse)
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs.create_job(job_id)
    background_tasks.add_task(runner.run_step1, job_id, request)
    return jobs.to_response(jobs.get_job(job_id))


# ── Step 2: 이미지 생성 (편집된 스토리 수신) ──────────────────────
class GenerateImagesRequest(BaseModel):
    story: dict


@app.post("/api/job/{job_id}/generate-images", response_model=JobResponse)
async def generate_images(job_id: str, req: GenerateImagesRequest, background_tasks: BackgroundTasks):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    jobs.reset_steps_from(job_id, 2)
    background_tasks.add_task(runner.run_step2, job_id, req.story)
    return jobs.to_response(jobs.get_job(job_id))


# ── Step 3+4: 영상 생성 ──────────────────────────────────────────
class GenerateVideoRequest(BaseModel):
    story: dict
    aspect_ratio: str = "16:9"


@app.post("/api/job/{job_id}/generate-video", response_model=JobResponse)
async def generate_video(job_id: str, req: GenerateVideoRequest, background_tasks: BackgroundTasks):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    jobs.reset_steps_from(job_id, 3)
    background_tasks.add_task(runner.run_step3_4, job_id, req.story, req.aspect_ratio)
    return jobs.to_response(jobs.get_job(job_id))


# ── 조회 / 다운로드 ──────────────────────────────────────────────
@app.get("/api/job/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs.to_response(job)


@app.get("/api/download/{job_id}")
async def download(job_id: str):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    step4 = job["steps"]["4"]
    if not step4.data or not step4.data.get("final_path"):
        raise HTTPException(status_code=404, detail="Video not ready")
    path = Path(step4.data["final_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(str(path), media_type="video/mp4", filename="final.mp4")
