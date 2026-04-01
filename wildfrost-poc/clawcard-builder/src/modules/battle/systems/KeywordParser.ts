// KeywordParser — EPIC 2: Engine Analizy Kart
// Parsuje opis karty i wyciąga mechaniki przez regex/keywords.

import { MECHANICS_REGISTRY, type MechanicDefinition } from './MechanicsRegistry'

export interface ParsedMechanic {
  mechanicId: string
  mechanic: MechanicDefinition
  amount?: number
  rawMatch: string
}

// Patterns that extract a numeric amount alongside the mechanic
const AMOUNT_PATTERNS: Array<{ pattern: RegExp; mechanicId: string }> = [
  { pattern: /(?:apply|give)\s+(\d+)\s+snow/i,   mechanicId: 'snow' },
  { pattern: /(?:apply|give)\s+(\d+)\s+burn/i,   mechanicId: 'burn' },
  { pattern: /(?:apply|give)\s+(\d+)\s+ink/i,    mechanicId: 'ink' },
  { pattern: /(?:apply|give)\s+(\d+)\s+spice/i,  mechanicId: 'spice' },
  { pattern: /(?:apply|give)\s+(\d+)\s+shield/i, mechanicId: 'shield' },
  { pattern: /frenzy\s*[×x]\s*(\d+)/i,           mechanicId: 'frenzy' },
  { pattern: /[×x](\d+)\s+frenzy/i,              mechanicId: 'frenzy' },
  { pattern: /[×x](\d+)/,                         mechanicId: 'frenzy' },
  { pattern: /draw\s+(\d+)/i,                     mechanicId: 'draw' },
  { pattern: /restore\s+(\d+)\s+hp/i,             mechanicId: 'heal' },
  { pattern: /heal.*?(\d+)/i,                     mechanicId: 'heal' },
  { pattern: /shield\s+(\d+)/i,                   mechanicId: 'shield' },
  { pattern: /\+(\d+)\s*(?:attack|atk)/i,         mechanicId: 'attackBuff' },
  { pattern: /teeth\s+(\d+)/i,                    mechanicId: 'teeth' },
]

/**
 * Parses a card description and returns a deduplicated list of matched mechanics.
 * @example
 * parseKeywords("×3 Frenzy — attacks 3 times per trigger.")
 * // → [{ mechanicId: 'frenzy', amount: 3, rawMatch: '×3' }]
 */
export function parseKeywords(description: string): ParsedMechanic[] {
  const lower = description.toLowerCase()
  const found = new Map<string, ParsedMechanic>()

  // 1. Try amount patterns first (more specific)
  for (const { pattern, mechanicId } of AMOUNT_PATTERNS) {
    const match = description.match(pattern)
    if (match && !found.has(mechanicId)) {
      const mechanic = MECHANICS_REGISTRY[mechanicId]
      if (mechanic) {
        found.set(mechanicId, {
          mechanicId,
          mechanic,
          amount: parseInt(match[1], 10),
          rawMatch: match[0],
        })
      }
    }
  }

  // 2. Keyword-based scan for mechanics not yet matched
  for (const mechanic of Object.values(MECHANICS_REGISTRY)) {
    if (found.has(mechanic.id)) continue
    for (const kw of mechanic.keywords) {
      try {
        const re = new RegExp(kw, 'i')
        if (re.test(lower)) {
          found.set(mechanic.id, {
            mechanicId: mechanic.id,
            mechanic,
            rawMatch: kw,
          })
          break
        }
      } catch {
        // malformed regex in keywords — skip
      }
    }
  }

  return Array.from(found.values())
}
