import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY_FROM_ENV = process.env.EXPO_PUBLIC_AUTH_TOKEN_KEY;

if (!AUTH_TOKEN_KEY_FROM_ENV) {
    throw new Error("CRITICAL ERROR: EXPO_PUBLIC_AUTH_TOKEN_KEY is not defined in environment variables. Please check your .env configuration.");
}

const AUTH_TOKEN_KEY: string = AUTH_TOKEN_KEY_FROM_ENV;

/**
 * Retrieves the authentication token from secure storage.
 * @returns {Promise<string | null>} The auth token or null if not found or an error occurs.
 */
export async function getAuthToken(): Promise<string | null> {
    try {
        const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        return authToken;
    } catch (error) {
        console.error("Error retrieving auth token:", error);
        return null;
    }
}

/**
 * Checks if the user is currently authenticated based on token presence.
 * @returns {Promise<boolean>} True if an auth token exists, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
    const token = await getAuthToken();
    return !!token;
}

/**
 * Stores the authentication token securely.
 * @param {string} token The token to store.
 * @returns {Promise<void>}
 */
export async function setAuthToken(token: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch (error) {
        console.error("Error storing auth token:", error);
        throw error;
    }
}

/**
 * Deletes the authentication token from secure storage.
 * @returns {Promise<void>}
 */
export async function deleteAuthToken(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error("Error deleting auth token:", error);
        throw error;
    }
}