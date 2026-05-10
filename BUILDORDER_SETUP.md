# BuildOrder Discord Integration

## Overview
BuildOrder agent is now configured to be triggered from Discord via OpenClaw bridge (Option 2).

## How It Works

### Trigger Flow
1. **You say** `buildorder` or `@buildorder <task description>` in any configured Discord channel
2. **OpenClaw detects** the keyword in the Discord message
3. **MainOrder spawns** the buildorder trigger handler
4. **Handler runs** `~/workspace/buildorder-agent/agent.py`
5. **Agent executes**:
   - Fetches tasks from `state/phase2-tasks.json`
   - Plans implementation (template-based)
   - Writes code
   - Creates git branch `buildorder/<feature>`
   - Commits and pushes to GitHub
6. **Results posted** to Discord via webhook

### Files Created
- `scripts/buildorder-trigger.sh` - Cron-friendly trigger script
- `scripts/discord-buildorder-handler.sh` - Discord message handler
- `logs/buildorder-discord.log` - Execution logs
- `logs/buildorder-trigger.log` - Trigger logs

### State Tracking
- `state/agent-triggers.json` - Tracks last run, status, errors
- Cooldown: 5 minutes between triggers

### Discord Channels
- Input: Any configured Discord guild/channel (set in `openclaw.json`)
- Output: `#buildorder` via webhook `DISCORD_WEBHOOK_BUILD`

## Usage Examples

```
# Simple trigger
buildorder

# With context
@buildorder implement user authentication

# With specific task
buildorder: fix the login bug from task #5
```

## Monitoring

Check status:
```bash
cat state/agent-triggers.json | jq '.agents.buildorder'
```

View logs:
```bash
tail -f logs/buildorder-discord.log
tail -f logs/buildorder-trigger.log
```

Manual trigger (for testing):
```bash
./scripts/discord-buildorder-handler.sh "test message" "123" "user"
```

## GitHub Integration

The agent will:
1. Create branches: `buildorder/<feature-name>`
2. Auto-commit with descriptive messages
3. Push to `robinkohdev-star/buildorder-agent`
4. Post branch/commit links to Discord

## Troubleshooting

**Agent not triggering:**
- Check Discord message is being received by OpenClaw
- Verify `state/agent-triggers.json` exists
- Check cooldown hasn't expired (5 min)

**Agent fails:**
- Check `logs/buildorder-discord.log` for errors
- Verify `~/workspace/buildorder-agent/.env` has correct tokens
- Ensure git credentials are configured

**No Discord output:**
- Verify `DISCORD_WEBHOOK_BUILD` in `.env`
- Check webhook URL is valid
- Test webhook manually with curl

## Architecture

```
Discord Message
       ↓
OpenClaw Gateway
       ↓
MainOrder Agent (detects "buildorder")
       ↓
discord-buildorder-handler.sh
       ↓
agent.py (in ~/workspace/buildorder-agent)
       ↓
GitHub (branch, commit, push)
       ↓
Discord Webhook (results)
```

## Security

- Agent runs with user permissions (not root)
- Git operations use configured credentials
- Discord webhook is read-only (post only)
- 5-minute cooldown prevents spam
- State tracking prevents duplicate runs