#!/bin/bash
# BuildOrder Discord Trigger
# Detects "buildorder" in Discord messages and triggers the agent

LOGFILE="/home/rk/.openclaw/workspace/main_workspace/logs/buildorder-trigger.log"
AGENT_DIR="$HOME/workspace/buildorder-agent"
LOCKFILE="/tmp/buildorder-running.lock"

echo "[$(date)] BuildOrder trigger check started" >> "$LOGFILE"

# Check if agent is already running
if [ -f "$LOCKFILE" ]; then
    PID=$(cat "$LOCKFILE" 2>/dev/null)
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[$(date)] Agent already running (PID: $PID), skipping" >> "$LOGFILE"
        exit 0
    else
        rm -f "$LOCKFILE"
    fi
fi

# Check cooldown (5 minutes)
COOLDOWN_FILE="/tmp/buildorder-last-run"
if [ -f "$COOLDOWN_FILE" ]; then
    LAST_RUN=$(cat "$COOLDOWN_FILE")
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_RUN))
    if [ $DIFF -lt 300 ]; then
        echo "[$(date)] Cooldown active (${DIFF}s < 300s), skipping" >> "$LOGFILE"
        exit 0
    fi
fi

# Update trigger state
STATE_FILE="/home/rk/.openclaw/workspace/main_workspace/state/agent-triggers.json"
if [ -f "$STATE_FILE" ]; then
    TMP=$(mktemp)
    jq '.agents.buildorder.lastRun = "'"$(date -Iseconds)"'" | .agents.buildorder.lastStatus = "running"' "$STATE_FILE" > "$TMP"
    mv "$TMP" "$STATE_FILE"
fi

# Run the agent
echo "[$(date)] Starting BuildOrder agent..." >> "$LOGFILE"
echo $$ > "$LOCKFILE"
date +%s > "$COOLDOWN_FILE"

cd "$AGENT_DIR" || exit 1

# Run agent and capture output
if ./venv/bin/python agent.py >> "$LOGFILE" 2>&1; then
    STATUS="success"
    echo "[$(date)] Agent completed successfully" >> "$LOGFILE"
else
    STATUS="failed"
    echo "[$(date)] Agent failed with exit code $?" >> "$LOGFILE"
fi

# Update state
if [ -f "$STATE_FILE" ]; then
    TMP=$(mktemp)
    jq '.agents.buildorder.lastStatus = "'"$STATUS"'"' "$STATE_FILE" > "$TMP"
    mv "$TMP" "$STATE_FILE"
fi

rm -f "$LOCKFILE"
echo "[$(date)] BuildOrder trigger check completed" >> "$LOGFILE"