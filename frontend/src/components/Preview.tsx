import type { StepResult } from "../types";

const BASE = "http://localhost:8000";

interface Props {
  step1: StepResult;
  step2: StepResult;
}

export function Preview({ step1, step2 }: Props) {
  const story = step1.data as {
    character_name?: string;
    scenes?: { scene_number: number; narrative: string }[];
  } | null;

  const images = step2.data as {
    character_sheet_path?: string;
    scene_images?: { scene_number: number; local_path: string }[];
  } | null;

  if (!story && !images) return null;

  const toImgSrc = (localPath: string) =>
    `${BASE}/outputs/${localPath.split("outputs/").pop() ?? localPath}`;

  return (
    <div className="preview">
      {story && (
        <section className="preview-section">
          <h3>스토리 ({story.character_name})</h3>
          <div className="scene-list">
            {story.scenes?.map((s) => (
              <div key={s.scene_number} className="scene-card">
                <span className="scene-num">Scene {s.scene_number}</span>
                <p>{s.narrative}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {images && (
        <section className="preview-section">
          <h3>생성 이미지</h3>
          <div className="image-grid">
            {images.character_sheet_path && (
              <div className="image-card">
                <img src={toImgSrc(images.character_sheet_path)} alt="Character sheet" />
                <span>캐릭터 시트</span>
              </div>
            )}
            {images.scene_images?.map((img) => (
              <div key={img.scene_number} className="image-card">
                <img src={toImgSrc(img.local_path)} alt={`Scene ${img.scene_number}`} />
                <span>Scene {img.scene_number}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
