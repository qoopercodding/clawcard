#!/usr/bin/env node

/**
 * Slay the Spire card scraper — parses Module:Cards/data from fandom wiki
 * Usage: node scrape-sts.mjs [--output cards.json]
 */

const WIKI_API = 'https://slay-the-spire.fandom.com/api.php'

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
  // Match each card block: { Name = "...", ... }
  const cardPattern = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
  let match

  while ((match = cardPattern.exec(lua)) !== null) {
    const block = match[1]
    const card = {}

    // Parse string fields: Key = "value"
    const strField = /(\w+)\s*=\s*"([^"]*)"/g
    let fm
    while ((fm = strField.exec(block)) !== null) {
      card[fm[1].toLowerCase()] = fm[2]
    }

    // Parse number fields: Key = 123
    const numField = /(\w+)\s*=\s*(\d+)\s*[,\n}]/g
    while ((fm = numField.exec(block)) !== null) {
      card[fm[1].toLowerCase()] = parseInt(fm[2], 10)
    }

    // Parse traits: Traits = {"foo", "bar"}
    const traitsMatch = block.match(/Traits\s*=\s*\{([^}]*)\}/)
    if (traitsMatch) {
      const traits = traitsMatch[1].match(/"([^"]+)"/g)
      card.traits = traits ? traits.map(t => t.replace(/"/g, '')) : []
    }

    if (card.name) {
      card._source = 'slay_the_spire'
      card._category = card.color || 'Unknown'
      // Clean text field — convert wiki markup
      if (card.text) {
        card.text = card.text
          .replace(/#(\w+)/g, '$1')  // Remove # prefix from keywords
          .replace(/\[([^|[\]]+)\|([^[\]]+)\]/g, '$1/$2')  // [base|upgraded] → base/upgraded
          .replace(/\[([^[\]]+)\|/g, '$1')  // [value| → value
          .replace(/\|([^[\]]+)\]/g, '$1')  // |value] → value
          .replace(/\\n/g, '\n')
      }
      cards.push(card)
    }
  }

  return cards
}

async function fetchImageUrls(cardNames) {
  const imageMap = {}
  const BATCH = 50
  for (let i = 0; i < cardNames.length; i += BATCH) {
    const batch = cardNames.slice(i, i + BATCH)
    const titles = batch.join('|')
    const params = new URLSearchParams({
      action: 'query',
      titles,
      prop: 'pageimages',
      pithumbsize: '400',
      format: 'json',
    })
    try {
      const res = await fetch(`${WIKI_API}?${params}`)
      if (!res.ok) continue
      const data = await res.json()
      for (const page of Object.values(data.query.pages)) {
        if (page.thumbnail?.source) {
          imageMap[page.title] = page.thumbnail.source
        }
      }
    } catch { /* skip batch on error */ }
    if (i + BATCH < cardNames.length) await new Promise(r => setTimeout(r, 500))
  }
  return imageMap
}

// --- Main ---
const outputFlag = process.argv.indexOf('--output')
const outputFile = outputFlag !== -1 ? process.argv[outputFlag + 1] : 'sts-cards.json'

console.log('Slay the Spire Card Scraper (Module:Cards/data + images)')
console.log('========================================================')

try {
  console.log('Fetching Module:Cards/data...')
  const lua = await fetchLuaModule('Module:Cards/data')
  console.log(`  Module size: ${(lua.length / 1024).toFixed(1)}KB`)

  const cards = parseLuaCardData(lua)
  console.log(`  Parsed ${cards.length} cards`)

  console.log('\nFetching card images via pageimages API...')
  const imageMap = await fetchImageUrls(cards.map(c => c.name))
  let imgCount = 0
  for (const card of cards) {
    if (imageMap[card.name]) {
      card.image = imageMap[card.name]
      imgCount++
    }
  }
  console.log(`  Found images for ${imgCount}/${cards.length} cards`)

  const byColor = {}
  for (const c of cards) {
    const col = c._category || 'Unknown'
    byColor[col] = (byColor[col] || 0) + 1
  }
  console.log('\n  Cards by class:')
  for (const [k, v] of Object.entries(byColor).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k}: ${v}`)
  }

  const { writeFile } = await import('node:fs/promises')
  await writeFile(outputFile, JSON.stringify(cards, null, 2))
  console.log(`\nDone! → ${outputFile}`)
} catch (err) {
  console.error('Scrape failed:', err.message)
  process.exit(1)
}
