export type CardType =
  | 'companion'
  | 'item_with_attack'
  | 'item_without_attack'
  | 'clunker'
  | 'shade'
  | 'charm'
  | 'boss'
  | 'transformer'
  | 'testets'
  | 'test2'

export type TribeType =
  | 'snowdwellers'
  | 'shademancers'
  | 'clunkmasters'
  | 'transformers'
  | 'none'

export type Keyword =
  | 'frenzy'
  | 'smackback'
  | 'consume'
  | 'teeth'
  | 'bom'
  | 'overburn'
  | 'ink'
  | 'transform'
  | 'overheat'

export interface CardBase {
  id: string
  name: string
  type: CardType
  tribe: TribeType
  imageUrl: string | null
  imageFallback: string
  description: string
  createdAt: number
}

export interface Ability {
  id: string
  label: string
  description: string
  value?: number
}

export interface ItemEffect {
  damage?: number
  heal?: number
  snow?: number
  shield?: number
  overburn?: number
}

export interface CharmEffect {
  addAttack?: number
  addHp?: number
  addCounter?: number
  addAbility?: Ability
  addKeyword?: Keyword
}

/** Companion — główna karta gracza */
export interface CompanionCard extends CardBase {
  type: 'companion'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

/** Item z atakiem (ramka z mieczem) */
export interface ItemCard extends CardBase {
  type: 'item_with_attack' | 'item_without_attack'
  effect: ItemEffect
  target: 'enemy' | 'ally' | 'all_enemies' | 'all_allies'
  consume: boolean
}

/** Clunker — mechaniczna jednostka */
export interface ClunkerCard extends CardBase {
  type: 'clunker'
  scrap: number
  attack: number
  counter: number
  abilities: Ability[]
}

/** Shade — przywołana jednostka */
export interface ShadeCard extends CardBase {
  type: 'shade'
  hp: number
  attack: number
  counter: number
  decayOnTrigger: boolean
  summonedBy: string
}

/** Charm — ulepszenie karty */
export interface CharmCard extends CardBase {
  type: 'charm'
  effect: CharmEffect
  compatibleWith: CardType[]
}

/** Boss — silny przeciwnik */
export interface BossCard extends CardBase {
  type: 'boss'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

/**
 * Transformer — specjalny typ Bongo Transformerów
 * Mechanika Transform: gdy HP < 50% zmienia formę (ATK ×2, counter reset do 1)
 * transformThreshold: próg HP (domyślnie 0.5 = 50%)
 * transformedAttack: ATK po transformacji
 */
export interface TransformerCard extends CardBase {
  type: 'transformer'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
  transformThreshold: number   // 0.0 - 1.0, np. 0.5 = 50% HP
  transformedAttack: number    // ATK po transformacji
  transformed: boolean         // czy już w trybie transformed
}

/** Testets — typ testowy */
export interface TestetsCard extends CardBase {
  type: 'testets'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

/** Test2 — typ testowy 2 */
export interface Test2Card extends CardBase {
  type: 'test2'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

/** Test3 — dodany przez Frame Editor */
export interface Test3Card extends CardBase {
  type: 'test3'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

export type AnyCard =
  | CompanionCard
  | ItemCard
  | ClunkerCard
  | ShadeCard
  | CharmCard
  | BossCard
  | TransformerCard
  | TestetsCard
  | Test2Card
  | Test3Card
