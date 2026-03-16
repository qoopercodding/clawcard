// vite-plugin-frame-config.ts
// POST /api/save-frame-config:
//   1. PNG → /public/frames/ (z base64)
//   2. frameConfig.ts — nowy/zaktualizowany config
//   3. isNew: card.types.ts + CardEditorScreen.tsx (CARD_TYPES + draftToCard)
//   4. git add . && git commit && git push

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
        req.on('data', (chunk: Buffer) => { body += chunk })
        req.on('end', () => {
          try {
            const payload: FramePayload = JSON.parse(body)
            const steps: string[] = []

            // 1. PNG
            if (payload.pngBase64 && payload.pngFileName) {
              fs.mkdirSync(PUBLIC_FRAMES, { recursive: true })
              const base64Data = payload.pngBase64.replace(/^data:image\/\w+;base64,/, '')
              fs.writeFileSync(path.join(PUBLIC_FRAMES, payload.pngFileName), Buffer.from(base64Data, 'base64'))
              steps.push(`PNG zapisany: public/frames/${payload.pngFileName}`)
            }

            // 2. frameConfig.ts
            writeFrameConfigTs(payload); steps.push('frameConfig.ts ✓')

            // 3. card.types.ts + CardEditorScreen.tsx
            if (payload.isNew) {
              writeCardTypes(payload);  steps.push('card.types.ts ✓')
              writeCardEditor(payload); steps.push('CardEditorScreen.tsx ✓')
            }

            // 4. Git
            try {
              const repoRoot = path.resolve(ROOT, '..', '..')
              const msg = payload.isNew
                ? `frame: dodano typ '${payload.typeName}'`
                : `frame: zaktualizowano typ '${payload.typeName}'`
              execSync('git add .', { cwd: repoRoot })
              execSync(`git commit -m "${msg}"`, { cwd: repoRoot })
              execSync('git push', { cwd: repoRoot })
              steps.push('git push ✓')
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e)
              steps.push(`⚠ git: ${msg.split('\n')[0].slice(0, 80)}`)
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true, message: `Typ '${payload.typeName}' zapisany. ${steps.join(' | ')}`, steps }))
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

interface AreaConfig { left: number; top: number; width: number; height: number }

interface FramePayload {
  typeName:     string
  typeLabel:    string
  frameFile:    string | null
  pngFileName:  string | null
  pngBase64:    string | null
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

  const fieldOrder = ['art', 'hp', 'atk', 'counter', 'name', 'desc', 'scrap']
  const fieldLines = fieldOrder
    .filter(k => p.fields[k])
    .map(k => {
      const v = p.fields[k]
      const pad = ' '.repeat(Math.max(1, 8 - k.length))
      return `  ${k}:${pad}{ left: ${v.left}, top: ${v.top}, width: ${v.width}, height: ${v.height} },`
    }).join('\n')

  const constName = `${p.typeName.toUpperCase()}_CONFIG`
  const newConst = [
    `// ── ${p.typeName.toUpperCase()} — skalibrowane przez Frame Editor`,
    `const ${constName}: FrameConfig = {`,
    `  frameFile: ${p.frameFile ? `'${p.frameFile}'` : 'null'},`,
    fieldLines,
    `}`,
  ].join('\n')

  const alreadyInRecord = new RegExp(`^\\s+${p.typeName}\\s*:`, 'm').test(content)

  if (!alreadyInRecord) {
    content = content.replace('export const FRAME_CONFIGS:', `${newConst}\n\nexport const FRAME_CONFIGS:`)
    // Dodaj wpis do Record — szukamy ostatniego wpisu przed }
    content = content.replace(
      /^(export const FRAME_CONFIGS[^=]+=\s*\{[\s\S]*?)(\n\})/m,
      (_, body) => `${body}\n  ${p.typeName}:${' '.repeat(Math.max(1,22-p.typeName.length))}${constName},\n}`
    )
  } else {
    // Zaktualizuj istniejący const
    const oldRegex = new RegExp(`// ── ${p.typeName.toUpperCase()}[^\n]*\nconst ${constName}[\\s\\S]*?^}`, 'm')
    if (oldRegex.test(content)) {
      content = content.replace(oldRegex, newConst)
    } else {
      content = content.replace('export const FRAME_CONFIGS:', `${newConst}\n\nexport const FRAME_CONFIGS:`)
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8')
}

// ---------------------------------------------------------------------------
// 2. card.types.ts
// ---------------------------------------------------------------------------

function writeCardTypes(p: FramePayload) {
  const filePath = path.join(SRC, 'types', 'card.types.ts')
  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes(`'${p.typeName}'`)) return

  // Dodaj do union — ostatnia linia union
  content = content.replace(
    /^(export type CardType =[\s\S]*?)(\n\n)/m,
    (match, union) => `${union.trimEnd()} | '${p.typeName}'\n\n`
  )

  // Dodaj interface przed AnyCard
  const iface = `\n/** ${cap(p.typeName)} — dodany przez Frame Editor */\nexport interface ${cap(p.typeName)}Card extends CardBase {\n  type: '${p.typeName}'\n  hp: number\n  attack: number\n  counter: number\n  abilities: Ability[]\n}\n`
  content = content.replace('export type AnyCard =', `${iface}\nexport type AnyCard =`)

  // Dodaj do AnyCard — przed ostatnią linią
  content = content.replace(/(\s*\| \w+Card\s*)$/, `$1\n  | ${cap(p.typeName)}Card\n`)

  fs.writeFileSync(filePath, content, 'utf-8')
}

// ---------------------------------------------------------------------------
// 3. CardEditorScreen.tsx
// ---------------------------------------------------------------------------

function writeCardEditor(p: FramePayload) {
  const filePath = path.join(SRC, 'modules', 'card-editor', 'CardEditorScreen.tsx')
  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes(`'${p.typeName}'`)) return

  // Dodaj import
  content = content.replace(
    /import type \{([^}]+)\} from '\.\.\/\.\.\/types\/card\.types'/,
    (_, inner) => `import type {${inner.trimEnd()}, ${cap(p.typeName)}Card } from '../../types/card.types'`
  )

  // Dodaj do COMPANION_LIKE_TYPES
  content = content.replace(
    /^(const COMPANION_LIKE_TYPES: CardType\[\] = \[)([^\]]+)(\])/m,
    (_, open, inner, close) => `${open}${inner.trimEnd()}, '${p.typeName}'${close}`
  )

  // Dodaj do CARD_TYPES — przed zamykającym ]
  const entry = `\n  { value: '${p.typeName}', label: '${p.typeLabel || cap(p.typeName)}' },`
  content = content.replace(/(\]\s*\n\nfunction FormPanel)/, `${entry}\n]$1`.replace('$1', '\n\nfunction FormPanel'))

  // Prostsze — znajdź koniec CARD_TYPES
  content = content.replace(
    /^(const CARD_TYPES[^=]+=\s*\[[\s\S]*?)(\n\])/m,
    (_, body) => `${body}\n  { value: '${p.typeName}', label: '${p.typeLabel || cap(p.typeName)}' },\n]`
  )

  // Dodaj case w draftToCard
  const newCase = `  if (draft.type === '${p.typeName}') {\n    return { ...base, type: '${p.typeName}', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as ${cap(p.typeName)}Card\n  }\n`
  content = content.replace(
    '  // item_with_attack lub item_without_attack\n  return {',
    `${newCase}  // item_with_attack lub item_without_attack\n  return {`
  )

  fs.writeFileSync(filePath, content, 'utf-8')
  // CardFrame.tsx ma duck typing — nie trzeba dotykać
}

// ---------------------------------------------------------------------------

function cap(s: string): string {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}
