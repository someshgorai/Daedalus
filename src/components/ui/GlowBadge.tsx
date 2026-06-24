export function GlowBadge({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className={`status-badge ${valid ? "status-badge--valid" : ""}`}>
      <span className="status-badge__dot" />
      <span>{text}</span>
    </div>
  )
}
