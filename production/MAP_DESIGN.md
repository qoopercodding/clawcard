# ClawCard — Circular Map Design Document
Stan: 2026-03-23 | Status: DRAFT v2

---

## GEOMETRIA MAPY

Mapa = jeden okrąg (pierścień). Gracz startuje prawym górnym (godzina ~2).
Domyślny kierunek ruchu: clockwise.
Powrót: możliwy, counter-clockwise, kosztuje mniej kroków (patrz system kroków).
Koniec okręgu łączy się z początkiem — mapa jest zamknięta.

---

## SYSTEM KROKÓW

Gracz startuje z pulą kroków (default: 100).
Każde przejście do przodu = 1 krok.

### Tryb powrotu (testowalny toggle):
- `backtrack_cost: 0.5` (DEFAULT) — powrót kosztuje 0.5 kroku. Co 2 cofnięcia = 1 krok odjęty.
- `backtrack_cost: 1.0` (HARDCORE) — powrót = pełny 1 krok jak do przodu.

Toggle dostępny w Builder Tool Test Environment jako UI switch.
Zapis w konfiguracji runu jako flaga: `backtrack_half_cost: true/false`.

### Uzupełnienia kroków na mapie:
- Obozowisko: +15-20 kroków + heal HP
- Studnia/Fontanna: +5-8 kroków + mały heal
- Węzeł resetuje się po opuszczeniu — nie można farmić.

### Co gdy kroki = 0:
- Gracz "dryfuje" — może jeszcze zrobić 5 kroków awaryjnych (Desperation Steps)
- Po wykorzystaniu Desperation Steps: game over (rozproszenie)
- Wizualnie: kolor licznika zmienia się na czerwony gdy < 15 kroków

---

## ARCY I MITOLOGIE

Okrąg podzielony na 4 arcy:

| Arc | Pozycja (zegar) | Mitologia | Paleta |
|-----|-----------------|-----------|--------|
| 1 | 12→3 (góra) | Nordic | Stalowy błękit, lód, srebro |
| 2 | 3→6 (prawo) | Egyptian | Złoto, piasek, cień |
| 3 | 6→9 (dół) | Japanese + Mesoamerican | Karmazyn, zieleń, jade |
| 4 | 9→12 (lewo) | Transformer/Void | Irydeścencja, teal, magenta |

Final Boss: ~7-8 na zegarze (między Arc 3 a 4).
Gracz clockwise trafia na niego po ~75% okrążenia.
Gracz counter-clockwise trafia na niego po ~25% — czyli prawie od razu.

---

## PULA BOSSÓW — 9 dostępnych, 6 per run

Przy starcie każdego runu losuje się 6 z 9. Po 1-2 per arc.
Pozostałe 3 wolne sloty → losowy typ węzła (walka/sklep/wydarzenie).

### Pula bossów:

| # | Nazwa | Mitologia | Mechanika | Waga losowania |
|---|-------|-----------|-----------|----------------|
| 1 | Jotun Warlord | Nordic | Fury Stack: każde trafienie +1 ATK | 1.0 |
| 2 | Draugr Queen | Nordic | Przywołuje 2 Draugr po śmierci | 1.0 |
| 3 | Devourer | Egyptian | Niszczy kartę z decku jeśli nie zabity w 3 turach | 1.0 |
| 4 | Weigher of Souls | Egyptian | Wygrywa rundę gdy jego HP < HP gracza | 1.0 |
| 5 | Sword-God Fragment | Japanese | Immune na ostatnią zagraną kartę (Object Memory) | 1.0 |
| 6 | Lantern Herald | Japanese | Ujawnia następne 3 akcje gracza wrogom | 1.0 |
| 7 | Tzitzimitl | Mesoamerican | Po śmierci klnie 1 kartę gracza | 1.0 |
| 8 | Jaguar Priest | Mesoamerican | Ritual Counter x2 szybszy | 1.0 |
| 9 | Proto-Q | Transformer | Zmienia mechanikę co turę — losowa | 0.5 |

Waga 0.5 dla Proto-Q = trafia do puli 2x rzadziej niż pozostałe.
Balance docelowy: każdy boss ma zdefiniowany "counter" — kartę lub strategię która go kontruje.
TODO (balance-designer): przypisać countery dla każdego bossa.

---

## FOG OF WAR — WIDOCZNOŚĆ

| Odległość od gracza | Widoczność |
|--------------------|-----------|
| 0 (aktualny węzeł) | Pełna info — typ + zawartość |
| 1 węzeł do przodu/tyłu | Ikona typu, bez szczegółów |
| 2+ węzłów | Zarys/cień ikony, brak typu |
| Boss arcu | Zawsze widoczny (niezależnie od odległości) |
| Final Boss | Zawsze widoczny — ma aurę przebijającą mgłę |

---

## TYPY WĘZŁÓW

| Ikona | Typ | Opis | Częstość |
|-------|-----|------|----------|
| ⚔️ | Walka | Standard encounter, wrogowie z aktualnego arcu | ~40% |
| 💀 | Mini-boss | Silniejszy wróg, lepszy loot, 1 per arc (z puli 9) | per arc |
| 👑 | Boss arcu | Koniec arcu, zmiana mitologii | 1 per arc |
| 🏕️ | Obozowisko | +15-20 kroków + heal HP, jednorazowy | ~8% |
| 💧 | Studnia | +5-8 kroków + mały heal, jednorazowy | ~8% |
| 🏪 | Sklep | Kupno kart/equipmentu, nowy stock per wizytę | ~10% |
| 📦 | Znajdź | Losowy loot — karta, item, fragment lore | ~10% |
| 📜 | Wydarzenie | Wybór narracyjny + konsekwencja mechaniczna | ~9% |
| 🌀 | Portal | Teleport do innego węzła (kosztuje kroki) | ~5% |

---

## WYGLĄD MAPY — SPECYFIKACJA WIZUALNA

- Styl: pixel art 32-bit minimum (SNES/GBA era)
- Tło: #080818 (głęboka granat/czerń)
- Pierścień: kamienista droga, wyglądająca na starożytną
- Każdy arc ma własny kolor środowiska i detale wizualne
- Węzły: świecące ikony z halo w kolorze typu
- Mgła: stopniowe przyciemnienie od aktualnej pozycji gracza
- Kamera: do ustalenia (statyczna cały okrąg vs podążająca za graczem)

---

## PROMPT DO GENERATORA GRAFICZNEGO (v2)

```
Top-down circular RPG world map, pixel art style, 32-bit pixel art minimum
(SNES/GBA era fidelity), dark fantasy with neon glowing accents.

OVERALL COMPOSITION:
The entire map is a single large RING/CIRCLE. The center of the ring is an
empty void — dark fractures in reality, wisps of dark purple/black energy
drifting inward. No terrain in the center, only emptiness.

THE RING is divided into 4 distinct arc zones:

ARC 1 — NORDIC (top, 12 to 3 o'clock):
Icy steel blue, deep navy, silver frost. Shattered ice pillars, fragments of
a giant frozen tree (Yggdrasil), Viking longhouse ruins embedded in the path.
Snowflakes drifting, cold mist.

ARC 2 — EGYPTIAN (right, 3 to 6 o'clock):
Warm gold, sand yellow, deep amber with shadow purple. Broken pyramid tops
beyond the path, floating hieroglyph stones, ghost silhouettes walking the
path. Sand particles, faint golden shimmer.

ARC 3 — JAPANESE/MESOAMERICAN (bottom, 6 to 9 o'clock):
Deep crimson, forest green, dark jade. Crumbling torii gate arch over the
path, stone calendar carvings, ritual torches burning green flame.
Ember sparks, smoke wisps.

ARC 4 — TRANSFORMER/VOID (left, 9 to 12 o'clock):
Shifting iridescent — teal, magenta, gold blending chaotically. Broken mirrors
floating, half-formed structures that seem to be multiple things at once.
Color-shifting particles.

NODE PLACEMENT along the circular worn stone path (connected by dotted road):
- Small crossed swords = combat (place 4-5 per arc, most common, small)
- Glowing skull = mini-boss (1-2 per arc, larger, orange glow)
- Large crown = arc boss (1 per arc, large pulsing, colored to match arc)
- Campfire = rest camp (1 per arc)
- Blue water drop = fountain/well (1-2 per arc)
- Gold bag = shop (1 per arc)
- Wooden chest = loot node (1-2 per arc)
- Spiral portal = teleport (1 total on the ring)

PLAYER START: top-right (~2 o'clock). Bright white pennant flag + "START"
text. Small glowing white arrow pointing clockwise.

FINAL BOSS at bottom-left (~7-8 o'clock):
A massive Flying Spaghetti Monster in pixel art — chaotic noodle mass with
two glowing meatball eyes. Purple-black corruption aura bleeding into both
adjacent arcs. This node is LARGER than all others. Faint skull-and-noodles
icon above it. Ominous. Always visible through the fog.

FOG OF WAR: nodes far from START are darker, partially obscured by shadow
and mist. Nearest 3-4 nodes from start are bright and clear. The rest
gradually fade to silhouettes going around the ring.

UI OVERLAY (right side of image, outside the ring):
- Steps counter: "67 / 100 STEPS" with boot icon
- Arc indicator: colored square showing "NORDIC ARC" with snowflake
- Legend: small icons with 1-word labels for each node type

STYLE:
- 32-bit pixel art (SNES/GBA era minimum)
- Background: #080818
- Ring road: worn ancient cobblestone or carved stone
- All node icons have subtle glow halo matching their color
- Feel: ancient world crumbling, mythologies colliding
- No modern UI elements — everything looks hand-painted or engraved
- Slight isometric tilt (~15 degrees from pure top-down)
```

---

## TODO — MAP DESIGN

- [ ] MD-01: Decyzja — kamera statyczna (pełny okrąg widoczny) vs podążająca
- [ ] MD-02: Implementacja toggleu backtrack_cost w Builder Tool
- [ ] MD-03: Prototyp grafu węzłów (dane, nie grafika) w GDScript
- [ ] MD-04: Algorytm losowania 6 z 9 bossów z wagami
- [ ] MD-05: Fog of war — implementacja systemu widoczności
- [ ] MD-06: Desperation Steps — implementacja trybu awaryjnego
- [ ] MD-07: Balance bossów — przypisanie counterów (balance-designer)
