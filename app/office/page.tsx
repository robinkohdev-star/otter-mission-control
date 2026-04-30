import { PageHeader } from "@/components/mission/shell";
import { PixelOtter } from "@/components/mission/otter";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default function OfficePage() {
  const data = getDashboardData();
  return <>
    <PageHeader eyebrow="Priority 07" title="Visual Office" subtitle="2D pixel-art agent office. Otters animate when their registry/task state says they are active." />
    <section className="office-grid neon-card relative overflow-hidden p-5 md:p-7">
      <div className="mb-6 flex flex-col gap-2 border-b border-cyan-200/15 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mono text-sm font-black uppercase tracking-[.24em] text-cyan-200">Agent Office</div>
          <p className="mt-2 text-sm text-slate-400">Aligned desks, equal-sized otter eyes, cleaner control-room layout.</p>
        </div>
        <Badge variant="muted" className="w-fit">{data.agents.length} agents</Badge>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {data.agents.map((agent) => (
          <article key={agent.id} className="flex min-h-[360px] flex-col rounded-3xl border border-cyan-200/15 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Badge variant={agent.computedStatus === "working" ? "pink" : agent.computedStatus === "ok" ? "green" : "muted"}>{agent.statusLabel}</Badge>
              <span className="mono text-[10px] text-slate-500">{agent.lastSeen}</span>
            </div>

            <div className="grid flex-1 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/[.03] p-6">
              <div className="relative grid h-40 w-full place-items-center rounded-2xl border border-cyan-200/10 bg-slate-900/45">
                <div className="absolute bottom-6 h-3 w-28 rounded-full bg-black/25 blur-sm" />
                <PixelOtter accent={agent.accent} active={agent.computedStatus === "working"} className="h-24" />
              </div>
            </div>

            <div className="mt-4">
              <div className="font-black tracking-tight">{agent.name}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">{agent.role}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  </>;
}
