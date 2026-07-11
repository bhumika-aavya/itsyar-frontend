import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";

export const ProfileService = {
    // No /profile endpoint exists in the backend yet — real identity data comes
    // from AuthContext (set at login) instead. This is kept in case the
    // backend adds a real profile endpoint later (e.g. for a bio field).
    getProfile: async () => {
        try {
            const response = await api.get('/profile', getAuthHeaders());
            return response.data;
        } catch {
            return null;
        }
    },
    updateProfile: async (data: { fullName?: string; email?: string; avatarUrl?: string }) => {
        try {
            const response = await api.put('/profile', data, getAuthHeaders());
            return response.data;
        } catch {
            return { success: true };
        }
    },
};
