import Link from "next/link";
import { ArrowRight, Brain, ClipboardCheck, Code2, MessageSquareText, Network, Route, Timer } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { codingProblems, problemCategories } from "@/lib/problems/problem-library";

const guides = [
  {
    title: "Data structures",
    copy: "Arrays, hash maps, trees, graphs, and dynamic programming practice prompts.",
    icon: Network
  },
  {
    title: "Communication",
    copy: "How to explain your approach, assumptions, tradeoffs, edge cases, and complexity.",
    icon: MessageSquareText
  },
  {
    title: "Debugging",
    copy: "Use failed test cases to narrow the bug instead of rewriting everything.",
    icon: ClipboardCheck
  },
  {
    title: "System thinking",
    copy: "Practice scoping, API design, data flow, and reliability conversations.",
    icon: Route
  }
];

const drills = [
  "10-minute warmup: explain first, code second",
  "One failed-test review before changing code",
  "Complexity answer after every accepted solution",
  "Open one saved result and practice the weakest topic"
];

export default function ResourcesPage() {
  const topicCounts = problemCategories.map((category) => ({
    category,
    count: codingProblems.filter((problem) => problem.topics.includes(category)).length
  }));

  return (
    <MarketingShell>
      <section className="site-subpage-hero">
        <h1>
          Guides and drills for better mock interviews.
        </h1>
        <p>
          Use these resources alongside Umao sessions so each practice round turns into a specific improvement.
        </p>
        <Link className="site-button site-button-primary site-button-large" href="/practice">
          Choose a problem
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>

      <section className="site-card-grid">
        {guides.map((guide) => {
          const Icon = guide.icon;

          return (
            <article key={guide.title}>
              <Icon aria-hidden size={26} />
              <h2>{guide.title}</h2>
              <p>{guide.copy}</p>
            </article>
          );
        })}
      </section>

      <section className="resource-public-layout">
        <div className="resource-drill-card">
          <Timer aria-hidden size={26} />
          <h2>Practice drills</h2>
          <ul>
            {drills.map((drill) => (
              <li key={drill}>{drill}</li>
            ))}
          </ul>
        </div>
        <div className="resource-topic-card">
          <Brain aria-hidden size={26} />
          <h2>Current problem coverage</h2>
          <div>
            {topicCounts.map((topic) => (
              <span key={topic.category}>
                <Code2 aria-hidden size={15} />
                {topic.category}: {topic.count}
              </span>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
