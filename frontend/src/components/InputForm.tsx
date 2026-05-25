import { useState } from "react";
import type { GenerateRequest, LLMChoice, AspectRatio } from "../types";

interface Props {
  onSubmit: (req: GenerateRequest) => void;
  disabled: boolean;
}

export function InputForm({ onSubmit, disabled }: Props) {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(8);
  const [llm, setLlm] = useState<LLMChoice>("gemini");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit({ topic: topic.trim(), duration, llm, aspect_ratio: aspectRatio });
  };

  return (
    <form className="input-form" onSubmit={handleSubmit} style={{ height: "100%", justifyContent: "space-between" }}>
      <div className="field">
        <label>주제</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 도시의 밤거리를 달리는 사이버펑크 고양이"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="field">
        <label>영상 길이: <strong>{duration}초</strong></label>
        <input
          type="range"
          min={3}
          max={30}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={disabled}
        />
        <div className="range-labels"><span>3초</span><span>30초</span></div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>LLM</label>
          <div className="radio-group">
            {(["claude", "gemini"] as LLMChoice[]).map((v) => (
              <label key={v} className="radio-label">
                <input type="radio" name="llm" value={v} checked={llm === v}
                  onChange={() => setLlm(v)} disabled={disabled} />
                {v === "claude" ? "Claude" : "Gemini"}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>종횡비</label>
          <div className="radio-group">
            {(["16:9", "9:16"] as AspectRatio[]).map((v) => (
              <label key={v} className="radio-label">
                <input type="radio" name="ar" value={v} checked={aspectRatio === v}
                  onChange={() => setAspectRatio(v)} disabled={disabled} />
                {v}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={disabled || !topic.trim()}>
        {disabled ? "생성 중..." : "영상 생성 시작"}
      </button>
    </form>
  );
}
