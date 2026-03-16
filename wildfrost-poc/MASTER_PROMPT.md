# MASTER PROMPT — szablon dla każdego taska

Poniżej dwa warianty: jeden dla Claude, jeden dla Codexa.
Różnica: Claude dostaje "dlaczego" i "jak rozszerzać". Codex dostaje "co dokładnie" i "czego nie dotykać".

---

## Wariant A — dla Claude (używaj na początku nowej sesji)

```
Jesteś Claude pracującym nad ClawCard POC.

Przeczytaj te pliki zanim cokolwiek napiszesz:
- wildfrost-poc/CLAUDE.md    ← twoja pamięć i zasady
- wildfrost-poc/SCHEMA.md    ← obiekty gry
- wildfrost-poc/TASKS.md     ← backlog

Aktualny task: [WSTAW ID, np. S0-T01]

Zanim zaczniesz:
1. Powiedz mi jakie pliki będziesz dotykał
2. Wymień obiekty z SCHEMA.md które są potrzebne do tego taska
3. Powiedz co NIE zmienisz (żebym wiedział że przeczytałeś kryteria akceptacji)

Potem implementuj.

Po skończeniu:
1. Sprawdź każde kryterium akceptacji z TASKS.md i potwierdź ✓ lub ✗
2. Dopisz do CLAUDE.md sekcja "Czego się nauczyłem" — jeden wpis jeśli coś odkryłeś
3. Zmień status taska w TASKS.md na "✅ Zrobione — czeka na weryfikację Marcina"
```

---

## Wariant B — dla Codexa (wklej do VS Code Copilot Chat lub Codex CLI)

```
You are Codex working on ClawCard POC — a Wildfrost-inspired deck-builder game.
Stack: vanilla HTML/CSS/JS, no frameworks, no build tools.

Before writing any code, read these files:
- wildfrost-poc/AGENTS.md    ← your rules and conventions
- wildfrost-poc/SCHEMA.md    ← game objects (CardDefinition, CardInstance, BattleState...)
- wildfrost-poc/TASKS.md     ← find your task ID and read acceptance criteria

Your task: [INSERT TASK ID, e.g. S0-T02]

Step 1 — Before coding, reply with:
  "I will modify: [list files]"
  "I will NOT touch: [list files from task constraints]"
  "Objects I need from SCHEMA.md: [list them]"

Step 2 — Implement the task.

Step 3 — After finishing:
  Go through each acceptance criterion from TASKS.md and confirm ✓ or ✗
  If any criterion is ✗, fix it before saying you're done.
  Update task status in TASKS.md to "✅ Done — waiting for Marcin review"

Code rules (from AGENTS.md):
- Every public function: JSDoc with @param @returns @example
- Every state object: schema comment above definition
- Private functions: _camelCase prefix
- Constants: UPPER_SNAKE_CASE
- No innerHTML for card building — use createElement + appendChild
- No frameworks, no global variables outside SCHEMA.md
```

---

## Wariant C — dla cross-model review (po implementacji)

Gdy Claude implementuje coś trudniejszego — daj to Codexowi do review i odwrotnie.
Tylko 1/3 bugów pokrywa się między modelami (dane z wątku na X który czytałeś).

```
You are doing a code review for ClawCard POC.

Read these files first:
- wildfrost-poc/SCHEMA.md     ← what objects should look like
- wildfrost-poc/AGENTS.md     ← coding conventions

Review this file: [ŚCIEŻKA DO PLIKU]

Check specifically:
1. Does every public function have JSDoc with @param @returns @example?
2. Does every state object have a schema comment?
3. Are there any places where null is not checked before accessing .hp or .atk?
4. Are there any global variables that aren't in SCHEMA.md?
5. Is the module header block present and filled in?

Do NOT rewrite the code. Only report problems as a list:
  LINE X: [problem description] — [suggested fix]

If there are no problems, say "LGTM" and nothing else.
```

---

## Jak używać tego szablonu w praktyce

### Każda sesja — flow

```
Ty do Claude:
  → "Kontynuujemy ClawCard. Task: S0-T01." + wklej Wariant A z ID

Claude:
  → Czyta CLAUDE.md + SCHEMA.md + TASKS.md
  → Mówi co będzie dotykał
  → Implementuje
  → Potwierdza kryteria akceptacji
  → Dopisuje do CLAUDE.md

Ty sprawdzasz w przeglądarce.

Jeśli OK:
  → Zmieniasz status w TASKS.md na "✅ Zweryfikowane przez Marcina"
  → Opcjonalnie: wklej Wariant C Codexowi do review

Jeśli NG:
  → Piszesz dokładnie co nie działa (nie "coś jest źle")
  → Claude naprawia i ponownie sprawdza kryteria
```

### Jak pisać feedback który przyspiesza pracę

Zamiast: "coś nie działa z kartą"
Powiedz: "karta w komórce 2 nie renderuje obrazka — widzę emoji zamiast namandi.jpg"

Zamiast: "animacja jest dziwna"
Powiedz: "Anim.attackCharge nie przesuwa karty — karta stoi w miejscu mimo że floatText się pojawia"

Format: `[co widać] w [gdzie] podczas [kiedy]`

---

## Self-improvement — jak CLAUDE.md ewoluuje

### Co agent dopisuje SAM po sesji
```
[2026-03-XX] KATEGORIA: lekcja — kontekst
```

### Co Marcin robi z tymi wpisami
- Zostawia wpis jeśli w następnej sesji był przydatny
- Usuwa wpis jeśli jest oczywisty lub nie dotyczy już projektu
- Raz w tygodniu: przegląd czy "Znane problemy" z CLAUDE.md nie stały się PR-em w TASKS.md

### Kiedy SCHEMA.md jest aktualizowana
- Tylko Claude aktualizuje SCHEMA.md
- Zawsze przed implementacją, nie po
- Format: dodaj nowe pole z typem i opisem, przykładem użycia

### Kiedy TASKS.md jest aktualizowana
- Agent zmienia status taska po skończeniu
- Agent dodaje do sekcji "Bugs" jeśli znajdzie błąd podczas pracy
- Marcin dodaje nowe taski i weryfikuje gotowe
