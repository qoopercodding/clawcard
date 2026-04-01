# ClawCard — Battle System: Pełny Breakdown Tasków
## EPIC-BATTLE-TASKS.md | 31 marca 2026

---

## ZANIM ZACZNIESZ — ODPOWIEDZI NA 5 PYTAŃ BLOKUJĄCYCH

Marcin musi odpowiedzieć na te pytania zanim zaczniesz implementację:

**P1: Energia** — czy Itemy kosztują energię (3 per tura jak StS)?
**P2: Kolejność tur** — turowe (gracz→wróg naprzemiennie) czy counter-based (każda jednostka sama)?
**P3: Sloty boardu gracza** — 4 sloty (2×2) czy 6 slotów (3×2)?
**P4: Merchant** — raz per akt czy wielokrotnie?
**P5: Card Reward** — po każdej walce czy tylko specjalnych?

**Dopóki nie ma odpowiedzi — implementuj z DEFAULTS:**
- P1: Tak, 3 energy per tura, Itemy kosztują 1-3
- P2: Turowe naprzemiennie (łatwiejsze do testowania)
- P3: 4 sloty (2×2) dla gracza
- P4: Raz per akt
- P5: Po każdej walce

---

## KONCEPCJA: EPIC SHOWCASE

Zamiast budować wszystko na raz i nie wiedzieć co działa — budujesz **jeden interaktywny ekran** dostępny pod `/battle-showcase`. Ma dropdown u góry z listą epiców. Wybierasz epik z listy i NATYCHMIAST widzisz co ten epik dodał do ekranu. Każdy epik jest osobnym "stanem" który można włączyć/wyłączyć.

URL: `http://localhost:5173/battle-showcase`
URL z parametrem: `http://localhost:5173/battle-showcase?epic=3`

Dropdown pokazuje:
```
Epic 0: Pusty ekran (baseline)
Epic 1: Kategorie kart (statyczny widok kart)
Epic 2: Karty przeanalizowane (mechaniki oznaczone)
Epic 3: Battle Screen layout (puste sloty, HUD)
Epic 4: Karty na boardzie (jednostki ze statystykami)
Epic 5: Animacje (ruch kart, hover efekty)
Epic 6: Draw/Discard/Exhaust Pile
Epic 7: Merchant Screen
Epic 8: Campfire Screen
Epic 9: Room Triggers (sekwencja pokoi)
Epic 10: Sandbox Routes (linki do wszystkich)
Epic 11: Full Transitions
```

---

---

# EPIC 1: KATEGORIE KART — TAKSONOMIA
## Implementacja: src/modules/battle/data/

### Co budujesz
Centralny system typów kart. To fundament — wszystko inne z tego korzysta. Zero UI na tym etapie.

### Kroki

**Krok 1.1: Typy TypeScript**
Plik `src/modules/battle/types/cards.ts`. Definiujesz interfejsy:
- `BaseCard` — wspólne pola (id, name, imageUrl, rarity, faction, source)
- `CompanionCard extends BaseCard` — dodaje hp, maxHp, attack, counter, position
- `ItemCard extends BaseCard` — dodaje energyCost, targets, isConsume
- `ClunkerCard extends BaseCard` — jak Companion ale scrap zamiast hp
- `PowerCard extends BaseCard` — efekt permanentny
- `CurseCard extends BaseCard` — negatywna karta
- `CharmCard` — osobny interfejs (nie karta w talii)
- `AnyCard = CompanionCard | ItemCard | ClunkerCard | PowerCard | CurseCard`

**Krok 1.2: Enum wartości**
`CardType`, `CardRarity`, `Faction`, `CardSource` — proste enumy. Faction ma: Szponiarze, Cieniozmiennicy, ZelaznaGmina, KosciLesne, Neutral.

**Krok 1.3: Istniejące karty**
Konwertuj `src/data/sampleCards.ts` żeby używał nowych interfejsów. Nie zmieniaj danych, tylko dostosuj typy.

**Krok 1.4: Guard functions**
`isCompanion(card: AnyCard): card is CompanionCard`, analogicznie dla reszty. Używane wszędzie w logice walki.

### Co widać w Showcase Epic 1
Statyczna siatka 5×8 kart. Każda karta ma widoczny badge z typem (Companion/Item/Clunker/Power/Curse) w kolorze. Panel z lewa: liczniki per typ. Filtrowanie przez checkboxy. Karty używają istniejącego wyglądu z `main.css`. Dane z sampleCards + kilka przykładów każdego typu. Hover na kartę pokazuje tooltip z polami interfejsu.

### Jak tester weryfikuje
Otwierasz `/battle-showcase?epic=1`. Widzisz siatkę kart z kolorowymi badge'ami. Klikasz checkbox "Companion" — zostają tylko Companions. Hover na kartę — tooltip pokazuje hp/atk/counter. Panel po lewej: "Companions: 5, Items: 3, Clunkers: 2".

### Sanity check
`npx tsc --noEmit` — zero błędów typów. Każdy typ ma co najmniej 2 przykłady w danych.

---

# EPIC 2: ENGINE ANALIZY KART
## Implementacja: src/modules/battle/systems/CardAnalyzer.ts

### Co budujesz
Automatyczny pipeline który przechodzi przez karty ze scrapera i sprawdza które mechaniki są zaimplementowane. Działa jako skrypt Node.js plus wizualizacja w UI.

### Kroki

**Krok 2.1: Mechanics Registry**
Plik `src/modules/battle/systems/MechanicsRegistry.ts`. Rejestr to mapa `mechanicId → MechanicDefinition`. Każda definicja ma: id, trigger (onHit/onKill/onPlay/startOfTurn/endOfTurn), effectType (dealDamage/applyStatus/heal/buff/draw/etc), isImplemented (bool), implementedSince (string).

Startowy rejestr zawiera ~15 podstawowych mechanik oznaczonych jako `isImplemented: false` — będą uzupełniane przez kolejne epiki.

**Krok 2.2: Keyword Parser**
Funkcja `parseKeywords(description: string): ParsedMechanic[]`. Parsuje opis karty i wyciąga mechaniki przez regex/keywords. Przykład: "Apply 3 Snow" → `{type: 'applyStatus', status: 'Snow', amount: 3}`. "Frenzy 2" → `{type: 'frenzy', count: 2}`. "When hit" → `{trigger: 'onHit'}`.

**Krok 2.3: Card Analyzer**
Klasa `CardAnalyzer`. Metoda `analyze(card: AnyCard): AnalysisResult`. Zwraca:
- `category` — kategoryzacja automatyczna
- `implementedMechanics` — lista mechanik które są w rejestrze z `isImplemented: true`
- `missingMechanics` — lista mechanik których brak lub `isImplemented: false`
- `needsWikiResearch` — mechaniki niejasne (parser nie rozpoznał)
- `readyToPlay` — bool: czy wszystkie mechaniki zaimplementowane

**Krok 2.4: Batch Analyzer**
Funkcja `analyzeAll(cards: AnyCard[]): AnalysisReport`. Przetwarza wszystkie karty i generuje:
- Łączna statystyka: X kart ready, Y mechanik brakuje
- Ranking mechanik po liczbie kart które ich potrzebują
- Lista kart ready-to-use

**Krok 2.5: Wiki Fetch (opcjonalne)**
Jeśli karta ma `needsWikiResearch: true`, agent może wywołać fetch do wildfrostwiki.com/[NazwaKarty] i sparsować opis. Tylko gdy ma dostęp do sieci na VPS.

### Co widać w Showcase Epic 2
Ten sam widok co Epic 1 ale każda karta teraz ma dodatkowy status badge: zielone "✓ Ready" jeśli wszystkie mechaniki są w rejestrze, żółte "⚠ Partial" jeśli część, czerwone "✗ Missing" jeśli brak mechanik. Po prawej stronie: panel "Mechanics Report" z wykresem słupkowym najpotrzebniejszych mechanik. Kliknięcie słupka filtruje karty które tej mechaniki potrzebują.

### Jak tester weryfikuje
Otwierasz `/battle-showcase?epic=2`. Widzisz karty z kolorowymi statusami. Panel z prawej pokazuje "Frenzy: potrzebują 47 kart". Klikasz "Frenzy" — zostają tylko karty z Frenzy. Każda karta ma tooltipie listę: "Implemented: onHit, applyStatus | Missing: Frenzy".

### Sanity check
`analyzeAll(sampleCards)` zwraca valid JSON. Parser rozpoznaje minimum 80% opisów kart z sampleCards. `readyToPlay` jest false dla kart z Frenzy (bo Frenzy nie jest jeszcze zaimplementowane).

---

# EPIC 3: BATTLE SCREEN LAYOUT
## Implementacja: src/modules/battle/BattleScreen.tsx

### Co budujesz
Statyczny układ ekranu walki — bez żadnej logiki, tylko wizualny szkielet z CSS. Używa istniejących styli z `wildfrost-poc/styles/main.css`.

### Kroki

**Krok 3.1: BattleScreen.tsx**
Komponent React. Struktura HTML identyczna z istniejącym layoutem z `main.css` (`battle-top`, `battle-arena`, `board-grid`). Wszystkie dane są mock — hardcodowane stringi i liczby.

**Krok 3.2: Top Bar**
Pięć elementów w jednym wierszu:
- `RunIndicator`: "Akt I · Walka 3/5" (tekst)
- `HPBar`: serce + liczba + pasek. Pasek to `<div>` z `width: X%` i kolorem zależnym od procentu (zielony/żółty/czerwony przez CSS transition)
- `EnergyDisplay`: 3 kryształy `<span>`. Kryształ aktywny ma klasę `energy--active` (glow), zużyty `energy--spent` (szary)
- `GoldDisplay`: moneta + liczba
- `EndTurnButton`: duży przycisk, widoczny label "Koniec Tury"

**Krok 3.3: Arena**
Trzy kolumny przez CSS Grid. Lewa: `PlayerBoard` (siatka 2×2, 4 sloty z klasami `cell cell-player`). Środek: wąski separatoro z ikoną VS. Prawa: `EnemyBoard` (siatka 3×2, 6 slotów z klasami `cell cell-enemy`). Wszystkie sloty puste z przerywanymi obramowaniami.

**Krok 3.4: Intent Display**
Pasek między areną a ręką. Na razie: "Wróg planuje: ⚔ 12 | 🛡 8" — mock dane, wyrównane do prawej.

**Krok 3.5: Hand Area**
Pięć placeholder kart ułożonych w wachlarz. Wachlarz przez CSS transform: każda karta ma `rotate(-10deg + i*5deg)` i `translateY(i%3 * 5px)`. Środkowa karta najbardziej wyprostowana. Na razie tylko szare prostokąty z numerami.

**Krok 3.6: Bottom Bar**
Trzy elementy: DrawPile (lewo, stos z liczbą), ExhaustPile (środek, mała ikona), DiscardPile (prawo, stos z liczbą).

**Krok 3.7: Statyczna responsywność**
Wszystkie rozmiary przez `vh`/`vw`/`%`. Top bar: `height: 8vh`. Arena: `flex: 1`. Hand area: `height: 22vh`. Przetestuj na 1920×1080, 1366×768, 1024×768.

### Co widać w Showcase Epic 3
Pełny layout ekranu walki: górny pasek z HP/energią/złotem, puste sloty gracza i wrogów, pasek intencji, 5 szarych kart w wachlarzu, dolny pasek ze stosami. Wszystko jest mock/statyczne. Wyraźnie widać proporcje i podział ekranu.

### Jak tester weryfikuje
Otwierasz `/battle-showcase?epic=3`. Widzisz pełny layout. Zmieniasz rozmiar okna przeglądarki — proporcje zostają identyczne. Hover na "Koniec Tury" — zmiana koloru. HP bar jest widoczny z kolorem. 3 kryształy energii świecą. Dolne pasy są na właściwym miejscu.

### Sanity check
Na rozdzielczości 1366×768 żaden element nie wychodzi poza viewport. Na 1920×1080 layout wygląda "przestronnie" ale proporcjonalnie.

---

# EPIC 4: KARTY NA BOARDZIE
## Implementacja: src/modules/battle/components/BoardCard.tsx

### Co budujesz
Wizualizację kart Companion/Clunker na planszy walki. Używa istniejących styli `wf-card`, `wf-frame`, `wf-banner` z `main.css`. Karta na boardzie jest mniejsza niż karta w ręce.

### Kroki

**Krok 4.1: BoardCard komponent**
Props: `card: CompanionCard | ClunkerCard`, `owner: 'player' | 'enemy'`. Renderuje ramkę w stylu Wildfrost (klasa `wf-card-player` lub `wf-card-enemy`). Używa `wf-art` dla obrazka lub emoji fallback. `wf-banner` dla nazwy. Rozmiar: `width: 120px, height: 150px` dla boardu.

**Krok 4.2: Counter Display**
Koło z liczbą na górze karty. CSS: `border-radius: 50%`, `background: dark`, obramowanie w kolorze frakcji. Klasy stanu: `counter--normal` (szary), `counter--warning` (pomarańczowy glow gdy value=1), `counter--zero` (czerwony pulsujący gdy value=0).

**Krok 4.3: HP Display**
Lewy dolny róg. Serce (❤) + liczba. Klasy: `hp--full` (zielony), `hp--half` (żółty ≤50%), `hp--critical` (czerwony ≤25%). Pasek HP jako cienka belka pod nazwą karty.

**Krok 4.4: ATK Display**
Prawy dolny róg. Ikona miecza (⚔) + liczba. Kolor złoty/pomarańczowy.

**Krok 4.5: Status Effects Row**
Rząd małych kółek pod dolnymi statystykami. Każde kółko: ikona statusu + liczba. Ikony: ❄ Snow, ☠ Poison, 💪 Strength, 🛡 Shell, 🔥 Overburn, 💫 Vim. Tooltip na hover pokazuje nazwę i opis statusu.

**Krok 4.6: Visual States**
CSS klasy dla stanów karty:
- `.board-card--attacking`: karta przesunięta o 15px w kierunku wroga (CSS transform)
- `.board-card--hit`: czerwony flash background przez 300ms (CSS @keyframes flash-red)
- `.board-card--healed`: zielony flash przez 300ms
- `.board-card--dead`: opacity 0, scale 0.8, transition 0.5s
- `.board-card--selected`: złoty glow wokół karty (box-shadow animowany)

**Krok 4.7: Damage Numbers**
Komponent `DamageNumber`. Pojawia się nad kartą gdy ta obrywa. Animacja: `translateY(-40px)` + `opacity: 0` przez 1s. Kolor: biały (normalne), czerwony (kryt), zielony (heal), niebieski (Snow dmg).

### Co widać w Showcase Epic 4
Board z Epic 3 teraz ma prawdziwe karty z sampleCards. Sloty gracza mają Companions z HP/ATK/Counter. Sloty wroga mają Enemy cards. Buttony w showcase: "Hit card" (losowa karta dostaje obrażenia z damage number), "Kill card" (animacja śmierci), "Apply Snow" (dodaje status), "Reset". Każdy przycisk demonstruje jeden stan wizualny.

### Jak tester weryfikuje
Klikasz "Hit card" — widzisz czerwony flash i liczbę "-8" unosząca się i znikającą. Klikasz "Kill card" — karta fade-out i scale-down. Klikasz "Apply Snow" — pojawia się ❄3 obok karty. Counter na karcie z wartością 1 pulsuje pomarańczowo.

### Sanity check
Damage numbers nie nachodzą na siebie gdy kilka pojawi się naraz. Animacja śmierci nie powoduje skoku layoutu.

---

# EPIC 5: ANIMACJE — FRAMER MOTION
## Implementacja: instalacja framer-motion, src/modules/battle/animations/

### Instalacja
```
npm install framer-motion
```

### Co budujesz
System animacji ruchu kart między pozycjami. Kluczowy mechanizm: `layoutId` w Framer Motion — każda karta ma unikalny `layoutId` i biblioteka automatycznie animuje ją z jednej pozycji do drugiej.

### Kroki

**Krok 5.1: Card Identity System**
Każda karta w grze ma unikalne `layoutId` = `card-${cardId}-${instanceId}`. Gdy ta sama karta (ten sam layoutId) pojawia się w nowym miejscu w React tree, Framer Motion animuje ją ze starego miejsca do nowego. To jest magia animacji draw/play/discard.

**Krok 5.2: AnimatedCard wrapper**
Komponent `AnimatedCard`. Opakowuje kartę (HandCard lub BoardCard) w `motion.div`. Props: `layoutId`, `initial`, `animate`, `exit`. `AnimatePresence` wokół wszystkich miejsc gdzie karty się pojawiają/znikają.

**Krok 5.3: Draw Animation (Draw Pile → Ręka)**
Gdy karta wchodzi do ręki: `initial={{ x: -200, y: 200, rotate: -20, opacity: 0 }}`, `animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}`. Transition: `type: 'spring', stiffness: 200, damping: 20`. Stagger między kartami: `delay: i * 0.08`.

**Krok 5.4: Discard Animation (Ręka → Discard Pile)**
Zagrana karta: `exit={{ x: 200, y: 200, rotate: 15, opacity: 0 }}`. Transition: `duration: 0.3, ease: 'easeIn'`.

**Krok 5.5: Play to Board (Ręka → Plansza)**
`layoutId` tej samej karty pojawia się na planszy — Framer Motion animuje przejście. Po wylądowaniu: `animate={{ scale: [1.1, 1.0] }}` (lekki bounce).

**Krok 5.6: Attack Animation**
Nie używa layoutId — to animacja "w miejscu". `animate={{ x: direction * 30, transition: { duration: 0.15 } }}` potem `animate={{ x: 0, transition: { duration: 0.15 } }}`. Sekwencja przez `useAnimate` hook.

**Krok 5.7: Shuffle Animation**
Gdy Draw Pile jest pusty — 5-7 kart z Discard animuje się "latając" do Draw Pile. Każda z losową rotacją i opóźnieniem. `initial: position Discard Pile`, `animate: position Draw Pile`.

**Krok 5.8: Hover Effects**
Na kartach w ręce: `whileHover={{ y: -30, scale: 1.15, zIndex: 100 }}`. Box shadow przez CSS: `hover:box-shadow: 0 0 20px var(--gold)`. Na kartach na boardzie: `whileHover={{ scale: 1.08 }}`.

**Krok 5.9: Transitions między ekranami**
`AnimatePresence` na poziomie routera. Każdy ekran ma `initial={{ opacity: 0, scale: 0.95 }}` i `exit={{ opacity: 0, scale: 1.05 }}`.

### Co widać w Showcase Epic 5
Panel kontrolny po lewej z przyciskami: "Draw 1 Card", "Draw 5 Cards", "Discard Hand", "Play Card to Board", "Trigger Attack", "Kill Unit", "Shuffle". Klikasz każdy i obserwujesz animację. Slider "Animation Speed" (0.1x do 3x) do testowania. Checkbox "Show Debug" pokazuje layoutId na każdej karcie i rysuje ścieżkę animacji.

### Jak tester weryfikuje
Klikasz "Draw 5 Cards" — 5 kart wylata ze stosu Draw Pile do ręki z stagger 80ms. Klikasz kartę w ręce i "Play to Board" — karta płynnie "leci" na slot boardu. Klikasz "Trigger Attack" — karta na boardzie wysuwa się w stronę wroga i cofa. Klikasz "Shuffle" — karty z Discard latają do Draw Pile.

### Sanity check
Na 60fps animacje są płynne. `will-change: transform` ustawione na animowanych elementach. Żadna animacja nie powoduje layout thrashing (sprawdź Chrome Performance tab).

---

# EPIC 6: DRAW/DISCARD/EXHAUST PILE
## Implementacja: src/modules/battle/systems/DeckManager.ts

### Co budujesz
Logikę zarządzania trzema stosami + ich wizualizację z animacjami z Epic 5.

### Kroki

**Krok 6.1: DeckManager**
Pure TypeScript, zero UI. Stan: `drawPile: AnyCard[]`, `hand: AnyCard[]`, `discardPile: AnyCard[]`, `exhaustPile: AnyCard[]`. Metody: `drawCard()`, `drawCards(n)`, `playCard(cardId)`, `discardCard(cardId)`, `exhaustCard(cardId)`, `shuffleDiscardIntoDraw()`, `endTurn()`.

`endTurn()`: wszystkie karty z ręki trafiają do Discard. Dobierz 5 kart (lub max ile jest). Jeśli Draw pusty — shuffle najpierw.

**Krok 6.2: Consume Logic**
Karta z `isConsume: true` po zagraniu trafia do "consumed" (znika kompletnie, nie do Discard ani Exhaust). Animacja: karta "imploduje" — scale(0) + opacity(0) z efektem particle-like glow przez CSS.

**Krok 6.3: Pile Visualizer**
Komponent `PileDisplay`. Props: `type: 'draw'|'discard'|'exhaust'`, `count: number`, `topCard?: AnyCard`. DrawPile pokazuje odwrócone karty (back) + licznik. DiscardPile pokazuje wierzchnią kartę (face-up) + licznik. ExhaustPile: tylko ikona + licznik gdy > 0.

**Krok 6.4: Pile Click Handler**
Kliknięcie DiscardPile: modal/drawer z listą wszystkich kart w Discard (do przejrzenia). Kliknięcie DrawPile: tooltip "X kart pozostało". Kliknięcie ExhaustPile: lista wyczerpanych kart.

### Co widać w Showcase Epic 6
Panel "Deck State" pokazujący aktualny stan wszystkich stosów jako listy. Przyciski: "Start Turn" (dobierz 5), "End Turn" (odrzuć rękę), "Play Card" (zagraj wybraną), "Exhaust Card", "Consume Card". Po każdej akcji animacje z Epic 5 działają. Liczniki na stosach aktualizują się. Kliknięcie Discard Pile otwiera listę odrzuconych kart.

### Jak tester weryfikuje
Klikasz "Start Turn" — 5 kart wylata ze stosu do ręki, licznik Draw Pile zmniejsza się o 5. Klikasz "End Turn" — karty z ręki lecą do Discard, licznik Discard rośnie. Gdy Draw Pile = 0 i klikasz "Start Turn" — najpierw shuffle animacja, potem draw.

### Sanity check
`DeckManager` jest pure TypeScript z testami jednostkowymi. `shuffleDiscardIntoDraw()` faktycznie tasuje (losowa kolejność za każdym razem). Consume nie trafia do żadnego pile.

---

# EPIC 7: MERCHANT SCREEN
## Implementacja: src/modules/battle/screens/MerchantScreen.tsx

### Co budujesz
Pełny ekran sklepu. Osobny route `/battle-showcase?screen=merchant` i `/merchant` w normalnym flow.

### Kroki

**Krok 7.1: MerchantScreen layout**
Trzy sekcje: górna (Merchant + dialog), środkowa (oferta z zakładkami), dolna (zasoby + wyjście). Tło: ciemne drewno, ciepłe oświetlenie (sepia/amber CSS filter na tle).

**Krok 7.2: Merchant Character**
Po lewej stronie górnej sekcji: duży placeholder (600×400px area) na ilustrację lub emoji merchant (🧙 na start). Tekst dialogowy po prawej w dymku CSS (border-radius, speech bubble tail przez CSS pseudo-element).

**Krok 7.3: Tab System**
Trzy zakładki: "Karty", "Charmy", "Itemy". Aktywna zakładka ma podkreślenie w złotym kolorze. Animacja przełączania: zawartość fade-in przy zmianie zakładki.

**Krok 7.4: Card Tab**
3-5 kart wylosowanych z dostępnej puli. Każda karta wyświetlona w pełnym widoku (jak w Epic 1). Pod każdą kartą: cena w złocie z ikoną monety. Przycisk "Kup" — disabled gdy za mało złota. Opcja "Usuń kartę z talii" — wyświetla listę talii gracza do wyboru karty do usunięcia za 75g.

**Krok 7.5: Charm Tab**
2-3 charmy. Każdy charm pokazany jako duże kółko z ikoną + nazwa + opis. Cena 150-250g. Specjalna opcja "Tajemniczy Charm" (gacha) za 100g — gracz nie wie co dostanie, losowe.

**Krok 7.6: Item Tab**
2-4 jednorazowe przedmioty. Prostszy widok: ikona + nazwa + opis + cena. Ceny niższe (30-80g).

**Krok 7.7: Purchase Flow**
Kliknięcie "Kup" → modal potwierdzenia (opcjonalny, można wyłączyć w ustawieniach). Potwierdzenie → animacja złota odlatującego od wskaźnika do karty. Karta "wlatuje" do ikony talii gracza. Stan gracza aktualizowany.

**Krok 7.8: Charm Equip Screen**
Po zakupie charmu: ekran equip. Widok talii gracza (siatka kart). Gracz klika kartę na którą chce equippować charm. Preview "before/after" — karta przed i po zmianach. Potwierdzenie.

**Krok 7.9: Leave Button**
Prawy dolny róg. Animacja wyjścia — ekran merchant przesuwa się w prawo, mapa wraca z lewej.

### Co widać w Showcase Epic 7
Pełny ekran merchant. Zakładki działają. Mock data dla oferty (5 kart, 3 charmy, 3 itemy). Klikalne "Kup" z animacją. Mock złoto: 500g startowo. Charm equip flow po zakupie charmu. Dialog merchant zmienia się po każdym zakupie.

### Jak tester weryfikuje
Otwierasz `/battle-showcase?screen=merchant`. Widzisz Merchant z dymkiem. Klikasz zakładkę "Karty" — 5 kart z cenami. Klikasz "Kup" na niedrogą kartę — animacja złota, karta trafia do talii. Klikasz zakładkę "Charmy" — "Tajemniczy Charm" dostępny za 100g. Kupujesz — pojawia się ekran equip z talią. Klikasz kartę — charm equippowany.

### Sanity check
Nie można kupić gdy złoto < cena (przycisk disabled). Charm equip screen prawidłowo blokuje karty które już mają 3 charmy.

---

# EPIC 8: CAMPFIRE SCREEN
## Implementacja: src/modules/battle/screens/CampfireScreen.tsx

### Co budujesz
Ekran odpoczynku przy ognisku. Ciepły, relaksujący kontrapunkt do walki.

### Kroki

**Krok 8.1: CampfireScreen layout**
Ciemne tło z animowanym ogniskiem w centrum. Ognisko to CSS animation: kilka `<div>` z `border-radius: 50% 50% 20% 20%` i animacją scale + rotate dla efektu płomienia. Kolor: amber/orange gradient z glow.

**Krok 8.2: Action Panel**
Panel z opcjami po prawej stronie ogniska. Cztery przyciski:

1. **Odpoczynek**: ikona serca, opis "Przywróć 30% HP (+X HP)", aktualny HP / max HP widoczny. Zalecane gdy HP < 50% (badge "Zalecane").
2. **Ulepszenie Karty**: ikona iskry, opis "Ulepsz jedną kartę z talii". Klikalne tylko gdy talia > 0.
3. **Kucie Charmu**: ikona młota, opis "Wymagane: Surowiec". Disabled gdy brak materiałów.
4. **Studium Talii**: ikona książki, opis "Przejrzyj talię (bez efektu)". Zawsze dostępne.

Tylko jedna z akcji 1-3 może być wybrana per wizyta. Studium jest bonusowe.

**Krok 8.3: Card Upgrade Sub-screen**
Po wyborze "Ulepszenie Karty": wysuwa się lista talii. Każda karta ma przycisk "Ulepsz". Kliknięcie: efekt iskier CSS, karta zmienia się na "Upgraded" wersję (inny border, badge "↑ Upgraded"), zamknij panel.

**Krok 8.4: Deck View (Studium)**
Fullscreen overlay z siatką talii. Karty posortowane: najpierw Companions, potem Items, na końcu Curses. Możliwość filtrowania. Czysty widok bez interakcji. Zamknij przez ESC lub przycisk X.

**Krok 8.5: Rest Effect**
Wybranie "Odpoczynek": animacja HP bar — płynne wypełnianie od aktualnego do nowego poziomu. Serce pulsuje zielono. Komunikat "+X HP".

**Krok 8.6: Leave Button**
"Ruszaj dalej" — duży złoty przycisk. Animacja wyjścia identyczna z Merchant.

### Co widać w Showcase Epic 8
Ekran z animowanym ogniskiem (CSS pure, bez JS). Panel opcji z czterema przyciskami. Mock HP: 45/100. Przycisk "Odpoczynek" ma badge "Zalecane". Kliknięcie "Odpoczynek" — HP wzrasta animacyjnie do 75/100. Kliknięcie "Ulepszenie Karty" — pojawia się lista 5 kart z mock talii.

### Jak tester weryfikuje
Ognisko animuje się płynnie (żadne klatki nie skaczą). Klikasz "Odpoczynek" — HP pasek animuje się do 75%. Klikasz "Ulepszenie" — lista kart, klikasz jedną — iskry + badge Upgraded. Studium Talii otwiera fullscreen overlay zamykane Escape.

### Sanity check
Ognisko animacja działa na 60fps bez `requestAnimationFrame` hack (czyste CSS). Można wybrać tylko jedną akcję (kliknięcie po wyborze jest disabled).

---

# EPIC 9: ROOM TRIGGER SYSTEM
## Implementacja: src/modules/battle/systems/RoomTrigger.ts

### Co budujesz
System który po wejściu do pokoju na mapie uruchamia odpowiedni flow. Bridge między systemem mapy a systemem walki/usług.

### Kroki

**Krok 9.1: RoomTrigger enum i typy**
```typescript
type TriggerType = 'combat' | 'service' | 'exploration' | 'passive'
type ServiceType = 'merchant' | 'campfire' | 'gospoda' | 'studnia'
type ExplorationType = 'cartographer' | 'lore_npc' | 'treasure' | 'secret'
```

**Krok 9.2: Trigger Resolver**
Funkcja `resolveRoomTrigger(roomType: RoomId): RoomTrigger`. Każdy typ pokoju ma zdefiniowany trigger. Trigger ma: `type`, `serviceType/explorationType/combatDifficulty`, `rewards`, `cost`.

Tabela (zgodnie z EPIC-BATTLE-SYSTEM-PRD.md):
- chamber → `{type: 'combat', difficulty: 'normal'}`
- campfire → `{type: 'service', serviceType: 'campfire'}`
- shop → `{type: 'service', serviceType: 'merchant'}`
- echo_spring → `{type: 'passive', effect: 'addEchoes', amount: 12}`
- treasure → `{type: 'exploration', loot: 'relic_choice'}`
itd.

**Krok 9.3: Game Flow Orchestrator**
Klasa `GameFlow`. Zarządza sekwencją: mapa → pokój → wynik → mapa. Metody: `enterRoom(roomType)`, `resolveCombat(result)`, `resolveService(action)`, `resolveExploration(choice)`, `returnToMap()`.

**Krok 9.4: Passive Room Effect**
Pokoje z `type: 'passive'` nie otwierają nowego ekranu. Efekt działa automatycznie po wejściu. Animacja: komunikat na mapie "💧 +12 Ech" przez 2s potem znika.

**Krok 9.5: No Empty Rooms Rule**
Nawet Korytarz (dead-end) daje efekt pasywny: `+1 Echo` lub `+1-3 Gold`. Żaden pokój nie ma `effect: null`.

### Co widać w Showcase Epic 9
Panel z listą wszystkich typów pokoi. Kliknięcie na pokój — symuluje wejście. Konsola po prawej pokazuje: co zostało wywołane, jakie ekrany by się otworzyły, jakie efekty pasywne zadziałały. Siatka "Room → Trigger" z kolorami per typ triggera.

### Jak tester weryfikuje
Klikasz "Campfire" — konsola: "SERVICE → campfire screen". Klikasz "Echo Spring" — konsola: "PASSIVE → +12 Echoes". Klikasz "Chamber" — konsola: "COMBAT → normal difficulty, rewards: gold+card_choice".

### Sanity check
Każdy z 18 typów pokoi ma zdefiniowany trigger. Żaden nie zwraca `null`.

---

# EPIC 10: SANDBOX ROUTES
## Implementacja: src/modules/battle/sandbox/

### Co budujesz
7 osobnych URL-i do testowania każdego podsystemu w izolacji.

### Kroki

**Krok 10.1: Sandbox Router**
Dodaj do App.tsx routes dla każdego sandbox:
- `/sandbox/battle` — pełna walka z kontrolkami debug
- `/sandbox/cards` — biblioteka kart
- `/sandbox/hand` — tylko ręka i piles
- `/sandbox/board` — tylko plansza
- `/sandbox/merchant` — ekran sklepu
- `/sandbox/campfire` — ekran ogniska
- `/sandbox/room-sequence` — symulacja sekwencji pokoi

**Krok 10.2: Sandbox Index**
Strona `/sandbox` z listą linków do wszystkich sandboxów. Każdy link z opisem co testuje. Dark theme, czytelna lista.

**Krok 10.3: Battle Sandbox Controls**
Panel debug po prawej stronie ekranu walki:
- Slider "Player HP" (0-100)
- Slider "Energy" (0-10)
- Slider "Gold" (0-1000)
- Dropdown "Enemy Preset" (easy/normal/hard/boss)
- Button "Add Random Card to Hand"
- Button "Kill All Enemies"
- Button "Win Battle"
- Toggle "Disable Animations"
- Toggle "Show Layout Debug" (kolorowe obramowania stref)

**Krok 10.4: Cards Sandbox Controls**
- Filter checkboxy per typ
- Filter per source (Wildfrost/StS/MT/ClawCard)
- Filter "Show Only Missing Mechanics"
- Sort by: name/rarity/type
- "Export Filtered as JSON" button

**Krok 10.5: Hand Sandbox Controls**
- Slider "Hand Size" (1-10)
- Slider "Animation Speed"
- Button "Draw X Cards"
- Button "Discard All"
- Button "Force Shuffle"
- Checkbox "Show Card Backs"

### Co widać w Showcase Epic 10
Lista 7 linków do sandboxów. Każdy otwiera się w nowej zakładce z pełnym ekranem testowym i panelem kontrolnym.

### Jak tester weryfikuje
Klikasz każdy link — otwiera się sandbox. Battle sandbox: slider HP do 20% — pasek HP zmienia kolor na czerwony. Hand sandbox: slider animation speed 0.1x — animacje superwolne. Cards sandbox: filter "Missing Mechanics" — zostają karty z brakami.

### Sanity check
Wszystkie 7 sandboxów otwierają się bez crashy. Battle sandbox ze wszystkimi sliderami na 0 nie crashuje silnika.

---

# EPIC 11: FULL TRANSITIONS
## Implementacja: src/modules/battle/transitions/

### Co budujesz
Zestaw animowanych przejść między wszystkimi ekranami. Używa Framer Motion `AnimatePresence` na poziomie router.

### Kroki

**Krok 11.1: Page Transition Wrapper**
Komponent `PageTransition`. Opakowuje każdy ekran. `initial`, `animate`, `exit` variants jako obiekty. Transition type: `spring` lub `tween` zależnie od kontekstu.

**Krok 11.2: Map → Battle**
Komora na mapie "wchodzi" w ekran. Implementacja: kliknięta komora dostaje `layoutId`, jej pozycja jest przekazana do BattleScreen który startuje z tej samej pozycji i rozszerza się na cały ekran.

**Krok 11.3: Battle → Card Reward**
Arena zanika (opacity 0, scale 0.95, 0.4s). Card Reward pojawia się (opacity 1, scale 1, 0.4s z lekkim delay).

**Krok 11.4: Card Reward → Map**
Wybrana karta "wlatuje" do ikony talii (animacja layoutId). Ekran reward zamyka się. Mapa powraca przez slide z góry.

**Krok 11.5: Map → Merchant**
Mapa przesuwa się w lewo (x: -100%, 0.4s). Merchant wjeżdża z prawej (x: 100% → 0, 0.4s). Jednoczesne.

**Krok 11.6: Map → Campfire**
Ekran mapy blur (filter: blur(8px), 0.3s). Ciepłe tło fade-in. Płomienie rozszerzają się na centrum.

**Krok 11.7: Boss Death → Next Act**
Boss ginie ze specjalnym efektem (eksplozja CSS + screen flash). Ekran ciemnieje całkowicie (black, 1s). "Descending" animacja (background-position zmienia się symulując opadanie). Nowa mapa pojawia się od góry (slide-in).

**Krok 11.8: Transition Speed Controls**
W dev mode: slider globalny `--transition-speed` (0.1x do 3x). Wszystkie animacje skalują się przez CSS `--duration` variable.

### Co widać w Showcase Epic 11
Demo sekwencji przejść. Przyciski: "Simulate: Map → Battle", "Simulate: Battle → Reward", "Simulate: Reward → Map" itd. Każdy pokazuje animację przejścia. Slider prędkości animacji. Checkbox "Loop" — ciągła pętla demonstracyjna.

### Jak tester weryfikuje
Klikasz każde przejście — płynna animacja bez skoków. Slider 0.1x — superwolne przejście, widać każdą klatkę. Map → Campfire: efekt blur + ciepłe tło. Boss Death: screen flash + descending effect.

### Sanity check
Żadne przejście nie zostawia "ghost" elementów (AnimatePresence poprawnie czyszcze exit). Na 30fps (throttled CPU) przejścia nadal wyglądają dobrze.

---

# PLIK CLAUDE.md — DO SKOPIOWANIA NA VPS

```
Pracujesz nad Battle System dla ClawCard.
Ekran testowy: /battle-showcase z dropdownem epików (0-11).
Każdy epic dodaje nowe elementy do showcase.

Główny PRD: wiki/mechanics/EPIC-BATTLE-SYSTEM-PRD.md
Ten plik (tasks): wiki/mechanics/EPIC-BATTLE-TASKS.md
Style bazowe: wildfrost-poc/styles/main.css — UŻYWAJ ich, nie pisz od nowa
Animacje: zainstaluj framer-motion (npm install framer-motion)
Istniejące karty: src/data/sampleCards.ts

KOLEJNOŚĆ PRACY:
1. Zacznij od Epic 1 (typy kart)
2. Zbuduj /battle-showcase z dropdownem
3. Każdy epic = nowy element w showcase
4. Po każdym epiku: npm run build + git commit

DOMYŚLNE ODPOWIEDZI na pytania blokujące:
- Energia: 3 per tura, Itemy kosztują 1-3
- Kolejność tur: turowe naprzemiennie
- Sloty gracza: 2×2 (4 sloty)
- Merchant: raz per akt
- Card Reward: po każdej walce

Nie pytaj o potwierdzenie. Działaj.
```

---

*Wersja 1.0 | 31 marca 2026 | 11 epiców | 40+ kroków implementacji*
