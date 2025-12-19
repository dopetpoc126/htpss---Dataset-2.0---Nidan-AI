import React, { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { bodyOutlinePath, organs } from "@/data/anatomy";
import { cn } from "@/lib/utils";

interface BodyRevealProps {
    className?: string;
    style?: React.CSSProperties;
}

export function BodyReveal({ className, style }: BodyRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position relative to the container
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring animation for the mask
    const maskX = useSpring(mouseX, { stiffness: 300, damping: 30 });
    const maskY = useSpring(mouseY, { stiffness: 300, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full cursor-none", className)}
            style={style}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Layer 1: The Revealed Organs (Colorful) - Always rendered but masked */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg viewBox="0 0 300 650" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    {/* Main Body Ghost for context in reveal */}
                    <path
                        d={bodyOutlinePath}
                        fill="#1a1a2e"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                    />

                    {/* Organs */}
                    {organs.map((organ) => (
                        <motion.path
                            key={organ.id}
                            d={organ.path}
                            fill={organ.color}
                            stroke="white"
                            strokeWidth="0.5"
                            filter="url(#glow)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                    ))}
                </svg>
            </div>

            {/* Layer 2: The Silhouette Cover (Dark) - Masked out by cursor */}
            {/* Layer 2: The Silhouette Cover (Dark) - Masked out by cursor */}
            <motion.div
                className="absolute inset-0 z-20 bg-slate-950"
                style={{
                    maskImage: useMotionTemplate`radial-gradient(circle 100px at ${maskX}px ${maskY}px, transparent 0%, black 100%)`,
                    WebkitMaskImage: useMotionTemplate`radial-gradient(circle 100px at ${maskX}px ${maskY}px, transparent 0%, black 100%)`,
                }}
            >
                <svg viewBox="0 0 300 650" className="w-full h-full">
                    <path
                        d={bodyOutlinePath}
                        fill="#020617" // Slate-950 to match background
                        stroke="#1e293b" // Slate-800
                        strokeWidth="2"
                    />

                    <text x="50%" y="40%" textAnchor="middle" fill="white" className="text-xs opacity-30 pointer-events-none">
                        HOVER TO SCAN
                    </text>
                </svg>
            </motion.div>

            {/* Flashlight/Cursor Effect Ring */}
            <motion.div
                className="absolute z-30 w-32 h-32 border-2 border-white/20 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                style={{ x: maskX, y: maskY, opacity: isHovered ? 1 : 0 }}
            />
        </div>
    );
}

// Helper to push motion values to CSS variables for the mask

