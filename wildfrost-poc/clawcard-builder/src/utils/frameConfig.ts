import type { CardType } from '../types/card.types'

export interface AreaConfig {
  left:   number
  top:    number
  width:  number
  height: number
}

export interface FrameConfig {
  frameFile: string | null
  art:      AreaConfig
  name:     AreaConfig
  desc:     AreaConfig
  hp?:      AreaConfig
  atk?:     AreaConfig
  counter?: AreaConfig
  scrap?:   AreaConfig
}

export const CARD_SIZES = {
  board:   { width: 124, height: 182 },
  hand:    { width: 140, height: 206 },
  preview: { width: 200, height: 294 },
  mini:    { width: 60,  height: 88  },
} as const

export type CardSizeKey = keyof typeof CARD_SIZES

const COMPANION_CONFIG: FrameConfig = {
  frameFile: '/frames/Companion Frame.png',
  art:     { left: 14,   top: 10.5, width: 70.6, height: 44.4 },
  hp:      { left: 3.9,  top: 20.4, width: 12.7, height: 5.3  },
  atk:     { left: 81.3, top: 19.3, width: 9.6,  height: 5.1  },
  counter: { left: 42.9, top: 88.1, width: 12.7, height: 7.3  },
  name:    { left: 17.7, top: 53.4, width: 63.1, height: 6.7  },
  desc:    { left: 19.8, top: 61.2, width: 58.4, height: 23.9 },
}

const ITEM_WITH_ATTACK_CONFIG: FrameConfig = {
  frameFile: '/frames/Item_with_attack.png',
  art:  { left: 10,  top: 6,  width: 78, height: 46 },
  atk:  { left: 79,  top: 8,  width: 16, height: 8  },
  name: { left: 15,  top: 54, width: 70, height: 7  },
  desc: { left: 12,  top: 63, width: 74, height: 28 },
}

const ITEM_WITHOUT_ATTACK_CONFIG: FrameConfig = {
  frameFile: '/frames/Item_without_attack.png',
  art:  { left: 10,  top: 6,  width: 78, height: 46 },
  name: { left: 15,  top: 54, width: 70, height: 7  },
  desc: { left: 12,  top: 63, width: 74, height: 28 },
}

// ── BOSS — skalibrowane przez Frame Editor ────────────────────────────────
const BOSS_CONFIG: FrameConfig = {
  frameFile: '/frames/boss.png',
  art:     { left: 22.3, top: 20.4, width: 55.9, height: 29.7 },
  hp:      { left: 9.3,  top: 25.6, width: 7.4,  height: 4.2  },
  atk:     { left: 80.3, top: 25.9, width: 5.8,  height: 4.2  },
  counter: { left: 47.2, top: 83.5, width: 6.1,  height: 5.8  },
  name:    { left: 28.4, top: 50.5, width: 43.7, height: 5.0  },
  desc:    { left: 28.4, top: 56.3, width: 44.0, height: 19.1 },
}


// ── __TEST_DRY_RUN__ — skalibrowane przez Frame Editor ──────────────────────────────
const __TEST_DRY_RUN___CONFIG: FrameConfig = {
  frameFile: null,
  art:    { left: 10, top: 10, width: 80, height: 40 },
  name:    { left: 10, top: 55, width: 80, height: 8 },
  desc:    { left: 10, top: 65, width: 80, height: 25 },
}


// ── TESTETS — skalibrowane przez Frame Editor ──────────────────────────────
const TESTETS_CONFIG: FrameConfig = {
  frameFile: '/frames/testetest.png',
  art:    { left: 28.4, top: 22.2, width: 43.7, height: 21.4 },
  hp:    { left: 14.6, top: 19.7, width: 9, height: 6.5 },
  name:    { left: 33.4, top: 43.4, width: 34.7, height: 5.7 },
  desc:    { left: 25.7, top: 51.4, width: 47.4, height: 22.1 },
  atk:    { left: 72.9, top: 18.5, width: 10.9, height: 6.9 },
}

// ── TEST2 — skalibrowane przez Frame Editor
const TEST2_CONFIG: FrameConfig = {
  frameFile: '/frames/test2.png',
  art:     { left: 28.4, top: 22.2, width: 43.7, height: 21.4 },
  hp:      { left: 14.6, top: 19.7, width: 9, height: 6.5 },
  atk:     { left: 74.7, top: 18.7, width: 8, height: 7.8 },
  counter: { left: 45.3, top: 77, width: 8.7, height: 6.7 },
  desc:    { left: 25.4, top: 50, width: 48, height: 24.6 },
}

// ── __GIT_PUSH__ — skalibrowane przez Frame Editor
const __GIT_PUSH___CONFIG: FrameConfig = {
  frameFile: null,
  art:     { left: 0, top: 0, width: 100, height: 100 },
  name:    { left: 0, top: 80, width: 100, height: 10 },
  desc:    { left: 0, top: 90, width: 100, height: 10 },
}

// ── __E2E_TEST__ — skalibrowane przez Frame Editor
const __E2E_TEST___CONFIG: FrameConfig = {
  frameFile: null,
  art:     { left: 10, top: 10, width: 80, height: 40 },
  name:    { left: 10, top: 55, width: 80, height: 8 },
  desc:    { left: 10, top: 65, width: 80, height: 25 },
}

export const FRAME_CONFIGS: Record<CardType, FrameConfig> = {
  companion:            COMPANION_CONFIG,
  item_with_attack:     ITEM_WITH_ATTACK_CONFIG,
  item_without_attack:  ITEM_WITHOUT_ATTACK_CONFIG,
  clunker:              COMPANION_CONFIG,
  shade:                COMPANION_CONFIG,
  charm:                COMPANION_CONFIG,
  boss:                 BOSS_CONFIG,
    __test_dry_run__:    __TEST_DRY_RUN___CONFIG,
    testets:             TESTETS_CONFIG,
  __git_push__:          __GIT_PUSH___CONFIG,
  __e2e_test__:          __E2E_TEST___CONFIG,
}

export function getItemFrameConfig(damage: number | undefined): FrameConfig {
  return damage ? ITEM_WITH_ATTACK_CONFIG : ITEM_WITHOUT_ATTACK_CONFIG
}
