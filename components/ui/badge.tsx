import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] mono", {
  variants: {
    variant: {
      cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_14px_rgba(73,246,223,.12)]",
      pink: "border-pink-300/30 bg-pink-300/10 text-pink-200 shadow-[0_0_14px_rgba(255,95,215,.14)]",
      green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200 shadow-[0_0_14px_rgba(117,255,157,.12)]",
      purple: "border-violet-300/30 bg-violet-300/10 text-violet-200",
      red: "border-rose-300/30 bg-rose-300/10 text-rose-200",
      blue: "border-sky-300/30 bg-sky-300/10 text-sky-200",
      muted: "border-white/10 bg-white/5 text-slate-300",
    },
  },
  defaultVariants: { variant: "cyan" },
});

export interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
