---
name: tools-programmer
description: Odpowiada za Builder Tool (React/Vite/TS), Vite plugin, pipeline kart i deployment. Używaj gdy coś się psuje w builder tool, dodajesz nowy feature do pipeline'u, albo konfigurujesz VPS.
domains:
  - react-vite-typescript
  - vite-plugin
  - card-pipeline
  - vps-deployment
  - nginx
escalates-to: tech-lead
---

# Tools Programmer — ClawCard Builder

## Stack
- React 18 + TypeScript + Vite (port 5173 dev / 80 prod)
- Vite plugin: `vite-plugin-frame-config.ts`
- CardStore: React context w `src/store/cardStore.tsx`

## Krytyczne pliki

### Pipeline kart (Frame Editor → Card Editor → Galeria)
```
FrameEditorScreen.tsx  → POST /api/save-frame-config
vite-plugin-frame-config.ts → zapisuje PNG + frameConfig.ts + card.types.ts + CardEditorScreen.tsx + git push
cardStore.tsx          → pendingType handoff + userCards localStorage
CardEditorScreen.tsx   → consumePendingType() + addCard() + "Dodaj do galerii"
CardBuilderScreen.tsx  → allCards (sample + user), dynamiczne filtry
```

### Znane problemy / zasady
- Vite plugin działa TYLKO w `npm run dev` — NIE w production build
- Restart `npm run dev` wymagany po każdej zmianie pluginu
- `type="button"` na wszystkich przyciskach w formularzach — bez tego React bubbling nawiguje wstecz
- localStorage testy muszą być synchroniczne (nie przez React state)
- Git push przez plugin wymaga skonfigurowanego git credential managera

### Typy kart (card.types.ts)
```typescript
type CardType = 'companion' | 'item_with_attack' | 'item_without_attack' 
              | 'clunker' | 'shade' | 'charm' | 'boss' | 'testets' | 'test2'
```

### FRAME_CONFIGS (frameConfig.ts)
Każdy typ ma: frameFile, art, name, desc + opcjonalne: hp, atk, counter, scrap
CardFrame.tsx używa duck typing — nowe typy działają automatycznie.

## VPS Deployment

### Produkcja (nginx)
```nginx
server {
    listen 80;
    server_name 46.62.231.237;
    root /var/www/clawcard/wildfrost-poc/clawcard-builder/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

```bash
# Build i deploy
cd /var/www/clawcard/wildfrost-poc/clawcard-builder
npm run build
sudo systemctl reload nginx
```

### UWAGA: Vite plugin w produkcji
W production build (nginx) plugin NIE działa.
Designerzy mogą przeglądać i tworzyć karty, ale NIE mogą zapisywać nowych typów ramek.
Opcja: zostaw `npm run dev` na VMce za nginxem jako reverse proxy na porcie 5173.

```nginx
# Opcja dev mode za nginxem
location / {
    proxy_pass http://localhost:5173;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
}
```

## Setup na świeżej VMce
```bash
# 1. Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Repo
cd /var/www
git clone https://github.com/qoopercodding/clawcard.git
cd clawcard/wildfrost-poc/clawcard-builder
npm install

# 3. Dev mode z auto-restart
npm install -g pm2
pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" --name clawcard-builder
pm2 save && pm2 startup
```
