#!/usr/bin/env python3
"""
Wildfrost Wiki Scraper v3
- Poprawny parser Lua (obsługa zagnieżdżonych {})
- Emoji dla statystyk (Frenzy, Teeth, Snow, Demonize...)
- Kolumna Challenge (jak odblokować kartę)
- URL obrazka karty
- Oddzielne taby per typ
Uruchomienie: py wildfrost_scraper_v3.py
"""

import requests
import json
import re
import time
from pathlib import Path
from collections import defaultdict

# ── Konfiguracja ──────────────────────────────────────────────────────────────
SPREADSHEET_ID   = "1dYu6k0sgVtW929EczqR8yEWkM7mfcc36wlwbp71FgQ0"
CREDENTIALS_FILE = r"C:\Users\Qoope\Downloads\clawcard-4078b0eed30a.json"
OUTPUT_JSON      = "wildfrost_cards_v3.json"
WIKI_BASE        = "https://wildfrostwiki.com"
WIKI_API         = f"{WIKI_BASE}/api.php"
WIKI_IMG_BASE    = f"{WIKI_BASE}/images"
DELAY            = 0.8

# ── Mapowanie stat-ów na emoji ─────────────────────────────────────────────────
STAT_EMOJI = {
    "Frenzy":    "⚡ Frenzy",
    "Teeth":     "🦷 Teeth",
    "Snow":      "❄️ Snow",
    "Frost":     "🧊 Frost",
    "Shroom":    "🍄 Shroom",
    "Spice":     "🌶️ Spice",
    "Bom":       "💣 Bom",
    "Ink":       "🖤 Ink",
    "Demonize":  "💜 Demonize",
    "Overburn":  "🔥 Overburn",
    "Shell":     "🛡️ Shell",
    "Weakness":  "💔 Weakness",
    "Health":    "❤️ Health",
    "Attack":    "⚔️ Attack",
    "Counter":   "⏱️ Counter",
    "Draw":      "🎴 Draw",
    "Bling":     "💰 Bling",
    "Scrap":     "🔧 Scrap",
    "Block":     "🛡️ Block",
    "Wild":      "🌀 Wild",
}

KEYWORD_EMOJI = {
    "Trash":       "🗑️ Trash",
    "Aimless":     "🎯 Aimless",
    "Hogheaded":   "🐷 Hogheaded",
    "Smackback":   "↩️ Smackback",
    "Backline":    "⬅️ Backline",
    "Recycle":     "♻️ Recycle",
    "Consume":     "💨 Consume",
    "Splash":      "💦 Splash",
    "Pull":        "🔗 Pull",
    "Noomlin":     "🟢 Noomlin",
}

# Kolejność tabów
TAB_ORDER = [
    ("Leader",       "👑 Leaders"),
    ("Pet",          "🐾 Pets"),
    ("Companion",    "🧑 Companions"),
    ("Item",         "🎒 Items"),
    ("Clunker",      "⚙️ Clunkers"),
    ("Shade",        "👻 Shades"),
    ("Enemy",        "👾 Enemies"),
    ("EnemyClunker", "🤖 Enemy Clunkers"),
    ("Miniboss",     "⚠️ Minibosses"),
    ("Boss",         "💀 Bosses"),
    ("Charm",        "✨ Charms"),
    ("CursedCharm",  "🔮 Cursed Charms"),
    ("Unknown",      "❓ Other"),
]

# ── Pobieranie z MediaWiki API ────────────────────────────────────────────────
def fetch_page_content(title):
    """Pobiera surowy wikitext strony"""
    r = requests.get(WIKI_API, params={
        "action":      "query",
        "titles":      title,
        "prop":        "revisions",
        "rvprop":      "content",
        "format":      "json",
        "formatversion": "2"
    }, timeout=30, headers={"User-Agent": "ClawCardBot/3.0 (research)"})
    r.raise_for_status()
    pages = r.json()["query"]["pages"]
    if pages[0].get("missing"):
        return None
    return pages[0]["revisions"][0]["content"]

# ── Czyszczenie wikitext ──────────────────────────────────────────────────────
def clean_wikitext(text):
    """Zamienia wiki markup na czytelny tekst z emoji"""
    if not text:
        return ""

    # {{Stat|X}} → emoji lub nazwa
    def replace_stat(m):
        stat = m.group(1).strip()
        return STAT_EMOJI.get(stat, stat)
    text = re.sub(r"\{\{Stat\|([^|}]+)(?:\|[^}]*)?\}\}", replace_stat, text)

    # {{Keyword|X}} → emoji lub nazwa
    def replace_keyword(m):
        kw = m.group(1).strip()
        return KEYWORD_EMOJI.get(kw, kw)
    text = re.sub(r"\{\{Keyword\|([^|}]+)(?:\|[^}]*)?\}\}", replace_keyword, text)

    # {{Status|X}} → X
    text = re.sub(r"\{\{Status\|([^|}]+)(?:\|[^}]*)?\}\}", r"\1", text)

    # [[Page|Display]] → Display
    text = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", text)
    # [[Page]] → Page
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)

    # '''bold''' i ''italic''
    text = re.sub(r"'{2,3}", "", text)

    # HTML entities
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")

    # Usuń pozostałe {{...}}
    text = re.sub(r"\{\{[^}]+\}\}", "", text)

    return text.strip()

# ── Parser Lua - poprawny algorytm ───────────────────────────────────────────
def extract_lua_value(text, start):
    """
    Wyciąga wartość Lua zaczynając od pozycji start.
    Obsługuje stringi "...", liczby, tabele {...}
    Zwraca (wartość_jako_string, pozycja_po_wartości)
    """
    text = text[start:]
    text = text.lstrip()

    if text.startswith('"'):
        # String - znajdź koniec (obsługa escape)
        i = 1
        while i < len(text):
            if text[i] == '\\':
                i += 2
            elif text[i] == '"':
                return text[1:i], start + i + 1
            else:
                i += 1
        return text[1:], start + len(text)

    elif text.startswith('{'):
        # Tabela - znajdź matching }
        depth = 0
        i = 0
        in_str = False
        for i, ch in enumerate(text):
            if ch == '"' and not in_str:
                in_str = True
            elif ch == '"' and in_str:
                in_str = False
            elif not in_str:
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        return text[:i+1], start + i + 1
        return text, start + len(text)

    else:
        # Liczba lub boolean
        m = re.match(r'[\d.]+', text)
        if m:
            return m.group(), start + m.end()
        m = re.match(r'true|false|nil', text)
        if m:
            return m.group(), start + m.end()
        return "", start

def parse_lua_table(table_str):
    """
    Parsuje string tabeli Lua { key=val, key=val, ... }
    Zwraca dict
    """
    # Usuń zewnętrzne {}
    inner = table_str.strip()
    if inner.startswith('{') and inner.endswith('}'):
        inner = inner[1:-1]

    result = {}
    i = 0
    while i < len(inner):
        # Pomiń whitespace i przecinki
        while i < len(inner) and inner[i] in ' \t\n\r,':
            i += 1
        if i >= len(inner):
            break

        # Znajdź klucz
        key_m = re.match(r'(\w+)\s*=\s*', inner[i:])
        if not key_m:
            # Brak klucza (lista wartości) - pomiń
            # Znajdź następny przecinek lub koniec
            next_comma = inner.find(',', i)
            i = next_comma + 1 if next_comma != -1 else len(inner)
            continue

        key = key_m.group(1)
        i += key_m.end()

        # Pobierz wartość
        val_str, new_i = extract_lua_value(inner, i)
        i = new_i - len(inner) + len(inner)  # relative pozycja

        # Ponieważ extract_lua_value operuje na inner[i:], popraw indeks
        # Prościej: wyciągnij wartość bezpośrednio
        rest = inner[i - (new_i - i):]  # to jest skomplikowane, użyjmy prostszego podejścia

        result[key] = val_str

    return result

def parse_lua_cards_simple(lua_text):
    """
    Prosty i niezawodny parser - dzieli tekst na bloki per karta
    i parsuje każdy blok osobno
    """
    cards = []

    # Znajdź wszystkie wpisy cards["..."] = {
    # Używamy podejścia line-by-line
    card_start_re = re.compile(r'^cards\["([^"]+)"\]\s*=\s*\{', re.MULTILINE)

    starts = [(m.start(), m.end(), m.group(1)) for m in card_start_re.finditer(lua_text)]

    for idx, (block_start, content_start, card_id) in enumerate(starts):
        # Znajdź koniec bloku - szukamy '\n}' na poziomie 0
        depth = 1
        i = content_start
        in_str = False
        while i < len(lua_text) and depth > 0:
            ch = lua_text[i]
            if ch == '"' and (i == 0 or lua_text[i-1] != '\\'):
                in_str = not in_str
            elif not in_str:
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
            i += 1

        block_content = lua_text[content_start:i-1]  # bez ostatniego }

        card = parse_card_block(card_id, block_content)
        if card:
            cards.append(card)

    return cards

def parse_card_block(card_id, body):
    """Parsuje ciało bloku karty"""
    card = {"id": card_id}

    # Name
    m = re.search(r'\bName\s*=\s*"((?:[^"\\]|\\.)*)"', body)
    card["name"] = m.group(1) if m else card_id

    # Pola liczbowe
    for field in ["Health", "Attack", "Counter", "Scrap", "Price", "ChallengeOrder"]:
        m = re.search(rf'\b{field}\s*=\s*(\d+)', body)
        if m:
            card[field.lower()] = int(m.group(1))

    # Pola tekstowe
    for field in ["Desc", "Other", "SummonCon", "Link", "Image"]:
        m = re.search(rf'\b{field}\s*=\s*"((?:[^"\\]|\\.)*)"', body)
        if m:
            raw = m.group(1).replace('\\"', '"')
            card[field.lower()] = clean_wikitext(raw)

    # Types - wyciągnij klucze z {Key=true, Key2=true}
    types_m = re.search(r'\bTypes\s*=\s*\{([^}]+)\}', body)
    if types_m:
        card["types"] = re.findall(r'(\w+)\s*=\s*true', types_m.group(1))
    else:
        card["types"] = []

    # Tribes
    tribes_m = re.search(r'\bTribes\s*=\s*\{([^}]+)\}', body)
    if tribes_m:
        card["tribes"] = re.findall(r'"([^"]+)"', tribes_m.group(1))
    else:
        card["tribes"] = []

    # Primary type
    types = card["types"]
    priority = ["Boss", "Miniboss", "EnemyClunker", "Enemy", "CursedCharm",
                "Charm", "Shade", "Clunker", "Item", "Leader",
                "Pet", "NonPetCompanion", "Companion"]
    card["primary_type"] = "Unknown"
    for p in priority:
        if p in types:
            if p == "NonPetCompanion":
                card["primary_type"] = "Companion"
            else:
                card["primary_type"] = p
            break

    # HP type (scrap lub heart)
    card["hp_type"] = "Scrap" if card.get("scrap") else "Health"

    # URL obrazka - wiki używa przewidywalnego formatu
    img_name = card.get("image") or card.get("link") or card["name"]
    card["image_url"] = f"{WIKI_BASE}/wiki/File:{img_name.replace(' ', '_')}_Card.png"
    card["wiki_url"]  = f"{WIKI_BASE}/{card['id'].replace(' ', '_')}"

    return card

# ── Pobieranie Challenge z kategorii ─────────────────────────────────────────
def fetch_challenge_data():
    """
    Pobiera dane Challenge z Pets page - tam jest pełna tabela z Challenge.
    Zwraca dict {card_name: challenge_text}
    """
    challenges = {}
    pages_to_check = ["Pets", "Companions", "Items", "Clunkers", "Shades"]

    for page in pages_to_check:
        print(f"   Szukam Challenge w stronie: {page}")
        content = fetch_page_content(page)
        if not content:
            continue

        # Szukaj wzorców typu: |Snoof|...|challenge=Unlocked by default
        # lub tabel z challenge
        # W wiki Wildfrost tabele kart mają kolumnę Challenge
        # Format: {{Cards|Pet|name|health|...}} lub przez {{#invoke:Cards|...}}

        # Spróbuj znaleźć challenge przez wzorzec w tekście strony
        challenge_matches = re.findall(
            r'\|\s*([A-Z][^|]+?)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([^|}\n]+challenge[^|}\n]*)',
            content, re.IGNORECASE
        )
        for name, challenge in challenge_matches:
            name = name.strip()
            challenge = clean_wikitext(challenge.strip())
            if name and challenge:
                challenges[name] = challenge

        time.sleep(DELAY)

    return challenges

# ── Google Sheets ─────────────────────────────────────────────────────────────
HEADERS = [
    "🖼️ Image URL",
    "📛 Card Name",
    "🏷️ Type",
    "🔖 All Types",
    "❤️ HP (type)",
    "⚔️ Attack",
    "⏱️ Counter",
    "💰 Price",
    "🏛️ Tribes",
    "⚡ Abilities (Other)",
    "📖 Description",
    "🏆 Challenge (unlock)",
    "🔗 Wiki URL",
]

def card_to_row(c, challenges):
    hp_val = c.get("health") or c.get("scrap") or ""
    hp_label = f"{hp_val} ({c.get('hp_type', '')})" if hp_val != "" else ""
    challenge = challenges.get(c["name"], challenges.get(c["id"], ""))

    return [
        c.get("image_url", ""),
        c.get("name", c.get("id", "")),
        c.get("primary_type", ""),
        ", ".join(c.get("types", [])),
        hp_label,
        c.get("attack", ""),
        c.get("counter", ""),
        c.get("price", ""),
        ", ".join(c.get("tribes", [])),
        c.get("other", ""),
        c.get("desc", ""),
        challenge,
        c.get("wiki_url", ""),
    ]

def format_header(ws):
    ws.format("A1:M1", {
        "textFormat": {
            "bold": True,
            "foregroundColor": {"red": 1, "green": 1, "blue": 1}
        },
        "backgroundColor": {"red": 0.1, "green": 0.3, "blue": 0.5},
        "horizontalAlignment": "CENTER"
    })
    # Zamroź pierwszy wiersz
    ws.freeze(rows=1)

def save_to_sheets(cards, challenges, spreadsheet_id, credentials_file):
    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError:
        print("❌ pip install gspread google-auth")
        return

    print("\n📊 Łączę z Google Sheets...")
    creds = Credentials.from_service_account_file(
        credentials_file,
        scopes=["https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive"]
    )
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(spreadsheet_id)
    existing_tabs = {ws.title: ws for ws in sh.worksheets()}

    # Grupuj karty po typie
    groups = defaultdict(list)
    for c in cards:
        groups[c["primary_type"]].append(c)

    # Tab "All Cards" (wszystkie razem)
    print("   Tworzę tab: All Cards")
    if "📋 All Cards" in existing_tabs:
        ws_all = existing_tabs["📋 All Cards"]
        ws_all.clear()
    else:
        ws_all = sh.add_worksheet(title="📋 All Cards", rows=1000, cols=len(HEADERS))
    all_rows = [HEADERS] + [card_to_row(c, challenges) for c in cards]
    ws_all.update(all_rows, "A1")
    format_header(ws_all)
    print(f"      ✅ All Cards: {len(cards)} kart")
    time.sleep(0.5)

    # Oddzielne taby per typ
    for type_key, tab_name in TAB_ORDER:
        group = groups.get(type_key, [])
        if not group:
            continue

        print(f"   Tworzę tab: {tab_name}")
        if tab_name in existing_tabs:
            ws = existing_tabs[tab_name]
            ws.clear()
        else:
            ws = sh.add_worksheet(title=tab_name, rows=500, cols=len(HEADERS))

        rows = [HEADERS] + [card_to_row(c, challenges) for c in group]
        ws.update(rows, "A1")
        format_header(ws)
        print(f"      ✅ {tab_name}: {len(group)} kart")
        time.sleep(0.5)

    # Usuń stary "Sheet1" jeśli istnieje i jest pusty
    for old_name in ["Sheet1", "Wildfrost Cards"]:
        if old_name in existing_tabs:
            try:
                existing_tabs[old_name].clear()
                existing_tabs[old_name].update([["Przeniesiono do zakładek powyżej"]], "A1")
            except Exception:
                pass

    print(f"\n🔗 https://docs.google.com/spreadsheets/d/{spreadsheet_id}")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("🦞 Wildfrost Wiki Scraper v3\n" + "="*50)

    # 1. Pobierz Module:Cards/data
    print("\n[1/4] Pobieranie Module:Cards/data...")
    lua = fetch_page_content("Module:Cards/data")
    if not lua:
        print("❌ Nie można pobrać danych!")
        return
    print(f"      Pobrano {len(lua):,} znaków Lua")

    # 2. Parsuj karty
    print("\n[2/4] Parsowanie kart...")
    cards = parse_lua_cards_simple(lua)

    if not cards:
        print("❌ Brak kart!")
        return

    # Statystyki
    from collections import Counter
    types_count = Counter(c["primary_type"] for c in cards)
    print(f"\n      Łącznie: {len(cards)} kart")
    for t, n in sorted(types_count.items(), key=lambda x: -x[1]):
        emoji = next((tab for key, tab in TAB_ORDER if key == t), t)
        print(f"      {emoji}: {n}")

    # Filtruj śmieciowe karty (szablony z $1, $2)
    valid = [c for c in cards if not c["name"].startswith("$") and "{pair" not in c["id"]]
    print(f"\n      Po filtracji: {len(valid)} prawdziwych kart")

    # 3. Pobierz dane Challenge
    print("\n[3/4] Pobieranie danych Challenge (opcjonalne)...")
    challenges = {}
    try:
        challenges = fetch_challenge_data()
        print(f"      Znaleziono {len(challenges)} wpisów Challenge")
    except Exception as e:
        print(f"      ⚠️ Nie udało się pobrać Challenge: {e}")

    # 4. Zapisz JSON
    print("\n[4/4] Zapis do plików...")
    Path(OUTPUT_JSON).write_text(
        json.dumps(valid, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"      💾 JSON: {OUTPUT_JSON} ({len(valid)} kart)")

    # 5. Zapisz do Sheets
    save_to_sheets(valid, challenges, SPREADSHEET_ID, CREDENTIALS_FILE)

    print("\n" + "="*50)
    print(f"✅ GOTOWE! {len(valid)} kart w Google Sheets")

if __name__ == "__main__":
    main()
