"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { commonSymptoms, allSymptoms, getSymptomTheme, themeClasses, formatSymptomDisplay } from "@/data/symptoms";
import { Check, Search, X } from "lucide-react";

interface CommonSymptomsProps {
    selectedSymptoms: string[];
    onToggle: (symptom: string) => void;
}

export function CommonSymptoms({ selectedSymptoms, onToggle }: CommonSymptomsProps) {
    const [viewMode, setViewMode] = useState<"common" | "all">("common");
    const [searchQuery, setSearchQuery] = useState("");

    const displaySymptoms = viewMode === "common"
        ? commonSymptoms
        : allSymptoms.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 backdrop-blur-xl bg-black/40 border border-white/5 h-full flex flex-col"
        >
            {/* Header with Toggle */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode("common")}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${viewMode === "common"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        Common
                    </button>
                    <button
                        onClick={() => setViewMode("all")}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${viewMode === "all"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        All Symptoms
                    </button>
                </div>
            </div>

            {/* Search Bar - only in "All" mode */}
            {viewMode === "all" && (
                <div className="mb-4 relative shrink-0">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search symptoms..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>
            )}

            {/* Scrollable Symptom List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                {displaySymptoms.length > 0 ? (
                    displaySymptoms.map(symptom => {
                        const isSelected = selectedSymptoms.includes(symptom);
                        const theme = getSymptomTheme(symptom);
                        const themeVals = themeClasses[theme] || themeClasses['blue'];

                        return (
                            <button
                                key={symptom}
                                onClick={() => onToggle(symptom)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 group ${isSelected
                                        ? "bg-blue-500/20 text-blue-200 border border-blue-500/30"
                                        : "bg-white/5 border border-transparent text-slate-400 hover:bg-white/10"
                                    }`}
                            >
                                {/* Checkbox */}
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected
                                        ? themeVals.checkbox
                                        : themeVals.checkboxEmpty
                                    }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm">{formatSymptomDisplay(symptom)}</span>
                            </button>
                        );
                    })
                ) : (
                    <div className="text-center text-slate-500 text-sm py-8">
                        No symptoms found
                    </div>
                )}
            </div>
        </motion.div>
    );
}
