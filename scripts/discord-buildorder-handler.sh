#!/bin/bash
# Discord BuildOrder Message Handler
# Called by OpenClaw when "buildorder" is detected in Discord messages
# Usage: ./discord-buildorder-handler.sh "<message_content>" "<channel_id>" "<user>"

MESSAGE="$1"
CHANNEL_ID="$2"
USER="$3"
LOGFILE="/home/rk/.openclaw/workspace/main_workspace/logs/buildorder-discord.log"
AGENT_DIR="$HOME/workspace/buildorder-agent"
LOCKFILE="/tmp/buildorder-discord.lock"

echo "[$(date)] Discord trigger from $USER in $CHANNEL_ID: $MESSAGE" >> "$LOGFILE"

# Check cooldown
COOLDOWN_FILE="/tmp/buildorder-discord-cooldown"
if [ -f "$COOLDOWN_FILE" ]; then
    LAST_RUN=$(cat "$COOLDOWN_FILE")
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_RUN))
    if [ $DIFF -lt 300 ]; then
        echo "[$(date)] Cooldown active (${DIFF}s), skipping" >> "$LOGFILE"
        exit 0
    fi
fi

# Update state
STATE_FILE="/home/rk/.openclaw/workspace/main_workspace/state/agent-triggers.json"
if [ -f "$STATE_FILE" ]; then
    TMP=$(mktemp)
    jq '.agents.buildorder.lastRun = "'"$(date -Iseconds)"'" | .agents.buildorder.lastStatus = "running"' "$STATE_FILE" > "$TMP"
    mv "$TMP" "$STATE_FILE"
fi

# Acknowledge in Discord via webhook (optional - agent will post full results)
WEBHOOK_URL="https://discord.com/api/webhooks/1500323267079045170/1H2OvDpEZvC8mWRUepFdC0he6cCjwtuvSZZq9MvtFoJqmB9b3DnxAgJ4ebyzI9VcKyc9"
curl -s -H "Content-Type: application/json" -X POST \
  -d "{\"content\":\"🔨 BuildOrder triggered by $USER. Starting build process...\"}" \
  "$WEBHOOK_URL" >> "$LOGFILE" 2>&1

# Run agent
echo "[$(date)] Starting agent..." >> "$LOGFILE"
date +%s > "$COOLDOWN_FILE"

cd "$AGENT_DIR" || exit 1

if ./venv/bin/python agent.py >> "$LOGFILE" 2>&1; then
    echo "[$(date)] Agent completed successfully" >> "$LOGFILE"
    if [ -f "$STATE_FILE" ]; then
        TMP=$(mktemp)
        jq '.agents.buildorder.lastStatus = "success"' "$STATE_FILE" > "$TMP"
        mv "$TMP" "$STATE_FILE"
    fi
else
    echo "[$(date)] Agent failed" >> "$LOGFILE"
    if [ -f "$STATE_FILE" ]; then
        TMP=$(mktemp)
        jq '.agents.buildorder.lastStatus = "failed"' "$STATE_FILE" > "$TMP"
        mv "$TMP" "$STATE_FILE"
    fi
fi

echo "[$(date)] Handler completed" >> "$LOGFILE"