import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Section { heading: string; body: string; }
interface AmrContent { title: string; sections: Section[]; }

interface AmrExplainerProps {
  onNavigateToChat: () => void;
}

export default function AmrExplainer({ onNavigateToChat }: AmrExplainerProps) {
  const [content, setContent] = useState<AmrContent | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/content/amr-explainer`)
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent(null));
  }, []);

  if (!content) return <p>Loading…</p>;

  return (
    <div className="amr-explainer">
      <h2>{content.title}</h2>
      {content.sections.map((s, i) => (
        <div className="amr-section" key={i}>
          <h4>{s.heading}</h4>
          <p>{s.body}</p>
        </div>
      ))}

      <div className="amr-chat-cta">
        <p>Have a specific question about your own antibiotic use?</p>
        <button onClick={onNavigateToChat} className="amr-chat-cta-btn">
          Ask the chatbot →
        </button>
      </div>
    </div>
  );
}