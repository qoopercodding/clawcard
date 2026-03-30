// ─── GitHub API — commit plików bezpośrednio z przeglądarki ─────────────────
// Wymaga Personal Access Token z uprawnieniem contents: write

const OWNER = 'qoopercodding'
const REPO  = 'clawcard'
const BRANCH = 'main'
const API = 'https://api.github.com'

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
  path: string
  content: string
}

async function ghFetch(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const token = getStoredPAT()
  if (!token) throw new Error('Brak GitHub PAT. Wpisz token w ustawieniach.')
  const res = await fetch(`${API}${path}`, {
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
  return btoa(unescape(encodeURIComponent(str)))
}

export async function commitFiles(files: FileToCommit[], message: string): Promise<void> {
  const refData = await ghFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`) as { object: { sha: string } }
  const latestCommitSha = refData.object.sha

  const commitData = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`) as { tree: { sha: string } }
  const baseTreeSha = commitData.tree.sha

  const treeItems = await Promise.all(files.map(async (file) => {
    const blob = await ghFetch(`/repos/${OWNER}/${REPO}/git/blobs`, 'POST', {
      content: toBase64(file.content),
      encoding: 'base64',
    }) as { sha: string }
    return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha }
  }))

  const newTree = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  }) as { sha: string }

  const newCommit = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits`, 'POST', {
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
    author: { name: 'ClawCard Builder', email: 'builder@clawcard.local' },
  }) as { sha: string }

  await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, 'PATCH', {
    sha: newCommit.sha,
    force: false,
  })
}
