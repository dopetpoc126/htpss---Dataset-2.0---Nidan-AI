import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-900/20": variant === "primary",
                        "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700": variant === "secondary",
                        "hover:bg-slate-800/50 text-slate-200 hover:text-white": variant === "ghost",
                        "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20": variant === "danger",
                        "bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20": variant === "glass",

                        "h-9 px-4 text-sm": size === "sm",
                        "h-11 px-6 text-base": size === "md",
                        "h-14 px-8 text-lg": size === "lg",
                        "h-10 w-10 p-0": size === "icon",
                    },
                    className
                )}
                disabled={isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
