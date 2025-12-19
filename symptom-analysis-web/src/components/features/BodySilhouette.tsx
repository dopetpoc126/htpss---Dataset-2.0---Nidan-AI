"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { localizedSymptoms } from "@/data/symptoms";
import { Check, X } from "lucide-react";

interface BodySilhouetteProps {
    selectedSymptoms: string[];
    onToggle: (symptom: string) => void;
    onPartSelect: (part: string | null, method?: 'hover' | 'click') => void;
    activePart: string | null;
    hoveredPart: string | null;
    onHover: (part: string | null) => void;
}

export function BodySilhouette({ selectedSymptoms, onToggle, onPartSelect, activePart, hoveredPart, onHover }: BodySilhouetteProps) {

    const partNames: Record<string, string> = {
        "head": "Head, Face & Neck",
        "chest": "Chest & Back",
        "stomach": "Abdomen & Pelvic",
        "arm-left": "Left Arm & Hand",
        "arm-right": "Right Arm & Hand",
        "leg-left": "Left Leg & Foot",
        "leg-right": "Right Leg & Foot"
    };

    // Cursor Spotlight Logic
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 120, mass: 0.5 }; // Fluid, slightly floaty
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - 100); // Center the 200px spotlight
        mouseY.set(e.clientY - rect.top - 100);
    };

    const isPartActive = (part: string) => activePart === part || hoveredPart === part;

    // Zoom Focus Variants
    const zoomVariants = {
        default: { scale: 1, x: 0, y: 0 },
        head: { scale: 2.5, x: 0, y: 280 },
        chest: { scale: 2.2, x: 0, y: 120 },
        stomach: { scale: 2.2, x: 0, y: -50 },
        "arm-left": { scale: 1.8, x: 60, y: 50 },
        "arm-right": { scale: 1.8, x: -60, y: 50 },
        "leg-left": { scale: 1.6, x: 40, y: -200 },
        "leg-right": { scale: 1.6, x: -40, y: -200 }
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="h-full relative flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-white/5 overflow-hidden group cursor-crosshair"
        >
            {/* Fluid Cursor Spotlight */}
            <motion.div
                className="absolute w-[200px] h-[200px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none z-0 mix-blend-screen"
                style={{ x: springX, y: springY }}
            />

            {/* Instruction Tooltip / Part Name Display */}
            {/* Context: Only show this tooltip if a part is ALREADY selected (header is locked) and user is exploring others.
                Otherwise, the main header handles the display. */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md transition-all duration-300 pointer-events-none z-10 whitespace-nowrap bg-slate-900/90 border-blue-500/50 text-blue-200 shadow-lg shadow-blue-500/20 ${(activePart && hoveredPart) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}>
                {hoveredPart ? partNames[hoveredPart] : ""}
            </div>

            <div className="relative h-full w-full flex items-center justify-center pt-16 pb-4 px-4">
                {/* The SVG - Zoomable */}
                <motion.svg
                    initial="default"
                    animate={activePart && zoomVariants[activePart as keyof typeof zoomVariants] ? activePart : "default"}
                    variants={zoomVariants}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    id="body"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 198.81 693.96"
                    preserveAspectRatio="xMidYMid meet"
                    className="h-full w-auto max-w-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                    <style>
                        {`
                            .body-part { fill: rgba(255,255,255,0.05); stroke: rgba(255,255,255,0.2); stroke-width: 1px; transition: all 0.3s ease; cursor: pointer; }
                            .body-part:hover { fill: rgba(255,255,255,0.1); stroke: rgba(255,255,255,0.5); }
                            
                            /* Interactive Colors */
                            .active-head { stroke: #a78bfa !important; fill: rgba(167,139,250,0.4) !important; filter: drop-shadow(0 0 8px rgba(167,139,250,0.5)); }
                            .active-chest { stroke: #60a5fa !important; fill: rgba(96,165,250,0.4) !important; filter: drop-shadow(0 0 8px rgba(96,165,250,0.5)); }
                            .active-stomach { stroke: #34d399 !important; fill: rgba(52,211,153,0.4) !important; filter: drop-shadow(0 0 8px rgba(52,211,153,0.5)); }
                            .active-arm { stroke: #fbbf24 !important; fill: rgba(251,191,36,0.4) !important; filter: drop-shadow(0 0 8px rgba(251,191,36,0.5)); }
                            .active-leg { stroke: #fb7185 !important; fill: rgba(251,113,133,0.4) !important; filter: drop-shadow(0 0 8px rgba(251,113,133,0.5)); }
                        `}
                    </style>

                    {/* Right Arm Group -> Becomes Left */}
                    <g
                        onClick={() => onPartSelect("arm-left", "click")}
                        onMouseEnter={() => onHover("arm-left")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("arm-left") ? "active-arm" : ""}
                    >
                        <path className={`body-part hand-right ${isPartActive("arm-left") ? "active-arm" : ""}`} d="M22.25,348.54c0,5.26,2.87,6.53,5.42,11.47S27,375.94,27,375.94c2.23,14.82.48,14.82-2.23,14.66s-6.53-12.75-6.53-12.75l-4-1.91s-3.19,3.51-.8,8.92,16.25,12.75,14.66,14.66-6.37-.16-6.37-0.16,9.56,9.24,8.45,10.36a3.53,3.53,0,0,1-2.87.8s2.71,3.19.48,4.62-8.6-3.19-8.6-3.19C10.46,410.69,2,389.33.74,386.94s2.07-30.28,3-40.64Z" />
                        <path className={`body-part forearm-right ${isPartActive("arm-left") ? "active-arm" : ""}`} d="M43.76,195.54c-2.39,3.19-4.94,16.09-5.1,25.82s-3.19,23.27-5.74,29,2.23,35.22-.32,50.36-10.36,42.55-10.36,47.81L3.76,346.3c1-10.36-5.42-86.06-3.35-90.68s4-15.46,2.71-22.63S0.42,189.49,4.4,179.92s-0.8-27.25,9.88-44.62,35.06-16.73,35.06-16.73Z" />
                    </g>

                    {/* Left Arm Group -> Becomes Right */}
                    <g
                        onClick={() => onPartSelect("arm-right", "click")}
                        onMouseEnter={() => onHover("arm-right")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("arm-right") ? "active-arm" : ""}
                    >
                        <path className={`body-part hand-left ${isPartActive("arm-right") ? "active-arm" : ""}`} d="M175.56,348.54c0,5.26-2.87,6.53-5.42,11.47s0.64,15.94.64,15.94c-2.23,14.82-.48,14.82,2.23,14.66s6.53-12.75,6.53-12.75l4-1.91s3.19,3.51.8,8.92-16.25,12.75-14.66,14.66,6.37-.16,6.37-.16-9.56,9.24-8.45,10.36a3.53,3.53,0,0,0,2.87.8s-2.71,3.19-.48,4.62,8.61-3.19,8.61-3.19c8.76-1.28,17.21-22.63,18.49-25s-2.07-30.28-3-40.64Z" />
                        <path className={`body-part forearm-left ${isPartActive("arm-right") ? "active-arm" : ""}`} d="M194,346.3c-1-10.36,5.42-86.06,3.35-90.68s-4-15.46-2.71-22.63,2.71-43.51-1.27-53.07,0.8-27.25-9.88-44.62-35.06-16.73-35.06-16.73l5.58,77c2.39,3.19,4.94,16.09,5.1,25.82s3.19,23.27,5.74,29-2.23,35.22.32,50.36,10.36,42.55,10.36,47.81Z" />
                    </g>

                    {/* Right Leg Group -> Becomes Left */}
                    <g
                        onClick={() => onPartSelect("leg-left", "click")}
                        onMouseEnter={() => onHover("leg-left")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("leg-left") ? "active-leg" : ""}
                    >
                        <path className={`body-part thigh-right ${isPartActive("leg-left") ? "active-leg" : ""}`} d="M35.11,508.33c1.67-14.63,4.15-24,4.67-31.36,0.8-11.31-5.26-89.88-4.46-111.07L97,368.29s0.32,12.43-2.07,21-7.33,19-7.33,33.78-2.23,48.45-6.53,62.31c-3.08,9.94-7,16-7.48,22.91H35.11Z" />
                        <path className={`body-part calf-right ${isPartActive("leg-left") ? "active-leg" : ""}`} d="M52.37,640.8c0.48-6.53-4.14-41.75-8.76-55.3s-10-16.25-10-48.76a248.59,248.59,0,0,1,1.54-28.4H73.57a21.52,21.52,0,0,0,1.27,8.8c4,11.47,4.62,37.45.48,54.5s-1.75,52.27-1.44,55.3Z" />
                        <path className={`body-part foot-right ${isPartActive("leg-left") ? "active-leg" : ""}`} d="M73.88,626.94c0.32,3,3.35,6.05-4.94,12.91s-3.51,9.56-1.75,20.4,2.55,31.56-3.35,32.51S66.39,691,66.39,691c-5.9.48-22.79,0.16-25.66-3.19s6.85-26.93,7.81-30.28,0.8-6.69.91-9.4,2.92-7.33,2.92-7.33Z" />
                    </g>

                    {/* Left Leg Group -> Becomes Right */}
                    <g
                        onClick={() => onPartSelect("leg-right", "click")}
                        onMouseEnter={() => onHover("leg-right")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("leg-right") ? "active-leg" : ""}
                    >
                        <path className={`body-part calf-left ${isPartActive("leg-right") ? "active-leg" : ""}`} d="M145.44,640.8c-0.48-6.53,4.14-41.75,8.76-55.3s10-16.25,10-48.76a248.59,248.59,0,0,0-1.54-28.4H124.24a21.52,21.52,0,0,1-1.27,8.8c-4,11.47-4.62,37.45-.48,54.5s1.75,52.27,1.44,55.3Z" />
                        <path className={`body-part foot-left ${isPartActive("leg-right") ? "active-leg" : ""}`} d="M123.93,626.94c-0.32,3-3.35,6.05-4.94,12.91s3.51,9.56,1.75,20.4-2.55,31.56,3.35,32.51S130.33,691,130.33,691c5.9,0.48,22.79.16,25.66-3.19s-6.85-26.93-7.81-30.28-0.8-6.69-.91-9.4-2.92-7.33-2.92-7.33Z" />
                        <path className={`body-part thigh-left ${isPartActive("leg-right") ? "active-leg" : ""}`} d="M162.7,508.33c-1.67-14.63-4.15-24-4.67-31.36-0.8-11.31,5.26-89.88,4.46-111.07l-61.67,2.39s-0.32,12.43,2.07,21,7.33,19,7.33,33.78,2.23,48.45,6.53,62.31c3.08,9.94,7,16,7.48,22.91H162.7Z" />
                    </g>

                    {/* Head Group */}
                    <g
                        onClick={() => onPartSelect("head", "click")}
                        onMouseEnter={() => onHover("head")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("head") ? "active-head" : ""}
                    >
                        <path className={`body-part head ${isPartActive("head") ? "active-head" : ""}`} d="M122.33,106.46c-3.19-4.62-1.59-24.7-1.59-24.7,6.21-4.62,6.85-18.17,6.85-18.17s0.48,2.39,2.87.8,3.19-17.69,2.55-19.12-3.35-1-3.35-1,3.82-21-2.71-31.87S105,0,98.9,0s-21.51,1.59-28,12.43S68.15,44.3,68.15,44.3s-2.71-.48-3.35,1S65,62.79,67.35,64.38s2.87-.8,2.87-0.8,0.64,13.55,6.85,18.17c0,0,1.59,20.08-1.59,24.7h46.85Z" />
                    </g>

                    {/* Torso Upper */}
                    <g
                        onClick={() => onPartSelect("chest", "click")}
                        onMouseEnter={() => onHover("chest")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("chest") ? "active-chest" : ""}
                    >
                        <path className={`body-part torso-upper ${isPartActive("chest") ? "active-chest" : ""}`} d="M147.08,247.36c-0.06-7.1.64-14.06,2.71-19.47,5.31-13.86,1.87-35.54,4.26-32.35l-5.58-77s-22.95-7.49-26.13-12.11H75.48c-3.19,4.62-26.13,12.11-26.13,12.11l-5.58,77C46.15,192.36,42.71,214,48,227.9c2.07,5.41,2.78,12.37,2.71,19.47h96.34Z" />
                    </g>

                    {/* Torso Lower */}
                    <g
                        onClick={() => onPartSelect("stomach", "click")}
                        onMouseEnter={() => onHover("stomach")}
                        onMouseLeave={() => onHover(null)}
                        className={isPartActive("stomach") ? "active-stomach" : ""}
                    >
                        <path className={`body-part torso-lower ${isPartActive("stomach") ? "active-stomach" : ""}`} d="M50.73,247.36a136.19,136.19,0,0,1-3.62,28.82c-2.55,10.36-11,68.53-11.79,89.72L97,368.29l1.91-.82,1.91,0.82,61.67-2.39c-0.8-21.2-9.24-79.36-11.79-89.72a136.21,136.21,0,0,1-3.62-28.82H50.73Z" />
                    </g>
                </motion.svg>
            </div>
        </div>
    );
}

