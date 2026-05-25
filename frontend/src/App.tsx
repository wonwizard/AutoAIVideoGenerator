import { useEffect, useRef, useState } from "react";
import { InputForm } from "./components/InputForm";
import { StoryPanel } from "./components/StoryPanel";
import { ImagePanel } from "./components/ImagePanel";
import { VideoPanel } from "./components/VideoPanel";
import { startGenerate, generateImages, generateVideo, pollJob } from "./api";
import type { GenerateRequest, Job, StoryData } from "./types";
import "./App.css";

const POLL_MS = 3000;

export default function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [submittedStory, setSubmittedStory] = useState<StoryData | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 버튼 클릭 즉시 로딩 표시 (job 상태 폴링과 별도)
  const [isImagesLoading, setIsImagesLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step1 = job?.steps["1"] ?? { status: "pending" as const, data: null, error: null };
  const step2 = job?.steps["2"] ?? { status: "pending" as const, data: null, error: null };
  const step3 = job?.steps["3"] ?? { status: "pending" as const, data: null, error: null };
  const step4 = job?.steps["4"] ?? { status: "pending" as const, data: null, error: null };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const updated = await pollJob(id);
        setJob(updated);

        // 이미지 로딩 완료/실패 처리
        const s2 = updated.steps["2"];
        if (s2.status === "completed") {
          setIsImagesLoading(false);
        } else if (s2.status === "failed") {
          setIsImagesLoading(false);
          setGlobalError(`이미지 생성 실패: ${s2.error || "알 수 없는 오류"}`);
        }

        // 영상 로딩 완료/실패 처리
        const s4 = updated.steps["4"];
        const s3 = updated.steps["3"];
        if (s4.status === "completed") {
          setIsVideoLoading(false);
        } else if (s4.status === "failed" || s3.status === "failed") {
          setIsVideoLoading(false);
          setGlobalError(`영상 생성 실패: ${s3.error || s4.error || "알 수 없는 오류"}`);
        }

        // 진행 중인 step이 없고 최종 상태이면 폴링 중단
        const anyRunning = Object.values(updated.steps).some(s => s.status === "running");
        const isPending = updated.status === "pending";
        const isRunning = updated.status === "running";
        if (!anyRunning && !isPending && !isRunning) {
          stopPolling();
        }
      } catch { /* transient network error */ }
    }, POLL_MS);
  };

  useEffect(() => () => stopPolling(), []);

  // ── 핸들러 ──────────────────────────────────────────────────────

  const handleGenerate = async (req: GenerateRequest) => {
    setGlobalError(null);
    setJob(null);
    setSubmittedStory(null);
    setIsImagesLoading(false);
    setIsVideoLoading(false);
    setAspectRatio(req.aspect_ratio);
    stopPolling();
    try {
      const initial = await startGenerate(req);
      setJobId(initial.job_id);
      setJob(initial);
      startPolling(initial.job_id);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "스토리 생성 오류");
    }
  };

  const handleGenerateImages = async (story: StoryData) => {
    if (!jobId) return;
    setGlobalError(null);
    setSubmittedStory(story);
    setIsImagesLoading(true);   // 버튼 클릭 즉시 로딩 표시
    stopPolling();
    try {
      const updated = await generateImages(jobId, story);
      setJob(updated);
      startPolling(jobId);
    } catch (e) {
      setIsImagesLoading(false);
      setGlobalError(e instanceof Error ? e.message : "이미지 생성 오류");
    }
  };

  const handleRegenerateImages = () => {
    if (!jobId || !submittedStory) return;
    handleGenerateImages(submittedStory);
  };

  const handleGenerateVideo = async () => {
    if (!jobId || !submittedStory) return;
    setGlobalError(null);
    setIsVideoLoading(true);    // 버튼 클릭 즉시 로딩 표시
    stopPolling();
    try {
      const updated = await generateVideo(jobId, submittedStory, aspectRatio);
      setJob(updated);
      startPolling(jobId);
    } catch (e) {
      setIsVideoLoading(false);
      setGlobalError(e instanceof Error ? e.message : "영상 생성 오류");
    }
  };

  const isStep1Running = step1.status === "running" || job?.status === "pending";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Auto AI Video Generator</h1>
      </header>

      {globalError && (
        <div className="global-error" onClick={() => setGlobalError(null)}>
          {globalError} <span className="error-close">✕</span>
        </div>
      )}

      <div className="workspace">
        {/* Panel 1 — 입력 */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-step">Step 1</span>
            <span className="panel-title">입력</span>
            {isStep1Running && <span className="spinner" />}
          </div>
          <div className="panel-body">
            <InputForm onSubmit={handleGenerate} disabled={isStep1Running} />
          </div>
        </div>

        {/* Panel 2 — 스토리 편집 */}
        <StoryPanel
          step1={step1}
          onGenerateImages={handleGenerateImages}
          isLoading={isImagesLoading}
        />

        {/* Panel 3 — 이미지 확인 */}
        <ImagePanel
          step2={step2}
          onRegenerateImages={handleRegenerateImages}
          onGenerateVideo={handleGenerateVideo}
          isLoadingImages={isImagesLoading}
          isLoadingVideo={isVideoLoading}
          canProceed={step2.status === "completed" && !!submittedStory && !isImagesLoading}
        />

        {/* Panel 4 — 영상 결과 */}
        <VideoPanel
          step3={step3}
          step4={step4}
          jobId={jobId}
          onRegenerateVideo={handleGenerateVideo}
          isLoading={isVideoLoading}
        />
      </div>
    </div>
  );
}
