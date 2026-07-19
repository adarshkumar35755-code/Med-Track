import { useEffect, useState } from "react";
import { fetchMythsFacts } from "../api/checkRisk";
import type { MythFact } from "../types";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MythsFacts() {
  const [items, setItems] = useState<MythFact[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchMythsFacts().then(setItems).catch(() => setItems([]));
  }, []);

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const shuffleOrder = () => {
    setItems((prev) => shuffle(prev));
    setRevealed(new Set());
  };

  const handleTiltMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion()) return;
    const card = e.currentTarget;
    const bounds = card.getBoundingClientRect();
    const leftX = e.clientX - bounds.left;
    const topY = e.clientY - bounds.top;
    const centerX = leftX - bounds.width / 2;
    const centerY = topY - bounds.height / 2;
    const distance = Math.sqrt(centerX ** 2 + centerY ** 2) || 1;

    card.style.transitionDuration = "0ms";
    card.style.transform = `
      scale3d(1.05, 1.05, 1.05)
      rotate3d(${centerY / 100}, ${-centerX / 100}, 0, ${Math.log(distance) * 2}deg)
    `;
    card.style.setProperty("--glow-x", `${(leftX / bounds.width) * 100}%`);
    card.style.setProperty("--glow-y", `${(topY / bounds.height) * 100}%`);
  };

  const handleTiltLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget;
    card.style.transitionDuration = "";
    card.style.transform = "";
    card.style.removeProperty("--glow-x");
    card.style.removeProperty("--glow-y");
  };

  if (items.length === 0) return null;

  return (
    <section className="myths-facts">
      <div className="mf-header">
        <h3>Myth vs. fact</h3>
        <div className="mf-header-right">
          <span className="mf-progress">{revealed.size} of {items.length} revealed</span>
          <button className="mf-shuffle-btn" onClick={shuffleOrder}>Shuffle</button>
        </div>
      </div>

      <div className="mf-grid">
        {items.map((item, i) => {
          const isRevealed = revealed.has(i);
          return (
            <button
              className={`mf-card ${isRevealed ? "revealed" : ""}`}
              key={`${item.myth}-${i}`}
              onClick={() => toggle(i)}
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
              aria-expanded={isRevealed}
            >
              <div className="mf-card-inner">
                <div className="mf-card-face mf-card-front">
                  <span className="tag myth-tag">Myth</span>
                  <p className="myth">{item.myth}</p>
                  <span className="mf-flip-hint">Tap to reveal the fact</span>
                </div>
                <div className="mf-card-face mf-card-back">
                  <span className="tag fact-tag">Fact</span>
                  <p className="fact">{item.fact}</p>
                  <span className="mf-flip-hint">Tap to flip back</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}