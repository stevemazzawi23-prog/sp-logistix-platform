#!/bin/bash
# ============================================================
# Script de collecte Gmail - SP Logistix
# Exécuté automatiquement toutes les heures via cron
# Cron : 0 * * * * bash /var/www/sp-logistix-platform/collect-gmail.sh
# ============================================================

DEPLOY_DIR="/var/www/sp-logistix-platform"
LOG_FILE="/var/log/sp-logistix-gmail.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Démarrage collecte Gmail..." >> "$LOG_FILE"

cd "$DEPLOY_DIR"

# Charger les variables d'environnement
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Exécuter le collecteur Gmail via Node.js
node -e "
require('dotenv').config();
const { collectGmailTickets } = require('./dist/server/gmailCollector.js');
collectGmailTickets().then(stats => {
  console.log('Résultat:', JSON.stringify(stats));
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
" >> "$LOG_FILE" 2>&1

echo "[$TIMESTAMP] Collecte terminée" >> "$LOG_FILE"
