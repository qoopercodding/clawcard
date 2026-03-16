# CLAUDE.md — Pamięć operacyjna agenta

> Ten plik to żywy dokument. Agent czyta go na starcie każdej sesji.
> Agent DOPISUJE do sekcji "Czego się nauczyłem" po każdej sesji.
> Marcin przegląda zmiany i usuwa bzdury.
>
> Format wpisu: `[DATA] KATEGORIA: lekcja — co poszło źle i co zrobić inaczej`

---

## Kim jestem w tym projekcie

Jestem Claude — architektem i głównym developerem ClawCard POC.
Pracuję razem z Codexem (GPT-4o). Mój zakres: architektura, mechaniki, trudne logiki, review Codexa.

Projekt: `C:\Users\Qoope\godot_projects\clawcard_base\wildfrost-poc\`
Stack: vanilla HTML/CSS/JS, Live Server :5500

Czytam na starcie każdej sesji (w tej kolejności):
1. `CLAUDE.md` (ten plik) — pamięć i zasady
2. `SCHEMA.md` — obiekty gry
3. `TASKS.md` — co jest do zrobienia
4. Tylko pliki dotknięte aktualnym taskiem — nie czytam całego repo za każdym razem

---

## Zasady których nie łamię

### Kod
- Nie zmieniam sygnatur istniejących funkcji publicznych bez explicit zgody Marcina
- Nie dodaję globalnych zmiennych których nie ma w SCHEMA.md
- Nie używam innerHTML do budowania kart — tylko createElement + appendChild
- Nie zaczynam pisać kodu zanim nie przeczytam SCHEMA.md dla danego taska
- Nie zakładam że coś "powinno działać" — sprawdzam w pliku

### Dokumentacja
- Każda funkcja publiczna którą piszę ma JSDoc z @param @returns @example
- Każdy obiekt stanu ma schemat w komentarzu blokowym
- Jeśli task wymaga nowego obiektu — najpierw dodaję go do SCHEMA.md, potem piszę kod

### Komunikacja z Marcinem
- Nie piszę "gotowe" zanim nie sprawdzę kryteriów akceptacji z TASKS.md
- Jeśli zadanie jest niejasne — pytam o jedno konkretne wyjaśnienie, nie piszę listy pytań
- Jeśli znajdę bug podczas implementacji — raportuje go do TASKS.md sekcja "Bugs", nie naprawiam po cichu

### Praca z Codexem
- Nie nadpisuję plików które Codex aktualnie edytuje (sprawdzam TASKS.md kto co robi)
- Mój kod review Codexa: sprawdzam JSDoc, schemat obiektów, kryteria akceptacji — nie styl

---

## Czego się nauczyłem

### Sesja 2026-03-11 — Wildfrost POC dokumentacja

[2026-03-11] RENDERER: mix-blend-mode:multiply na PNG ramce wymaga białego tła (bgEl) jako osobnej warstwy DOM. Bez bgEl ciemne tło strony "przebija" przez ramkę. Zawsze: bgEl → artEl → frameImg → staty.

[2026-03-11] KONTEKST: Dawanie szablonu z placeholderami zamiast gotowego pliku to strata czasu. Codex nie uzupełni placeholderów poprawnie jeśli nie ma pełnego kontekstu. Następnym razem: gotowy plik lub nic.

[2026-03-11] PLIKI: Przed pisaniem kodu sprawdź czy plik już istnieje i co zawiera. Dwa razy przepisałem logikę która już była.

[2026-03-11] SCHEMA: CardInstance ma `currentHp`/`currentCounter` (runtime) oddzielnie od `hp`/`counter` (definicja). W starym kodzie POC były to te same pola — TO JEST BŁĄD który przepiszemy. Nowa konwencja: definicja używa `hp`, instancja używa `currentHp`.

---

## Wzorce które działają w tym projekcie

### Jak dodać nową mechanikę statusu
```
1. Dodaj pole do schematu CardInstance w SCHEMA.md (np. poison: number)
2. Dodaj pole do makeCard() i mkE() w battle.js
3. Dodaj Mechanics.STATUS.poison w mechanics.js (onHit + onTurn + apply)
4. Dodaj @example w JSDoc mechanics.js pokazujące jak nakładać
5. Dodaj nowy item w cards.js który go nakłada
6. Dodaj Audio.[efekt]() w audio.js
7. Dodaj wizualizację w anim.js (floatText lub klasa CSS)
```

### Jak debugować gdy karta nie renderuje się poprawnie
```
1. Sprawdź FRAME_CONFIG — czy wartości % są sensowne (0-100)
2. Sprawdź czy PNG ramka istnieje w root projektu (nie w src/)
3. Sprawdź kolejność warstw: bgEl → artEl → frameImg → staty
4. Console.log(card) przed renderowaniem — czy instancja ma wszystkie pola
```

### Jak sprawdzić że mechanka działa bez uruchamiania gry
```
1. Otwórz console w DevTools
2. Wpisz: makeCard('snowball') — sprawdź czy instancja ma snow:0
3. Wpisz: Mechanics.STATUS.snow.apply(karta, 2) — sprawdź snow:2
4. Wpisz: Mechanics.processDamage(karta, 5) — sprawdź czy zwraca 0
```

---

## Znane problemy do pamiętania

- `battle.js` używa `card.snow` bezpośrednio (stary kod) — po stworzeniu mechanics.js trzeba to zunifikować
- `card-editor.js` ma własny hardcoded frameConfig — różni się od FRAME_CONFIG w ui.js (EPIC-02)
- namandi.jpg musi być w `assets/cards/` — nie w `src/` (gdzie jest teraz przez pomyłkę)
- Kolejność <script> w index.html jest ważna: mechanics.js musi być przed battle.js

---

## Instrukcja aktualizacji tego pliku

Po każdej sesji roboczej agent dopisuje do sekcji "Czego się nauczyłem":

Format wpisu:
```
[RRRR-MM-DD] KATEGORIA: lekcja jednym zdaniem — kontekst i co zrobić inaczej
```

Kategorie: RENDERER | ARCHITEKTURA | KONTEKST | SCHEMAT | DEBUG | KOMUNIKACJA | NARZĘDZIA

Marcin przegląda wpisy przy następnej sesji i usuwa te które są oczywiste lub nieprawdziwe.
Wpisy zostają jeśli pomogły uniknąć błędu lub przyspieszyły pracę.
