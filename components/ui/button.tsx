import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(73,246,223,.22)] hover:bg-cyan-200",
      ghost: "border border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-300/10",
    },
    size: { default: "h-11 px-4", sm: "h-9 px-3" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
