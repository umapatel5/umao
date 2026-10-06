import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, Layers3, Server, Wrench } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";

const useCases = [
  {
    role: "Software Engineer",
    copy: "Practice core data structures, algorithms, complexity, and clear problem-solving narration.",
    icon: BriefcaseBusiness
  },
  {
    role: "Front-End Engineer",
    copy: "Focus on UI state, JavaScript, performance, user interaction, and implementation tradeoffs.",
    icon: Code2
  },
  {
    role: "Back-End Engineer",
    copy: "Talk through APIs, data modeling, reliability, and coding problems with service-minded follow-ups.",
    icon: Server
  },
  {
    role: "Full-Stack Engineer",
    copy: "Blend product thinking, frontend behavior, backend structure, and practical debugging.",
    icon: Layers3
  },
  {
    role: "Developer Tools Engineer",
    copy: "Practice DX, automation, execution environments, performance, and tool reliability conversations.",
    icon: Wrench
  }
];

export default function UseCasesPage() {
  return (
    <MarketingShell>
      <section className="site-subpage-hero">
        <h1>
          Practice for the role you actually want.
        </h1>
        <p>
          Umao lets you start from a role, difficulty, and topic so the interview context feels specific instead of generic.
        </p>
      </section>

      <section className="site-card-grid role-use-case-grid">
        {useCases.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className={index === 1 ? "featured" : undefined} key={item.role}>
              <Icon aria-hidden size={28} />
              <h2>{item.role}</h2>
              <p>{item.copy}</p>
              <Link href="/practice">
                Start this track
                <ArrowRight aria-hidden size={16} />
              </Link>
            </article>
          );
        })}
      </section>
    </MarketingShell>
  );
}
