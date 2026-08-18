import type { FeedbackItem } from "@/types/interview";

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  return (
    <div className="feedback-list">
      {items.map((item) => (
        <article className="feedback-item" key={item.title}>
          <strong>{item.title}</strong>
          <div className="meta">{item.detail}</div>
        </article>
      ))}
    </div>
  );
}
