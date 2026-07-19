import type { CheckResponse } from "../types";

const TIER_COLORS: Record<string, string> = {
  Low: "#2f9e44",
  Moderate: "#f08c00",
  High: "#e03131",
};

export default function RiskResult({ result }: { result: CheckResponse }) {
  const color = TIER_COLORS[result.risk_tier] || "#868e96";

  return (
    <div className="risk-result">
      <div className="risk-badge" style={{ backgroundColor: color }}>
        {result.risk_tier} Risk
      </div>

      {result.needs_clarification && result.clarifying_question && (
        <div className="clarify-box">
          <strong>One quick question:</strong> {result.clarifying_question}
        </div>
      )}

      <section className="extracted-facts">
        <h4>What I understood</h4>
        <div className="chip-row">
          {result.extracted.antibiotic_name && (
            <span className="chip">Drug: {result.extracted.antibiotic_name}</span>
          )}
          {result.extracted.symptom_or_reason && (
            <span className="chip">Reason: {result.extracted.symptom_or_reason}</span>
          )}
          {result.extracted.duration_days != null && (
            <span className="chip">{result.extracted.duration_days} day(s)</span>
          )}
          <span className="chip">Source: {result.extracted.source}</span>
          {result.extracted.course_completed != null && (
            <span className="chip">
              Course {result.extracted.course_completed ? "completed" : "not completed"}
            </span>
          )}
        </div>
      </section>

      <section>
        <h4>Why this risk level</h4>
        <p>{result.explanation}</p>
      </section>

      <section>
        <h4>What to do</h4>
        <ul>
          {result.safe_advice.map((advice: string, i: number) => (
  <li key={i}>{advice}</li>
))}
        </ul>
      </section>

      <p className="disclaimer">{result.disclaimer}</p>
    </div>
  );
}
