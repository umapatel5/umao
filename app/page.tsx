import Link from "next/link";
import { ArrowRight, BarChart3, Code2, MessageCircle, Mic, Sparkles, Video } from "lucide-react";
import { InterviewProductMockup } from "@/components/InterviewProductMockup";
import { MarketingShell } from "@/components/MarketingShell";
import { ScrollReveal } from "@/components/ScrollReveal";

const workflowSteps = [
  {
    step: "01",
    title: "Pick what you are practicing for.",
    copy: "Choose a role, difficulty, and topic so the session feels like the interview you actually care about.",
    icon: Code2
  },
  {
    step: "02",
    title: "Talk through the problem out loud.",
    copy: "Code, run tests, answer follow-ups, and keep your thought process visible without making it feel stiff.",
    icon: Mic
  },
  {
    step: "03",
    title: "Leave with a clearer next step.",
    copy: "Review coding, communication, and problem-solving feedback so your next practice round is more focused.",
    icon: BarChart3
  }
];

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="site-hero">
        <div className="site-hero-copy">
          <h1>Practice for your next technology interview.</h1>
          <p>
            Work through a coding problem, talk it out, and get feedback on what to try next.
            A little practice goes a long way.
          </p>
          <div className="site-action-row">
            <Link className="site-button site-button-primary site-button-large" href="/signup">
              Start practicing
              <ArrowRight aria-hidden size={18} />
            </Link>
            <a className="site-button site-button-secondary site-button-large" href="#try-demo">Try the demo</a>
          </div>
          <p className="site-demo-notice">
            Demo note: the live video interviewer is currently paused due to provider usage limits.
            You can still explore the interactive demo below.
          </p>
        </div>

      </section>

      <section className="site-preview-section" id="try-demo" aria-label="Preview of the coding interview workspace">
        <p className="site-preview-caption">A coding problem. A conversation. Room to figure it out.</p>
        <InterviewProductMockup />
      </section>

      <section className="site-soft-strip" aria-label="What Umao helps with">
        <span><Video aria-hidden size={19} /> Practice speaking on camera</span>
        <span><Code2 aria-hidden size={19} /> Solve real coding prompts</span>
        <span><MessageCircle aria-hidden size={19} /> Get used to follow-up questions</span>
        <span><Sparkles aria-hidden size={19} /> Review gentle, useful feedback</span>
      </section>

      <section className="site-how-section" id="how-it-works">
        <div className="site-how-heading">
          <span className="site-section-kicker">How it feels</span>
          <h2>Three simple steps before your real interview.</h2>
          <p>
            No giant maze of pages. Just choose a session, practice, and use the feedback to decide
            what to work on next.
          </p>
        </div>

        <div className="site-workflow-scroll">
          {workflowSteps.map((item) => {
            const Icon = item.icon;

            return (
              <ScrollReveal key={item.step}>
              <article className="site-workflow-step">
                <Icon aria-hidden size={26} />
                <div className="site-workflow-copy">
                  <span>{item.step}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      <section className="site-note-section">
        <div>
          <span className="site-section-kicker">Made to feel human</span>
          <h2>Practice without feeling like you are talking to a robot.</h2>
          <p>
            The app keeps the useful parts of technical interview prep: coding, speaking clearly,
            staying present on camera, and understanding what improved after each session.
          </p>
        </div>
        <Link className="site-button site-button-primary site-button-large" href="/signup">
          Create your practice space
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>

      <section className="site-final-cta">
        <h2>Ready for a calmer practice round?</h2>
        <p>Make an account, pick a role, and start with one interview.</p>
        <Link className="site-button site-button-primary site-button-large" href="/signup">
          Start practicing
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>
    </MarketingShell>
  );
}
