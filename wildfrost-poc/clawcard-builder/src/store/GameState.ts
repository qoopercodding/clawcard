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
  | 'rest'
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

export interface DeckState {
  cards: HandCard[]
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

export interface RunState {
  id: string
  seed: number
  started: number   // timestamp
  player: PlayerState
  deck: DeckState
  map: MapState
  battle: BattleSnapshot | null  // null when not in combat
  floor: number
  gold: number
  score: number
  status: 'active' | 'won' | 'lost' | 'abandoned'
}

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
      cards: [],
      drawPile: [],
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
    battle: null,
    floor: 0,
    gold: 0,
    score: 0,
    status: 'active',
  }
}
