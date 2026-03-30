// Ostatni Język — typy
export type Faction = 'niemowi' | 'gawedziarze' | 'echoludzie'
export type Dialect = Faction
export type Position = 'front' | 'mid' | 'back'
export type TargetType = 'single' | 'all' | 'random' | 'self'
export type EnemyIntent = 'attack' | 'defend' | 'special' | 'skip'

export type Keyword =
  | { type: 'lifesteal'; value: number; percent?: boolean }
  | { type: 'block'; value: number; hard?: boolean; reflect?: boolean }
  | { type: 'frost'; stacks: number; deep?: boolean }
  | { type: 'poison'; stacks: number; plague?: boolean }
  | { type: 'echo'; precise?: boolean; count?: number }
  | { type: 'weaken'; value: number; permanent?: boolean }
  | { type: 'strengthen'; value: number; all?: boolean }
  | { type: 'pierce'; rend?: boolean }
  | { type: 'pull'; positions: number }
  | { type: 'push'; positions: number }
  | { type: 'root'; duration: number }
  | { type: 'exhaust' }
  | { type: 'discover' }
  | { type: 'void' }
  | { type: 'invert' }
  | { type: 'silence' }
  | { type: 'name' }
  | { type: 'doubleWord' }
  | { type: 'pastEcho' }

export interface Effect {
  damage?: number
  heal?: number
  applyKeywords?: Keyword[]
  drawCards?: number
  drawWords?: number
  movePosition?: Position
  targetType: TargetType
  silentToHiveMind?: boolean
  delayedWord?: Keyword
}

export interface ResolvedEffect extends Effect {
  multiplier?: number
  inverted?: boolean
  exhaustCard?: boolean
}

export interface LLCard {
  id: string
  name: string
  cost: number
  type: 'action' | 'relic'
  keywords: Keyword[]
  baseEffect: Effect
  exhaustOnPlay: boolean
  flavorText: string
  art: string
  faction: Faction
}

export interface LLWord {
  id: string
  name: string
  keyword: Keyword
  dialect: Dialect
  flavorText: string
}

export interface ActiveEffect {
  keyword: Keyword
  stacks: number
  duration?: number
}

export interface PlayerState {
  hp: number
  maxHp: number
  block: number
  hardBlock: number
  position: Position
  activeEffects: ActiveEffect[]
  tabulaMarks: number
}

export interface EnemyState {
  id: string
  name?: string
  hp: number
  maxHp: number
  block: number
  position: Position
  counter: number
  counterMax: number
  activeEffects: ActiveEffect[]
  faction: Faction
  intent: EnemyIntent
  damage: number
  adaptations: Keyword[]
}

export interface LLBattleState {
  player: PlayerState
  enemies: EnemyState[]
  hand: LLCard[]
  wordHand: LLWord[]
  deck: LLCard[]
  wordDeck: LLWord[]
  discardPile: LLCard[]
  forgottenWords: LLWord[]
  actionsRemaining: number
  maxActions: number
  tabulaMarks: number
  turn: number
  lastPlayedEffect: Effect | null
  hiveMindMemory: Keyword[]
  pendingDelayedWord?: Keyword
  log: string[]
}
