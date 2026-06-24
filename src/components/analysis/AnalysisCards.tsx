import type {
  Approach,
  Complexity,
  Concept,
  Intuition,
  Method,
} from "~/utils/types"

function CardTitle({ icon, children }: { icon: string; children: string }) {
  return (
    <div className="analysis-title">
      <span className="analysis-title__icon">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

export function VerdictBanner({ verdict }: { verdict: string }) {
  return (
    <div className="verdict-banner">
      <span className="verdict-banner__icon">🎯</span>
      <span>{verdict}</span>
    </div>
  )
}

export function IntuitionCard({ intuition }: { intuition: Intuition }) {
  return (
    <section className="analysis-card">
      <CardTitle icon="🧠">Intuition</CardTitle>
      <p className="analysis-card__body">{intuition.summary}</p>
      <div className="insight">
        <span className="insight__label">💡 Insight:</span>
        {intuition.keyInsight}
      </div>
      <p className="analysis-card__note">
        <strong>Why it works: </strong>
        {intuition.whyItWorks}
      </p>
    </section>
  )
}

export function MethodCard({ method }: { method: Method }) {
  return (
    <section className="analysis-card">
      <CardTitle icon="⚙️">Method</CardTitle>
      <div className="method-heading">
        <h3>{method.name}</h3>
        <span className="method-category">{method.category}</span>
      </div>
      <div className="method-steps">
        {method.steps.map((step, index) => (
          <div className="method-step" key={index}>
            <span className="method-step__number">{index + 1}.</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ComplexityCard({ complexity }: { complexity: Complexity }) {
  return (
    <section className="analysis-card">
      <CardTitle icon="⏱">Complexity</CardTitle>
      <div className="complexity-grid">
        <div className="complexity-box complexity-box--time">
          <span className="complexity-box__label">Time</span>
          <strong className="complexity-box__value">{complexity.time}</strong>
          <span className="complexity-box__description">
            {complexity.timeExplanation}
          </span>
        </div>
        <div className="complexity-box">
          <span className="complexity-box__label">Space</span>
          <strong className="complexity-box__value">{complexity.space}</strong>
          <span className="complexity-box__description">
            {complexity.spaceExplanation}
          </span>
        </div>
      </div>
      {complexity.optimalNote && (
        <div className={`optimal-note ${complexity.optimal ? "optimal-note--success" : ""}`}>
          {complexity.optimal ? "✓ " : "△ "}
          {complexity.optimalNote}
        </div>
      )}
    </section>
  )
}

export function ConceptsCard({ concepts }: { concepts: Concept[] }) {
  if (!concepts.length) return null

  return (
    <section className="analysis-card">
      <CardTitle icon="💡">Concepts</CardTitle>
      <div className="concept-list">
        {concepts.map((concept, index) => (
          <div className="concept" key={index}>
            <span className="concept__icon">{concept.icon || "•"}</span>
            <div>
              <h3 className="concept__name">{concept.name}</h3>
              <p className="concept__description">{concept.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ComparisonCard({ approaches }: { approaches: Approach[] }) {
  if (!approaches.length) return null

  return (
    <section className="analysis-card">
      <div className="analysis-title">Approach comparison</div>
      <div className="comparison-row comparison-row--header">
        <span>Approach</span>
        <span>Time</span>
        <span>Space</span>
      </div>
      {approaches.map((approach, index) => (
        <div
          className={`comparison-row ${approach.feasible ? "" : "comparison-row--muted"}`}
          key={`${approach.name}-${index}`}
        >
          <span>{approach.feasible ? "✓" : "△"} {approach.name}</span>
          <span className="mono">{approach.time}</span>
          <span className="mono">{approach.space}</span>
        </div>
      ))}
    </section>
  )
}
