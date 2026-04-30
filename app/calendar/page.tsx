import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/mission/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/openclaw-data";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const data = getDashboardData();
  return <>
    <PageHeader eyebrow="Priority 04" title="Calendar" subtitle="Scheduler and proactivity view from crontab, HEARTBEAT.md, and OpenClaw config signals." />
    <div className="grid gap-4 lg:grid-cols-2">
      {data.schedules.map((item) => <Card key={item.id}><div className="flex items-start justify-between gap-4"><CalendarClock className="h-8 w-8 text-cyan-200" /><Badge variant={item.status === "scheduled" ? "green" : item.status === "empty" ? "muted" : "cyan"}>{item.status}</Badge></div><h2 className="mt-4 text-2xl font-black tracking-tight">{item.title}</h2><p className="mt-2 text-sm text-slate-300"><span className="text-cyan-100">Cadence:</span> <span className="mono">{item.cadence}</span></p><p className="mt-1 text-sm text-slate-400">Source: {item.source}</p>{item.details && <pre className="mt-4 max-h-32 overflow-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-slate-400">{item.details}</pre>}</Card>)}
    </div>
  </>;
}
