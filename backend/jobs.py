from backend.models import JobStatus, StepStatus, StepResult, JobResponse

_store: dict[str, dict] = {}


def create_job(job_id: str) -> dict:
    job = {
        "job_id": job_id,
        "status": JobStatus.pending,
        "current_step": 0,
        "steps": {str(i): StepResult() for i in range(1, 5)},
        "error": None,
    }
    _store[job_id] = job
    return job


def get_job(job_id: str) -> dict | None:
    return _store.get(job_id)


def set_step_running(job_id: str, step: int) -> None:
    job = _store[job_id]
    job["status"] = JobStatus.running
    job["current_step"] = step
    job["steps"][str(step)].status = StepStatus.running


def set_step_completed(job_id: str, step: int, data: dict) -> None:
    job = _store[job_id]
    job["steps"][str(step)].status = StepStatus.completed
    job["steps"][str(step)].data = data


def set_step_failed(job_id: str, step: int, error: str) -> None:
    job = _store[job_id]
    job["steps"][str(step)].status = StepStatus.failed
    job["steps"][str(step)].error = error
    job["status"] = JobStatus.failed
    job["error"] = f"Step {step} failed: {error}"


def set_job_completed(job_id: str) -> None:
    _store[job_id]["status"] = JobStatus.completed


def reset_steps_from(job_id: str, from_step: int) -> None:
    job = _store[job_id]
    for i in range(from_step, 5):
        job["steps"][str(i)] = StepResult()
    job["status"] = JobStatus.running
    job["error"] = None


def get_outputs_dir(job_id: str) -> str:
    return f"outputs/{job_id}"


def to_response(job: dict) -> JobResponse:
    return JobResponse(**job)
