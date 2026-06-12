import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Neon risk palette — hologram-tuned
const RISK_HEX = {
  'CRÍTICO': '#FF1744',
  'ALTO':    '#FF9100',
  'MEDIO':   '#FFE000',
  'BAJO':    '#00E676',
}

// Deep-space ocean: almost black with deep blue emissive
const GLOBE_MATERIAL = new THREE.MeshPhongMaterial({
  color:              new THREE.Color('#030614'),
  emissive:           new THREE.Color('#0A0F30'),
  emissiveIntensity:  0.4,
  shininess:          18,
  specular:           new THREE.Color('#1A2A6C'),
})

export default function Globe3D({ onCountryClick, selectedCode, history }) {
  const globeRef     = useRef()
  const containerRef = useRef()
  const inactRef     = useRef()

  const [countries, setCountries] = useState([])
  const [hovered, setHovered]     = useState(null)
  const [dims, setDims]           = useState({ w: 0, h: 0 })

  // name → risk level for analyzed countries
  const historyMap = useMemo(() => {
    const m = {}
    history.forEach(h => { m[h.name] = h.risk })
    return m
  }, [history])

  // Load country GeoJSON (countries object, not land)
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topo => setCountries(feature(topo, topo.objects.countries).features))
      .catch(err => console.error('GeoJSON load failed:', err))
  }, [])

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: Math.floor(entry.contentRect.width), h: Math.floor(entry.contentRect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Configure OrbitControls after globe is ready
  const onGlobeReady = useCallback(() => {
    if (!globeRef.current) return
    const ctrl = globeRef.current.controls()
    ctrl.autoRotate      = true
    ctrl.autoRotateSpeed = 0.4
    ctrl.enableDamping   = true
    ctrl.dampingFactor   = 0.08
    ctrl.minDistance     = 215
    ctrl.maxDistance     = 580
    ctrl.enablePan       = false
  }, [])

  // ── Country face color ────────────────────────────────────────────────────
  const capColor = useCallback((d) => {
    const name = d.properties?.name
    const risk = historyMap[name]

    if (selectedCode && d.id?.toString() === selectedCode) {
      return risk ? RISK_HEX[risk] + 'CC' : 'rgba(255,23,68,0.75)'
    }
    if (name === hovered) return 'rgba(30,136,229,0.42)'
    if (risk) return RISK_HEX[risk] + '44'
    return 'rgba(0,15,55,0.55)'
  }, [selectedCode, hovered, historyMap])

  // Hovered/selected countries rise slightly
  const altitude = useCallback((d) => {
    const name = d.properties?.name
    if (selectedCode && d.id?.toString() === selectedCode) return 0.016
    if (name === hovered) return 0.012
    return 0.005
  }, [selectedCode, hovered])

  // Side color — dark teal extrusion
  const sideColor = useCallback((d) => {
    const name = d.properties?.name
    if (name === hovered) return 'rgba(30,136,229,0.25)'
    return 'rgba(0,10,35,0.85)'
  }, [hovered])

  // Border / stroke color — the key hologram element
  const strokeColor = useCallback((d) => {
    const name = d.properties?.name
    if (selectedCode && d.id?.toString() === selectedCode) {
      const risk = historyMap[name]
      return risk ? RISK_HEX[risk] : '#FF1744'
    }
    if (name === hovered) return '#1E88E5'
    if (historyMap[name]) return RISK_HEX[historyMap[name]] + 'CC'
    return '#0A1535'
  }, [selectedCode, hovered, historyMap])

  // HTML tooltip — hologram style
  const makeLabel = useCallback((d) => {
    const name = d.properties?.name
    if (!name) return ''
    const risk = historyMap[name]
    const rc   = risk ? RISK_HEX[risk] : null
    const badge = risk
      ? `<span style="margin-left:8px;background:${rc}22;color:${rc};border:1px solid ${rc};border-radius:3px;padding:1px 7px;font-size:10px;font-family:JetBrains Mono,monospace;letter-spacing:.05em;">${risk}</span>`
      : `<span style="margin-left:8px;color:#5BA8E5;font-size:10px;font-family:JetBrains Mono,monospace;">ANALIZAR</span>`
    return `<div style="background:rgba(2,6,20,0.95);border:1px solid #1E88E5;border-radius:4px;padding:7px 14px;font-family:Space Grotesk,sans-serif;display:flex;align-items:center;box-shadow:0 0 18px rgba(30,136,229,0.35),0 4px 24px rgba(0,0,0,.9);white-space:nowrap;"><span style="color:#90CAF9;font-size:12px;font-weight:600;letter-spacing:.04em;">${name}</span>${badge}</div>`
  }, [historyMap])

  // ── Hover handler ─────────────────────────────────────────────────────────
  const handleHover = useCallback((country) => {
    const name = country?.properties?.name || null
    setHovered(name)
    document.body.style.cursor = country ? 'pointer' : 'default'

    if (globeRef.current) {
      const ctrl = globeRef.current.controls()
      if (country) {
        ctrl.autoRotate = false
        clearTimeout(inactRef.current)
      } else {
        // Resume auto-rotation 2s after cursor leaves land
        inactRef.current = setTimeout(() => { ctrl.autoRotate = true }, 2000)
      }
    }
  }, [])

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback((country) => {
    const name = country?.properties?.name
    if (!name) return
    if (globeRef.current) globeRef.current.controls().autoRotate = false
    onCountryClick(name, country.id?.toString() || name)
  }, [onCountryClick])

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050810' }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `
          linear-gradient(rgba(30,100,229,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,100,229,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px'
      }} />

      {dims.w > 0 && (
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="#050810"
          atmosphereColor="#1565C0"
          atmosphereAltitude={0.25}
          globeMaterial={GLOBE_MATERIAL}
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

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 36%, #050810 76%)'
      }} />
    </div>
  )
}
