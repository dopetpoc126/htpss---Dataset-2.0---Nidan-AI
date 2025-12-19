"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, Zap, Dna } from "lucide-react";

export function SystemBoot() {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState("INITIALIZING KERNEL...");

    useEffect(() => {
        // Check if we already booted this session
        const hasBooted = sessionStorage.getItem("hasBooted");
        if (hasBooted) {
            setIsVisible(false);
            return;
        }

        const steps = [
            { p: 20, text: "LOADING BIOMETRIC MODULES..." },
            { p: 45, text: "CALIBRATING NEURAL NETWORKS..." },
            { p: 70, text: "ESTABLISHING SECURE CONNECTION..." },
            { p: 90, text: "SYNCHRONIZING DATABASES..." },
            { p: 100, text: "SYSTEM READY" },
        ];

        let currentStep = 0;

        // Simulate loading
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsVisible(false);
                        sessionStorage.setItem("hasBooted", "true");
                    }, 800);
                    return 100;
                }

                // Check if we reached a step threshold
                const nextStep = steps[currentStep];
                if (nextStep && prev + 1 >= nextStep.p) {
                    setStep(nextStep.text);
                    currentStep++;
                }

                return prev + 1; // Increment
            });
        }, 30); // ~3 seconds total

        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30"
                    exit={{ y: "-100%", transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    <div className="w-full max-w-md space-y-8 relative">

                        {/* Center Logo/Icon Pulse */}
                        <div className="flex justify-center mb-10">
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-50"
                                />
                                <Dna className="w-20 h-20 text-cyan-400 relative z-10" />
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs tracking-widest text-cyan-600">
                                <span>NIDAN_OS V2.42</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1 w-full bg-cyan-900/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Status Text & Grid */}
                        <div className="h-8 flex items-center justify-center">
                            <span className="text-sm tracking-widest animate-pulse">{step}</span>
                        </div>

                        {/* Decorative Grid Lines */}
                        <div className="absolute top-[-50px] left-[-20%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-cyan-900 to-transparent" />
                        <div className="absolute bottom-[-50px] left-[-20%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-cyan-900 to-transparent" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
