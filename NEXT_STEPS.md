# ClawCard — Next Steps & Strategy Document

## STATUS: Claude Max na VPS, git skonfigurowany, system gotowy do autonomicznej pracy

---

## CZĘŚĆ 1: SYSTEM AGENTOWY — ARCHITEKTURA

### Rekomendacja: claude-code-hooks-multi-agent-observability + overstory

Po researchu community (HN, GitHub trending, awesome-claude-code), najlepszy stack dla nas to:

**WARSTWA 1 — Orkiestracja: overstory**
- Repo: github.com/jayminwest/overstory
- Spawns agentów w izolowanych git worktrees przez tmux
- SQLite mail system między agentami (1-5ms per query)
- Live TUI dashboard: `ov dashboard`
- FIFO merge queue z 4-tier conflict resolution
- Install: `bun install -g overstory`

**WARSTWA 2 — Observability: disler/claude-code-hooks-multi-agent-observability**
- Repo: github.com/disler/claude-code-hooks-multi-agent-observability
- Vue.js dashboard z WebSocket live updates
- Trace każdy tool call, task lifecycle, agent swim lanes
- SQLite storage, Bun server
- Setup: `cp -R .claude /home/claude/clawcard/.claude`

**WARSTWA 3 — Live dashboard webowy na VPS**
- hoangsonww/Claude-Code-Agent-Monitor
- Node.js + React + WebSocket, port 4820
- Kanban board, session tracking, tool usage analytics
- Docker support: `docker run -p 4820:4820 agent-monitor`

### Agenci do stworzenia dla ClawCard:

```
/home/claude/clawcard/.claude/agents/
├── game-director.md      # Orchestrator — czyta TASKS.md, przydziela prace
├── frontend-dev.md       # React/Vite/TypeScript specialist
├── combat-designer.md    # Mechaniki walki, balansowanie kart
├── card-scraper.md       # Pobieranie kart z zewnętrznych API
└── qa-agent.md           # Testuje zmiany, sprawdza build
```

### Jak uruchomić system agentowy:

```bash
cd /home/claude/clawcard
ov init
ov coordinator start
ov sling TASK-001 --capability builder --name frontend-dev
ov sling TASK-002 --capability builder --name combat-designer
ov dashboard  # live podgląd
```

---

## CZĘŚĆ 2: FRONTEND MECHANIKI — PRIORYTETOWA LISTA

### Mechanika 1: Battle Preview (PRIORYTET 1)
**Co to:** Interaktywna wizualizacja walki na siatce 3x2 (Wildfrost-style)
**Gdzie:** Nowy moduł `BattlePreview.tsx`
**Jak:**
- Siatka CSS Grid 3 kolumny x 2 rzędy
- Gracz po LEWEJ (kolumny 1-2), wróg po PRAWEJ (kolumna 3)
- Karty Companion z HP/ATK/Counter jako tokeny na siatce
- Animacja ataku: karta przesuwa się w stronę wroga, cofa
- Counter odlicza każdą turę, animacja pulse gdy counter = 1
**Inspiracja:** slaytheweb (oskarrough) — UI-agnostic game engine w JS

### Mechanika 2: Status Effects System (PRIORYTET 2)
**Co to:** System efektów statusu (Poison, Freeze, Burn, Vulnerable, Strength)
**Gdzie:** `src/systems/StatusEffects.ts` + ikonki w Card Editor
**Jak:**
- Każdy efekt = { id, name, icon, stackable, duration, onTurnEnd }
- Ikony emoji nad kartami na siatce
- Tooltip z opisem efektu i liczbą stosów
- Efekty wzięte z Wildfrost: Snow (freeze), Vim (strength), Berserk
**Referencja:** NueDeck (Arefnue) — kompletny template z systemem efektów

### Mechanika 3: Energy/Mana System (PRIORYTET 3)
**Co to:** System energii do grania kart (jak w StS)
**Gdzie:** `src/systems/Energy.ts` + pasek energii w UI
**Jak:**
- Każda tura gracz dostaje N energii (domyślnie 3)
- Każda karta kosztuje energię
- Pasek energii jako kryształy/orby w stylu dark fantasy
- Animacja zużycia energii

### Mechanika 4: Card Draw & Deck Zones (PRIORYTET 4)
**Co to:** Draw Pile, Hand, Discard Pile — strefy kart
**Gdzie:** `src/systems/DeckManager.ts`
**Jak:**
- State machine: draw → hand → play → discard → shuffle back
- Animacja dobierania: karta "leci" z draw pile do ręki
- Animacja odrzucenia: karta spada do discard pile
- Shuffle animation gdy draw pile pusty
**Referencja:** slaytheweb actions.js — czysta implementacja w JS

### Mechanika 5: Map/Run Exploration (PRIORYTET 5)
**Co to:** Proceduralna mapa z węzłami (jak StS)
**Gdzie:** Rozbudowanie istniejącego Map Editor
**Jak:**
- Węzły: Combat, Elite, Boss, Shop, Rest, Event, Treasure
- Połączenia między węzłami jako ścieżki
- Proceduralna generacja przez seed
- Visualizacja: SVG lub Canvas
**Nowe repo do zbadania:** slaytheweb — ma implementację mapy

---

## CZĘŚĆ 3: GORĄCE REPO DO PODPIĘCIA NA VPS

### Silniki i frameworki deckbuilder:

| Repo | Stack | Co daje ClawCard |
|------|-------|-----------------|
| oskarrough/slaytheweb | JS/Web | UI-agnostic engine, actions system, state machine |
| Arefnue/NueDeck | Unity | Architektura: Card SO, Reward System, Map |
| guladam/deck_builder_tutorial | Godot 4 | GDScript patterns dla przyszłego Godot portu |
| hoshutakemoto/DeckBuilderRoguelikeEngine | Unity/DDD | Clean architecture, DDD patterns |
| htdt/godogen | Claude Code | Auto-generuje Godot 4 projekty z opisu |

### Do sklonowania na VPS teraz:

```bash
cd /root
git clone https://github.com/oskarrough/slaytheweb.git
# Referencja: public/game/actions.js — wzorzec state management
# Referencja: public/game/cards.js — wzorzec definiowania kart

git clone https://github.com/jayminwest/overstory.git
# System agentowy z live dashboard
```

---

## CZĘŚĆ 4: LIVE DASHBOARD — SETUP

### Plan: Agent Monitor na porcie 4820

```bash
# Na VPS
cd /root
git clone https://github.com/hoangsonww/Claude-Code-Agent-Monitor.git
cd Claude-Code-Agent-Monitor
npm install
npm run build

# Uruchom jako pm2 service
pm2 start "npm start" --name agent-monitor
pm2 save

# Dodaj do nginx jako /agents
# http://46.62.231.237/agents → port 4820
```

### Co zobaczysz na dashboardzie:
- Kanban board: TODO → IN_PROGRESS → DONE → FAILED
- Live feed tool calls (Read, Write, Bash, Git)
- Agent swim lanes — kto co robi
- Commit history z diff summaries
- Token usage per agent

---

## CZĘŚĆ 5: KONKRETNE NASTĘPNE KROKI (KOLEJNOŚĆ)

### KROK 1 — TERAZ (Claude Code na VPS pracuje):
- [x] Claude Max zalogowany
- [x] Git credentials ustawione
- [x] Przeprojektuj StartPage.tsx — dark fantasy UI
- [x] Dodaj CSS variables do index.css
- [x] Card Editor hover animation

### KROK 2 — Po deployu frontendu:
```bash
cd /home/claude/clawcard
claude "Zaimplementuj BattlePreview.tsx — siatka 3x2, tokeny kart, counter animation. Wzoruj się na slaytheweb/public/game/actions.js dla state management. React + TypeScript + CSS modules."
```

### KROK 3 — System agentowy:
```bash
cd /root && git clone https://github.com/jayminwest/overstory.git
cd overstory && bun install && bun link
cd /home/claude/clawcard && ov init && ov coordinator start
```

### KROK 4 — Agent Monitor live:
```bash
cd /root/Claude-Code-Agent-Monitor && npm run build
pm2 start "npm start" --name agent-monitor
# Nginx: /agents → localhost:4820
```

### KROK 5 — Multi-agent sprint:
```
ov sling FRONTEND-001 "Zaimplementuj BattlePreview mechanikę" --capability builder
ov sling FRONTEND-002 "Zaimplementuj Status Effects system" --capability builder
ov sling SCRAPER-001 "Napraw scraper kart StS przez MediaWiki API" --capability builder
ov dashboard  # Obserwuj live
```

---

## CZĘŚĆ 6: MECHANIKI NA FRONTEND — SPECYFIKACJA TECHNICZNA

### BattlePreview.tsx — pełna spec:

```typescript
// Struktura state
interface BattleState {
  grid: {
    playerSide: (CardToken | null)[][]  // [row][col], 2x2
    enemySide: (CardToken | null)[][]   // [row][col], 2x1
  }
  turn: number
  energy: { current: number, max: number }
  hand: Card[]
  drawPile: Card[]
  discardPile: Card[]
  statusEffects: Map<string, StatusEffect[]>
}

interface CardToken {
  cardId: string
  hp: number
  maxHp: number
  atk: number
  counter: number  // Wildfrost counter
  statusEffects: StatusEffect[]
}
```

### Status Effects — lista do zaimplementowania:
- **Poison** — zadaje X dmg na początku tury, zmniejsza o 1
- **Freeze/Snow** — pomija turę, po X turach odpada
- **Strength/Vim** — zwiększa ATK o X permanentnie
- **Vulnerable** — otrzymuje 50% więcej dmg
- **Weak** — zadaje 25% mniej dmg
- **Berserk** — atakuje losowy cel, +X ATK
- **Shield** — blokuje X dmg jednorazowo

---

*Stack: React + Vite + TypeScript na Hetzner VPS Ubuntu 24.04*
*Claude Code Max: Opus 4.6 1M context*
