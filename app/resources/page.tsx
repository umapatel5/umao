import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Braces,
  ClipboardCheck,
  History,
  MessageSquareText,
  Network,
  Route,
  Timer
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { codingProblems, problemCategories } from "@/lib/problems/problem-library";

const resourceTracks = [
  {
    title: "Data Structures",
    icon: Network,
    copy: "Arrays, hash maps, trees, and graphs with interviewer-style follow-ups.",
    items: ["Trace examples out loud", "Name the invariant", "Discuss edge cases before coding"]
  },
  {
    title: "System Design Lite",
    icon: Route,
    copy: "Practice scoping, tradeoffs, and structured design communication.",
    items: ["Clarify requirements", "Sketch APIs and data flow", "Call out bottlenecks"]
  },
  {
    title: "Communication",
    icon: MessageSquareText,
    copy: "Build the habit of explaining decisions while keeping momentum.",
    items: ["Narrate assumptions", "Summarize before coding", "Recover cleanly from mistakes"]
  },
  {
    title: "Debugging",
    icon: ClipboardCheck,
    copy: "Use failed test cases as signal instead of panic.",
    items: ["Read expected vs actual", "Create a smaller repro", "Fix one hypothesis at a time"]
  }
];

const drills = [
  { label: "10-minute warmup", value: "1 easy problem + approach explanation", icon: Timer },
  { label: "Mock loop", value: "Code, run tests, answer complexity, review feedback", icon: Brain },
  { label: "Review habit", value: "Open one past result and practice the weakest topic", icon: History }
];

export default function ResourcesPage() {
  const topicCounts = problemCategories.map((category) => ({
    category,
    count: codingProblems.filter((problem) => problem.topics.includes(category)).length
  }));

  return (
    <AppShell active="resources">
      <PageHeader
        eyebrow="Resources"
        title="Prepare like the interview is real"
        copy="Use these focused guides and drills alongside Umao's mock interview workspace."
        actions={
          <Link className="button button-primary" href="/practice">
            <Braces aria-hidden size={17} />
            Choose Problem
          </Link>
        }
      />

      <section className="resources-overview">
        <div className="card panel resource-spotlight">
          <div>
            <span className="pill pill-ready">Recommended next</span>
            <h2>Run a full mock interview, then review the score breakdown.</h2>
            <p>
              Umao already tracks test results, hints, communication metrics, and topic performance.
              The fastest improvement loop is one focused attempt followed by one focused review.
            </p>
          </div>
          <div className="resource-spotlight-actions">
            <Link className="button button-primary" href="/practice">
              Start Interview
              <ArrowRight aria-hidden size={17} />
            </Link>
            <Link className="button button-secondary" href="/history">
              View History
            </Link>
          </div>
        </div>

        <div className="resource-drill-list">
          {drills.map((drill) => {
            const Icon = drill.icon;

            return (
              <article className="card panel resource-drill" key={drill.label}>
                <Icon aria-hidden size={20} />
                <div>
                  <strong>{drill.label}</strong>
                  <span>{drill.value}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="resource-card-grid" aria-label="Interview preparation resources">
        {resourceTracks.map((track) => {
          const Icon = track.icon;

          return (
            <article className="card panel resource-card" key={track.title}>
              <div className="resource-card-header">
                <Icon aria-hidden size={21} />
                <h2>{track.title}</h2>
              </div>
              <p>{track.copy}</p>
              <ul>
                {track.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="card panel topic-roadmap">
        <div className="topic-roadmap-header">
          <div>
            <h2 className="section-title">Problem Library Coverage</h2>
            <p className="meta">Current topic coverage from the modular problem data.</p>
          </div>
          <BookOpenCheck aria-hidden size={22} />
        </div>
        <div className="topic-roadmap-grid">
          {topicCounts.map((topic) => (
            <div className="topic-roadmap-item" key={topic.category}>
              <span>{topic.category}</span>
              <strong>{topic.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
