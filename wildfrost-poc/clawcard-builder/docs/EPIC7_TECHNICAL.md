# Card Mechanic Enrichment Pipeline — Technical Architecture
## ClawCard | Epic 7 | 2 kwietnia 2026

---

## ARCHITEKTURA SYSTEMU

### Przepływ informacji (HL)

```
card_library.json (668 kart)
        │
        ▼
[AGENT 1: Extractor]
  Wejście: surowe karty z brudnymi opisami
  Wyjście: enriched_cards/[id].json (keywords wylistowane, placeholdery zastąpione)
        │
        ▼
[AGENT 2: Researcher]
  Wejście: enriched_cards/*.json + KEYWORDS.md (jeśli istnieje)
  Dla każdego nowego keyword:
    1. Sprawdź KEYWORDS.md — czy już znamy tę mechanikę?
    2. Jeśli TAK → użyj istniejącej definicji
    3. Jeśli NIE → szukaj w wiki → zapisz do KEYWORDS.md
  Wyjście: zaktualizowany KEYWORDS.md + enriched_cards/*.json (z weryfikacją)
        │
        ▼
[AGENT 3: QA Critic]
  Wejście: enriched_cards/*.json + KEYWORDS.md
  Sprawdza KAŻDĄ kartę i KAŻDĄ mechanikę krytycznie:
    - Czy definicja mechaniki zgadza się z wiki?
    - Czy opis karty jest spójny z mechaniką?
    - Czy nie ma hallucynacji (wymyślonych efektów)?
  Wyjście: qa_report.md + poprawki do enriched_cards/*.json
        │
        ▼
[AGENT 4: Frontend Builder]
  Wejście: enriched_cards/*.json (po QA) + KEYWORDS.md
  Buduje: nową zakładkę ?epic=7 w aplikacji React
  Wyjście: src/modules/card-mechanics/ + zaktualizowany App.tsx
```

---

## STRUKTURA PLIKÓW

```
wildfrost-poc/clawcard-builder/
├── src/
│   ├── modules/
│   │   └── card-mechanics/          ← NOWY MODUŁ (Agent 4 tworzy)
│   │       ├── CardMechanicsView.tsx
│   │       ├── KeywordPanel.tsx
│   │       ├── CardMechanicsList.tsx
│   │       └── types.ts
│   └── data/
│       └── enriched/                ← NOWE (Agenci 1-3 tworzą)
│           ├── sts_miracle.json
│           ├── sts_apparition.json
│           ├── sts_beta.json
│           ├── sts_bite.json
│           ├── sts_expunger.json
│           ├── sts_insight.json
│           ├── sts_jax.json
│           └── index.ts             ← re-export wszystkich kart

docs/
└── KEYWORDS.md                      ← NOWY (Agent 2 tworzy i rozszerza)
```

---

## SCHEMAT DANYCH

### EnrichedCard (enriched_cards/[id].json)

```typescript
interface EnrichedCard {
  // Identyfikacja
  id: string                    // "sts_miracle"
  name: string                  // "Miracle"
  game: 'slay_the_spire' | 'monster_train' | 'wildfrost'

  // Opis
  desc_raw: string              // oryginał ze scrapera (może mieć placeholdery)
  desc_clean: string            // po zastąpieniu placeholderów czytelnym tekstem
  desc_problems: string[]       // lista znalezionych problemów z opisem
  desc_upgraded?: string        // opis po ulepszeniu (jeśli dostępny)

  // Mechaniki
  keywords: string[]            // ["Retain", "Exhaust"]
  keyword_details: {
    [keyword: string]: {
      definition_short: string  // 1 zdanie
      ref: string               // "#retain" → KEYWORDS.md#retain
    }
  }
  mechanic_summary: string      // ludzki opis co robi karta (2-3 zdania)

  // Weryfikacja
  verified_against_wiki: boolean
  wiki_url: string
  wiki_desc: string             // opis z wiki (żródło prawdy)
  wiki_keywords: string[]       // keywords wg wiki (do porównania)
  discrepancies: string[]       // różnice między naszym opisem a wiki

  // QA
  qa_status: 'pending' | 'approved' | 'needs_fix'
  qa_notes: string              // komentarze od Agent 3
  qa_critic_score: 1 | 2 | 3 | 4 | 5  // 5 = idealny, 1 = wymaga przepisania

  // Meta
  enriched_at: string           // "2026-04-02"
  enriched_by: string           // "agent_1_extractor"
  verified_at?: string
}
```

### KEYWORDS.md — format sekcji

```markdown
## Retain
**Gra:** Slay the Spire
**Krótki opis:** Karta nie jest odrzucana na koniec tury — zostaje w ręce.
**Pełny opis:**
Normalnie wszystkie karty w ręce są odrzucane do discard pile na końcu tury gracza.
Karty z keyword Retain są wyjątkiem — pozostają w ręce do następnej tury.
Nie są jednak Exhaust — po zagraniu trafiają normalnie do discard pile.
**Przykłady kart:** Miracle, Insight, Hologram (po ulepszeniu)
**Interakcje:** Działa z Runic Pyramid (relict który automatycznie daje Retain wszystkim kartom)
**Wiki:** https://slay-the-spire.fandom.com/wiki/Retain
**Zweryfikowane:** TAK | Data: 2026-04-02
---
```

---

## AGENT 1: EXTRACTOR — szczegółowa spec

### Zadanie
Przetworzyć 8 kart pilotowych. Dla każdej karty:
1. Wczytaj surowy opis (`desc_raw`)
2. Zastąp wszystkie placeholdery czytelnym tekstem
3. Wyciągnij listę keywords z opisu
4. Zapisz EnrichedCard do `src/data/enriched/[id].json`

### Mapa placeholderów StS (pełna lista)

```
<P>   → Energy (kryształ energii)
<D>   → Dexterity
<S>   → Strength
<W>   → Wound
<B>   → Block
<V>   → Void
<T>   → Shiv
<L>   → Lightning (dla Defect)
<F>   → Frost (dla Defect)
<K>   → Dark (dla Defect)
[E]   → Energy (stary format)
!D!   → damage value
!B!   → block value
!M!   → magic number
```

### Rozpoznawanie keywords

Keywords to kapitalizowane słowa w opisie które są mechanikami gry. Lista znanych keywords StS:

```
Retain, Exhaust, Ethereal, Innate, Unplayable
Vulnerable, Weak, Frail, Strength, Dexterity
Block, Thorns, Intangible, Invincible
Poison, Burn, Wound, Dazed, Slimed
Echo Form, Double Tap, Barricade, Entrench
Scry, Draw, Discard, Purge, Upgrade
X (jako koszt)
```

### Algorytm (pseudokod)

```python
def process_card(card_raw: dict) -> EnrichedCard:
    desc_raw = card_raw['desc']
    
    # 1. Zastąp placeholdery
    desc_clean = replace_placeholders(desc_raw, PLACEHOLDER_MAP)
    problems = find_remaining_issues(desc_clean)  # znajdź pozostałe [X] i inne
    
    # 2. Wyciągnij keywords
    keywords = []
    for word in KNOWN_KEYWORDS:
        if word.lower() in desc_clean.lower():
            keywords.append(word)
    
    # 3. Zbuduj EnrichedCard
    return EnrichedCard(
        id=card_raw['id'],
        desc_raw=desc_raw,
        desc_clean=desc_clean,
        desc_problems=problems,
        keywords=keywords,
        qa_status='pending',
        enriched_by='agent_1_extractor',
        enriched_at=today()
    )
```

### Output po Agent 1 (przykład dla Miracle)

```json
{
  "id": "sts_miracle",
  "name": "Miracle",
  "game": "slay_the_spire",
  "desc_raw": "Retain. Gain <P> <P>. Exhaust.",
  "desc_clean": "Retain. Gain 2 Energy. Exhaust.",
  "desc_problems": ["Zastąpiono 2x <P> → 'Energy'"],
  "keywords": ["Retain", "Exhaust"],
  "keyword_details": {},
  "mechanic_summary": "",
  "verified_against_wiki": false,
  "wiki_url": "https://slay-the-spire.fandom.com/wiki/Miracle",
  "wiki_desc": "",
  "wiki_keywords": [],
  "discrepancies": [],
  "qa_status": "pending",
  "qa_notes": "",
  "qa_critic_score": null,
  "enriched_at": "2026-04-02",
  "enriched_by": "agent_1_extractor"
}
```

### Co Agent 1 robi ZANIM zapisze

Sprawdza: czy desc_clean nie ma już żadnych `<X>`, `[X]`, `!X!` wzorców.
Jeśli tak → dodaje do `desc_problems`, nie blokuje — ale zostawia ślad dla Agent 3.

---

## AGENT 2: RESEARCHER — szczegółowa spec

### Zadanie
Dla każdej karty z `qa_status: 'pending'`:
1. Sprawdź wiki i uzupełnij `wiki_desc`, `wiki_keywords`, `wiki_url`
2. Dla każdego keyword w karcie — sprawdź czy jest już w KEYWORDS.md
3. Jeśli nie ma → wyszukaj w internecie → dodaj do KEYWORDS.md
4. Uzupełnij `mechanic_summary` i `keyword_details`

### Strategia korzystania z KEYWORDS.md

```
PRZED każdym wyszukiwaniem w internecie:
  1. Otwórz docs/KEYWORDS.md
  2. Czy ten keyword już istnieje?
     TAK → użyj istniejącej definicji, nie wyszukuj ponownie
     NIE → wyszukaj w wiki → dodaj nową sekcję do KEYWORDS.md → użyj

Po każdym nowym keyword dodanym do KEYWORDS.md:
  → Zapisz plik od razu (nie akumuluj — każdy run może się urwać)
```

### Źródła do weryfikacji (w tej kolejności)

```
1. KEYWORDS.md (lokalna baza — ZAWSZE NAJPIERW)
2. https://slay-the-spire.fandom.com/wiki/[Keyword]
3. https://slay-the-spire.wiki.gg/wiki/[Keyword]
4. https://slay-the-spire.fandom.com/wiki/[CardName]
```

Dla każdego wyszukiwania: pobierz stronę wiki, wyciągnij definicję mechaniki (akapit "Description" lub "Effect"). Nigdy nie cytuj więcej niż 2 zdania — resztę parafrazuj.

### Wypełnianie mechanic_summary

Mechanic summary to 2-3 zdania które opisują CAŁĄ kartę, nie tylko keywords. Napisz je po polsku, jasno, bez żargonu. Przykład dla Miracle:

```
"Karta trzyma się w ręce między turami (nie jest odrzucana automatycznie).
Po zagraniu daje graczowi 2 kryształy energii.
Po zagraniu znika z gry — nie trafia do discard pile."
```

### Co Agent 2 MOŻE zrobić

- Dodawać sekcje do KEYWORDS.md
- Uzupełniać puste pola w enriched_cards/*.json
- Zmieniać qa_status z 'pending' na 'pending' (nie może sam approve'ować)

### Co Agent 2 NIE MOŻE robić

- Zmieniać desc_raw (to jest oryginał, nigdy nie ruszamy)
- Zmieniać qa_status na 'approved' (to tylko Agent 3)
- Dodawać mechanik które nie są potwierdzone w wiki

---

## AGENT 3: QA CRITIC — szczegółowa spec

### Rola
Jedyny agent który może zablokować pipeline. Sprawdza output Agentów 1 i 2. Jest celowo krytyczny — nie szuka powodów żeby zatwierdzić, szuka powodów żeby odrzucić.

### Checklist dla każdej karty (przejdź punkt po punkcie)

```
□ desc_clean nie ma żadnych placeholderów (<P>, [X], !D! itp.)
□ Każdy keyword wymieniony w desc_clean jest na liście keywords[]
□ Każdy keyword na liście keywords[] faktycznie pojawia się w opisie lub jest keyword ukryty (Innate, Ethereal - mogą być właściwościami karty bez bycia w opisie)
□ wiki_url jest poprawny i prowadzi do właściwej strony
□ wiki_desc zgadza się z tym co faktycznie jest na wiki
□ mechanic_summary nie zawiera efektów których nie ma w desc_clean ani w wiki
□ Definicje w KEYWORDS.md dla keywords tej karty są poprawne
□ qa_critic_score jest przydzielony (1-5)
```

### Kryteria oceny (qa_critic_score)

```
5 — Idealny. Wszystkie pola poprawne, wiki potwierdza, zero problemów.
4 — Dobry. Drobna nieścisłość w mechanic_summary ale mechaniki OK.
3 — Akceptowalny. Jeden keyword niezweryfikowany lub opis lekko niejasny.
2 — Wymaga poprawki. Błąd w definicji mechaniki lub niezgodność z wiki.
1 — Odrzucony. Hallucynacja (wymyślony efekt), zły wiki_url, brakujący keyword.
```

### Zasady krytyki

**Zasada 1: Wiki jest źródłem prawdy.** Jeśli wiki mówi że Exhaust oznacza "karta jest usuwana z gry" a my piszemy "karta idzie do discard pile" — to jest błąd klasy 1.

**Zasada 2: Brak informacji to nie informacja.** Jeśli Agent 2 nie znalazł definicji mechaniki i zostawił pole puste — Agent 3 musi to oznaczyć jako błąd, nie zatwierdzić.

**Zasada 3: Sprawdź ponownie w wiki.** Dla każdej karty z qa_critic_score < 4 — Agent 3 sam wchodzi na wiki i weryfikuje. Nie ufa outputowi Agent 2.

**Zasada 4: Konkrety, nie komplementy.** Jeśli coś jest OK — napisz "OK". Jeśli coś jest złe — napisz dokładnie co i dlaczego. Żadnych "świetna robota, ale...".

### Output Agent 3

```json
{
  "qa_status": "approved",          // lub "needs_fix"
  "qa_critic_score": 5,
  "qa_notes": "OK. Wszystkie keywords potwierdzone z wiki. mechanic_summary poprawny."
}
```

Lub przy odrzuceniu:
```json
{
  "qa_status": "needs_fix",
  "qa_critic_score": 2,
  "qa_notes": "BŁĄD: mechanic_summary twierdzi że Exhaust = discard pile. To nieprawda. Exhaust = usuwanie z gry (Removed from game). Sprawdź: https://slay-the-spire.fandom.com/wiki/Exhaust. Popraw mechanic_summary i definicję w KEYWORDS.md."
}
```

### Pętla poprawek

```
Agent 3 odrzuca (needs_fix)
        ↓
Agent 2 dostaje feedback i poprawia
        ↓
Agent 3 sprawdza ponownie
        ↓
Maksymalnie 2 runde poprawek — jeśli po 2 rundach dalej needs_fix
→ Zapisz kartę jako needs_fix z notatką i przejdź do następnej
→ Nie blokuj całego pipeline jedną kartą
```

---

## AGENT 4: FRONTEND BUILDER — szczegółowa spec

### Zadanie
Zbudować nową zakładkę w aplikacji React dostępną przez `?epic=7`.

### Lokalizacja kodu

```
src/modules/card-mechanics/
├── CardMechanicsView.tsx      ← główny widok
├── CardMechanicsList.tsx      ← lista kart
├── CardMechanicsCard.tsx      ← pojedyncza karta z opisem
├── KeywordPanel.tsx           ← sidepanel z definicją mechaniki
└── types.ts                   ← TypeScript interfaces

src/data/enriched/
├── index.ts                   ← eksportuje ENRICHED_CARDS[]
└── *.json                     ← dane kart (generowane przez Agent 1-3)
```

### Layout widoku

```
┌─────────────────────────────────────────────────────┐
│  MECHANIKI KART                     Postęp: 8/668   │
│─────────────────────────────────────────────────────│
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Miracle  │  │Apparition│  │  Beta    │         │
│  │ ⚡ 0     │  │ 🔮 1     │  │ 🔮 1     │         │
│  │ Skill    │  │ Skill    │  │ Skill    │         │
│  │ ──────── │  │ ──────── │  │ ──────── │         │
│  │ Retain.  │  │ Ethereal.│  │ Shuffle  │         │
│  │ Gain 2   │  │ Gain 1   │  │ Omega    │         │
│  │ Energy.  │  │ Intangib │  │ into     │         │
│  │ Exhaust. │  │ Exhaust. │  │ draw     │         │
│  │ ──────── │  │ ──────── │  │ pile.    │         │
│  │[Retain]  │  │[Ethereal]│  │ ──────── │         │
│  │[Exhaust] │  │[Intangib]│  │[Exhaust] │         │
│  │          │  │[Exhaust] │  │          │         │
│  │ ✅ QA OK │  │ ✅ QA OK │  │ 🟡 draft │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│  [KEYWORD PANEL - gdy klikniesz keyword]           │
│  ┌─────────────────────────────────────────────┐   │
│  │ RETAIN                          [✕ zamknij] │   │
│  │ Gra: Slay the Spire                         │   │
│  │ Karta nie jest odrzucana na koniec tury.    │   │
│  │ Zostaje w ręce do następnej tury.           │   │
│  │ → Wiki: slay-the-spire.fandom.com/...       │   │
│  └─────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

### Stany karty w UI

```typescript
type CardQAStatus = 'pending' | 'approved' | 'needs_fix'

// Kolory badge
const STATUS_COLORS = {
  approved: '#2a5a2a',   // ciemnozielony
  pending:  '#5a5a1a',   // żółtawy
  needs_fix:'#5a1a1a',   // czerwonawy
}

const STATUS_LABELS = {
  approved:  '✅ Zweryfikowane',
  pending:   '🟡 W toku',
  needs_fix: '❌ Wymaga poprawki',
}
```

### Routing

```typescript
// W App.tsx — sprawdź query param:
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('epic') === '7') {
  return <CardMechanicsView />
}

// Lub jako case w switchu view:
case 'card-mechanics': return <CardMechanicsView />
```

### Dane (import)

```typescript
// src/data/enriched/index.ts
import miracle from './sts_miracle.json'
import apparition from './sts_apparition.json'
// itd.
import type { EnrichedCard } from '../../modules/card-mechanics/types'

export const ENRICHED_CARDS: EnrichedCard[] = [
  miracle, apparition, // ...
] as EnrichedCard[]
```

### KeywordPanel (sidepanel)

Otwiera się przy kliknięciu na keyword badge w karcie. Czyta dane z KEYWORDS.md przekonwertowanego do JSON lub hardcode'owanego obiektu przez Agent 4.

```typescript
interface KeywordData {
  name: string
  game: string
  short_desc: string
  full_desc: string
  examples: string[]
  wiki_url: string
  verified: boolean
}
```

---

## KOLEJNOŚĆ PRACY AGENTÓW

```
FAZA 1 (Agent 1):
  1. Wczytaj 8 kart z card_library.json (filtruj po name)
  2. Przetwórz każdą → zapisz do src/data/enriched/[id].json
  3. Commit: "feat(epic7): Agent1 — extracted keywords for 8 pilot cards"
  4. Raport: ile kart, ile keywords, ile problemów znalezionych

FAZA 2 (Agent 2):
  5. Wczytaj src/data/enriched/*.json (qa_status: 'pending')
  6. Sprawdź KEYWORDS.md — jakich keywords brakuje?
  7. Dla każdego brakującego keyword: wyszukaj → dodaj do KEYWORDS.md
  8. Uzupełnij wiki_desc, wiki_keywords, mechanic_summary dla każdej karty
  9. Commit: "feat(epic7): Agent2 — researched mechanics, built KEYWORDS.md"
  10. Raport: ile keywords dodanych, ile kart uzupełnionych

FAZA 3 (Agent 3):
  11. Wczytaj src/data/enriched/*.json
  12. Dla każdej karty: przejdź przez checklist
  13. Ustaw qa_status i qa_critic_score
  14. Przy needs_fix: napisz konkretne co poprawić
  15. Agent 2 poprawia (max 2 rundy)
  16. Commit: "feat(epic7): Agent3 — QA pass, X/8 approved"
  17. Raport: ile approved, ile needs_fix, średni score

FAZA 4 (Agent 4):
  18. Zbuduj src/modules/card-mechanics/
  19. Podpnij do App.tsx i StartPage
  20. npm run build → MUSI przejść
  21. Commit: "feat(epic7): Agent4 — card mechanics view live"
  22. Sprawdź na live URL: https://qoopercodding.github.io/clawcard/?epic=7
```

---

## ZASADY GLOBALNE AGENTÓW

**Zasada pamięci lokalnej:**
Każdy agent czyta KEYWORDS.md ZANIM cokolwiek szuka w internecie.
Zaszczędza tokeny i zapobiega niespójnym definicjom.

**Zasada atomowych commitów:**
Każdy agent commituje po swojej fazie. Nigdy nie commituj w środku fazy.
Format: `feat(epic7): Agent[N] — [co zrobiono]`

**Zasada niezmienności:**
`desc_raw` NIGDY się nie zmienia. To oryginał ze scrapu.
Tylko `desc_clean` i dalej są modyfikowalne.

**Zasada failsafe:**
Jeśli Agent 2 nie może znaleźć definicji mechaniki w 3 próbach → zaznacz keyword jako `unverified` i idź dalej. Nie blokuj całego pipeline.

**Zasada re-weryfikacji:**
Agent 2 co 10 kart wraca do wiki jednej losowej mechaniki i sprawdza czy definicja w KEYWORDS.md nadal się zgadza. Mechaniki gier nie zmieniają się (gra jest skończona) ale scraper mógł coś przekręcić.

---

## CARD LIBRARY — JAK ZNALEŹĆ PILOTOWE KARTY

```javascript
// card_library.json nie jest w repo lokalnie — jest na VPS
// Na VPS: ~/clawcard/tools/card-scraper/output/ lub src/data/

// Filtrowanie pilotowych kart:
const PILOT_CARDS = [
  'Miracle', 'Apparition', 'Beta', 'Bite',
  'Expunger', 'Insight', 'J.A.X.'
]

// Jeśli card_library.json jest dostępny:
const pilotData = allCards.filter(c =>
  PILOT_CARDS.includes(c.name) && c.game === 'slay_the_spire'
)

// Jeśli nie ma pliku — scraper pobierze z API:
// GET https://slay-the-spire.fly.dev/api/v1/cards/[CardName]
```

---

## WIKI URLS DLA KART PILOTOWYCH

| Karta | Wiki URL |
|-------|---------|
| Miracle | https://slay-the-spire.fandom.com/wiki/Miracle |
| Apparition | https://slay-the-spire.fandom.com/wiki/Apparition |
| Beta | https://slay-the-spire.fandom.com/wiki/Beta |
| Bite | https://slay-the-spire.fandom.com/wiki/Bite |
| Expunger | https://slay-the-spire.fandom.com/wiki/Expunger |
| Insight | https://slay-the-spire.fandom.com/wiki/Insight |
| J.A.X. | https://slay-the-spire.fandom.com/wiki/J.A.X. |

Alternatywne wiki (sprawdź jeśli fandom nie działa):
- https://slay-the-spire.wiki.gg/wiki/[CardName]

---

## INSTRUKCJA DLA AGENTA — JAK ZACZĄĆ

Wklej to jako pierwszy prompt do Claude Code na VPS:

```
Przeczytaj docs/EPIC7_TECHNICAL.md dokładnie.

Zacznij od FAZY 1 (Agent 1 — Extractor):

1. Znajdź card_library.json (szukaj w tools/card-scraper/output/, src/data/, lub pobierz z API StS)
2. Wyfiltruj 7 kart pilotowych: Miracle, Apparition, Beta, Bite, Expunger, Insight, J.A.X.
3. Dla każdej karty: wyczyść opis, wyciągnij keywords, zapisz do src/data/enriched/[id].json
4. Jeśli card_library.json nie istnieje lokalnie — użyj skryptu tools/card-scraper/scrape-sts.mjs żeby go pobrać

Schemat danych w EPIC7_TECHNICAL.md sekcja "EnrichedCard".
Lista placeholderów w sekcji "Agent 1: Mapa placeholderów".

Po zakończeniu: git add . && git commit -m "feat(epic7): Agent1 — extracted keywords for 7 pilot cards" && git push
Następnie raport na Telegram: ile kart, ile keywords, ile problemów.
CZEKAJ na odpowiedź zanim zaczniesz Fazę 2.
```

---

*Data: 2 kwietnia 2026 | Epic 7 | 4 agenci, 4 fazy, 8 kart pilotowych → 668 kart*
*Stack: TypeScript + React + Vite | VPS: Hetzner Ubuntu 24.04 | Claude Max Opus 4.6*
