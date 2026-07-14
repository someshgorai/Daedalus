import type { CodeStyle } from "~/utils/types"

const scoreKeys: { key: keyof CodeStyle; label: string }[] = [
  { key: "readability", label: "Readability" },
  { key: "efficiency", label: "Efficiency" },
  { key: "structure", label: "Structure" },
  { key: "bestPractices", label: "Best Practices" },
]

function scoreLevel(score: number) {
  if (score >= 8) return "high"
  if (score >= 6) return "medium"
  return "low"
}

export function CodeStyleCard({ codeStyle }: { codeStyle: CodeStyle }) {
  const overall = Number(codeStyle.overallScore || 0)

  return (
    <section className="analysis-card">
      <div className="code-style-heading">
        <div className="analysis-title analysis-title--flush">
          <span className="analysis-title__icon">🎨</span>
          <span>Code style</span>
        </div>
        <span className={`score-badge score-badge--${scoreLevel(overall)}`}>
          {overall}/10
        </span>
      </div>

      <div className="score-list">
        {scoreKeys.map(({ key, label }) => {
          const score = Number(codeStyle[key]) || 0
          return (
            <div className="score-row" key={key}>
              <span className="score-row__label">{label}</span>
              <progress
                className={`score-progress score-progress--${scoreLevel(score)}`}
                max="10"
                value={score}
              />
              <span className="score-row__value">{score}</span>
            </div>
          )
        })}
      </div>

      {(codeStyle.strengths.length > 0 || codeStyle.improvements.length > 0) && (
        <div className="feedback-grid">
          <div className="feedback-box feedback-box--strengths">
            <h4>Strengths</h4>
            {codeStyle.strengths.slice(0, 3).map((item, index) => (
              <p key={index}>• {item}</p>
            ))}
          </div>
          <div className="feedback-box feedback-box--improvements">
            <h4>Improve</h4>
            {codeStyle.improvements.slice(0, 3).map((item, index) => (
              <p key={index}>• {item}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
