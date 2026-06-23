#!/bin/bash
# BuildOrder End-of-Day Push Script
# Checks for unpushed commits and pushes to GitHub
# Notifies Discord when complete

set -e

WORKSPACE_ROOT="/home/rk/.openclaw/workspace/main_workspace"
AGENT_DIR="/home/rk/workspace/buildorder-agent"
DISCORD_WEBHOOK=""

# Load webhook from .env
if [ -f "$AGENT_DIR/.env" ]; then
    DISCORD_WEBHOOK=$(grep DISCORD_WEBHOOK_BUILD "$AGENT_DIR/.env" | cut -d '=' -f2-)
fi

cd "$WORKSPACE_ROOT"

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if there are unpushed commits
UNPUSHED=$(git log origin/$BRANCH..$BRANCH --oneline 2>/dev/null || echo "")

if [ -z "$UNPUSHED" ]; then
    echo "[$(date)] No unpushed commits on $BRANCH"
    exit 0
fi

COMMIT_COUNT=$(echo "$UNPUSHED" | wc -l)
echo "[$(date)] Found $COMMIT_COUNT unpushed commit(s) on $BRANCH"

# Push to remote
if git push origin "$BRANCH"; then
    echo "[$(date)] Successfully pushed $COMMIT_COUNT commit(s) to origin/$BRANCH"
    
    # Notify Discord
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -s -X POST "$DISCORD_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"content\": \"📤 **BuildOrder EOD Push Complete**\\n\\nBranch: \`$BRANCH\`\\nCommits pushed: $COMMIT_COUNT\\n\\nChanges are now on GitHub.\"
            }" > /dev/null
        echo "[$(date)] Discord notification sent"
    fi
else
    echo "[$(date)] Push failed"
    
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -s -X POST "$DISCORD_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"content\": \"⚠️ **BuildOrder EOD Push Failed**\\n\\nBranch: \`$BRANCH\`\\nCheck logs for details.\"
            }" > /dev/null
    fi
    exit 1
fi
