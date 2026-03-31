import { useState, useMemo } from 'react'
import type { MapNodeType } from '../store/GameState'

const NODE_CONFIG: Record<MapNodeType, { emoji: string; label: string; color: string }> = {
  combat:   { emoji: '⚔️', label: 'Combat',   color: '#c8902a' },
  elite:    { emoji: '💀', label: 'Elite',     color: '#e05555' },
  boss:     { emoji: '👹', label: 'Boss',      color: '#ff4444' },
  shop:     { emoji: '🛒', label: 'Shop',      color: '#86efac' },
  campfire: { emoji: '🔥', label: 'Campfire',  color: '#f5c563' },
  event:    { emoji: '❓', label: 'Event',     color: '#a78bfa' },
  treasure: { emoji: '💎', label: 'Treasure',  color: '#38bdf8' },
}

interface GeneratedNode {
  id: string
  type: MapNodeType
  row: number
  col: number
  x: number
  y: number
  connections: string[]
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function pickNodeType(row: number, totalRows: number, rng: () => number): MapNodeType {
  if (row === totalRows - 1) return 'boss'
  if (row === 0) return 'combat'

  const roll = rng()
  if (roll < 0.35) return 'combat'
  if (roll < 0.50) return 'elite'
  if (roll < 0.62) return 'campfire'
  if (roll < 0.74) return 'shop'
  if (roll < 0.86) return 'event'
  return 'treasure'
}

function generateMap(seed: number, rows = 8, nodesPerRow = 4): GeneratedNode[] {
  const rng = seededRandom(seed)
  const nodes: GeneratedNode[] = []
  const colWidth = 160
  const rowHeight = 100
  const mapWidth = (nodesPerRow - 1) * colWidth

  for (let row = 0; row < rows; row++) {
    const count = row === 0 ? 1 : row === rows - 1 ? 1 : 2 + Math.floor(rng() * (nodesPerRow - 1))
    const startX = (mapWidth - (count - 1) * colWidth) / 2

    for (let i = 0; i < count; i++) {
      const jitterX = row === 0 || row === rows - 1 ? 0 : (rng() - 0.5) * 40
      const jitterY = (rng() - 0.5) * 20
      nodes.push({
        id: `${row}-${i}`,
        type: pickNodeType(row, rows, rng),
        row,
        col: i,
        x: startX + i * colWidth + jitterX + 80,
        y: row * rowHeight + jitterY + 60,
        connections: [],
      })
    }
  }

  // Connect each node to 1-2 nodes in the next row
  for (let row = 0; row < rows - 1; row++) {
    const currentRow = nodes.filter(n => n.row === row)
    const nextRow = nodes.filter(n => n.row === row + 1)
    if (nextRow.length === 0) continue

    for (const node of currentRow) {
      // Sort next row by distance
      const sorted = [...nextRow].sort((a, b) =>
        Math.abs(a.x - node.x) - Math.abs(b.x - node.x)
      )
      // Connect to closest, maybe second closest
      node.connections.push(sorted[0].id)
      if (sorted.length > 1 && rng() > 0.4) {
        node.connections.push(sorted[1].id)
      }
    }

    // Ensure every next-row node has at least one incoming connection
    for (const next of nextRow) {
      const hasIncoming = currentRow.some(n => n.connections.includes(next.id))
      if (!hasIncoming) {
        const closest = [...currentRow].sort((a, b) =>
          Math.abs(a.x - next.x) - Math.abs(b.x - next.x)
        )[0]
        closest.connections.push(next.id)
      }
    }
  }

  return nodes
}

interface MapScreenProps {
  seed?: number
  floor?: number
  onSelectNode?: (nodeId: string, type: MapNodeType) => void
}

export default function MapScreen({ seed: propSeed, floor: _floor = 0, onSelectNode }: MapScreenProps) {
  const [seed, setSeed] = useState(() => propSeed ?? Math.floor(Math.random() * 999999))
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set())
  const [currentNode, setCurrentNode] = useState<string | null>(null)
  const [reachable, setReachable] = useState<Set<string>>(new Set())

  const nodes = useMemo(() => generateMap(seed), [seed])
  const nodeMap = useMemo(() => {
    const m = new Map<string, GeneratedNode>()
    for (const n of nodes) m.set(n.id, n)
    return m
  }, [nodes])

  // Initialize reachable to first row on seed change
  useMemo(() => {
    const firstRow = nodes.filter(n => n.row === 0)
    setReachable(new Set(firstRow.map(n => n.id)))
    setCurrentNode(null)
    setVisitedNodes(new Set())
    setSelectedNode(null)
  }, [nodes])

  const svgWidth = 640
  const svgHeight = nodes.reduce((max, n) => Math.max(max, n.y), 0) + 100

  function handleNodeClick(node: GeneratedNode) {
    if (!reachable.has(node.id)) return
    setSelectedNode(node.id)
    setCurrentNode(node.id)
    setVisitedNodes(prev => new Set([...prev, node.id]))
    setReachable(new Set(node.connections))
    onSelectNode?.(node.id, node.type)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: 24,
      minHeight: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h2 style={{
          fontFamily: 'var(--font-gothic)',
          color: 'var(--color-gold)',
          margin: 0,
          fontSize: '1.4rem',
        }}>
          Dungeon Map
        </h2>
        <button
          type="button"
          onClick={() => setSeed(Math.floor(Math.random() * 999999))}
          style={{
            background: 'rgba(200,144,42,0.12)',
            border: '1px solid rgba(200,144,42,0.3)',
            borderRadius: 8,
            color: 'var(--color-gold)',
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: 'var(--font-gothic)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          New Map
        </button>
        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.72rem' }}>
          Seed: {seed}
        </span>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
        fontSize: '0.72rem',
      }}>
        {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
          <span key={type} style={{ color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{cfg.emoji}</span> {cfg.label}
          </span>
        ))}
      </div>

      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          background: 'rgba(26,14,5,0.6)',
          borderRadius: 16,
          border: '1px solid rgba(200,144,42,0.1)',
        }}
      >
        {/* Connections */}
        {nodes.map(node =>
          node.connections.map(targetId => {
            const target = nodeMap.get(targetId)
            if (!target) return null
            const isActive = currentNode === node.id || (visitedNodes.has(node.id) && visitedNodes.has(targetId))
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={isActive ? 'rgba(200,144,42,0.5)' : 'rgba(200,144,42,0.15)'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '4 4'}
              />
            )
          })
        )}

        {/* Nodes */}
        {nodes.map(node => {
          const cfg = NODE_CONFIG[node.type]
          const isVisited = visitedNodes.has(node.id)
          const isCurrent = currentNode === node.id
          const isReachable = reachable.has(node.id)
          const isSelected = selectedNode === node.id

          return (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{ cursor: isReachable ? 'pointer' : 'default' }}
            >
              {/* Glow for reachable */}
              {isReachable && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={28}
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth={1.5}
                  opacity={0.4}
                >
                  <animate
                    attributeName="r"
                    values="26;30;26"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0.15;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={22}
                fill={isCurrent ? cfg.color : isVisited ? 'rgba(42,26,10,0.9)' : 'rgba(26,14,5,0.95)'}
                stroke={isSelected ? '#fff' : isReachable ? cfg.color : isVisited ? 'rgba(200,144,42,0.3)' : 'rgba(200,144,42,0.12)'}
                strokeWidth={isCurrent ? 2.5 : isReachable ? 2 : 1}
                opacity={isVisited && !isCurrent ? 0.5 : 1}
              />

              {/* Emoji */}
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isCurrent ? 18 : 16}
                opacity={isVisited && !isCurrent ? 0.4 : 1}
                style={{ pointerEvents: 'none' }}
              >
                {cfg.emoji}
              </text>

              {/* Label below */}
              <text
                x={node.x}
                y={node.y + 34}
                textAnchor="middle"
                fontSize={9}
                fill={cfg.color}
                opacity={isReachable || isCurrent ? 0.8 : 0.3}
                style={{ pointerEvents: 'none' }}
              >
                {cfg.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
