import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-muted">{label}</label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-primary placeholder-muted",
              "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors",
              prefix && "pl-8",
              error && "border-danger",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-muted">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-primary",
            "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors",
            error && "border-danger",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
