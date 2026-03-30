// ─── GitHub API — commit plików bezpośrednio z przeglądarki ─────────────────
//
// Wymaga Personal Access Token z uprawnieniem `contents: write`
// Token jest przechowywany w localStorage — tylko narzędzie devowe, nie produkcja.
//
// Flow na każdy commit:
//   1. Pobierz aktualny SHA brancha (GET /repos/.../git/ref/heads/main)
//   2. Pobierz SHA drzewa (GET /repos/.../git/commits/{sha})
//   3. Utwórz bloby dla każdego pliku
//   4. Utwórz nowe drzewo
//   5. Utwórz commit
//   6. Zaktualizuj ref brancha

const OWNER = 'qoopercodding'
const REPO  = 'clawcard'
const BRANCH = 'main'
const BASE_URL = 'https://api.github.com'

const PAT_KEY = 'gh_pat_clawcard'

export function getStoredPAT(): string {
  return localStorage.getItem(PAT_KEY) ?? ''
}

export function storePAT(token: string) {
  localStorage.setItem(PAT_KEY, token.trim())
}

export function clearPAT() {
  localStorage.removeItem(PAT_KEY)
}

interface FileToCommit {
  path: string   // relative to repo root, e.g. "wildfrost-poc/clawcard-builder/src/data/cards/index.ts"
  content: string  // raw text content
}

async function ghFetch(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const token = getStoredPAT()
  if (!token) throw new Error('Brak GitHub PAT. Wpisz token w ustawieniach.')

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(`GitHub API ${res.status}: ${err.message ?? res.statusText}`)
  }
  return res.json()
}

function toBase64(str: string): string {
  // Obsługa polskich znaków i unicode
  return btoa(unescape(encodeURIComponent(str)))
}

export async function commitFiles(files: FileToCommit[], message: string): Promise<void> {
  // 1. Pobierz SHA aktualnego commita na branchu
  const refData = await ghFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`) as { object: { sha: string } }
  const latestCommitSha = refData.object.sha

  // 2. Pobierz SHA drzewa aktualnego commita
  const commitData = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`) as { tree: { sha: string } }
  const baseTreeSha = commitData.tree.sha

  // 3. Utwórz bloby dla każdego pliku
  const treeItems = await Promise.all(files.map(async (file) => {
    const blob = await ghFetch(`/repos/${OWNER}/${REPO}/git/blobs`, 'POST', {
      content: toBase64(file.content),
      encoding: 'base64',
    }) as { sha: string }

    return {
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    }
  }))

  // 4. Utwórz nowe drzewo
  const newTree = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  }) as { sha: string }

  // 5. Utwórz commit
  const newCommit = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits`, 'POST', {
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
    author: {
      name: 'ClawCard Builder',
      email: 'builder@clawcard.local',
    },
  }) as { sha: string }

  // 6. Zaktualizuj ref
  await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, 'PATCH', {
    sha: newCommit.sha,
    force: false,
  })
}

// Pomocnicze — pobierz aktualną zawartość pliku z repo
export async function getFileContent(path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`) as { content: string; sha: string }
    return {
      content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))),
      sha: data.sha,
    }
  } catch {
    return null
  }
}
