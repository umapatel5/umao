import Link from "next/link";
import { ArrowRight, Bot, Code2, Mic, MonitorPlay, ShieldCheck } from "lucide-react";
import { InterviewProductMockup } from "@/components/InterviewProductMockup";
import { MarketingShell } from "@/components/MarketingShell";

const productItems = [
  { title: "Coding workspace", copy: "Monaco-style editor, language selection, run/submit flow, and test-case feedback.", icon: Code2 },
  { title: "Interviewer conversation", copy: "Follow-up questions based on the current problem, code, test errors, and history.", icon: Bot },
  { title: "Voice input", copy: "Candidate speech can become editable transcript text before sending.", icon: Mic },
  { title: "Avatar-ready panel", copy: "Local avatar fallback plus Tavus integration hooks for spoken interviewer responses.", icon: MonitorPlay },
  { title: "Privacy guardrails", copy: "No webcam video, microphone audio, API keys, or raw media are saved in the app.", icon: ShieldCheck }
];

export default function ProductPage() {
  return (
    <MarketingShell>
      <section className="site-subpage-hero">
        <span className="site-pill">Product</span>
        <h1>
          A complete mock interview room, not just a code editor.
        </h1>
        <p>
          Umao brings coding, conversation, voice, avatar playback, camera signals, and scoring into one practice flow.
        </p>
        <Link className="site-button site-button-primary site-button-large" href="/practice">
          Try the product
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>

      <section className="site-showcase">
        <InterviewProductMockup compact />
      </section>

      <section className="site-card-grid">
        {productItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title}>
              <Icon aria-hidden size={26} />
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </article>
          );
        })}
      </section>
    </MarketingShell>
  );
}
