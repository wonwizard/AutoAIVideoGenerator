import type { GenerateRequest, Job, StoryData } from "./types";

const BASE = "http://localhost:8000";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const startGenerate = (req: GenerateRequest): Promise<Job> =>
  post(`${BASE}/api/generate`, req);

export const generateImages = (jobId: string, story: StoryData): Promise<Job> =>
  post(`${BASE}/api/job/${jobId}/generate-images`, { story });

export const generateVideo = (jobId: string, story: StoryData, aspectRatio: string): Promise<Job> =>
  post(`${BASE}/api/job/${jobId}/generate-video`, { story, aspect_ratio: aspectRatio });

export async function pollJob(jobId: string): Promise<Job> {
  const res = await fetch(`${BASE}/api/job/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const downloadUrl = (jobId: string): string =>
  `${BASE}/api/download/${jobId}`;

export const imgSrc = (localPath: string): string =>
  `${BASE}/outputs/${localPath.split("outputs/").pop() ?? localPath}`;
