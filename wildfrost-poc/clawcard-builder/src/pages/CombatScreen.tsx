import { useState, useEffect, useCallback } from 'react'

interface CombatUnit {
  name: string
  emoji: string
  hp: number
  maxHp: number
  attack: number
  block: number
}

interface CombatLog {
  id: number
  text: string
  type: 'player' | 'enemy' | 'system'
}

interface EnemyTemplate {
  name: string
  emoji: string
  hp: number
  attack: number
}

const ENEMIES: Record<string, EnemyTemplate[]> = {
  combat: [
    { name: 'Goblin', emoji: '👺', hp: 18, attack: 5 },
    { name: 'Skeleton', emoji: '💀', hp: 22, attack: 4 },
    { name: 'Slime', emoji: '🟢', hp: 28, attack: 3 },
    { name: 'Bat Swarm', emoji: '🦇', hp: 15, attack: 6 },
  ],
  elite: [
    { name: 'Dark Knight', emoji: '⚔️', hp: 40, attack: 8 },
    { name: 'Necromancer', emoji: '🧙', hp: 35, attack: 7 },
    { name: 'Stone Golem', emoji: '🗿', hp: 55, attack: 6 },
  ],
  boss: [
    { name: 'Dragon Lord', emoji: '🐉', hp: 80, attack: 10 },
    { name: 'Lich King', emoji: '👑', hp: 70, attack: 12 },
  ],
}

function pickEnemy(tier: string, seed: number): EnemyTemplate {
  const pool = ENEMIES[tier] || ENEMIES.combat
  return pool[seed % pool.length]
}

interface CombatScreenProps {
  tier?: 'combat' | 'elite' | 'boss'
  playerHp?: number
  playerMaxHp?: number
  deckSize?: number
  seed?: number
  onVictory?: (damageDealt: number, damageTaken: number) => void
  onDefeat?: () => void
}

export default function CombatScreen({
  tier = 'combat',
  playerHp = 30,
  playerMaxHp = 30,
  deckSize = 8,
  seed,
  onVictory,
  onDefeat,
}: CombatScreenProps) {
  const [player, setPlayer] = useState<CombatUnit>({
    name: 'Hero', emoji: '🦸', hp: playerHp, maxHp: playerMaxHp, attack: 6, block: 0,
  })
  const [enemy, setEnemy] = useState<CombatUnit>(() => {
    const t = pickEnemy(tier, seed ?? Date.now())
    return { ...t, maxHp: t.hp, block: 0 }
  })
  const [log, setLog] = useState<CombatLog[]>([
    { id: 0, text: `A ${enemy.name} appears!`, type: 'system' },
  ])
  const [turn, setTurn] = useState(1)
  const [phase, setPhase] = useState<'player' | 'enemy' | 'done'>('player')
  const [totalDmgDealt, setTotalDmgDealt] = useState(0)
  const [totalDmgTaken, setTotalDmgTaken] = useState(0)
  const addLog = useCallback((text: string, type: CombatLog['type']) => {
    setLog(l => [...l.slice(-12), { id: Date.now() + Math.random(), text, type }])
  }, [])

  // Simulate drawing cards — attack value scales with deck
  const playerDmg = Math.max(3, Math.floor(6 + (deckSize - 8) * 0.5 + Math.random() * 4))
  const playerBlock = Math.floor(3 + Math.random() * 4)

  function handleAttack() {
    if (phase !== 'player') return
    const dmg = Math.max(0, playerDmg - enemy.block)
    setEnemy(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg), block: 0 }))
    setTotalDmgDealt(prev => prev + dmg)
    addLog(`Hero strikes for ${dmg} damage!`, 'player')
    setPhase('enemy')
  }

  function handleDefend() {
    if (phase !== 'player') return
    setPlayer(prev => ({ ...prev, block: prev.block + playerBlock }))
    addLog(`Hero gains ${playerBlock} block.`, 'player')
    setPhase('enemy')
  }

  // Enemy turn
  useEffect(() => {
    if (phase !== 'enemy') return
    const timer = setTimeout(() => {
      const dmg = Math.max(0, enemy.attack - player.block)
      setPlayer(prev => ({
        ...prev,
        hp: Math.max(0, prev.hp - dmg),
        block: Math.max(0, prev.block - enemy.attack),
      }))
      setTotalDmgTaken(prev => prev + dmg)
      addLog(`${enemy.name} attacks for ${dmg} damage!`, 'enemy')
      setTurn(t => t + 1)
      setPhase('player')
    }, 800)
    return () => clearTimeout(timer)
  }, [phase, enemy.attack, enemy.name, player.block, addLog])

  // Check win/loss
  useEffect(() => {
    if (enemy.hp <= 0 && phase !== 'done') {
      setPhase('done')
      addLog(`${enemy.name} is defeated!`, 'system')
    } else if (player.hp <= 0 && phase !== 'done') {
      setPhase('done')
      addLog('Hero has fallen...', 'system')
    }
  }, [enemy.hp, player.hp, enemy.name, phase, addLog])

  const won = phase === 'done' && enemy.hp <= 0
  const lost = phase === 'done' && player.hp <= 0

  const tierColors = { combat: 'var(--color-gold)', elite: '#e05555', boss: '#ff4444' }
  const tierLabels = { combat: 'Combat', elite: 'Elite Fight', boss: 'BOSS' }

  function hpBar(current: number, max: number, color: string) {
    return (
      <div style={{
        width: '100%', height: 8, background: 'rgba(255,255,255,0.06)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          width: `${(current / max) * 100}%`, height: '100%',
          background: color, borderRadius: 4,
          transition: 'width 300ms ease',
        }} />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 24, padding: '32px 24px', minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.7rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: tierColors[tier], margin: '0 0 4px',
        }}>{tierLabels[tier]}</p>
        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>Turn {turn}</span>
      </div>

      {/* Battlefield */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 60px 1fr',
        gap: 16, alignItems: 'center', width: '100%', maxWidth: 600,
      }}>
        {/* Player */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 8, padding: 20, borderRadius: 14,
          border: '1px solid rgba(134,239,172,0.15)',
          background: 'rgba(42,26,10,0.7)',
        }}>
          <span style={{ fontSize: '2.5rem' }}>{player.emoji}</span>
          <strong style={{ fontFamily: 'var(--font-gothic)', fontSize: '0.9rem' }}>{player.name}</strong>
          {hpBar(player.hp, player.maxHp, '#86efac')}
          <span style={{ fontSize: '0.75rem', color: '#86efac' }}>HP {player.hp}/{player.maxHp}</span>
          {player.block > 0 && (
            <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Block {player.block}</span>
          )}
        </div>

        {/* VS */}
        <span style={{
          fontFamily: 'var(--font-gothic)', color: 'var(--color-gold)',
          fontSize: '1.2rem', textAlign: 'center',
        }}>VS</span>

        {/* Enemy */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 8, padding: 20, borderRadius: 14,
          border: `1px solid ${tierColors[tier]}33`,
          background: 'rgba(42,26,10,0.7)',
        }}>
          <span style={{ fontSize: '2.5rem' }}>{enemy.emoji}</span>
          <strong style={{
            fontFamily: 'var(--font-gothic)', fontSize: '0.9rem',
            color: tierColors[tier],
          }}>{enemy.name}</strong>
          {hpBar(enemy.hp, enemy.maxHp, '#e05555')}
          <span style={{ fontSize: '0.75rem', color: '#e05555' }}>HP {enemy.hp}/{enemy.maxHp}</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>ATK {enemy.attack}</span>
        </div>
      </div>

      {/* Actions */}
      {phase === 'player' && !won && !lost && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={handleAttack} style={{
            background: 'rgba(200,144,42,0.12)', border: '1px solid rgba(200,144,42,0.3)',
            borderRadius: 8, color: 'var(--color-gold)', padding: '10px 24px',
            cursor: 'pointer', fontFamily: 'var(--font-gothic)', fontSize: '0.8rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Attack ({playerDmg} dmg)
          </button>
          <button type="button" onClick={handleDefend} style={{
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: 8, color: '#38bdf8', padding: '10px 24px',
            cursor: 'pointer', fontFamily: 'var(--font-gothic)', fontSize: '0.8rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Defend (+{playerBlock})
          </button>
        </div>
      )}

      {phase === 'enemy' && (
        <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic', fontSize: '0.82rem' }}>
          {enemy.name} is attacking...
        </p>
      )}

      {/* Result */}
      {(won || lost) && (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-gothic)', fontSize: '1.2rem',
            color: won ? '#86efac' : '#e05555',
          }}>
            {won ? 'Victory!' : 'Defeat...'}
          </p>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>
            Dealt {totalDmgDealt} damage · Took {totalDmgTaken} damage
          </p>
          <button
            type="button"
            onClick={() => won ? onVictory?.(totalDmgDealt, totalDmgTaken) : onDefeat?.()}
            style={{
              marginTop: 12,
              background: won ? 'rgba(134,239,172,0.1)' : 'rgba(224,85,85,0.1)',
              border: `1px solid ${won ? 'rgba(134,239,172,0.3)' : 'rgba(224,85,85,0.3)'}`,
              borderRadius: 8, color: won ? '#86efac' : '#e05555',
              padding: '10px 28px', cursor: 'pointer',
              fontFamily: 'var(--font-gothic)', fontSize: '0.78rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            {won ? 'Collect Reward' : 'Accept Fate'}
          </button>
        </div>
      )}

      {/* Combat log */}
      <div style={{
        width: '100%', maxWidth: 500,
        padding: '12px 16px', borderRadius: 10,
        background: 'rgba(26,14,5,0.8)',
        border: '1px solid rgba(200,144,42,0.08)',
        maxHeight: 180, overflowY: 'auto',
      }}>
        {log.map(entry => (
          <p key={entry.id} style={{
            margin: '3px 0', fontSize: '0.72rem',
            color: entry.type === 'player' ? '#86efac' :
              entry.type === 'enemy' ? '#e05555' : 'var(--color-text-dim)',
          }}>
            {entry.text}
          </p>
        ))}
      </div>
    </div>
  )
}
