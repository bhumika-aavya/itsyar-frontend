const AUTH_TOKEN_STORAGE_KEY = "accessToken";

export const getStoredAccessToken = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const getAuthHeaders = () => {
    const token = getStoredAccessToken();

    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
        },
    };
};
