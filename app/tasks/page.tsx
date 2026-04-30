import { updatePhase2TaskStatus } from "@/app/actions";
import { PageHeader } from "@/components/mission/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardData, type TaskItem } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";
const columns: [TaskItem["status"], string][] = [["backlog", "Backlog"], ["in-progress", "In Progress"], ["done", "Done"]];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const data = getDashboardData();
  const notice = (await searchParams).notice;
  return <>
    <PageHeader eyebrow="Priority 02" title="Tasks" subtitle="Live Kanban sourced from OpenClaw task SQLite, memory lines, and Phase 2 dashboard-created tasks." />
    {notice && <div className="mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100">{notice}</div>}
    <div className="mb-5 rounded-2xl border border-cyan-200/15 bg-cyan-200/5 p-4 text-sm text-slate-300">Phase 2 controls are active for tasks sourced from <span className="mono">state/phase2-tasks.json</span>. Read-only inferred/SQLite tasks are displayed but not mutated.</div>
    <div className="grid gap-4 xl:grid-cols-3">
      {columns.map(([status, label]) => {
        const tasks = data.tasks.filter((t) => t.status === status);
        return <section className="neon-card min-h-[440px] p-4" key={status}>
          <div className="mb-3 flex items-center justify-between"><h2 className="mono text-sm font-black uppercase tracking-[.16em] text-cyan-200">{label}</h2><Badge variant="muted">{tasks.length}</Badge></div>
          {tasks.length ? tasks.map((task) => <TaskCard task={task} key={task.id} />) : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">No {label.toLowerCase()} tasks detected.</div>}
        </section>;
      })}
    </div>
  </>;
}

function TaskCard({ task }: { task: TaskItem }) {
  const editable = task.source === "state/phase2-tasks.json";
  return <article className="mb-3 rounded-2xl border border-cyan-200/15 bg-slate-950/45 p-4">
    <div className="flex items-start justify-between gap-3"><h3 className="font-bold leading-6">{task.title}</h3>{editable && <Badge variant="pink">editable</Badge>}</div>
    <p className="mt-2 text-xs leading-5 text-slate-400">{task.source}{task.agent ? ` · ${task.agent}` : ""}{task.rawStatus ? ` · raw=${task.rawStatus}` : ""}</p>
    {editable && <form action={updatePhase2TaskStatus} className="mt-3 flex gap-2">
      <input type="hidden" name="id" value={task.id} />
      <select name="status" defaultValue={task.status} className="h-9 min-w-0 flex-1 rounded-xl border border-cyan-300/20 bg-black/25 px-3 text-xs text-foreground outline-none">
        <option value="backlog">Backlog</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <Button type="submit" size="sm" variant="ghost">Update</Button>
    </form>}
  </article>;
}
