import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const STATE_PATH = "/home/rk/.openclaw/workspace/main_workspace/state/agent-triggers.json";
const LOGS_DIR = "/home/rk/.openclaw/workspace/main_workspace/logs";

export type AgentConfig = {
  id: string;
  name: string;
  description: string;
  accent: "pink" | "purple" | "red" | "blue";
  destructive: boolean;
  longRunning: boolean;
  cooldownMinutes: number;
  workingDir: string;
  command: string;
};

export const AGENTS: AgentConfig[] = [
  {
    id: "scoutorder",
    name: "ScoutOrder",
    description: "Morning AI news scanner - Reddit, HN, GitHub",
    accent: "purple",
    destructive: false,
    longRunning: true,
    cooldownMinutes: 5,
    workingDir: "~/workspace/scoutorder-agent",
    command: "python agent.py",
  },
  {
    id: "geoorder",
    name: "GeoOrder",
    description: "Geopolitics and Singapore-context scanner",
    accent: "red",
    destructive: false,
    longRunning: true,
    cooldownMinutes: 5,
    workingDir: "~/workspace/geoorder-agent",
    command: "python agent.py",
  },
  {
    id: "buildorder",
    name: "BuildOrder",
    description: "Coding agent - plans and implements code changes",
    accent: "blue",
    destructive: true,
    longRunning: true,
    cooldownMinutes: 5,
    workingDir: "~/workspace/buildorder-agent",
    command: "python agent.py",
  },
  {
    id: "healthorder",
    name: "HealthOrder",
    description: "System health checker - silent unless failure",
    accent: "pink",
    destructive: false,
    longRunning: false,
    cooldownMinutes: 5,
    workingDir: "~/workspace/healthorder-agent",
    command: "python agent.py",
  },
];

type TriggerState = {
  agents: Record<string, {
    lastRun: string | null;
    lastStatus: "idle" | "running" | "success" | "failed";
    lastError: string | null;
  }>;
};

function getInitialState(): TriggerState {
  const state: TriggerState = { agents: {} };
  for (const agent of AGENTS) {
    state.agents[agent.id] = {
      lastRun: null,
      lastStatus: "idle",
      lastError: null,
    };
  }
  return state;
}

function readState(): TriggerState {
  try {
    const data = fs.readFileSync(STATE_PATH, "utf8");
    return JSON.parse(data) as TriggerState;
  } catch {
    const initial = getInitialState();
    writeState(initial);
    return initial;
  }
}

function writeState(state: TriggerState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function getAgentTriggerState(agentId: string) {
  const state = readState();
  return state.agents[agentId] || { lastRun: null, lastStatus: "idle", lastError: null };
}

export function getAllAgentTriggerStates() {
  const state = readState();
  return AGENTS.map(agent => ({
    ...agent,
    ...state.agents[agent.id],
    canTrigger: canTriggerAgent(agent.id),
    cooldownRemaining: getCooldownRemaining(agent.id),
  }));
}

function canTriggerAgent(agentId: string): boolean {
  const state = readState();
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return false;
  
  const agentState = state.agents[agentId];
  if (!agentState?.lastRun) return true;
  
  const lastRun = new Date(agentState.lastRun).getTime();
  const cooldownMs = agent.cooldownMinutes * 60 * 1000;
  return Date.now() - lastRun >= cooldownMs;
}

function getCooldownRemaining(agentId: string): number {
  const state = readState();
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return 0;
  
  const agentState = state.agents[agentId];
  if (!agentState?.lastRun) return 0;
  
  const lastRun = new Date(agentState.lastRun).getTime();
  const cooldownMs = agent.cooldownMinutes * 60 * 1000;
  const remaining = cooldownMs - (Date.now() - lastRun);
  return Math.max(0, Math.ceil(remaining / 1000)); // seconds
}

export async function triggerAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) {
    return { success: false, error: "Agent not found" };
  }
  
  // Check cooldown
  if (!canTriggerAgent(agentId)) {
    const remaining = getCooldownRemaining(agentId);
    return { success: false, error: `Cooldown active. Wait ${remaining} seconds.` };
  }
  
  // Update state to running
  const state = readState();
  state.agents[agentId] = {
    lastRun: new Date().toISOString(),
    lastStatus: "running",
    lastError: null,
  };
  writeState(state);
  
  // Ensure logs directory exists
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const logPath = path.join(LOGS_DIR, `${agentId}.log`);
  
  // Spawn agent process asynchronously
  return new Promise((resolve) => {
    const expandedDir = agent.workingDir.replace("~", process.env.HOME || "/home/rk");
    const logStream = fs.createWriteStream(logPath, { flags: "a" });
    
    logStream.write(`\n[${new Date().toISOString()}] Starting ${agent.name}\n`);
    
    const child = spawn(agent.command, [], {
      cwd: expandedDir,
      shell: true,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    
    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);
    
    child.on("exit", (code) => {
      const finalState = readState();
      finalState.agents[agentId] = {
        ...finalState.agents[agentId],
        lastStatus: code === 0 ? "success" : "failed",
        lastError: code !== 0 ? `Exit code ${code}` : null,
      };
      writeState(finalState);
      logStream.write(`[${new Date().toISOString()}] Exit code: ${code}\n`);
      logStream.end();
    });
    
    child.on("error", (err) => {
      const finalState = readState();
      finalState.agents[agentId] = {
        ...finalState.agents[agentId],
        lastStatus: "failed",
        lastError: err.message,
      };
      writeState(finalState);
      logStream.write(`[${new Date().toISOString()}] Error: ${err.message}\n`);
      logStream.end();
    });
    
    // Return immediately - don't wait for completion
    resolve({ success: true });
  });
}
