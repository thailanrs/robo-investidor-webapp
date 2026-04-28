import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-zinc-200/50 bg-white/30 backdrop-blur-md px-3 py-2 text-sm transition-all duration-200 outline-none",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-900 dark:file:text-zinc-100",
        "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
        "hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700",
        "focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white dark:focus-visible:bg-zinc-900",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        "dark:bg-zinc-900/30 dark:border-zinc-800/50",
        "dark:text-zinc-100",
        className
      )}
      {...props}
    />
  )
}

export { Input }
