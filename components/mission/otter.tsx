import { cn } from "@/lib/utils";

type Accent = "pink" | "purple" | "red" | "blue" | "cyan";
const colors: Record<Accent, string> = {
  pink: "bg-pink-400",
  purple: "bg-violet-400",
  red: "bg-rose-400",
  blue: "bg-sky-400",
  cyan: "bg-cyan-300",
};

const glow: Record<Accent, string> = {
  pink: "drop-shadow-[0_0_16px_rgba(255,95,215,.34)]",
  purple: "drop-shadow-[0_0_16px_rgba(158,108,255,.34)]",
  red: "drop-shadow-[0_0_16px_rgba(255,94,122,.34)]",
  blue: "drop-shadow-[0_0_16px_rgba(74,168,255,.34)]",
  cyan: "drop-shadow-[0_0_16px_rgba(73,246,223,.34)]",
};

export function PixelOtter({ accent = "pink", active = false, className }: { accent?: Accent; active?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-square h-20 shrink-0 pixelated",
        glow[accent],
        active && "otter-active",
        className,
      )}
      aria-label={`${accent} pixel otter`}
    >
      <div className={cn("absolute left-[10%] top-[8%] h-[28%] w-[28%] rounded-[18%]", colors[accent])} />
      <div className={cn("absolute right-[10%] top-[8%] h-[28%] w-[28%] rounded-[18%]", colors[accent])} />
      <div className={cn("absolute inset-x-[10%] bottom-[8%] top-[22%] rounded-[26%] shadow-inner shadow-black/25", colors[accent])} />
      <div className="absolute left-[24%] top-[43%] h-[10%] w-[10%] rounded-[2px] bg-slate-950" />
      <div className="absolute right-[24%] top-[43%] h-[10%] w-[10%] rounded-[2px] bg-slate-950" />
      <div className="absolute bottom-[20%] left-1/2 h-[34%] w-[50%] -translate-x-1/2 rounded-[28%] bg-orange-100" />
      <div className="absolute bottom-[35%] left-1/2 h-[9%] w-[14%] -translate-x-1/2 rounded-full bg-slate-950" />
      <div className="absolute bottom-[12%] left-[18%] h-[10%] w-[10%] rounded-full bg-orange-100/80" />
      <div className="absolute bottom-[12%] right-[18%] h-[10%] w-[10%] rounded-full bg-orange-100/80" />
    </div>
  );
}
