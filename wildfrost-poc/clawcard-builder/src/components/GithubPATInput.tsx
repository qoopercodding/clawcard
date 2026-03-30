// Komponent do wpisania i zapamiętania GitHub PAT
import { useState, useEffect } from 'react'
import { getStoredPAT, storePAT, clearPAT } from '../../utils/githubCommit'

interface GithubPATInputProps {
  onTokenChange?: (hasToken: boolean) => void
}

export function GithubPATInput({ onTokenChange }: GithubPATInputProps) {
  const [token, setToken] = useState('')
  const [saved, setSaved] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const stored = getStoredPAT()
    setHasToken(!!stored)
    if (stored) setToken(stored)
    onTokenChange?.(!!stored)
  }, [])

  const handleSave = () => {
    storePAT(token)
    setSaved(true)
    setHasToken(true)
    onTokenChange?.(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    clearPAT()
    setToken('')
    setHasToken(false)
    onTokenChange?.(false)
  }

  return (
    <div style={{
      background: '#1a1a0e',
      border: `1px solid ${hasToken ? '#3a6020' : '#5a3a1a'}`,
      borderRadius: 6,
      padding: '8px 10px',
      fontSize: 11,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ color: hasToken ? '#70c870' : '#c8902a', fontWeight: 'bold' }}>
          {hasToken ? '🔑 GitHub PAT aktywny' : '🔑 GitHub PAT (wymagany do zapisu)'}
        </span>
        {hasToken && (
          <button onClick={handleClear} style={{
            marginLeft: 'auto', padding: '2px 6px', fontSize: 10,
            background: '#2a0a0a', border: '1px solid #6a2020', color: '#c07070',
            cursor: 'pointer', borderRadius: 3,
          }}>
            Usuń
          </button>
        )}
      </div>

      {!hasToken && (
        <>
          <div style={{ color: '#7a6040', marginBottom: 4, fontSize: 10 }}>
            Potrzebny token z uprawnieniem <code>contents: write</code> dla repo <code>clawcard</code>.{' '}
            <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer"
              style={{ color: '#6090d8' }}>Wygeneruj PAT →</a>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <input
              type={visible ? 'text' : 'password'}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_..."
              style={{
                flex: 1, background: '#2a1a0a', border: '1px solid #5a3a1a',
                color: '#e8d5b0', padding: '4px 6px', borderRadius: 4, fontSize: 11,
              }}
              onKeyDown={e => e.key === 'Enter' && token && handleSave()}
            />
            <button onClick={() => setVisible(v => !v)} style={{
              padding: '4px 7px', background: '#2a1a0a', border: '1px solid #3a2510',
              color: '#9a8060', cursor: 'pointer', borderRadius: 4, fontSize: 11,
            }}>
              {visible ? '🙈' : '👁'}
            </button>
            <button onClick={handleSave} disabled={!token} style={{
              padding: '4px 10px', fontWeight: 'bold', fontSize: 11,
              background: token ? '#3a5a10' : '#2a1a0a',
              border: `1px solid ${token ? '#6a9030' : '#3a2510'}`,
              color: token ? '#b0d870' : '#5a4030',
              cursor: token ? 'pointer' : 'not-allowed', borderRadius: 4,
            }}>
              {saved ? '✓' : 'Zapisz'}
            </button>
          </div>
        </>
      )}

      {hasToken && (
        <div style={{ color: '#506040', fontSize: 10 }}>
          Token zapisany w localStorage. Zapis do git będzie działać automatycznie.
        </div>
      )}
    </div>
  )
}
