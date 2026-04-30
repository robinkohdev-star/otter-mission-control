import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn("h-12 w-full rounded-2xl border border-cyan-300/25 bg-black/25 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-300/20", className)} {...props} />;
}
