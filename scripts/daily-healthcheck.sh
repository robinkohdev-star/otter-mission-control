#!/bin/bash
# Daily OpenClaw Healthcheck Script

LOGFILE="/home/rk/.openclaw/workspace/main_workspace/logs/daily-healthcheck.log"
WEBHOOK_URL="https://discord.com/api/webhooks/1500323396783833089/veQQbPJ4bmVhk23qCEl5Yth2xTn6yjepuJX9LNiOIKTsTwKcb__Pxv5CyVEbDVDe1uvk"
mkdir -p "$(dirname "$LOGFILE")"

# Use full path to openclaw (cron has minimal PATH)
OPENCLAW="/home/rk/.npm-global/bin/openclaw"

# Run checks and capture output
SECURITY_AUDIT=$($OPENCLAW security audit --deep 2>&1)
UPDATE_STATUS=$($OPENCLAW update status 2>&1)

# Count issues
CRITICAL_COUNT=$(echo "$SECURITY_AUDIT" | grep -c "^CRITICAL")
WARN_COUNT=$(echo "$SECURITY_AUDIT" | grep -c "^WARN")
UPDATE_LINE=$(echo "$UPDATE_STATUS" | grep -E "Update.*available" | head -1 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

# Generate summary section for log
SUMMARY=$(cat <<EOF
--- Summary ---
🔴 Critical: $CRITICAL_COUNT issues
🟡 Warnings: $WARN_COUNT issues
📦 $UPDATE_LINE
EOF
)

# Build full output for log file
OUTPUT=$(cat <<EOF
=== OpenClaw Daily Healthcheck ===
$(date)

$SUMMARY

--- Security Audit ---
$SECURITY_AUDIT

--- Update Status ---
$UPDATE_STATUS
EOF
)

# Save to log file
echo "$OUTPUT" > "$LOGFILE"

# Create summary message for Discord
SUMMARY_FILE="/tmp/discord_summary_$$.txt"
PAYLOAD_FILE="/tmp/discord_payload_$$.json"
cat > "$SUMMARY_FILE" <<EOF
📊 **Daily Healthcheck Summary** - $(date '+%Y-%m-%d %H:%M')

🔴 Critical: $CRITICAL_COUNT issues
🟡 Warnings: $WARN_COUNT issues  
📦 ${UPDATE_LINE:-"No updates available"}

Reply here for fixes or details.
EOF

# Send summary message using Python for proper JSON escaping
python3 -c "
import json
with open('$SUMMARY_FILE', 'r') as f:
    content = f.read()
with open('$PAYLOAD_FILE', 'w') as f:
    json.dump({'content': content}, f)
"

# Send summary and capture response
echo "Sending summary..."
curl -s -w "\nHTTP_CODE:%{http_code}" -H "Content-Type: application/json" -X POST -d "@$PAYLOAD_FILE" "$WEBHOOK_URL"
echo ""

rm -f "$SUMMARY_FILE" "$PAYLOAD_FILE"

# Wait a moment before sending file
sleep 1

# Send full log file
echo "Sending log file..."
curl -s -F "file1=@$LOGFILE;filename=healthcheck-$(date '+%Y%m%d').log" \
     "$WEBHOOK_URL"

echo "Healthcheck complete. Log saved to: $LOGFILE"
