import { CheckCircle2, Clock3, ListChecks } from "lucide-react";

const constraints = [
  "Return the indices in ascending order.",
  "Exactly one valid pair is guaranteed.",
  "Target runtime should be O(n)."
];

const examples = [
  {
    input: "nums = [2, 7, 11, 15], target = 9",
    output: "[0, 1]"
  },
  {
    input: "nums = [3, 2, 4], target = 6",
    output: "[1, 2]"
  }
];

export function ProblemPanel() {
  return (
    <section className="card problem-panel" aria-labelledby="problem-title">
      <div className="problem-header">
        <div>
          <p className="page-kicker">Hardcoded practice problem</p>
          <h2 className="problem-title" id="problem-title">
            Two Sum With Interview Follow-up
          </h2>
        </div>
        <span className="pill pill-ready">Medium</span>
      </div>

      <div className="problem-body">
        <p>
          Given an array of integers and a target value, return the indices of the two numbers
          that add up to the target. Explain your approach as if speaking to an interviewer.
        </p>

        <div className="problem-meta-grid" aria-label="Problem metadata">
          <div>
            <Clock3 aria-hidden size={17} />
            45 min
          </div>
          <div>
            <ListChecks aria-hidden size={17} />
            Arrays, hash map
          </div>
        </div>

        <div>
          <h3>Constraints</h3>
          <ul className="check-list">
            {constraints.map((constraint) => (
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
            {examples.map((example) => (
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
          <p>
            Start with clarifying questions, describe a brute-force option, then implement the
            optimized hash map approach.
          </p>
        </div>
      </div>
    </section>
  );
}
