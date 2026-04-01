// CardAnalyzer — EPIC 2: Engine Analizy Kart
// analyze(card) i analyzeAll(cards) — pipeline analizy kart.

import { type AnyBattleCard } from '../types/cards'
import { getAllMechanics, MECHANICS_REGISTRY, type MechanicDefinition } from './MechanicsRegistry'
import { parseKeywords, type ParsedMechanic } from './KeywordParser'

// ─── Result types ─────────────────────────────────────────────────────────────

export type ReadinessStatus = 'ready' | 'partial' | 'missing'

export interface AnalysisResult {
  cardId: string
  cardName: string
  cardType: string
  parsedMechanics: ParsedMechanic[]
  implementedMechanics: MechanicDefinition[]
  missingMechanics: MechanicDefinition[]
  /** Mechanic IDs from description that aren't in the registry at all */
  needsWikiResearch: string[]
  readyToPlay: boolean
  status: ReadinessStatus
}

export interface MechanicFrequency {
  mechanicId: string
  label: string
  cardCount: number
  isImplemented: boolean
}

export interface AnalysisReport {
  totalCards: number
  readyCount: number
  partialCount: number
  missingCount: number
  /** Sorted descending by cardCount */
  mechanicFrequency: MechanicFrequency[]
  readyCardIds: string[]
  results: AnalysisResult[]
}

// ─── CardAnalyzer ─────────────────────────────────────────────────────────────

export class CardAnalyzer {
  /**
   * Analyzes a single card and returns its readiness breakdown.
   * @example
   * const result = new CardAnalyzer().analyze(foxeeCard)
   * // result.missingMechanics → [{ id: 'frenzy', ... }]
   * // result.readyToPlay → false
   */
  analyze(card: AnyBattleCard): AnalysisResult {
    const parsed = parseKeywords(card.description)
    const allMechanics = getAllMechanics()

    // Also check abilities for known mechanic IDs
    const abilityMechanicIds = new Set<string>()
    if ('abilities' in card) {
      for (const ability of (card as { abilities: Array<{ id: string }> }).abilities) {
        if (ability.id in MECHANICS_REGISTRY) {
          abilityMechanicIds.add(ability.id)
        }
      }
    }

    // Merge parsed + ability mechanics
    const allParsedIds = new Set(parsed.map(p => p.mechanicId))
    for (const id of abilityMechanicIds) {
      if (!allParsedIds.has(id)) {
        const mechanic = allMechanics.find(m => m.id === id)
        if (mechanic) {
          parsed.push({ mechanicId: id, mechanic, rawMatch: `ability:${id}` })
          allParsedIds.add(id)
        }
      }
    }

    const implementedMechanics = parsed
      .filter(p => p.mechanic.isImplemented)
      .map(p => p.mechanic)

    const missingMechanics = parsed
      .filter(p => !p.mechanic.isImplemented)
      .map(p => p.mechanic)

    const readyToPlay = parsed.length === 0 || missingMechanics.length === 0

    let status: ReadinessStatus
    if (parsed.length === 0) {
      // No special mechanics — simple card, ready
      status = 'ready'
    } else if (missingMechanics.length === 0) {
      status = 'ready'
    } else if (implementedMechanics.length > 0) {
      status = 'partial'
    } else {
      status = 'missing'
    }

    return {
      cardId: card.id,
      cardName: card.name,
      cardType: card.cardType,
      parsedMechanics: parsed,
      implementedMechanics,
      missingMechanics,
      needsWikiResearch: [],
      readyToPlay,
      status,
    }
  }
}

// ─── Batch analyzer ───────────────────────────────────────────────────────────

/**
 * Processes all cards and returns a full analysis report.
 * @example
 * const report = analyzeAll(SHOWCASE_CARDS)
 * // report.mechanicFrequency[0] → { mechanicId: 'snow', cardCount: 4 }
 */
export function analyzeAll(cards: AnyBattleCard[]): AnalysisReport {
  const analyzer = new CardAnalyzer()
  const results = cards.map(c => analyzer.analyze(c))

  const readyCount   = results.filter(r => r.status === 'ready').length
  const partialCount = results.filter(r => r.status === 'partial').length
  const missingCount = results.filter(r => r.status === 'missing').length

  // Mechanic frequency map
  const freqMap = new Map<string, MechanicFrequency>()
  for (const result of results) {
    for (const p of result.parsedMechanics) {
      const existing = freqMap.get(p.mechanicId)
      if (existing) {
        existing.cardCount++
      } else {
        freqMap.set(p.mechanicId, {
          mechanicId: p.mechanicId,
          label: p.mechanic.label,
          cardCount: 1,
          isImplemented: p.mechanic.isImplemented,
        })
      }
    }
  }

  const mechanicFrequency = Array.from(freqMap.values())
    .sort((a, b) => b.cardCount - a.cardCount)

  const readyCardIds = results.filter(r => r.readyToPlay).map(r => r.cardId)

  return {
    totalCards: cards.length,
    readyCount,
    partialCount,
    missingCount,
    mechanicFrequency,
    readyCardIds,
    results,
  }
}
