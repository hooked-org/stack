import { useCallback, useEffect, useRef, useState } from "react";

function easeInOutCirc(x: number): number {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

function mulberry32(a: number): number {
  var t = a += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export default function SnazzyBackground() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ctx, setContext] = useState<CanvasRenderingContext2D | undefined>(undefined)
    
  const render = useCallback(() => {
    if (!ctx || !canvas.current) return
    ctx.fillStyle = "rgba(17, 16, 20, 1)"
    ctx.fillRect(0, 0, canvas.current.width, canvas.current.height)
    const scale = canvas.current.height / 8
    const w = canvas.current.width * 1.2
    const o = canvas.current.width * 0.1
    const d = Date.now()
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = scale / 4
    ctx.lineCap = "round"
    for (let i = 0; i < 8; i += 1) {
      const s = i * scale
      const t = ((d + 6100 * i) % 20000) / 20000
      ctx.moveTo(easeInOutCirc(t) * w - o, s)
      ctx.lineTo(easeInOutCirc(t + 0.005) * w - o, s)
    }
    ctx.stroke()
    ctx.closePath()
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = scale / 8
    for (let i = 0; i < 16; i += 1) {
      const s = (i) * scale / 2
      const t = ((d + 8900 * i) % 30000) / 30000
      ctx.moveTo(easeInOutCirc(t) * w - o, s)
      ctx.lineTo(easeInOutCirc(t + 0.0035) * w - o, s)
    }
    ctx.stroke()
    ctx.closePath()
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.075)"
    ctx.lineWidth = scale / 16
    for (let i = 0; i < 32; i += 1) {
      const s = (i) * scale / 4
      const t = ((d + 2200 * i) % 15000) / 15000
      ctx.moveTo(easeInOutCirc(t + mulberry32(i) * 0.1) * w - o, s)
      ctx.lineTo(easeInOutCirc(t + 0.005 + mulberry32(i) * 0.1) * w - o, s)
    }
    ctx.stroke()
    ctx.closePath()
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = scale / 32
    for (let i = 0; i < 64; i += 1) {
      const s = (i) * scale / 8
      const t = ((d + 8900 * i) % 17500) / 17500
      ctx.moveTo(easeInOutCirc(t + mulberry32(i) * 0.1) * w - o, s)
      ctx.lineTo(easeInOutCirc(t + 0.003 + mulberry32(i) * 0.1) * w - o, s)
    }
    ctx.stroke()
    ctx.closePath()
    requestAnimationFrame(render)
  }, [ctx, canvas])

  useEffect(() => {
    if (!canvas.current) return
    canvas.current.width = window.innerWidth
    canvas.current.height = window.innerHeight
    const ctx = canvas.current.getContext("2d")
    if (!ctx) return
    setContext(ctx)
    render()
  }, [canvas, setContext, render])

  return (
    <canvas
      ref={canvas}
      style={{
        position: "absolute",
        background: "rgba(17, 16, 20, 1)",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
}
