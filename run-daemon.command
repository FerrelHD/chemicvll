#!/usr/bin/env bash

# Resolve the project root directory
cd "$(dirname "$0")"

clear
echo "========================================================"
echo "   Personal OS (chemicvll) - Local Daemon Bridge (macOS)"
echo "========================================================"
echo ""
echo "Connecting to Supabase Realtime Relay..."
echo "Once connected, you can start/stop dev servers directly"
echo "from https://chemicvll.vercel.app or localhost:3000!"
echo ""
echo "Press Ctrl+C anytime to close this daemon."
echo "========================================================"
echo ""

# Ensure node is in PATH (especially when double-clicked from Finder)
if ! command -v node >/dev/null 2>&1; then
  for p in /opt/homebrew/bin /usr/local/bin "$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -n 1)/bin" "$HOME/.volta/bin" "$HOME/.asdf/shims" "$HOME/.fnm/current/bin"; do
    if [ -x "$p/node" ]; then
      export PATH="$p:$PATH"
      break
    fi
  done
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js tidak ditemukan di PATH sistem."
  echo "Pastikan Node.js sudah terinstal di Mac Anda."
  read -p "Tekan Enter untuk keluar..."
  exit 1
fi

node local-daemon/daemon.js

