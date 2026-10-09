"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Pause, PlayCircle, X } from "lucide-react";
import Link from "next/link";

export function MarketingDemoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button className="site-button site-button-secondary site-button-large" onClick={() => setIsOpen(true)} type="button">
        <PlayCircle aria-hidden size={18} />
        Watch the flow
      </button>

      {isOpen ? (
        <div aria-labelledby="demo-modal-title" aria-modal="true" className="demo-modal-backdrop" role="dialog">
          <div className="demo-modal">
            <button aria-label="Close demo" className="demo-modal-close" onClick={() => setIsOpen(false)} type="button">
              <X aria-hidden size={20} />
            </button>

            <div className="demo-modal-copy">
              <span>Umao demo</span>
              <h2 id="demo-modal-title">See the interview flow in action.</h2>
              <p>
                This preview shows how Umao moves from setup, to live coding, to interviewer feedback
                without needing webcam or voice permissions for the demo.
              </p>
            </div>

            <div className={isPlaying ? "demo-video is-playing" : "demo-video is-paused"} aria-label="Animated Umao product demo">
              <div className="demo-video-topbar">
                <strong>umao interview</strong>
                <span>00:02 / 00:36</span>
              </div>
              <div className="demo-video-stage">
                <div className="demo-slide demo-slide-one">
                  <span>Step 1</span>
                  <h3>Choose your target interview</h3>
                  <p>Software Engineer · Easy · Arrays</p>
                </div>
                <div className="demo-slide demo-slide-two">
                  <span>Step 2</span>
                  <h3>Code live while Umao asks follow-ups</h3>
                  <pre>{`def two_sum(nums, target):
    seen = {}
    for i, value in enumerate(nums):
        if target - value in seen:
            return [seen[target - value], i]`}</pre>
                </div>
                <div className="demo-slide demo-slide-three">
                  <span>Step 3</span>
                  <h3>Review your feedback</h3>
                  <div>
                    <p>Coding <b>88</b></p>
                    <p>Problem solving <b>85</b></p>
                    <p>Communication <b>76</b></p>
                  </div>
                </div>
              </div>
              <div className="demo-video-controls">
                <button onClick={() => setIsPlaying((current) => !current)} type="button">
                  {isPlaying ? <Pause aria-hidden size={18} /> : <PlayCircle aria-hidden size={18} />}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <div aria-hidden className="demo-progress">
                  <i />
                </div>
              </div>
            </div>

            <div className="demo-modal-actions">
              <Link className="site-button site-button-primary site-button-large" href="/practice" onClick={() => setIsOpen(false)}>
                Try it now
                <ArrowRight aria-hidden size={18} />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
