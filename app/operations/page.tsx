import { runSafeSystemAction } from "@/app/actions";
import { ConfirmSubmit } from "@/components/mission/confirm-submit";
import { LiveOperations } from "@/components/mission/live-operations";
import { PageHeader } from "@/components/mission/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOperationsSnapshot } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default function OperationsPage() {
  const snapshot = getOperationsSnapshot();
  return <>
    <PageHeader eyebrow="Priority 09" title="Operations" subtitle="Phase 3 live control-room layer: auto-refreshing status, session details, gateway log tail, control events, and confirmed safe workflow triggers." />

    <Card className="mb-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><Badge variant="pink">Confirmed Triggers</Badge><h2 className="mt-3 text-2xl font-black tracking-tight">Safe workflow checks</h2><p className="mt-2 text-sm leading-6 text-slate-400">These are still allowlisted read-only commands, but Phase 3 adds explicit confirmation before they run.</p></div></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConfirmedAction action="openclaw-health" label="Run OpenClaw health" />
        <ConfirmedAction action="gateway-status" label="Refresh gateway status" />
        <ConfirmedAction action="openclaw-status" label="Full OpenClaw status" />
        <ConfirmedAction action="git-status" label="Workspace git status" />
      </div>
    </Card>

    <LiveOperations initial={snapshot} />
  </>;
}

function ConfirmedAction({ action, label }: { action: string; label: string }) {
  return <form action={runSafeSystemAction}>
    <input type="hidden" name="action" value={action} />
    <ConfirmSubmit message={`Run ${label}?`}>{label}</ConfirmSubmit>
  </form>;
}
