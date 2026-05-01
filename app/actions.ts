"use server";

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appendControlEvent, readPhase2Tasks, sanitizeCommandOutput, writePhase2Tasks, type Phase2TaskStatus } from "@/lib/phase2-control";
import { triggerAgent } from "@/lib/agent-triggers";

const taskStatuses: Phase2TaskStatus[] = ["backlog", "in-progress", "done"];
const allowedSystemActions = {
  "openclaw-status": { label: "OpenClaw status", command: "openclaw", args: ["status", "--no-color"], timeout: 45_000 },
  "gateway-status": { label: "Gateway status", command: "openclaw", args: ["gateway", "status", "--no-color"], timeout: 15_000 },
  "git-status": { label: "Workspace git status", command: "git", args: ["status", "--short", "--branch"], timeout: 8_000 },
  "openclaw-health": { label: "OpenClaw health", command: "openclaw", args: ["health", "--no-color"], timeout: 20_000 },
} as const;

function cleanText(value: FormDataEntryValue | null, max = 180) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeStatus(value: FormDataEntryValue | null): Phase2TaskStatus {
  const status = cleanText(value, 40) as Phase2TaskStatus;
  return taskStatuses.includes(status) ? status : "backlog";
}

function finish(path: string, message: string) {
  revalidatePath("/tasks");
  revalidatePath("/control");
  revalidatePath("/projects");
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

export async function createPhase2Task(formData: FormData) {
  const title = cleanText(formData.get("title"));
  const agent = cleanText(formData.get("agent"), 80);
  const status = safeStatus(formData.get("status"));
  if (!title || title.length < 3) finish("/control", "Task title is too short.");

  const now = new Date().toISOString();
  const tasks = readPhase2Tasks();
  tasks.unshift({ id: randomUUID(), title, agent: agent || undefined, status, createdAt: now, updatedAt: now });
  writePhase2Tasks(tasks.slice(0, 100));
  finish("/control", "Task created.");
}

export async function updatePhase2TaskStatus(formData: FormData) {
  const id = cleanText(formData.get("id"), 80);
  const status = safeStatus(formData.get("status"));
  const now = new Date().toISOString();
  const tasks = readPhase2Tasks();
  const next = tasks.map((task) => task.id === id ? { ...task, status, updatedAt: now } : task);
  writePhase2Tasks(next);
  finish("/tasks", "Task status updated.");
}

export async function runSafeSystemAction(formData: FormData) {
  const key = cleanText(formData.get("action"), 80) as keyof typeof allowedSystemActions;
  const item = allowedSystemActions[key];
  if (!item) finish("/control", "Blocked: action is not allowlisted.");

  let status: "ok" | "failed" = "ok";
  let output = "";
  try {
    output = execFileSync(item.command, item.args, {
      cwd: process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace",
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: item.timeout,
      maxBuffer: 240_000,
    });
  } catch (error) {
    status = "failed";
    output = error instanceof Error ? error.message : String(error);
  }

  appendControlEvent({
    id: randomUUID(),
    action: item.label,
    status,
    createdAt: new Date().toISOString(),
    summary: status === "ok" ? `${item.label} completed.` : `${item.label} failed.`,
    output: sanitizeCommandOutput(output).slice(0, 9000),
  });
  finish("/control", `${item.label}: ${status}`);
}

export async function runAgentTrigger(formData: FormData) {
  const agentId = cleanText(formData.get("agentId"), 80);
  const confirmed = cleanText(formData.get("confirmed")) === "true";
  
  // Get agent config to check if destructive
  const { AGENTS } = await import("@/lib/agent-triggers");
  const agent = AGENTS.find(a => a.id === agentId);
  
  if (!agent) {
    return finish("/agents", "Agent not found.");
  }
  
  // Require confirmation for destructive agents
  if (agent.destructive && !confirmed) {
    return finish("/agents", "Confirmation required for this agent.");
  }
  
  const result = await triggerAgent(agentId);
  
  if (!result.success) {
    finish("/agents", `Failed: ${result.error}`);
  }
  
  revalidatePath("/agents");
  redirect("/agents");
}
