import asyncio
import json
import subprocess
from pathlib import Path

POLL_INTERVAL = 15  # seconds
MAX_POLLS = 60      # 15s × 60 = 15 minutes max
MAX_RETRIES = 3


def _run_genmedia_sync(args: list[str]) -> dict:
    cmd = ["genmedia"] + args
    print(f"[genmedia CMD] {' '.join(cmd)}", flush=True)
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "no output").strip()
        raise RuntimeError(f"genmedia video failed: {detail}")
    data = json.loads(result.stdout)
    print(f"[genmedia OUT] {json.dumps(data, ensure_ascii=False)}", flush=True)
    return data


async def _run_genmedia(args: list[str]) -> dict:
    return await asyncio.to_thread(_run_genmedia_sync, args)


def _upload_sync(local_path: str) -> str:
    cmd = ["genmedia", "upload", local_path]
    print(f"[genmedia CMD] {' '.join(cmd)}", flush=True)
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "no output").strip()
        raise RuntimeError(f"genmedia upload failed: {detail}")
    data = json.loads(result.stdout)
    print(f"[genmedia OUT] {json.dumps(data, ensure_ascii=False)}", flush=True)
    return data["cdn_url"]


async def _upload(local_path: str) -> str:
    return await asyncio.to_thread(_upload_sync, local_path)


async def _submit(image_url: str, duration: int, aspect_ratio: str) -> str:
    safe_duration = max(4, min(15, duration))
    result = await _run_genmedia([
        "run", "bytedance/seedance-2.0/reference-to-video",
        "--prompt", "이미지의 스토리보드대로 영상을 생성해 @Image1",
        "--image_urls", json.dumps([image_url]),
        "--duration", str(safe_duration),
        "--resolution", "720p",
        "--aspect_ratio", aspect_ratio,
        "--async",
        "--json"
    ])
    return result["request_id"]


_RUNNING_STATUSES = {"IN_QUEUE", "IN_PROGRESS", "QUEUED", "PROCESSING", "PENDING"}
_FAILED_STATUSES  = {"FAILED", "ERROR", "FAILURE", "CANCELLED", "CANCELED", "TIMEOUT"}


async def _poll(request_id: str, videos_dir: str) -> dict:
    Path(videos_dir).mkdir(parents=True, exist_ok=True)
    for i in range(MAX_POLLS):
        await asyncio.sleep(POLL_INTERVAL)
        result = await _run_genmedia([
            "status", "bytedance/seedance-2.0/reference-to-video",
            request_id, "--json"
        ])
        status = result.get("status", "").upper()
        print(f"[Poll {i+1}/{MAX_POLLS}] request_id={request_id} status={status}", flush=True)

        if status == "COMPLETED":
            download_path = f"{videos_dir}/video-{{request_id}}_{{index}}.{{ext}}"
            dl_result = await _run_genmedia([
                "status", "bytedance/seedance-2.0/reference-to-video",
                request_id,
                "--download", download_path,
                "--json"
            ])
            url = dl_result["result"]["video"]["url"]
            local_path = dl_result["downloaded_files"][0]["path"]
            return {"url": url, "local_path": local_path, "request_id": request_id}

        if status in _FAILED_STATUSES:
            raise RuntimeError(f"Video generation failed (status={status}) for request {request_id}")

        if status not in _RUNNING_STATUSES:
            raise RuntimeError(f"Unexpected status '{status}' for request {request_id}")

    raise RuntimeError(f"Video generation timed out after {MAX_POLLS * POLL_INTERVAL}s for request {request_id}")


async def run(story: dict, images: dict, aspect_ratio: str, outputs_dir: str) -> dict:
    storyboard_path = images["storyboard"]["local_path"]
    duration = story.get("duration", 8)

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            image_url = await _upload(storyboard_path)
            request_id = await _submit(image_url, duration, aspect_ratio)
            clip = await _poll(request_id, f"{outputs_dir}/videos")
            return {"clips": [{"scene_number": 1, **clip}]}
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                await asyncio.sleep(5)
    raise RuntimeError(f"Video generation failed after {MAX_RETRIES} attempts: {last_error}")
