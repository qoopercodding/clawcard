// @ts-nocheck
// =============================================================================
// battleEngine.ts — Silnik walki dla demo
// =============================================================================
//
// Czysta logika gry bez żadnego UI. Każda akcja zwraca nowy stan + log zdarzeń.
// UI tylko renderuje stan i zdarzenia — nie zna logiki.
//
// OBIEKTY STANU:
//
// BattleCard — instancja karty na planszy
//   id, name, emoji, hp, maxHp, attack, counter, maxCounter
//   snow (staki zamrożenia), shield, status (np. 'frozen','shielded')
//
// BattleState — pełny stan walki
//   phase: 'draw' | 'play' | 'enemy' | 'won' | 'lost'
//   turn: numer tury
//   player/enemy: BattleCard|null (jedna na razie — rozszerz na 6 potem)
//   hand: HandCard[]
//   deck: string[]
//   discard: string[]
//   log: LogEntry[]
// =============================================================================

export type Phase = 'draw' | 'play' | 'resolve' | 'enemy' | 'won' | 'lost'
export type StatusEffect = 'frozen' | 'shielded' | 'poisoned' | 'burning' | 'teeth'

export interface BattleCard {
  instanceId: string
  id: string
  name: string
  emoji: string
  hp: number
  maxHp: number
  attack: number
  counter: number
  maxCounter: number
  snow: number          // staki zamrożenia — blokuje 1 atak
  shield: number        // absorbuje obrażenia
  poison: number        // 1 dmg/tura
  teeth: number         // dmg zwrotny gdy zaatakowana
  isLeader: boolean
}

export interface HandCard {
  id: string
  name: string
  emoji: string
  type: 'companion' | 'item'
  effect: {
    damage?: number
    heal?: number
    snow?: number
    shield?: number
    addTeeth?: number
    poison?: number
    strength?: number
    weak?: number
    vulnerable?: number
  }
  target: 'enemy' | 'ally' | 'all_enemies' | 'self'
}

export type LogType = 'attack' | 'damage' | 'heal' | 'snow' | 'shield' | 'death' | 'draw' | 'counter' | 'system' | 'frenzy' | 'teeth' | 'poison'

export interface LogEntry {
  id: string
  type: LogType
  text: string
  value?: number
}

export interface BattleState {
  phase: Phase
  turn: number
  playerCard: BattleCard | null
  enemyCard: BattleCard | null
  hand: HandCard[]
  deck: HandCard[]
  discard: HandCard[]
  log: LogEntry[]
  animating: boolean // blokuje akcje podczas animacji
}

// ---------------------------------------------------------------------------
// Fabryki kart
// ---------------------------------------------------------------------------

function mkId() { return Math.random().toString(36).slice(2, 8) }

function makeEnemy(
  id: string, name: string, emoji: string,
  hp: number, attack: number, counter: number,
  extras: Partial<BattleCard> = {}
): BattleCard {
  return {
    instanceId: mkId(), id, name, emoji,
    hp, maxHp: hp, attack, counter, maxCounter: counter,
    snow: 0, shield: 0, poison: 0, teeth: 0,
    isLeader: false,
    ...extras
  }
}

function makePlayerCard(
  id: string, name: string, emoji: string,
  hp: number, attack: number, counter: number,
  isLeader = false
): BattleCard {
  return {
    instanceId: mkId(), id, name, emoji,
    hp, maxHp: hp, attack, counter, maxCounter: counter,
    snow: 0, shield: 0, poison: 0, teeth: 0,
    isLeader
  }
}

// ---------------------------------------------------------------------------
// Talie startowe
// ---------------------------------------------------------------------------

const STARTER_HAND: HandCard[] = [
  { id: 'sword',    name: 'Sword',     emoji: '⚔️', type: 'item', effect: { damage: 5 }, target: 'enemy' },
  { id: 'snowball', name: 'Snowball',  emoji: '❄️', type: 'item', effect: { snow: 2 },   target: 'enemy' },
  { id: 'healberry',name: 'Healberry', emoji: '🍓', type: 'item', effect: { heal: 4 },   target: 'ally' },
  { id: 'bonesaw',  name: 'Bonesaw',   emoji: '🪚', type: 'item', effect: { damage: 3 }, target: 'all_enemies' },
  { id: 'shield_potion', name: 'Shield', emoji: '🛡️', type: 'item', effect: { shield: 3 }, target: 'ally' },
]

const EXTRA_DECK: HandCard[] = [
  { id: 'sword',    name: 'Sword',     emoji: '⚔️', type: 'item', effect: { damage: 5 }, target: 'enemy' },
  { id: 'snowball', name: 'Snowball',  emoji: '❄️', type: 'item', effect: { snow: 2 },   target: 'enemy' },
  { id: 'healberry',name: 'Healberry', emoji: '🍓', type: 'item', effect: { heal: 4 },   target: 'ally' },
  { id: 'big_sword',name: 'Big Sword', emoji: '🗡️', type: 'item', effect: { damage: 8 }, target: 'enemy' },
  { id: 'teeth_ring',name: 'Teeth Ring',emoji:'🦷', type: 'item', effect: { addTeeth: 3 }, target: 'ally' },
]

// ---------------------------------------------------------------------------
// Zestawy wrogów
// ---------------------------------------------------------------------------

export const ENEMY_SETS = [
  { id: 'snoof',   name: 'Snoof',   emoji: '🐧', hp: 6,  attack: 2, counter: 3, extras: {} },
  { id: 'wallop',  name: 'Wallop',  emoji: '🐗', hp: 9,  attack: 4, counter: 4, extras: { shield: 2 } },
  { id: 'foxee',   name: 'Foxee',   emoji: '🦊', hp: 4,  attack: 1, counter: 2, extras: {} },
  { id: 'tusk',    name: 'Tusk',    emoji: '🦣', hp: 8,  attack: 3, counter: 5, extras: { teeth: 3 } },
  { id: 'dregg',   name: 'Dregg',   emoji: '🐲', hp: 18, attack: 5, counter: 3, extras: { shield: 4 } },
] as const

// ---------------------------------------------------------------------------
// Silnik
// ---------------------------------------------------------------------------

function log(state: BattleState, type: LogType, text: string, value?: number): BattleState {
  return {
    ...state,
    log: [
      { id: mkId(), type, text, value },
      ...state.log,
    ].slice(0, 30), // max 30 wpisów
  }
}

/** Inicjalizuje nową walkę */
export function initBattle(enemyIdx = 0): BattleState {
  const eSet = ENEMY_SETS[enemyIdx % ENEMY_SETS.length]
  const enemy = makeEnemy(eSet.id, eSet.name, eSet.emoji, eSet.hp, eSet.attack, eSet.counter, eSet.extras)
  const player = makePlayerCard('namandi', 'Namandi', '🦀', 11, 1, 1, true)

  const shuffled = [...STARTER_HAND].sort(() => Math.random() - 0.5)
  const deck = [...EXTRA_DECK].sort(() => Math.random() - 0.5)

  let state: BattleState = {
    phase: 'play',
    turn: 1,
    playerCard: player,
    enemyCard: enemy,
    hand: shuffled.slice(0, 4),
    deck,
    discard: [],
    log: [],
    animating: false,
  }

  state = log(state, 'system', `Tura 1 — zmierz się z ${enemy.name}!`)
  return state
}

/** Zagrywa kartę z ręki */
export function playCard(state: BattleState, cardId: string): BattleState {
  if (state.phase !== 'play' || state.animating) return state

  const cardIdx = state.hand.findIndex(c => c.id === cardId)
  if (cardIdx < 0) return state

  const card = state.hand[cardIdx]
  const newHand = state.hand.filter((_, i) => i !== cardIdx)
  const newDiscard = [card, ...state.discard]

  let s: BattleState = { ...state, hand: newHand, discard: newDiscard }

  // Zastosuj efekt
  if (card.effect.damage && (card.target === 'enemy' || card.target === 'all_enemies')) {
    s = applyDamageToEnemy(s, card.effect.damage, card.name)
  }
  if (card.effect.snow && s.enemyCard) {
    const enemy = { ...s.enemyCard, snow: s.enemyCard.snow + card.effect.snow }
    s = { ...s, enemyCard: enemy }
    s = log(s, 'snow', `${card.name}: ❄️ ${card.effect.snow} Snow na ${enemy.name}`, card.effect.snow)
  }
  if (card.effect.heal && s.playerCard) {
    const healed = Math.min(card.effect.heal, s.playerCard.maxHp - s.playerCard.hp)
    const player = { ...s.playerCard, hp: s.playerCard.hp + healed }
    s = { ...s, playerCard: player }
    s = log(s, 'heal', `${card.name}: +${healed} HP dla ${player.name}`, healed)
  }
  if (card.effect.shield && s.playerCard) {
    const player = { ...s.playerCard, shield: s.playerCard.shield + card.effect.shield }
    s = { ...s, playerCard: player }
    s = log(s, 'shield', `${card.name}: 🛡️ +${card.effect.shield} Shield`, card.effect.shield)
  }
  if (card.effect.addTeeth && s.playerCard) {
    const player = { ...s.playerCard, teeth: s.playerCard.teeth + card.effect.addTeeth }
    s = { ...s, playerCard: player }
    s = log(s, 'teeth', `${card.name}: 🦷 +${card.effect.addTeeth} Teeth`, card.effect.addTeeth)
  }

  // Sprawdź wygraną
  if (!s.enemyCard || s.enemyCard.hp <= 0) {
    return { ...s, phase: 'won', enemyCard: null }
  }

  // Zatyknij counter gracza + wroga → faza enemy
  s = tickCounters(s)
  s = log(s, 'system', `Tura ${s.turn}`)

  return s
}

function applyDamageToEnemy(state: BattleState, dmg: number, source: string): BattleState {
  if (!state.enemyCard) return state
  let s = state

  let actualDmg = dmg
  const enemy = state.enemyCard

  // Snow blokuje jeden atak
  if (enemy.snow > 0) {
    const newEnemy = { ...enemy, snow: enemy.snow - 1 }
    s = { ...s, enemyCard: newEnemy }
    return log(s, 'snow', `${enemy.name} blokuje atak! ❄️ (snow: ${newEnemy.snow} left)`)
  }

  // Shield absorbuje
  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, actualDmg)
    actualDmg -= absorbed
    const newEnemy = { ...enemy, shield: enemy.shield - absorbed }
    s = { ...s, enemyCard: newEnemy }
    if (actualDmg <= 0) {
      return log(s, 'shield', `${enemy.name} blokuje ${absorbed} dmg tarczą! 🛡️`)
    }
  }

  const newHp = Math.max(0, enemy.hp - actualDmg)
  const newEnemy = { ...s.enemyCard!, hp: newHp }
  s = { ...s, enemyCard: newHp <= 0 ? null : newEnemy }
  s = log(s, 'damage', `${source} → ${enemy.name}: -${actualDmg} HP`, actualDmg)

  // Teeth gracza — oddaje dmg
  if (s.playerCard && s.playerCard.teeth > 0 && newHp > 0) {
    s = log(s, 'teeth', `Teeth: ${enemy.name} dostaje +${s.playerCard.teeth} dmg zwrotny`, s.playerCard.teeth)
    const withTeeth = { ...s.enemyCard!, hp: Math.max(0, s.enemyCard!.hp - s.playerCard.teeth) }
    s = { ...s, enemyCard: withTeeth.hp <= 0 ? null : withTeeth }
  }

  return s
}

function applyDamageToPlayer(state: BattleState, dmg: number, source: string): BattleState {
  if (!state.playerCard) return state
  let s = state
  const player = state.playerCard

  let actualDmg = dmg

  // Snow
  if (player.snow > 0) {
    const np = { ...player, snow: player.snow - 1 }
    s = { ...s, playerCard: np }
    return log(s, 'snow', `${player.name} zamrożony! ❄️ Atak zablokowany`)
  }

  // Shield
  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, actualDmg)
    actualDmg -= absorbed
    const np = { ...player, shield: player.shield - absorbed }
    s = { ...s, playerCard: np }
    if (actualDmg <= 0) {
      return log(s, 'shield', `${player.name} blokuje ${absorbed} dmg tarczą!`)
    }
  }

  const newHp = Math.max(0, player.hp - actualDmg)
  const newPlayer = { ...s.playerCard!, hp: newHp }
  s = { ...s, playerCard: newHp <= 0 ? null : newPlayer }
  s = log(s, 'damage', `${source} → ${player.name}: -${actualDmg} HP`, actualDmg)

  return s
}

function tickCounters(state: BattleState): BattleState {
  let s = { ...state, turn: state.turn + 1 }

  // Counter gracza
  if (s.playerCard) {
    const p = s.playerCard
    if (p.counter <= 1) {
      // Trigger — atak na wroga
      s = { ...s, playerCard: { ...p, counter: p.maxCounter } }
      if (s.enemyCard) {
        s = log(s, 'attack', `${p.name} ⚔️ atakuje ${s.enemyCard.name}!`)
        s = applyDamageToEnemy(s, p.attack, p.name)
        // Poison tick na wrogu
        if (s.enemyCard && s.enemyCard.poison > 0) {
          s = applyDamageToEnemy(s, s.enemyCard.poison, '☠️ Poison')
          const ep = { ...s.enemyCard!, poison: Math.max(0, s.enemyCard!.poison - 1) }
          s = { ...s, enemyCard: s.enemyCard ? ep : null }
        }
      }
    } else {
      s = { ...s, playerCard: { ...p, counter: p.counter - 1 } }
      s = log(s, 'counter', `${p.name} counter: ${p.counter - 1}`)
    }
  }

  if (!s.enemyCard) return { ...s, phase: 'won' }

  // Counter wroga
  if (s.enemyCard) {
    const e = s.enemyCard
    if (e.counter <= 1) {
      s = { ...s, enemyCard: { ...e, counter: e.maxCounter } }
      if (s.playerCard) {
        s = log(s, 'attack', `${e.name} ⚔️ atakuje ${s.playerCard.name}!`)
        s = applyDamageToPlayer(s, e.attack, e.name)
        // Teeth zwrotny od wroga
        if (s.enemyCard && s.playerCard && s.playerCard.teeth > 0 && s.enemyCard) {
          s = log(s, 'teeth', `Teeth: ${e.name} dostaje ${s.playerCard.teeth} dmg zwrotny`)
          const newEHp = Math.max(0, s.enemyCard.hp - s.playerCard.teeth)
          s = { ...s, enemyCard: newEHp <= 0 ? null : { ...s.enemyCard, hp: newEHp } }
        }
      }
    } else {
      s = { ...s, enemyCard: { ...e, counter: e.counter - 1 } }
      s = log(s, 'counter', `${e.name} counter: ${e.counter - 1}`)
    }
  }

  if (!s.playerCard || s.playerCard.hp <= 0) {
    return { ...s, phase: 'lost', playerCard: null }
  }
  if (!s.enemyCard) {
    return { ...s, phase: 'won', enemyCard: null }
  }

  return s
}

/** Dobierz kartę z talii */
export function drawCard(state: BattleState): BattleState {
  if (state.deck.length === 0 && state.discard.length === 0) return state

  let deck = [...state.deck]
  let discard = [...state.discard]

  if (deck.length === 0) {
    deck = [...discard].sort(() => Math.random() - 0.5)
    discard = []
  }

  const [drawn, ...rest] = deck
  return log(
    { ...state, hand: [...state.hand, drawn], deck: rest, discard },
    'draw',
    `Dobierasz: ${drawn.emoji} ${drawn.name}`
  )
}

/** Zakończ turę bez grania karty */
export function endTurn(state: BattleState): BattleState {
  if (state.phase !== 'play') return state
  let s = tickCounters(state)
  s = log(s, 'system', `Tura ${s.turn} — endturn`)
  return s
}
