import { useState } from 'react'
import type { LLCard, LLWord, EnemyState } from './types'
import { CARDS, WORDS } from './data'
import { playCard, playTabu, endTurn, createInitialState } from './engine'
import type { LLBattleState } from './types'

// ─── STYLES ──────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight: '100%', background: '#1a1208', color: '#e8d5b0', fontFamily: 'Georgia, serif', padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 12 },
  title: { textAlign: 'center' as const, color: '#c8902a', fontSize: 18, letterSpacing: 3 },
  row: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  col: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  card: (sel: boolean) => ({ width: 100, minHeight: 130, background: sel ? '#3a2510' : '#241a0e', border: `2px solid ${sel ? '#d4a830' : '#5a3a1a'}`, borderRadius: 8, padding: 7, cursor: 'pointer', transform: sel ? 'translateY(-10px)' : 'none', transition: 'all .15s', display: 'flex', flexDirection: 'column' as const, gap: 3 }),
  word: (sel: boolean) => ({ width: 85, minHeight: 70, background: sel ? '#2a1e38' : '#1e1428', border: `2px solid ${sel ? '#d4a830' : '#4a2878'}`, borderRadius: 6, padding: 5, cursor: 'pointer', transform: sel ? 'translateY(-8px)' : 'none', transition: 'all .15s', display: 'flex', flexDirection: 'column' as const, gap: 2 }),
  enemy: (tgt: boolean) => ({ width: 130, background: tgt ? '#3a1010' : '#200c0c', border: `2px solid ${tgt ? '#c03030' : '#5a1a1a'}`, borderRadius: 8, padding: 10, cursor: 'pointer' }),
  btn: (primary: boolean, disabled?: boolean) => ({ padding: '7px 16px', background: disabled ? '#1a1208' : primary ? '#5a3010' : '#0a1a2a', border: `2px solid ${disabled ? '#3a2510' : primary ? '#c8902a' : '#2860a8'}`, color: disabled ? '#5a4030' : primary ? '#e8d5b0' : '#90b8e8', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 6, fontSize: 12, fontWeight: primary ? 'bold' : 'normal' } as const),
  badge: (type: string) => { const colors: Record<string,string> = { frost:'#6090c8',poison:'#508030',lifesteal:'#c03030',block:'#9a8060',weaken:'#c8902a',echo:'#702890',exhaust:'#8a6010',void:'#5a3a1a',invert:'#602090',silence:'#404040',name:'#d4a830',strengthen:'#d4a830',pierce:'#c03030' }; return { background: colors[type]??'#5a4030', color:'#fff', borderRadius:3, padding:'1px 4px', fontSize:9, fontFamily:'monospace', display:'inline-block', marginRight:2 } },
  log: { background:'#110d06', border:'1px solid #3a2510', borderRadius:6, padding:8, width:200, maxHeight:180, overflowY:'auto' as const, fontSize:10, color:'#7a6040', lineHeight:'1.6' },
  hpBar: (pct: number, green: boolean) => ({ height: 7, width: `${pct}%`, background: green ? (pct>50?'#408030':pct>25?'#a07030':'#902020') : (pct>50?'#c03030':pct>25?'#c87030':'#902020'), transition:'width .3s', borderRadius:3 }),
}

function KwBadge({ type, val }: { type: string; val?: number }) {
  return <span style={S.badge(type)}>{type}{val != null ? ` ${val}` : ''}</span>
}

function CardComp({ card, sel, onClick }: { card: LLCard; sel: boolean; onClick: () => void }) {
  return (
    <div style={S.card(sel)} onClick={onClick}>
      <div style={{ width:20, height:20, borderRadius:'50%', background: card.faction==='niemowi'?'#404040':card.faction==='gawedziarze'?'#8a6010':'#702890', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:'bold' }}>{card.cost}</div>
      <div style={{ fontSize:11, fontWeight:'bold', color:'#e8d5b0', lineHeight:1.2 }}>{card.name}</div>
      <div style={{ fontSize:10, color:'#9a8060', flex:1 }}>
        {card.baseEffect.damage ? `${card.baseEffect.damage} dmg` : ''}
        {card.baseEffect.heal ? `+${card.baseEffect.heal} HP` : ''}
        {card.baseEffect.drawWords ? `+${card.baseEffect.drawWords} Słów` : ''}
        {card.baseEffect.movePosition ? 'Przesuń → Tył' : ''}
        {card.baseEffect.applyKeywords?.map((k, i) => <KwBadge key={i} type={k.type} val={'stacks' in k ? k.stacks : 'value' in k ? (k as any).value : undefined} />)}
      </div>
      <div style={{ fontSize:8, color:'#6a5040', fontStyle:'italic', lineHeight:1.3 }}>{card.flavorText}</div>
    </div>
  )
}

function WordComp({ word, sel, onClick }: { word: LLWord; sel: boolean; onClick: () => void }) {
  const kw = word.keyword
  const val = 'stacks' in kw ? kw.stacks : 'value' in kw ? (kw as any).value : undefined
  return (
    <div style={S.word(sel)} onClick={onClick}>
      <div style={{ width:7, height:7, borderRadius:'50%', background: word.dialect==='niemowi'?'#404040':word.dialect==='gawedziarze'?'#8a6010':'#702890' }} />
      <div style={{ fontSize:10, fontWeight:'bold', color:'#c8b0e8', lineHeight:1.2 }}>{word.name}</div>
      <KwBadge type={kw.type} val={val} />
      <div style={{ fontSize:8, color:'#5a4870', fontStyle:'italic' }}>{word.flavorText}</div>
    </div>
  )
}

function EnemyComp({ enemy, tgt, onClick }: { enemy: EnemyState; tgt: boolean; onClick: () => void }) {
  const pct = (enemy.hp / enemy.maxHp) * 100
  return (
    <div style={S.enemy(tgt)} onClick={onClick}>
      <div style={{ fontSize:12, fontWeight:'bold', color:'#e8b0b0', marginBottom:5 }}>{enemy.name ?? enemy.id}{tgt && <span style={{color:'#c03030',marginLeft:4}}>◄</span>}</div>
      <div style={{ background:'#3a0808', borderRadius:3, height:7, marginBottom:3, overflow:'hidden' }}><div style={S.hpBar(pct, false)} /></div>
      <div style={{ fontSize:10, color:'#9a6060', marginBottom:4 }}>{enemy.hp}/{enemy.maxHp} HP</div>
      {enemy.block > 0 && <div style={{ fontSize:10, color:'#9a8060', marginBottom:2 }}>🛡 {enemy.block}</div>}
      <div style={{ fontSize:10, color:'#c8902a' }}>⏱ {enemy.counter}/{enemy.counterMax} · ⚔ {enemy.damage}</div>
      {enemy.activeEffects.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:2, marginTop:4 }}>
          {enemy.activeEffects.map((ae, i) => <KwBadge key={i} type={ae.keyword.type} val={ae.stacks} />)}
        </div>
      )}
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export function LastLanguageScreen() {
  const [state, setState] = useState<LLBattleState>(() => createInitialState(CARDS, WORDS))
  const [selCard, setSelCard] = useState<LLCard | null>(null)
  const [selWord, setSelWord] = useState<LLWord | null>(null)
  const [wordFirst, setWordFirst] = useState(true)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'playing'|'won'|'lost'>('playing')

  const checkPhase = (s: LLBattleState) => {
    if (s.player.hp <= 0) setPhase('lost')
    else if (s.enemies.length === 0) setPhase('won')
  }

  const handlePlay = () => {
    if (!selCard) return
    const ns = playCard(state, selCard, selWord, wordFirst, targetId ?? state.enemies[0]?.id)
    setState(ns); setSelCard(null); setSelWord(null); checkPhase(ns)
  }

  const handleTabu = () => {
    if (!selWord || state.wordHand.length < 2) return
    const w2 = state.wordHand.find(w => w.id !== selWord.id)
    if (!w2) return
    const ns = playTabu(state, selWord, w2)
    setState(ns); setSelWord(null); checkPhase(ns)
  }

  const handleEndTurn = () => {
    const ns = endTurn(state)
    setState(ns); setSelCard(null); setSelWord(null); checkPhase(ns)
  }

  const handleReset = () => {
    setState(createInitialState(CARDS, WORDS))
    setSelCard(null); setSelWord(null); setPhase('playing'); setTargetId(null)
  }

  const hpPct = (state.player.hp / state.player.maxHp) * 100

  return (
    <div style={S.root}>
      <div style={S.title}>⚔ OSTATNI JĘZYK ⚔</div>

      {phase !== 'playing' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, zIndex:100 }}>
          <div style={{ fontSize:32, color: phase==='won'?'#d4a830':'#c03030' }}>{phase==='won'?'⚔ Zwycięstwo':'☠ Śmierć'}</div>
          <button style={S.btn(true)} onClick={handleReset}>Zagraj ponownie</button>
        </div>
      )}

      <div style={{ ...S.row, justifyContent:'center' }}>
        {/* Player */}
        <div style={{ ...S.col, width:160, background:'#1a1a0e', border:'2px solid #3a5a1a', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:13, fontWeight:'bold', color:'#b0e890' }}>Tłumacz</div>
          <div style={{ background:'#1a3a0a', borderRadius:3, height:9, overflow:'hidden' }}><div style={S.hpBar(hpPct, true)} /></div>
          <div style={{ fontSize:11, color:'#70a050' }}>❤ {state.player.hp}/{state.player.maxHp}</div>
          {(state.player.block > 0 || state.player.hardBlock > 0) && <div style={{ fontSize:11, color:'#9a8060' }}>🛡 {state.player.block}{state.player.hardBlock > 0 ? `+${state.player.hardBlock}` : ''}</div>}
          <div style={{ fontSize:11, color:'#c8902a' }}>⚡ {state.actionsRemaining}/{state.maxActions}</div>
          <div style={{ fontSize:10, color:'#6a5040' }}>Tura {state.turn}</div>
          {state.tabulaMarks > 0 && <div style={{ fontSize:11, color:'#902090' }}>☠ Tabu: {state.tabulaMarks}/3</div>}
          <div style={{ fontSize:10, color:'#5a4870' }}>Słów w decku: {state.wordDeck.length}</div>
          {state.forgottenWords.length > 0 && <div style={{ fontSize:10, color:'#c03030' }}>Zapomniane: {state.forgottenWords.length}</div>}
        </div>

        {/* Arena */}
        <div style={{ ...S.col, flex:1, alignItems:'center' }}>
          {/* Enemies */}
          <div style={S.row}>
            {state.enemies.map(e => (
              <EnemyComp key={e.id} enemy={e} tgt={targetId===e.id} onClick={() => setTargetId(targetId===e.id ? null : e.id)} />
            ))}
            {state.enemies.length === 0 && <div style={{ color:'#4a3020' }}>Brak wrogów.</div>}
          </div>

          <div style={{ width:'100%', height:1, background:'#3a2510', opacity:.5 }} />

          {/* Controls */}
          <div style={{ ...S.row, alignItems:'center', flexWrap:'wrap' as const, gap:8 }}>
            <button style={S.btn(false)} onClick={() => setWordFirst(w => !w)}>
              {wordFirst ? '🔮 Słowo→Karta' : '⚔ Karta→Słowo'}
            </button>
            <button style={S.btn(true, !selCard)} onClick={handlePlay} disabled={!selCard}>Zagraj</button>
            <button style={S.btn(false)} onClick={handleTabu} title="Zagraj dwa słowa bez karty (TABU)">☠ Tabu</button>
            <button style={S.btn(false)} onClick={handleEndTurn}>Koniec tury →</button>
          </div>

          {(selCard || selWord) && (
            <div style={{ fontSize:11, color:'#9a7050', background:'#1e1208', border:'1px solid #3a2510', borderRadius:4, padding:'3px 10px' }}>
              {wordFirst
                ? `${selWord?.name ?? '–'} + ${selCard?.name ?? '–'}`
                : `${selCard?.name ?? '–'} → ${selWord?.name ?? '–'} (opóźnione)`}
            </div>
          )}
        </div>

        {/* Log */}
        <div style={S.log}>
          {[...state.log].reverse().map((l, i) => (
            <div key={i} style={{ color: i===0?'#c8a870':'#7a6040' }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Hand — Cards */}
      <div>
        <div style={{ fontSize:10, color:'#6a5040', marginBottom:5 }}>Karty ({state.hand.length}) · Deck: {state.deck.length} · Discard: {state.discardPile.length}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
          {state.hand.map(c => <CardComp key={c.id} card={c} sel={selCard?.id===c.id} onClick={() => setSelCard(selCard?.id===c.id ? null : c)} />)}
          {state.hand.length === 0 && <div style={{ color:'#4a3020', fontSize:12 }}>Brak kart.</div>}
        </div>
      </div>

      {/* Hand — Words */}
      <div>
        <div style={{ fontSize:10, color:'#4a3870', marginBottom:5 }}>Słowa ({state.wordHand.length}) · Deck: {state.wordDeck.length} · Zapomniane: {state.forgottenWords.length}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
          {state.wordHand.map(w => <WordComp key={w.id} word={w} sel={selWord?.id===w.id} onClick={() => setSelWord(selWord?.id===w.id ? null : w)} />)}
          {state.wordHand.length === 0 && <div style={{ color:'#3a2860', fontSize:12 }}>Brak Słów.</div>}
        </div>
      </div>
    </div>
  )
}
