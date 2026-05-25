import shutil
from pathlib import Path


async def run(clips: list[dict], outputs_dir: str) -> dict:
    final_path = str(Path(outputs_dir) / "videos" / "final.mp4")
    Path(final_path).parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(clips[0]["local_path"], final_path)
    return {"final_path": final_path}
