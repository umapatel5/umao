import { MessageSquareText } from "lucide-react";

const transcriptLines = [
  {
    speaker: "Interviewer",
    timestamp: "00:05",
    text: "When you are ready, walk me through your understanding of the problem."
  },
  {
    speaker: "Candidate",
    timestamp: "00:18",
    text: "I would confirm the input size, the existence of one valid answer, and whether indices should be sorted."
  },
  {
    speaker: "System",
    timestamp: "Live",
    text: "Transcription is mocked. No microphone access is requested."
  }
];

export function TranscriptPanel() {
  return (
    <section className="card panel interview-support-card" aria-labelledby="transcript-title">
      <div className="side-panel-header compact-panel-header">
        <div>
          <h2 className="section-title" id="transcript-title">
            Live transcript
          </h2>
          <div className="meta">Voice transcription placeholder</div>
        </div>
        <MessageSquareText aria-hidden size={19} />
      </div>

      <div className="transcript-list">
        {transcriptLines.map((line) => (
          <article className="transcript-line" key={`${line.speaker}-${line.text}`}>
            <div className="transcript-speaker-row">
              <strong>{line.speaker}</strong>
              <span>{line.timestamp}</span>
            </div>
            <p>{line.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
