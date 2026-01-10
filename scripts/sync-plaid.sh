#!/bin/bash

# Plaid Sync Cron Script
# This script calls the sync-all-plaid endpoint to sync transactions and balances
# for all connected Plaid accounts.
#
# Usage:
#   CRON_SECRET=your-secret APP_URL=https://your-app.com ./sync-plaid.sh
#
# Crontab example (every 6 hours):
#   0 */6 * * * CRON_SECRET=your-secret APP_URL=https://your-app.com /path/to/sync-plaid.sh >> /var/log/plaid-sync.log 2>&1

set -e

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
    echo "[$(date)] ERROR: CRON_SECRET environment variable is required"
    exit 1
fi

ENDPOINT="${APP_URL}/api/cron/sync-all-plaid"

echo "[$(date)] Starting Plaid sync..."
echo "[$(date)] Endpoint: ${ENDPOINT}"

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json")

# Extract response body and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "[$(date)] Sync completed successfully"
    echo "[$(date)] Response: ${BODY}"
else
    echo "[$(date)] ERROR: Sync failed with status ${HTTP_CODE}"
    echo "[$(date)] Response: ${BODY}"
    exit 1
fi
