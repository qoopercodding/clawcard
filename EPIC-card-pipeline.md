# EPIC: Card Pipeline — Frame Editor, Card Editor, Scrapers

## Problem Statement

1. **Frame Editor → Card Editor broken**: Custom frame types save to localStorage but CardFrame.tsx only reads from hardcoded FRAME_CONFIGS. PNG files are lost after session.
2. **Card images broken**: MT has 0 images, StS URLs return 403 (Special:FilePath blocked). Need `pageimages` API approach.
3. **No dedicated card browser**: Scraped cards visible only inside Card Editor, no standalone viewer.
4. **Card fields incomplete**: Each game has unique fields not captured by current schema.

---

## Phase 1: Fix Frame Editor → Card Editor Pipeline

### CC-031: CardFrame reads custom frame types from localStorage
- **What**: Modify `CardFrame.tsx` to check `custom_frame_types` localStorage when `FRAME_CONFIGS[type]` is undefined
- **Why**: GAP 1 — CardFrame always falls back to `FRAME_CONFIGS.companion`
- **How**: Convert `CustomFrameType.areas` → `FrameConfig` format, use as fallback
- **Files**: `CardFrame.tsx`, `cardStore.tsx`
- **Test**: Create frame in Frame Editor, switch to Card Editor, select custom type → preview should use correct layout

### CC-032: Persist frame PNG as base64 dataURL in localStorage
- **What**: When user uploads custom PNG in Frame Editor, save the dataURL to `custom_frame_types` entry
- **Why**: GAP 3 — PNG path is saved but actual file is lost after session
- **How**: Add `frameDataUrl: string | null` to `CustomFrameType`, save from FileReader result
- **Files**: `FrameEditorScreen.tsx`, `cardStore.tsx`
- **Test**: Upload PNG in Frame Editor, save, refresh page, open Card Editor → frame PNG still visible

### CC-033: CardFrame renders custom fields dynamically
- **What**: If card has `customFields` and frame type has area definitions for them, render them on the card
- **Why**: GAP 6 — FormPanel shows custom fields but CardFrame ignores them
- **How**: Loop over `customFrameType.areas` keys not in builtin set, render text at those positions
- **Files**: `CardFrame.tsx`
- **Test**: Create frame with "mana" custom field, create card with mana=5, see it on preview

### CC-034: Immediate navigation Frame Editor → Card Editor with pending type
- **What**: After save in Frame Editor, auto-navigate to Card Editor with the new type pre-selected
- **Why**: User expects immediate use of created frame
- **How**: `setPendingType()` already works, add "Open in Card Editor" button post-save, or auto-nav
- **Files**: `FrameEditorScreen.tsx`, `App.tsx`
- **Test**: Save frame → lands in Card Editor with custom type selected, preview uses custom layout

---

## Phase 2: Fix Card Image Scraping

### CC-035: Update MT scraper to fetch images via pageimages API
- **What**: Add image URL fetching to `scrape-mt.mjs` using Fandom `pageimages` prop API
- **Why**: 282 MT cards have `image: null`
- **How**:
  1. Fetch card titles via `categorymembers` API
  2. Batch `pageimages` (50 per request) to get `static.wikia.nocookie.net` URLs
  3. Match to existing cards by name, update `image` field
- **API**: `?action=query&titles=Card1|Card2&prop=pageimages&pithumbsize=400&format=json`
- **Files**: `tools/card-scraper/scrape-mt.mjs`
- **Test**: Run scraper, verify `mt-cards.json` has image URLs, open a few in browser

### CC-036: Update StS scraper to use pageimages API instead of Special:FilePath
- **What**: Replace broken `Special:FilePath/` URLs with working `pageimages` API URLs
- **Why**: Current StS image URLs return 403
- **How**: Same batch `pageimages` approach as MT
- **Files**: `tools/card-scraper/scrape-sts.mjs`
- **Test**: Run scraper, verify image URLs work in browser (no CORS, no 403)

### CC-037: Re-run merge and rebuild cardLibrary.json
- **What**: Re-run `merge-cards.mjs` to produce updated `cardLibrary.json` with working image URLs
- **Why**: After CC-035 and CC-036, source JSONs have new image URLs
- **Files**: `tools/card-scraper/merge-cards.mjs`, `src/data/cardLibrary.json`
- **Test**: Open Card Editor, browse MT cards → images visible in browser

### CC-038: Verify images render in Card Editor preview
- **What**: Ensure CardFrame renders `card.imageUrl` from library with working URLs
- **Why**: Even with correct URLs, rendering may fail (CORS, sizing, positioning)
- **How**: Check `CardFrame.tsx` img rendering, fix any fallback/error handling issues
- **Files**: `CardFrame.tsx`, `CardEditorScreen.tsx`
- **Test**: Select StS card → see card art in live preview. Select MT card → see card art.

---

## Phase 3: Standalone Card Browser

### CC-039: Create CardBrowserScreen.tsx — full-page scrollable card viewer
- **What**: Standalone page with all 668+ cards in a filterable, scrollable grid
- **Why**: User wants dedicated browsing experience outside Card Editor
- **Layout**:
  - Header: filter bar (game source, type, rarity, search)
  - Grid: card tiles with image, name, stats, description
  - Pagination or virtual scroll
- **Files**: `src/pages/CardBrowserScreen.tsx`
- **Test**: Navigate from StartPage → see all cards, filter by game, scroll smoothly

### CC-040: Add CardBrowserScreen to App routing and StartPage nav
- **What**: Wire up routing, add nav card on StartPage under Tools section
- **Files**: `App.tsx`, `StartPage.tsx`
- **Test**: Click "Card Library" on StartPage → opens browser

### CC-041: Card detail modal in browser
- **What**: Click a card in browser → modal with full details: all fields, large image, frame preview
- **Why**: Quick inspection without leaving the browser
- **Files**: `CardBrowserScreen.tsx`
- **Test**: Click card → see modal with all data

---

## Phase 4: Game-Specific Field Mapping

### CC-042: Research and document all unique fields per game
- **What**: Create field mapping document — which fields each game has that we should display
- **StS fields**: cost, costPlus (upgraded), type (Attack/Skill/Power), traits (Ethereal, Exhaust, Innate, Retain), class color
- **MT fields**: clan, capacity, essence, type (Champion/Spell/Monster), floor size
- **Wildfrost fields**: counter, scrap, tribes, price, hp_type, challenge unlock
- **Output**: `wiki/card-fields-spec.md`
- **Files**: research only, no code

### CC-043: Extend card schema with game-specific fields
- **What**: Add optional fields to `LibraryCard` interface: `costPlus`, `traits`, `clan`, `capacity`, `counter`, `scrap`, `tribes`
- **Why**: Preserves game-specific data through the pipeline
- **Files**: `CardEditorScreen.tsx` (LibraryCard interface), `merge-cards.mjs`
- **Test**: MT cards show clan, StS cards show traits, WF cards show counter

### CC-044: Frame Editor presets per game
- **What**: Add preset buttons: "StS Frame", "MT Frame", "Wildfrost Frame" that pre-populate fields
- **StS preset**: cost, name, description, type, rarity, art
- **MT preset**: cost, clan, attack, health, capacity, name, description, art
- **WF preset**: attack, health, counter, scrap, name, description, art
- **Files**: `FrameEditorScreen.tsx`
- **Test**: Click "MT Frame" → fields for cost, clan, attack, health appear

### CC-045: Card Editor auto-selects frame based on library card source
- **What**: When selecting a card from library, auto-pick matching frame type
- **Mapping**: `slay_the_spire` → StS frame, `monster_train` → MT frame, `wildfrost` → companion/item
- **Files**: `CardEditorScreen.tsx`
- **Test**: Select MT card from browser → MT frame auto-selected, fields populated

---

## Phase 5: Integration & Polish

### CC-046: Card export — download card as PNG
- **What**: "Download" button on card preview → renders card to canvas → saves PNG
- **Files**: `CardEditorScreen.tsx`, `CardFrame.tsx`

### CC-047: Update TASKS.md with Phase 1-5 progress
- **What**: Track all CC-031 through CC-047 in TASKS.md

---

## Execution Order

```
Phase 1 (Frame Pipeline):  CC-031 → CC-032 → CC-033 → CC-034
Phase 2 (Scraper Fix):     CC-035 → CC-036 → CC-037 → CC-038
Phase 3 (Browser):         CC-039 → CC-040 → CC-041
Phase 4 (Fields):          CC-042 → CC-043 → CC-044 → CC-045
Phase 5 (Polish):          CC-046 → CC-047
```

Phases 1 and 2 can run in parallel.
Phase 3 depends on Phase 2 (images needed for browser).
Phase 4 depends on Phase 2 (field data from scrapers).
Phase 5 is optional polish.

---

## Risk Notes

- Fandom wiki API rate limits: add 1s delay between batch requests
- `static.wikia.nocookie.net` CDN may change URL structure — save full URLs, don't construct
- localStorage limit (~5MB) — base64 frame PNGs may hit limit if many custom frames
- Custom frame rendering may be slow for complex layouts — keep area count reasonable
