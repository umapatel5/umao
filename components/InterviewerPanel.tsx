import { Bot, Camera, UserRound } from "lucide-react";

export function InterviewerPanel() {
  return (
    <section className="card panel interview-support-card" aria-labelledby="interviewer-title">
      <div className="side-panel-header compact-panel-header">
        <div>
          <h2 className="section-title" id="interviewer-title">
            AI interviewer
          </h2>
          <div className="meta">Video and AI are placeholders for now</div>
        </div>
        <span className="pill">Offline</span>
      </div>

      <div className="video-stage">
        <div className="interviewer-video">
          <Bot aria-hidden size={34} />
          <div>
            <strong>AI interviewer</strong>
            <span>Future avatar or video stream</span>
          </div>
        </div>

        <div className="user-webcam-tile">
          <UserRound aria-hidden size={22} />
          <div>
            <strong>User webcam</strong>
            <span>Preview placeholder</span>
          </div>
        </div>
      </div>

      <div className="media-status-row">
        <span>
          <Camera aria-hidden size={15} />
          Camera not connected
        </span>
        <span>AI feedback paused</span>
      </div>
    </section>
  );
}
