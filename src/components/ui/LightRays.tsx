import { useEffect, useRef } from "react"
import type React from "react"

interface LightRaysProps {
  children?: React.ReactNode
  width?: number
  height?: number
}

export function LightRays({ children, width, height }: LightRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    const context = canvas.getContext("2d")
    if (!context) return

    let frame = 0
    let disposed = false

    // Match the canvas to its container so the rays stay crisp on HiDPI screens.
    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssWidth = width ?? rect.width
      const cssHeight = height ?? rect.height
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr))
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr))
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const draw = (time: number) => {
      if (disposed) return
      const cssWidth = canvas.clientWidth
      const cssHeight = canvas.clientHeight
      context.clearRect(0, 0, cssWidth, cssHeight)

      const rays = 7
      const originX = cssWidth / 2
      const originY = -8
      const length = cssHeight * 1.35
      const rotation = Math.sin(time * 0.00012) * 0.08

      for (let index = 0; index < rays; index += 1) {
        const angle =
          (index - (rays - 1) / 2) * (Math.PI / (rays * 1.5)) + rotation
        const spread = 0.07 + (index % 2) * 0.018
        const opacity = Math.max(
          0.018,
          0.045 + Math.sin(time * 0.0005 + index) * 0.02,
        )

        const x1 = originX + Math.sin(angle - spread) * length
        const y1 = originY + Math.cos(angle - spread) * length
        const x2 = originX + Math.sin(angle + spread) * length
        const y2 = originY + Math.cos(angle + spread) * length
        const gradient = context.createLinearGradient(
          originX,
          originY,
          (x1 + x2) / 2,
          (y1 + y2) / 2,
        )
        gradient.addColorStop(0, `rgba(255,140,0,${opacity})`)
        gradient.addColorStop(0.5, `rgba(255,255,255,${opacity * 0.3})`)
        gradient.addColorStop(1, "rgba(0,0,0,0)")

        context.beginPath()
        context.moveTo(originX, originY)
        context.lineTo(x1, y1)
        context.lineTo(x2, y2)
        context.closePath()
        context.fillStyle = gradient
        context.fill()
      }

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [height, width])

  const canvas = <canvas ref={canvasRef} aria-hidden="true" className="light-rays__canvas" />

  if (children === undefined) {
    return (
      <div aria-hidden="true" className="light-rays light-rays--background">
        {canvas}
      </div>
    )
  }

  return (
    <div className="light-rays">
      {canvas}
      <div className="light-rays__content">
        {children}
      </div>
    </div>
  )
}
