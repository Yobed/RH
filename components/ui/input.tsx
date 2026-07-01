import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <InputPrimitive
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs transition-all outline-none",
          "placeholder:text-slate-400",
          "focus-visible:border-[#ee7f03] focus-visible:ring-2 focus-visible:ring-[#ee7f03]/20",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          "aria-invalid:border-rose-400 aria-invalid:ring-2 aria-invalid:ring-rose-400/20",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-800",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
