import { Camera, Mic, PhoneOff, Volume2 } from "lucide-react";

export function InterviewControls() {
  return (
    <section className="card panel">
      <div className="side-panel-header" style={{ padding: 0, borderBottom: 0, marginBottom: 14 }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 2 }}>Live inputs</h2>
          <div className="meta">Prepared for browser media permissions</div>
        </div>
      </div>

      <div className="media-grid">
        <div className="media-tile">
          <div>
            <Camera aria-hidden size={24} />
            <div>Webcam preview</div>
          </div>
        </div>
        <div className="media-tile">
          <div>
            <Mic aria-hidden size={24} />
            <div>Voice transcript</div>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 14 }}>
        <button className="button button-secondary" type="button">
          <Mic aria-hidden size={17} />
          Mute
        </button>
        <button className="button button-secondary" type="button">
          <Volume2 aria-hidden size={17} />
          Audio
        </button>
        <button className="button button-ghost" type="button">
          <PhoneOff aria-hidden size={17} />
          End
        </button>
      </div>
    </section>
  );
}
