#!/bin/bash
# setup-vps.sh — Jednorazowy setup ClawCard na świeżej VMce Hetzner (Ubuntu 24.04)
# Uruchom jako root: bash setup-vps.sh
# Repo: https://github.com/qoopercodding/clawcard

set -e
echo "=== ClawCard VPS Setup ==="

# ── 1. System ────────────────────────────────────────────────────────────────
apt update && apt upgrade -y
apt install -y git curl nginx python3 python3-pip python3-venv

# ── 2. Node.js 20 ────────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

# ── 3. Repo ───────────────────────────────────────────────────────────────────
mkdir -p /var/www
cd /var/www
if [ -d "clawcard" ]; then
    echo "Repo already exists, pulling..."
    cd clawcard && git pull
else
    git clone https://github.com/qoopercodding/clawcard.git
    cd clawcard
fi

# ── 4. Builder Tool ───────────────────────────────────────────────────────────
cd /var/www/clawcard/wildfrost-poc/clawcard-builder
npm install
echo "Builder Tool deps installed"

# ── 5. pm2 (auto-restart Builder Tool) ───────────────────────────────────────
npm install -g pm2
pm2 delete clawcard-builder 2>/dev/null || true
pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" --name clawcard-builder
pm2 save
pm2 startup | tail -1 | bash   # generuje i uruchamia systemd unit

# ── 6. nginx reverse proxy ────────────────────────────────────────────────────
cat > /etc/nginx/sites-available/clawcard << 'NGINX'
server {
    listen 80;
    server_name _;

    # Builder Tool (Vite dev mode — plugin działa)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/clawcard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "nginx OK — Builder Tool dostępny na http://46.62.231.237"

# ── 7. Claude Code CLI ────────────────────────────────────────────────────────
npm install -g @anthropic-ai/claude-code
echo "Claude Code: $(claude --version 2>/dev/null || echo 'zainstalowany, wymaga ANTHROPIC_API_KEY')"

# ── 8. Git config (dla auto-push z Vite plugin) ───────────────────────────────
cd /var/www/clawcard
git config --global user.email "clawcard-vps@clawcard.dev"
git config --global user.name "ClawCard VPS"
git config --global credential.helper store
echo "Git config OK — pierwsze 'git push' zapyta o token, potem cache"

# ── 9. Python venv (dla scraperów) ───────────────────────────────────────────
cd /var/www/clawcard
python3 -m venv .venv
.venv/bin/pip install -q requests beautifulsoup4 gspread google-auth
echo "Python venv OK"

# ── 10. Firewall ──────────────────────────────────────────────────────────────
ufw allow 22    # SSH
ufw allow 80    # nginx
ufw allow 8900  # ClawMetry
ufw --force enable
echo "Firewall OK"

# ── STATUS ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Setup zakończony ==="
echo ""
echo "Builder Tool:  http://46.62.231.237"
echo "ClawMetry:     http://46.62.231.237:8900"
echo ""
echo "Następne kroki:"
echo "  1. Wklej ANTHROPIC_API_KEY do ~/.bashrc:"
echo "     echo 'export ANTHROPIC_API_KEY=\"sk-ant-...\"' >> ~/.bashrc"
echo "     source ~/.bashrc"
echo ""
echo "  2. Napraw BUG-003 (OpenClaw gateway):"
echo "     systemctl enable openclaw-gateway"
echo "     systemctl start openclaw-gateway"
echo ""
echo "  3. Wgraj Google Sheets credentials:"
echo "     scp clawcard-4078b0eed30a.json root@46.62.231.237:/var/www/clawcard/secrets/"
echo ""
echo "  4. Uruchom Claude Code w kontekście repo:"
echo "     cd /var/www/clawcard && claude"
echo ""
pm2 status
