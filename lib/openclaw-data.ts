import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync, type ExecFileSyncOptionsWithStringEncoding } from "node:child_process";
import { readPhase2Tasks } from "@/lib/phase2-control";

export const OPENCLAW_HOME = process.env.OPENCLAW_HOME || "/home/rk/.openclaw";
export const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace";
const MAX_READ_BYTES = 300_000;

type Accent = "pink" | "purple" | "red" | "blue" | "cyan";

type RegistryProject = {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  githubRepo?: string;
  sourcePaths: string[];
  nextMove: string;
};

type RegistryAgent = {
  id: string;
  name: string;
  role: string;
  mission: string;
  accent: Accent;
  statusLabel: "ACTIVE" | "OK" | "STANDBY" | "IDLE";
  sources: string[];
};

type Registry = {
  projectName: string;
  missionStatement: string;
  projects: RegistryProject[];
  crew: RegistryAgent[];
  screens: string[];
};

export type DocItem = {
  title: string;
  path: string;
  absolutePath: string;
  kind: string;
  excerpt: string;
  updatedAt: string;
  size: number;
  source: "workspace" | "openclaw";
};

export type MemoryEntry = {
  date: string;
  path: string;
  absolutePath: string;
  excerpt: string;
  bullets: string[];
  updatedAt: string;
};

export type TaskItem = {
  id: string;
  title: string;
  status: "backlog" | "in-progress" | "done";
  source: string;
  agent?: string;
  updatedAt?: string;
  rawStatus?: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  source: string;
  cadence: string;
  status: "scheduled" | "available" | "empty" | "unknown";
  details?: string;
};

export type AgentItem = RegistryAgent & {
  computedStatus: "working" | "ok" | "idle";
  lastSeen: string;
  taskCount: number;
};

export type GithubState = {
  authenticated: boolean;
  account?: string;
  repo?: string;
  branch?: string;
  remote?: string;
  openPrs: { number: number; title: string; url: string; branch: string }[];
  branches: string[];
};

export type DashboardData = {
  generatedAt: string;
  openclawHome: string;
  workspaceRoot: string;
  registry: Registry;
  docs: DocItem[];
  memory: MemoryEntry[];
  tasks: TaskItem[];
  schedules: ScheduleItem[];
  agents: AgentItem[];
  github: GithubState;
  config: {
    gatewayMode?: string;
    defaultWorkspace?: string;
    defaultModel?: string;
    enabledChannels: string[];
    enabledPlugins: string[];
    skills: string[];
    meta?: Record<string, unknown>;
  };
  projects: (RegistryProject & { docs: DocItem[]; tasks: TaskItem[]; memory: MemoryEntry[] })[];
  health: { label: string; value: string; tone: "good" | "warn" | "hot" }[];
};

function exists(filePath: string) {
  try { return fs.existsSync(filePath); } catch { return false; }
}

function safeStat(filePath: string) {
  try { return fs.statSync(filePath); } catch { return null; }
}

function safeRead(filePath: string) {
  const stat = safeStat(filePath);
  if (!stat?.isFile() || stat.size > MAX_READ_BYTES) return "";
  try { return fs.readFileSync(filePath, "utf8"); } catch { return ""; }
}

function safeJson<T>(filePath: string, fallback: T): T {
  try { return JSON.parse(safeRead(filePath)) as T; } catch { return fallback; }
}

function relFromKnownRoots(filePath: string) {
  if (filePath.startsWith(WORKSPACE_ROOT)) return path.relative(WORKSPACE_ROOT, filePath) || ".";
  if (filePath.startsWith(OPENCLAW_HOME)) return `~/.openclaw/${path.relative(OPENCLAW_HOME, filePath)}`;
  return filePath;
}

function walk(dir: string, depth = 4): string[] {
  if (depth < 0 || !exists(dir)) return [];
  const out: string[] = [];
  const skip = new Set(["node_modules", ".git", ".next", "dist", "build", ".openclaw/trash"]);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(WORKSPACE_ROOT, full);
    if ([...skip].some((s) => rel === s || rel.startsWith(`${s}${path.sep}`))) continue;
    if (entry.isDirectory()) out.push(...walk(full, depth - 1));
    else out.push(full);
  }
  return out;
}

function titleFromPath(filePath: string) {
  return path.basename(filePath).replace(/\.(md|mdx|txt|json|jsonl)$/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function cleanExcerpt(text: string, chars = 300) {
  return text.replace(/```[\s\S]*?```/g, " ").replace(/^#.*$/gm, " ").replace(/\s+/g, " ").trim().slice(0, chars);
}

function registry(): Registry {
  return safeJson<Registry>(path.join(WORKSPACE_ROOT, "state", "mission-control.json"), {
    projectName: "Otter Mission Control",
    missionStatement: "OpenClaw dashboard registry missing.",
    projects: [],
    crew: [],
    screens: [],
  });
}

function docs(): DocItem[] {
  const workspaceDocs = walk(WORKSPACE_ROOT, 5).filter((f) => /\.(md|mdx|txt|json)$/i.test(f));
  const openclawDocs = [
    path.join(OPENCLAW_HOME, "openclaw.json"),
    path.join(OPENCLAW_HOME, "logs", "config-health.json"),
    path.join(OPENCLAW_HOME, "logs", "config-audit.jsonl"),
    path.join(OPENCLAW_HOME, "agents", "main", "sessions", "sessions.json"),
  ].filter(exists);
  return [...workspaceDocs, ...openclawDocs].map((filePath) => {
    const content = safeRead(filePath);
    const stat = safeStat(filePath);
    return {
      title: titleFromPath(filePath),
      path: relFromKnownRoots(filePath),
      absolutePath: filePath,
      kind: path.extname(filePath).slice(1).toUpperCase() || "FILE",
      excerpt: cleanExcerpt(content),
      updatedAt: stat?.mtime.toISOString() || "",
      size: stat?.size || 0,
      source: filePath.startsWith(WORKSPACE_ROOT) ? "workspace" : "openclaw",
    } satisfies DocItem;
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function memory(): MemoryEntry[] {
  const files = [path.join(WORKSPACE_ROOT, "MEMORY.md"), ...walk(path.join(WORKSPACE_ROOT, "memory"), 2)].filter((f) => exists(f) && /\.md$/i.test(f));
  return files.map((filePath) => {
    const content = safeRead(filePath);
    const bullets = content.split(/\r?\n/).filter((line) => /^\s*[-*]\s+/.test(line)).map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).slice(0, 12);
    return {
      date: path.basename(filePath, ".md"),
      path: relFromKnownRoots(filePath),
      absolutePath: filePath,
      excerpt: cleanExcerpt(content, 520),
      bullets,
      updatedAt: safeStat(filePath)?.mtime.toISOString() || "",
    } satisfies MemoryEntry;
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function sqliteTasks(): TaskItem[] {
  const db = path.join(OPENCLAW_HOME, "tasks", "runs.sqlite");
  if (!exists(db)) return [];
  const py = `
import sqlite3, json
con=sqlite3.connect(${JSON.stringify(db)})
con.row_factory=sqlite3.Row
try:
  rows=[dict(r) for r in con.execute('select * from task_runs order by rowid desc limit 100')]
except Exception:
  rows=[]
print(json.dumps(rows, default=str))
`;
  try {
    const raw = execFileSync("python3", ["-c", py], { encoding: "utf8", timeout: 2500 });
    const rows = JSON.parse(raw) as Record<string, unknown>[];
    return rows.map((r, i) => {
      const statusRaw = String(r.status || "unknown");
      const status = /done|complete|success/i.test(statusRaw) ? "done" : /run|active|progress|pending/i.test(statusRaw) ? "in-progress" : "backlog";
      return { id: String(r.task_id || i), title: String(r.label || r.task || "Untitled task"), status, source: "~/.openclaw/tasks/runs.sqlite", agent: String(r.agent_id || ""), rawStatus: statusRaw } satisfies TaskItem;
    });
  } catch {
    return [];
  }
}

function phase2Tasks(): TaskItem[] {
  return readPhase2Tasks().map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    source: "state/phase2-tasks.json",
    agent: task.agent,
    updatedAt: task.updatedAt,
    rawStatus: "phase2-control",
  } satisfies TaskItem));
}

function inferredTasks(mem: MemoryEntry[]): TaskItem[] {
  const tasks: TaskItem[] = [];
  const statusOf = (line: string): TaskItem["status"] => /done|complete|committed|updated/i.test(line) ? "done" : /build|implement|wire|active|in-progress|next move/i.test(line) ? "in-progress" : "backlog";
  for (const m of mem) {
    const content = safeRead(m.absolutePath);
    content.split(/\r?\n/).forEach((line, idx) => {
      if (/\b(todo|task|next move|build|wire|implement|phase|commit|bootstrap|schedule)\b/i.test(line)) {
        const title = line.replace(/^\s*[-*]\s*(\[[ x]\])?\s*/i, "").trim();
        if (title.length > 8) tasks.push({ id: `${m.path}:${idx}`, title, status: statusOf(title), source: m.path, updatedAt: m.updatedAt });
      }
    });
  }
  return tasks.slice(0, 60);
}

function schedules(config: DashboardData["config"]): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  try {
    const cron = execSync("crontab -l", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 1200 });
    cron.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#")).forEach((line, i) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) items.push({ id: `cron-${i}`, title: parts.slice(5).join(" ").slice(0, 100), source: "user crontab", cadence: parts.slice(0, 5).join(" "), status: "scheduled", details: parts.slice(5).join(" ") });
    });
  } catch {}
  const hb = safeRead(path.join(WORKSPACE_ROOT, "HEARTBEAT.md"));
  const active = hb.replace(/^#.*$/gm, "").trim();
  items.push({ id: "heartbeat", title: active ? "Heartbeat checklist" : "Heartbeat available, no active checklist", source: "HEARTBEAT.md", cadence: "OpenClaw heartbeat poll", status: active ? "scheduled" : "empty", details: hb.trim().slice(0, 240) });
  items.push({ id: "openclaw-config", title: "OpenClaw local gateway", source: "~/.openclaw/openclaw.json", cadence: "always-on service", status: config.gatewayMode ? "available" : "unknown", details: `gateway=${config.gatewayMode || "unknown"}; channels=${config.enabledChannels.join(", ") || "none"}` });
  return items;
}

function configState() {
  const cfg = safeJson<Record<string, any>>(path.join(OPENCLAW_HOME, "openclaw.json"), {});
  return {
    gatewayMode: cfg.gateway?.mode,
    defaultWorkspace: cfg.agents?.defaults?.workspace,
    defaultModel: cfg.agents?.defaults?.model?.primary,
    enabledChannels: Object.entries(cfg.channels || {}).filter(([, v]: any) => v?.enabled).map(([k]) => k),
    enabledPlugins: Object.entries(cfg.plugins?.entries || {}).filter(([, v]: any) => v?.enabled).map(([k]) => k),
    skills: Object.keys(cfg.skills?.entries || {}),
    meta: cfg.meta,
  };
}

function github(): GithubState {
  const state: GithubState = { authenticated: false, openPrs: [], branches: [] };
  const quiet: ExecFileSyncOptionsWithStringEncoding = { cwd: WORKSPACE_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2500 };
  try {
    const auth = execFileSync("gh", ["auth", "status"], quiet);
    state.authenticated = /Logged in/.test(auth);
    state.account = auth.match(/account ([^\s]+)/)?.[1];
  } catch {}
  try { state.branch = execFileSync("git", ["branch", "--show-current"], quiet).trim(); } catch {}
  try { state.remote = execFileSync("git", ["remote", "get-url", "origin"], quiet).trim(); } catch {}
  try { state.branches = execFileSync("git", ["branch", "--format=%(refname:short)"], quiet).split(/\r?\n/).filter(Boolean).slice(0, 20); } catch {}
  if (state.authenticated && state.remote) {
    try {
      const prs = execFileSync("gh", ["pr", "list", "--json", "number,title,url,headRefName", "--limit", "20"], { ...quiet, timeout: 4000 });
      state.openPrs = (JSON.parse(prs) as any[]).map((p) => ({ number: p.number, title: p.title, url: p.url, branch: p.headRefName }));
    } catch {}
  }
  return state;
}

function agents(reg: Registry, taskList: TaskItem[]): AgentItem[] {
  return reg.crew.map((a) => {
    const count = taskList.filter((t) => t.agent?.toLowerCase() === a.id || t.title.toLowerCase().includes(a.id.replace("order", ""))).length;
    const computedStatus = a.statusLabel === "ACTIVE" || count > 0 ? "working" : a.statusLabel === "OK" ? "ok" : "idle";
    return { ...a, computedStatus, taskCount: count, lastSeen: computedStatus === "working" ? "now" : computedStatus === "ok" ? "healthy" : "standing by" } satisfies AgentItem;
  });
}

export function getDashboardData(): DashboardData {
  const reg = registry();
  const config = configState();
  const mem = memory();
  const taskList = [...phase2Tasks(), ...sqliteTasks(), ...inferredTasks(mem)];
  const docList = docs();
  const scheduleList = schedules(config);
  const gh = github();
  const agentList = agents(reg, taskList);
  const projects = reg.projects.map((p) => {
    const needles = [p.name, p.id, ...p.sourcePaths].map((s) => s.toLowerCase());
    return {
      ...p,
      docs: docList.filter((d) => needles.some((n) => d.path.toLowerCase().includes(n) || d.excerpt.toLowerCase().includes(n))).slice(0, 8),
      tasks: taskList.filter((t) => needles.some((n) => t.title.toLowerCase().includes(n) || t.source.toLowerCase().includes(n))).slice(0, 10),
      memory: mem.filter((m) => needles.some((n) => m.excerpt.toLowerCase().includes(n) || m.path.toLowerCase().includes(n))).slice(0, 5),
    };
  });
  const health = [
    { label: "Workspace docs", value: String(docList.filter((d) => d.source === "workspace").length), tone: "good" as const },
    { label: "Task runs", value: String(sqliteTasks().length), tone: taskList.length ? "good" as const : "warn" as const },
    { label: "Memory logs", value: String(mem.length), tone: mem.length ? "good" as const : "warn" as const },
    { label: "GitHub", value: gh.authenticated ? "linked" : "offline", tone: gh.authenticated ? "good" as const : "warn" as const },
    { label: "Crew active", value: `${agentList.filter((a) => a.computedStatus === "working").length}/${agentList.length}`, tone: "hot" as const },
  ];
  return { generatedAt: new Date().toISOString(), openclawHome: OPENCLAW_HOME, workspaceRoot: WORKSPACE_ROOT, registry: reg, docs: docList, memory: mem, tasks: taskList, schedules: scheduleList, agents: agentList, github: gh, config, projects, health };
}
