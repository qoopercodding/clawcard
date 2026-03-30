import type { LLBattleState, LLCard, LLWord, ResolvedEffect, Keyword, Effect } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── EFFECTS ─────────────────────────────────────────────────────────────────

function applyKeywordToEffect(effect: ResolvedEffect, kw: Keyword, state: LLBattleState): ResolvedEffect {
  switch (kw.type) {
    case 'strengthen': return { ...effect, damage: (effect.damage ?? 0) + kw.value }
    case 'void': return { ...effect, multiplier: 3, exhaustCard: true }
    case 'invert': return { ...effect, inverted: true }
    case 'exhaust': return { ...effect, exhaustCard: true }
    case 'silence': return { ...effect, silentToHiveMind: true }
    case 'pastEcho': return state.lastPlayedEffect ? { ...state.lastPlayedEffect } as ResolvedEffect : effect
    default: return { ...effect, applyKeywords: [...(effect.applyKeywords ?? []), kw] }
  }
}

function invertEffect(e: ResolvedEffect): ResolvedEffect {
  return { ...e, damage: e.heal, heal: e.damage, inverted: false }
}

export function applyEffectToState(state: LLBattleState, effect: ResolvedEffect, targetId?: string): LLBattleState {
  let s = { ...state, log: [...state.log] }
  const target = targetId ? s.enemies.find(e => e.id === targetId) : s.enemies[0]

  const dmg = effect.damage ? (effect.multiplier ? effect.damage * effect.multiplier : effect.damage) : 0

  // Heal player
  if (effect.heal) {
    const h = Math.min(effect.heal, s.player.maxHp - s.player.hp)
    s = { ...s, player: { ...s.player, hp: s.player.hp + h } }
    s.log.push(`Leczysz się za ${h} HP.`)
  }

  // Block for player
  const blockKw = effect.applyKeywords?.find(k => k.type === 'block')
  if (blockKw && blockKw.type === 'block') {
    s = { ...s, player: { ...s.player, block: s.player.block + blockKw.value } }
    s.log.push(`+${blockKw.value} Bloku.`)
  }

  // Damage enemies
  if (effect.targetType === 'all') {
    s.enemies.forEach(e => { if (e.hp > 0) s = damageEnemy(s, e.id, dmg, effect) })
  } else if (target && dmg > 0) {
    s = damageEnemy(s, target.id, dmg, effect)
  }

  // Apply stack keywords
  if (target && effect.applyKeywords) {
    const stackKws = effect.applyKeywords.filter(k => ['frost','poison','weaken','root'].includes(k.type))
    if (stackKws.length > 0) {
      s = { ...s, enemies: s.enemies.map(e => {
        if (e.id !== target.id) return e
        const effs = [...e.activeEffects]
        for (const kw of stackKws) {
          const ex = effs.find(ae => ae.keyword.type === kw.type)
          const stacks = 'stacks' in kw ? kw.stacks : 1
          if (ex) ex.stacks += stacks
          else effs.push({ keyword: kw, stacks })
          s.log.push(`${kw.type} ×${stacks} na ${e.name ?? e.id}.`)
        }
        return { ...e, activeEffects: effs }
      }) }
    }
  }

  // Draw words
  if (effect.drawWords) {
    const drawn = s.wordDeck.slice(0, effect.drawWords)
    s = { ...s, wordHand: [...s.wordHand, ...drawn], wordDeck: s.wordDeck.slice(effect.drawWords) }
    if (drawn.length) s.log.push(`Dobierasz ${drawn.length} Słów.`)
  }

  // Remove dead enemies
  s = { ...s, enemies: s.enemies.filter(e => e.hp > 0) }
  return s
}

function damageEnemy(s: LLBattleState, id: string, dmg: number, effect: ResolvedEffect): LLBattleState {
  const pierce = effect.applyKeywords?.find(k => k.type === 'pierce')
  const enemy = s.enemies.find(e => e.id === id)!
  let actual = dmg
  let block = enemy.block

  if (!pierce && block > 0) {
    const absorbed = Math.min(actual, block)
    actual -= absorbed
    block -= absorbed
    s = { ...s, enemies: s.enemies.map(e => e.id === id ? { ...e, block } : e) }
  }

  s = { ...s, enemies: s.enemies.map(e => e.id === id ? { ...e, hp: Math.max(0, e.hp - actual) } : e) }
  s.log.push(`${actual} dmg → ${enemy.name ?? id}.`)

  // Lifesteal
  const ls = effect.applyKeywords?.find(k => k.type === 'lifesteal')
  if (ls && ls.type === 'lifesteal') {
    const h = Math.min(actual, s.player.maxHp - s.player.hp)
    s = { ...s, player: { ...s.player, hp: s.player.hp + h } }
    s.log.push(`Krwiopicie: +${h} HP.`)
  }
  return s
}

// ─── PLAY CARD ───────────────────────────────────────────────────────────────

export function playCard(
  state: LLBattleState,
  card: LLCard,
  word: LLWord | null,
  wordFirst: boolean,
  targetId?: string
): LLBattleState {
  let s = { ...state, log: [...state.log] }

  if (s.actionsRemaining < card.cost) { s.log.push('Brak akcji.'); return s }
  s = { ...s, actionsRemaining: s.actionsRemaining - card.cost }

  let effect: ResolvedEffect = { ...card.baseEffect }

  if (word && !wordFirst) {
    s = { ...s, pendingDelayedWord: word.keyword }
    s.log.push(`Opóźnione: ${word.name} zadziała w następnej turze.`)
  }

  if (word && wordFirst) {
    effect = applyKeywordToEffect(effect, word.keyword, s)
    if (card.id === 'zlamane-zdanie') { effect = { ...effect, damage: (effect.damage ?? 0) * 2, exhaustCard: true } }
    if (effect.inverted) effect = invertEffect(effect)
  }

  if (!word && s.pendingDelayedWord) {
    effect = applyKeywordToEffect(effect, s.pendingDelayedWord, s)
    s = { ...s, pendingDelayedWord: undefined }
  }

  s.log.push(`${card.name}${word ? ` + ${word.name}` : ''}.`)
  s = applyEffectToState(s, effect, targetId ?? s.enemies[0]?.id)

  // Hive Mind
  if (!effect.silentToHiveMind && word?.keyword.type !== 'silence') {
    const kw = word?.keyword ?? card.keywords[0]
    if (kw && !s.hiveMindMemory.some(k => k.type === kw.type)) {
      s = { ...s, hiveMindMemory: [...s.hiveMindMemory, kw] }
      s.log.push(`Hive Mind zapamiętuje: ${kw.type}.`)
    }
  }

  // Discard card
  if (!card.exhaustOnPlay && !effect.exhaustCard) {
    s = { ...s, discardPile: [...s.discardPile, card] }
  }
  s = { ...s, hand: s.hand.filter(c => c.id !== card.id) }

  // Forget word
  if (word) s = { ...s, wordHand: s.wordHand.filter(w => w.id !== word.id) }

  s = { ...s, lastPlayedEffect: effect }
  return s
}

// ─── TABU ─────────────────────────────────────────────────────────────────────

export function playTabu(state: LLBattleState, w1: LLWord, w2: LLWord): LLBattleState {
  let s = { ...state, log: [...state.log] }
  s.log.push(`TABU: ${w1.name} + ${w2.name}!`)

  const effect: ResolvedEffect = { targetType: 'single', applyKeywords: [w1.keyword, w2.keyword] }
  s = applyEffectToState(s, effect, s.enemies[0]?.id)
  s = { ...s, tabulaMarks: s.tabulaMarks + 1 }
  s.log.push(`Znamię Tabu: ${s.tabulaMarks}/3`)
  s = { ...s, wordHand: s.wordHand.filter(w => w.id !== w1.id && w.id !== w2.id) }
  return s
}

// ─── TURN END ────────────────────────────────────────────────────────────────

export function endTurn(state: LLBattleState): LLBattleState {
  let s = { ...state, log: [] }

  // Tick enemy effects
  s = { ...s, enemies: s.enemies.map(e => tickEffects(e)) }
  s = { ...s, enemies: s.enemies.filter(e => e.hp > 0) }

  // Enemy attacks
  s = { ...s, enemies: s.enemies.map(e => ({ ...e, counter: Math.max(0, e.counter - 1) })) }
  for (const e of s.enemies) {
    if (e.counter <= 0) {
      s = enemyAttack(s, e)
      s = { ...s, enemies: s.enemies.map(en => en.id === e.id ? { ...en, counter: en.counterMax } : en) }
    }
  }

  // Forget unplayed words
  if (s.wordHand.length > 0) {
    s.log.push(`Zapominasz ${s.wordHand.length} Słów: ${s.wordHand.map(w => w.name).join(', ')}.`)
    s = { ...s, forgottenWords: [...s.forgottenWords, ...s.wordHand], wordHand: [] }
  }

  // Discard hand
  s = { ...s, discardPile: [...s.discardPile, ...s.hand], hand: [] }

  // Shuffle discard if deck empty
  if (s.deck.length === 0 && s.discardPile.length > 0) {
    s = { ...s, deck: shuffle(s.discardPile), discardPile: [] }
  }

  // Draw 4 cards + 2 words
  const drawn = s.deck.slice(0, 4)
  s = { ...s, hand: drawn, deck: s.deck.slice(4) }
  const drawnW = s.wordDeck.slice(0, 2)
  s = { ...s, wordHand: drawnW, wordDeck: s.wordDeck.slice(2) }

  s = { ...s, player: { ...s.player, block: 0 }, actionsRemaining: s.maxActions, turn: s.turn + 1 }
  s.log.push(`─── Tura ${s.turn} ───`)
  return s
}

function tickEffects(e: typeof undefined extends never ? never : Parameters<typeof endTurn>[0]['enemies'][0]): typeof e {
  let hp = e.hp
  const effs = e.activeEffects.filter(ae => {
    if (ae.keyword.type === 'poison') { hp = Math.max(0, hp - ae.stacks); return ae.stacks > 1 ? (ae.stacks--, true) : false }
    if (ae.keyword.type === 'frost') { hp = Math.max(0, hp - ae.stacks); return (ae.keyword as any).deep || ae.stacks > 1 ? (ae.stacks > 1 && ae.stacks--, true) : false }
    return true
  })
  return { ...e, hp, activeEffects: effs }
}

function enemyAttack(s: LLBattleState, e: LLBattleState['enemies'][0]): LLBattleState {
  let dmg = e.damage
  const block = s.player.block + s.player.hardBlock
  const softAbs = Math.min(dmg, s.player.block)
  const hardAbs = Math.min(dmg - softAbs, s.player.hardBlock)
  const actual = Math.max(0, dmg - softAbs - hardAbs)
  s = { ...s, player: { ...s.player, hp: Math.max(0, s.player.hp - actual), block: Math.max(0, s.player.block - softAbs), hardBlock: Math.max(0, s.player.hardBlock - hardAbs) } }
  s.log.push(`${e.name ?? e.id} atakuje: ${dmg} dmg (${actual} po bloku).`)
  return s
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

export function createInitialState(cards: LLCard[], words: LLWord[]): LLBattleState {
  const deck = shuffle([...cards])
  const wordDeck = shuffle([...words])
  return {
    player: { hp: 50, maxHp: 50, block: 0, hardBlock: 0, position: 'mid', activeEffects: [], tabulaMarks: 0 },
    enemies: [
      { id: 'stroz-1', name: 'Strażnik Ciszy', hp: 30, maxHp: 30, block: 0, position: 'front', counter: 3, counterMax: 3, activeEffects: [], faction: 'niemowi', intent: 'attack', damage: 8, adaptations: [] },
      { id: 'stroz-2', name: 'Echoludek', hp: 20, maxHp: 20, block: 0, position: 'mid', counter: 2, counterMax: 2, activeEffects: [], faction: 'echoludzie', intent: 'attack', damage: 5, adaptations: [] },
    ],
    hand: deck.slice(0, 4),
    wordHand: wordDeck.slice(0, 2),
    deck: deck.slice(4),
    wordDeck: wordDeck.slice(2),
    discardPile: [],
    forgottenWords: [],
    actionsRemaining: 3,
    maxActions: 3,
    tabulaMarks: 0,
    turn: 1,
    lastPlayedEffect: null,
    hiveMindMemory: [],
    log: ['─── Tura 1 ───'],
  }
}
