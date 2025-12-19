
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, X, LogOut } from "lucide-react";
import { AnimatedBackground } from "@/components/effects/AnimatedBackground";
import { ChatInterface } from "@/components/features/ChatInterface";
import { useChatHistory } from "@/hooks/useChatHistory";
import { RegistrationForm } from "@/components/features/RegistrationForm";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { isRegistered, logout, user } = useUser();
  const {
    sessions,
    currentSessionId,
    createNewSession,
    addMessageToSession,
    getCurrentSession,
    setCurrentSessionId,
    clearHistory,
  } = useChatHistory();

  // Background Parallax for visual consistency
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  // Ensure a session exists when loading chat
  useEffect(() => {
    if (!isRegistered) return;

    if (sessions.length > 0 && !currentSessionId) {
      // Restore most recent session
      setCurrentSessionId(sessions[0].id);
    } else if (sessions.length === 0 && !currentSessionId) {
      // Create new if none exist
      createNewSession();
    }
  }, [isRegistered, sessions.length, currentSessionId, createNewSession, setCurrentSessionId]);

  const currentSession = getCurrentSession();

  const handleClearHistory = () => {
    if (confirm("Clear all chat history? This cannot be undone.")) {
      clearHistory();
      createNewSession();
    }
  };

  return (
    <div ref={containerRef} className="bg-black min-h-screen relative selection:bg-brand-500/30 font-outfit overflow-hidden">

      {/* --- ANIMATED BACKGROUND - Higher visibility --- */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <AnimatedBackground />
      </div>

      {/* --- Subtle overlay to keep content readable --- */}
      <div className="fixed inset-0 z-[2] bg-black/30 pointer-events-none" />
      <div className="fixed inset-0 z-[2] bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 w-full min-h-screen">
        <AnimatePresence mode="wait">
          {!isRegistered ? (
            <motion.div
              key="registration"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen flex items-center justify-center p-4"
            >
              <RegistrationForm />
            </motion.div>
          ) : (
            <motion.div
              key="chat-interface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="h-screen flex flex-col"
            >
              {/* Header - Compact */}
              <div className="w-full px-4 py-2 flex justify-between items-center bg-black/60 backdrop-blur-sm border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium text-slate-200 tracking-tight">
                    Symptom Analysis
                  </h2>
                </div>
                <div className="flex gap-2 items-center">
                  {user?.email && (
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {user.email}
                    </span>
                  )}
                  <button
                    onClick={() => createNewSession()}
                    className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg transition-colors"
                  >
                    New Chat
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-colors"
                  >
                    Clear History
                  </button>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs bg-slate-500/20 hover:bg-slate-500/40 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                    title="Sign out"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>

              {/* Chat Interface - Full remaining height */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  currentSession={currentSession}
                  onSendMessage={addMessageToSession}
                  className="h-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
