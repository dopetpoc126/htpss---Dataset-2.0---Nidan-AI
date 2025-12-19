import { cn } from "@/lib/utils";
import { Activity, Bell, Settings, User, Menu, Github } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
    className?: string;
}

export function Header({ className }: HeaderProps) {
    return (
        <header className={cn("h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl flex items-center px-6 justify-between sticky top-0 z-50", className)}>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20">
                    <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white">MediSense AI</h1>
                    <p className="text-xs text-slate-400">Symptom Analysis Assistant</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Settings className="h-5 w-5" />
                </Button>
                <div className="h-8 w-[1px] bg-white/10" />
                <Button variant="ghost" size="sm" className="gap-2 pl-2 pr-4 text-slate-300 hover:text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Guest User</span>
                </Button>
            </div>
        </header>
    );
}
