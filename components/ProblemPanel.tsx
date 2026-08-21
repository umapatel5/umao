import { Bookmark, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { codingProblem } from "@/lib/coding-problem";

type ProblemPanelProps = {
  problem?: typeof codingProblem;
};

export function ProblemPanel({ problem = codingProblem }: ProblemPanelProps) {
  return (
    <section className="card problem-panel" aria-labelledby="problem-title">
      <div className="problem-header">
        <div>
          <p className="page-kicker">Current problem</p>
          <h2 className="problem-title" id="problem-title">
            {problem.title}
          </h2>
          <div className="problem-tags">
            {problem.topics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </div>
        <div className="problem-header-actions">
          <span className="pill pill-danger">{problem.difficulty}</span>
          <Bookmark aria-hidden size={19} />
        </div>
      </div>

      <div className="problem-body">
        <p>{problem.prompt}</p>

        <div className="problem-meta-grid" aria-label="Problem metadata">
          <div>
            <Clock3 aria-hidden size={17} />
            {problem.durationMinutes} min
          </div>
          <div>
            <ListChecks aria-hidden size={17} />
            {problem.topics.join(", ")}
          </div>
        </div>

        <div>
          <h3>Constraints</h3>
          <ul className="check-list">
            {problem.constraints.map((constraint) => (
              <li key={constraint}>
                <CheckCircle2 aria-hidden size={16} />
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Examples</h3>
          <div className="examples-list">
            {problem.examples.map((example) => (
              <div className="example-block" key={example.input}>
                <div>
                  <span>Input</span>
                  <code>{example.input}</code>
                </div>
                <div>
                  <span>Output</span>
                  <code>{example.output}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="prompt-block">
          <h3>Interviewer prompt</h3>
          <p>{problem.interviewerPrompt}</p>
        </div>
      </div>
    </section>
  );
}
