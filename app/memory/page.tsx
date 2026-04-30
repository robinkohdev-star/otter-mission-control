import { PageHeader } from "@/components/mission/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const data = getDashboardData();
  const q = ((await searchParams).q || "").toLowerCase();
  const entries = data.memory.filter((m) => !q || `${m.date} ${m.path} ${m.excerpt} ${m.bullets.join(" ")}`.toLowerCase().includes(q));
  return <>
    <PageHeader eyebrow="Priority 05" title="Memory" subtitle="Journal-style daily logs plus long-term memory when present, searchable and cited back to real files." />
    <form className="mb-5"><Input name="q" placeholder="Search memory…" defaultValue={q} /></form>
    <div className="space-y-4">
      {entries.map((entry) => <Card key={entry.path}><Badge variant="green">{entry.date}</Badge><h2 className="mt-3 text-2xl font-black tracking-tight">{entry.path}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{entry.excerpt}</p><div className="mt-4 grid gap-2">{entry.bullets.map((b) => <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300" key={b}>{b}</div>)}</div><p className="mt-4 text-xs text-slate-500">Updated {new Date(entry.updatedAt).toLocaleString()}</p></Card>)}
      {!entries.length && <div className="rounded-3xl border border-dashed border-white/15 p-8 text-slate-400">No memory entries match.</div>}
    </div>
  </>;
}
