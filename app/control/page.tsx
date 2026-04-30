import { ShieldCheck, TerminalSquare } from "lucide-react";
import { createPhase2Task, runSafeSystemAction } from "@/app/actions";
import { PageHeader } from "@/components/mission/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readControlEvents, readPhase2Tasks } from "@/lib/phase2-control";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default async function ControlPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const notice = (await searchParams).notice;
  const data = getDashboardData();
  const tasks = readPhase2Tasks();
  const events = readControlEvents();

  return <>
    <PageHeader eyebrow="Priority 08" title="Control" subtitle="Phase 2 safe interaction layer: create dashboard tasks, update workflow state, and run allowlisted local status checks." />
    {notice && <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100">{notice}</div>}

    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><Badge variant="pink">Task Control</Badge><h2 className="mt-3 text-2xl font-black tracking-tight">Create a dashboard task</h2><p className="mt-2 text-sm leading-6 text-slate-400">Stored locally in <span className="mono">state/phase2-tasks.json</span> and merged into the Tasks Kanban.</p></div>
          <ShieldCheck className="h-8 w-8 text-emerald-200" />
        </div>
        <form action={createPhase2Task} className="grid gap-3">
          <Input name="title" placeholder="Task title, e.g. Add gateway restart confirmation modal" required minLength={3} maxLength={180} />
          <div className="grid gap-3 md:grid-cols-2">
            <select name="status" defaultValue="backlog" className="h-12 rounded-2xl border border-cyan-300/25 bg-black/25 px-4 text-sm text-foreground outline-none focus:border-cyan-200/60">
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select name="agent" defaultValue="buildorder" className="h-12 rounded-2xl border border-cyan-300/25 bg-black/25 px-4 text-sm text-foreground outline-none focus:border-cyan-200/60">
              {data.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              <option value="">Unassigned</option>
            </select>
          </div>
          <Button type="submit">Create task</Button>
        </form>

        <div className="mt-6 space-y-2">
          <div className="mono text-xs font-black uppercase tracking-[.18em] text-cyan-200">Recent Phase 2 tasks</div>
          {tasks.slice(0, 5).map((task) => <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"><div className="font-bold">{task.title}</div><div className="mt-1 text-xs text-slate-400">{task.status} · {task.agent || "unassigned"}</div></div>)}
          {!tasks.length && <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-400">No dashboard-created tasks yet.</div>}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><Badge variant="cyan">Allowlisted Actions</Badge><h2 className="mt-3 text-2xl font-black tracking-tight">Run safe status checks</h2><p className="mt-2 text-sm leading-6 text-slate-400">No arbitrary shell. These buttons only run fixed read-only commands.</p></div>
          <TerminalSquare className="h-8 w-8 text-cyan-200" />
        </div>
        <div className="grid gap-3">
          <ControlButton action="openclaw-status" label="Check OpenClaw status" />
          <ControlButton action="gateway-status" label="Check gateway status" />
          <ControlButton action="git-status" label="Check workspace git status" />
        </div>
      </Card>
    </div>

    <Card className="mt-5">
      <div className="mb-4 flex items-center justify-between gap-3"><div><Badge variant="purple">Control Log</Badge><h2 className="mt-3 text-2xl font-black tracking-tight">Recent action output</h2></div><Badge variant="muted">{events.length}</Badge></div>
      <div className="space-y-3">
        {events.map((event) => <article key={event.id} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant={event.status === "ok" ? "green" : "red"}>{event.status}</Badge><span className="font-bold">{event.action}</span><span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</span></div><p className="mt-2 text-sm text-slate-300">{event.summary}</p>{event.output && <pre className="mt-3 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">{event.output}</pre>}</article>)}
        {!events.length && <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">No safe actions have been run yet.</div>}
      </div>
    </Card>
  </>;
}

function ControlButton({ action, label }: { action: string; label: string }) {
  return <form action={runSafeSystemAction}><input type="hidden" name="action" value={action} /><Button type="submit" variant="ghost" className="w-full justify-start">{label}</Button></form>;
}
