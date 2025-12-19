import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { allSymptoms, getSymptomTheme, themeClasses } from "@/data/symptoms";
import { Search, X, Check } from "lucide-react";

interface GeneralSymptomSelectorProps {
    onSelect: (symptom: string) => void;
    selectedSymptoms: string[];
}

export function GeneralSymptomSelector({ onSelect, selectedSymptoms }: GeneralSymptomSelectorProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = allSymptoms.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit results

    return (
        <div ref={containerRef} className="relative z-50">
            <div className="relative group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search additional symptoms..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setIsOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-slate-400" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && query && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-hide p-2"
                    >
                        {filtered.length > 0 ? (
                            <div className="space-y-1">
                                {filtered.map(s => {
                                    const isSelected = selectedSymptoms.includes(s);
                                    const theme = getSymptomTheme(s);
                                    const themeVals = themeClasses[theme] || themeClasses['blue'];

                                    return (
                                        <button
                                            key={s}
                                            onClick={() => onSelect(s)} // Toggle - don't close
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 group ${isSelected
                                                ? themeVals.menu
                                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected
                                                ? themeVals.checkbox
                                                : themeVals.checkboxEmpty
                                                }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span>{s}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">No matching symptoms found</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
