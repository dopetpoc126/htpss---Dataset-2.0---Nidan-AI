"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { commonSymptoms } from "@/data/symptoms";
import { cn } from "@/lib/utils";

interface SymptomSelectorProps {
    onSymptomsSelected: (symptoms: string[]) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function SymptomSelector({ onSymptomsSelected, isOpen, onClose }: SymptomSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

    const filteredSymptoms = commonSymptoms.filter((symptom) =>
        symptom.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSymptom = (symptom: string) => {
        if (selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
        } else {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
    };

    const handleSubmit = () => {
        onSymptomsSelected(selectedSymptoms);
        setSelectedSymptoms([]); // Clear after sending? Or keep? Let's clear.
        setSearchQuery("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full mb-4 left-0 w-full md:w-[400px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-4 max-h-[60vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-semibold text-slate-300">Select Symptoms</h3>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-slate-500 hover:text-white">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search symptoms..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-1 min-h-[150px]">
                        {filteredSymptoms.length === 0 ? (
                            <div className="text-center text-xs text-slate-600 py-4">No matching symptoms found.</div>
                        ) : (
                            filteredSymptoms.map(symptom => {
                                const isSelected = selectedSymptoms.includes(symptom);
                                return (
                                    <div
                                        key={symptom}
                                        onClick={() => toggleSymptom(symptom)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                                            isSelected ? "bg-brand-500/20 text-brand-300" : "hover:bg-slate-900 text-slate-400"
                                        )}
                                    >
                                        <span>{symptom}</span>
                                        {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer - Selected Tags & Submit */}
                    <div className="border-t border-slate-800 pt-3 space-y-3">
                        {selectedSymptoms.length > 0 && (
                            <div className="flex flex-wrap gap-2 max-h-[60px] overflow-y-auto">
                                {selectedSymptoms.map(s => (
                                    <span key={s} className="px-2 py-1 rounded-md bg-brand-500/20 text-brand-300 text-xs flex items-center gap-1 border border-brand-500/30">
                                        {s}
                                        <button onClick={(e) => { e.stopPropagation(); toggleSymptom(s); }} className="hover:text-white"><X className="h-3 w-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={selectedSymptoms.length === 0}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white"
                        >
                            Add Selected ({selectedSymptoms.length})
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
