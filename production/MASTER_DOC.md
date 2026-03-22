# ClawCard — Master Documentation
Stan na: 2026-03-22

---

## 1. INFRASTRUKTURA — co działa

### VMka (46.62.231.237)
| Serwis | Port | Autostart | Status |
|--------|------|-----------|--------|
| nginx | 80 | systemd | ✅ |
| Vite dev (pm2 clawcard-builder) | 5173 | pm2 | ✅ online |
| ttyd (web terminal) | 8080 | systemd | ✅ |
| git-lfs | — | zainstalowany | ✅ |

### GitHub Pages
- URL: https://qoopercodding.github.io/clawcard/
- Auto-deploy: GitHub Actions (.github/workflows/deploy-builder.yml)
- Czas deployu: ~35s od pusha
- Wymaga: `lfs: true` w checkout (PNG ramek w Git LFS)

### Workflow — złota reguła
```
ttyd terminal (46.62.231.237:8080)
→ edytuj pliki (python3/nano/sed)
→ npm run build (weryfikacja)
→ git add -A && git commit && git push
→ GitHub Actions auto-deploy na GitHub Pages
```
Godot — TYLKO przez godot-mcp:editor. Nigdy przez PowerShell ani browser.

---

## 2. SYSTEM AGENTOWY — potwierdzony aktywny

### Potwierdzenie z 2026-03-22
```
~/clawcard/.claude/agents/
├── game-director.md      — wizja, scope guard, blokuje feature creep
├── godot-specialist.md   — Godot 4.6, GDScript, MCP, UIScale
├── combat-designer.md    — mechaniki walki, counter system, enemy patterns
├── balance-designer.md   — power budget kart, krzywa trudności
├── tools-programmer.md   — Builder Tool, Vite, deploy pipeline
└── devops-engineer.md    — Hetzner, nginx, pm2, git

~/clawcard/.claude/skills/
├── balance-check/
├── scope-check/
└── sprint-plan/
```

### Jak uruchomić
```bash
cd ~/clawcard && claude
# w sesji:
/sprint-plan    # generuje sprint plan
/balance-check  # sprawdza balance kart
/scope-check    # ocenia czy feature mieści się w sprincie
```

### Sprint 1 (aktywny: 2026-03-22 do 2026-04-04)
Cel: Zrefaktorować system walki z STS → Wildfrost: UIScale, usunięcie many, counter tickujący na wszystkich jednostkach — pierwsze grywalne starcie bez mana/kosztu.

---

## 3. BUILDER TOOL — moduły

URL: https://qoopercodding.github.io/clawcard/

| Moduł | Status | Opis |
|-------|--------|------|
| Battle Demo | ✅ | Grywalne demo: Snow/Shield/Teeth/Poison, 5 wrogów |
| Test Environment | ✅ | Wybierasz karty → symulacja 2 runów → balance report |
| Card Editor | ✅ | Tworzenie kart z live preview |
| Frame Editor | ✅ | Kalibracja ramek PNG drag&drop |
| Galeria | ✅ | Przegląd wszystkich kart |

---

## 4. SYSTEM KART

### Typy kart
| Typ | Ramka PNG | Pola |
|-----|-----------|------|
| companion | Companion Frame.png ✅ | HP, ATK, Counter, Name, Desc, Art |
| item_with_attack | Item_with_attack.png ✅ | ATK, Name, Desc, Art |
| item_without_attack | Item_without_attack.png ✅ | Name, Desc, Art |
| boss | boss.png ✅ | HP, ATK, Counter, Name, Desc, Art |
| transformer | pożyczona companion | HP, ATK, Counter, Name, Desc, Art |
| clunker | brak własnej → fallback companion | — |
| shade | brak własnej → fallback companion | — |
| charm | brak własnej → fallback companion | — |

### Bongo Transformerzy (dodane 2026-03-22)
- **Bongo Prime** (transformer) — HP:10, ATK:3→6, Counter:4
  - Transform gdy HP<50%: ATK×2, Counter reset do 1
- **Bongo Cannon** (item_with_attack) — DMG:5
  - Overheat: każde użycie +1 ATK +1 Counter

---

## 5. GODOT — stan gry

### Co istnieje
- `src/cards/card_base.gd` — bazowa klasa karty
- `src/cards/snowdancer.gd` — przykładowa karta

### Czego NIE ma (blokery krytyczne)
- UIScale — viewport 256×144 skalowany do 1920×1080 nie działa → UI mikroskopijne
- Core battle loop — nie istnieje
- Mapa świata — nie istnieje
- System poruszania — nie istnieje
- Lore — nie istnieje

---

## 6. LORE — do stworzenia od zera

**Aktualny stan: ZERO.** Brak nazwy świata, frakcji, historii, motywacji.

### Punkt wyjścia (do decyzji teamu)

Świat pochłonięty przez **Wieczną Zimę** — permanentny lód przykrył kontynenty.
Ocalałe frakcje walczą o zasoby używając **kart-artefaktów** — skondensowanej esencji dawnych bohaterów i bestii.

### Frakcje (szkic, zgodny z tribe types w kodzie)
| Frakcja | Tribe code | Mechanika |
|---------|------------|-----------|
| Mieszkańcy Lodu | snowdwellers | Snow/Freeze |
| Cieniomanci | shademancers | Shade units |
| Złomiarze | clunkmasters | Clunker constructs |
| Transformerzy Bongo | transformers | Transform przy HP<50% |

**Decyzja teamu wymagana:** dark fantasy / retrofuturyzm / cozy roguelike / inne?

---

## 7. ZADANIA NA TEN TYDZIEŃ — propozycje do przemyślenia

### A. Mapa — nietuziunkowy system poruszania się

#### Propozycja 1: Sieć Znikających Dróg (Graph Traversal)
Mapa jako pajęczyna węzłów. Gracz startuje na peryferiach, cel to centrum.
Każde przejście między węzłami **konsumuje krawędź** — droga znika po użyciu.
Wymusza planowanie: nie ma opcji "cofnę się". Każda decyzja jest permanentna.
Twist: niektóre węzły mają "mosty" — jednorazowe przejścia do odległych lokacji.

#### Propozycja 2: Mapa Zamarzająca (Living Map)
Wieczna Zima dosłownie zamarza lokacje w czasie rzeczywistym.
Gracz ma X tur zanim konkretna ścieżka stanie się niedostępna.
Presja czasowa = element eksploracji, nie oddzielny mechanizm.
Im dłużej gracz zwleka z decyzją, tym mniej opcji.

#### Propozycja 3: Kafelki z Mgłą Wojny (Tile Fog-of-War)
Widoczne tylko sąsiednie kafelki. Reszta nieznana.
Odkrywanie = ryzyko: możesz trafić na boss zamiast sklepu.
Mapa generowana proceduralnie per run — każdy playthrough inny.

---

### B. Tryb walki — propozycja

#### Inicjatywa Fazowa (Wildfrost + twist)
Base: counter ticks globalnie jak w Wildfrost.
Twist 1: gracz może zagrać kartę żeby **wstrzymać counter** jednej jednostki o 1 turę — mini-puzzle inicjatywy.
Twist 2: **Pozycja ma znaczenie** — jednostka na slocie przednim przyjmuje obrażenia zamiast tylnych. Przestawienie jednostek = oddzielna akcja.

---

### C. Dodatkowa mechanika — propozycja

#### Zużycie Kart (Wear & Tear)
Każda karta ma **Durability** (np. 3 użycia).
Po wyczerpaniu karta nie znika — degraduje się:
`Sword 5dmg → Rusty Sword 2dmg → Broken Sword 0dmg`
Naprawa u kupca = ekonomia utrzymania decku.
Karty mają historię — immersja.

---

## 8. DŁUGI TECHNICZNE

| Problem | Pilność | Co zrobić |
|---------|---------|-----------|
| UIScale Godot | 🔴 BLOKUJE | content_scale_factor=7.5 jako autoload ui_scale.gd |
| Core battle loop Godot | 🔴 BLOKUJE | 3v3, counter tick, win/lose |
| Lore i świat | 🟡 Przed spotkaniem | Decyzja teamu |
| PNG sprity Bongo | 🟡 | Doładować fal.ai $10, odpalić gen_bongo.py |
| Ramki clunker/shade/charm | 🟡 | Frame Editor |
| Auth Builder Tool | 🟢 | htpasswd nginx |
| ~~BUG-003 OpenClaw~~ | ✅ FIXED | Przeniesiony z user-level na system-level systemd. `systemctl status openclaw-gateway` działa bez --user. |
| Session-stop hook | 🟢 | Istnieje ale pusty |

---

## 9. TODO — mini zadania

### Godot (blokery)
- [ ] G-01: Stworzyć `res://autoload/ui_scale.gd` z content_scale_factor=7.5
- [ ] G-02: Zarejestrować UIScale w Project Settings → Autoload
- [ ] G-03: Zrevertować stare manualne x7.5 multipliers z .tscn
- [ ] G-04: Implementacja core battle loop — 3 kompanionów vs 3 wrogów
- [ ] G-05: Counter tick system — globalne odliczanie
- [ ] G-06: Win/lose condition detection
- [ ] G-07: Reward screen — wybierz 1 z 3 kart

### Lore
- [ ] L-01: Decyzja teamu — ton świata (dark/cozy/retro)
- [ ] L-02: Nazwa świata
- [ ] L-03: Backstory Wiecznej Zimy (lub innego события)
- [ ] L-04: 4 frakcje — krótkie opisy (1 akapit każda)
- [ ] L-05: Motywacja gracza — dlaczego walczy kartami?

### Mapa — design
- [ ] M-01: Decyzja teamu — która propozycja (1/2/3) lub hybryda
- [ ] M-02: Mockup w Builder Tool lub na papierze
- [ ] M-03: Prototyp w Godot (po decyzji)

### Tryb walki — design
- [ ] W-01: Decyzja 3 pytań design przed implementacją:
  - Czy gracz ma "turę"? (Wildfrost-style vs STS-style)
  - Ile slotów na persistent hand?
  - Pass Turn: Tak / Nie?
- [ ] W-02: Dokumentacja mechaniki Inicjatywy Fazowej
- [ ] W-03: Implementacja pozycji jednostek (front/back slot)

### Mechaniki dodatkowe
- [ ] X-01: Decyzja — Wear & Tear tak/nie?
- [ ] X-02: Jeśli tak — zaprojektować tabelę degradacji dla 10 kart

### Builder Tool
- [ ] B-01: Basic Auth nginx (htpasswd) dla designerów
- [ ] B-02: Doładować fal.ai $10
- [ ] B-03: Odpalić gen_bongo.py → prawdziwe PNG dla Bongo Prime i Cannon
- [ ] B-04: Ramki PNG dla clunker, shade, charm

### Infrastruktura
- [ ] I-01: Naprawić BUG-003 — OpenClaw Gateway autostart po restarcie VMki
- [ ] I-02: Uzupełnić session-stop hook

---

## 10. SANITY CHECK — przed każdą sesją

```bash
# Na VMce (http://46.62.231.237:8080):
pm2 status                                          # clawcard-builder online
curl -s -o /dev/null -w "%{http_code}" http://localhost  # 200
cd ~/clawcard && git status                         # czysto
git log --oneline -3                                # ostatnie commity

# GitHub Pages:
# https://qoopercodding.github.io/clawcard/ — strona działa
# Karty mają ramki i obrazki (nie białe tło)
# Test Environment → Bongo Prime + Cannon → 2/2 WYGRANA

# System agentowy:
ls .claude/agents/   # 6 plików .md
ls .claude/skills/   # 3 foldery

# Godot MCP:
# godot-mcp:editor get_state — "Not connected" jeśli Godot zamknięty — OK
```

---

## 11. ARCHITEKTURA REPO

```
clawcard_base/
├── .github/workflows/deploy-builder.yml   ← GitHub Pages CI/CD
├── .claude/
│   ├── agents/                             ← 6 agentów
│   └── skills/                             ← 3 skills
├── wildfrost-poc/clawcard-builder/
│   ├── public/
│   │   ├── frames/                         ← PNG ramek (Git LFS)
│   │   └── cards/                          ← PNG/SVG kart (Git LFS)
│   ├── src/
│   │   ├── data/sampleCards.ts             ← Wszystkie karty
│   │   ├── types/card.types.ts             ← Typy kart
│   │   ├── utils/frameConfig.ts            ← Konfiguracja ramek + BASE_URL
│   │   └── modules/
│   │       ├── test-env/TestEnvScreen.tsx  ← Test Environment
│   │       ├── battle-demo/
│   │       ├── card-editor/
│   │       └── frame-editor/
│   └── vite.config.ts                      ← base: '/clawcard/' na build
├── production/
│   ├── sprints/sprint-01.md                ← Sprint plan
│   └── MASTER_DOC.md                       ← ten plik
└── src/                                    ← Godot GDScript
    └── cards/
        ├── card_base.gd
        └── snowdancer.gd
```
