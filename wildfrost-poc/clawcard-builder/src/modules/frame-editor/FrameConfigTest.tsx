import { useState } from 'react'
import { FRAME_CONFIGS } from '../../utils/frameConfig'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import type { AnyCard } from '../../types/card.types'

// =============================================================================
// FrameConfigTest.tsx — Strona testowa e2e dla pipeline Frame Editor → Card Editor
// =============================================================================
//
// CO TESTUJE:
//   1. Czy /frames/*.png ładują się poprawnie (HTTP 200)
//   2. Czy FRAME_CONFIGS ma wpisy dla wszystkich typów
//   3. Czy CardFrame renderuje kartę z poprawną ramką dla każdego typu
//   4. Czy POST /api/save-frame-config odpowiada (Vite plugin aktywny)
//
// JAK UŻYĆ:
//   Otwórz Card Editor → pojawi się zakładka "🧪 Test" na dole StartPage
//   Lub wejdź bezpośrednio przez nawigację w App.tsx
// =============================================================================

interface TestResult {
  name: string
  status: 'pending' | 'ok' | 'fail' | 'warn'
  detail: string
}

const TEST_FRAMES = Object.entries(FRAME_CONFIGS)
  .filter(([, cfg]) => cfg.frameFile !== null)
  .map(([type, cfg]) => ({ type, path: cfg.frameFile! }))
  // Deduplikuj ścieżki
  .filter((item, idx, arr) => arr.findIndex(x => x.path === item.path) === idx)

export function FrameConfigTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  async function runTests() {
    setRunning(true)
    const r: TestResult[] = []

    // ── Test 1: Vite plugin endpoint ─────────────────────────────────────
    try {
      const res = await fetch('/api/save-frame-config', {
        method: 'OPTIONS',
      })
      r.push({
        name: 'Vite plugin /api/save-frame-config',
        status: res.status === 204 || res.ok ? 'ok' : 'warn',
        detail: `HTTP ${res.status} — ${res.status === 204 ? 'endpoint aktywny' : 'nieoczekiwany status'}`,
      })
    } catch {
      r.push({ name: 'Vite plugin /api/save-frame-config', status: 'fail', detail: 'Brak połączenia — restart dev server może być potrzebny' })
    }

    // ── Test 2: Każdy PNG ramki ──────────────────────────────────────────
    for (const { type, path } of TEST_FRAMES) {
      try {
        const res = await fetch(path)
        const contentType = res.headers.get('content-type') ?? ''
        const isImage = contentType.startsWith('image/')
        r.push({
          name: `PNG: ${path} (typ: ${type})`,
          status: res.ok && isImage ? 'ok' : res.ok ? 'warn' : 'fail',
          detail: `HTTP ${res.status} | ${contentType || 'brak content-type'}`,
        })
      } catch {
        r.push({ name: `PNG: ${path}`, status: 'fail', detail: 'Fetch error — plik nie istnieje?' })
      }
    }

    // ── Test 3: FRAME_CONFIGS ma art+name+desc dla każdego typu ──────────
    for (const [type, cfg] of Object.entries(FRAME_CONFIGS)) {
      const missing = ['art','name','desc'].filter(f => !(cfg as Record<string,unknown>)[f])
      r.push({
        name: `FRAME_CONFIGS['${type}'] — wymagane pola`,
        status: missing.length === 0 ? 'ok' : 'fail',
        detail: missing.length === 0 ? `art ✓ name ✓ desc ✓ | frameFile: ${cfg.frameFile ?? 'null'}` : `Brakuje: ${missing.join(', ')}`,
      })
    }

    // ── Test 4: POST z przykładowym payloadem (dry run) ──────────────────
    try {
      const payload = {
        typeName: '__test_dry_run__',
        typeLabel: 'Test',
        frameFile: null,
        fields: { art: { left: 10, top: 10, width: 80, height: 40 }, name: { left: 10, top: 55, width: 80, height: 8 }, desc: { left: 10, top: 65, width: 80, height: 25 } },
        enabledFields: ['art', 'name', 'desc'],
        isNew: false, // false = tylko aktualizacja, nie dodaje do typów
      }
      const res = await fetch('/api/save-frame-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      r.push({
        name: 'POST /api/save-frame-config (dry run isNew:false)',
        status: data.ok ? 'ok' : 'fail',
        detail: data.message ?? data.error ?? JSON.stringify(data),
      })
    } catch (e) {
      r.push({ name: 'POST /api/save-frame-config (dry run)', status: 'fail', detail: String(e) })
    }

    setResults(r)
    setRunning(false)
  }

  const okCount   = results.filter(r => r.status === 'ok').length
  const failCount = results.filter(r => r.status === 'fail').length
  const warnCount = results.filter(r => r.status === 'warn').length

  // Przykładowe karty dla renderowania
  const sampleCards: AnyCard[] = [
    { id: 'test_companion', name: 'Test Companion', type: 'companion', tribe: 'none', imageUrl: null, imageFallback: '🦀', description: 'Test', createdAt: 0, hp: 5, attack: 2, counter: 3, abilities: [] },
    { id: 'test_boss',      name: 'Test Boss',      type: 'boss',      tribe: 'none', imageUrl: null, imageFallback: '👾', description: 'Boss test', createdAt: 0, hp: 20, attack: 5, counter: 3, abilities: [] },
    { id: 'test_item_atk',  name: 'Sword',          type: 'item_with_attack', tribe: 'none', imageUrl: null, imageFallback: '⚔️', description: '5 dmg', createdAt: 0, effect: { damage: 5 }, target: 'enemy', consume: false },
    { id: 'test_item_no',   name: 'Healberry',      type: 'item_without_attack', tribe: 'none', imageUrl: null, imageFallback: '🍓', description: '+3 HP', createdAt: 0, effect: { heal: 3 }, target: 'ally', consume: false },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: '#fbbf24', marginBottom: 4 }}>🧪 Frame Config — Test E2E</h2>
      <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: 20 }}>
        Weryfikuje pipeline: Frame Editor → POST /api → frameConfig.ts → Card Editor render
      </p>

      <button
        onClick={runTests}
        disabled={running}
        style={{
          padding: '10px 20px', borderRadius: 10,
          border: '1px solid rgba(134,239,172,0.4)',
          background: 'rgba(5,40,20,0.7)', color: '#86efac',
          fontSize: '0.9rem', fontWeight: 700, cursor: running ? 'wait' : 'pointer',
          marginBottom: 20,
        }}
      >
        {running ? '⏳ Testowanie...' : '▶ Uruchom testy'}
      </button>

      {/* Wyniki */}
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

      {/* Render test — pokazuje karty z ramkami */}
      <h3 style={{ color: '#d8b180', marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Render test — karty z ramkami
      </h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {sampleCards.map(card => (
          <div key={card.id} style={{ textAlign: 'center' }}>
            <CardFrame card={card} width={140} height={206} inspectable={false} />
            <div style={{ color: '#6b7280', fontSize: '0.65rem', marginTop: 6 }}>{card.type}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
