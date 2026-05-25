from pydantic import BaseModel, Field
from typing import Literal, Any
from enum import Enum


class LLMChoice(str, Enum):
    claude = "claude"
    gemini = "gemini"


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    duration: int = Field(..., ge=3, le=30)
    llm: LLMChoice = LLMChoice.claude
    aspect_ratio: Literal["16:9", "9:16"] = "16:9"


class StepStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class StepResult(BaseModel):
    status: StepStatus = StepStatus.pending
    data: Any = None
    error: str | None = None


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    current_step: int
    steps: dict[str, StepResult]
    error: str | None = None
