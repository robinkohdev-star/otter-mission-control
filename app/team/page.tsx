import { PageHeader } from "@/components/mission/shell";
import { PixelOtter } from "@/components/mission/otter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  const data = getDashboardData();
  return <>
    <PageHeader eyebrow="Priority 06" title="Team" subtitle="Flat crew registry plus inferred state from tasks, GitHub, and health/config files." />
    <Card className="mb-5"><Badge variant="pink">Mission Statement</Badge><h2 className="mt-3 text-3xl font-black tracking-tight">{data.registry.projectName}</h2><p className="mt-3 max-w-5xl text-slate-300 leading-7">{data.registry.missionStatement}</p></Card>
    <div className="grid gap-4 lg:grid-cols-2">
      {data.agents.map((agent) => <Card key={agent.id} className="grid gap-4 sm:grid-cols-[96px_1fr]"><PixelOtter accent={agent.accent} active={agent.computedStatus === "working"} /><div><div className="flex flex-wrap gap-2"><Badge variant={agent.computedStatus === "working" ? "pink" : agent.computedStatus === "ok" ? "green" : "muted"}>{agent.statusLabel}</Badge><Badge variant="cyan">{agent.lastSeen}</Badge></div><h2 className="mt-3 text-2xl font-black tracking-tight">{agent.name}</h2><p className="text-sm font-semibold text-cyan-100">{agent.role}</p><p className="mt-2 text-sm leading-6 text-slate-300">{agent.mission}</p><p className="mt-3 text-xs text-slate-500">Sources: {agent.sources.join(", ")}</p></div></Card>)}
    </div>
  </>;
}
