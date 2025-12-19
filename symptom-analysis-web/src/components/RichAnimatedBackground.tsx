"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const colors = [
  "bg-indigo-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-cyan-500",
];

const Shape = ({ delay }: { delay: number }) => {
  const controls = useAnimation();
  const [initialParams, setInitialParams] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    color: "",
    width: 0,
    height: 0,
    borderRadius: "",
    opacity: 0.1,
  });

  useEffect(() => {
    // Randomize initial properties on client side only to avoid hydration mismatch
    const size = getRandomInt(100, 400);
    setInitialParams({
      x: getRandomInt(-100, 100), // Relative percentage start
      y: getRandomInt(-100, 100),
      scale: Math.random() * 0.5 + 0.5,
      rotate: getRandomInt(0, 360),
      color: colors[getRandomInt(0, colors.length - 1)],
      width: size,
      height: size,
      borderRadius: `${getRandomInt(30, 70)}% ${getRandomInt(30, 70)}% ${getRandomInt(30, 70)}% ${getRandomInt(30, 70)}% / ${getRandomInt(30, 70)}% ${getRandomInt(30, 70)}% ${getRandomInt(30, 70)}% ${getRandomInt(30, 70)}%`,
      opacity: Math.random() * 0.15 + 0.05,
    });
  }, []);

  useEffect(() => {
    if (!initialParams.color) return;

    controls.start({
      x: [
        `${getRandomInt(0, 100)}vw`,
        `${getRandomInt(0, 100)}vw`,
        `${getRandomInt(0, 100)}vw`,
      ],
      y: [
        `${getRandomInt(0, 100)}vh`,
        `${getRandomInt(0, 100)}vh`,
        `${getRandomInt(0, 100)}vh`,
      ],
      rotate: [0, 180, 360],
      scale: [1, 1.2, 0.8, 1],
      transition: {
        duration: getRandomInt(20, 40),
        repeat: Infinity,
        repeatType: "reverse",
        ease: "linear",
        delay: delay,
      },
    });
  }, [controls, delay, initialParams]);

  if (!initialParams.color) return null;

  return (
    <motion.div
      className={`absolute ${initialParams.color} mix-blend-screen blur-3xl`}
      style={{
        width: initialParams.width,
        height: initialParams.height,
        borderRadius: initialParams.borderRadius,
        opacity: initialParams.opacity,
        top: 0, // Positioned absolute relative to container, manipulated by translate
        left: 0,
      }}
      animate={controls}
    />
  );
};

export default function RichAnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  
  // Use a fixed number of shapes for density
  const shapeCount = 15; 
  const shapes = Array.from({ length: shapeCount });

  useEffect(() => {
      setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 opacity-80" />
      
      {shapes.map((_, i) => (
        <Shape key={i} delay={i * 2} />
      ))}

      {/* Overlay for noise or texture if desired (optional) */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
    </div>
  );
}
