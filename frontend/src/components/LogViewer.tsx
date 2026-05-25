import { useState } from "react";
import type { StepResult } from "../types";

interface Props {
  steps: Record<string, StepResult>;
}

const STEP_NAMES: Record<string, string> = {
  "1": "Step 1: Story",
  "2": "Step 2: Images",
  "3": "Step 3: Videos",
  "4": "Step 4: Assembly",
};

export function LogViewer({ steps }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const entries = Object.entries(steps).filter(
    ([, s]) => s.status === "completed" || s.status === "failed"
  );

  if (entries.length === 0) return null;

  return (
    <div className="log-viewer">
      <h3>생성 로그</h3>
      {entries.map(([key, step]) => (
        <div key={key} className="log-entry">
          <button
            className="log-toggle"
            onClick={() => setOpen(open === key ? null : key)}
          >
            {open === key ? "▼" : "▶"} {STEP_NAMES[key]}
            <span className={`log-status log-${step.status}`}>{step.status}</span>
          </button>
          {open === key && (
            <pre className="log-content">
              {JSON.stringify(step.data ?? { error: step.error }, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
