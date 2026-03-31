import type { BattleCard, HandCard, Phase } from '../modules/battle-demo/battleEngine'
import type { TribeType } from '../types/card.types'

// =============================================================================
// GameState.ts — Central RunState interface
// =============================================================================
//
// Single source of truth for a roguelike run. Consumed by battle, map,
// deck-building, and shop screens. Pure data — no logic here.
// =============================================================================

export type MapNodeType =
  | 'combat'
  | 'elite'
  | 'boss'
  | 'shop'
  | 'campfire'
  | 'event'
  | 'treasure'

export interface MapNode {
  id: string
  type: MapNodeType
  row: number
  col: number
  connections: string[] // ids of reachable next nodes
  visited: boolean
  cleared: boolean
}

export interface MapState {
  nodes: MapNode[]
  currentNodeId: string | null
  seed: number
  floor: number     // current row/depth (0 = start)
  maxFloor: number  // boss row
}

export interface RunCard {
  id: string
  name: string
  emoji: string
  cost: number
  attack: number
  hp: number
  description: string
  rarity: 'common' | 'uncommon' | 'rare'
  upgraded: boolean
}

export interface Potion {
  id: string
  name: string
  emoji: string
  description: string
  effect: 'heal' | 'energy' | 'damage' | 'block' | 'draw'
  value: number
}

export interface Relic {
  id: string
  name: string
  emoji: string
  description: string
}

export interface DeckState {
  cards: RunCard[]
  drawPile: string[]    // card ids
  hand: string[]
  discardPile: string[]
}

export interface PlayerState {
  name: string
  tribe: TribeType
  hp: number
  maxHp: number
  gold: number
  leader: BattleCard | null
  companions: BattleCard[]
}

export interface BattleSnapshot {
  phase: Phase
  turn: number
  playerBoard: (BattleCard | null)[]  // grid slots
  enemyBoard: (BattleCard | null)[]
  hand: HandCard[]
  drawPile: HandCard[]
  discardPile: HandCard[]
  energy: number
  maxEnergy: number
}

export type BattleState = BattleSnapshot

export interface RunState {
  id: string
  seed: number
  started: number   // timestamp
  player: PlayerState
  deck: DeckState
  potions: Potion[]
  relics: Relic[]
  map: MapState
  battle: BattleSnapshot | null  // null when not in combat
  floor: number
  gold: number
  score: number
  status: 'active' | 'won' | 'lost' | 'abandoned'
}

const STARTER_DECK: RunCard[] = [
  { id: 'sk1', name: 'Strike', emoji: '🗡️', cost: 1, attack: 6, hp: 0, description: 'Deal 6 damage.', rarity: 'common', upgraded: false },
  { id: 'sk2', name: 'Strike', emoji: '🗡️', cost: 1, attack: 6, hp: 0, description: 'Deal 6 damage.', rarity: 'common', upgraded: false },
  { id: 'sk3', name: 'Strike', emoji: '🗡️', cost: 1, attack: 6, hp: 0, description: 'Deal 6 damage.', rarity: 'common', upgraded: false },
  { id: 'df1', name: 'Defend', emoji: '🛡️', cost: 1, attack: 0, hp: 0, description: 'Gain 5 block.', rarity: 'common', upgraded: false },
  { id: 'df2', name: 'Defend', emoji: '🛡️', cost: 1, attack: 0, hp: 0, description: 'Gain 5 block.', rarity: 'common', upgraded: false },
  { id: 'df3', name: 'Defend', emoji: '🛡️', cost: 1, attack: 0, hp: 0, description: 'Gain 5 block.', rarity: 'common', upgraded: false },
  { id: 'ew1', name: 'Ember Wisp', emoji: '🔥', cost: 1, attack: 3, hp: 3, description: '3 ATK / 3 HP companion.', rarity: 'common', upgraded: false },
  { id: 'fb1', name: 'Frostbite', emoji: '❄️', cost: 1, attack: 2, hp: 0, description: 'Deal 2 damage. Apply Snow 2.', rarity: 'common', upgraded: false },
]

export function createInitialRunState(seed?: number): RunState {
  const s = seed ?? Math.floor(Math.random() * 1_000_000)
  return {
    id: crypto.randomUUID(),
    seed: s,
    started: Date.now(),
    player: {
      name: 'Adventurer',
      tribe: 'snowdwellers',
      hp: 30,
      maxHp: 30,
      gold: 0,
      leader: null,
      companions: [],
    },
    deck: {
      cards: [...STARTER_DECK],
      drawPile: STARTER_DECK.map(c => c.id),
      hand: [],
      discardPile: [],
    },
    map: {
      nodes: [],
      currentNodeId: null,
      seed: s,
      floor: 0,
      maxFloor: 10,
    },
    potions: [],
    relics: [],
    battle: null,
    floor: 0,
    gold: 0,
    score: 0,
    status: 'active',
  }
}
