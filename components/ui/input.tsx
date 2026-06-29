import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-14 w-full rounded-full border border-white/10 bg-white/[0.07] px-5 text-base text-white outline-none transition-all placeholder:text-white/42 focus:border-sky-300/50 focus:bg-white/[0.1] focus:ring-4 focus:ring-sky-400/10",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
