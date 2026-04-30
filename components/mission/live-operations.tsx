"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Snapshot = {
  generatedAt: string;
  health: { label: string; value: string; tone: "good" | "warn" | "hot" }[];
  agents: { id: string; name: string; computedStatus: string; lastSeen: string; taskCount: number }[];
  sessions: { key: string; sessionId: string; updatedAt: string; channel: string; chatType: string; abortedLastRun: boolean; sessionFile?: string }[];
  logs: { path: string; lines: string[]; updatedAt?: string };
  events: { id: string; action: string; status: "ok" | "failed"; createdAt: string; summary: string }[];
  gateway: { ok: boolean; summary: string };
};

export function LiveOperations({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    try {
      const res = await fetch("/api/operations", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnapshot(await res.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    const id = window.setInterval(() => startTransition(refresh), 15000);
    return () => window.clearInterval(id);
  }, []);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200/15 bg-cyan-200/5 p-4">
      <div>
        <div className="mono text-xs font-black uppercase tracking-[.18em] text-cyan-200">Live refresh</div>
        <div className="mt-1 text-sm text-slate-300">Last snapshot: {new Date(snapshot.generatedAt).toLocaleString()}</div>
        {error && <div className="mt-1 text-sm text-rose-200">Refresh error: {error}</div>}
      </div>
      <Button type="button" onClick={() => startTransition(refresh)} disabled={isPending}>{isPending ? "Refreshing…" : "Refresh now"}</Button>
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Gateway" badge={snapshot.gateway.ok ? "OK" : "WARN"} tone={snapshot.gateway.ok ? "green" : "red"}>
        <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-300">{snapshot.gateway.summary}</pre>
      </Panel>
      <Panel title="Health Signals" badge={`${snapshot.health.length}`} tone="cyan">
        <div className="grid gap-2">{snapshot.health.map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"><span>{item.label}</span><Badge variant={item.tone === "good" ? "green" : item.tone === "warn" ? "red" : "pink"}>{item.value}</Badge></div>)}</div>
      </Panel>
      <Panel title="Agent State" badge={`${snapshot.agents.length}`} tone="purple">
        <div className="grid gap-2">{snapshot.agents.map((agent) => <div key={agent.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><div className="flex items-center justify-between gap-2"><b>{agent.name}</b><Badge variant={agent.computedStatus === "working" ? "pink" : agent.computedStatus === "ok" ? "green" : "muted"}>{agent.computedStatus}</Badge></div><div className="mt-1 text-xs text-slate-400">{agent.lastSeen} · {agent.taskCount} tasks</div></div>)}</div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Panel title="Sessions" badge={`${snapshot.sessions.length}`} tone="cyan">
        <div className="space-y-2">{snapshot.sessions.map((session) => <div key={session.key} className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><Badge variant={session.abortedLastRun ? "red" : "green"}>{session.abortedLastRun ? "aborted" : "ok"}</Badge><b className="break-all">{session.key}</b></div><div className="mt-2 text-xs leading-5 text-slate-400">{session.channel} · {session.chatType} · {session.updatedAt ? new Date(session.updatedAt).toLocaleString() : "unknown"}</div>{session.sessionFile && <div className="mt-1 break-all text-xs text-slate-500">{session.sessionFile}</div>}</div>)}</div>
      </Panel>
      <Panel title="Gateway Log Tail" badge={`${snapshot.logs.lines.length} lines`} tone="pink">
        <div className="mb-2 break-all text-xs text-slate-500">{snapshot.logs.path}{snapshot.logs.updatedAt ? ` · ${new Date(snapshot.logs.updatedAt).toLocaleString()}` : ""}</div>
        <pre className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/35 p-3 text-xs leading-5 text-slate-300">{snapshot.logs.lines.join("\n") || "No gateway log lines found."}</pre>
      </Panel>
    </div>

    <Panel title="Recent Control Events" badge={`${snapshot.events.length}`} tone="purple">
      <div className="space-y-2">{snapshot.events.map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><Badge variant={event.status === "ok" ? "green" : "red"}>{event.status}</Badge><b>{event.action}</b><span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</span></div><div className="mt-1 text-slate-300">{event.summary}</div></div>)}</div>
    </Panel>
  </div>;
}

function Panel({ title, badge, tone, children }: { title: string; badge: string; tone: "cyan" | "green" | "red" | "pink" | "purple"; children: React.ReactNode }) {
  return <section className="neon-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black tracking-tight">{title}</h2><Badge variant={tone}>{badge}</Badge></div>{children}</section>;
}
