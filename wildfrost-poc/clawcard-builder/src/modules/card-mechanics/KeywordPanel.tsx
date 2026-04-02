import { KEYWORDS_DB } from './keywords-data'

interface KeywordPanelProps {
  keyword: string
  onClose: () => void
}

export function KeywordPanel({ keyword, onClose }: KeywordPanelProps) {
  const data = KEYWORDS_DB[keyword]

  if (!data) {
    return (
      <div className="keyword-panel">
        <div className="keyword-panel__header">
          <strong className="keyword-panel__title">{keyword}</strong>
          <button className="keyword-panel__close" onClick={onClose}>✕</button>
        </div>
        <p className="keyword-panel__unknown">Mechanika nie znaleziona w bazie.</p>
      </div>
    )
  }

  return (
    <div className="keyword-panel">
      <div className="keyword-panel__header">
        <strong className="keyword-panel__title">{data.name}</strong>
        <button className="keyword-panel__close" onClick={onClose}>✕</button>
      </div>
      <span className="keyword-panel__game">{data.game}</span>
      <p className="keyword-panel__short">{data.short_desc}</p>
      <div className="keyword-panel__divider" />
      <p className="keyword-panel__full">{data.full_desc}</p>
      {data.examples.length > 0 && (
        <div className="keyword-panel__examples">
          <span className="keyword-panel__examples-label">Przykłady:</span>
          {data.examples.map(ex => (
            <span key={ex} className="keyword-panel__example-tag">{ex}</span>
          ))}
        </div>
      )}
      {data.wiki_url && (
        <a
          className="keyword-panel__wiki"
          href={data.wiki_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          → Wiki
        </a>
      )}
      {data.verified && (
        <span className="keyword-panel__verified">✅ Zweryfikowane</span>
      )}
    </div>
  )
}
