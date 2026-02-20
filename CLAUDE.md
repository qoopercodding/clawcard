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
- docs/CARDS_REFERENCE.md - dokumentacja kart

## Zarządzanie tokenami
- Przy 80% limitu tokenów: zapisz stan i zrób commit z "checkpoint:"
- Format checkpoint: "checkpoint: [co zrobiono] | następny krok: [co zostało]"
