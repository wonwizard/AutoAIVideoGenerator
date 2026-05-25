import asyncio
import json
import subprocess
from pathlib import Path


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
        raise RuntimeError(f"genmedia image failed: {result.stderr}")
    data = json.loads(result.stdout)
    print(f"[genmedia OUT] {json.dumps(data, ensure_ascii=False)}", flush=True)
    return data


async def _run_genmedia(args: list[str]) -> dict:
    return await asyncio.to_thread(_run_genmedia_sync, args)


async def run(story: dict, outputs_dir: str) -> dict:
    story_text = story["story_text"]
    prompt = f"{story_text}\n\n영어로 스토리보드 이미지로 만들어줘."

    download_path = f"{outputs_dir}/images/storyboard-{{request_id}}_{{index}}.{{ext}}"
    Path(download_path).parent.mkdir(parents=True, exist_ok=True)

    result = await _run_genmedia([
        "run", "openai/gpt-image-2",
        "--prompt", prompt,
        "--quality", "high",
        "--image_size", json.dumps({"width": 1792, "height": 1024}),
        "--output_format", "png",
        "--download", download_path,
        "--json"
    ])

    request_id = result.get("request_id", "unknown")
    images = result.get("images", [])
    url = images[0]["url"] if images else ""
    actual_path = (
        download_path
        .replace("{request_id}", request_id)
        .replace("{index}", "0")
        .replace("{ext}", "png")
    )
    return {"storyboard": {"url": url, "local_path": actual_path, "request_id": request_id}}
