# ClawCard — Master Configuration dla Claude Code

## Projekt
Roguelike deckbuilder inspirowany Wildfrost. Silnik: Godot 4.6, język: GDScript.
Builder Tool: React/Vite/TS w wildfrost-poc/clawcard-builder/ (port 5173).
Repo: https://github.com/qoopercodding/clawcard

---

## ZANIM ZACZNIESZ — obowiązkowe

1. Przeczytaj `docs/SESSION_STATE.md` — aktualny stan projektu
2. Przeczytaj `docs/LESSONS.md` — błędy z poprzednich sesji których NIE powtarzać
3. Sprawdź `docs/TASKS.md` — co jest do zrobienia
4. Jeśli pracujesz nad Godot: użyj MCP (`godot-mcp:editor get_state`) do weryfikacji

---

## Struktura repo

```
clawcard_base/
├── src/
│   ├── cards/          # GDScript — definicje kart
│   ├── mechanics/      # GDScript — logika walki, countery, statusy
│   ├── enemies/        # GDScript — AI wrogów
│   └── tools/          # Python — scrapery, narzędzia
├── wildfrost-poc/
│   └── clawcard-builder/   # React Builder Tool (Frame/Card Editor, Galeria)
├── docs/               # SESSION_STATE, TASKS, LESSONS, BUGS
├── design/             # GDD, mechaniki, balans kart
├── assets/             # PNG, audio
└── .claude/
    ├── agents/         # Definicje agentów
    └── skills/         # Slash commands
```

---

## Agenci i ich domeny

### Strategiczny (zamawiasz od nich plan, nie kod)
- **game-director** — wizja gry, spójność, blokuje feature creep
- **creative-director** — klimat, narracja, spójność artystyczna

### Operacyjny (robią konkretną pracę)
- **gameplay-lead** → **combat-designer** — mechaniki walki, countery, statusy
- **gameplay-lead** → **balance-designer** — wartości kart, HP, ATK, krzywa trudności
- **tech-lead** → **godot-specialist** — GDScript, sceny, architektura
- **tech-lead** → **tools-programmer** — Builder Tool (React/Vite), Vite plugin, pipeline
- **art-lead** → **technical-artist** — ramki kart PNG, UI, CardFrame renderer

### QA i Produkcja
- **qa-tester** — testy walki, edge case'y, raporty bugów
- **devops-engineer** — VPS (Hetzner 46.62.231.237), nginx, deployment, git hooks

---

## Slash Commands (najważniejsze dla ClawCard)

```
/balance-check      — sprawdź balans kart (HP/ATK/Counter wartości)
/design-review      — review systemu mechanik pod kątem fun i spójności
/scope-check        — czy ta zmiana jest niezbędna dla MVP?
/prototype          — zrób throwaway prototype w prototypes/ (NIE w src/)
/brainstorm         — sesja ideacji z game-director i creative-director
/team-combat        — cały team (combat + balance + godot) nad systemem walki
/bug-report         — stwórz raport buga do docs/BUGS.md
/sprint-plan        — zaplanuj sprint (co robimy do następnego spotkania)
```

---

## Zasady pracy

### Godot
- Zawsze użyj `godot-mcp:editor get_state` przed zmianami
- NIE edytuj .tscn ręcznie — przez MCP albo przez Godot editor
- `content_scale_factor` w autoload/ui_scale.gd = 7.5 (UIScale dla 1920x1080)
- Viewport: 1920x1080 (NIE 256x144)

### Builder Tool
- Vite plugin (`vite-plugin-frame-config.ts`) obsługuje POST /api/save-frame-config
- Plugin zapisuje PNG + aktualizuje 3 pliki TS + git push
- Restart `npm run dev` wymagany po zmianie pluginu
- Port dev: 5173 (lokalnie) lub 80/nginx (VPS)

### Git
- Każda zmiana = commit: `feat/fix/docs/checkpoint: opis`
- Push po każdym commicie
- Przy 80% limitu tokenów: `checkpoint: [co zrobiono] | następny krok: [co zostało]`

### Balans kart
- Karty mają: HP (1-20), ATK (0-10), Counter (1-9)
- Status effects: Snow ❄ (blokuje atak), Shield 🛡 (absorb dmg), Teeth 🦷 (dmg zwrotny), Poison ☠
- Starter deck: 8 kart (3× Sword, 2× Snowball, 1× Bonesaw, 2× Healberry)

---

## VPS (Hetzner)
- IP: 46.62.231.237
- OS: Ubuntu 24.04
- Builder Tool: nginx → /var/www/clawcard/wildfrost-poc/clawcard-builder/dist
- ClawMetry: port 8900
- Telegram bot: @Czilclaw_bot
- Credentials: /root/clawcard/secrets/ (NIE w repo)

---

## Aktualny stan (2026-03)

### ✅ Zrobione
- Builder Tool (Frame Editor + Card Editor + Galeria) — pełny pipeline
- Typy kart: companion, item_with_attack, item_without_attack, boss (+ testets, test2)
- CardStore (React context) — userCards, pendingType handoff
- Frame Editor → Card Editor handoff (pending_card_type)
- Galeria: zakładki Wszystkie/Moje, dynamiczne filtry
- Vite plugin: POST /api/save-frame-config → zapisuje PNG + TS + git push
- Battle Demo: Snow, Shield, Teeth, Poison, 5 wrogów, counter ring

### 🔴 Blokery
- UIScale w Godot NIE zaimplementowany (content_scale_factor = 7.5 czeka)
- Manualne edycje .tscn z x7.5 multiplier w ~15 scenach do rewertu

### 📋 Następne kroki (priorytet)
1. UIScale.gd autoload w Godot (content_scale_factor)
2. Core battle loop w Godot (3 companion karty vs 3 wrogów, counter tick, win/lose)
3. Reward screen po walce (wybierz 1 z 3 kart)
4. Deployment Builder Tool na VPS dla designerów

---

## Pętla samodoskonalenia

Po każdej korekcie od użytkownika → zaktualizuj `docs/LESSONS.md`.
Po każdym zakończonym zadaniu → zaktualizuj `docs/SESSION_STATE.md`.
Przed każdą sesją → przeczytaj oba pliki.
