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
  abyss:    '#1a1a2a',
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

let nodeCounter = 100
function makeId() { return `node-${nodeCounter++}` }

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
    const px = from.x + t * dx - x
    const py = from.y + t * dy - y
    const dist = Math.sqrt(px * px + py * py)
    if (dist < bestDist) { bestDist = dist; best = edge.id }
  }
  return best
}

const INITIAL: MapData = {
  nodes: [
    { id: 'node-0', x: 100, y: 300, type: 'start', label: 'Start' },
    { id: 'node-1', x: 280, y: 200, type: 'chamber', label: 'Komora 1' },
    { id: 'node-2', x: 280, y: 400, type: 'chamber', label: 'Komora 2' },
    { id: 'node-3', x: 460, y: 300, type: 'gland', label: 'Gruczoł' },
    { id: 'node-4', x: 640, y: 200, type: 'cyst', label: 'Torbiel' },
    { id: 'node-5', x: 640, y: 400, type: 'corridor', label: 'Korytarz' },
    { id: 'node-6', x: 820, y: 300, type: 'abyss', label: 'Abyss' },
  ],
  edges: [
    { id: 'e0', from: 'node-0', to: 'node-1' },
    { id: 'e1', from: 'node-0', to: 'node-2' },
    { id: 'e2', from: 'node-1', to: 'node-3' },
    { id: 'e3', from: 'node-2', to: 'node-3' },
    { id: 'e4', from: 'node-3', to: 'node-4' },
    { id: 'e5', from: 'node-3', to: 'node-5' },
    { id: 'e6', from: 'node-4', to: 'node-6' },
    { id: 'e7', from: 'node-5', to: 'node-6' },
  ],
}

// ─── AI GENEROWANIE MAPY ─────────────────────────────────────────────────────

const AI_SYSTEM = `Jesteś generatorem map dla gry karcianej dark fantasy "Ostatni Język".
Generujesz mapy jako JSON z węzłami i krawędziami.

Typy węzłów:
- start: punkt startowy (zawsze 1, na lewej krawędzi)
- chamber: walka standardowa (najczęstszy)
- corridor: wydarzenie / wybór narracyjny
- gland: leczenie / nagroda
- cyst: trudna walka z lepszą nagrodą
- abyss: boss / finałowy węzeł (zawsze 1, na prawej krawędzi)

Zasady layoutu:
- Canvas: 900x600 px
- Węzły rozłożone od lewej (x~100) do prawej (x~820)
- Y między 80 a 520
- Minimum 8, maksimum 16 węzłów
- Mapa MUSI być spójna (każdy węzeł osiągalny ze start)
- Każdy węzeł ma min 1 połączenie przychodzące (poza start) i 1 wychodzące (poza abyss)

Odpowiedz TYLKO czystym JSON bez komentarzy ani markdown:
{
  "nodes": [
    {"id": "n0", "x": 100, "y": 300, "type": "start", "label": "Start"},
    ...
  ],
  "edges": [
    {"id": "e0", "from": "n0", "to": "n1"},
    ...
  ]
}`

async function generateMapWithAI(prompt: string): Promise<MapData> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: AI_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  const data = await response.json()
  const text = data.content.find((b: any) => b.type === 'text')?.text ?? ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as MapData
}

// ─── KOMPONENT GŁÓWNY ─────────────────────────────────────────────────────────

type Tool = 'select' | 'add' | 'connect' | 'delete'

const AI_PRESETS = [
  'Wygeneruj krótką mapę (8 węzłów) z jedną ścieżką główną i jedną boczną',
  'Wygeneruj rozbudowaną mapę (14 węzłów) z wieloma alternatywnymi ścieżkami',
  'Wygeneruj mapę zorientowaną na walkę — dużo Komor i Torbiel, mało Gruczołów',
  'Wygeneruj zrównoważoną mapę z równą ilością wszystkich typów węzłów',
  'Wygeneruj trudną mapę — boss Abyss poprzedzony trzema Torbielami',
]

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
  const [aiPrompt, setAiPrompt] = useState(AI_PRESETS[0])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const getSVGCoords = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // ─── AI GENEROWANIE ───────────────────────────────────────────────────────

  const handleGenerateAI = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const generated = await generateMapWithAI(aiPrompt)
      setMap(generated)
      setSelected(null)
      setEditingId(null)
      setConnecting(null)
    } catch (err: any) {
      setAiError(err.message ?? 'Błąd generowania')
    } finally {
      setAiLoading(false)
    }
  }

  // ─── KLIKNIĘCIE NA SVG ───────────────────────────────────────────────────

  const handleSVGClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return
    const { x, y } = getSVGCoords(e)
    const hit = getNodeAt(map.nodes, x, y)

    if (tool === 'add') {
      if (!hit) {
        const newNode: MapNode = {
          id: makeId(),
          x, y,
          type: addType,
          label: NODE_LABELS[addType].split(' ')[1] ?? addType,
        }
        setMap(m => ({ ...m, nodes: [...m.nodes, newNode] }))
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
            const edgeId = `e-${connecting}-${hit.id}`
            setMap(m => ({ ...m, edges: [...m.edges, { id: edgeId, from: connecting, to: hit.id }] }))
          }
        }
        setConnecting(null)
      }
      return
    }

    if (hit) {
      setSelected(hit.id)
      setEditingId(hit.id)
      setEditLabel(hit.label)
    } else {
      setSelected(null)
      setEditingId(null)
    }
  }, [tool, addType, map, selected, connecting, dragging])

  // ─── DRAG ────────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (tool !== 'select') return
    e.stopPropagation()
    const { x, y } = getSVGCoords(e)
    const node = map.nodes.find(n => n.id === nodeId)!
    setDragging(nodeId)
    setDragOffset({ x: x - node.x, y: y - node.y })
    setSelected(nodeId)
    setEditingId(nodeId)
    setEditLabel(node.label)
  }, [tool, map.nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const { x, y } = getSVGCoords(e)
    const nx = Math.max(NODE_RADIUS, Math.min(CANVAS_W - NODE_RADIUS, x - dragOffset.x))
    const ny = Math.max(NODE_RADIUS, Math.min(CANVAS_H - NODE_RADIUS, y - dragOffset.y))
    setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === dragging ? { ...n, x: nx, y: ny } : n) }))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(() => setDragging(null), [])

  // ─── EDYCJA WĘZŁA ────────────────────────────────────────────────────────

  const applyLabel = () => {
    if (!editingId) return
    setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === editingId ? { ...n, label: editLabel } : n) }))
  }

  const changeType = (type: NodeType) => {
    if (!editingId) return
    setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === editingId ? { ...n, type } : n) }))
  }

  // ─── EKSPORT ─────────────────────────────────────────────────────────────

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'map.json'; a.click()
  }

  const selectedNode = map.nodes.find(n => n.id === editingId)

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1a1208', color: '#e8d5b0', fontFamily: 'Georgia, serif' }}>

      {/* PANEL BOCZNY */}
      <div style={{ width: 210, padding: 10, borderRight: '1px solid #3a2510', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c8902a' }}>🗺️ Map Editor</div>

        {/* AI GENEROWANIE */}
        <div style={{ background: '#1e1428', border: '1px solid #4a2878', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, color: '#c8a8e8', textTransform: 'uppercase', fontWeight: 'bold' }}>🤖 Generuj mapę AI</div>
          <select
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            style={{ background: '#2a1a38', border: '1px solid #4a2878', color: '#c8b0e8', padding: '4px 6px', borderRadius: 4, fontSize: 10, width: '100%' }}
          >
            {AI_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={3}
            style={{ background: '#2a1a38', border: '1px solid #4a2878', color: '#c8b0e8', padding: '4px 6px', borderRadius: 4, fontSize: 10, resize: 'vertical', fontFamily: 'Georgia, serif' }}
            placeholder="Opisz mapę którą chcesz wygenerować..."
          />
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            style={{
              padding: '7px 10px', fontSize: 11, fontWeight: 'bold',
              background: aiLoading ? '#2a1a38' : '#4a2878',
              border: '1px solid #702890',
              color: aiLoading ? '#6a5080' : '#e8d5b0',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              borderRadius: 4,
            }}
          >
            {aiLoading ? '⏳ Generuję...' : '✨ Generuj mapę'}
          </button>
          {aiError && <div style={{ fontSize: 10, color: '#c06060' }}>❌ {aiError}</div>}
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

        {/* Edycja wybranego węzła */}
        {editingId && selectedNode && tool === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid #3a2510', paddingTop: 8 }}>
            <div style={{ fontSize: 10, color: '#6a5040', textTransform: 'uppercase' }}>Edycja węzła</div>
            <input
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onBlur={applyLabel}
              onKeyDown={e => e.key === 'Enter' && applyLabel()}
              style={{ background: '#2a1a0a', border: '1px solid #5a3a1a', color: '#e8d5b0', padding: '4px 6px', borderRadius: 4, fontSize: 11 }}
              placeholder="Nazwa węzła"
            />
            <div style={{ fontSize: 10, color: '#6a5040' }}>Zmień typ:</div>
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

        {/* Status połączenia */}
        {tool === 'connect' && (
          <div style={{ fontSize: 10, color: connecting ? '#c8902a' : '#6a5040', background: '#1e1208', padding: 8, borderRadius: 4, border: '1px solid #3a2510' }}>
            {connecting ? 'Kliknij drugi węzeł' : 'Kliknij pierwszy węzeł'}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Akcje */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={exportJSON} style={{ padding: '6px 8px', fontSize: 10, background: '#0a2a1a', border: '1px solid #2a6040', color: '#70c890', cursor: 'pointer', borderRadius: 4 }}>
            ⬇ Eksportuj JSON
          </button>
          <button onClick={() => { setMap(INITIAL); setSelected(null); setEditingId(null); setConnecting(null) }} style={{ padding: '6px 8px', fontSize: 10, background: '#2a0a0a', border: '1px solid #6a2020', color: '#c07070', cursor: 'pointer', borderRadius: 4 }}>
            ↺ Reset mapy
          </button>
        </div>

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
            width: '100%', height: '100%', display: 'block',
            background: '#120e06',
            cursor: tool === 'add' ? 'crosshair' : tool === 'delete' ? 'not-allowed' : 'default',
          }}
          onClick={handleSVGClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a1e0a" strokeWidth="0.5" />
            </pattern>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#5a4020" />
            </marker>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

          {/* Krawędzie */}
          {map.edges.map(edge => {
            const from = map.nodes.find(n => n.id === edge.from)
            const to = map.nodes.find(n => n.id === edge.to)
            if (!from || !to) return null
            // Skróć linię żeby nie wchodziła w środek węzła
            const dx = to.x - from.x, dy = to.y - from.y
            const len = Math.sqrt(dx * dx + dy * dy)
            if (len === 0) return null
            const ux = dx / len, uy = dy / len
            const x1 = from.x + ux * NODE_RADIUS
            const y1 = from.y + uy * NODE_RADIUS
            const x2 = to.x - ux * (NODE_RADIUS + 8)
            const y2 = to.y - uy * (NODE_RADIUS + 8)
            return (
              <line
                key={edge.id}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#5a4020"
                strokeWidth={2}
                markerEnd="url(#arrow)"
                strokeDasharray={tool === 'delete' ? '6 3' : undefined}
              />
            )
          })}

          {/* Węzły */}
          {map.nodes.map(node => {
            const isSelected = selected === node.id
            const isConnecting = connecting === node.id
            return (
              <g
                key={node.id}
                onMouseDown={e => handleMouseDown(e, node.id)}
                style={{ cursor: tool === 'select' ? (dragging === node.id ? 'grabbing' : 'grab') : tool === 'delete' ? 'not-allowed' : 'pointer' }}
              >
                {(isSelected || isConnecting) && (
                  <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 7} fill="none"
                    stroke={isConnecting ? '#c8902a' : '#d4a830'} strokeWidth={2} opacity={0.7} />
                )}
                <circle cx={node.x} cy={node.y} r={NODE_RADIUS}
                  fill={NODE_COLORS[node.type]}
                  stroke={isSelected ? '#d4a830' : '#3a2510'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text x={node.x} y={node.y - 7} textAnchor="middle" fontSize={13} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {NODE_LABELS[node.type].split(' ')[0]}
                </text>
                <text x={node.x} y={node.y + 8} textAnchor="middle" fontSize={8} fill="#e8d5b0" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {node.label.length > 10 ? node.label.slice(0, 10) + '…' : node.label}
                </text>
              </g>
            )
          })}

          {/* Overlay przy generowaniu */}
          {aiLoading && (
            <g>
              <rect width={CANVAS_W} height={CANVAS_H} fill="#000" opacity={0.6} />
              <text x={CANVAS_W / 2} y={CANVAS_H / 2 - 10} textAnchor="middle" fontSize={20} fill="#c8a8e8">✨ Generuję mapę...</text>
              <text x={CANVAS_W / 2} y={CANVAS_H / 2 + 20} textAnchor="middle" fontSize={12} fill="#6a5080">AI tworzy węzły i ścieżki</text>
            </g>
          )}
        </svg>

        {/* Info bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#1a1208cc', borderTop: '1px solid #3a2510',
          padding: '4px 12px', fontSize: 10, color: '#6a5040',
          display: 'flex', gap: 16,
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
