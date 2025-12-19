import { History, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/hooks/useChatHistory";

interface SidebarProps {
    className?: string;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSessionSelect: (id: string) => void;
    onNewChat: () => void;
}

export function Sidebar({
    className,
    sessions,
    currentSessionId,
    onSessionSelect,
    onNewChat
}: SidebarProps) {
    return (
        <aside className={cn("hidden w-72 flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl lg:flex", className)}>
            <div className="p-4">
                <Button
                    onClick={onNewChat}
                    className="w-full justify-start gap-2 bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 hover:text-brand-300 border border-brand-500/20 shadow-none"
                >
                    <Plus className="h-4 w-4" />
                    New Analysis
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recent History
                </div>
                <div className="space-y-1">
                    {sessions.length === 0 ? (
                        <div className="px-2 text-sm text-slate-500 italic">No previous history</div>
                    ) : (
                        sessions.map((session) => (
                            <Button
                                key={session.id}
                                variant="ghost"
                                onClick={() => onSessionSelect(session.id)}
                                className={cn(
                                    "w-full justify-start gap-3 px-2 text-left font-normal transition-all",
                                    currentSessionId === session.id
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                )}
                            >
                                <History className="h-4 w-4 shrink-0 opacity-50" />
                                <div className="flex-1 overflow-hidden">
                                    <div className="truncate text-sm font-medium">
                                        {session.title || "New Analysis"}
                                    </div>
                                    <div className="truncate text-xs text-slate-500 opacity-70">
                                        {new Date(session.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </Button>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-auto border-t border-white/10 p-4">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <h4 className="text-sm font-medium text-slate-200">Disclaimer</h4>
                    <p className="mt-1 text-xs text-slate-500">
                        This AI tool is for informational purposes only and does not replace professional medical advice.
                    </p>
                </div>
            </div>
        </aside>
    );
}
