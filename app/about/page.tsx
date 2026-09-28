import Link from "next/link";
import { ArrowRight, Code2, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";

const values = [
  {
    title: "Practice should feel real",
    copy: "Umao is designed around the full interview moment: coding, explaining, listening, and recovering.",
    icon: HeartHandshake
  },
  {
    title: "Feedback should be usable",
    copy: "Scores and notes should point to the next thing to practice, not just label a performance.",
    icon: Sparkles
  },
  {
    title: "Privacy should be obvious",
    copy: "The app should never need to save raw webcam video or microphone audio to help you improve.",
    icon: ShieldCheck
  },
  {
    title: "Engineering should stay modular",
    copy: "Code execution, AI, speech, avatar, scoring, auth, and history are isolated so the product can grow.",
    icon: Code2
  }
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="site-subpage-hero">
        <span className="site-pill">About Umao</span>
        <h1>
          Built to make technical interview practice feel less fake.
        </h1>
        <p>
          Umao is an early-stage interview simulator project focused on helping candidates practice
          the real skills interviews test: problem solving, communication, and calm execution.
        </p>
        <Link className="site-button site-button-primary site-button-large" href="/practice">
          Try the beta
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>

      <section className="site-card-grid">
        {values.map((value) => {
          const Icon = value.icon;

          return (
            <article key={value.title}>
              <Icon aria-hidden size={26} />
              <h2>{value.title}</h2>
              <p>{value.copy}</p>
            </article>
          );
        })}
      </section>

      <section className="about-note-card">
        <h2>What is true right now?</h2>
        <p>
          Umao has a working Next.js interview workspace, role/problem setup, multi-language runner
          architecture, voice input, avatar fallback, webcam metrics, scoring, accounts, history,
          resources, and settings. It is still a beta project, so the homepage avoids fake customer,
          funding, or company adoption claims.
        </p>
      </section>
    </MarketingShell>
  );
}
