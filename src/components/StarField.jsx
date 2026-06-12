import { useEffect, useRef } from 'react'

const LAYERS = [
  { count: 200, speedX: 0.006, speedY: 0.002, maxR: 0.7,  brightness: 0.45 },
  { count: 110, speedX: 0.016, speedY: 0.006, maxR: 1.2,  brightness: 0.70 },
  { count:  45, speedX: 0.032, speedY: 0.011, maxR: 1.8,  brightness: 1.00 },
]

const NEBULAS = [
  { bx: 0.18, by: 0.28, rx: 0.32, ry: 0.38, rgb: [18, 8, 90],  phase: 0.0,  speed: 0.00028 },
  { bx: 0.78, by: 0.60, rx: 0.30, ry: 0.32, rgb: [0,  35, 110], phase: 1.6,  speed: 0.00018 },
  { bx: 0.50, by: 0.08, rx: 0.22, ry: 0.24, rgb: [55, 0,  90],  phase: 0.9,  speed: 0.00022 },
  { bx: 0.88, by: 0.15, rx: 0.18, ry: 0.20, rgb: [0,  60, 80],  phase: 2.4,  speed: 0.00015 },
]

export default function StarField() {
  const canvasRef   = useRef()
  const layersRef   = useRef([])
  const meteorsRef  = useRef([])
  const nebulasRef  = useRef([])
  const lastMeteor  = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const init = () => {
      const W = canvas.width  = window.innerWidth
      const H = canvas.height = window.innerHeight

      layersRef.current = LAYERS.map(cfg => ({
        ...cfg,
        stars: Array.from({ length: cfg.count }, () => ({
          x:            Math.random() * W,
          y:            Math.random() * H,
          r:            Math.random() * cfg.maxR + 0.25,
          phase:        Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.005 + 0.001,
        })),
      }))

      nebulasRef.current = NEBULAS.map(n => ({
        ...n,
        x: n.bx * W,
        y: n.by * H,
        w: n.rx * W,
        h: n.ry * H,
      }))

      meteorsRef.current = []
    }

    init()
    window.addEventListener('resize', init)

    const spawnMeteor = (W) => {
      meteorsRef.current.push({
        x:     Math.random() * W * 1.4 - W * 0.2,
        y:     Math.random() * -40 - 5,
        len:   Math.random() * 140 + 70,
        speed: Math.random() * 7 + 5,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.35,
        alpha: 1,
        width: Math.random() * 1.2 + 0.6,
      })
    }

    let animId
    const draw = (t) => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Base space black
      ctx.fillStyle = '#050810'
      ctx.fillRect(0, 0, W, H)

      // ── Nebula clouds ───────────────────────────────────────────────────────
      nebulasRef.current.forEach(n => {
        n.phase += n.speed
        const pulse = 0.13 + 0.05 * Math.sin(n.phase)
        const drift = {
          x: n.x + Math.sin(n.phase * 0.7) * 28,
          y: n.y + Math.cos(n.phase * 0.5) * 18,
        }
        const [r, g, b] = n.rgb
        ctx.save()
        ctx.translate(drift.x, drift.y)
        ctx.scale(n.w / 200, n.h / 200)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 200)
        grad.addColorStop(0,   `rgba(${r},${g},${b},${pulse.toFixed(3)})`)
        grad.addColorStop(0.45,`rgba(${r},${g},${b},${(pulse * 0.38).toFixed(3)})`)
        grad.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(0, 0, 200, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // ── Stars with parallax drift ───────────────────────────────────────────
      layersRef.current.forEach(layer => {
        layer.stars.forEach(star => {
          star.x += layer.speedX
          star.y += layer.speedY
          if (star.x > W) star.x -= W
          if (star.y > H) star.y -= H

          const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.phase))
          const alpha   = twinkle * layer.brightness

          ctx.beginPath()
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(215,232,255,${alpha.toFixed(2)})`
          ctx.fill()

          // Halo on bigger stars
          if (star.r > 1.3) {
            const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 3)
            glow.addColorStop(0, `rgba(180,210,255,${(alpha * 0.45).toFixed(2)})`)
            glow.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.beginPath()
            ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2)
            ctx.fillStyle = glow
            ctx.fill()
          }
        })
      })

      // ── Meteors ─────────────────────────────────────────────────────────────
      if (t - lastMeteor.current > (2800 + Math.sin(t * 0.001) * 1400)) {
        spawnMeteor(W)
        lastMeteor.current = t
      }

      meteorsRef.current = meteorsRef.current.filter(m => m.alpha > 0.03)
      meteorsRef.current.forEach(m => {
        m.x     += Math.cos(m.angle) * m.speed
        m.y     += Math.sin(m.angle) * m.speed
        m.alpha -= 0.014

        const tx = m.x - Math.cos(m.angle) * m.len
        const ty = m.y - Math.sin(m.angle) * m.len
        const grad = ctx.createLinearGradient(tx, ty, m.x, m.y)
        grad.addColorStop(0,   'rgba(200,225,255,0)')
        grad.addColorStop(0.5, `rgba(210,230,255,${(m.alpha * 0.45).toFixed(2)})`)
        grad.addColorStop(1,   `rgba(255,255,255,${m.alpha.toFixed(2)})`)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = grad
        ctx.lineWidth   = m.width
        ctx.stroke()

        // Tip flash
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.width * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${(m.alpha * 0.7).toFixed(2)})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', init)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
