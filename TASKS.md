# ClawCard — Sprint Tasks

## PRIORYTET 1: Frontend Builder Tool
- [x] Przeprojektuj StartPage na dark fantasy UI (ciemne tło, złote akcenty, gothic font)
- [x] Dodaj animowane tło na StartPage (particles lub CSS gradient animation)
- [x] Przeprojektuj nawigację między modułami — sidebar z ikonami zamiast przycisków
- [x] Card Editor: podgląd karty renderowany w stylu Wildfrost (ramka, ikony statystyk)
- [x] Card Editor: animacja hover na podglądzie karty
- [x] Dodaj global dark theme CSS variables (--color-bg, --color-gold, --color-dark)

## PRIORYTET 2: Card Library Scraper
- [x] Napraw scraper StS1 — API jest offline, użyj MediaWiki API z wiki.gg
- [x] Scraper Monster Train — pobierz 282 karty przez MediaWiki API fandom
- [x] Merge wszystkich kart do card_library.json
- [x] Dodaj przeglądarkę kart w Card Editor z filtrowaniem po grze/typie

## PRIORYTET 3: Frame Editor → Card Editor handoff
- [x] Po zapisaniu ramki w Frame Editor, Card Editor dynamicznie ładuje nowe typy
- [x] Custom pola z Frame Editor pojawiają się jako pola w Card Editor
- [x] frameTypes.json jako single source of truth (localStorage registry: custom_frame_types)

## PRIORYTET 4: VPS Infrastructure
- [ ] ttyd jako systemd service (DONE)
- [ ] nginx proxy do Builder Tool (DONE)
- [ ] openclaw Telegram gateway (DONE)
- [ ] Scraper kart odpalony na VPS

## PRIORYTET 5: Roguelike Game Loop (CC-001 → CC-022)
- [x] CC-001: StartPage redesign — grouped nav cards, glow hover, section headers
- [x] CC-002: Global CSS variables aligned with design system
- [x] CC-003: GameState.ts — RunState, PlayerState, BattleState, MapNode interfaces
- [x] CC-004: MapScreen — proceduralna mapa SVG z 7 typami węzłów
- [x] CC-005: RewardScreen — wybór 1 z 3 kart po walce
- [x] CC-006: ShopScreen — Dark Bazaar, kupno itemów za gold
- [x] CC-007: CampfireScreen — rest (heal) lub upgrade karty
- [x] CC-008: EventScreen — losowe zdarzenia z wyborami narratywnymi
- [x] CC-009: TreasureScreen — chest z relics/gold/cards
- [x] CC-010: Map → Screen routing (klik na węzeł → odpowiedni ekran)
- [x] CC-011: GameOverScreen — victory/defeat ze statystykami i score
- [x] CC-012: useRunState hook — centralne zarządzanie stanem runu
- [x] CC-013: RunHUD — pasek HP/gold/floor/deck widoczny podczas runu
- [x] CC-014: Integracja useRunState z App — stan przepływa przez ekrany
- [x] CC-015: DeckViewScreen — podgląd decku z HUD
- [x] CC-016: TASKS.md update z postępem
- [x] CC-017: Starter deck (8 kart) + RunCard type + addCardToDeck
- [x] CC-018: CombatScreen — turn-based combat z attack/defend, enemy tiers
- [x] CC-019: localStorage run persistence z auto-save
- [x] CC-020: Continue Run button na StartPage
- [x] CC-021: Reward picks i shop buys dodają karty do decku
- [x] CC-022: Run history tracking (localStorage, best score, win rate)
- [x] CC-023: Run stats (total runs, best score, win rate) na StartPage
- [x] CC-024: Card removal at shop za 50 gold
- [x] CC-025: Campfire upgrades uzywaja prawdziwych kart z decku
- [x] CC-026: TASKS.md update
