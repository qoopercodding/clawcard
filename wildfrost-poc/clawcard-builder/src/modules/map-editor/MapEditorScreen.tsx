// @ts-nocheck
import { useState, useRef, useCallback } from 'react'

// ─── TYPY ────────────────────────────────────────────────────────────────────

type NodeType = 'chamber' | 'corridor' | 'gland' | 'cyst' | 'abyss' | 'start'

interface MapNode {
  id: string
  x: number
  y: number
  type: NodeType
  label: string
}

interface MapEdge {
  id: string
  from: string
  to: string
}

interface MapData {
  nodes: MapNode[]
  edges: MapEdge[]
}

// ─── KONFIGURACJA ────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  start:    '#4a8040',
  chamber:  '#8a3030',
  corridor: '#6a5020',
  gland:    '#306080',
  cyst:     '#702890',
  abyss:    '#1a1a3a',
}

const NODE_LABELS: Record<NodeType, string> = {
  start:    '🏁 Start',
  chamber:  '⚔️ Komora',
  corridor: '🚪 Korytarz',
  gland:    '💧 Gruczoł',
  cyst:     '☠️ Torbiel',
  abyss:    '🕳️ Abyss',
}

const NODE_TYPES: NodeType[] = ['start', 'chamber', 'corridor', 'gland', 'cyst', 'abyss']
const NODE_RADIUS = 28
const CANVAS_W = 900
const CANVAS_H = 600

// ─── HELPERS ─────────────────────────────────────────────────────────────────

let _counter = 100
function uid() { return `n${_counter++}` }

function getNodeAt(nodes: MapNode[], x: number, y: number): MapNode | null {
  for (const n of nodes) {
    const dx = n.x - x, dy = n.y - y
    if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS) return n
  }
  return null
}

function findClosestEdge(map: MapData, x: number, y: number): string | null {
  let best: string | null = null
  let bestDist = 20
  for (const edge of map.edges) {
    const from = map.nodes.find(n => n.id === edge.from)
    const to = map.nodes.find(n => n.id === edge.to)
    if (!from || !to) continue
    const dx = to.x - from.x, dy = to.y - from.y
    const len2 = dx * dx + dy * dy
    if (len2 === 0) continue
    const t = Math.max(0, Math.min(1, ((x - from.x) * dx + (y - from.y) * dy) / len2))
    const dist = Math.sqrt((from.x + t * dx - x) ** 2 + (from.y + t * dy - y) ** 2)
    if (dist < bestDist) { bestDist = dist; best = edge.id }
  }
  return best
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── GENERATOR MAP (LAYER-BY-LAYER) ──────────────────────────────────────────

interface GenOptions {
  layers: number       // liczba kolumn (bez start i abyss)
  density: 'sparse' | 'normal' | 'dense'  // węzłów na warstwę
  style: 'balanced' | 'combat' | 'explore'  // styl
  extraEdges: number  // dodatkowe krawędzie
}

// Wagi typów węzłów zależnie od stylu
const TYPE_WEIGHTS: Record<string, Partial<Record<NodeType, number>>> = {
  balanced: { chamber: 4, corridor: 2, gland: 2, cyst: 2 },
  combat:   { chamber: 6, corridor: 1, gland: 1, cyst: 3 },
  explore:  { chamber: 2, corridor: 4, gland: 3, cyst: 1 },
}

function weightedPick(weights: Partial<Record<NodeType, number>>): NodeType {
  const entries = Object.entries(weights) as [NodeType, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [type, w] of entries) {
    r -= w
    if (r <= 0) return type
  }
  return entries[0][0]
}

function generateMap(opts: GenOptions): MapData {
  const { layers, density, style, extraEdges } = opts
  const nodesPerLayer = { sparse: [1, 2], normal: [2, 3], dense: [3, 4] }[density]
  const weights = TYPE_WEIGHTS[style]

  const padX = 80
  const padY = 80
  const usableW = CANVAS_W - padX * 2
  const usableH = CANVAS_H - padY * 2
  const totalLayers = layers + 2 // +start +abyss
  const layerW = usableW / (totalLayers - 1)

  const nodes: MapNode[] = []
  const edges: MapEdge[] = []
  const layerNodes: string[][] = []

  // Start
  const startId = uid()
  nodes.push({ id: startId, x: padX, y: CANVAS_H / 2, type: 'start', label: 'Start' })
  layerNodes.push([startId])

  // Środkowe warstwy
  for (let l = 0; l < layers; l++) {
    const x = padX + layerW * (l + 1)
    const count = rnd(nodesPerLayer[0], nodesPerLayer[1])
    const layer: string[] = []

    // Rozłóż Y równomiernie z jitterem
    const yStep = usableH / (count + 1)
    for (let i = 0; i < count; i++) {
      const baseY = padY + yStep * (i + 1)
      const jitter = rnd(-20, 20)
      const y = Math.max(padY, Math.min(CANVAS_H - padY, baseY + jitter))
      const type = weightedPick(weights)
      const id = uid()
      const labelNames: Record<NodeType, string[]> = {
        start: ['Start'],
        chamber: ['Jama', 'Sala', 'Krypta', 'Loch', 'Grota'],
        corridor: ['Przejście', 'Tunel', 'Ścieżka', 'Galeria'],
        gland: ['Źródło', 'Studnia', 'Staw', 'Fontanna'],
        cyst: ['Torbiel', 'Wrzód', 'Pęcherz', 'Narośl'],
        abyss: ['Otchłań'],
      }
      nodes.push({ id, x, y, type, label: pick(labelNames[type]) })
      layer.push(id)
    }
    layerNodes.push(layer)
  }

  // Abyss
  const abyssId = uid()
  nodes.push({ id: abyssId, x: CANVAS_W - padX, y: CANVAS_H / 2, type: 'abyss', label: 'Otchłań' })
  layerNodes.push([abyssId])

  // Krawędzie: każdy węzeł łączy się z co najmniej jednym w następnej warstwie
  const addEdge = (from: string, to: string) => {
    const id = `e-${from}-${to}`
    if (!edges.some(e => e.id === id)) {
      edges.push({ id, from, to })
    }
  }

  for (let l = 0; l < layerNodes.length - 1; l++) {
    const curr = layerNodes[l]
    const next = layerNodes[l + 1]

    // Każdy węzeł z curr → losowy z next
    for (const fromId of curr) {
      addEdge(fromId, pick(next))
    }

    // Każdy węzeł z next dostaje co najmniej jedno połączenie z curr
    for (const toId of next) {
      if (!edges.some(e => e.to === toId)) {
        addEdge(pick(curr), toId)
      }
    }
  }

  // Dodatkowe losowe krawędzie (między sąsiednimi warstwami)
  for (let i = 0; i < extraEdges; i++) {
    const l = rnd(0, layerNodes.length - 2)
    const from = pick(layerNodes[l])
    const to = pick(layerNodes[l + 1])
    addEdge(from, to)
  }

  return { nodes, edges }
}

// ─── DOMYŚLNA MAPA ────────────────────────────────────────────────────────────

const INITIAL: MapData = generateMap({ layers: 4, density: 'normal', style: 'balanced', extraEdges: 2 })

// ─── PRESETSY ─────────────────────────────────────────────────────────────────

interface Preset {
  label: string
  opts: GenOptions
}

const PRESETS: Preset[] = [
  { label: '⚖️ Zrównoważona (normalna)', opts: { layers: 4, density: 'normal', style: 'balanced', extraEdges: 2 } },
  { label: '⚔️ Bojowa (dużo walk)', opts: { layers: 5, density: 'normal', style: 'combat', extraEdges: 1 } },
  { label: '🗺️ Eksploracja (dużo korytarzy)', opts: { layers: 5, density: 'dense', style: 'explore', extraEdges: 3 } },
  { label: '💀 Krótka i brutalna', opts: { layers: 3, density: 'sparse', style: 'combat', extraEdges: 0 } },
  { label: '🌿 Rozległa i gęsta', opts: { layers: 6, density: 'dense', style: 'balanced', extraEdges: 4 } },
  { label: '☠️ Gauntlet (liniowa)', opts: { layers: 7, density: 'sparse', style: 'combat', extraEdges: 0 } },
]

// ─── KOMPONENT ────────────────────────────────────────────────────────────────

type Tool = 'select' | 'add' | 'connect' | 'delete'

export default function MapEditorScreen() {
  const [map, setMap] = useState<MapData>(INITIAL)
  const [tool, setTool] = useState<Tool>('select')
  const [addType, setAddType] = useState<NodeType>('chamber')
  const [selected, setSelected] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editLabel, setEditLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customOpts, setCustomOpts] = useState<GenOptions>({ layers: 4, density: 'normal', style: 'balanced', extraEdges: 2 })
  const svgRef = useRef<SVGSVGElement>(null)

  const getSVGCoords = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    }
  }

  const handleGenerate = (opts: GenOptions) => {
    setMap(generateMap(opts))
    setSelected(null); setEditingId(null); setConnecting(null)
  }

  // ─── KLIKNIĘCIE SVG ────────────────────────────────────────────────────────

  const handleSVGClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return
    const { x, y } = getSVGCoords(e)
    const hit = getNodeAt(map.nodes, x, y)

    if (tool === 'add') {
      if (!hit) {
        const type = addType
        const labels: Record<NodeType, string[]> = {
          start: ['Start'], abyss: ['Otchłań'],
          chamber: ['Jama', 'Sala', 'Krypta'], corridor: ['Przejście', 'Tunel'],
          gland: ['Źródło', 'Studnia'], cyst: ['Torbiel', 'Wrzód'],
        }
        setMap(m => ({ ...m, nodes: [...m.nodes, { id: uid(), x, y, type, label: pick(labels[type]) }] }))
      }
      return
    }

    if (tool === 'delete') {
      if (hit) {
        setMap(m => ({
          nodes: m.nodes.filter(n => n.id !== hit.id),
          edges: m.edges.filter(e => e.from !== hit.id && e.to !== hit.id),
        }))
        if (selected === hit.id) setSelected(null)
      } else {
        const closest = findClosestEdge(map, x, y)
        if (closest) setMap(m => ({ ...m, edges: m.edges.filter(e => e.id !== closest) }))
      }
      return
    }

    if (tool === 'connect') {
      if (!hit) { setConnecting(null); return }
      if (!connecting) {
        setConnecting(hit.id)
      } else {
        if (connecting !== hit.id) {
          const exists = map.edges.some(e =>
            (e.from === connecting && e.to === hit.id) ||
            (e.from === hit.id && e.to === connecting)
          )
          if (!exists) {
            setMap(m => ({ ...m, edges: [...m.edges, { id: `e-${connecting}-${hit.id}`, from: connecting, to: hit.id }] }))
          }
        }
        setConnecting(null)
      }
      return
    }

    if (hit) {
      setSelected(hit.id); setEditingId(hit.id); setEditLabel(hit.label)
    } else {
      setSelected(null); setEditingId(null)
    }
  }, [tool, addType, map, selected, connecting, dragging])

  // ─── DRAG ──────────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (tool !== 'select') return
    e.stopPropagation()
    const { x, y } = getSVGCoords(e)
    const node = map.nodes.find(n => n.id === nodeId)!
    setDragging(nodeId); setDragOffset({ x: x - node.x, y: y - node.y })
    setSelected(nodeId); setEditingId(nodeId); setEditLabel(node.label)
  }, [tool, map.nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const { x, y } = getSVGCoords(e)
    const nx = Math.max(NODE_RADIUS, Math.min(CANVAS_W - NODE_RADIUS, x - dragOffset.x))
    const ny = Math.max(NODE_RADIUS, Math.min(CANVAS_H - NODE_RADIUS, y - dragOffset.y))
    setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === dragging ? { ...n, x: nx, y: ny } : n) }))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(() => setDragging(null), [])

  // ─── EDYCJA ────────────────────────────────────────────────────────────────

  const applyLabel = () => {
    if (!editingId) return
    setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === editingId ? { ...n, label: editLabel } : n) }))
  }

  const changeType = (type: NodeType) => {
    if (!editingId) return
    setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === editingId ? { ...n, type } : n) }))
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'map.json'; a.click()
  }

  const selectedNode = map.nodes.find(n => n.id === editingId)

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1a1208', color: '#e8d5b0', fontFamily: 'Georgia, serif' }}>

      {/* PANEL */}
      <div style={{ width: 215, padding: 10, borderRight: '1px solid #3a2510', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c8902a' }}>🗺️ Map Editor</div>

        {/* GENEROWANIE MAPY */}
        <div style={{ background: '#1e1810', border: '1px solid #5a3a1a', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, color: '#c8902a', textTransform: 'uppercase', fontWeight: 'bold' }}>⚙️ Generuj mapę</div>

          {/* Presety */}
          <div style={{ fontSize: 10, color: '#6a5040' }}>Preset:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { setCustomOpts(p.opts); handleGenerate(p.opts) }} style={{
                padding: '4px 6px', textAlign: 'left', fontSize: 10,
                background: '#2a1a0a', border: '1px solid #3a2510',
                color: '#c8a870', cursor: 'pointer', borderRadius: 3,
              }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Opcje custom */}
          <div style={{ borderTop: '1px solid #3a2510', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#6a5040' }}>Własne ustawienia:</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#9a8060', width: 60 }}>Warstwy:</span>
              <input type="range" min={2} max={8} value={customOpts.layers}
                onChange={e => setCustomOpts(o => ({ ...o, layers: +e.target.value }))}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: '#c8902a', width: 16 }}>{customOpts.layers}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#9a8060', width: 60 }}>Gęstość:</span>
              <select value={customOpts.density}
                onChange={e => setCustomOpts(o => ({ ...o, density: e.target.value as any }))}
                style={{ flex: 1, background: '#2a1a0a', border: '1px solid #3a2510', color: '#c8a870', fontSize: 10, padding: '2px' }}>
                <option value="sparse">Rzadka</option>
                <option value="normal">Normalna</option>
                <option value="dense">Gęsta</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#9a8060', width: 60 }}>Styl:</span>
              <select value={customOpts.style}
                onChange={e => setCustomOpts(o => ({ ...o, style: e.target.value as any }))}
                style={{ flex: 1, background: '#2a1a0a', border: '1px solid #3a2510', color: '#c8a870', fontSize: 10, padding: '2px' }}>
                <option value="balanced">Zrównoważony</option>
                <option value="combat">Bojowy</option>
                <option value="explore">Eksploracja</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#9a8060', width: 60 }}>Extra ścieżki:</span>
              <input type="range" min={0} max={6} value={customOpts.extraEdges}
                onChange={e => setCustomOpts(o => ({ ...o, extraEdges: +e.target.value }))}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: '#c8902a', width: 16 }}>{customOpts.extraEdges}</span>
            </div>

            <button onClick={() => handleGenerate(customOpts)} style={{
              padding: '6px', fontSize: 11, fontWeight: 'bold',
              background: '#5a3010', border: '1px solid #c8902a',
              color: '#e8d5b0', cursor: 'pointer', borderRadius: 4,
            }}>
              🎲 Generuj
            </button>
          </div>
        </div>

        {/* Narzędzia */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: '#6a5040', textTransform: 'uppercase' }}>Narzędzie</div>
          {(['select', 'add', 'connect', 'delete'] as Tool[]).map(t => (
            <button key={t} onClick={() => { setTool(t); setConnecting(null) }} style={{
              padding: '5px 8px', textAlign: 'left', fontSize: 10,
              background: tool === t ? '#5a3010' : '#2a1a0a',
              border: `1px solid ${tool === t ? '#c8902a' : '#3a2510'}`,
              color: tool === t ? '#e8d5b0' : '#9a8060', cursor: 'pointer', borderRadius: 4,
            }}>
              {{ select: '↖ Wybierz / Przeciągnij', add: '➕ Dodaj węzeł', connect: '🔗 Połącz węzły', delete: '🗑 Usuń' }[t]}
            </button>
          ))}
        </div>

        {/* Typ węzła przy dodawaniu */}
        {tool === 'add' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: '#6a5040', textTransform: 'uppercase' }}>Typ węzła</div>
            {NODE_TYPES.map(t => (
              <button key={t} onClick={() => setAddType(t)} style={{
                padding: '4px 8px', textAlign: 'left', fontSize: 10,
                background: addType === t ? NODE_COLORS[t] : '#1e1208',
                border: `1px solid ${addType === t ? '#fff4' : '#3a2510'}`,
                color: '#e8d5b0', cursor: 'pointer', borderRadius: 4,
              }}>
                {NODE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {/* Edycja węzła */}
        {editingId && selectedNode && tool === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #3a2510', paddingTop: 8 }}>
            <div style={{ fontSize: 10, color: '#6a5040', textTransform: 'uppercase' }}>Edycja węzła</div>
            <input value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onBlur={applyLabel}
              onKeyDown={e => e.key === 'Enter' && applyLabel()}
              style={{ background: '#2a1a0a', border: '1px solid #5a3a1a', color: '#e8d5b0', padding: '4px 6px', borderRadius: 4, fontSize: 11 }}
            />
            {NODE_TYPES.map(t => (
              <button key={t} onClick={() => changeType(t)} style={{
                padding: '3px 6px', textAlign: 'left', fontSize: 10,
                background: selectedNode.type === t ? NODE_COLORS[t] : '#1e1208',
                border: `1px solid ${selectedNode.type === t ? '#fff4' : '#3a2510'}`,
                color: '#e8d5b0', cursor: 'pointer', borderRadius: 3,
              }}>
                {NODE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {tool === 'connect' && (
          <div style={{ fontSize: 10, color: connecting ? '#c8902a' : '#6a5040', background: '#1e1208', padding: 8, borderRadius: 4, border: '1px solid #3a2510' }}>
            {connecting ? 'Kliknij drugi węzeł' : 'Kliknij pierwszy węzeł'}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={exportJSON} style={{ padding: '6px 8px', fontSize: 10, background: '#0a2a1a', border: '1px solid #2a6040', color: '#70c890', cursor: 'pointer', borderRadius: 4 }}>
          ⬇ Eksportuj JSON
        </button>

        {/* Legenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: '#6a5040', textTransform: 'uppercase' }}>Legenda</div>
          {NODE_TYPES.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#9a8060' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: NODE_COLORS[t], flexShrink: 0 }} />
              {NODE_LABELS[t]}
            </div>
          ))}
        </div>
      </div>

      {/* CANVAS */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          style={{
            width: '100%', height: '100%', display: 'block', background: '#120e06',
            cursor: tool === 'add' ? 'crosshair' : tool === 'delete' ? 'not-allowed' : 'default',
          }}
          onClick={handleSVGClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#221a08" strokeWidth="0.5" />
            </pattern>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#6a5030" />
            </marker>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

          {/* Krawędzie */}
          {map.edges.map(edge => {
            const from = map.nodes.find(n => n.id === edge.from)
            const to = map.nodes.find(n => n.id === edge.to)
            if (!from || !to) return null
            const dx = to.x - from.x, dy = to.y - from.y
            const len = Math.sqrt(dx * dx + dy * dy)
            if (len === 0) return null
            const ux = dx / len, uy = dy / len
            return (
              <line key={edge.id}
                x1={from.x + ux * NODE_RADIUS} y1={from.y + uy * NODE_RADIUS}
                x2={to.x - ux * (NODE_RADIUS + 8)} y2={to.y - uy * (NODE_RADIUS + 8)}
                stroke="#5a4020" strokeWidth={2}
                markerEnd="url(#arrow)"
                strokeDasharray={tool === 'delete' ? '6 3' : undefined}
              />
            )
          })}

          {/* Węzły */}
          {map.nodes.map(node => {
            const isSel = selected === node.id
            const isConn = connecting === node.id
            return (
              <g key={node.id}
                onMouseDown={e => handleMouseDown(e, node.id)}
                style={{ cursor: tool === 'select' ? (dragging === node.id ? 'grabbing' : 'grab') : tool === 'delete' ? 'not-allowed' : 'pointer' }}
              >
                {(isSel || isConn) && (
                  <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 7}
                    fill="none" stroke={isConn ? '#c8902a' : '#d4a830'} strokeWidth={2} opacity={0.7} />
                )}
                <circle cx={node.x} cy={node.y} r={NODE_RADIUS}
                  fill={NODE_COLORS[node.type]}
                  stroke={isSel ? '#d4a830' : '#2a1a08'} strokeWidth={isSel ? 2 : 1}
                />
                <text x={node.x} y={node.y - 6} textAnchor="middle" fontSize={14}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {NODE_LABELS[node.type].split(' ')[0]}
                </text>
                <text x={node.x} y={node.y + 9} textAnchor="middle" fontSize={8} fill="#e8d5b0"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {node.label.length > 9 ? node.label.slice(0, 9) + '…' : node.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Info bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#1a1208cc', borderTop: '1px solid #3a2510',
          padding: '4px 12px', fontSize: 10, color: '#6a5040', display: 'flex', gap: 16,
        }}>
          <span>Węzły: {map.nodes.length}</span>
          <span>Ścieżki: {map.edges.length}</span>
          <span>Narzędzie: <span style={{ color: '#c8902a' }}>{tool}</span></span>
          {selected && <span>Wybrany: <span style={{ color: '#d4a830' }}>{map.nodes.find(n => n.id === selected)?.label}</span></span>}
          {connecting && <span style={{ color: '#c8902a' }}>Łączenie: {map.nodes.find(n => n.id === connecting)?.label} → ?</span>}
        </div>
      </div>
    </div>
  )
}
