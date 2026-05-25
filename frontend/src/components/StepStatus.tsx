import type { StepResult } from "../types";

const STEP_LABELS: Record<number, string> = {
  1: "트렌드 분석 + 스토리 생성",
  2: "캐릭터 시트 + 씬 이미지 생성",
  3: "씬별 영상 클립 생성",
  4: "영상 합성 (ffmpeg)",
};

const STATUS_ICON: Record<string, string> = {
  pending: "○",
  running: "◎",
  completed: "●",
  failed: "✕",
};

interface Props {
  steps: Record<string, StepResult>;
  currentStep: number;
}

export function StepStatus({ steps, currentStep }: Props) {
  return (
    <div className="step-status">
      {[1, 2, 3, 4].map((n) => {
        const step = steps[String(n)];
        const status = step?.status ?? "pending";
        return (
          <div key={n} className={`step-item step-${status}`}>
            <span className="step-icon">{STATUS_ICON[status]}</span>
            <span className="step-label">
              Step {n} — {STEP_LABELS[n]}
            </span>
            {status === "running" && (
              <span className="step-spinner" />
            )}
            {status === "failed" && step?.error && (
              <span className="step-error">{step.error}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
