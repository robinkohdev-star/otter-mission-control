#!/usr/bin/env tsx
/**
 * BuildOrder Auto-Trigger - Automatically triggers buildorder for in-progress tasks
 * Respects 5-minute cooldown between triggers
 * Run via: tsx scripts/buildorder-auto-trigger.ts
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace";
const TASKS_FILE = path.join(WORKSPACE_ROOT, "state/phase2-tasks.json");
const TRIGGERS_FILE = path.join(WORKSPACE_ROOT, "state/agent-triggers.json");

// 5 minute cooldown in milliseconds
const COOLDOWN_MS = 5 * 60 * 1000;

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

function canTrigger(state: AgentTriggerState): boolean {
  const lastRun = state.agents.buildorder.lastRun;
  if (!lastRun) return true;
  
  const lastRunTime = new Date(lastRun).getTime();
  const now = Date.now();
  const timeSinceLastRun = now - lastRunTime;
  
  return timeSinceLastRun >= COOLDOWN_MS;
}

function getTimeUntilNextTrigger(state: AgentTriggerState): number {
  const lastRun = state.agents.buildorder.lastRun;
  if (!lastRun) return 0;
  
  const lastRunTime = new Date(lastRun).getTime();
  const nextTriggerTime = lastRunTime + COOLDOWN_MS;
  const remaining = nextTriggerTime - Date.now();
  
  return Math.max(0, remaining);
}

async function triggerBuildOrderDiscord(taskTitle: string): Promise<void> {
  // Load Discord webhook from .env.local
  const envPath = path.join(WORKSPACE_ROOT, ".env.local");
  let webhookUrl: string | undefined;
  
  try {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("SSORDER_DISCORD_WEBHOOK=")) {
        webhookUrl = trimmed.slice("SSORDER_DISCORD_WEBHOOK=".length).trim();
        break;
      }
    }
  } catch {
    throw new Error("Could not read .env.local for webhook URL");
  }
  
  if (!webhookUrl) {
    throw new Error("SSORDER_DISCORD_WEBHOOK not found in .env.local");
  }

  const message = `buildorder @buildorder Work on task: "${taskTitle}"`;
  
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  }

  console.log(`Triggered buildorder for task: "${taskTitle}"`);
}

async function main() {
  const tasks = readTasks();
  const triggers = readTriggers();
  
  // Find in-progress tasks
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  
  if (inProgressTasks.length === 0) {
    console.log("No in-progress tasks found.");
    return;
  }
  
  console.log(`Found ${inProgressTasks.length} in-progress task(s):`);
  for (const task of inProgressTasks) {
    console.log(`  - ${task.title}`);
  }
  
  // Check cooldown
  if (!canTrigger(triggers)) {
    const remainingMs = getTimeUntilNextTrigger(triggers);
    const remainingMin = Math.ceil(remainingMs / 60000);
    console.log(`Cooldown active. Next trigger available in ${remainingMin} minute(s).`);
    console.log(`Last run: ${triggers.agents.buildorder.lastRun}`);
    return;
  }
  
  // Trigger for the first in-progress task (or all, depending on preference)
  // For now, trigger for each in-progress task
  for (const task of inProgressTasks) {
    try {
      await triggerBuildOrderDiscord(task.title);
      
      // Update trigger state
      triggers.agents.buildorder.lastRun = new Date().toISOString();
      triggers.agents.buildorder.lastStatus = "running";
      triggers.agents.buildorder.lastError = null;
      writeTriggers(triggers);
      
      // Only trigger one at a time to avoid overwhelming the agent
      console.log("Triggered one task. Waiting for cooldown before next...");
      break;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to trigger buildorder for "${task.title}":`, errorMsg);
      
      triggers.agents.buildorder.lastError = errorMsg;
      writeTriggers(triggers);
    }
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
