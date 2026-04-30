import fs from "node:fs";
import path from "node:path";

export const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace";
const STATE_DIR = path.join(WORKSPACE_ROOT, "state");
const TASKS_FILE = path.join(STATE_DIR, "phase2-tasks.json");
const EVENTS_FILE = path.join(STATE_DIR, "phase2-control-events.json");

export type Phase2TaskStatus = "backlog" | "in-progress" | "done";

export type Phase2Task = {
  id: string;
  title: string;
  status: Phase2TaskStatus;
  agent?: string;
  createdAt: string;
  updatedAt: string;
};

export type ControlEvent = {
  id: string;
  action: string;
  status: "ok" | "failed";
  createdAt: string;
  summary: string;
  output: string;
};

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T) {
  ensureStateDir();
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function readPhase2Tasks() {
  return readJson<Phase2Task[]>(TASKS_FILE, []);
}

export function writePhase2Tasks(tasks: Phase2Task[]) {
  writeJson(TASKS_FILE, tasks);
}

export function readControlEvents() {
  return readJson<ControlEvent[]>(EVENTS_FILE, []);
}

export function appendControlEvent(event: ControlEvent) {
  const events = [event, ...readControlEvents()].slice(0, 40);
  writeJson(EVENTS_FILE, events);
}
