#!/usr/bin/env node

/**
 * Slay the Spire card scraper — uses MediaWiki API from slay-the-spire.fandom.com
 * Usage: node scrape-sts.mjs [--output cards.json]
 */

const WIKI_API = 'https://slay-the-spire.fandom.com/api.php'

const CATEGORIES = [
  'Ironclad_Cards',
  'Silent_Cards',
  'Defect_Cards',
  'Watcher_Cards',
  'Colorless_Cards',
  'Curse_Cards',
  'Status_Cards',
]

async function fetchCategoryMembers(category, cmcontinue = '') {
  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${category}`,
    cmlimit: '500',
    format: 'json',
  })
  if (cmcontinue) params.set('cmcontinue', cmcontinue)

  const res = await fetch(`${WIKI_API}?${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchPageContent(titles) {
  const params = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    format: 'json',
  })

  const res = await fetch(`${WIKI_API}?${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

function parseInfobox(wikitext) {
  const card = {}

  const fieldRegex = /\|\s*(\w+)\s*=\s*(.+)/g
  let match
  while ((match = fieldRegex.exec(wikitext)) !== null) {
    const key = match[1].trim().toLowerCase()
    const value = match[2].trim()
      .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, link, label) => label || link)
      .replace(/'''(.+?)'''/g, '$1')
      .replace(/''(.+?)''/g, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .trim()

    if (value) card[key] = value
  }

  return card
}

async function getAllCardsInCategory(category) {
  const pages = []
  let cmcontinue = ''

  do {
    const data = await fetchCategoryMembers(category, cmcontinue)
    const members = data.query?.categorymembers || []
    pages.push(...members.map(m => m.title))
    cmcontinue = data.continue?.cmcontinue || ''
  } while (cmcontinue)

  return pages
}

async function scrapeAll() {
  const allCards = []
  const seen = new Set()

  for (const category of CATEGORIES) {
    console.log(`Fetching category: ${category}...`)
    const titles = await getAllCardsInCategory(category)
    console.log(`  Found ${titles.length} pages`)

    // Fetch in batches of 20 (MediaWiki limit)
    for (let i = 0; i < titles.length; i += 20) {
      const batch = titles.slice(i, i + 20)
      const data = await fetchPageContent(batch)
      const pages = data.query?.pages || {}

      for (const page of Object.values(pages)) {
        if (seen.has(page.title)) continue
        seen.add(page.title)

        const content = page.revisions?.[0]?.slots?.main?.['*'] || ''
        if (!content) continue

        const card = parseInfobox(content)
        card._title = page.title
        card._category = category.replace('_Cards', '')
        allCards.push(card)
      }
    }

    // small delay between categories
    await new Promise(r => setTimeout(r, 500))
  }

  return allCards
}

// --- Main ---
const outputFlag = process.argv.indexOf('--output')
const outputFile = outputFlag !== -1 ? process.argv[outputFlag + 1] : 'sts-cards.json'

console.log('Slay the Spire Card Scraper (MediaWiki API)')
console.log('============================================')

scrapeAll()
  .then(async cards => {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(outputFile, JSON.stringify(cards, null, 2))
    console.log(`\nDone! Scraped ${cards.length} cards → ${outputFile}`)
  })
  .catch(err => {
    console.error('Scrape failed:', err.message)
    process.exit(1)
  })
