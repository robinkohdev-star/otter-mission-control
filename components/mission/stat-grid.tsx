import { getDashboardData } from "@/lib/openclaw-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function StatGrid() {
  const data = getDashboardData();
  return (
    <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {data.health.map((h) => <Card key={h.label} className="p-4"><Badge variant={h.tone === "good" ? "green" : h.tone === "hot" ? "pink" : "muted"}>{h.label}</Badge><div className="mt-3 text-3xl font-black tracking-tight">{h.value}</div></Card>)}
    </div>
  );
}
