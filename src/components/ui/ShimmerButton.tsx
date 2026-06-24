import type React from "react"

interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  fullWidth?: boolean
}

export function ShimmerButton({
  children,
  fullWidth,
  className = "",
  ...props
}: ShimmerButtonProps) {
  const classes = [
    "shimmer-button",
    fullWidth ? "shimmer-button--full" : "",
    className,
  ].filter(Boolean).join(" ")

  return (
    <button className={classes} {...props}>
      <span className="shimmer-button__effect" />
      <span className="shimmer-button__content">{children}</span>
    </button>
  )
}
