import styles from './BattleScreen.module.css'

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function RunIndicator() {
  return <span className={styles.runIndicator}>Akt I · Walka 3/5</span>
}

function HPBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.round((hp / maxHp) * 100)
  const colorClass = pct > 50 ? styles.hpGreen : pct > 25 ? styles.hpYellow : styles.hpRed
  return (
    <div className={styles.hpBar}>
      <span className={styles.hpIcon}>❤</span>
      <span className={styles.hpNum}>{hp}/{maxHp}</span>
      <div className={styles.hpTrack}>
        <div className={`${styles.hpFill} ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EnergyDisplay({ current, max }: { current: number; max: number }) {
  return (
    <div className={styles.energyDisplay}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`${styles.crystal} ${i < current ? styles.energyActive : styles.energySpent}`}
        >
          ◆
        </span>
      ))}
    </div>
  )
}

function GoldDisplay({ gold }: { gold: number }) {
  return (
    <div className={styles.goldDisplay}>
      <span className={styles.goldCoin}>⬡</span>
      <span className={styles.goldNum}>{gold}</span>
    </div>
  )
}

function EndTurnButton() {
  return <button className={styles.endTurnBtn}>Koniec Tury</button>
}

function TopBar() {
  return (
    <div className={styles.topBar}>
      <RunIndicator />
      <HPBar hp={42} maxHp={60} />
      <EnergyDisplay current={2} max={3} />
      <GoldDisplay gold={87} />
      <EndTurnButton />
    </div>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

function PlayerBoard() {
  return (
    <div className={styles.boardWrap}>
      <div className={styles.boardLabel}>Gracz</div>
      <div className={`${styles.boardGrid} ${styles.boardGridPlayer}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${styles.cell} ${styles.cellPlayer}`} />
        ))}
      </div>
    </div>
  )
}

function EnemyBoard() {
  return (
    <div className={styles.boardWrap}>
      <div className={styles.boardLabel}>Wrogowie</div>
      <div className={`${styles.boardGrid} ${styles.boardGridEnemy}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${styles.cell} ${styles.cellEnemy}`} />
        ))}
      </div>
    </div>
  )
}

function Arena() {
  return (
    <div className={styles.arena}>
      <PlayerBoard />
      <div className={styles.vsDivider}>
        <span className={styles.vsLabel}>VS</span>
      </div>
      <EnemyBoard />
    </div>
  )
}

// ─── Intent ───────────────────────────────────────────────────────────────────

function IntentDisplay() {
  return (
    <div className={styles.intentBar}>
      <span className={styles.intentLabel}>Wróg planuje:</span>
      <span className={styles.intentItem}>⚔ 12</span>
      <span className={styles.intentSep}>|</span>
      <span className={styles.intentItem}>🛡 8</span>
    </div>
  )
}

// ─── Hand ─────────────────────────────────────────────────────────────────────

const HAND_ROTATIONS = [-10, -5, 0, 5, 10]
const HAND_TRANSLATES = [6, 2, 0, 2, 6]

function HandCard({ index }: { index: number }) {
  const rot = HAND_ROTATIONS[index]
  const ty = HAND_TRANSLATES[index]
  return (
    <div
      className={styles.handCard}
      style={{ transform: `rotate(${rot}deg) translateY(${ty}px)` }}
    >
      <span className={styles.handCardNum}>{index + 1}</span>
    </div>
  )
}

function HandArea() {
  return (
    <div className={styles.handArea}>
      <div className={styles.handFan}>
        {Array.from({ length: 5 }, (_, i) => (
          <HandCard key={i} index={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Bottom Bar ───────────────────────────────────────────────────────────────

function PileWidget({
  icon,
  label,
  count,
  side,
}: {
  icon: string
  label: string
  count: number
  side: 'left' | 'center' | 'right'
}) {
  return (
    <div className={`${styles.pileWidget} ${styles[`pile${side.charAt(0).toUpperCase() + side.slice(1)}`]}`}>
      <span className={styles.pileIcon}>{icon}</span>
      <span className={styles.pileCount}>{count}</span>
      <span className={styles.pileLabel}>{label}</span>
    </div>
  )
}

function BottomBar() {
  return (
    <div className={styles.bottomBar}>
      <PileWidget icon="🂠" label="Dobierz" count={18} side="left" />
      <PileWidget icon="✦" label="Wyczerpane" count={2} side="center" />
      <PileWidget icon="🂡" label="Odrzucone" count={5} side="right" />
    </div>
  )
}

// ─── BattleScreen ─────────────────────────────────────────────────────────────

export function BattleScreen() {
  return (
    <div className={styles.battleScreen}>
      <TopBar />
      <Arena />
      <IntentDisplay />
      <HandArea />
      <BottomBar />
    </div>
  )
}
