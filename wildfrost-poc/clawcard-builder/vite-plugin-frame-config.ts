// @ts-nocheck
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
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          try {
            const payload = JSON.parse(body)
            const steps = []

            if (payload.pngBase64 && payload.pngFileName) {
              fs.mkdirSync(PUBLIC_FRAMES, { recursive: true })
              const base64Data = payload.pngBase64.replace(/^data:image\/\w+;base64,/, '')
              fs.writeFileSync(path.join(PUBLIC_FRAMES, payload.pngFileName), Buffer.from(base64Data, 'base64'))
              steps.push(`PNG zapisany: public/frames/${payload.pngFileName}`)
            }

            writeFrameConfigTs(payload); steps.push('frameConfig.ts ✓')

            if (payload.isNew) {
              writeCardTypes(payload);  steps.push('card.types.ts ✓')
              writeCardEditor(payload); steps.push('CardEditorScreen.tsx ✓')
            }

            try {
              const repoRoot = path.resolve(ROOT, '..', '..')
              const msg = payload.isNew
                ? `frame: dodano typ '${payload.typeName}'`
                : `frame: zaktualizowano typ '${payload.typeName}'`
              execSync('git add .', { cwd: repoRoot })
              execSync(`git commit -m "${msg}"`, { cwd: repoRoot })
              execSync('git push', { cwd: repoRoot })
              steps.push('git push ✓')
            } catch (e) {
              steps.push(`⚠ git: ${String(e).split('\n')[0].slice(0, 80)}`)
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true, message: `Typ '${payload.typeName}' zapisany. ${steps.join(' | ')}`, steps }))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })
      })
    },
  }
}

function writeFrameConfigTs(p) {
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
    `const ${constName} = {`,
    `  frameFile: ${p.frameFile ? `'${p.frameFile}'` : 'null'},`,
    fieldLines,
    `}`,
  ].join('\n')
  const alreadyInRecord = new RegExp(`^\\s+${p.typeName}\\s*:`, 'm').test(content)
  if (!alreadyInRecord) {
    content = content.replace('export const FRAME_CONFIGS:', `${newConst}\n\nexport const FRAME_CONFIGS:`)
    content = content.replace(
      /^(export const FRAME_CONFIGS[^=]+=\s*\{[\s\S]*?)(\n\})/m,
      (_, body) => `${body}\n  ${p.typeName}:${' '.repeat(Math.max(1,22-p.typeName.length))}${constName},\n}`
    )
  } else {
    const oldRegex = new RegExp(`// ── ${p.typeName.toUpperCase()}[^\n]*\nconst ${constName}[\\s\\S]*?^}`, 'm')
    if (oldRegex.test(content)) {
      content = content.replace(oldRegex, newConst)
    } else {
      content = content.replace('export const FRAME_CONFIGS:', `${newConst}\n\nexport const FRAME_CONFIGS:`)
    }
  }
  fs.writeFileSync(filePath, content, 'utf-8')
}

function writeCardTypes(p) {
  const filePath = path.join(SRC, 'types', 'card.types.ts')
  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes(`'${p.typeName}'`)) return
  content = content.replace(
    /^(export type CardType =[\s\S]*?)(\n\n)/m,
    (match, union) => `${union.trimEnd()} | '${p.typeName}'\n\n`
  )
  const iface = `\n/** ${cap(p.typeName)} — dodany przez Frame Editor */\nexport interface ${cap(p.typeName)}Card extends CardBase {\n  type: '${p.typeName}'\n  hp: number\n  attack: number\n  counter: number\n  abilities: Ability[]\n}\n`
  content = content.replace('export type AnyCard =', `${iface}\nexport type AnyCard =`)
  content = content.replace(/(\s*\| \w+Card\s*)$/, `$1\n  | ${cap(p.typeName)}Card\n`)
  fs.writeFileSync(filePath, content, 'utf-8')
}

function writeCardEditor(p) {
  const filePath = path.join(SRC, 'modules', 'card-editor', 'CardEditorScreen.tsx')
  let content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes(`'${p.typeName}'`)) return
  content = content.replace(
    /import type \{([^}]+)\} from '\.\.\/\.\.\/types\/card\.types'/,
    (_, inner) => `import type {${inner.trimEnd()}, ${cap(p.typeName)}Card } from '../../types/card.types'`
  )
  content = content.replace(
    /^(const COMPANION_LIKE_TYPES: CardType\[\] = \[)([^\]]+)(\])/m,
    (_, open, inner, close) => `${open}${inner.trimEnd()}, '${p.typeName}'${close}`
  )
  content = content.replace(
    /^(const CARD_TYPES[^=]+=\s*\[[\s\S]*?)(\n\])/m,
    (_, body) => `${body}\n  { value: '${p.typeName}', label: '${p.typeLabel || cap(p.typeName)}' },\n]`
  )
  const newCase = `  if (draft.type === '${p.typeName}') {\n    return { ...base, type: '${p.typeName}', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as ${cap(p.typeName)}Card\n  }\n`
  content = content.replace(
    '  // item_with_attack lub item_without_attack\n  return {',
    `${newCase}  // item_with_attack lub item_without_attack\n  return {`
  )
  fs.writeFileSync(filePath, content, 'utf-8')
}

function cap(s) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}
