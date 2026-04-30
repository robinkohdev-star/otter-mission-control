import { PageHeader } from "@/components/mission/shell";
import { StatGrid } from "@/components/mission/stat-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const data = getDashboardData();
  return <>
    <PageHeader eyebrow="Priority 01" title="Projects" subtitle="Unified project view built from the real mission registry, workspace files, tasks, docs, memory, and GitHub state." />
    <StatGrid />
    <div className="grid gap-5">
      {data.projects.map((project) => <Card key={project.id}>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><Badge variant="pink">{project.priority} · {project.status}</Badge><CardTitle className="mt-3 text-3xl">{project.name}</CardTitle><CardDescription>{project.description}</CardDescription></div><Badge variant="green">{project.progress}%</Badge></div>
          <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/10 bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400 shadow-[0_0_22px_rgba(255,95,215,.48)]" style={{ width: `${project.progress}%` }} /></div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4 text-sm text-slate-300"><b className="text-cyan-100">Next move:</b> {project.nextMove}</div>
          <div className="grid gap-4 lg:grid-cols-3">
            <section><h3 className="mb-2 font-bold">Linked tasks</h3><div className="space-y-2">{project.tasks.length ? project.tasks.map((t) => <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" key={t.id}><div>{t.title}</div><div className="mt-1 text-xs text-slate-400">{t.status} · {t.source}</div></div>) : <Empty text="No linked tasks detected yet." />}</div></section>
            <section><h3 className="mb-2 font-bold">Recent memory</h3><div className="space-y-2">{project.memory.length ? project.memory.map((m) => <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" key={m.path}><div>{m.date}</div><div className="mt-1 text-xs text-slate-400">{m.path}</div></div>) : <Empty text="No matching memory yet." />}</div></section>
            <section><h3 className="mb-2 font-bold">Docs</h3><div className="space-y-2">{project.docs.length ? project.docs.map((d) => <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" key={d.path}><div>{d.title}</div><div className="mt-1 text-xs text-slate-400">{d.path}</div></div>) : <Empty text="No linked docs found." />}</div></section>
          </div>
        </CardContent>
      </Card>)}
    </div>
  </>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-400">{text}</div>; }
