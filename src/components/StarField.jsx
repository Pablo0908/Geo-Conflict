import { useEffect, useRef } from 'react'

const STAR_COUNT = 320

export default function StarField() {
  const canvasRef = useRef()
  const starsRef  = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.006 + 0.001,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    let animId
    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      starsRef.current.forEach(s => {
        const alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,225,255,${alpha.toFixed(2)})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 40%, rgba(20,10,60,0.8) 0%, #050810 60%), radial-gradient(ellipse at 75% 70%, rgba(10,30,80,0.6) 0%, transparent 55%)'
      }}
    />
  )
}
