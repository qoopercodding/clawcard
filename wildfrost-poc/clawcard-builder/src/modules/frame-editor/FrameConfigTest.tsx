import { useState } from 'react'
import { FRAME_CONFIGS } from '../../utils/frameConfig'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { useCardStore } from '../../store/cardStore'
import type { AnyCard } from '../../types/card.types'

interface TestResult {
  name: string
  status: 'ok' | 'fail' | 'warn'
  detail: string
}

const TEST_FRAMES = Object.entries(FRAME_CONFIGS)
  .filter(([, cfg]) => cfg.frameFile !== null)
  .map(([type, cfg]) => ({ type, path: cfg.frameFile! }))
  .filter((item, idx, arr) => arr.findIndex(x => x.path === item.path) === idx)

const PENDING_KEY    = 'pending_card_type'
const USER_CARDS_KEY = 'user_cards'

export function FrameConfigTest() {
  const { allCards, userCards } = useCardStore()
  const [results, setResults]   = useState<TestResult[]>([])
  const [running, setRunning]   = useState(false)

  async function runTests(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setRunning(true)
    const r: TestResult[] = []

    // ── Test 1: Vite plugin OPTIONS ──────────────────────────────────────
    try {
      const res = await fetch('/api/save-frame-config', { method: 'OPTIONS' })
      r.push({ name: 'Vite plugin /api/save-frame-config', status: res.status === 204 ? 'ok' : 'warn', detail: `HTTP ${res.status}` })
    } catch {
      r.push({ name: 'Vite plugin', status: 'fail', detail: 'Brak połączenia — restart dev server' })
    }

    // ── Test 2: PNG ramki ────────────────────────────────────────────────
    for (const { type, path } of TEST_FRAMES) {
      try {
        const res = await fetch(path)
        const ct = res.headers.get('content-type') ?? ''
        r.push({
          name: `PNG: ${path} (typ: ${type})`,
          status: res.ok && ct.startsWith('image/') ? 'ok' : res.ok ? 'warn' : 'fail',
          detail: `HTTP ${res.status} | ${ct || 'brak content-type'}`,
        })
      } catch {
        r.push({ name: `PNG: ${path}`, status: 'fail', detail: 'Fetch error' })
      }
    }

    // ── Test 3: FRAME_CONFIGS pola ───────────────────────────────────────
    for (const [type, cfg] of Object.entries(FRAME_CONFIGS)) {
      const missing = ['art','name','desc'].filter(f => !(cfg as Record<string,unknown>)[f])
      r.push({
        name: `FRAME_CONFIGS['${type}']`,
        status: missing.length === 0 ? 'ok' : 'fail',
        detail: missing.length === 0
          ? `art ✓ name ✓ desc ✓ | frameFile: ${cfg.frameFile ?? 'null'}`
          : `Brakuje: ${missing.join(', ')}`,
      })
    }

    // ── Test 4: POST dry run ─────────────────────────────────────────────
    try {
      const payload = {
        typeName: '__e2e_test__', typeLabel: 'E2E Test', frameFile: null,
        pngFileName: null, pngBase64: null,
        fields: {
          art:  { left:10, top:10, width:80, height:40 },
          name: { left:10, top:55, width:80, height:8 },
          desc: { left:10, top:65, width:80, height:25 },
        },
        enabledFields: ['art','name','desc'],
        isNew: false,
      }
      const res = await fetch('/api/save-frame-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        r.push({ name: 'POST /api dry run', status: 'fail', detail: `HTTP ${res.status}` })
      } else {
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          r.push({ name: 'POST /api dry run', status: data.ok ? 'ok' : 'fail', detail: data.message ?? data.error ?? text.slice(0,80) })
        } catch {
          r.push({ name: 'POST /api dry run', status: 'fail', detail: `Niepoprawny JSON: ${text.slice(0,80)}` })
        }
      }
    } catch (e) {
      r.push({ name: 'POST /api dry run', status: 'fail', detail: String(e) })
    }

    // ── Test 5: Store — pending_card_type (localStorage sync) ────────────
    try {
      const testPending = { typeName: '__e2e_pending__', frameFile: null, fields: {} }
      localStorage.setItem(PENDING_KEY, JSON.stringify(testPending))
      const readBack = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null')
      localStorage.removeItem(PENDING_KEY)
      const stillThere = localStorage.getItem(PENDING_KEY)
      r.push({
        name: 'Store: pending_card_type handoff',
        status: readBack?.typeName === '__e2e_pending__' && !stillThere ? 'ok' : 'fail',
        detail: readBack
          ? `Zapisano: '${readBack.typeName}' | Usunięto: ${!stillThere}`
          : 'Zapis localStorage nie powiódł się',
      })
    } catch (e) {
      r.push({ name: 'Store: handoff', status: 'fail', detail: String(e) })
    }

    // ── Test 6: Store — user_cards (localStorage sync) ───────────────────
    try {
      const existing = JSON.parse(localStorage.getItem(USER_CARDS_KEY) || '{}')
      const testCard: AnyCard = {
        id: '__e2e_card__', name: 'E2E Test Card', type: 'companion', tribe: 'none',
        imageUrl: null, imageFallback: '🧪', description: 'E2E test',
        createdAt: Date.now(), hp: 1, attack: 1, counter: 1, abilities: [],
      }
      localStorage.setItem(USER_CARDS_KEY, JSON.stringify({ ...existing, [testCard.id]: testCard }))
      const readBack = JSON.parse(localStorage.getItem(USER_CARDS_KEY) || '{}')
      const found = !!readBack['__e2e_card__']
      const cleaned = { ...readBack }; delete cleaned['__e2e_card__']
      localStorage.setItem(USER_CARDS_KEY, JSON.stringify(cleaned))
      r.push({
        name: 'Store: user_cards → localStorage',
        status: found ? 'ok' : 'fail',
        detail: found ? 'Karta zapisana i odczytana z localStorage ✓' : 'Karta nie znaleziona',
      })
    } catch (e) {
      r.push({ name: 'Store: user_cards', status: 'fail', detail: String(e) })
    }

    // ── Test 7: allCards count ───────────────────────────────────────────
    r.push({
      name: 'Store: allCards count',
      status: allCards.length >= 14 ? 'ok' : 'warn',
      detail: `${allCards.length} łącznie (${Object.values(userCards).length} użytkownika + ${allCards.length - Object.values(userCards).length} sample)`,
    })

    setResults(r)
    setRunning(false)
  }

  const okCount   = results.filter(r => r.status === 'ok').length
  const failCount = results.filter(r => r.status === 'fail').length
  const warnCount = results.filter(r => r.status === 'warn').length

  const renderTestCards: AnyCard[] = [
    { id: 't_companion', name: 'Companion', type: 'companion', tribe: 'none', imageUrl: null, imageFallback: '🧝', description: 'Test', createdAt: 0, hp: 5, attack: 2, counter: 3, abilities: [] },
    { id: 't_boss',      name: 'Boss',      type: 'boss',      tribe: 'none', imageUrl: null, imageFallback: '👾', description: 'Test', createdAt: 0, hp: 20, attack: 5, counter: 3, abilities: [] },
    { id: 't_item_atk',  name: 'Item+ATK',  type: 'item_with_attack',    tribe: 'none', imageUrl: null, imageFallback: '⚔️', description: '5 dmg', createdAt: 0, effect: { damage: 5 }, target: 'enemy', consume: false },
    { id: 't_item_no',   name: 'Item noATK',type: 'item_without_attack', tribe: 'none', imageUrl: null, imageFallback: '🍓', description: '+3 HP', createdAt: 0, effect: { heal: 3 },   target: 'ally',  consume: false },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto', overflowY: 'auto', height: 'calc(100vh - 76px)' }}>
      <h2 style={{ color: '#fbbf24', marginBottom: 4 }}>🧪 Frame Config — Test E2E</h2>
      <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: 20 }}>
        Pipeline: Frame Editor → POST /api → frameConfig.ts → store → Card Editor → Galeria
      </p>

      {/* type="button" zapobiega submit/nawigacji */}
      <button
        type="button"
        onClick={runTests}
        disabled={running}
        style={{
          padding: '10px 20px', borderRadius: 10,
          border: '1px solid rgba(134,239,172,0.4)',
          background: 'rgba(5,40,20,0.7)', color: '#86efac',
          fontSize: '0.9rem', fontWeight: 700,
          cursor: running ? 'wait' : 'pointer', marginBottom: 20,
        }}
      >
        {running ? '⏳ Testowanie...' : '▶ Uruchom testy'}
      </button>

      {results.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontSize: '0.85rem' }}>
            <span style={{ color: '#86efac' }}>✓ {okCount} OK</span>
            {warnCount > 0 && <span style={{ color: '#fbbf24', marginLeft: 12 }}>⚠ {warnCount} WARN</span>}
            {failCount > 0 && <span style={{ color: '#f87171', marginLeft: 12 }}>✗ {failCount} FAIL</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: 8,
                background: r.status === 'ok' ? 'rgba(5,30,15,0.6)' : r.status === 'fail' ? 'rgba(40,5,5,0.6)' : 'rgba(40,30,3,0.6)',
                border: `1px solid ${r.status === 'ok' ? 'rgba(134,239,172,0.25)' : r.status === 'fail' ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)'}`,
                fontSize: '0.78rem',
              }}>
                <span style={{ color: r.status === 'ok' ? '#86efac' : r.status === 'fail' ? '#f87171' : '#fbbf24', marginRight: 8 }}>
                  {r.status === 'ok' ? '✓' : r.status === 'fail' ? '✗' : '⚠'}
                </span>
                <strong style={{ color: '#e2e8f0' }}>{r.name}</strong>
                <span style={{ color: '#6b7280', marginLeft: 8 }}>{r.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ color: '#d8b180', marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Render test — karty z ramkami
      </h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {renderTestCards.map(card => (
          <div key={card.id} style={{ textAlign: 'center' }}>
            <CardFrame card={card} width={130} height={191} inspectable={false} />
            <div style={{ color: '#6b7280', fontSize: '0.62rem', marginTop: 6 }}>{card.type}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: '#d8b180', marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Store — user_cards ({Object.values(userCards).length})
      </h3>
      {Object.values(userCards).length === 0 ? (
        <p style={{ color: '#4b5563', fontSize: '0.82rem' }}>
          Brak kart użytkownika. Utwórz kartę w Card Editorze i kliknij "🃏 Dodaj do galerii".
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.values(userCards).map(card => (
            <div key={card.id} style={{ textAlign: 'center' }}>
              <CardFrame card={card} width={110} height={162} inspectable={false} />
              <div style={{ color: '#a78bfa', fontSize: '0.62rem', marginTop: 4 }}>{card.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
