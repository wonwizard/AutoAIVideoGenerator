export type LLMChoice = "claude" | "gemini";
export type AspectRatio = "16:9" | "9:16";
export type StepStatus = "pending" | "running" | "completed" | "failed";
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface StepResult {
  status: StepStatus;
  data: Record<string, unknown> | null;
  error: string | null;
}

export interface Job {
  job_id: string;
  status: JobStatus;
  current_step: number;
  steps: Record<string, StepResult>;
  error: string | null;
}

export interface GenerateRequest {
  topic: string;
  duration: number;
  llm: LLMChoice;
  aspect_ratio: AspectRatio;
}

export interface StoryData {
  story_text: string;
  duration?: number;
}

export interface ImageData {
  storyboard: { url: string; local_path: string };
}
