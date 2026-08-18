import type { InterviewMetric } from "@/types/interview";

export function MetricCard({ metric }: { metric: InterviewMetric }) {
  return (
    <article className="card panel">
      <div className="stat-label">{metric.label}</div>
      <div className="stat-value">{metric.value}</div>
      {metric.trend ? <div className="meta">{metric.trend}</div> : null}
    </article>
  );
}
