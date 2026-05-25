import type { StepResult } from "../types";
import { imgSrc } from "../api";

interface Props {
  step2: StepResult;
  onRegenerateImages: () => void;
  onGenerateVideo: () => void;
  isLoadingImages: boolean;
  isLoadingVideo: boolean;
  canProceed: boolean;
}

export function ImagePanel({
  step2,
  onRegenerateImages,
  onGenerateVideo,
  isLoadingImages,
  isLoadingVideo,
  canProceed,
}: Props) {
  const isActive = step2.status !== "pending" || isLoadingImages;
  const isRunning = step2.status === "running" || isLoadingImages;

  type ImgData = { storyboard: { local_path: string } };
  const images = step2.data as ImgData | null;

  return (
    <div className={`panel ${!isActive ? "panel-inactive" : ""}`}>
      <div className="panel-header">
        <span className="panel-step">Step 3</span>
        <span className="panel-title">이미지 확인</span>
        {isRunning && <span className="spinner" />}
        {!isActive && <span className="panel-waiting">대기 중</span>}
      </div>

      <div className="panel-body">
        {isRunning && (
          <div className="panel-loading">
            <span className="spinner lg" />
            <p>이미지 생성 중...</p>
          </div>
        )}

        {step2.status === "failed" && (
          <p className="panel-error">{step2.error}</p>
        )}

        {images && (
          <div className="image-viewer">
            <div className="img-section">
              <p className="img-label">스토리보드</p>
              <img
                className="char-sheet-img"
                src={imgSrc(images.storyboard.local_path)}
                alt="Storyboard"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer footer-row">
        <button
          className="btn-secondary"
          disabled={!images || isLoadingImages || isLoadingVideo}
          onClick={onRegenerateImages}
        >
          {isLoadingImages ? <><span className="spinner sm" /> 재생성 중</> : "이미지 재생성"}
        </button>
        <button
          className="btn-primary"
          disabled={!canProceed || isLoadingImages || isLoadingVideo}
          onClick={onGenerateVideo}
        >
          {isLoadingVideo ? <><span className="spinner sm" /> 영상 생성 중</> : "영상 생성 →"}
        </button>
      </div>
    </div>
  );
}
