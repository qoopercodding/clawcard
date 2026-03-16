# clawcard — Plan Rozwoju

## Stack
- Godot 4.6, GDScript
- Viewport: 1920x1080, canvas_items, expand (21:9 UWQHD)
- Repo: https://github.com/qoopercodding/clawcard (prywatne)

---

## Aktualny stan (2026-03-08)

### Zrobione
- Run loop: Map → Battle → Shop → Rewards → Campfire → Treasure
- System kart jako Resource (`card.gd`)
- 8 kart warriora + 25 kart Wildfrost zaimportowanych z JSON
- Mapa (Slay the Spire style): generator, pokoje, scrollowanie
- UI przeskalowane do 1920x1080 (częściowo — battle screen jeszcze nie)
- TopBar: HP, Gold, Deck button

### Do naprawienia (techniczny dług z tej sesji)
- Battle screen — sceny 2D nadal mają hardcoded pozycje dla 256x144
- `stats_ui.tscn`, `intent_ui.tscn`, `shop.tscn`, `campfire.tscn` — nie przeskalowane
- `rescale_ui.gd` (EditorScript w root projektu) — napisany, nigdy nie uruchomiony

---

## PRIME TASK — Najbliższa sesja

### Globalny moduł skalowania UI

Zamiast ręcznego edytowania każdej sceny 1-by-1, stworzyć `global/ui_scale.gd` z metodami:

```gdscript
# Przykładowy interfejs
UIScale.scale_node(node: Control)        # skaluje custom_minimum_size, offsets
UIScale.scale_scene(scene_root: Node)    # rekurencyjnie skaluje całą scenę
UIScale.pos(x: float, y: float) -> Vector2  # konwertuje pixelart coords → 1920x1080
UIScale.size(w: float, h: float) -> Vector2
```

Wywołanie: autoload który po `_ready()` przechodzi przez drzewo sceny i normalizuje.
Alternatywa: EditorScript który zapisuje zmiany do plików .tscn (trwałe).

**Decyzja do podjęcia:** runtime scaling (wolniejszy start, łatwiejszy w utrzymaniu) vs EditorScript (jednorazowy, trwałe zmiany w plikach).

---

## Sesje — Tematy i Kolejność

### Blok A — Fundament techniczny (priorytet wysoki)

**A1. UI Scale Module** (prime task)
- Globalny moduł do skalowania/pozycjonowania
- Dokumentacja konwencji: "wszystkie pozycje UI w 256x144 space, konwertowane automatycznie"

**A2. Battle Screen Fix**
- Przeskalować `battle.tscn`, `stats_ui.tscn`, `intent_ui.tscn`
- Enemy i player positions w scenie 2D

**A3. Counter System (Wildfrost-like)**
- Każda karta/unit ma counter zamiast kosztu many
- Counter tick co turę → kiedy 0, akcja
- Zastąpić obecny mana system
- To jest core mechanika — bez tego gra nie jest tym czym ma być

**A4. Card Framework — struktura i upgrade system**
- Podzielić karty na typy: Attack, Companion, One-time-use, Charm/Artifact
- Każdy typ ma inny visual slot i mechanikę
- System upgradowania: `base_value * 2` lub `base_value + flat_bonus`
- Resource `card.gd` dostaje `upgraded: bool` i `get_upgraded_version() -> Card`
- POC: jedna karta z dwoma wersjami

---

### Blok B — Content i Design

**B1. Projekt karty — wygląd i layout**
- Sekcje karty: ikona, nazwa, koszt (counter), opis efektu, rzadkość, typ
- Inspiracje: Wildfrost (kompaktowe), STS (czytelne), Against the Storm (ikonografika)
- Placeholder system: każda karta ma zdefiniowane sloty, nawet bez artu

**B2. Świat i Lore**
- Ustalić setting: biomy → unikalne mechaniki per region
- Przykład: Tundra → freeze/slow mechaniki, Pustynia → burn/exhaust
- Co daje szerokie spektrum: minimum 4-5 biomów z unikalnymi kartami i potworami
- Lore nie musi być kompletne — wystarczy "premise" która kieruje decyzje designu

**B3. Scraper — inspiracje z innych gier**
- Napisać scraper dla wiki Wildfrost, STS, Inscryption, Monster Train
- Zbierać: mechaniki kart, efekty statusów, struktury run
- Output: JSON / Markdown do analizy

---

### Blok C — Narzędzia i Workflow

**C1. Card Creator Tool**
- Prosty UI w Godot lub zewnętrzny (web app?) do tworzenia kart
- Pola: nazwa, stats, opis, ikona (drag & drop), typ
- Eksport do `.tres` automatycznie
- Cel: nietech osoba może dodać kartę bez dotykania kodu

**C2. Git Workflow dla nietech**
- GitHub repo z Actions: push → auto-build → dostępna grywalna wersja
- Issues jako "tasklist" dla designerów i programistów
- Template issue: Bug, Karta do dodania, Mechnaika, Balance

**C3. Dokumentacja — żywy dokument**
- Ten plik to początek
- Dodać: Architecture Decision Records (ADR) dla kluczowych decyzji
- Dodać: Glossary (Counter, Charm, Companion — co to znaczy w tej grze)

**C4. Multi-agent pipeline**
- Koncepcja: Agent 1 (design) → propozycja karty → Agent 2 (balance) → weryfikacja wartości → Agent 3 (kod) → implementacja
- Narzędzia: Claude Projects lub własny orchestrator
- To jest zaawansowane — dopiero po C1-C3

---

### Blok D — AI i Research

**D1. AI Advisor / Hint System**
- Research: czy istnieją narzędzia AI do "podpowiadania" strategii w kartciankach
- Kandydaci: AlphaStar-like dla karcianek, LLM-based coach, pattern matching na replays
- Zastosowanie: reverse-engineering niuansów mechanik które AI (ja) nie widzi podczas grania

**D2. AI Game Balance**
- State of art: jak działają systemy balance w grach (Hearthstone ELO analiza, MTG Arena)
- Narzędzia: symulatory Monte Carlo, evolutionary algorithms na deck-building
- POC: prosty symulator walki który pozwala testować wartości kart

**D3. Placeholder Art Pipeline**
- Workflow: prompt → AI image → import do Godot jako placeholder
- Narzędzia: Stable Diffusion local, Midjourney API, lub gotowe asset packi pixelart
- Animacje: Aseprite + integracja z Godot jako SpriteFrames

---

## Tasklist — Priorytety

### P0 — Blokujące gameplay (zrób najpierw)
1. UI Scale Module (globalny, nie 1-by-1)
2. Battle Screen fix (gra jest niegrywalna bez tego)
3. Counter system (core mechanika)

### P1 — Core gameplay loop
4. Card types + upgrade system POC
5. Card Creator Tool (żeby móc dodawać karty bez MCP)
6. Balance: podstawowy symulator walki

### P2 — Content
7. Lore / setting premise (1 strona, nie powieść)
8. Projekt wizualny karty (mockup)
9. Scraper wiki innych gier

### P3 — Tooling i scale
10. Git workflow dla nietech
11. Dokumentacja architecture
12. Multi-agent pipeline (koncepcja → implementacja)
13. AI balance tools research
14. Placeholder art pipeline

---

## Pytania otwarte (do decyzji)

1. **Counter vs Mana:** Czy całkowicie usuwamy manę? Wildfrost nie ma many w ogóle. STS ma. Co chcemy?
2. **Companion cards:** Czy companion to persistent unit na polu (jak Wildfrost) czy jednorazowy efekt (jak STS relic)?
3. **Setting:** Mroczne fantasy, sci-fi, coś innego? To determinuje wszystkie kolejne decyzje artowe.
4. **Multiplayer kiedykolwiek?** Jeśli tak, architektura kodu musi to uwzględnić od początku.
