import { useEffect, useState } from "react";
import type { StepResult, StoryData } from "../types";

interface Props {
  step1: StepResult;
  onGenerateImages: (story: StoryData) => void;
  isLoading: boolean;
}

export function StoryPanel({ step1, onGenerateImages, isLoading }: Props) {
  const [storyText, setStoryText] = useState("");
  const [storyData, setStoryData] = useState<StoryData | null>(null);

  useEffect(() => {
    if (step1.status === "completed" && step1.data) {
      const data = step1.data as unknown as StoryData;
      setStoryData(data);
      setStoryText(data.story_text);
    }
  }, [step1.status, step1.data]);

  const isActive = step1.status === "completed" || step1.status === "failed";
  const isStep1Running = step1.status === "running";

  const handleSubmit = () => {
    if (!storyData) return;
    onGenerateImages({ ...storyData, story_text: storyText });
  };

  return (
    <div className={`panel ${!isActive ? "panel-inactive" : ""}`}>
      <div className="panel-header">
        <span className="panel-step">Step 2</span>
        <span className="panel-title">스토리 편집</span>
        {isStep1Running && <span className="spinner" />}
        {!isActive && !isStep1Running && <span className="panel-waiting">대기 중</span>}
      </div>

      <div className="panel-body">
        {isStep1Running && (
          <div className="panel-loading">
            <span className="spinner lg" />
            <p>스토리 생성 중...</p>
          </div>
        )}

        {step1.status === "failed" && (
          <p className="panel-error">{step1.error}</p>
        )}

        {storyData && (
          <div className="story-editor">
            <section className="editor-section">
              <label className="field-label">스토리 (수정 가능)</label>
              <textarea
                className="field-textarea"
                rows={18}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />
            </section>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button
          className="btn-primary w-full"
          disabled={!storyData || !storyText.trim() || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? <><span className="spinner sm" /> 이미지 생성 중...</> : "이미지 생성 →"}
        </button>
      </div>
    </div>
  );
}
