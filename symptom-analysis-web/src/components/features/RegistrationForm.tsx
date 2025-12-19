"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, UserDetails } from "@/context/UserContext";
import { ArrowRight, User, Calendar, Activity, Pill, Dna, Mail, Lock, LogIn } from "lucide-react";

type AuthMode = "login" | "register";

export function RegistrationForm() {
    const { registerUser, login, error: authError, registerUserLocal } = useUser();
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formData, setFormData] = useState<UserDetails>({
        name: "",
        dob: "",
        gender: "prefer-not-to-say",
        medicalHistory: "",
        medications: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (mode === "login") {
                const success = await login(email, password);
                if (!success) {
                    setError(authError || "Login failed. Check your credentials.");
                }
            } else {
                const success = await registerUser(email, password, formData);
                if (!success) {
                    setError(authError || "Registration failed.");
                }
            }
        } catch (e) {
            setError("Service unavailable. Try again later.");
        }

        setIsSubmitting(false);
    };

    // Quick demo mode - skip auth
    const handleDemoMode = () => {
        registerUserLocal({
            name: "Demo User",
            dob: "1990-01-01",
            gender: "Other",
            medicalHistory: "",
            medications: ""
        });
    };

    const inputClass = "w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
            {/* Decorative glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
                <div className="mb-8 text-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center p-3 cursor-default"
                    >
                        <Dna className="w-12 h-12 text-blue-400" />
                    </motion.div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mt-4">
                        {mode === "login" ? "Welcome Back" : "Patient Intake"}
                    </h2>
                    <p className="text-slate-400 mt-2">
                        {mode === "login"
                            ? "Sign in to access your medical history"
                            : "Create your secure medical profile"
                        }
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex justify-center gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => setMode("login")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${mode === "login"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                : "text-slate-400 hover:text-white"
                            }`}
                    >
                        <LogIn className="w-4 h-4 inline mr-2" />
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("register")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${mode === "register"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                : "text-slate-400 hover:text-white"
                            }`}
                    >
                        <User className="w-4 h-4 inline mr-2" />
                        Register
                    </button>
                </div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email & Password (always shown) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email
                            </label>
                            <input
                                required
                                type="email"
                                className={inputClass}
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <input
                                required
                                type="password"
                                className={inputClass}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Registration-only fields */}
                    <AnimatePresence>
                        {mode === "register" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Full Name
                                        </label>
                                        <input
                                            required={mode === "register"}
                                            type="text"
                                            className={inputClass}
                                            placeholder="Enter your full name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    {/* DOB */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Date of Birth
                                        </label>
                                        <input
                                            required={mode === "register"}
                                            type="date"
                                            className={`${inputClass} [color-scheme:dark]`}
                                            value={formData.dob}
                                            onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Gender</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <button
                                                type="button"
                                                key={g}
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                className={`px-4 py-2 rounded-xl text-sm transition-all border ${formData.gender === g
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-slate-900/30 border-white/5 text-slate-400 hover:bg-slate-800'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* History */}
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400 flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Medical History (Optional)
                                    </label>
                                    <textarea
                                        className={`${inputClass} min-h-[60px] resize-none`}
                                        placeholder="Any known conditions, surgeries, or allergies..."
                                        value={formData.medicalHistory}
                                        onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
                                    />
                                </div>

                                {/* Medications */}
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400 flex items-center gap-2">
                                        <Pill className="w-4 h-4" /> Current Medications (Optional)
                                    </label>
                                    <textarea
                                        className={`${inputClass} min-h-[60px] resize-none`}
                                        placeholder="List current prescriptions and dosages..."
                                        value={formData.medications}
                                        onChange={e => setFormData({ ...formData, medications: e.target.value })}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">
                                {mode === "login" ? "Signing in..." : "Creating account..."}
                            </span>
                        ) : (
                            <>
                                {mode === "login" ? "Sign In" : "Create Account"}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Demo Mode Link */}
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleDemoMode}
                        className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                    >
                        Skip auth → Try Demo Mode
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
