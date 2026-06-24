export function FloatingButton({
  onClick,
  open = false,
}: {
  onClick: () => void
  open?: boolean
}) {
  return (
    <button
      className={`floating-button ${open ? "floating-button--open" : ""}`}
      onClick={onClick}
      title="Daedalus"
      aria-label="Toggle Daedalus"
    >
      <span className="floating-button__icon">⚡</span>
    </button>
  )
}
