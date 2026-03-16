#!/usr/bin/env python3
"""
Wildfrost Wiki Card Scraper v2
- Parses Module:Cards/data (Lua) → JSON
- Generates image URLs for each card
- Downloads card art images (when run with --download flag)

USAGE:
  python parse_wiki_cards.py cards_lua_raw.txt                  # parse only
  python parse_wiki_cards.py cards_lua_raw.txt --download        # parse + download images
  python parse_wiki_cards.py cards_lua_raw.txt -o output_dir     # custom output dir

OUTPUT (saved to output_dir/):
  wildfrost_cards.json     — all card data
  images/                  — card art PNGs (if --download)
"""
import re, json, sys, os, urllib.request, urllib.error, time

WIKI_BASE = "https://wildfrostwiki.com"
# MediaWiki Special:FilePath gives direct image URL
IMAGE_URL_TEMPLATE = WIKI_BASE + "/Special:FilePath/{filename}"

def extract_card_blocks(lua_text):
    blocks = []
    for match in re.finditer(r'cards\["([^"]+)"\]\s*=\s*\{', lua_text):
        key = match.group(1)
        start = match.end()
        depth = 1
        i = start
        while i < len(lua_text) and depth > 0:
            if lua_text[i] == '{': depth += 1
            elif lua_text[i] == '}': depth -= 1
            i += 1
        blocks.append((key, lua_text[start:i-1]))
    return blocks

def clean_wiki(text):
    text = re.sub(r"\{\{Stat\|([^}|]+)(?:\|[^}]*)?\}\}", r"\1", text)
    text = re.sub(r"\{\{Keyword\|([^}|]+)(?:\|[^}]*)?\}\}", r"\1", text)
    text = re.sub(r"\{\{Card\|([^}|]+)\}\}", r"\1", text)
    text = re.sub(r"\{\{(\w+)\}\}", r"\1", text)
    text = re.sub(r"'''([^']+)'''", r"\1", text)
    text = re.sub(r"''([^']+)''", r"\1", text)
    text = re.sub(r"\[\[([^]|]+)\|([^]]+)\]\]", r"\2", text)
    text = re.sub(r"\[\[([^]]+)\]\]", r"\1", text)
    text = text.replace("<br>", "\n").replace("<br/>", "\n")
    text = re.sub(r'<span[^>]*>', '', text)
    text = text.replace("</span>", "").replace("</div>", "")
    text = re.sub(r'<div[^>]*>', '', text)
    return text.strip()

def parse_card(key, body):
    card = {"_key": key}
    m = re.search(r'Name\s*=\s*"([^"]*)"', body)
    card["name"] = m.group(1) if m else key
    
    m = re.search(r'Types\s*=\s*\{([^}]+)\}', body)
    if m: card["types"] = re.findall(r'(\w+)\s*=\s*true', m.group(1))
    
    for f in ["Health","Scrap","Attack","Counter"]:
        m = re.search(rf'\b{f}\s*=\s*(\d+)', body)
        if m: card[f.lower()] = int(m.group(1))
    
    m = re.search(r'Price\s*=\s*(\d+)', body)
    if m: card["price"] = int(m.group(1))
    
    for f in ["Desc","Other","SummonCon","Challenge"]:
        m = re.search(rf'{f}\s*=\s*"((?:[^"\\]|\\.)*)"', body)
        if m: card[f.lower()] = clean_wiki(m.group(1))
    
    m = re.search(r'Tribes\s*=\s*\{([^}]+)\}', body)
    if m: card["tribes"] = re.findall(r'"([^"]+)"', m.group(1))
    
    # Card type
    types = card.get("types", [])
    for t, label in [("Pet","Pet"),("Shade","Shade"),("Boss","Boss"),("Miniboss","Miniboss"),
                     ("EnemyClunker","EnemyClunker"),("Enemy","Enemy"),("Clunker","Clunker"),
                     ("Item","Item"),("NonPetCompanion","Companion"),("Companion","Companion")]:
        if t in types: card["card_type"] = label; break
    else: card["card_type"] = "Unknown"
    
    # === IMAGE URLs ===
    # Wiki pattern: card art is at File:<Name>.png
    # Card with frame is at File:<Name>_(<Name>).png
    # Some cards use Link= field for a different wiki page name
    m_link = re.search(r'Link\s*=\s*"([^"]*)"', body)
    wiki_name = m_link.group(1) if m_link else key
    
    # Replace spaces with underscores for URL
    safe_name = wiki_name.replace(" ", "_").replace("'", "%27")
    
    # Art image (no card frame, just the illustration)
    card["image_art_url"] = IMAGE_URL_TEMPLATE.format(filename=f"{safe_name}.png")
    # Full card image (with frame, stats, etc.)
    card["image_card_url"] = IMAGE_URL_TEMPLATE.format(filename=f"{safe_name}_({safe_name}).png")
    # Local filename for saving
    card["image_filename"] = f"{key.replace(' ', '_').replace('/', '_')}.png"
    
    return card

def download_images(cards, output_dir):
    """Download card art images to output_dir/images/"""
    img_dir = os.path.join(output_dir, "images")
    os.makedirs(img_dir, exist_ok=True)
    
    success = 0
    fail = 0
    for card in cards:
        filepath = os.path.join(img_dir, card["image_filename"])
        if os.path.exists(filepath):
            success += 1
            continue
        
        url = card["image_art_url"]
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ClawCardScraper/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                with open(filepath, "wb") as f:
                    f.write(resp.read())
            success += 1
            print(f"  ✅ {card['name']}")
            time.sleep(0.3)  # be nice to wiki
        except Exception as e:
            fail += 1
            print(f"  ❌ {card['name']}: {e}")
    
    print(f"\nImages: {success} downloaded, {fail} failed → {img_dir}/")

def main():
    args = sys.argv[1:]
    input_file = "cards_lua_raw.txt"
    output_dir = "."
    do_download = False
    
    i = 0
    while i < len(args):
        if args[i] == "--download":
            do_download = True
        elif args[i] == "-o" and i+1 < len(args):
            output_dir = args[i+1]; i += 1
        elif not args[i].startswith("-"):
            input_file = args[i]
        i += 1
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(input_file, "r", encoding="utf-8") as f:
        lua = f.read()
    
    cards = [parse_card(k, b) for k, b in extract_card_blocks(lua)]
    
    # Stats
    tc = {}
    for c in cards: tc[c["card_type"]] = tc.get(c["card_type"], 0) + 1
    trib = {}
    for c in cards:
        for t in c.get("tribes",[]): trib[t] = trib.get(t,0)+1
    
    print(f"✅ Parsed: {len(cards)} cards")
    print(f"By type: {dict(sorted(tc.items(), key=lambda x:-x[1]))}")
    print(f"By tribe: {dict(sorted(trib.items(), key=lambda x:-x[1]))}")
    
    # Save JSON
    json_path = os.path.join(output_dir, "wildfrost_cards.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    print(f"💾 JSON saved: {json_path}")
    
    # Show sample with image URLs
    print(f"\n--- Sample card with image URLs ---")
    sample = next((c for c in cards if c.get("attack")), cards[0])
    print(json.dumps(sample, indent=2, ensure_ascii=False))
    
    # Download images if requested
    if do_download:
        print(f"\n📥 Downloading {len(cards)} card images...")
        download_images(cards, output_dir)

if __name__ == "__main__":
    main()