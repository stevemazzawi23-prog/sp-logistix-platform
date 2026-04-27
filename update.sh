#!/bin/bash
# ============================================================
# Script de mise à jour - SP Logistix Portail
# Usage : bash /var/www/sp-logistix-platform/update.sh
# ============================================================

set -e

DEPLOY_DIR="/var/www/sp-logistix-platform"
APP_NAME="sp-logistix-portail"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   SP Logistix - Mise à jour du portail   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$DEPLOY_DIR"

# --- 1. Récupérer les derniers changements ---
echo "[1/4] Récupération des mises à jour depuis GitHub..."
git pull origin main
echo "      ✅ Code mis à jour"

# --- 2. Installer les nouvelles dépendances ---
echo "[2/4] Installation des dépendances..."
pnpm install --frozen-lockfile
echo "      ✅ Dépendances installées"

# --- 3. Compiler le projet ---
echo "[3/4] Compilation du projet..."
pnpm build
echo "      ✅ Compilation terminée"

# --- 4. Redémarrer le serveur ---
echo "[4/4] Redémarrage du serveur..."
pm2 restart "$APP_NAME"
sleep 2
pm2 status "$APP_NAME"
echo "      ✅ Serveur redémarré"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Mise à jour terminée avec succès !  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Portail accessible sur : https://portail.sp-logistix.com"
echo ""
