import { useEffect, useRef, useState } from "react";
import { sendChat } from "../api/checkRisk";
import type { ChatMessage } from "../types";
import GhostInput from "./GhostInput";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

const TIER_COLORS: Record<string, string> = {
  Low: "#2f9e44",
  Moderate: "#f08c00",
  High: "#e03131",
};

const GREETING: ChatMessage = {
  role: "assistant",
  content: "",
  turn: {
    type: "question",
    message:
      "Hi! Tell me about the antibiotic you're taking or asking about — what it's for, and where it came from.",
    quick_replies: [],
    sources: [],
    extracted: {
      antibiotic_name: null,
      symptom_or_reason: null,
      duration_days: null,
      prescribed_by_doctor: null,
      course_completed: null,
      source: "unknown",
    },
    risk_tier: null,
    risk_flags: [],
    safe_advice: [],
    disclaimer: "",
  },
};

export default function IntakeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { enabled: voiceEnabled, setEnabled: setVoiceEnabled, speak, supported: ttsSupported } =
    useSpeechSynthesis();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      const historyForApi = nextMessages.filter((m) => m !== GREETING);
      const turn = await sendChat(historyForApi);

      const historyContent =
        turn.type === "result"
          ? `${turn.message} (Risk tier: ${turn.risk_tier})`
          : turn.message;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: historyContent,
        turn,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speak(turn.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function openSource(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="chat-window">
      {ttsSupported && (
        <div className="voice-toggle-row">
          <label className="voice-toggle">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            Read responses aloud
          </label>
        </div>
      )}

      <div className="chat-scroll">
        {messages.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role}`}>
            {m.role === "user" ? (
              <div className="bubble user-bubble">{m.content}</div>
            ) : (
              <div className="bubble assistant-bubble">
                {m.turn?.type === "result" && m.turn.risk_tier && (
                  <span
                    className="risk-badge"
                    style={{ backgroundColor: TIER_COLORS[m.turn.risk_tier] }}
                  >
                    {m.turn.risk_tier} Risk
                  </span>
                )}
                <p>{m.turn?.message}</p>

                {m.turn && m.turn.sources.length > 0 && (
                  <div className="source-links">
                    {m.turn.sources.map((s, j) => (
                      <button
                        key={j}
                        type="button"
                        className="source-chip"
                        title={s.fact}
                        onClick={() => openSource(s.url)}
                      >
                        {s.source}
                      </button>
                    ))}
                  </div>
                )}

                {m.turn?.type === "result" && (
                  <>
                    {m.turn.safe_advice.length > 0 && (
                      <ul className="safe-advice-list">
                        {m.turn.safe_advice.map((a, j) => (
                          <li key={j}>{a}</li>
                        ))}
                      </ul>
                    )}
                    <p className="disclaimer">{m.turn.disclaimer}</p>
                  </>
                )}

                {m.turn?.quick_replies && m.turn.quick_replies.length > 0 && (
                  <div className="quick-replies">
                    {m.turn.quick_replies.map((qr, j) => (
                      <button
                        key={j}
                        className="quick-reply-btn"
                        onClick={() => send(qr)}
                        disabled={loading}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="bubble assistant-bubble typing">Thinking…</div>}
        {error && <div className="error-box">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <GhostInput onSend={send} disabled={loading} />
      </div>
    </div>
  );
}