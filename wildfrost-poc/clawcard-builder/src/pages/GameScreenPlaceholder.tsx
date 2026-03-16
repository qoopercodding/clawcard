import { Inspectable } from '../components/debug/Inspectable'

interface GameScreenPlaceholderProps {
  devMode?: boolean
}

/**
 * Renderuje pusty ekran gry jako placeholder pod przyszla implementacje.
 *
 * Wersja podstawowa pokazuje jedynie strukture planszy. Wersja developerska
 * otrzymuje osobna etykiete i moze byc owijana w Inspectable.
 *
 * @param props - Flaga rozrozniajaca zwykly placeholder od trybu developerskiego.
 * @returns Prosty szkic ekranu gry.
 */
export function GameScreenPlaceholder({
  devMode = false,
}: GameScreenPlaceholderProps) {
  const enemyRow = (
    <div className="board-placeholder__lane">
      <span>Enemy row</span>
    </div>
  )

  const boardCenter = (
    <div className="board-placeholder__center">Combat board area</div>
  )

  const playerRow = (
    <div className="board-placeholder__lane">
      <span>Player row</span>
    </div>
  )

  return (
    <section className="workspace-screen">
      <header className="workspace-screen__header">
        <p className="workspace-screen__eyebrow">
          {devMode ? 'Developer Game Screen' : 'Game Screen'}
        </p>
        <h2>{devMode ? 'Debug board preview' : 'Gameplay placeholder'}</h2>
        <p>
          {devMode
            ? 'This view will grow into a debug board with hover inspection and developer tools.'
            : 'This screen is intentionally empty for now and reserves space for the real game UI.'}
        </p>
      </header>

      <div className="board-placeholder">
        {devMode ? (
          <Inspectable
            meta={{
              componentName: 'EnemyRowPlaceholder',
              objectType: 'BoardLane',
              codeRef: 'src/pages/GameScreenPlaceholder.tsx',
              description: 'Placeholder row for future enemy units.',
            }}
          >
            {enemyRow}
          </Inspectable>
        ) : (
          enemyRow
        )}
        {devMode ? (
          <Inspectable
            meta={{
              componentName: 'CombatBoardPlaceholder',
              objectType: 'BoardCenter',
              codeRef: 'src/pages/GameScreenPlaceholder.tsx',
              description: 'Central board zone for battle effects and targeting.',
            }}
          >
            {boardCenter}
          </Inspectable>
        ) : (
          boardCenter
        )}
        {devMode ? (
          <Inspectable
            meta={{
              componentName: 'PlayerRowPlaceholder',
              objectType: 'BoardLane',
              codeRef: 'src/pages/GameScreenPlaceholder.tsx',
              description: 'Placeholder row for future player units.',
            }}
          >
            {playerRow}
          </Inspectable>
        ) : (
          playerRow
        )}
      </div>
    </section>
  )
}
