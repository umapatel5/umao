import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Code2, MessageCircle, ShieldCheck, Target } from "lucide-react";
import { InterviewProductMockup } from "@/components/InterviewProductMockup";
import { MarketingDemoModal } from "@/components/MarketingDemoModal";
import { MarketingShell } from "@/components/MarketingShell";

const productFacts = [
  { label: "Supported languages", value: "4" },
  { label: "Role tracks", value: "5" },
  { label: "Score categories", value: "3" },
  { label: "Raw media saved", value: "0" }
];

const features = [
  {
    title: "Adaptive interviewer",
    copy: "Questions and follow-ups change based on your code, test results, and answers.",
    icon: Code2
  },
  {
    title: "Natural conversation",
    copy: "Speak or type through your thought process while the transcript stays visible.",
    icon: MessageCircle
  },
  {
    title: "Actionable feedback",
    copy: "Review coding, problem-solving, and communication scores after each session.",
    icon: BarChart3
  },
  {
    title: "Interview-ready confidence",
    copy: "Practice the flow of a real technical screen before the real thing.",
    icon: Target
  }
];

const workflowSteps = [
  {
    step: "01",
    title: "Choose the interview you want to practice.",
    copy: "Pick a role, difficulty, and topic so the coding prompt and interviewer questions match what you are preparing for.",
    visual: "Role setup"
  },
  {
    step: "02",
    title: "Code while the interviewer follows your process.",
    copy: "Run test cases, explain your approach, ask for hints, and keep the conversation moving like a real technical screen.",
    visual: "Live workspace"
  },
  {
    step: "03",
    title: "Walk away knowing what to improve next.",
    copy: "Umao turns coding results, communication signals, and interview history into feedback you can actually practice from.",
    visual: "Score report"
  }
];

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="site-hero">
        <div className="site-hero-copy">
          <span className="site-hero-kicker">AI technical interview simulator</span>
          <h1>
            Practice for your next technology interview.
          </h1>
          <p>
            Live coding sessions, AI interviews, body language and speech monitoring,
            and actionable feedback to help you improve.
          </p>
          <div className="site-action-row">
            <Link className="site-button site-button-primary site-button-large" href="/practice">
              Get started
              <ArrowRight aria-hidden size={18} />
            </Link>
            <MarketingDemoModal />
          </div>
          <div className="site-proof-row">
            <span>
              <CheckCircle2 aria-hidden size={15} />
              Early beta
            </span>
            <span>
              <CheckCircle2 aria-hidden size={15} />
              No company claims
            </span>
            <span>
              <CheckCircle2 aria-hidden size={15} />
              No raw media saved
            </span>
          </div>
        </div>

        <InterviewProductMockup />
      </section>

      <section className="site-facts" aria-label="Current Umao product facts">
        <span className="site-facts-label">Current Umao build includes</span>
        {productFacts.map((fact) => (
          <article key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </article>
        ))}
      </section>

      <section className="site-feature-strip" aria-label="Umao product strengths">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title}>
              <Icon aria-hidden size={26} />
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="site-role-section" id="product">
        <div>
          <h2>
            Practice for the role you <em>actually</em> want.
          </h2>
          <p>
            Choose Software Engineer, Front-End, Back-End, Full-Stack, or Developer Tools.
            Umao carries that context into the interview session.
          </p>
        </div>
        <div className="role-list">
          {["Front-End Engineer", "Back-End Engineer", "Full-Stack Engineer", "Developer Tools Engineer"].map((role, index) => (
            <Link className={index === 0 ? "active" : undefined} href="/practice" key={role}>
              <span>{role}</span>
              <ArrowRight aria-hidden size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="site-how-section" id="workflow">
        <div className="site-how-heading">
          <span className="site-section-kicker">How Umao works</span>
          <h2>
            Three steps to feel <em>prepared.</em>
          </h2>
          <p>
            Scroll through the practice flow: set your target, work through a live interview,
            then use the report to decide what to practice next.
          </p>
        </div>

        <div className="site-workflow-scroll">
          {workflowSteps.map((item) => (
            <article className="site-workflow-step" key={item.step}>
              <div className="site-workflow-copy">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
              <div className="site-workflow-visual" aria-hidden>
                <span>{item.visual}</span>
                <div className="workflow-visual-lines">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </article>
          ))}
        </div>

        <Link className="site-button site-button-primary site-button-large site-how-cta" href="/practice">
          Start Practicing
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>

      <section className="site-results-section">
        <div>
          <span className="site-section-kicker">Results & insights</span>
          <h2>
            See exactly how you’re <em>improving.</em>
          </h2>
          <p>
            Umao combines test-case results, hints used, conversation quality, speaking duration,
            pauses, and camera signals into a focused score report.
          </p>
        </div>
        <div className="results-preview-card">
          <span>Your Interview Score</span>
          <strong>82</strong>
          <small>/100</small>
          <div>
            <p>Coding <b>88</b></p>
            <p>Problem solving <b>85</b></p>
            <p>Communication <b>76</b></p>
          </div>
        </div>
      </section>

      <section className="site-cta-section">
        <div>
          <span className="site-section-kicker">Built for engineers</span>
          <h2>
            Walk into your next interview <em>ready.</em>
          </h2>
          <p>Real conversations. Actionable feedback. Everything you need to practice with confidence.</p>
          <div className="site-truth-grid">
            <span><ShieldCheck size={22} /> No raw media saved</span>
            <span><Code2 size={22} /> Practice in your browser</span>
            <span><BarChart3 size={22} /> Feedback, not grades alone</span>
          </div>
        </div>
        <div className="site-cta-card">
          <h3>Start practicing today</h3>
          <p>Try the current Umao beta and improve one mock interview at a time.</p>
          <Link className="site-button site-button-light" href="/practice">
            Start practicing
            <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
