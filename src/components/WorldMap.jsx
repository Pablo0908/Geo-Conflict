import Globe from 'react-globe.gl'
import { feature } from 'topojson-client'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const RISK_COLORS = {
  'CRÍTICO': '#E8432A',
  'ALTO':    '#E8A030',
  'MEDIO':   '#D4C830',
  'BAJO':    '#2ECC71',
}

export default function WorldMap({ onCountryClick, selectedCode, history }) {
  const globeRef     = useRef()
  const containerRef = useRef()
  const [countries, setCountries] = useState([])
  const [hovered, setHovered]     = useState(null)
  const [dims, setDims]           = useState({ w: 0, h: 0 })

  const historyMap = useMemo(() => {
    const m = {}
    history.forEach(h => { m[h.name] = h.risk })
    return m
  }, [history])

  // Load and parse topojson — explicitly use the 'countries' object
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topo => setCountries(feature(topo, topo.objects.countries).features))
      .catch(err => console.error('Map data failed to load:', err))
  }, [])

  // Track container size so Globe fills the flex area exactly
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ w: Math.floor(width), h: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Configure OrbitControls after globe is ready
  const onGlobeReady = useCallback(() => {
    if (!globeRef.current) return
    const ctrl = globeRef.current.controls()
    ctrl.autoRotate      = true
    ctrl.autoRotateSpeed = 0.35
    ctrl.enableDamping   = true
    ctrl.dampingFactor   = 0.08
    ctrl.minDistance     = 210
    ctrl.maxDistance     = 600
  }, [])

  // Country face color
  const capColor = useCallback((d) => {
    if (selectedCode && d.id?.toString() === selectedCode) return '#C8391A'
    if (d.properties?.name === hovered) return '#2A4A6B'
    return '#1C2B3A'
  }, [selectedCode, hovered])

  // Country side / border color
  const sideColor  = useCallback(() => 'rgba(9, 12, 18, 0.85)', [])
  const strokeColor = useCallback(() => '#1E3A5F', [])

  // Countries rise slightly on hover/select
  const altitude = useCallback((d) => {
    if (selectedCode && d.id?.toString() === selectedCode) return 0.018
    if (d.properties?.name === hovered) return 0.012
    return 0.006
  }, [selectedCode, hovered])

  // HTML tooltip rendered by globe.gl at cursor position
  const makeLabel = useCallback((d) => {
    const name = d.properties?.name
    if (!name) return ''
    const risk = historyMap[name]
    const rc   = risk ? RISK_COLORS[risk] : null
    const badge = risk
      ? `<span style="margin-left:8px;background:${rc}22;color:${rc};border:1px solid ${rc};border-radius:3px;padding:1px 7px;font-size:10px;font-family:JetBrains Mono,monospace;letter-spacing:.05em;">${risk}</span>`
      : `<span style="margin-left:8px;color:#6B7A99;font-size:10px;font-family:JetBrains Mono,monospace;">click para analizar</span>`
    return `<div style="background:#0F1520;border:1px solid #1E2D45;border-radius:6px;padding:7px 14px;font-family:Space Grotesk,sans-serif;display:flex;align-items:center;box-shadow:0 4px 24px rgba(0,0,0,.8);white-space:nowrap;"><span style="color:#E8EDF5;font-size:12px;font-weight:600;">${name}</span>${badge}</div>`
  }, [historyMap])

  const handleHover = useCallback((country) => {
    const name = country?.properties?.name || null
    setHovered(name)
    document.body.style.cursor = country ? 'pointer' : 'default'
    // Pause auto-rotation while cursor is over a country
    if (globeRef.current) globeRef.current.controls().autoRotate = !country
  }, [])

  const handleClick = useCallback((country) => {
    const name = country?.properties?.name
    if (!name) return
    if (globeRef.current) globeRef.current.controls().autoRotate = false
    onCountryClick(name, country.id?.toString() || name)
  }, [onCountryClick])

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#090C12' }}
    >
      {dims.w > 0 && (
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="#090C12"
          atmosphereColor="#1A3F6F"
          atmosphereAltitude={0.22}
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          polygonsData={countries}
          polygonCapColor={capColor}
          polygonSideColor={sideColor}
          polygonStrokeColor={strokeColor}
          polygonAltitude={altitude}
          polygonLabel={makeLabel}
          onPolygonHover={handleHover}
          onPolygonClick={handleClick}
          onGlobeReady={onGlobeReady}
        />
      )}

      {/* Edge vignette to blend globe into the dark bg */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 38%, #090C12 78%)',
        pointerEvents: 'none'
      }} />
    </div>
  )
}
