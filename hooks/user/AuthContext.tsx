// hooks/user/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import * as AuthUtils from "../../utils/authUtils";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

type AuthContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    logoutAndRedirect: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuthStatus = async () => {
            setIsLoading(true);
            try {
                const hasToken = await AuthUtils.isAuthenticated();
                setAuthenticated(hasToken);
            } catch (error) {
                console.error("Failed to check authentication status:", error);
                setAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []); // Le tableau vide [] assure que cela ne s'exécute qu'une fois au montage

    const login = useCallback(async (token: string) => {
        try {
            await AuthUtils.setAuthToken(token);
            setAuthenticated(true);
            console.log("User logged in and token stored.");
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AuthUtils.deleteAuthToken();
            setAuthenticated(false);
            console.log("User logged out and token deleted.");
        } catch (error) {
            console.error("Logout failed:", error);
            // Gérer l'erreur
            throw error;
        }
    }, []);

    const logoutAndRedirect = useCallback(async () => {
        try {
            await AuthUtils.deleteAuthToken();
            setAuthenticated(false);
            console.log("User logged out and token deleted.");
            router.replace("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            throw error;
        }
    }, [router]);

    if (isLoading) {
        // Optionnel: Vous pouvez retourner un écran de chargement global ici
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" />
            </View>
        );
    }
    return (
        <AuthContext.Provider
            value={{ isAuthenticated, isLoading, login, logout, logoutAndRedirect }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
