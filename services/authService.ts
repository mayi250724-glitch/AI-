
import { UserProfile } from "../types";
import { getApiConfig } from "./geminiService";

const USER_STORAGE_KEY = 'yesir_certified_user';
const TOKEN_KEY = 'yesir_auth_token';

// Check if certified (exists locally or has token)
export const isCertified = (): boolean => {
    const config = getApiConfig();
    if (config.enableBackend) {
        return !!localStorage.getItem(TOKEN_KEY);
    }
    return !!localStorage.getItem(USER_STORAGE_KEY);
};

// Get current user profile
export const getCurrentUser = (): UserProfile | null => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
};

// Certify the user (Login)
export const certifyUser = async (username: string, password?: string): Promise<UserProfile> => {
    const config = getApiConfig();

    if (config.enableBackend) {
        // REAL BACKEND MODE
        try {
            const response = await fetch(`${config.backendUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error("Login failed: " + response.statusText);
            }

            const data = await response.json();
            const user = data.user;
            const token = data.token;

            if (token) localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            return user;

        } catch (e: any) {
            console.error("Backend login error:", e);
            throw new Error(e.message || "Backend connection failed");
        }
    } else {
        // MOCK MODE (Demo)
        const newUser: UserProfile = {
            id: Date.now().toString(),
            username,
            level: 'LV.1 认证导演',
            status: '已认证 (Certified)',
            avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${username}`,
            phone: '已绑定',
            email: '已绑定',
            inviteCode: 'DEMO888',
            invitedCount: 0,
            points: 50
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        return newUser;
    }
};

// New: Register with Invite Code
export const registerUser = async (username: string, password?: string, inviteCode?: string): Promise<UserProfile> => {
    const config = getApiConfig();

    if (config.enableBackend) {
        try {
            const response = await fetch(`${config.backendUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, inviteCode })
            });

            if (!response.ok) {
                throw new Error("Registration failed: " + response.statusText);
            }

            const data = await response.json();
            const user = data.user;
            const token = data.token;

            if (token) localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            return user;
        } catch (e: any) {
            throw new Error(e.message || "Backend registration failed");
        }
    } else {
        throw new Error("Local mode does not support full registration simulation. Use login.");
    }
};

export const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
};

// Helper to get auth header for other services
export const getAuthHeader = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
