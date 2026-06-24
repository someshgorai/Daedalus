export function TypingDots() {
  return (
    <div className="typing-dots">
      {[0, 1, 2].map((index) => (
        <span className={`typing-dot typing-dot--${index}`} key={index} />
      ))}
    </div>
  )
}
