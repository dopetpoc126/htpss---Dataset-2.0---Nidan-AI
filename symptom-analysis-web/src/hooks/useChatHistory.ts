"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { encryptData, decryptData } from "@/utils/encryption";

export type Message = {
    role: "user" | "ai";
    content: string;
};

export type ChatSession = {
    id: string;
    title: string;
    date: string;
    preview: string;
    messages: Message[];
};

const STORAGE_KEY = "nidan_chat_history";

export function useChatHistory() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const decrypted = decryptData<ChatSession[]>(stored);
            if (decrypted) setSessions(decrypted);
        }
    }, []);

    const saveSessions = (newSessions: ChatSession[]) => {
        setSessions(newSessions);
        const encrypted = encryptData(newSessions);
        localStorage.setItem(STORAGE_KEY, encrypted);
    };

    const createNewSession = useCallback(() => {
        const newSession: ChatSession = {
            id: uuidv4(),
            title: "New Analysis",
            date: new Date().toISOString(),
            preview: "Start a new conversation...",
            messages: [],
        };
        saveSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        return newSession.id;
    }, [sessions]);

    const addMessageToSession = useCallback((sessionId: string, message: Message) => {
        const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
        if (sessionIndex === -1) return;

        const updatedSessions = [...sessions];
        const session = updatedSessions[sessionIndex];

        session.messages.push(message);

        // Update preview and title if it's the first user message
        if (message.role === "user") {
            session.preview = message.content.substring(0, 30) + (message.content.length > 30 ? "..." : "");
            if (session.messages.length <= 2) { // 1 welcome + 1 user
                session.title = message.content.substring(0, 20) + (message.content.length > 20 ? "..." : "");
            }
        }

        session.date = new Date().toISOString();

        // Move to top
        updatedSessions.splice(sessionIndex, 1);
        updatedSessions.unshift(session);

        saveSessions(updatedSessions);
    }, [sessions]);

    const getCurrentSession = useCallback(() => {
        return sessions.find((s) => s.id === currentSessionId);
    }, [sessions, currentSessionId]);

    const clearHistory = useCallback(() => {
        saveSessions([]);
        setCurrentSessionId(null);
    }, []);

    return {
        sessions,
        currentSessionId,
        setCurrentSessionId,
        createNewSession,
        addMessageToSession,
        getCurrentSession,
        clearHistory
    };
}
