// =============================================================================
// gridBattleEngine.ts — Silnik walki na siatce 3x2 vs 3x2
// =============================================================================
//
// Gracz: 3 kolumny × 2 rzędy (6 slotów)
// Wróg:  3 kolumny × 2 rzędy (6 slotów) — lustrzane odbicie
//
// Layout (widok gracza):
//   [P0][P1][P2]  ←front→  [E0][E1][E2]
//   [P3][P4][P5]  ←back →  [E3][E4][E5]
//
// Front row (0-2) atakuje jako pierwsza. Back row (3-5) wspiera.
// Counter system z Wildfrost: każda karta ma counter, co tick -1,
// gdy dojdzie do 0 → atak na przeciwną stronę.
// =============================================================================

import type { BattleCard, HandCard, LogEntry, LogType } from './battleEngine'

export const GRID_COLS = 3
export const GRID_ROWS = 2
export const GRID_SLOTS = GRID_COLS * GRID_ROWS // 6

export type GridPhase = 'play' | 'resolve' | 'enemy' | 'won' | 'lost'

export interface GridBattleState {
  phase: GridPhase
  turn: number
  playerGrid: (BattleCard | null)[]  // 6 slots [0..5]
  enemyGrid: (BattleCard | null)[]   // 6 slots [0..5]
  hand: HandCard[]
  deck: HandCard[]
  discard: HandCard[]
  energy: number
  maxEnergy: number
  log: LogEntry[]
  selectedSlot: number | null  // slot gracza wybrany do targetowania
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mkId() { return Math.random().toString(36).slice(2, 8) }

function addLog(state: GridBattleState, type: LogType, text: string, value?: number): GridBattleState {
  return {
    ...state,
    log: [{ id: mkId(), type, text, value }, ...state.log].slice(0, 40),
  }
}

export function slotToRowCol(slot: number): { row: number; col: number } {
  return { row: Math.floor(slot / GRID_COLS), col: slot % GRID_COLS }
}

export function isFrontRow(slot: number): boolean {
  return slot < GRID_COLS // 0, 1, 2
}

/** Znajdź cel ataku — naprzeciwko (ta sama kolumna, front row), albo losowy */
function findTarget(grid: (BattleCard | null)[], attackerSlot: number): number | null {
  const col = attackerSlot % GRID_COLS
  // Najpierw front row naprzeciwko
  if (grid[col]) return col
  // Potem reszta front row
  for (let c = 0; c < GRID_COLS; c++) {
    if (grid[c]) return c
  }
  // Potem back row
  for (let c = GRID_COLS; c < GRID_SLOTS; c++) {
    if (grid[c]) return c
  }
  return null
}

function countAlive(grid: (BattleCard | null)[]): number {
  return grid.filter(c => c !== null).length
}

// ---------------------------------------------------------------------------
// Fabryki
// ---------------------------------------------------------------------------

function makeBattleCard(
  id: string, name: string, emoji: string,
  hp: number, attack: number, counter: number,
  extras: Partial<BattleCard> = {}
): BattleCard {
  return {
    instanceId: mkId(), id, name, emoji,
    hp, maxHp: hp, attack, counter, maxCounter: counter,
    snow: 0, shield: 0, poison: 0, teeth: 0,
    isLeader: false,
    ...extras,
  }
}

// ---------------------------------------------------------------------------
// Starter configs
// ---------------------------------------------------------------------------

const PLAYER_CARDS: { id: string; name: string; emoji: string; hp: number; atk: number; counter: number; leader?: boolean }[] = [
  { id: 'namandi',  name: 'Namandi',  emoji: '🦀', hp: 11, atk: 2, counter: 3, leader: true },
  { id: 'foxfire',  name: 'Foxfire',  emoji: '🦊', hp: 6,  atk: 3, counter: 2 },
  { id: 'mossbear', name: 'Mossbear', emoji: '🐻', hp: 14, atk: 1, counter: 4 },
  { id: 'frostowl', name: 'Frostowl',emoji: '🦉', hp: 4,  atk: 2, counter: 2 },
]

export interface EnemyWave {
  name: string
  emoji: string
  cards: { id: string; name: string; emoji: string; hp: number; atk: number; counter: number; slot: number; extras?: Partial<BattleCard> }[]
}

export const ENEMY_WAVES: EnemyWave[] = [
  {
    name: 'Goblin Patrol', emoji: '👺',
    cards: [
      { id: 'goblin1', name: 'Goblin',     emoji: '👺', hp: 4,  atk: 2, counter: 3, slot: 0 },
      { id: 'goblin2', name: 'Goblin',     emoji: '👺', hp: 4,  atk: 2, counter: 3, slot: 1 },
      { id: 'shaman',  name: 'Shaman',     emoji: '🧙', hp: 3,  atk: 1, counter: 2, slot: 4 },
    ],
  },
  {
    name: 'Wolf Pack', emoji: '🐺',
    cards: [
      { id: 'wolf1',  name: 'Dire Wolf',  emoji: '🐺', hp: 6,  atk: 3, counter: 2, slot: 0 },
      { id: 'wolf2',  name: 'Dire Wolf',  emoji: '🐺', hp: 6,  atk: 3, counter: 2, slot: 2 },
      { id: 'alpha',  name: 'Alpha',      emoji: '🐕', hp: 10, atk: 4, counter: 3, slot: 1 },
      { id: 'pup',    name: 'Warg Pup',   emoji: '🐶', hp: 3,  atk: 1, counter: 1, slot: 4 },
    ],
  },
  {
    name: 'Undead Horde', emoji: '💀',
    cards: [
      { id: 'skel1',  name: 'Skeleton',   emoji: '💀', hp: 5,  atk: 2, counter: 3, slot: 0, extras: { teeth: 1 } },
      { id: 'skel2',  name: 'Skeleton',   emoji: '💀', hp: 5,  atk: 2, counter: 3, slot: 1, extras: { teeth: 1 } },
      { id: 'skel3',  name: 'Skeleton',   emoji: '💀', hp: 5,  atk: 2, counter: 3, slot: 2, extras: { teeth: 1 } },
      { id: 'necro',  name: 'Necromancer',emoji: '🧟', hp: 8,  atk: 3, counter: 4, slot: 4, extras: { shield: 3 } },
    ],
  },
  {
    name: 'Dragon Boss', emoji: '🐲',
    cards: [
      { id: 'drake1', name: 'Drake',      emoji: '🦎', hp: 7,  atk: 3, counter: 2, slot: 0 },
      { id: 'drake2', name: 'Drake',      emoji: '🦎', hp: 7,  atk: 3, counter: 2, slot: 2 },
      { id: 'dragon', name: 'Dregg',      emoji: '🐲', hp: 22, atk: 5, counter: 3, slot: 1, extras: { shield: 4 } },
      { id: 'egg1',   name: 'Dragon Egg', emoji: '🥚', hp: 4,  atk: 0, counter: 5, slot: 3 },
      { id: 'egg2',   name: 'Dragon Egg', emoji: '🥚', hp: 4,  atk: 0, counter: 5, slot: 5 },
    ],
  },
]

const GRID_HAND: HandCard[] = [
  { id: 'sword',    name: 'Sword',     emoji: '⚔️', type: 'item', effect: { damage: 4 }, target: 'enemy' },
  { id: 'snowball', name: 'Snowball',  emoji: '❄️', type: 'item', effect: { snow: 2 },   target: 'enemy' },
  { id: 'healberry',name: 'Healberry', emoji: '🍓', type: 'item', effect: { heal: 4 },   target: 'ally' },
  { id: 'shield_p', name: 'Shield',    emoji: '🛡️', type: 'item', effect: { shield: 3 }, target: 'ally' },
  { id: 'bonesaw',  name: 'Bonesaw',   emoji: '🪚', type: 'item', effect: { damage: 2 }, target: 'all_enemies' },
]

const GRID_DECK: HandCard[] = [
  { id: 'sword2',   name: 'Sword',     emoji: '⚔️', type: 'item', effect: { damage: 4 }, target: 'enemy' },
  { id: 'big_sword',name: 'Big Sword', emoji: '🗡️', type: 'item', effect: { damage: 7 }, target: 'enemy' },
  { id: 'snowball2',name: 'Snowball',  emoji: '❄️', type: 'item', effect: { snow: 2 },   target: 'enemy' },
  { id: 'healberry2',name:'Healberry', emoji: '🍓', type: 'item', effect: { heal: 4 },   target: 'ally' },
  { id: 'teeth_r',  name: 'Teeth Ring',emoji: '🦷', type: 'item', effect: { addTeeth: 2 }, target: 'ally' },
  { id: 'fireball', name: 'Fireball',  emoji: '🔥', type: 'item', effect: { damage: 3 }, target: 'all_enemies' },
  { id: 'venom',    name: 'Venom Flask',emoji:'☠️', type: 'item', effect: { poison: 3 }, target: 'enemy' },
  { id: 'warhorn',  name: 'War Horn',  emoji: '📯', type: 'item', effect: { strength: 2 }, target: 'ally' },
  { id: 'hex',      name: 'Hex Curse', emoji: '🎯', type: 'item', effect: { vulnerable: 2 }, target: 'enemy' },
  { id: 'weaken',   name: 'Weaken',    emoji: '😵', type: 'item', effect: { weak: 2 }, target: 'enemy' },
]

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initGridBattle(waveIdx = 0): GridBattleState {
  const wave = ENEMY_WAVES[waveIdx % ENEMY_WAVES.length]

  const playerGrid: (BattleCard | null)[] = Array(GRID_SLOTS).fill(null)
  PLAYER_CARDS.forEach((p, i) => {
    if (i < GRID_SLOTS) {
      // Place: slot 0, 1, 2 front; 4 back-center
      const slot = i < 3 ? i : 4
      playerGrid[slot] = makeBattleCard(p.id, p.name, p.emoji, p.hp, p.atk, p.counter, { isLeader: p.leader ?? false })
    }
  })

  const enemyGrid: (BattleCard | null)[] = Array(GRID_SLOTS).fill(null)
  wave.cards.forEach(e => {
    if (e.slot < GRID_SLOTS) {
      enemyGrid[e.slot] = makeBattleCard(e.id, e.name, e.emoji, e.hp, e.atk, e.counter, e.extras)
    }
  })

  const hand = [...GRID_HAND].sort(() => Math.random() - 0.5).slice(0, 4)
  const deck = [...GRID_DECK].sort(() => Math.random() - 0.5)

  let s: GridBattleState = {
    phase: 'play',
    turn: 1,
    playerGrid,
    enemyGrid,
    hand,
    deck,
    discard: [],
    energy: 3,
    maxEnergy: 3,
    log: [],
    selectedSlot: null,
  }

  s = addLog(s, 'system', `⚔️ Walka: ${wave.name}! Tura 1`)
  return s
}

// ---------------------------------------------------------------------------
// Damage helpers
// ---------------------------------------------------------------------------

function applyDmgToCard(card: BattleCard, dmg: number): { card: BattleCard | null; actualDmg: number; blocked: boolean } {
  // Snow blocks
  if (card.snow > 0) {
    return { card: { ...card, snow: card.snow - 1 }, actualDmg: 0, blocked: true }
  }
  // Shield absorbs
  let actual = dmg
  let newShield = card.shield
  if (newShield > 0) {
    const absorbed = Math.min(newShield, actual)
    actual -= absorbed
    newShield -= absorbed
  }
  const newHp = Math.max(0, card.hp - actual)
  if (newHp <= 0) return { card: null, actualDmg: actual, blocked: false }
  return { card: { ...card, hp: newHp, shield: newShield }, actualDmg: actual, blocked: false }
}

// ---------------------------------------------------------------------------
// Play card from hand
// ---------------------------------------------------------------------------

export function gridPlayCard(state: GridBattleState, cardId: string, targetSlot?: number): GridBattleState {
  if (state.phase !== 'play') return state

  const cardIdx = state.hand.findIndex(c => c.id === cardId)
  if (cardIdx < 0) return state
  const card = state.hand[cardIdx]

  // Energy cost (all cards cost 1 for now)
  if (state.energy < 1) return state

  const newHand = state.hand.filter((_, i) => i !== cardIdx)
  const newDiscard = [card, ...state.discard]
  let s: GridBattleState = { ...state, hand: newHand, discard: newDiscard, energy: state.energy - 1 }

  // Apply effect
  if (card.effect.damage && card.target === 'enemy' && targetSlot !== undefined) {
    const target = s.enemyGrid[targetSlot]
    if (target) {
      const { card: newCard, actualDmg, blocked } = applyDmgToCard(target, card.effect.damage)
      const eg = [...s.enemyGrid]
      eg[targetSlot] = newCard
      s = { ...s, enemyGrid: eg }
      if (blocked) {
        s = addLog(s, 'snow', `${card.name}: ❄️ ${target.name} blokuje atak!`)
      } else {
        s = addLog(s, 'damage', `${card.name} → ${target.name}: -${actualDmg} HP`, actualDmg)
        if (!newCard) s = addLog(s, 'death', `💀 ${target.name} pokonany!`)
      }
    }
  }

  if (card.effect.damage && card.target === 'all_enemies') {
    const eg = [...s.enemyGrid]
    for (let i = 0; i < GRID_SLOTS; i++) {
      if (eg[i]) {
        const { card: newCard, actualDmg, blocked } = applyDmgToCard(eg[i]!, card.effect.damage)
        if (blocked) {
          s = addLog(s, 'snow', `${card.name}: ❄️ ${eg[i]!.name} blokuje!`)
        } else {
          s = addLog(s, 'damage', `${card.name} → ${eg[i]!.name}: -${actualDmg}`, actualDmg)
          if (!newCard) s = addLog(s, 'death', `💀 ${eg[i]!.name} pokonany!`)
        }
        eg[i] = newCard
      }
    }
    s = { ...s, enemyGrid: eg }
  }

  if (card.effect.snow && card.target === 'enemy' && targetSlot !== undefined) {
    const target = s.enemyGrid[targetSlot]
    if (target) {
      const eg = [...s.enemyGrid]
      eg[targetSlot] = { ...target, snow: target.snow + card.effect.snow }
      s = { ...s, enemyGrid: eg }
      s = addLog(s, 'snow', `${card.name}: ❄️ +${card.effect.snow} Snow na ${target.name}`, card.effect.snow)
    }
  }

  if (card.effect.heal && card.target === 'ally' && targetSlot !== undefined) {
    const target = s.playerGrid[targetSlot]
    if (target) {
      const healed = Math.min(card.effect.heal, target.maxHp - target.hp)
      const pg = [...s.playerGrid]
      pg[targetSlot] = { ...target, hp: target.hp + healed }
      s = { ...s, playerGrid: pg }
      s = addLog(s, 'heal', `${card.name}: +${healed} HP dla ${target.name}`, healed)
    }
  }

  if (card.effect.shield && card.target === 'ally' && targetSlot !== undefined) {
    const target = s.playerGrid[targetSlot]
    if (target) {
      const pg = [...s.playerGrid]
      pg[targetSlot] = { ...target, shield: target.shield + card.effect.shield }
      s = { ...s, playerGrid: pg }
      s = addLog(s, 'shield', `${card.name}: 🛡️ +${card.effect.shield} Shield na ${target.name}`, card.effect.shield)
    }
  }

  if (card.effect.addTeeth && card.target === 'ally' && targetSlot !== undefined) {
    const target = s.playerGrid[targetSlot]
    if (target) {
      const pg = [...s.playerGrid]
      pg[targetSlot] = { ...target, teeth: target.teeth + card.effect.addTeeth }
      s = { ...s, playerGrid: pg }
      s = addLog(s, 'teeth', `${card.name}: 🦷 +${card.effect.addTeeth} Teeth na ${target.name}`, card.effect.addTeeth)
    }
  }

  // Poison on enemy
  if (card.effect.poison && card.target === 'enemy' && targetSlot !== undefined) {
    const target = s.enemyGrid[targetSlot]
    if (target) {
      const eg = [...s.enemyGrid]
      eg[targetSlot] = { ...target, poison: target.poison + card.effect.poison }
      s = { ...s, enemyGrid: eg }
      s = addLog(s, 'poison', `${card.name}: ☠️ +${card.effect.poison} Poison na ${target.name}`, card.effect.poison)
    }
  }

  // Strength on ally
  if (card.effect.strength && card.target === 'ally' && targetSlot !== undefined) {
    const target = s.playerGrid[targetSlot]
    if (target) {
      const pg = [...s.playerGrid]
      pg[targetSlot] = { ...target, attack: target.attack + card.effect.strength }
      s = { ...s, playerGrid: pg }
      s = addLog(s, 'system', `${card.name}: 💪 +${card.effect.strength} ATK dla ${target.name}`)
    }
  }

  // Weak on enemy (reduces attack)
  if (card.effect.weak && card.target === 'enemy' && targetSlot !== undefined) {
    const target = s.enemyGrid[targetSlot]
    if (target) {
      const eg = [...s.enemyGrid]
      const reduced = Math.max(0, target.attack - card.effect.weak)
      eg[targetSlot] = { ...target, attack: reduced }
      s = { ...s, enemyGrid: eg }
      s = addLog(s, 'system', `${card.name}: 😵 ${target.name} ATK -${card.effect.weak}`)
    }
  }

  // Vulnerable on enemy (reduce shield, increase damage taken — simplified as -2 shield)
  if (card.effect.vulnerable && card.target === 'enemy' && targetSlot !== undefined) {
    const target = s.enemyGrid[targetSlot]
    if (target) {
      const eg = [...s.enemyGrid]
      eg[targetSlot] = { ...target, shield: Math.max(0, target.shield - card.effect.vulnerable) }
      s = { ...s, enemyGrid: eg }
      s = addLog(s, 'system', `${card.name}: 🎯 ${target.name} Vulnerable! Shield -${card.effect.vulnerable}`)
    }
  }

  // Check win
  if (countAlive(s.enemyGrid) === 0) {
    return { ...s, phase: 'won' }
  }

  return s
}

// ---------------------------------------------------------------------------
// Draw card
// ---------------------------------------------------------------------------

export function gridDrawCard(state: GridBattleState): GridBattleState {
  if (state.deck.length === 0 && state.discard.length === 0) return state

  let deck = [...state.deck]
  let discard = [...state.discard]

  if (deck.length === 0) {
    deck = [...discard].sort(() => Math.random() - 0.5)
    discard = []
  }

  const [drawn, ...rest] = deck
  let s = { ...state, hand: [...state.hand, drawn], deck: rest, discard }
  return addLog(s, 'draw', `📥 Dobierasz: ${drawn.emoji} ${drawn.name}`)
}

// ---------------------------------------------------------------------------
// End turn — tick all counters, resolve attacks
// ---------------------------------------------------------------------------

export function gridEndTurn(state: GridBattleState): GridBattleState {
  if (state.phase !== 'play') return state

  let s = { ...state, turn: state.turn + 1 }

  // --- Player counters tick ---
  const pg = [...s.playerGrid]
  for (let i = 0; i < GRID_SLOTS; i++) {
    if (!pg[i]) continue
    const card = pg[i]!

    // Poison tick
    if (card.poison > 0) {
      const { card: after } = applyDmgToCard(card, card.poison)
      s = addLog(s, 'poison', `☠️ Poison: ${card.name} -${card.poison}`, card.poison)
      pg[i] = after ? { ...after, poison: Math.max(0, after.poison - 1) } : null
      if (!after) {
        s = addLog(s, 'death', `💀 ${card.name} zginął od trucizny!`)
        continue
      }
    }

    const c = pg[i]!
    if (c.counter <= 1) {
      // Attack!
      pg[i] = { ...c, counter: c.maxCounter }
      const targetIdx = findTarget(s.enemyGrid, i)
      if (targetIdx !== null && s.enemyGrid[targetIdx]) {
        const target = s.enemyGrid[targetIdx]!
        s = addLog(s, 'attack', `${c.name} ⚔️ → ${target.name}`)
        const { card: after, actualDmg, blocked } = applyDmgToCard(target, c.attack)
        const eg = [...s.enemyGrid]
        if (blocked) {
          s = addLog(s, 'snow', `❄️ ${target.name} zamrożony — atak zablokowany!`)
          eg[targetIdx] = after
        } else {
          s = addLog(s, 'damage', `${c.name} → ${target.name}: -${actualDmg}`, actualDmg)
          if (!after) s = addLog(s, 'death', `💀 ${target.name} pokonany!`)
          // Teeth counterattack
          if (target.teeth > 0 && pg[i]) {
            const teethDmg = target.teeth
            const { card: pAfter } = applyDmgToCard(pg[i]!, teethDmg)
            pg[i] = pAfter
            s = addLog(s, 'teeth', `🦷 ${target.name} Teeth: ${c.name} -${teethDmg}`, teethDmg)
          }
          eg[targetIdx] = after
        }
        s = { ...s, enemyGrid: eg }
      }
    } else {
      pg[i] = { ...c, counter: c.counter - 1 }
    }
  }
  s = { ...s, playerGrid: pg }

  // Check win after player attacks
  if (countAlive(s.enemyGrid) === 0) {
    return { ...s, phase: 'won' }
  }

  // --- Enemy counters tick ---
  const eg = [...s.enemyGrid]
  for (let i = 0; i < GRID_SLOTS; i++) {
    if (!eg[i]) continue
    const card = eg[i]!

    // Poison tick
    if (card.poison > 0) {
      const { card: after } = applyDmgToCard(card, card.poison)
      s = addLog(s, 'poison', `☠️ Poison: ${card.name} -${card.poison}`, card.poison)
      eg[i] = after ? { ...after, poison: Math.max(0, after.poison - 1) } : null
      if (!after) {
        s = addLog(s, 'death', `💀 ${card.name} zginął od trucizny!`)
        continue
      }
    }

    const c = eg[i]!
    if (c.counter <= 1) {
      // Attack player!
      eg[i] = { ...c, counter: c.maxCounter }
      const targetIdx = findTarget(s.playerGrid, i)
      if (targetIdx !== null && s.playerGrid[targetIdx]) {
        const target = s.playerGrid[targetIdx]!
        s = addLog(s, 'attack', `${c.name} ⚔️ → ${target.name}`)
        const { card: after, actualDmg, blocked } = applyDmgToCard(target, c.attack)
        const npg = [...s.playerGrid]
        if (blocked) {
          s = addLog(s, 'snow', `❄️ ${target.name} zamrożony — atak zablokowany!`)
          npg[targetIdx] = after
        } else {
          s = addLog(s, 'damage', `${c.name} → ${target.name}: -${actualDmg}`, actualDmg)
          if (!after) s = addLog(s, 'death', `💀 ${target.name} poległ!`)
          // Teeth
          if (target.teeth > 0 && eg[i]) {
            const teethDmg = target.teeth
            const { card: eAfter } = applyDmgToCard(eg[i]!, teethDmg)
            eg[i] = eAfter
            s = addLog(s, 'teeth', `🦷 ${target.name} Teeth: ${c.name} -${teethDmg}`, teethDmg)
          }
          npg[targetIdx] = after
        }
        s = { ...s, playerGrid: npg }
      }
    } else {
      eg[i] = { ...c, counter: c.counter - 1 }
    }
  }
  s = { ...s, enemyGrid: eg }

  // Check lose (all player cards dead)
  if (countAlive(s.playerGrid) === 0) {
    return { ...s, phase: 'lost' }
  }
  if (countAlive(s.enemyGrid) === 0) {
    return { ...s, phase: 'won' }
  }

  // Reset energy
  s = { ...s, energy: s.maxEnergy }
  s = addLog(s, 'system', `⚔️ Tura ${s.turn}`)

  return s
}
