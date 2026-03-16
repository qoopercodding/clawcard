// vite-plugin-frame-config.ts
// Vite dev plugin: POST /api/save-frame-config
//
// Obsługuje w jednym żądaniu:
//   1. Zapis PNG do /public/frames/ (z base64 w payloadzie)
//   2. Zapis config do frameConfig.ts
//   3. Jeśli isNew: zapis do card.types.ts + CardEditorScreen.tsx
//   4. git add . && git commit && git push (auto-sync)

import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const ROOT = path.resolve(__dirname)
const SRC  = path.join(ROOT, 'src')
const PUBLIC_FRAMES = path.join(ROOT, 'public', 'frames')

export function frameConfigPlugin(): Plugin {
  return {
    name: 'frame-config-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/save-frame-config', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
        if (req.method !== 'POST')   { res.writeHead(405); res.end(); return }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const payload: FramePayload = JSON.parse(body)
            const steps: string[] = []

            // ── 1. Zapisz PNG z base64 ───────────────────────────────────
            if (payload.pngBase64 && payload.pngFileName) {
              fs.mkdirSync(PUBLIC_FRAMES, { recursive: true })
              const pngPath = path.join(PUBLIC_FRAMES, payload.pngFileName)
              const base64Data = payload.pngBase64.replace(/^data:image\/\w+;base64,/, '')
              fs.writeFileSync(pngPath, Buffer.from(base64Data, 'base64'))
              steps.push(`PNG zapisany: public/frames/${payload.pngFileName}`)
            }

            // ── 2. frameConfig.ts ────────────────────────────────────────
            writeFrameConfigTs(payload)
            steps.push('frameConfig.ts ✓')

            // ── 3. card.types.ts + CardEditorScreen.tsx (tylko nowe typy) ─
            if (payload.isNew) {
              writeCardTypes(payload)
              steps.push('card.types.ts ✓')
              writeCardEditor(payload)
              steps.push('CardEditorScreen.tsx ✓')
            }

            // ── 4. Git commit + push ─────────────────────────────────────
            let gitMsg = ''
            try {
              const repoRoot = path.resolve(ROOT, '..', '..') // clawcard_base
              const label = payload.isNew ? `frame: dodano typ '${payload.typeName}'` : `frame: zaktualizowano typ '${payload.typeName}'`
              execSync('git add .', { cwd: repoRoot })
              execSync(`git commit -m "${label}"`, { cwd: repoRoot })
              execSync('git push', { cwd: repoRoot })
              gitMsg = 'git push ✓'
              steps.push(gitMsg)
            } catch (gitErr: unknown) {
              const msg = gitErr instanceof Error ? gitErr.message : String(gitErr)
              // Nie przerywaj — git push mógł się nie udać (brak zmian, brak netu)
              gitMsg = `git: ${msg.split('\n')[0].slice(0, 80)}`
              steps.push(`⚠ ${gitMsg}`)
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              ok: true,
              message: `Typ '${payload.typeName}' zapisany. ${steps.join(' | ')}`,
              steps,
            }))
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: msg }))
          }
        })
      })
    },
  }
}

// ---------------------------------------------------------------------------
// Typy payloadu
// ---------------------------------------------------------------------------

interface AreaConfig { left: number; top: number; width: number; height: number }

interface FramePayload {
  typeName:     string
  typeLabel:    string
  frameFile:    string | null       // np. '/frames/boss.png'
  pngFileName:  string | null       // np. 'boss.png'
  pngBase64:    string | null       // data:image/png;base64,...
  fields:       Record<string, AreaConfig>
  enabledFields: string[]
  isNew:        boolean
}

// ---------------------------------------------------------------------------
// 1. frameConfig.ts
// ---------------------------------------------------------------------------

function writeFrameConfigTs(p: FramePayload) {
  const filePath = path.join(SRC, 'utils', 'frameConfig.ts')
  let content = fs.readFileSync(filePath, 'utf-8')

  // Buduj linie pól — art musi być pierwsze (wymagane przez FrameConfig)
  const fieldOrder = ['art', 'hp', 'atk', 'counter', 'name', 'desc', 'scrap']
  const fieldLines = fieldOrder
    .filter(k => p.fields[k])
    .map(k => {
      const v = p.fields[k]
      const pad = ' '.repeat(Math.max(1, 8 - k.length))
      return `  ${k}:${pad}{ left: ${v.left}, top: ${v.top}, width: ${v.width}, height: ${v.height} },`
    })
    .join('\n')

  const constName = `${p.typeName.toUpperCase()}_CONFIG`
  const newConst = [
    `// ── ${p.typeName.toUpperCase()} — skalibrowane przez Frame Editor`,
    `const ${constName}: FrameConfig = {`,
    `  frameFile: ${p.frameFile ? `'${p.frameFile}'` : 'null'},`,
    fieldLines,
    `}`,
  ].join('\n')

  const enumEntry = `  ${p.typeName}:${' '.repeat(Math.max(1, 22 - p.typeName.length))}${constName},`

  // Czy typ już istnieje w FRAME_CONFIGS?
  const alreadyInRecord = new RegExp(`^\\s+${p.typeName}\\s*:`,'m').test(content)

  if (!alreadyInRecord) {
    // Nowy typ — dodaj const i wpis
    content = content.replace(
      'export const FRAME_CONFIGS:',
      `${newConst}\n\nexport const FRAME_CONFIGS:`
    )
    // Dodaj wpis przed zamykającym }
    content = content.replace(
      /^(\s*)(charm\s*:[^\n]+\n)(})/m,
      (_, ind, charmLine) => `${ind}${charmLine}${enumEntry}\n}`
    )
  } else {
    // Zaktualizuj istniejący const
    const oldConstRegex = new RegExp(
      `// ── ${p.typeName.toUpperCase()}[^\n]*\nconst ${constName}[\\s\\S]*?^}`,
      'm'
    )
    if (oldConstRegex.test(content)) {
      content = content.replace(oldConstRegex, newConst)
    } else {
      // Const nie istnieje ale wpis w Record jest — dodaj const przed FRAME_CONFIGS
      content = content.replace(
        'export const FRAME_CONFIGS:',
        `${newConst}\n\nexport const FRAME_CONFIGS:`
      )
    }
    // Zaktualizuj frameFile w istniejącym wpisie Record jeśli się zmieniło
    content = content.replace(
      new RegExp(`(${p.typeName}\\s*:\\s*)\\w+_CONFIG`),
      `$1${constName}`
    )
  }

  fs.writeFileSync(filePath, content, 'utf-8')
}

// ---------------------------------------------------------------------------
// 2. card.types.ts
// ---------------------------------------------------------------------------

function writeCardTypes(p: FramePayload) {
  const filePath = path.join(SRC, 'types', 'card.types.ts')
  let content = fs.readFileSync(filePath, 'utf-8')

  // Sprawdź czy typ już istnieje
  if (content.includes(`'${p.typeName}'`)) return

  // Dodaj do CardType union
  content = content.replace(
    /^(export type CardType = .+)$/m,
    `$1 | '${p.typeName}'`
  )

  // Dodaj interface
  const iface = [
    ``,
    `export interface ${cap(p.typeName)}Card extends CardBase {`,
    `  type: '${p.typeName}'`,
    `  hp: number`,
    `  attack: number`,
    `  counter: number`,
    `  abilities: Ability[]`,
    `}`,
  ].join('\n')

  content = content.replace('export type AnyCard =', `${iface}\n\nexport type AnyCard =`)

  // Dodaj do AnyCard union — na końcu
  content = content.replace(
    /(export type AnyCard =[\s\S]+?)(^\s*$|$)/m,
    (match) => match.trimEnd() + `\n  | ${cap(p.typeName)}Card\n`
  )

  fs.writeFileSync(filePath, content, 'utf-8')
}

// ---------------------------------------------------------------------------
// 3. CardEditorScreen.tsx
// ---------------------------------------------------------------------------

function writeCardEditor(p: FramePayload) {
  const filePath = path.join(SRC, 'modules', 'card-editor', 'CardEditorScreen.tsx')
  let content = fs.readFileSync(filePath, 'utf-8')

  // Sprawdź czy już istnieje
  if (content.includes(`'${p.typeName}'`)) return

  // Dodaj import
  content = content.replace(
    /import type \{([^}]+)\} from '\.\.\/\.\.\/types\/card\.types'/,
    (_, inner) => `import type {${inner.trimEnd()}, ${cap(p.typeName)}Card } from '../../types/card.types'`
  )

  // Dodaj do CARD_TYPES — przed zamykającym ]
  const entry = `  { value: '${p.typeName}', label: '${p.typeLabel || cap(p.typeName)}' },`
  content = content.replace(
    /^(\s*\{ value: 'charm'[^\n]+\n)(\])/m,
    `$1  ${entry}\n$2`
  )

  // Dodaj case w draftToCard — przed isItem fallback
  const newCase = [
    `  if (draft.type === '${p.typeName}') {`,
    `    return { ...base, type: '${p.typeName}', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as ${cap(p.typeName)}Card`,
    `  }`,
  ].join('\n')
  content = content.replace(
    '  // item_with_attack lub item_without_attack\n  return {',
    `${newCase}\n  // item_with_attack lub item_without_attack\n  return {`
  )

  // Dodaj isCompanionLike check
  content = content.replace(
    "const isCompanionLike  = isCompanion || isBoss",
    `const isCompanionLike  = isCompanion || isBoss || draft.type === '${p.typeName}'`
  )

  // Dodaj case w getCardStats w CardFrame
  const frameFilePath = path.join(SRC, 'components', 'CardFrame', 'CardFrame.tsx')
  let frameContent = fs.readFileSync(frameFilePath, 'utf-8')
  if (!frameContent.includes(`'${p.typeName}'`)) {
    frameContent = frameContent.replace(
      "case 'boss':                return { hp: card.hp,    atk: card.attack, counter: card.counter }",
      [
        `case 'boss':                return { hp: card.hp,    atk: card.attack, counter: card.counter }`,
        `    case '${p.typeName}':${' '.repeat(Math.max(1,20-p.typeName.length))}return { hp: (card as any).hp, atk: (card as any).attack, counter: (card as any).counter }`,
      ].join('\n')
    )
    fs.writeFileSync(frameFilePath, frameContent, 'utf-8')
  }

  fs.writeFileSync(filePath, content, 'utf-8')
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function cap(s: string): string {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}
