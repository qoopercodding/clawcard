// MechanicsRegistry — EPIC 2: Engine Analizy Kart
// Rejestr ~15 podstawowych mechanik gry. isImplemented: false = planowane w kolejnych epikach.

export type TriggerType =
  | 'onHit' | 'onKill' | 'onPlay' | 'onDraw' | 'onDeath'
  | 'startOfTurn' | 'endOfTurn' | 'passive'

export type EffectType =
  | 'dealDamage' | 'applyStatus' | 'heal' | 'buff' | 'draw'
  | 'shield' | 'frenzy' | 'redirect' | 'explode' | 'snowBonus'

export interface MechanicDefinition {
  id: string
  label: string
  trigger: TriggerType
  effectType: EffectType
  isImplemented: boolean
  implementedSince?: string
  /** Lowercase keyword fragments used by KeywordParser */
  keywords: string[]
}

export const MECHANICS_REGISTRY: Record<string, MechanicDefinition> = {
  frenzy: {
    id: 'frenzy', label: 'Frenzy',
    trigger: 'passive', effectType: 'frenzy',
    isImplemented: false,
    keywords: ['frenzy', 'attacks.*times', 'attack.*twice', '×\\d', 'x\\d'],
  },
  snow: {
    id: 'snow', label: 'Apply Snow',
    trigger: 'passive', effectType: 'applyStatus',
    isImplemented: false,
    keywords: ['apply.*snow', 'snow.*to', 'give.*snow', 'snow aura', 'snow on'],
  },
  burn: {
    id: 'burn', label: 'Apply Burn',
    trigger: 'passive', effectType: 'applyStatus',
    isImplemented: false,
    keywords: ['apply.*burn', 'burn.*to', 'give.*burn'],
  },
  ink: {
    id: 'ink', label: 'Apply Ink',
    trigger: 'passive', effectType: 'applyStatus',
    isImplemented: false,
    keywords: ['apply.*ink', 'ink.*to', 'give.*ink'],
  },
  spice: {
    id: 'spice', label: 'Apply Spice',
    trigger: 'passive', effectType: 'applyStatus',
    isImplemented: false,
    keywords: ['apply.*spice', 'spice.*to', 'give.*spice'],
  },
  onHit: {
    id: 'onHit', label: 'On-Hit Trigger',
    trigger: 'onHit', effectType: 'dealDamage',
    isImplemented: false,
    keywords: ['when hit', 'on hit', 'when struck'],
  },
  onKill: {
    id: 'onKill', label: 'On-Kill Trigger',
    trigger: 'onKill', effectType: 'dealDamage',
    isImplemented: false,
    keywords: ['on kill', 'when killed', 'on killing', 'on death of'],
  },
  onDeath: {
    id: 'onDeath', label: 'On-Death Effect',
    trigger: 'onDeath', effectType: 'explode',
    isImplemented: false,
    keywords: ['when scrapped', 'on scrap', 'when destroyed', 'death:', 'on death'],
  },
  startOfTurn: {
    id: 'startOfTurn', label: 'Start-of-Turn Effect',
    trigger: 'startOfTurn', effectType: 'applyStatus',
    isImplemented: false,
    keywords: ['start of.*turn', 'at the start of', 'each turn,', 'start of each'],
  },
  shield: {
    id: 'shield', label: 'Shield',
    trigger: 'passive', effectType: 'shield',
    isImplemented: false,
    keywords: ['shield', 'give.*shield', 'apply.*shield'],
  },
  heal: {
    id: 'heal', label: 'Heal',
    trigger: 'passive', effectType: 'heal',
    isImplemented: false,
    keywords: ['heal', 'restore.*hp', 'recover.*hp', 'restore.*health', 'heal.*ally', 'heal.*health'],
  },
  draw: {
    id: 'draw', label: 'Draw Card',
    trigger: 'passive', effectType: 'draw',
    isImplemented: false,
    keywords: ['draw \\d', 'draw a card', 'draw one', 'draw cards'],
  },
  smackback: {
    id: 'smackback', label: 'Smackback',
    trigger: 'onHit', effectType: 'dealDamage',
    isImplemented: false,
    keywords: ['smackback'],
  },
  teeth: {
    id: 'teeth', label: 'Teeth',
    trigger: 'onHit', effectType: 'dealDamage',
    isImplemented: false,
    keywords: ['teeth'],
  },
  attackBuff: {
    id: 'attackBuff', label: 'Attack Buff',
    trigger: 'passive', effectType: 'buff',
    isImplemented: false,
    keywords: ['\\+\\d+.*attack', 'gain.*attack', '\\+\\d+.*atk', 'gain.*atk', 'attack.*permanently', 'increase.*attack'],
  },
  snowBonus: {
    id: 'snowBonus', label: 'Snow Bonus Damage',
    trigger: 'passive', effectType: 'snowBonus',
    isImplemented: false,
    keywords: ["snow'd target", 'bonus.*snow', 'damage.*snow', 'snow.*damage'],
  },
}

export function getMechanic(id: string): MechanicDefinition | undefined {
  return MECHANICS_REGISTRY[id]
}

export function getAllMechanics(): MechanicDefinition[] {
  return Object.values(MECHANICS_REGISTRY)
}
