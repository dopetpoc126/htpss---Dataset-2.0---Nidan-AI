
const API_BASE_URL = "http://localhost:8000";

// ===== Token Management =====

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
    if (token) {
        localStorage.setItem("auth_token", token);
    } else {
        localStorage.removeItem("auth_token");
    }
}

export function getAuthToken(): string | null {
    if (!authToken) {
        authToken = localStorage.getItem("auth_token");
    }
    return authToken;
}

function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

// ===== Types for new API response format =====

export type Disease = {
    name: string;
    probability?: number;
    prob?: number;  // Legacy compatibility
    score?: number;
};

export type DiagnosisReport = {
    disease: string;
    confidence: string;
    specialist: string;
    reasoning: string;
    advice: string;
    urgency?: string;
    triage_level?: "immediate" | "delayed" | "minimal" | "expectant";
    key_symptoms?: string[];
    ruled_out?: string[];
    key_indicators?: string[];
};

export type DiagnoseResponse = {
    action: "show_report" | "ask_question";
    confidence_score: number;
    top_diseases: Disease[];
    // For show_report
    report?: DiagnosisReport;
    // For ask_question
    question?: string;
    question_number?: number;
};

export type AskResponse = {
    action: "ask_question" | "show_report";
    question?: string;
    question_number?: number;
    report?: DiagnosisReport;
};

export type QAEntry = {
    question: string;
    answer: string;
};

// ===== Auth Types =====

export type UserProfile = {
    id: string;
    email: string;
    name: string;
    dob: string;
    gender: string;
    medical_history: string;
    medications: string;
    created_at?: string;
};

export type AuthResponse = {
    success: boolean;
    user_id?: string;
    email?: string;
    access_token?: string;
    refresh_token?: string;
    profile?: UserProfile;
    error?: string;
};

export type DiagnosticEvent = {
    id: string;
    symptoms: string[];
    predicted_disease: string;
    confidence_score: number;
    triage_level: string;
    specialist_recommended: string;
    created_at: string;
};

// ===== Auth API Functions =====

export async function registerUser(
    email: string,
    password: string,
    profile: {
        name?: string;
        dob?: string;
        gender?: string;
        medical_history?: string;
        medications?: string;
    }
): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...profile }),
    });
    const data = await response.json();
    if (data.access_token) {
        setAuthToken(data.access_token);
    }
    return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.access_token) {
        setAuthToken(data.access_token);
    }
    return data;
}

export async function getProfile(): Promise<{ success: boolean; profile?: UserProfile }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        return { success: false };
    }
    return response.json();
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
    });
    return response.json();
}

export async function getDiagnosticHistory(): Promise<{ success: boolean; events: DiagnosticEvent[] }> {
    const response = await fetch(`${API_BASE_URL}/events`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        return { success: false, events: [] };
    }
    return response.json();
}

export function logout() {
    setAuthToken(null);
}

// ===== Diagnosis API Functions =====

export async function diagnoseSymptoms(
    symptoms: string[],
    history?: string,
    medications?: string
): Promise<DiagnoseResponse> {
    const response = await fetch(`${API_BASE_URL}/diagnose`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ symptoms, history, medications }),
    });
    if (!response.ok) throw new Error("Diagnosis API failed");
    return response.json();
}

export async function askFollowUp(
    symptoms: string[],
    top_diseases: Disease[],
    question_number: number,
    qa_history: QAEntry[]
): Promise<AskResponse> {
    const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            symptoms,
            top_diseases,
            question_number,
            qa_history
        }),
    });
    if (!response.ok) throw new Error("Ask API failed");
    return response.json();
}

// Legacy function for backward compatibility
export async function finalizeDiagnosis(
    symptoms: string[],
    top_diseases: Disease[],
    conversation_history: string
): Promise<DiagnosisReport> {
    const response = await fetch(`${API_BASE_URL}/finalize`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            symptoms,
            top_diseases,
            conversation_history
        }),
    });
    if (!response.ok) throw new Error("Finalize API failed");
    return response.json();
}

