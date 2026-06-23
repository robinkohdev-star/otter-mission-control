#!/usr/bin/env tsx
/**
 * Mission Control Tasks Report - Daily 8AM
 * 1. Posts task list to Discord ssorder channel
 * 2. Triggers buildorder for in-progress tasks (to buildorder channel)
 */

import fs from "node:fs";
import path from "node:path";
import * as os from "node:os";
import { execSync } from "child_process";

const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace";
const TASKS_FILE = path.join(WORKSPACE_ROOT, "state/phase2-tasks.json");
const TRIGGERS_FILE = path.join(WORKSPACE_ROOT, "state/agent-triggers.json");

// Load .env files
const MISSION_ENV = path.join(WORKSPACE_ROOT, ".env.local");
const BUILDORDER_ENV = path.join(os.homedir(), "workspace/buildorder-agent/.env");

function loadEnvFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File doesn't exist
  }
}

loadEnvFile(MISSION_ENV);
loadEnvFile(BUILDORDER_ENV);



interface Task {
  id: string;
  title: string;
  status: "backlog" | "in-progress" | "done" | "unassigned";
  agent?: string;
  assignee?: string | null;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentTriggerState {
  agents: {
    buildorder: {
      lastRun: string | null;
      lastStatus: "idle" | "running" | "completed" | "failed";
      lastError: string | null;
    };
  };
}

function readTasks(): Task[] {
  try {
    const content = fs.readFileSync(TASKS_FILE, "utf8");
    return JSON.parse(content) as Task[];
  } catch (e) {
    console.error("Failed to read tasks:", e);
    return [];
  }
}

function readTriggers(): AgentTriggerState {
  try {
    const content = fs.readFileSync(TRIGGERS_FILE, "utf8");
    return JSON.parse(content) as AgentTriggerState;
  } catch (e) {
    return {
      agents: {
        buildorder: {
          lastRun: null,
          lastStatus: "idle",
          lastError: null
        }
      }
    };
  }
}

function writeTriggers(state: AgentTriggerState) {
  fs.writeFileSync(TRIGGERS_FILE, JSON.stringify(state, null, 2) + "\n");
}



function formatTasksForDiscord(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "📋 **Mission Control Tasks**\n\nNo tasks found.";
  }

  const byStatus: Record<string, Task[]> = {
    "in-progress": [],
    "backlog": [],
    "unassigned": [],
    "done": []
  };

  for (const task of tasks) {
    const status = task.status || "backlog";
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(task);
  }

  const lines: string[] = [
    "📋 **Mission Control Tasks**",
    `*Total: ${tasks.length} tasks*`,
    ""
  ];

  if (byStatus["in-progress"].length > 0) {
    lines.push("🔵 **In Progress**");
    for (const task of byStatus["in-progress"]) {
      lines.push(`• ${task.title}`);
      if (task.agent) lines.push(`  └ Agent: ${task.agent}`);
    }
    lines.push("");
  }

  if (byStatus["backlog"].length > 0) {
    lines.push("📋 **Backlog**");
    for (const task of byStatus["backlog"]) {
      lines.push(`• ${task.title}`);
    }
    lines.push("");
  }

  if (byStatus["unassigned"].length > 0) {
    lines.push("⚪ **Unassigned**");
    for (const task of byStatus["unassigned"]) {
      lines.push(`• ${task.title}`);
      if (task.details) {
        const shortDetail = task.details.length > 100 
          ? task.details.slice(0, 100) + "..." 
          : task.details;
        lines.push(`  └ ${shortDetail}`);
      }
    }
    lines.push("");
  }

  if (byStatus["done"].length > 0) {
    lines.push(`✅ **Done** (${byStatus["done"].length})`);
    lines.push("");
  }

  return lines.join("\n");
}

async function postToDiscord(webhookUrl: string, content: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  }
}

async function main() {
  const tasks = readTasks();
  const triggers = readTriggers();
  
  const ssorderWebhook = process.env.SSORDER_DISCORD_WEBHOOK;
  const buildorderWebhook = process.env.DISCORD_WEBHOOK_BUILD;
  
  if (!ssorderWebhook) {
    console.error("Error: SSORDER_DISCORD_WEBHOOK not found");
    process.exit(1);
  }
  
  if (!buildorderWebhook) {
    console.error("Error: DISCORD_WEBHOOK_BUILD not found");
    process.exit(1);
  }

  // 1. Post tasks summary to ssorder channel
  const summaryMessage = formatTasksForDiscord(tasks);
  console.log("=== Tasks Summary (to ssorder) ===");
  console.log(summaryMessage);
  console.log("==================================");
  
  await postToDiscord(ssorderWebhook, summaryMessage);
  console.log("✅ Posted tasks summary to ssorder channel\n");

  // 2. Trigger buildorder for in-progress tasks
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  
  if (inProgressTasks.length === 0) {
    console.log("No in-progress tasks. Buildorder not triggered.");
    return;
  }

  console.log(`Found ${inProgressTasks.length} in-progress task(s). Running buildorder...`);

  // Ensure sandboxed Ollama is running
  try {
    execSync("curl -s http://127.0.0.1:11435/api/tags > /dev/null 2>&1 || ~/sandbox/ollama/start-sandbox.sh", 
      { timeout: 35000 });
  } catch (e) {
    console.log("⚠️  Could not start sandboxed Ollama, proceeding anyway...");
  }

  // Run buildorder agent directly
  try {
    const output = execSync(
      "bash -c 'cd ~/workspace/buildorder-agent && source venv/bin/activate && python3 agent.py'",
      { encoding: "utf8", timeout: 300000 } // 5 minute timeout
    );
    console.log("✅ Buildorder completed:\n", output);
    
    // Update trigger state
    triggers.agents.buildorder.lastRun = new Date().toISOString();
    triggers.agents.buildorder.lastStatus = "completed";
    triggers.agents.buildorder.lastError = null;
    writeTriggers(triggers);
    
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`❌ Buildorder failed:`, errorMsg);
    if (err?.stdout) console.log("Output:", err.stdout);
    if (err?.stderr) console.error("Error:", err.stderr);
    
    triggers.agents.buildorder.lastRun = new Date().toISOString();
    triggers.agents.buildorder.lastStatus = "failed";
    triggers.agents.buildorder.lastError = errorMsg;
    writeTriggers(triggers);
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
