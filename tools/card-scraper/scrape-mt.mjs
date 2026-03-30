#!/usr/bin/env node

/**
 * Monster Train card scraper — parses Module:Cards/Data from fandom wiki
 * Usage: node scrape-mt.mjs [--output mt-cards.json]
 */

const WIKI_API = 'https://monster-train.fandom.com/api.php'

async function fetchLuaModule(title) {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    format: 'json',
  })
  const res = await fetch(`${WIKI_API}?${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  const page = Object.values(data.query.pages)[0]
  return page.revisions?.[0]?.slots?.main?.['*'] || ''
}

function parseLuaCardData(lua) {
  const cards = []

  // Match: cards["Name"] = { ... }
  const cardPattern = /cards\["([^"]+)"\]\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g
  let match

  while ((match = cardPattern.exec(lua)) !== null) {
    const name = match[1]
    const block = match[2]
    const card = { name }

    // Parse string fields: Key = "value"
    const strField = /(\w+)\s*=\s*"([^"]*)"/g
    let fm
    while ((fm = strField.exec(block)) !== null) {
      card[fm[1].toLowerCase()] = fm[2]
    }

    // Parse number fields: Key = number
    const numField = /(\w+)\s*=\s*(\d+)\s*[,\n}]/g
    while ((fm = numField.exec(block)) !== null) {
      card[fm[1].toLowerCase()] = parseInt(fm[2], 10)
    }

    // Parse tags: Tags = { "foo", "bar" }
    const tagsMatch = block.match(/Tags\s*=\s*\{([^}]*)\}/)
    if (tagsMatch) {
      const tags = tagsMatch[1].match(/"([^"]+)"/g)
      card.tags = tags ? tags.map(t => t.replace(/"/g, '')) : []
    }

    // Clean desc field
    if (card.desc) {
      card.desc = card.desc
        .replace(/'''([^']+)'''/g, '$1')   // Bold
        .replace(/''([^']+)''/g, '$1')     // Italic
        .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, l, t) => t || l) // Wiki links
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\{\{Value\|([^|}]+)\|?[^}]*\}\}/g, '$1') // {{Value|text|icon}}
        .replace(/\[(\w+)\]/g, '$1')       // [Attack] icons
    }

    card._source = 'monster_train'
    card._category = card.clan || 'Unknown'
    cards.push(card)
  }

  return cards
}

// --- Main ---
const outputFlag = process.argv.indexOf('--output')
const outputFile = outputFlag !== -1 ? process.argv[outputFlag + 1] : 'mt-cards.json'

console.log('Monster Train Card Scraper (Module:Cards/Data)')
console.log('===============================================')

try {
  console.log('Fetching Module:Cards/Data...')
  const lua = await fetchLuaModule('Module:Cards/Data')
  console.log(`  Module size: ${(lua.length / 1024).toFixed(1)}KB`)

  const cards = parseLuaCardData(lua)
  console.log(`  Parsed ${cards.length} cards`)

  const byClan = {}
  for (const c of cards) {
    const clan = c._category || 'Unknown'
    byClan[clan] = (byClan[clan] || 0) + 1
  }
  console.log('\n  Cards by clan:')
  for (const [k, v] of Object.entries(byClan).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k}: ${v}`)
  }

  const { writeFile } = await import('node:fs/promises')
  await writeFile(outputFile, JSON.stringify(cards, null, 2))
  console.log(`\nDone! → ${outputFile}`)
} catch (err) {
  console.error('Scrape failed:', err.message)
  process.exit(1)
}
