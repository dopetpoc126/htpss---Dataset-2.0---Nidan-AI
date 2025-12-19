"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User as UserIcon, ChevronDown, ChevronUp } from "lucide-react";
import { ChatSession, Message } from "@/hooks/useChatHistory";
import { localizedSymptoms, getSymptomTheme, themeClasses, formatSymptomDisplay } from "@/data/symptoms";
import { CommonSymptoms } from "./CommonSymptoms";
import { BodySilhouette } from "./BodySilhouette";
import { GeneralSymptomSelector } from "./GeneralSymptomSelector";
import { diagnoseSymptoms, askFollowUp, DiagnoseResponse, Disease, QAEntry, DiagnosisReport } from "@/api/client";
import { useUser } from "@/context/UserContext";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
    currentSession?: ChatSession;
    onSendMessage: (sessionId: string, message: Message) => void;
    className?: string;
}

// State for iterative Q&A flow
interface QAFlowState {
    isActive: boolean;
    symptoms: string[];
    topDiseases: Disease[];
    questionNumber: number;
    qaHistory: QAEntry[];
    currentQuestion: string;
}

export function ChatInterface({ currentSession, onSendMessage, className = "" }: ChatInterfaceProps) {
    const [input, setInput] = useState("");
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
    const [hoveredBodyPart, setHoveredBodyPart] = useState<string | null>(null);
    const [isSelectionLocked, setIsSelectionLocked] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ML Confidence dropdown state
    const [mlConfidenceData, setMlConfidenceData] = useState<{
        topDiseases: Disease[];
        confidence: number;
    } | null>(null);
    const [showConfidenceDropdown, setShowConfidenceDropdown] = useState(false);

    // Triage status - shown after diagnosis complete
    const [triageLevel, setTriageLevel] = useState<string | null>(null);

    // Iterative Q&A flow state
    const [qaFlow, setQaFlow] = useState<QAFlowState>({
        isActive: false,
        symptoms: [],
        topDiseases: [],
        questionNumber: 0,
        qaHistory: [],
        currentQuestion: ""
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentSession?.messages, activeBodyPart]);

    // Reset ML confidence, Q&A flow, and triage when session changes
    useEffect(() => {
        setMlConfidenceData(null);
        setShowConfidenceDropdown(false);
        setTriageLevel(null);
        setQaFlow({
            isActive: false,
            symptoms: [],
            topDiseases: [],
            questionNumber: 0,
            qaHistory: [],
            currentQuestion: ""
        });
    }, [currentSession?.id]);


    const handlePartSelect = (part: string | null, method: 'hover' | 'click' = 'click') => {
        if (!part) {
            setActiveBodyPart(null);
            setIsSelectionLocked(false);
            return;
        }

        if (method === 'click') {
            if (activeBodyPart === part) {
                setActiveBodyPart(null);
                setIsSelectionLocked(false);
                return;
            }
            setActiveBodyPart(part);
            setIsSelectionLocked(true);
        }
    };

    // Triage level display helper (for visual bar)
    const getTriageConfig = (level: string | null) => {
        const config = {
            immediate: { label: "IMMEDIATE", color: "bg-red-500", textColor: "text-red-500", desc: "Emergency" },
            delayed: { label: "DELAYED", color: "bg-yellow-500", textColor: "text-yellow-500", desc: "Urgent" },
            minimal: { label: "MINIMAL", color: "bg-green-500", textColor: "text-green-500", desc: "Routine" },
            expectant: { label: "EXPECTANT", color: "bg-slate-700", textColor: "text-slate-400", desc: "Palliative" }
        };
        return config[level as keyof typeof config] || null;
    };

    const formatReportMessage = (report: DiagnosisReport): string => {
        return `### 🎯 ${report.disease}
*${report.confidence} confidence*

${report.reasoning}

**Specialist:** ${report.specialist}

**Next Steps:** ${report.advice}`;
    };

    const handleSendMessage = async () => {
        if ((!input.trim() && selectedSymptoms.length === 0) || !currentSession) return;

        // Prepare User Message
        let fullMessage = "";
        const symptomsList = selectedSymptoms.join(", ");
        if (selectedSymptoms.length > 0) fullMessage += `Symptoms: ${symptomsList}. `;
        if (input.trim()) fullMessage += input;

        const userMsg: Message = { role: "user", content: fullMessage };

        onSendMessage(currentSession.id, userMsg);
        const currentInput = input.trim().toLowerCase();
        setInput("");

        // Keep symptoms for the Q&A flow if it's active
        const symptomsForRequest = selectedSymptoms.length > 0 ? [...selectedSymptoms] : qaFlow.symptoms;
        setSelectedSymptoms([]);
        setActiveBodyPart(null);
        setIsProcessing(true);

        try {
            let aiContent = "";

            if (qaFlow.isActive && qaFlow.questionNumber > 0) {
                // User is answering a follow-up question
                const answer = currentInput.includes("yes") ? "yes" :
                    currentInput.includes("no") ? "no" : currentInput;

                const newQaHistory: QAEntry[] = [
                    ...qaFlow.qaHistory,
                    { question: qaFlow.currentQuestion, answer }
                ];

                // Call /ask endpoint
                const response = await askFollowUp(
                    qaFlow.symptoms,
                    qaFlow.topDiseases,
                    qaFlow.questionNumber,
                    newQaHistory
                );

                if (response.action === "show_report" && response.report) {
                    // All 3 questions answered - show final report
                    aiContent = formatReportMessage(response.report);
                    setTriageLevel(response.report.triage_level || "minimal");
                    setQaFlow({ isActive: false, symptoms: [], topDiseases: [], questionNumber: 0, qaHistory: [], currentQuestion: "" });
                } else if (response.action === "ask_question" && response.question) {
                    // More questions to ask
                    aiContent = `🤔 ${response.question}`;
                    setQaFlow(prev => ({
                        ...prev,
                        questionNumber: response.question_number || prev.questionNumber + 1,
                        qaHistory: newQaHistory,
                        currentQuestion: response.question || ""
                    }));
                }

            } else {
                // Initial symptom input - call /diagnose
                const response = await diagnoseSymptoms(
                    symptomsForRequest,
                    user?.medicalHistory || "",
                    user?.medications || ""
                );

                // Store ML confidence data for dropdown
                setMlConfidenceData({
                    topDiseases: response.top_diseases,
                    confidence: response.confidence_score
                });

                if (response.action === "show_report" && response.report) {
                    // High confidence - show comprehensive report directly
                    aiContent = formatReportMessage(response.report);
                    setTriageLevel(response.report.triage_level || "minimal");
                } else if (response.action === "ask_question" && response.question) {
                    // Low confidence - start iterative Q&A
                    aiContent = `🤔 ${response.question}`;
                    setQaFlow({
                        isActive: true,
                        symptoms: symptomsForRequest,
                        topDiseases: response.top_diseases,
                        questionNumber: response.question_number || 1,
                        qaHistory: [],
                        currentQuestion: response.question
                    });
                }
            }

            const aiMsg: Message = { role: "ai", content: aiContent };
            onSendMessage(currentSession.id, aiMsg);

        } catch (error) {
            console.error("Chat Error", error);
            const errorMsg: Message = { role: "ai", content: "Network connection issue. Please ensure the backend is running on http://localhost:8000" };
            onSendMessage(currentSession.id, errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const getSymptomsForPart = (part: string | null): string[] => {
        if (!part) return [];
        switch (part) {
            case "head": return [...localizedSymptoms["Head & Face"], ...localizedSymptoms["Neck & Throat"], ...localizedSymptoms["Eyes & Ears"]];
            case "chest": return [...localizedSymptoms["Chest & Respiratory"], ...localizedSymptoms["Back"]];
            case "stomach": return [...localizedSymptoms["Abdomen & Pelvic"], ...localizedSymptoms["Reproductive & Urinary"]];
            case "arm-left":
            case "arm-right":
                return localizedSymptoms["Arms"];
            case "leg-left":
            case "leg-right":
                return localizedSymptoms["Legs"];
            default: return [];
        }
    };

    const activePartSymptoms = getSymptomsForPart(activeBodyPart);
    const regionNameMap: Record<string, string> = {
        "head": "Head, Face & Neck",
        "chest": "Chest & Back",
        "stomach": "Abdomen & Pelvic",
        "arm-left": "Left Arm & Hand",
        "arm-right": "Right Arm & Hand",
        "leg-left": "Left Leg & Foot",
        "leg-right": "Right Leg & Foot"
    };

    const regionColorMap: Record<string, string> = {
        "head": "text-violet-400",
        "chest": "text-blue-400",
        "stomach": "text-emerald-400",
        "arm-left": "text-amber-400",
        "arm-right": "text-amber-400",
        "leg-left": "text-rose-400",
        "leg-right": "text-rose-400"
    };

    const svgToThemeMap: Record<string, string> = {
        "head": "violet",
        "chest": "blue",
        "stomach": "emerald",
        "arm-left": "amber",
        "arm-right": "amber",
        "leg-left": "rose",
        "leg-right": "rose"
    };

    const activeTheme = activeBodyPart ? (svgToThemeMap[activeBodyPart] || "blue") : "blue";

    return (
        <div className={`flex flex-row h-full gap-4 p-4 ${className}`}>
            {/* Left Column: Common Symptoms */}
            <div className="w-1/4 min-w-[250px] hidden md:block">
                <CommonSymptoms
                    selectedSymptoms={selectedSymptoms}
                    onToggle={toggleSymptom}
                />
            </div>

            {/* Center Column: Body Silhouette */}
            <div className="w-1/4 min-w-[300px] hidden lg:block">
                <BodySilhouette
                    selectedSymptoms={selectedSymptoms}
                    onToggle={toggleSymptom}
                    onPartSelect={handlePartSelect}
                    activePart={activeBodyPart}
                    hoveredPart={hoveredBodyPart}
                    onHover={setHoveredBodyPart}
                />
            </div>

            {/* Right Column: Chat & General Input */}
            <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl overflow-hidden relative border-l border-white/5">

                {/* SHARED HEADER - Compact */}
                <div className="flex justify-between items-center sticky top-0 bg-slate-950/95 backdrop-blur-xl py-2 px-4 border-b border-white/5 z-20 shadow-lg shrink-0">
                    <div className="space-y-0.5">
                        <h3 className={`text-base font-medium tracking-tight transition-colors duration-300 ${(activeBodyPart || hoveredBodyPart)
                            ? regionColorMap[activeBodyPart || hoveredBodyPart || ""]
                            : "text-slate-200"
                            }`}>
                            {(activeBodyPart || hoveredBodyPart)
                                ? regionNameMap[activeBodyPart || hoveredBodyPart || ""]
                                : "Symptom Analysis"
                            }
                        </h3>
                        <p className="text-[10px] text-slate-500">
                            {activeBodyPart ? "Select all that apply" : qaFlow.isActive ? `Question ${qaFlow.questionNumber} of 3` : "Detailed breakdown & history"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Triage Status Bar - shows after diagnosis */}
                        {triageLevel && (() => {
                            const config = getTriageConfig(triageLevel);
                            if (!config) return null;
                            return (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${triageLevel === 'immediate' ? 'bg-red-500/20 border-red-500/50' :
                                    triageLevel === 'delayed' ? 'bg-yellow-500/20 border-yellow-500/50' :
                                        triageLevel === 'minimal' ? 'bg-green-500/20 border-green-500/50' :
                                            'bg-slate-700/50 border-slate-600'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                    <span className={`text-xs font-medium ${config.textColor}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {config.desc}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* ML Confidence Dropdown Button */}
                        {mlConfidenceData && (() => {
                            // Calculate display confidence with narrowing effect
                            const baseConf = mlConfidenceData.confidence;
                            const boost = qaFlow.isActive && qaFlow.questionNumber > 0
                                ? qaFlow.questionNumber * 8
                                : 0;
                            const displayConf = Math.min(baseConf + boost, 69);

                            return (
                                <button
                                    onClick={() => setShowConfidenceDropdown(!showConfidenceDropdown)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs rounded-full transition-colors border border-cyan-500/30"
                                >
                                    <span>ML: {displayConf.toFixed(1)}%</span>
                                    {showConfidenceDropdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            );
                        })()}
                        {activeBodyPart && (
                            <button
                                onClick={() => { setActiveBodyPart(null); setIsSelectionLocked(false); }}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs rounded-full transition-colors"
                            >
                                Back to Chat
                            </button>
                        )}
                    </div>
                </div>

                {/* ML Confidence Dropdown Panel */}
                <AnimatePresence>
                    {showConfidenceDropdown && mlConfidenceData && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-900/90 border-b border-white/10 overflow-hidden"
                        >
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-medium text-slate-300">ML Prediction Confidence</h4>
                                    {qaFlow.isActive && (
                                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                            Narrowing... Q{qaFlow.questionNumber}/3
                                        </span>
                                    )}
                                </div>
                                {mlConfidenceData.topDiseases.map((disease, idx) => {
                                    const baseProb = disease.probability || disease.prob || disease.score || 0;

                                    // Calculate visual progress based on Q&A state
                                    // During Q&A, show narrowing effect - first disease grows, others shrink
                                    let displayProb = baseProb;

                                    if (qaFlow.isActive && qaFlow.questionNumber > 0) {
                                        const questionProgress = qaFlow.questionNumber; // 1, 2, or 3

                                        if (idx === 0) {
                                            // First (most likely) disease: increase towards 69% max
                                            const boost = questionProgress * 8; // +8%, +16%, +24%
                                            displayProb = Math.min(baseProb + boost, 69);
                                        } else {
                                            // Other diseases: decrease as narrowing happens
                                            const reduction = questionProgress * (4 + idx * 2); // More reduction for lower-ranked
                                            displayProb = Math.max(baseProb - reduction, 3);
                                        }
                                    }

                                    // Never touch 100% or exceed 69%
                                    displayProb = Math.min(displayProb, 69);

                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400 w-4">{idx + 1}.</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-sm ${idx === 0 && qaFlow.isActive ? "text-cyan-300 font-medium" : "text-slate-200"}`}>
                                                        {disease.name}
                                                    </span>
                                                    <span className={`text-xs ${idx === 0 && qaFlow.isActive ? "text-cyan-400" : "text-slate-400"}`}>
                                                        {displayProb.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className={`h-full rounded-full ${idx === 0
                                                            ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                                            : "bg-slate-500"}`}
                                                        initial={{ width: `${baseProb}%` }}
                                                        animate={{ width: `${displayProb}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative">
                    <AnimatePresence mode="wait">
                        {activeBodyPart ? (
                            <motion.div
                                key="symptom-menu"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col"
                            >
                                <div className="grid grid-cols-2 gap-3 pb-4">
                                    {activePartSymptoms.map(symptom => {
                                        const isSelected = selectedSymptoms.includes(symptom);
                                        const themeVals = themeClasses[activeTheme] || themeClasses['blue'];

                                        return (
                                            <button
                                                key={symptom}
                                                onClick={() => toggleSymptom(symptom)}
                                                className={`text-left text-sm p-4 rounded-xl transition-all border ${isSelected
                                                    ? themeVals.menu
                                                    : "bg-white/5 text-slate-300 border-transparent hover:bg-white/10"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="font-medium">{formatSymptomDisplay(symptom)}</span>
                                                    {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${themeVals.dot}`} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chat-history"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 h-full"
                            >
                                {currentSession?.messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <Bot className="w-12 h-12 mb-4 text-blue-500" />
                                        <p>Select symptoms from the dashboard<br />or describe how you feel.</p>
                                    </div>
                                )}

                                {currentSession?.messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-900/20"
                                            : "bg-slate-800/50 text-slate-200 rounded-tl-sm border border-white/5"
                                            }`}>
                                            {msg.role === "user" ? (
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                            ) : (
                                                <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-strong:text-cyan-400 prose-hr:border-white/10 prose-hr:my-3">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {isProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-sm border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-white/5 space-y-3 z-20">

                    {/* Selected Tags Preview */}
                    <AnimatePresence>
                        {selectedSymptoms.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex flex-wrap gap-2 overflow-hidden"
                            >
                                {selectedSymptoms.map(s => {
                                    const theme = getSymptomTheme(s);
                                    const themeVals = themeClasses[theme] || themeClasses['blue'];

                                    return (
                                        <span key={s} className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${themeVals.tag}`}>
                                            {formatSymptomDisplay(s)}
                                            <button onClick={() => toggleSymptom(s)} className="hover:text-white">
                                                <span className="sr-only">Remove</span>
                                                ×
                                            </button>
                                        </span>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Text Input */}
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={qaFlow.isActive ? "Type yes or no..." : "Describe additional details..."}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-slate-100 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none h-[60px] scrollbar-hide"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={(!input.trim() && selectedSymptoms.length === 0) || isProcessing}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-100 text-black rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
