"use client";

import React from "react";
import { motion } from "framer-motion";

export function AnimatedBackground() {
    const shapes = [
        // Complex Gradient Orbs (Organic) - Increased opacity
        { type: "orb", top: "15%", left: "15%", size: 400, color: "from-cyan-500/20 to-blue-600/15", delay: 0, duration: 25 },
        { type: "orb", top: "60%", left: "85%", size: 500, color: "from-teal-500/20 to-emerald-600/15", delay: 5, duration: 30 },

        // Tech Geometry (Hexagons) - More visible
        { type: "hex", top: "20%", left: "80%", size: 120, color: "text-slate-600", delay: 2, duration: 20 },
        { type: "hex", top: "75%", left: "10%", size: 180, color: "text-slate-600", delay: 4, duration: 22 },

        // Medical Symbols (Crosses/Plus) - More visible
        { type: "cross", top: "40%", left: "50%", size: 60, color: "text-cyan-700", delay: 1, duration: 18 },
        { type: "cross", top: "85%", left: "30%", size: 40, color: "text-teal-700", delay: 6, duration: 15 },

        // Rings (Data/Scanning) - More visible
        { type: "ring", top: "30%", left: "20%", size: 80, color: "border-cyan-600", delay: 3, duration: 12 },
        { type: "ring", top: "10%", left: "60%", size: 150, color: "border-indigo-700", delay: 7, duration: 28 },
    ];

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {shapes.map((shape, i) => (
                <Shape key={i} {...shape} />
            ))}

            {/* Noise Texture Overlay for "Film Grain" look */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
        </div>
    );
}

function Shape({ type, top, left, size, color, delay, duration }: any) {
    const isOrb = type === "orb";
    const isRing = type === "ring";

    // Random movement range
    const moveRange = 50;

    const variants = {
        animate: {
            y: [0, -moveRange, 0],
            x: [0, moveRange / 2, 0],
            rotate: isOrb ? 0 : [0, 180, 360],
            scale: [1, 1.1, 1],
            opacity: isOrb ? [0.4, 0.6, 0.4] : [0.2, 0.5, 0.2],
            transition: {
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut" as const, // Explicit cast to fix lint error
                delay: delay,
            }
        }
    };

    return (
        <motion.div
            className={`absolute flex items-center justify-center ${isOrb ? `bg-gradient-to-tr ${color} blur-[80px] rounded-full` : ""
                } ${isRing ? `rounded-full border-2 ${color}` : ""
                } ${!isOrb && !isRing ? color : ""}`}
            style={{
                top,
                left,
                width: size,
                height: size,
            }}
            variants={variants}
            animate="animate"
        >
            {!isOrb && !isRing && (
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current opacity-80">
                    {type === "hex" && (
                        <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" />
                    )}
                    {type === "cross" && (
                        <path d="M35 10 H65 V35 H90 V65 H65 V90 H35 V65 H10 V35 H35 Z" /> // Slightly thinner cross
                    )}
                </svg>
            )}
        </motion.div>
    );
}
