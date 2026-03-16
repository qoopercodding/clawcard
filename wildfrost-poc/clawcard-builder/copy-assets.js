// copy-assets.js — uruchom: node copy-assets.js
// Kopiuje obrazki z wildfrost_data do public/cards/ i ramkę do public/frames/
const fs   = require('fs')
const path = require('path')

const SRC_IMAGES = path.resolve('C:/Users/Qoope/godot_projects/clawcard_base/wildfrost_data/images')
const SRC_FRAME  = path.resolve('C:/Users/Qoope/godot_projects/clawcard_base/wildfrost-poc/Companion Frame.png')
const DEST_CARDS  = path.resolve(__dirname, 'public/cards')
const DEST_FRAMES = path.resolve(__dirname, 'public/frames')

fs.mkdirSync(DEST_CARDS,  { recursive: true })
fs.mkdirSync(DEST_FRAMES, { recursive: true })

// Kopiuj ramkę
fs.copyFileSync(SRC_FRAME, path.join(DEST_FRAMES, 'Companion Frame.png'))
console.log('✓ Companion Frame.png')

// Kopiuj obrazki kart (tylko .png, bez .import)
const files = fs.readdirSync(SRC_IMAGES).filter(f => f.endsWith('.png'))
for (const f of files) {
  fs.copyFileSync(path.join(SRC_IMAGES, f), path.join(DEST_CARDS, f))
  console.log('✓', f)
}

console.log('\nGotowe! Pliki w public/cards/ i public/frames/')
