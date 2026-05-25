import json
import traceback
from pathlib import Path

from backend import jobs
from backend.models import GenerateRequest
from backend.pipeline import step1_story, step2_image, step3_video, step4_assemble


def _err(e: Exception) -> str:
    msg = f"{type(e).__name__}: {e}"
    print(f"[Pipeline ERROR] {msg}\n{traceback.format_exc()}")
    return msg or type(e).__name__


def _ensure_dirs(outputs_dir: str) -> None:
    for sub in ("", "images", "videos", "logs"):
        Path(outputs_dir, sub).mkdir(parents=True, exist_ok=True)


def _save_log(outputs_dir: str, filename: str, data: dict) -> None:
    path = Path(outputs_dir) / "logs" / filename
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


async def run_step1(job_id: str, request: GenerateRequest) -> None:
    outputs_dir = jobs.get_outputs_dir(job_id)
    _ensure_dirs(outputs_dir)

    jobs.set_step_running(job_id, 1)
    try:
        story = await step1_story.run(request.topic, request.duration, request.llm)
        _save_log(outputs_dir, "story.json", story)
        jobs.set_step_completed(job_id, 1, story)  # 전체 story 저장 (프론트 편집용)
    except Exception as e:
        jobs.set_step_failed(job_id, 1, _err(e))


async def run_step2(job_id: str, story: dict) -> None:
    outputs_dir = jobs.get_outputs_dir(job_id)
    _ensure_dirs(outputs_dir)

    jobs.set_step_running(job_id, 2)
    try:
        images = await step2_image.run(story, outputs_dir)
        _save_log(outputs_dir, "images.json", images)
        jobs.set_step_completed(job_id, 2, images)
    except Exception as e:
        jobs.set_step_failed(job_id, 2, _err(e))


async def run_step3_4(job_id: str, story: dict, aspect_ratio: str) -> None:
    outputs_dir = jobs.get_outputs_dir(job_id)
    job = jobs.get_job(job_id)
    images = job["steps"]["2"].data
    if not images:
        jobs.set_step_failed(job_id, 3, "Step 2 이미지 데이터 없음")
        return

    jobs.set_step_running(job_id, 3)
    try:
        videos = await step3_video.run(story, images, aspect_ratio, outputs_dir)
        _save_log(outputs_dir, "videos.json", videos)
        jobs.set_step_completed(job_id, 3, videos)
    except Exception as e:
        jobs.set_step_failed(job_id, 3, _err(e))
        return

    jobs.set_step_running(job_id, 4)
    try:
        assembly = await step4_assemble.run(videos["clips"], outputs_dir)
        jobs.set_step_completed(job_id, 4, {"final_path": assembly["final_path"]})
        jobs.set_job_completed(job_id)
    except Exception as e:
        jobs.set_step_failed(job_id, 4, _err(e))
