import Image from "next/image";
import { BarChart3, CheckCircle2, Code2, MessageSquareText, Play, RotateCcw, Settings } from "lucide-react";

type InterviewProductMockupProps = {
  compact?: boolean;
};

export function InterviewProductMockup({ compact = false }: InterviewProductMockupProps) {
  return (
    <div className={compact ? "product-mockup compact" : "product-mockup"} aria-label="Umao interview workspace preview">
      <aside className="mockup-sidebar" aria-hidden>
        <span className="mockup-logo">U</span>
        <Code2 size={20} />
        <MessageSquareText size={20} />
        <BarChart3 size={20} />
        <Settings size={20} />
      </aside>

      <div className="mockup-main">
        <div className="mockup-topbar">
          <strong>Frontend Engineer Interview</strong>
          <span className="mockup-live">Live</span>
          <span>45:12</span>
        </div>

        <div className="mockup-grid">
          <section className="mockup-editor">
            <div className="mockup-tabs">
              <span>index.tsx</span>
              <span>Python</span>
            </div>
            <pre>{`function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`}</pre>
            <div className="mockup-runbar">
              <span>
                <CheckCircle2 size={15} />
                Code is running
              </span>
              <button type="button">
                <Play size={14} />
                Run
              </button>
              <button type="button">
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          </section>

          <aside className="mockup-interview">
            <div className="mockup-video">
              <Image
                alt="Umao interviewer preview"
                height={250}
                src="/avatar/interviewer.png"
                width={360}
              />
              <span>Interviewer</span>
            </div>
            <div className="mockup-transcript">
              <div>
                <strong>Transcript</strong>
                <span>Test Cases</span>
              </div>
              <p><strong>Interviewer</strong> What is the time complexity?</p>
              <p><strong>You</strong> It is O(n) time and O(n) space.</p>
            </div>
          </aside>
        </div>

        <div className="mockup-footer">
          <span className="active">1. Coding</span>
          <span>2. Conversation</span>
          <span>3. Test Cases</span>
          <span>4. Feedback</span>
        </div>
      </div>
    </div>
  );
}
