# ClawCard - Instrukcja dla Agenta

## Projekt
Gra karciana roguelike inspirowana mechanikami deckbuilding games. Silnik: Godot 4, język: GDScript.

## Zasady pracy
- Zawsze czytaj docs/SESSION_STATE.md przed rozpoczęciem pracy
- Po każdym zadaniu aktualizuj docs/SESSION_STATE.md
- Każda zmiana = commit z opisem (feat/fix/docs/checkpoint)
- Pushuj do GitHub po każdym commicie
- NIE modyfikuj plików Godot bezpośrednio - tylko kod w src/

## Struktura repo
- src/cards/ - definicje kart w GDScript
- src/mechanics/ - logika mechanik gry
- src/enemies/ - definicje wrogów
- docs/SESSION_STATE.md - aktualny stan pracy
- docs/TASK_LOG.md - historia zadań
- docs/TASKS.md - lista zadań do zrobienia
- docs/LESSONS.md - wnioski i ulepszenia agenta
- docs/CARDS_REFERENCE.md - dokumentacja kart

## Zarządzanie tokenami
- Przy 80% limitu tokenów: zapisz stan i zrób commit z "checkpoint:"
- Format checkpoint: "checkpoint: [co zrobiono] | następny krok: [co zostało]"

---

## Workflow Orchestration

### 1. Plan przed działaniem
- Dla każdego nietrywialnego zadania (3+ kroki lub decyzje architektoniczne): napisz plan do docs/TASKS.md przed implementacją
- Jeśli coś idzie nie tak — STOP, przeplanuj, nie pchaj dalej na ślepo
- Szczegółowe specyfikacje z góry redukują błędy

### 2. Strategia subagentów
- Offloaduj research, eksplorację i analizę równoległą do subagentów
- Dla złożonych problemów — użyj więcej mocy obliczeniowej przez subagenty
- Jeden subagent = jedno skoncentrowane zadanie

### 3. Pętla samodoskonalenia
- Po każdej korekcie od użytkownika: zaktualizuj docs/LESSONS.md z wzorcem błędu
- Zapisuj reguły które zapobiegną temu samemu błędowi w przyszłości
- Czytaj LESSONS.md na starcie sesji dla aktywnego projektu

### 4. Weryfikacja przed ukończeniem
- Nigdy nie oznaczaj zadania jako ukończone bez udowodnienia że działa
- Porównuj zachowanie przed i po zmianach
- Pytaj siebie: "Czy senior developer zatwierdziłby to?"
- Uruchamiaj testy, sprawdzaj logi, demonstruj poprawność

### 5. Elegancja (wyważona)
- Dla nietrywialnych zmian: zatrzymaj się i zapytaj "czy jest lepszy sposób?"
- Jeśli fix wygląda hacky: "Wiedząc to co wiem, zaimplementuj eleganckie rozwiązanie"
- Pomiń to dla prostych, oczywistych poprawek — nie over-engineeruj

### 6. Autonomiczne naprawianie bugów
- Gdy dostaniesz raport o błędzie: napraw go. Bez proszenia o prowadzenie za rękę
- Wskaż logi, błędy, testy — potem je rozwiąż
- Zero przełączania kontekstu wymaganego od użytkownika

---

## Zarządzanie zadaniami

1. **Plan:** Napisz plan do docs/TASKS.md z elementami do odznaczenia
2. **Weryfikacja planu:** Zamelduj się przed rozpoczęciem implementacji
3. **Śledzenie postępu:** Oznaczaj elementy jako ukończone na bieżąco
4. **Wyjaśniaj zmiany:** Podsumowanie wysokiego poziomu na każdym kroku
5. **Dokumentuj wyniki:** Dodaj sekcję review do docs/TASKS.md
6. **Zapisuj wnioski:** Aktualizuj docs/LESSONS.md po korektach

---

## Zasady główne

- **Prostota przede wszystkim:** Każda zmiana powinna być tak prosta jak to możliwe. Minimalny wpływ na kod.
- **Bez lenistwa:** Znajdź przyczyny źródłowe. Bez tymczasowych fiksów. Standardy senior developera.
- **Minimalny wpływ:** Zmiany powinny dotykać tylko tego co konieczne. Nie wprowadzaj nowych bugów.
