import { PageHeader } from "@/components/mission/shell";
import { PixelOtter } from "@/components/mission/otter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllAgentTriggerStates, AGENTS, type AgentConfig } from "@/lib/agent-triggers";
import { runAgentTrigger } from "@/app/actions";
import { Play, AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

const accentMap: Record<string, "pink" | "purple" | "red" | "blue"> = {
  scoutorder: "purple",
  geoorder: "red",
  buildorder: "blue",
  healthorder: "pink",
};

const statusIcons = {
  idle: null,
  running: <Loader2 className="h-4 w-4 animate-spin" />,
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  failed: <XCircle className="h-4 w-4 text-rose-400" />,
};

const statusColors = {
  idle: "muted",
  running: "pink",
  success: "green",
  failed: "red",
} as const;

export default function AgentsPage() {
  const agents = getAllAgentTriggerStates();
  
  return <>
    <PageHeader 
      eyebrow="Priority 11" 
      title="Agents" 
      subtitle="Manual workflow triggers for ScoutOrder, GeoOrder, BuildOrder, and HealthOrder. 5-minute cooldown between triggers." 
    />

    <div className="grid gap-5 xl:grid-cols-2">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  </>;
}

function AgentCard({ agent }: { agent: AgentConfig & { lastRun: string | null; lastStatus: string; lastError: string | null; canTrigger: boolean; cooldownRemaining: number } }) {
  const accent = accentMap[agent.id] || "pink";
  const status = agent.lastStatus as keyof typeof statusIcons;
  const isRunning = status === "running";
  
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-cyan-200/15 bg-slate-950/40 p-5">
        <div className="flex items-start gap-4">
          <PixelOtter accent={accent} active={isRunning} className="h-14 w-14" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">{agent.name}</h2>
              <Badge variant={statusColors[status] || "muted"}>
                <span className="flex items-center gap-1">
                  {statusIcons[status]}
                  {status.toUpperCase()}
                </span>
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">{agent.description}</p>
            
            {/* Status details */}
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {agent.lastRun && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last run: {new Date(agent.lastRun).toLocaleString()}
                </div>
              )}
              {agent.lastError && (
                <div className="flex items-center gap-1.5 text-rose-300">
                  <XCircle className="h-3 w-3" />
                  Error: {agent.lastError}
                </div>
              )}
              {!agent.canTrigger && agent.cooldownRemaining > 0 && (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Clock className="h-3 w-3" />
                  Cooldown: {formatCooldown(agent.cooldownRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Warnings */}
        {(agent.destructive || agent.longRunning) && (
          <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                {agent.destructive && (
                  <p className="font-semibold">Destructive operation</p>
                )}
                {agent.longRunning && (
                  <p>This agent may take 30-60 seconds to complete.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trigger form */}
        <form action={runAgentTrigger}>
          <input type="hidden" name="agentId" value={agent.id} />
          <input type="hidden" name="confirmed" value={agent.destructive ? "false" : "true"} />
          
          <TriggerButton 
            agent={agent} 
            disabled={!agent.canTrigger || isRunning}
          />
        </form>

        {/* Model info */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Cooldown: {agent.cooldownMinutes} min</span>
          <span className="font-mono">
            {agent.id === "buildorder" ? "Kimi k2.5 → Qwen 3.6+" : 
             agent.id === "healthorder" ? "DeepSeek V4 Flash" : "Minimax m2.5"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function TriggerButton({ agent, disabled }: { agent: AgentConfig & { canTrigger: boolean }; disabled: boolean }) {
  return (
    <Button 
      type="submit" 
      disabled={disabled}
      className="w-full"
    >
      <Play className="mr-2 h-4 w-4" />
      {disabled ? "Cooldown..." : `Trigger ${agent.destructive ? "(Confirm)" : ""}`}
    </Button>
  );
}

function formatCooldown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
