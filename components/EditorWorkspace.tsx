import { Play, RotateCcw } from "lucide-react";

const starterCode = `type Candidate = {
  id: string;
  score: number;
  tags: string[];
};

export function rankCandidates(candidates: Candidate[]) {
  // Monaco Editor will mount in this surface.
  return candidates.sort((a, b) => b.score - a.score);
}`;

export function EditorWorkspace() {
  return (
    <section className="card workspace">
      <div className="workspace-header">
        <div>
          <strong>Solution.ts</strong>
          <div className="meta">Editor integration placeholder</div>
        </div>
        <div className="toolbar">
          <button className="button button-secondary" type="button">
            <RotateCcw aria-hidden size={17} />
            Reset
          </button>
          <button className="button button-primary" type="button">
            <Play aria-hidden size={17} />
            Run
          </button>
        </div>
      </div>
      <div className="editor-placeholder" data-editor-target="monaco">
        <div className="editor-tabs">
          <span className="editor-tab">TypeScript</span>
          <span className="pill">Monaco-ready mount</span>
        </div>
        <pre className="code-lines">{starterCode}</pre>
      </div>
    </section>
  );
}
