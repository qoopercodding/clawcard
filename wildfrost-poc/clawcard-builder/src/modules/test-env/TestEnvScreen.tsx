// @ts-nocheck — plik symulacji, celowo używamy any dla elastyczności kart
import { useState, useCallback } from 'react'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { useCardStore } from '../../store/cardStore'
import type { AnyCard } from '../../types/card.types'
import './TestEnvScreen.css'

type RunResult = {
  runId: number
  outcome: 'WIN' | 'LOSE'
  turns: number
  log: string[]
  cardsUsed: Record<string, number>
  finalHp: number
}

function simulateRun(hand: AnyCard[], seed: number): RunResult {
  const log: string[] = []
  const cardsUsed: Record<string, number> = {}
  let playerHp = 30
  let turn = 0
  const maxTurns = 20

  const enemies = [
    { name: 'Snoof',  hp: 3,  atk: 3, counter: 3 },
    { name: 'Wallop', hp: 9,  atk: 4, counter: 4 },
    { name: 'Foxee',  hp: 4,  atk: 1, counter: 3 },
    { name: 'Tusk',   hp: 5,  atk: 2, counter: 5 },
    { name: 'Dregg',  hp: 20, atk: 5, counter: 3 },
  ]

  let enemyIdx = 0
  let currentEnemy = { ...enemies[0] }
  log.push(`RUN START | HP: ${playerHp} | Wróg: ${currentEnemy.name} (HP:${currentEnemy.hp})`)

  const companions = hand.filter(c =>
    c.type === 'companion' || c.type === 'boss' || c.type === 'transformer'
  )

  const playerUnits = companions.map(c => ({
    name: c.name,
    hp: c.hp || 5,
    maxHp: c.hp || 5,
    attack: c.attack || 2,
    counter: c.counter || 3,
    counterCurrent: c.counter || 3,
    id: c.id,
    transformed: false,
    transformThreshold: c.transformThreshold || 0,
    transformedAttack: c.transformedAttack || 0,
  }))

  const items = hand.filter(c =>
    c.type === 'item_with_attack' || c.type === 'item_without_attack'
  )

  while (turn < maxTurns && playerHp > 0 && enemyIdx < enemies.length) {
    turn++
    log.push(`\n--- Tura ${turn} | HP gracza: ${playerHp} | ${currentEnemy.name} HP: ${currentEnemy.hp} ---`)

    if (turn % 2 === 0 && items.length > 0) {
      const item = items[(turn / 2 - 1) % items.length]
      const dmg = item.effect?.damage || 0
      const heal = item.effect?.heal || 0
      const overburn = item.effect?.overburn || 0

      if (dmg > 0) {
        const actualDmg = dmg + (overburn * Math.floor(turn / 2))
        currentEnemy.hp -= actualDmg
        log.push(`  🃏 ${item.name}: ${actualDmg} dmg → ${currentEnemy.name} (HP: ${currentEnemy.hp})`)
        cardsUsed[item.id] = (cardsUsed[item.id] || 0) + 1
      }
      if (heal > 0) {
        playerHp = Math.min(30, playerHp + heal)
        log.push(`  🃏 ${item.name}: +${heal} HP gracza (HP: ${playerHp})`)
        cardsUsed[item.id] = (cardsUsed[item.id] || 0) + 1
      }
    }

    for (const unit of playerUnits) {
      if (unit.hp <= 0) continue
      unit.counterCurrent--

      if (unit.transformThreshold > 0 && !unit.transformed && unit.hp / unit.maxHp < unit.transformThreshold) {
        unit.transformed = true
        unit.attack = unit.transformedAttack
        unit.counterCurrent = 1
        log.push(`  ⚡ ${unit.name} TRANSFORM! ATK → ${unit.attack}, Counter reset!`)
      }

      if (unit.counterCurrent <= 0) {
        unit.counterCurrent = unit.counter
        currentEnemy.hp -= unit.attack
        log.push(`  ⚔ ${unit.name} atakuje: ${unit.attack} dmg → ${currentEnemy.name} (HP: ${currentEnemy.hp})`)
        cardsUsed[unit.id] = (cardsUsed[unit.id] || 0) + 1
      }
    }

    if (currentEnemy.hp <= 0) {
      log.push(`  ✅ ${currentEnemy.name} pokonany!`)
      enemyIdx++
      if (enemyIdx >= enemies.length) {
        log.push(`\n🏆 WYGRANA po ${turn} turach!`)
        return { runId: seed, outcome: 'WIN', turns: turn, log, cardsUsed, finalHp: playerHp }
      }
      currentEnemy = { ...enemies[enemyIdx] }
      log.push(`  Nowy wróg: ${currentEnemy.name} (HP: ${currentEnemy.hp})`)
      continue
    }

    currentEnemy.counter--
    if (currentEnemy.counter <= 0) {
      currentEnemy.counter = enemies[enemyIdx].counter
      const aliveUnits = playerUnits.filter(u => u.hp > 0)
      if (aliveUnits.length > 0) {
        const target = aliveUnits[turn % aliveUnits.length]
        target.hp -= currentEnemy.atk
        log.push(`  👹 ${currentEnemy.name} atakuje ${target.name}: ${currentEnemy.atk} dmg (HP: ${target.hp})`)
        if (target.hp <= 0) log.push(`  💀 ${target.name} pada!`)
      } else {
        playerHp -= currentEnemy.atk
        log.push(`  👹 ${currentEnemy.name} atakuje gracza: ${currentEnemy.atk} (HP gracza: ${playerHp})`)
      }
    }
  }

  if (playerHp <= 0) {
    log.push(`\n💀 PRZEGRANA w turze ${turn}`)
    return { runId: seed, outcome: 'LOSE', turns: turn, log, cardsUsed, finalHp: 0 }
  }

  log.push(`\n⏱ TIMEOUT po ${maxTurns} turach`)
  return { runId: seed, outcome: 'LOSE', turns: maxTurns, log, cardsUsed, finalHp: playerHp }
}

export function TestEnvScreen() {
  const { allCards } = useCardStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<RunResult[]>([])
  const [running, setRunning] = useState(false)
  const [activeLog, setActiveLog] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const allAvailable = allCards
  const types = ['all', ...Array.from(new Set(allAvailable.map(c => c.type))).sort()]
  const filtered = filterType === 'all' ? allAvailable : allAvailable.filter(c => c.type === filterType)

  const toggleCard = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const selectedCards = allAvailable.filter(c => selected.has(c.id))

  function runTests() {
    if (selectedCards.length === 0) return
    setRunning(true)
    setResults([])
    setTimeout(() => {
      setResults([simulateRun(selectedCards, 1), simulateRun(selectedCards, 2)])
      setRunning(false)
    }, 100)
  }

  function clearSelection() {
    setSelected(new Set())
    setResults([])
    setActiveLog(null)
  }

  return (
    <div className="test-env">
      <aside className="test-env__sidebar">
        <div className="test-env__header">
          <h3>🧪 Test Environment</h3>
          <p className="test-env__subtitle">Wybierz karty → uruchom 2 runy → sprawdź wyniki</p>
        </div>

        <div className="test-env__filters">
          {types.map(t => (
            <button key={t} type="button"
              className={`test-env__filter ${filterType === t ? 'test-env__filter--active' : ''}`}
              onClick={() => setFilterType(t)}>
              {t === 'all' ? '🃏 Wszystkie' : t}
            </button>
          ))}
        </div>

        <div className="test-env__cards">
          {filtered.map(card => (
            <div key={card.id}
              className={`test-env__card-slot ${selected.has(card.id) ? 'test-env__card-slot--selected' : ''}`}
              onClick={() => toggleCard(card.id)}>
              <CardFrame card={card} width={100} height={147} inspectable={false} />
              {selected.has(card.id) && <div className="test-env__check">✓</div>}
            </div>
          ))}
        </div>

        <div className="test-env__actions">
          <div className="test-env__selected-count">
            {selected.size} kart wybranych
            {selectedCards.some(c => c.id === 'bongo_prime' || c.id === 'bongo_cannon') && (
              <span className="test-env__bongo-badge">⚡ Bongo w decku!</span>
            )}
          </div>
          <button type="button" className="test-env__run-btn" onClick={runTests}
            disabled={selected.size === 0 || running}>
            {running ? '⏳ Symulacja...' : '▶ Uruchom 2 runy'}
          </button>
          <button type="button" className="test-env__clear-btn" onClick={clearSelection}>✕ Wyczyść</button>
        </div>
      </aside>

      <main className="test-env__results">
        {results.length === 0 ? (
          <div className="test-env__empty">
            <div className="test-env__empty-icon">🎮</div>
            <div className="test-env__empty-title">Wybierz karty i uruchom testy</div>
            <div className="test-env__empty-hint">Spróbuj Bongo Prime + Bongo Cannon żeby zobaczyć nowe mechaniki</div>
          </div>
        ) : (
          <>
            <div className="test-env__summary">
              <h3>Wyniki — {results.filter(r => r.outcome === 'WIN').length}/2 wygranych</h3>
              <div className="test-env__run-cards">
                {results.map(r => (
                  <div key={r.runId}
                    className={`test-env__run-card ${r.outcome === 'WIN' ? 'test-env__run-card--win' : 'test-env__run-card--lose'} ${activeLog === r.runId ? 'test-env__run-card--active' : ''}`}
                    onClick={() => setActiveLog(activeLog === r.runId ? null : r.runId)}>
                    <div className="test-env__run-outcome">{r.outcome === 'WIN' ? '🏆 WYGRANA' : '💀 PRZEGRANA'}</div>
                    <div className="test-env__run-stats">
                      <span>⏱ {r.turns} tur</span>
                      <span>❤ {r.finalHp} HP</span>
                    </div>
                    <div className="test-env__run-cards-used">
                      {Object.entries(r.cardsUsed).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, count]) => {
                        const card = allAvailable.find(c => c.id === id)
                        return <span key={id} className="test-env__usage-badge">{card?.imageFallback || '🃏'} ×{count}</span>
                      })}
                    </div>
                    <div className="test-env__run-hint">{activeLog === r.runId ? '▲ ukryj log' : '▼ pokaż log'}</div>
                  </div>
                ))}
              </div>
            </div>

            {activeLog !== null && (
              <div className="test-env__log">
                <div className="test-env__log-title">📋 Log Runu {activeLog}</div>
                <pre className="test-env__log-content">{results.find(r => r.runId === activeLog)?.log.join('\n')}</pre>
              </div>
            )}

            <div className="test-env__balance">
              <div className="test-env__balance-title">⚖ Balance Review</div>
              {(() => {
                const totals: Record<string, number> = {}
                for (const r of results) for (const [id, count] of Object.entries(r.cardsUsed)) totals[id] = (totals[id] || 0) + count
                const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
                const wins = results.filter(r => r.outcome === 'WIN').length
                const avgTurns = results.reduce((s, r) => s + r.turns, 0) / results.length
                const hasTransform = results.some(r => r.log.some(l => l.includes('TRANSFORM')))
                return (
                  <div className="test-env__balance-content">
                    <div className="test-env__balance-row">
                      <span className={wins === 2 ? 'test-env__ok' : wins === 1 ? 'test-env__warn' : 'test-env__fail'}>
                        {wins === 2 ? '✅' : wins === 1 ? '⚠️' : '🔴'} Win rate: {wins}/2
                      </span>
                      <span className={avgTurns <= 12 ? 'test-env__ok' : 'test-env__warn'}>
                        {avgTurns <= 12 ? '✅' : '⚠️'} Śr. {avgTurns.toFixed(1)} tur (cel ≤12)
                      </span>
                    </div>
                    {sorted.map(([id, count]) => {
                      const card = allAvailable.find(c => c.id === id)
                      return (
                        <div key={id} className="test-env__balance-row">
                          <span>{card?.imageFallback} {card?.name}</span>
                          <span className={id.startsWith('bongo') ? 'test-env__bongo' : ''}>
                            {count}× {id.startsWith('bongo') ? '⚡' : ''}
                          </span>
                        </div>
                      )
                    })}
                    {hasTransform && (
                      <div className="test-env__transform-note">⚡ Bongo Prime Transform triggered!</div>
                    )}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
