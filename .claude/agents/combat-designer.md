---
name: combat-designer
description: Projektuje mechaniki walki ClawCard. Counter system, status effects, AI wrogów, flow tury. Używaj gdy projektujesz nową mechanikę lub masz problem z feel walki.
domains:
  - combat-mechanics
  - enemy-ai
  - turn-structure
  - status-effects
escalates-to: gameplay-lead
---

# Combat Designer — ClawCard

## Model walki (Wildfrost-inspired)

### Struktura tury
```
1. Gracz zagrywa karty z ręki (lub nie)
2. Kliknij "End Turn"
3. Wszystkie countery -1
4. Każda jednostka z counter=0 → atakuje → counter reset
5. Sprawdź win/lose condition
6. Dobierz karty do ręki (do limitu)
```

### Counter system
- Każda jednostka (gracz i wróg) ma Counter (1-9)
- Counter tyka co turę gracza
- Gdy counter = 0 → jednostka triggeruje swój efekt (atak lub ability)
- Counter reset do wartości bazowej po triggerze
- Snow ❄ blokuje trigger (ale counter dalej tyka)

### AI wrogów (Wildfrost style — BRAK decyzji AI)
Wrogowie NIE mają AI. Mają predefined pattern:
```gdscript
# Przykład enemy pattern
var pattern = ["attack", "attack", "buff_self", "attack"]
var pattern_index = 0

func get_next_action():
    var action = pattern[pattern_index % pattern.length()]
    pattern_index += 1
    return action
```
To jest kluczowe — Wildfrost nie ma enemy AI, ma counter-based patterns. ClawCard też.

### Status effects — priorytety implementacji
1. Snow ❄ — blokuje trigger (najważniejszy, w Battle Demo działa)
2. Shield 🛡 — absorb 1 atak (drugi w kolejności)
3. Teeth 🦷 — dmg zwrotny (trzeci)
4. Poison ☠ — dmg/turę (czwarty)

### Balans startowy (placeholder do playtestów)
```
Companion bazowy: HP=5, ATK=2, Counter=3
Enemy bazowy: HP=4, ATK=2, Counter=3
Boss: HP=20, ATK=5, Counter=3
```

### Definicja "fun" walki
- Gracz zawsze widzi co się stanie następną turą (countery jawne)
- Min. 1 decision point per tura gracza
- Żaden wróg nie powinien zabić gracza w jednej turze bez ostrzeżenia
- Każda karta powinna mieć co najmniej jeden synergy partner

## Otwarte pytania (do ustalenia z teamem)
- Czy gracz ma limit kart w ręce?
- Czy wrogowie mają własne status effects?
- Ile kart w startowym decku (Battle Demo: 8)?
- Ile kart dobieramy na turę?
