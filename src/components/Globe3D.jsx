import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const RISK_HEX = {
  'CRÍTICO': '#FF1744',
  'ALTO':    '#FF9100',
  'MEDIO':   '#FFE000',
  'BAJO':    '#00E676',
}

// Hologram ocean — deep blue, semi-transparent, high emissive
const GLOBE_MATERIAL = new THREE.MeshPhongMaterial({
  color:             new THREE.Color('#0A1E3A'),
  emissive:          new THREE.Color('#0033AA'),
  emissiveIntensity: 0.9,
  transparent:       true,
  opacity:           0.92,
  shininess:         60,
  specular:          new THREE.Color('#4488FF'),
})

export default function Globe3D({ onCountryClick, selectedCode, history }) {
  const globeRef     = useRef()
  const containerRef = useRef()
  const inactRef     = useRef()

  const [countries, setCountries] = useState([])
  const [hovered, setHovered]     = useState(null)
  const [dims, setDims]           = useState({ w: 0, h: 0 })

  const historyMap = useMemo(() => {
    const m = {}
    history.forEach(h => { m[h.name] = h.risk })
    return m
  }, [history])

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topo => setCountries(feature(topo, topo.objects.countries).features))
      .catch(err => console.error('GeoJSON load failed:', err))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: Math.floor(entry.contentRect.width), h: Math.floor(entry.contentRect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

    // Add hologram lighting to the Three.js scene
    const scene = globeRef.current.scene()

    // Bright blue ambient — illuminates the whole globe
    const ambient = new THREE.AmbientLight(0x2255CC, 2.5)
    scene.add(ambient)

    // Front directional light — gives the globe shape
    const front = new THREE.DirectionalLight(0x5599FF, 3.0)
    front.position.set(1, 0.5, 2)
    scene.add(front)

    // Rim light from behind — hologram edge glow
    const rim = new THREE.DirectionalLight(0x0044FF, 1.5)
    rim.position.set(-2, -1, -1)
    scene.add(rim)
  }, [])

  const capColor = useCallback((d) => {
    const name = d.properties?.name
    const risk = historyMap[name]
    if (selectedCode && d.id?.toString() === selectedCode) {
      return risk ? RISK_HEX[risk] + 'CC' : 'rgba(255,23,68,0.80)'
    }
    if (name === hovered) return 'rgba(30,136,229,0.65)'
    if (risk) return RISK_HEX[risk] + '77'
    return 'rgba(0,60,160,0.55)'
  }, [selectedCode, hovered, historyMap])

  const altitude = useCallback((d) => {
    const name = d.properties?.name
    if (selectedCode && d.id?.toString() === selectedCode) return 0.016
    if (name === hovered) return 0.012
    return 0.005
  }, [selectedCode, hovered])

  const sideColor = useCallback((d) => {
    const name = d.properties?.name
    if (name === hovered) return 'rgba(30,136,229,0.35)'
    return 'rgba(0,30,100,0.70)'
  }, [hovered])

  const strokeColor = useCallback((d) => {
    const name = d.properties?.name
    if (selectedCode && d.id?.toString() === selectedCode) {
      const risk = historyMap[name]
      return risk ? RISK_HEX[risk] : '#FF1744'
    }
    if (name === hovered) return '#4AABFF'
    if (historyMap[name]) return RISK_HEX[historyMap[name]] + 'CC'
    return '#1A4488'
  }, [selectedCode, hovered, historyMap])

  const makeLabel = useCallback((d) => {
    const name = d.properties?.name
    if (!name) return ''
    const risk = historyMap[name]
    const rc   = risk ? RISK_HEX[risk] : null
    const badge = risk
      ? `<span style="margin-left:8px;background:${rc}22;color:${rc};border:1px solid ${rc};border-radius:3px;padding:1px 7px;font-size:10px;font-family:JetBrains Mono,monospace;letter-spacing:.05em;">${risk}</span>`
      : `<span style="margin-left:8px;color:#5BA8E5;font-size:10px;font-family:JetBrains Mono,monospace;">ANALIZAR</span>`
    return `<div style="background:rgba(5,15,40,0.95);border:1px solid #1E88E5;border-radius:4px;padding:7px 14px;font-family:Space Grotesk,sans-serif;display:flex;align-items:center;box-shadow:0 0 18px rgba(30,136,229,0.5),0 4px 24px rgba(0,0,0,.9);white-space:nowrap;"><span style="color:#90CAF9;font-size:12px;font-weight:600;letter-spacing:.04em;text-shadow:0 0 8px rgba(30,136,229,0.9);">${name}</span>${badge}</div>`
  }, [historyMap])

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
        inactRef.current = setTimeout(() => { ctrl.autoRotate = true }, 2000)
      }
    }
  }, [])

  const handleClick = useCallback((country) => {
    const name = country?.properties?.name
    if (!name) return
    if (globeRef.current) globeRef.current.controls().autoRotate = false
    onCountryClick(name, country.id?.toString() || name)
  }, [onCountryClick])

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      {/* Hologram grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `
          linear-gradient(rgba(0,100,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,100,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px'
      }} />

      {dims.w > 0 && (
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#1E88E5"
          atmosphereAltitude={0.30}
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

      {/* Vignette — only on the very edges */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 52%, rgba(5,8,16,0.80) 92%)'
      }} />
    </div>
  )
}
