import type { StepResult } from "../types";
import { downloadUrl } from "../api";

interface Props {
  step3: StepResult;
  step4: StepResult;
  jobId: string | null;
  onRegenerateVideo: () => void;
  isLoading: boolean;
}

export function VideoPanel({ step3, step4, jobId, onRegenerateVideo, isLoading }: Props) {
  const isActive = step3.status !== "pending" || step4.status !== "pending" || isLoading;
  const isRunning = step3.status === "running" || step4.status === "running" || isLoading;
  const isCompleted = step4.status === "completed";
  const hasFinalPath = !!(step4.data as { final_path?: string } | null)?.final_path;

  const stepLabel = step3.status === "running"
    ? "영상 클립 생성 중..."
    : step4.status === "running"
    ? "영상 합성 중..."
    : null;

  return (
    <div className={`panel ${!isActive ? "panel-inactive" : ""}`}>
      <div className="panel-header">
        <span className="panel-step">Step 4</span>
        <span className="panel-title">영상 결과</span>
        {isRunning && <span className="spinner" />}
        {!isActive && <span className="panel-waiting">대기 중</span>}
      </div>

      <div className="panel-body">
        {isRunning && (
          <div className="panel-loading">
            <span className="spinner lg" />
            <p>{stepLabel}</p>
            <p className="hint">씬별 생성에 수 분이 소요됩니다</p>
          </div>
        )}

        {(step3.status === "failed" || step4.status === "failed") && (
          <p className="panel-error">
            {step3.error ?? step4.error}
          </p>
        )}

        {isCompleted && jobId && hasFinalPath && (
          <div className="video-viewer">
            <video
              className="result-video"
              src={downloadUrl(jobId)}
              controls
              autoPlay={false}
            />
          </div>
        )}
      </div>

      <div className="panel-footer footer-row">
        <button
          className="btn-secondary"
          disabled={!isActive || isLoading || isRunning}
          onClick={onRegenerateVideo}
        >
          {isLoading ? <><span className="spinner sm" /> 재생성 중</> : "영상 재생성"}
        </button>
        {isCompleted && jobId && hasFinalPath && (
          <a
            className="btn-primary"
            href={downloadUrl(jobId)}
            download="final.mp4"
          >
            MP4 다운로드
          </a>
        )}
      </div>
    </div>
  );
}
