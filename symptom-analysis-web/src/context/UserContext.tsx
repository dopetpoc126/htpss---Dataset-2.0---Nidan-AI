"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
    registerUser as apiRegister,
    loginUser as apiLogin,
    getProfile,
    logout as apiLogout,
    getAuthToken,
    UserProfile
} from "@/api/client";

export type UserDetails = {
    name: string;
    dob: string;
    gender: string;
    medicalHistory: string;
    medications: string;
    email?: string;
};

type UserContextType = {
    user: UserDetails | null;
    isRegistered: boolean;
    isLoading: boolean;
    error: string | null;
    registerUser: (email: string, password: string, details: UserDetails) => Promise<boolean>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    // Legacy support - registers locally without backend
    registerUserLocal: (details: UserDetails) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function profileToUserDetails(profile: UserProfile): UserDetails {
    return {
        name: profile.name || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        medicalHistory: profile.medical_history || "",
        medications: profile.medications || "",
        email: profile.email
    };
}

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        async function checkAuth() {
            const token = getAuthToken();
            if (token) {
                try {
                    const result = await getProfile();
                    if (result.success && result.profile) {
                        setUser(profileToUserDetails(result.profile));
                        setIsRegistered(true);
                    }
                } catch (e) {
                    console.log("No valid session found");
                }
            }
            setIsLoading(false);
        }
        checkAuth();
    }, []);

    const registerUser = async (email: string, password: string, details: UserDetails): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            const result = await apiRegister(email, password, {
                name: details.name,
                dob: details.dob,
                gender: details.gender,
                medical_history: details.medicalHistory,
                medications: details.medications
            });

            if (result.success) {
                setUser({ ...details, email });
                setIsRegistered(true);
                setIsLoading(false);
                return true;
            } else {
                setError(result.error || "Registration failed");
                setIsLoading(false);
                return false;
            }
        } catch (e) {
            setError("Registration service unavailable. Using local mode.");
            // Fallback to local registration
            setUser(details);
            setIsRegistered(true);
            setIsLoading(false);
            return true;
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            const result = await apiLogin(email, password);

            if (result.success) {
                // Profile might be null if user exists but profile wasn't created
                if (result.profile) {
                    setUser(profileToUserDetails(result.profile));
                } else {
                    // Create minimal user from login response
                    setUser({
                        name: "",
                        dob: "",
                        gender: "",
                        medicalHistory: "",
                        medications: "",
                        email: result.email || email
                    });
                }
                setIsRegistered(true);
                setIsLoading(false);
                return true;
            } else {
                setError(result.error || "Invalid credentials");
                setIsLoading(false);
                return false;
            }
        } catch (e) {
            setError("Login service unavailable");
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        apiLogout();
        setUser(null);
        setIsRegistered(false);
        setError(null);
    };

    // Legacy local registration (no backend)
    const registerUserLocal = (details: UserDetails) => {
        setUser(details);
        setIsRegistered(true);
    };

    return (
        <UserContext.Provider value={{
            user,
            isRegistered,
            isLoading,
            error,
            registerUser,
            login,
            logout,
            registerUserLocal
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
