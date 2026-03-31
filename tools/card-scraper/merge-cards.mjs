#!/usr/bin/env node

/**
 * Merge all scraped card libraries into a single card_library.json
 * Usage: node merge-cards.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'

function normalizeId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

async function loadJSON(path) {
  try {
    return JSON.parse(await readFile(path, 'utf-8'))
  } catch {
    console.warn(`  Warning: could not load ${path}`)
    return []
  }
}

function normalizeSts(cards) {
  return cards.map(c => ({
    id: `sts_${normalizeId(c.name)}`,
    name: c.name,
    source: 'slay_the_spire',
    category: c.color || c._category || 'Unknown',
    type: c.type || 'Unknown',
    rarity: c.rarity || 'Unknown',
    cost: c.cost ?? null,
    description: c.text || '',
    traits: c.traits || [],
    image: c.image?.startsWith('http') ? c.image : c.image ? `https://slay-the-spire.fandom.com/wiki/Special:FilePath/${c.image}` : null,
  }))
}

function normalizeMt(cards) {
  return cards.map(c => ({
    id: `mt_${normalizeId(c.name)}`,
    name: c.name,
    source: 'monster_train',
    category: c.clan || c._category || 'Unknown',
    type: c.type || 'Unknown',
    rarity: c.rarity || 'Unknown',
    cost: c.cost ?? null,
    attack: c.attack ?? null,
    health: c.health ?? null,
    description: c.desc || '',
    tags: c.tags || [],
    image: c.image || null,
  }))
}

function normalizeWildfrost(cards) {
  return cards.map(c => ({
    id: `wf_${normalizeId(c.name || c._key)}`,
    name: c.name || c._key,
    source: 'wildfrost',
    category: c.card_type || (c.types?.[0]) || 'Unknown',
    type: c.card_type || 'Companion',
    rarity: 'Unknown',
    cost: null,
    attack: c.attack ?? null,
    health: c.health ?? null,
    counter: c.counter ?? null,
    description: c.desc || '',
    image: c.image_art_url || null,
  }))
}

// --- Main ---
console.log('Card Library Merger')
console.log('===================')

const sts = await loadJSON('sts-cards.json')
console.log(`  StS: ${sts.length} cards`)

const mt = await loadJSON('mt-cards.json')
console.log(`  Monster Train: ${mt.length} cards`)

const wf = await loadJSON('../../wildfrost_data/wildfrost_cards.json')
console.log(`  Wildfrost: ${wf.length} cards`)

const merged = [
  ...normalizeSts(sts),
  ...normalizeMt(mt),
  ...normalizeWildfrost(wf),
]

// Deduplicate by id
const seen = new Set()
const unique = merged.filter(c => {
  if (seen.has(c.id)) return false
  seen.add(c.id)
  return true
})

console.log(`\n  Total merged: ${unique.length} cards`)
console.log(`  By source:`)
const bySource = {}
for (const c of unique) {
  bySource[c.source] = (bySource[c.source] || 0) + 1
}
for (const [k, v] of Object.entries(bySource)) {
  console.log(`    ${k}: ${v}`)
}

const outputPath = '../../wildfrost-poc/clawcard-builder/src/data/cardLibrary.json'
await writeFile(outputPath, JSON.stringify(unique, null, 2))
console.log(`\nDone! → ${outputPath}`)
