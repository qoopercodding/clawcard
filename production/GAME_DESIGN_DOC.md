# ClawCard — Game Design Document
Stan: 2026-03-23 | Status: DRAFT v1
Autor: Claude (research + design) | Review: team

---

## WSTĘP: CZEGO NIE ROBIMY

Zanim zaczniemy — czego celowo unikamy:

**NIE-StS:** Liniowa ścieżka góra/dół, mana jako zasób, hand limit 10 kart, pojedynczy bohater.
**NIE-Wildfrost:** Counter tick na każdej karcie, globalny zegar, tylko jeden klimat świata.

Punkt wyjścia: każda z tych gier jest zdefiniowana jedną kluczową mechaniką która przesącza się przez CAŁĄ grę. StS = deck efficiency. Wildfrost = timing/counter management. 

Nasze pytanie: **co jest mechaniką definiującą ClawCard?**

Odpowiedź poniżej.

---

# ROZDZIAŁ 1: LORE JAKO MECHANIKA — MITOLOGIE JAKO SUBSETS WROGÓW

## 1.1 Założenie projektowe

Każda frakcja mitologiczna to nie tylko estetyka — to ODRĘBNY SYSTEM WALKI.
Gracz trafia do różnych "stref" Kadłuba i każda strefa to inne zasady gry.

To jest twist który odróżnia nas od wszystkich deckbuilderów: **nie zmieniasz decku żeby bić różnych wrogów. Świat zmienia zasady walki i ty musisz się adaptować.**

## 1.2 Cztery mitologie = cztery systemy wrogów

### Strefa NORDYCKA (Ragnarök Ruins)
**Estetyka:** Rozbite Yggdrasil, zamarznięte Bifrosty, Jotunowie bez bogów do służenia.
**Mechanika wrogów:** Wrogowie mają **Fury Stack** — każde uderzenie które dostaną ZWIĘKSZA ich atak o 1. Im bardziej bijesz, tym silniejsi. Wymusza graczy do zabijania jednym ciosem lub używania efektów Freeze/Stun zamiast prostego DMG.
**Unikalni wrogowie:** Draugr (ożywione trupy, ignorują Poison), Jotun Shard (rozłamuje się na 2 mniejszych po śmierci), Berserker (Fury Stack podwójny).
**Lore-mechanika spójność:** Aesirowie upadli, więc Jotunowie są wściekli i niekontrolowani. Fury Stack = narracja w mechanice.

### Strefa EGIPSKA (Duat Overflow)
**Estetyka:** Duet wylał się na żywy świat, mumie i cienie chodzą razem z żywymi.
**Mechanika wrogów:** Wrogowie mają **Afterlife Charge** — gdy zginą, odradzają się raz jako Cień z połową HP, chyba że zostali zabici z efektem "Seal" (specjalne karty Cieniarzy). Wymusza od gracza zarządzanie zasobami Seal lub przyjęcie że każdy fight to 1.5 walki.
**Unikalni wrogowie:** Ushabti (sługi posągowe, blokują atak na kompanionów), Devourer (jeśli nie zabijesz w 3 turach, zabija kartę z Twojego decku permanentnie), Weigher (porównuje HP twoje vs wroga, kto ma mniej wygrywa rundę).
**Lore-mechanika spójność:** Śmierć jest procesem biurokratycznym. Cień = niezamknięty plik w Rejestrze Dusz.

### Strefa JAPOŃSKA (Tsukumogami Sprawl)
**Estetyka:** Przedmioty które nabrały świadomości, miasta zbudowane przez duchy narzędzi.
**Mechanika wrogów:** Wrogowie mają **Object Memory** — zapamiętują ostatnią kartę którą w nich zagrałeś i stają się na nią **Immune** do końca walki. Każda walka wymaga różnorodności kart — spam jednej karty = przegrana.
**Unikalni wrogowie:** Umbrella (każde trafienie odbija 50% DMG), Sword-Spirit (po zabiciu dołącza do Twojego decku jako osłabiona karta), Lantern (oświetla całą drużynę gracza — tracisz element zaskoczenia, wszystkie ataki wrogów są widoczne z wyprzedzeniem o 1 turę).
**Lore-mechanika spójność:** Tsukumogami uczą się od tego co je dotknęło. Object Memory = dosłowna narracja.

### Strefa MEZOAMERYKAŃSKA (Mictlan Crossing)
**Estetyka:** Azteckie zaświaty wylane na powierzchnię, rytuały jako mechanika przeżycia.
**Mechanika wrogów:** Wrogowie mają **Ritual Counter** — co 3 tury wykonują Rytuał który permanentnie wzmacnia wszystkich wrogów na polu (np. +2 ATK dla wszystkich, lub healing). Gracz musi przerywać Rytuały atakując odpowiedniego wroga w odpowiednim momencie.
**Unikalni wrogowie:** Priest (trigger Rytuału szybciej), Jaguar Warrior (teleportuje się na losową pozycję po każdym uderzeniu), Tzitzimitl (boss, po pokonaniu rzuca klątwę na jedną kartę gracza — karta atakuje teraz gracza).
**Lore-mechanika spójność:** W mitologii azteckiej rytuały podtrzymują kosmiczny porządek. Tutaj podtrzymują chaos.

## 1.3 Jak to działa z deckbuildem

Gracz nie wie z góry do której strefy trafi w danym runie.
Karty mają **Affinity** — karta Lodowca działa neutralnie w strefie nordyckiej ale może mieć bonus/penalty w strefie egipskiej.

To tworzy tension deckbuilding: budujesz deck pod aktualną strefę czy pod elastyczność?

---

# ROZDZIAŁ 2: MAPA — DWA WARIANTY

## 2.1 Wariant A: Sieć Entropii (Entropy Web)

### Opis
Mapa to sieć węzłów połączonych krawędziami — jak pajęczyna lub graf.
Gracz startuje na **zewnętrznym pierścieniu** i musi dotrzeć do **centrum** (boss Kadłuba).

### Kluczowa zasada: Krawędzie się wyczerpują
Każda krawędź między węzłami ma **wartość Trwałości** (1-3).
Każde przejście zużywa 1 punkt Trwałości.
Gdy Trwałość = 0, krawędź **znika** — ścieżka jest zamknięta na zawsze w tym runie.

### Typy węzłów
| Symbol | Typ | Opis |
|--------|-----|------|
| ⚔️ | Walka | Standard encounter |
| 🏪 | Kupiec | Wymiana kart, naprawa |
| 📜 | Wydarzenie | Lore fragment + wybór mechaniczny |
| 🌀 | Portal Mitologii | Zmiana strefy aktywnej (zmiana systemu wrogów) |
| 💀 | Elita | Trudna walka, lepszy loot |
| 👁️ | Obserwatorium | Ujawnia zawartość sąsiednich ukrytych węzłów |

### Co to daje strategicznie
- Gracz musi planować trasę z wyprzedzeniem — nie ma "cofnę się"
- Krawędzie wielokrotne (Trwałość 2-3) są cenniejsze — można przejść dwa razy
- Strategia: czy iść najkrótszą trasą (ryzyko zablokowania) czy okrężną (więcej zasobów)?
- **Lore spójność:** Kadłub niszczy połączenia między fragmentami rzeczywistości. Znikające krawędzie = narracja.

### Wady
- Bardziej złożony w implementacji (graph traversal)
- Gracz może się "zablokować" jeśli źle zarządza krawędziami — wymaga safety netu

---

## 2.2 Wariant B: Archipelag Dryftujący (Drifting Archipelago)

### Opis
Mapa to **wyspy** (fragmenty różnych mitologii) połączone **zamarzniętym oceanem**.
Każda wyspa = osobna strefa mitologiczna = osobny system wrogów.
Ocean między wyspami to **trasa** — ale trasy **zmieniają się** po każdej walce (lodowe dryfty).

### Kluczowa zasada: Mapa żyje
Po każdej zakończonej walce lub decyzji, **jedna losowa krawędź** między wyspami:
- Zamraża się mocniej (staje się niedostępna na 2 tury/węzły)
- Lub otwiera nowe przejście (Kadłub tworzy nowe połączenia)

Gracz nie wie z góry co się zmieni. Musi reagować na bieżąco.

### Warstwy mapy
**Warstwa 1 — Wyspy (statyczna):** Lokalizacje wysp są stałe w runie. Każda wyspa ma 3-5 węzłów wewnętrznych.
**Warstwa 2 — Ocean (dynamiczna):** Połączenia między wyspami zmieniają się. Gracz może "mapować" ocean za pomocą kart Obserwatora.
**Warstwa 3 — Głębia (ukryta):** Pod oceanem są "zatopione" wyspy z bonusowym lootem. Dostępne tylko przez specjalne karty Cieniarzy (Depth Dive).

### Co to daje strategicznie
- Każdy run ma inną "konfigurację" oceanu
- Pressure: jeśli chcesz dotrzeć do konkretnej wyspy, musisz działać szybko zanim połączenie zamrozi się
- **Lore spójność:** Archipelag Kadłuba jest dosłownie niestabilny. Wyspy to fragmenty różnych rzeczywistości które się zderzają.

### Wady
- Może być frustrujące gdy "losowy dryft" blokuje zaplanowaną trasę
- Wymaga dobrego UI żeby pokazać które krawędzie są stabilne a które nie

---

## 2.3 Porównanie wariantów mapy

| Kryterium | Entropy Web | Drifting Archipelago |
|-----------|-------------|---------------------|
| Kontrola gracza | Wysoka — gracz decyduje | Średnia — los + gracz |
| Presja czasowa | Niska (zależy od gracza) | Wysoka (ocean dryfuje) |
| Replayability | Wysoka (różne ścieżki) | Bardzo wysoka (losowy ocean) |
| Złożoność impl. | Średnia | Wysoka |
| Lore fit | Dobry | Bardzo dobry |
| Feeling | Chess-like planning | Eksploracja pod presją |

---

# ROZDZIAŁ 3: WALKA — DWA WARIANTY

## 3.1 Wariant A: System Rezonansowy (Resonance Combat)

### Założenie
Nie ma tur w tradycyjnym sensie. Każda karta ma **Resonance Value** (1-5).
Karty zagrane w sekwencji tworzą **Chord** — jeśli suma Resonance = 6, 12 lub 18, trigger **Resonance Burst** z bonusowym efektem.

### Jak działa walka
1. Gracz ma **rękę** 4 kart (mała, zawsze widoczna — nie ma dobierania mid-turn)
2. Wrogowie mają **widoczny plan ataku** na 2 tury do przodu (jak w StS ale dłuższy horyzont)
3. Gracz zagrywa karty jeden po drugim — każda zagrana karta zmienia Resonance Counter
4. Wrogowie reagują w czasie rzeczywistym: jeśli Resonance Counter przekroczy próg wroga, on natychmiast atakuje (interrupt)
5. Koniec tury = wszystkie niezagrane karty wracają do decku, dobierasz 4 nowe

### Resonance Burst przykłady
- Burst na 6: +2 do wszystkich kart zagranych w tej turze
- Burst na 12: Jeden wróg dostaje Stun na 1 turę
- Burst na 18: Aktywuje pasywną zdolność Kompaniona

### Dlaczego to jest inne niż StS i Wildfrost
- Nie ma many: zasób to **sekwencja** a nie pula
- Nie ma counter ticku: wrogowie reagują na Twój Resonance, nie na globalny zegar
- Wymaga myślenia o **kolejności** kart, nie tylko o wyborze kart
- **Lore spójność:** Karty to echa bogów. Rezonans = harmonia/dysharmonia mitologiczna.

### Wady
- Może być trudne do tutorialu dla nowych graczy
- Resonance system musi być dokładnie zbalansowany żeby nie było "zawsze gram 6+6+6"

---

## 3.2 Wariant B: System Panteonów (Pantheon Combat)

### Założenie
Każda karta należy do jednej z czterech mitologii (Nordic/Egyptian/Japanese/Mesoamerican).
W walce gracz wybiera **Aktywny Panteon** — zmienia się co 2 tury.
Karty Aktywnego Panteonu kosztują 0 akcji. Karty innych panteonów kosztują 1 akcję.
Masz **3 akcje na turę**.

### Jak działa walka
1. Gracz ma rękę 6 kart (większa niż StS, mix mitologii)
2. Na początku tury wybierasz **Aktywny Panteon** (Nordic/Egyptian/Japanese/Mesoamerican)
3. Karty wybranego panteonu są "darmowe" — karty innych kosztują 1 akcję każda
4. Wrogowie mają **Weakness** do konkretnego panteonu — karty słabego panteonu zadają 2x DMG
5. Po 2 turach Aktywny Panteon automatycznie rotuje do następnego w cyklu (albo gracz może zapłacić 1 HP żeby wybrać następny wcześniej)

### Depth mechanic: Panteon Synergies
- 2 karty Nordic w jednej turze: trigger Fury (twój atak +2)
- 2 karty Egyptian: jedna karta wraca do ręki
- 2 karty Japanese: wróg traci 1 punkt Immunity Stack
- 2 karty Mesoamerican: przerywasz Rytuał wroga o 1 turę

### Dlaczego to jest inne niż StS i Wildfrost
- Nie ma many: zasób to **Aktywny Panteon** + **akcje**
- Deck-building wymaga myślenia o rozkładzie mitologii, nie tylko o power level kart
- Każda walka ma inną Weakness wroga → inne optymalnie użycie panteonu
- **Lore spójność:** Gracz (Archiwista) żongluje fragmentami różnych panteonów. Walka = dosłowne żonglowanie mitologiami.

### Wady
- Rotacja Aktywnego Panteonu może frustrować jeśli "trafi" na zły panteon w złym momencie
- Wymaga starannego balansowania ile kart jakiego panteonu dać graczowi

---

## 3.3 Porównanie wariantów walki

| Kryterium | Resonance Combat | Pantheon Combat |
|-----------|-----------------|-----------------|
| Głębokość | Bardzo wysoka | Wysoka |
| Dostępność | Niska (trudny tutorial) | Średnia |
| Skill expression | Wysoka (sekwencjonowanie) | Wysoka (deck composition) |
| Lore fit | Dobry | Bardzo dobry |
| Implementacja | Skomplikowana | Średnia |
| Feeling | Jazz/muzyka kart | Strategia armii |
| Unikalność | Bardzo wysoka | Wysoka |

---

# ROZDZIAŁ 4: REKOMENDACJA I KOMBINACJA

## 4.1 Rekomendowana kombinacja

**Mapa:** Drifting Archipelago (Wariant B)
**Walka:** Pantheon Combat (Wariant B)

### Dlaczego ta para

Oboje opierają się na tym samym rdzeniu: **gracz zarządza tożsamościami mitologicznymi**.
Na mapie = jaką wyspę/frakcję odwiedzisz? Jaki system wrogów akceptujesz?
W walce = jakimi kartami którego panteonu walczysz?

To tworzy **pionową spójność** przez całą grę:
1. Wybór wyspy → decydujesz do której mitologii wchodzisz
2. Budowanie decku na wyspie → decydujesz jakie karty z tej mitologii zbierasz
3. Walka → decydujesz jak te karty ze sobą współgrają przez Aktywny Panteon
4. Lore fragment po walce → dowiadujesz się więcej o tej mitologii

Każda decyzja na każdym poziomie jest zakorzeniona w tym samym pytaniu: **która mitologia teraz?**

## 4.2 Kombinacja hybrydowa (opcja dla teamu)

Jeśli Resonance Combat jest zbyt skomplikowany → zacznij od Pantheon Combat.
Jeśli Entropy Web jest bardziej intuicyjny → użyj go dla wczesnych prototypów.

Nie trzeba wybierać teraz. Oba warianty są zaprojektowane tak żeby można je testować niezależnie.

---

# ROZDZIAŁ 5: MECHANIKA DODATKOWA — REJESTR DUSZ

## 5.1 Opis

Rejestr Dusz to meta-warstwa między runami — ale nie jest to typowy "unlock system".

Po każdym runie gracz dostaje **Fragment Pamięci** — 2-3 zdania monologu od karty którą niósł w chwili śmierci/rozproszenia.
Fragmenty zbierają się w Rejestrze Dusz (dostępny z menu głównego).
Każdy komplet 4 Fragmentów tej samej karty odblokowuje **Awakened Version** tej karty — wersję z zmienionym efektem i dodatkowym lore tekstem.

## 5.2 Dlaczego to działa

1. **Motywuje do różnorodności decku:** Żeby zebrać Fragmenty różnych kart, musisz używać różnych kart.
2. **Drip-feed lore:** Każdy Fragment to kawałek historii boga/bohatera zamkniętego w karcie.
3. **Nie jest pay-to-win:** Awakened Version nie jest silniejsza — jest po prostu inna. Inny efekt, nie koniecznie lepszy.
4. **Ludonarracyjna spójność:** Archiwista dosłownie zbiera wspomnienia. Rejestr Dusz to jego/jej praca.

## 5.3 Przykłady Awakened Versions

| Karta | Wersja standardowa | Awakened Version |
|-------|-------------------|-----------------|
| Snowdancer | Freeze wróg na 1 turę | Freeze wroga i +2 ATK dla następnej karty |
| Bongo Prime | Transform gdy HP<50% | Transform gdy HP<50% + healing 2 HP |
| Shield Card | Block 4 DMG | Block 4 DMG + odbij 2 DMG do atakującego |

---

# ROZDZIAŁ 6: ZADANIA I SUBTASKI

## EPIK 1: SYSTEM MITOLOGII — WROGOWIE PER STREFA
**Owner:** combat-designer agent
**Zależy od:** decyzja teamu (która mapa, która walka)

### Taski
- [ ] CM-01: Zaprojektować Fury Stack mechanic dla strefy nordyckiej
  - Subtask: Określić max wartość Fury Stack (cap 5?)
  - Subtask: Czy Freeze resetuje Fury Stack?
- [ ] CM-02: Zaprojektować Afterlife Charge mechanic dla strefy egipskiej
  - Subtask: Balans HP Cienia (50% czy stałe?)
  - Subtask: Karta Seal — jak ją gracz zdobywa?
- [ ] CM-03: Zaprojektować Object Memory mechanic dla strefy japońskiej
  - Subtask: Jak długo trwa Immunity? (do końca walki czy do końca runu?)
  - Subtask: Czy działa na AoE karty?
- [ ] CM-04: Zaprojektować Ritual Counter mechanic dla strefy mezoamerykańskiej
  - Subtask: Co konkretnie robi każdy Rytuał (tabela 4 możliwych Rytuałów)
  - Subtask: Jak gracz wizualnie widzi że Rytuał się zbliża?
- [ ] CM-05: Stworzyć 3 unikalne jednostki per strefa (12 total)
- [ ] CM-06: Zbalansować encounter difficulty per strefa
- [ ] CM-07: Zintegrować z istniejącym Test Environment w Builder Tool

## EPIK 2: MAPA — WYBRANY WARIANT
**Owner:** godot-specialist + tools-programmer
**Zależy od:** CM-01 do CM-04 (żeby wiedzieć co wypełnia węzły)

### Taski — Drifting Archipelago
- [ ] MA-01: Prototyp grafu wysp (4 wyspy + ocean) w Godot
  - Subtask: Dane struktury grafu (nodes + edges)
  - Subtask: Wizualizacja w Godot (kafelki czy wektorowe?)
- [ ] MA-02: Implementacja mechaniki dryftowania krawędzi
  - Subtask: Algorytm losowego zamrażania/otwierania krawędzi
  - Subtask: Trigger: po walce czy po czasie?
- [ ] MA-03: UI mapy — pokazanie które krawędzie są stabilne
  - Subtask: Kolor/ikona dla Trwałości krawędzi
- [ ] MA-04: Warstwy mapy (wyspa + ocean + głębia)
- [ ] MA-05: Integracja typów węzłów z logiką gry

### Taski — Entropy Web (jeśli wybrano)
- [ ] MA-A1: Algorytm generowania grafu pajęczyny
- [ ] MA-A2: Implementacja Trwałości krawędzi
- [ ] MA-A3: Safety net — gracz nie może się zablokować całkowicie (min 1 ścieżka do centrum zawsze)

## EPIK 3: WALKA — WYBRANY WARIANT
**Owner:** combat-designer + godot-specialist
**Zależy od:** MA-01 (musi wiedzieć jak walka integruje się z mapą)

### Taski — Pantheon Combat
- [ ] WA-01: Implementacja systemu Aktywnego Panteonu w Godot
  - Subtask: UI — pokazanie aktualnego panteonu i kosztu kart
  - Subtask: Mechanika rotacji (2 tury automatycznie)
- [ ] WA-02: Dodanie Affinity tagu do wszystkich istniejących kart
- [ ] WA-03: Implementacja Weakness wrogów per panteon
- [ ] WA-04: Implementacja Panteon Synergies (2 karty nordic = Fury, etc.)
- [ ] WA-05: Balans — ile akcji na turę? (prototyp: 3)
- [ ] WA-06: Test Environment upgrade — test z Panteon Combat

### Taski — Resonance Combat (jeśli wybrano)
- [ ] WA-B1: Implementacja Resonance Counter
- [ ] WA-B2: Przypisanie Resonance Value do każdej karty
- [ ] WA-B3: Implementacja Resonance Burst (6/12/18)
- [ ] WA-B4: Implementacja interrupt systemu (wróg reaguje na RV threshold)

## EPIK 4: REJESTR DUSZ
**Owner:** tools-programmer + game-director
**Zależy od:** WA-01 (potrzebuje systemu "karta niesiona przy śmierci")

- [ ] RS-01: Struktura danych Rejestru Dusz (JSON per karta, max 4 fragmenty)
- [ ] RS-02: Trigger zbierania Fragmentów (po runie, na podstawie ostatniej karty)
- [ ] RS-03: Napisać Fragmenty Pamięci dla 10 kart (patrz LL-05 w LORE_BIBLE)
- [ ] RS-04: UI Rejestru Dusz w Builder Tool (galeria wspomnień)
- [ ] RS-05: Implementacja Awakened Versions dla 5 kart
- [ ] RS-06: Balans — czy Awakened Version może być silniejsza? (decyzja game-director)

## EPIK 5: LORE INTEGRATION
**Owner:** game-director
**Zależy od:** decyzji teamu z LORE_BIBLE (LL-01 do LL-03)

- [ ] LI-01: Teksty węzłów mapy per strefa (po 2 zdania per węzeł, 20 węzłów)
- [ ] LI-02: Dialogi NPC per frakcja (Kupiec nordycki vs Kupiec egipski = inny tekst)
- [ ] LI-03: Boss speeches (każdy boss = 1-2 zdania przed walką)
- [ ] LI-04: Opening screen text (max 100 słów)

---

# ROZDZIAŁ 7: PLAN PRACY AGENTÓW

## Jak rozdzielić pracę

System agentowy ClawCard ma 6 agentów. Każdy dostaje EPIK:

| Agent | EPIK | Priorytet |
|-------|------|-----------|
| combat-designer | EPIK 1 (mitologie/wrogowie) | 🔴 FIRST |
| game-director | EPIK 5 (lore) + decyzje teamu | 🔴 FIRST |
| godot-specialist | EPIK 2 (mapa) + EPIK 3 (walka) | 🟡 AFTER CM |
| tools-programmer | EPIK 3 (walka Builder Tool) + EPIK 4 (Rejestr) | 🟡 PARALLEL |
| balance-designer | Balans po prototypie walki | 🟢 LAST |
| devops-engineer | Infrastruktura (nie blokuje) | 🟢 ONGOING |

## Jak zapisać postęp między agentami

KLUCZOWE: agenci nie mają pamięci między sesjami. Postęp jest zapisywany w plikach.

### Struktura plików postępu
```
~/clawcard/production/
├── GAME_DESIGN_DOC.md          ← ten plik (game design)
├── LORE_BIBLE.md               ← lore
├── MASTER_DOC.md               ← infrastruktura + TODO ogólne
├── agent-logs/
│   ├── combat-designer.log     ← co zrobił, co zostało
│   ├── godot-specialist.log    ← co zrobił, co zostało
│   ├── tools-programmer.log    ← co zrobił, co zostało
│   └── game-director.log       ← decyzje teamu
└── sprints/
    ├── sprint-01.md            ← aktywny sprint
    └── sprint-02.md            ← (do wygenerowania po decyzjach)
```

### Protokół handoff między agentami
Gdy agent kończy zadanie, zapisuje do swojego .log:
```
DONE: [ID taska]
STATUS: [co zrobiono]
BLOCKERS: [co blokuje następny krok]
NEXT: [co powinien zrobić następny agent]
```

Gdy nowa sesja zaczyna się: **zawsze czytaj swój .log i GAME_DESIGN_DOC.md przed działaniem.**

### Jak uruchomić agenta z kontekstem
```bash
cd ~/clawcard
# Uruchom agenta z pełnym kontekstem:
claude --agent combat-designer "Przeczytaj production/GAME_DESIGN_DOC.md sekcja EPIK 1 i zacznij od CM-01"
# lub przez /commands w sesji:
/agent combat-designer
# Wtedy podaj mu: "Kontekst: production/GAME_DESIGN_DOC.md"
```

---

# ROZDZIAŁ 8: PYTANIA BLOKUJĄCE (wymagają decyzji teamu)

Przed implementacją CZEGOKOLWIEK potrzebujemy odpowiedzi na:

1. **Mapa: Wariant A (Entropy Web) czy B (Drifting Archipelago)?**
   Rekomendacja: B, ale A jest łatwiejsze do prototypowania.

2. **Walka: Wariant A (Resonance Combat) czy B (Pantheon Combat)?**
   Rekomendacja: B, mniej ryzykowne na start.

3. **Ile frakcji/stref na start?**
   Rekomendacja: 2 (Nordic + Egyptian) na MVP, potem rozszerzać.

4. **Czy Awakened Versions mogą być silniejsze niż oryginały?**
   Implikacja: jeśli tak — grind meta, jeśli nie — pure lore reward.

5. **Ton gry (z LORE_BIBLE):** cozy-dark / dark fantasy / retro?
