import { PageHeader } from "@/components/mission/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default async function DocsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const data = getDashboardData();
  const q = ((await searchParams).q || "").toLowerCase();
  const docs = data.docs.filter((d) => !q || `${d.title} ${d.path} ${d.excerpt}`.toLowerCase().includes(q));
  return <>
    <PageHeader eyebrow="Priority 03" title="Docs" subtitle="Searchable live library of workspace docs and selected OpenClaw operational files. Sensitive config values are not rendered." />
    <form className="mb-5"><Input name="q" placeholder="Search docs, configs, memory, briefs…" defaultValue={q} /></form>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {docs.map((doc) => <Card key={doc.path}><div className="flex items-center justify-between gap-2"><Badge variant={doc.source === "workspace" ? "green" : "purple"}>{doc.source}</Badge><Badge variant="muted">{doc.kind}</Badge></div><h2 className="mt-4 text-xl font-black tracking-tight">{doc.title}</h2><p className="mt-1 break-all text-xs text-slate-400 mono">{doc.path}</p><p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-300">{doc.excerpt || "No readable excerpt."}</p><p className="mt-4 text-xs text-slate-500">{new Date(doc.updatedAt).toLocaleString()} · {doc.size} bytes</p></Card>)}
      {!docs.length && <div className="rounded-3xl border border-dashed border-white/15 p-8 text-slate-400">No documents match that search.</div>}
    </div>
  </>;
}
