import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { readControlEvents, sanitizeCommandOutput } from "@/lib/phase2-control";
import { getDashboardData } from "@/lib/openclaw-data";

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || "/home/rk/.openclaw";
const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace";

export type SessionSummary = {
  key: string;
  sessionId: string;
  updatedAt: string;
  channel: string;
  chatType: string;
  abortedLastRun: boolean;
  sessionFile?: string;
};

export type OperationsSnapshot = {
  generatedAt: string;
  health: ReturnType<typeof getDashboardData>["health"];
  agents: ReturnType<typeof getDashboardData>["agents"];
  sessions: SessionSummary[];
  logs: { path: string; lines: string[]; updatedAt?: string };
  events: ReturnType<typeof readControlEvents>;
  gateway: { ok: boolean; summary: string };
};

function safeRead(filePath: string) {
  try { return fs.readFileSync(filePath, "utf8"); } catch { return ""; }
}

function safeStat(filePath: string) {
  try { return fs.statSync(filePath); } catch { return null; }
}

function readSessions(): SessionSummary[] {
  const filePath = path.join(OPENCLAW_HOME, "agents", "main", "sessions", "sessions.json");
  try {
    const raw = JSON.parse(safeRead(filePath)) as Record<string, any>;
    return Object.entries(raw).map(([key, value]) => ({
      key,
      sessionId: String(value.sessionId || ""),
      updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : "",
      channel: String(value.lastChannel || value.deliveryContext?.channel || "local"),
      chatType: String(value.chatType || "unknown"),
      abortedLastRun: Boolean(value.abortedLastRun),
      sessionFile: value.sessionFile ? String(value.sessionFile).replace(OPENCLAW_HOME, "~/.openclaw") : undefined,
    })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12);
  } catch {
    return [];
  }
}

function latestGatewayLog() {
  const logDir = "/tmp/openclaw";
  let files: string[] = [];
  try {
    files = fs.readdirSync(logDir).filter((name) => /^openclaw-.*\.log$/.test(name)).map((name) => path.join(logDir, name));
  } catch {}
  const latest = files.sort((a, b) => (safeStat(b)?.mtimeMs || 0) - (safeStat(a)?.mtimeMs || 0))[0];
  if (!latest) return { path: `${logDir}/openclaw-*.log`, lines: [] };
  const lines = sanitizeCommandOutput(safeRead(latest)).split(/\r?\n/).filter(Boolean).slice(-120);
  return { path: latest, lines, updatedAt: safeStat(latest)?.mtime.toISOString() };
}

function gatewaySummary() {
  try {
    const output = execFileSync("openclaw", ["gateway", "status", "--no-color"], {
      cwd: WORKSPACE_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
      maxBuffer: 80_000,
    });
    const ok = /Connectivity probe:\s*ok|Runtime:\s*running/i.test(output);
    const summary = output.split(/\r?\n/).filter((line) => /Runtime:|Connectivity probe:|Dashboard:|Gateway:/.test(line)).slice(0, 5).join("\n") || "Gateway status returned.";
    return { ok, summary: sanitizeCommandOutput(summary) };
  } catch (error) {
    return { ok: false, summary: error instanceof Error ? error.message : String(error) };
  }
}

export function getOperationsSnapshot(): OperationsSnapshot {
  const data = getDashboardData();
  return {
    generatedAt: new Date().toISOString(),
    health: data.health,
    agents: data.agents,
    sessions: readSessions(),
    logs: latestGatewayLog(),
    events: readControlEvents().slice(0, 8),
    gateway: gatewaySummary(),
  };
}
