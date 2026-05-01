import Link from "next/link";
import { Activity, BookOpen, Bot, CalendarDays, FolderKanban, Gamepad2, ListTodo, Network, RadioTower } from "lucide-react";
import { getDashboardData } from "@/lib/openclaw-data";
import { Badge } from "@/components/ui/badge";
import { PixelOtter } from "@/components/mission/otter";

const nav = [
  { href: "/projects", label: "Projects", icon: FolderKanban, index: "01" },
  { href: "/tasks", label: "Tasks", icon: ListTodo, index: "02" },
  { href: "/docs", label: "Docs", icon: BookOpen, index: "03" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, index: "04" },
  { href: "/memory", label: "Memory", icon: Activity, index: "05" },
  { href: "/team", label: "Team", icon: Network, index: "06" },
  { href: "/office", label: "Visual Office", icon: Bot, index: "07" },
  { href: "/control", label: "Control", icon: Gamepad2, index: "08" },
  { href: "/operations", label: "Operations", icon: RadioTower, index: "09" },
];

export function MissionShell({ children }: { children: React.ReactNode }) {
  const data = getDashboardData();
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[292px_1fr]">
      <aside className="relative z-10 border-b border-cyan-200/15 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="neon-card p-5">
          <div className="mono text-xs font-black uppercase tracking-[.24em] text-cyan-200">Mission Control</div>
          <h1 className="mt-3 text-2xl font-black tracking-[-.05em]">Otter Mission Control</h1>
          <div className="mt-3 flex items-center gap-2 text-xs font-black text-emerald-200 mono"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#75ff9d]" /> ONLINE</div>
        </div>
        <nav className="mt-5 grid gap-2">
          {nav.map((item) => <Link key={item.href} href={item.href} className="group flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-cyan-200/25 hover:bg-cyan-200/10 hover:text-white"><span className="flex items-center gap-3"><item.icon className="h-4 w-4" />{item.label}</span><span className="mono text-[10px] font-black text-pink-300">{item.index}</span></Link>)}
        </nav>
        <div className="pointer-events-none mt-6 lg:absolute lg:bottom-5 lg:left-5 lg:right-5">
          <PixelOtter accent="pink" active className="h-16 w-16" />
          <p className="mt-3 text-xs leading-5 text-slate-400">{data.registry.missionStatement.slice(0, 170)}…</p>
        </div>
      </aside>
      <main className="relative z-10 min-w-0 p-5 md:p-8">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const data = getDashboardData();
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
      <div>
        <div className="mono text-xs font-black uppercase tracking-[.22em] text-cyan-200">{eyebrow}</div>
        <h1 className="text-glow mt-2 text-5xl font-black leading-none tracking-[-.075em] md:text-7xl">{title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">{subtitle}</p>
      </div>
      <Badge variant="pink" className="w-fit shrink-0">LIVE · {new Date(data.generatedAt).toLocaleString()}</Badge>
    </div>
  );
}
