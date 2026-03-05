"use client"

import { useEffect, useRef } from "react"

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  // We use a ref for drops so we can dynamically add columns if the window is resized
  const dropsRef = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const letters = "アァカサタナハマヤャラワン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const fontSize = 14

    const resize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Recalculate columns to ensure the rain covers the full width if resized
      const columns = Math.floor(window.innerWidth / fontSize)
      
      // Add new drops if the screen got wider
      while (dropsRef.current.length < columns) {
        dropsRef.current.push(1)
      }
    }

    // Initialize size and columns
    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      if (!ctx || !canvas) return

      // Translucent black background creates the trailing fade effect
      ctx.fillStyle = "rgba(5, 5, 5, 0.08)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#00FF66"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < dropsRef.current.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)]

        ctx.fillText(text, i * fontSize, dropsRef.current[i] * fontSize)

        // Reset drop to the top randomly after it crosses the screen height
        if (dropsRef.current[i] * fontSize > canvas.height && Math.random() > 0.975) {
          dropsRef.current[i] = 0
        }

        dropsRef.current[i]++
      }
    }

    const interval = setInterval(draw, 40)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full opacity-75 pointer-events-none z-0 block"
    />
  )
}