import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";

const freeFeatures = [
  "Practice setup by role, difficulty, and topic",
  "Coding workspace with test-case feedback",
  "Text and voice candidate responses",
  "Interview scoring and saved history",
  "Resources, settings, and progress analytics"
];

const futureFeatures = [
  "Production-grade hosted code runner",
  "More interview question packs",
  "Richer avatar/lip-sync provider options",
  "Exportable reports and team/classroom features"
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="site-subpage-hero">
        <span className="site-pill">Pricing</span>
        <h1>
          Start free while Umao is in beta.
        </h1>
        <p>
          Umao is a student-built beta project right now, so the current practice flow is free to try.
          Paid plans can come later if the product grows.
        </p>
      </section>

      <section className="pricing-layout">
        <article className="pricing-card featured">
          <span>Current beta</span>
          <h2>Free</h2>
          <p>Use the working practice flow locally or in the current app build.</p>
          <Link className="site-button site-button-primary" href="/practice">
            Start practicing
            <ArrowRight aria-hidden size={17} />
          </Link>
          <ul>
            {freeFeatures.map((feature) => (
              <li key={feature}>
                <CheckCircle2 aria-hidden size={17} />
                {feature}
              </li>
            ))}
          </ul>
        </article>

        <article className="pricing-card">
          <span>Future option</span>
          <h2>Pro</h2>
          <p>
            No paid plan is active today. These are roadmap ideas for a hosted version if Umao grows beyond the beta.
          </p>
          <ul>
            {futureFeatures.map((feature) => (
              <li key={feature}>
                <CheckCircle2 aria-hidden size={17} />
                {feature}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </MarketingShell>
  );
}
