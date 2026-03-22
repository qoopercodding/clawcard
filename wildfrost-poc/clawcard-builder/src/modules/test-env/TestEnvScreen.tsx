import { useState, useCallback } from 'react'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { SAMPLE_CARDS } from '../../data/sampleCards'
import { useCardStore } from '../../store/cardStore'
import type { AnyCard } from '../../types/card.types'
import './TestEnvScreen.css'

// =============================================================================
// TestEnvScreen — Środowisko testowe
// Wybierz karty do ręki → uruchom symulację → zobacz raport
// =============================================================================

type RunResult = {
  runId: number
  outcome: 'WIN' | 'LOSE'
  turns: number
  log: string[]
  cardsUsed: Record<string, number>
  finalHp: number
}

// Prosta symulacja bitwy (deterministyczna)
function simulateRun(hand: AnyCard[], seed: number): RunResult {
  const log: string[] = []
  const cardsUsed: Record<string, number> = {}

  // Stan gracza
  let playerHp = 30
  let turn = 0
  const maxTurns = 20

  // Wrogowie — 5 z Battle Demo
  const enemies = [
    { name: 'Snoof',  hp: 3,  atk: 3, counter: 3, maxHp: 3  },
    { name: 'Wallop', hp: 9,  atk: 4, counter: 4, maxHp: 9  },
    { name: 'Foxee',  hp: 4,  atk: 1, counter: 3, maxHp: 4  },
    { name: 'Tusk',   hp: 5,  atk: 2, counter: 5, maxHp: 5  },
    { name: 'Dregg',  hp: 20, atk: 5, counter: 3, maxHp: 20 },
  ]

  let enemyIdx = 0
  let currentEnemy = { ...enemies[0] }
  log.push(`RUN START | HP: ${playerHp} | Wróg: ${currentEnemy.name} (HP:${currentEnemy.hp})`)

  // Companion karty — tworzą jednostki gracza
  const companions = hand.filter(c =>
    c.type === 'companion' || c.type === 'boss' || c.type === 'transformer'
  ) as Array<AnyCard & { hp: number; attack: number; counter: number }>

  const playerUnits = companions.map(c => ({
    name: c.name,
    hp: (c as any).hp || 5,
    attack: (c as any).attack || 2,
    counter: (c as any).counter || 3,
    counterCurrent: (c as any).counter || 3,
    id: c.id,
    // Transform mechanic dla Bongo Prime
    transformed: false,
    transformThreshold: (c as any).transformThreshold || 0,
    transformedAttack: (c as any).transformedAttack || 0,
  }))

  // Item karty — do użycia w turze
  const items = hand.filter(c =>
    c.type === 'item_with_attack' || c.type === 'item_without_attack'
  )

  // Oversimplified battle loop
  while (turn < maxTurns && playerHp > 0 && enemyIdx < enemies.length) {
    turn++
    log.push(`\n--- Tura ${turn} | HP gracza: ${playerHp} | ${currentEnemy.name} HP: ${currentEnemy.hp} ---`)

    // Użyj item jeśli jest (co 2 tury)
    if (turn % 2 === 0 && items.length > 0) {
      const item = items[(turn / 2 - 1) % items.length]
      const dmg = (item as any).effect?.damage || 0
      const heal = (item as any).effect?.heal || 0
      // Overheat mechanic dla Bongo Cannon
      const overburn = (item as any).effect?.overburn || 0

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

    // Jednostki gracza atakują (counter tick)
    for (const unit of playerUnits) {
      if (unit.hp <= 0) continue
      unit.counterCurrent--

      // Transform check dla Bongo Prime
      if (
        unit.transformThreshold > 0 &&
        !unit.transformed &&
        unit.hp / ((unit as any).maxHp || unit.hp) < unit.transformThreshold
      ) {
        unit.transformed = true
        unit.attack = unit.transformedAttack
        unit.counterCurrent = 1
        log.push(`  ⚡ ${unit.name} TRANSFORM! ATK → ${unit.attack}, Counter reset!`)
      }

      if (unit.counterCurrent <= 0) {
        unit.counterCurrent = (companions.find(c => c.id === unit.id) as any)?.counter || 3
        currentEnemy.hp -= unit.attack
        log.push(`  ⚔ ${unit.name} atakuje: ${unit.attack} dmg → ${currentEnemy.name} (HP: ${currentEnemy.hp})`)
        cardsUsed[unit.id] = (cardsUsed[unit.id] || 0) + 1
      }
    }

    // Sprawdź czy wróg poległ
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

    // Wróg atakuje
    currentEnemy.counter--
    if (currentEnemy.counter <= 0) {
      currentEnemy.counter = enemies[enemyIdx].counter
      // Atak rozdziela się między żywe jednostki
      const aliveUnits = playerUnits.filter(u => u.hp > 0)
      if (aliveUnits.length > 0) {
        const target = aliveUnits[turn % aliveUnits.length]
        target.hp -= currentEnemy.atk
        log.push(`  👹 ${currentEnemy.name} atakuje ${target.name}: ${currentEnemy.atk} dmg (HP: ${target.hp})`)
        if (target.hp <= 0) {
          log.push(`  💀 ${target.name} pada!`)
        }
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

  log.push(`\n⏱ TIMEOUT — run nie zakończony po ${maxTurns} turach`)
  return { runId: seed, outcome: 'LOSE', turns: maxTurns, log, cardsUsed, finalHp: playerHp }
}

export function TestEnvScreen() {
  const { allCards } = useCardStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<RunResult[]>([])
  const [running, setRunning] = useState(false)
  const [activeLog, setActiveLog] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Dostępne karty do wyboru — z store + sample
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
      const r1 = simulateRun(selectedCards, 1)
      const r2 = simulateRun(selectedCards, 2)
      setResults([r1, r2])
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
      {/* Panel lewy — wybór kart */}
      <aside className="test-env__sidebar">
        <div className="test-env__header">
          <h3>🧪 Test Environment</h3>
          <p className="test-env__subtitle">Wybierz karty → uruchom 2 runy → sprawdź wyniki</p>
        </div>

        {/* Filtry */}
        <div className="test-env__filters">
          {types.map(t => (
            <button
              key={t}
              type="button"
              className={`test-env__filter ${filterType === t ? 'test-env__filter--active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? '🃏 Wszystkie' : t}
            </button>
          ))}
        </div>

        {/* Siatka kart */}
        <div className="test-env__cards">
          {filtered.map(card => (
            <div
              key={card.id}
              className={`test-env__card-slot ${selected.has(card.id) ? 'test-env__card-slot--selected' : ''}`}
              onClick={() => toggleCard(card.id)}
            >
              <CardFrame card={card} width={100} height={147} inspectable={false} />
              {selected.has(card.id) && <div className="test-env__check">✓</div>}
            </div>
          ))}
        </div>

        {/* Akcje */}
        <div className="test-env__actions">
          <div className="test-env__selected-count">
            {selected.size} kart wybranych
            {selectedCards.some(c => c.id === 'bongo_prime' || c.id === 'bongo_cannon') && (
              <span className="test-env__bongo-badge">⚡ Bongo w decku!</span>
            )}
          </div>
          <button
            type="button"
            className="test-env__run-btn"
            onClick={runTests}
            disabled={selected.size === 0 || running}
          >
            {running ? '⏳ Symulacja...' : '▶ Uruchom 2 runy'}
          </button>
          <button type="button" className="test-env__clear-btn" onClick={clearSelection}>
            ✕ Wyczyść
          </button>
        </div>
      </aside>

      {/* Panel prawy — wyniki */}
      <main className="test-env__results">
        {results.length === 0 ? (
          <div className="test-env__empty">
            <div className="test-env__empty-icon">🎮</div>
            <div className="test-env__empty-title">Wybierz karty i uruchom testy</div>
            <div className="test-env__empty-hint">
              Spróbuj dodać Bongo Prime + Bongo Cannon żeby zobaczyć nowe mechaniki
            </div>
          </div>
        ) : (
          <>
            {/* Podsumowanie */}
            <div className="test-env__summary">
              <h3>Wyniki — {results.filter(r => r.outcome === 'WIN').length}/2 wygranych</h3>
              <div className="test-env__run-cards">
                {results.map(r => (
                  <div
                    key={r.runId}
                    className={`test-env__run-card ${r.outcome === 'WIN' ? 'test-env__run-card--win' : 'test-env__run-card--lose'} ${activeLog === r.runId ? 'test-env__run-card--active' : ''}`}
                    onClick={() => setActiveLog(activeLog === r.runId ? null : r.runId)}
                  >
                    <div className="test-env__run-outcome">
                      {r.outcome === 'WIN' ? '🏆 WYGRANA' : '💀 PRZEGRANA'}
                    </div>
                    <div className="test-env__run-stats">
                      <span>⏱ {r.turns} tur</span>
                      <span>❤ {r.finalHp} HP</span>
                    </div>
                    <div className="test-env__run-cards-used">
                      {Object.entries(r.cardsUsed)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([id, count]) => {
                          const card = allAvailable.find(c => c.id === id)
                          return (
                            <span key={id} className="test-env__usage-badge">
                              {card?.imageFallback || '🃏'} ×{count}
                            </span>
                          )
                        })}
                    </div>
                    <div className="test-env__run-hint">
                      {activeLog === r.runId ? '▲ ukryj log' : '▼ pokaż log'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log aktywnego runu */}
            {activeLog !== null && (
              <div className="test-env__log">
                <div className="test-env__log-title">📋 Log Runu {activeLog}</div>
                <pre className="test-env__log-content">
                  {results.find(r => r.runId === activeLog)?.log.join('\n')}
                </pre>
              </div>
            )}

            {/* Balance review */}
            <div className="test-env__balance">
              <div className="test-env__balance-title">⚖ Balance Review (balance-designer)</div>
              {(() => {
                const allUsed = results.flatMap(r => Object.entries(r.cardsUsed))
                const totals: Record<string, number> = {}
                for (const [id, count] of allUsed) totals[id] = (totals[id] || 0) + count
                const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
                const wins = results.filter(r => r.outcome === 'WIN').length
                const avgTurns = results.reduce((s, r) => s + r.turns, 0) / results.length

                return (
                  <div className="test-env__balance-content">
                    <div className="test-env__balance-row">
                      <span className={wins === 2 ? 'test-env__ok' : wins === 1 ? 'test-env__warn' : 'test-env__fail'}>
                        {wins === 2 ? '✅' : wins === 1 ? '⚠️' : '🔴'} Win rate: {wins}/2
                      </span>
                      <span className={avgTurns <= 12 ? 'test-env__ok' : 'test-env__warn'}>
                        {avgTurns <= 12 ? '✅' : '⚠️'} Śr. długość: {avgTurns.toFixed(1)} tur (cel: ≤12)
                      </span>
                    </div>
                    <div className="test-env__balance-title" style={{marginTop: 8}}>Użycie kart:</div>
                    {sorted.map(([id, count]) => {
                      const card = allAvailable.find(c => c.id === id)
                      const isBongo = id.startsWith('bongo')
                      return (
                        <div key={id} className="test-env__balance-row">
                          <span>{card?.imageFallback} {card?.name}</span>
                          <span className={isBongo ? 'test-env__bongo' : ''}>
                            {count}× użyto {isBongo ? '⚡' : ''}
                          </span>
                        </div>
                      )
                    })}
                    {results.some(r => r.log.some(l => l.includes('TRANSFORM'))) && (
                      <div className="test-env__transform-note">
                        ⚡ Bongo Prime Transform triggered! Mechanika działa.
                      </div>
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
