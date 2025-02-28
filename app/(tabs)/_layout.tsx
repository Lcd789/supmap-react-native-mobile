import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/user/AuthContext";

export default function TabsLayout() {
    const { isAuthenticated } = useAuth(); // ✅ Utilisation du contexte d'authentification
    const [authState, setAuthState] = useState(isAuthenticated);

    // ✅ Met à jour `authState` à chaque changement d'authentification
    useEffect(() => {
        setAuthState(isAuthenticated);
    }, [isAuthenticated]);

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: "#ffd33d" }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "SUPMAP",
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "My profile",
                    href: isAuthenticated ? "/profile" : null,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="login"
                options={{
                    title: "Login",
                    href: !isAuthenticated ? "/login" : null,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "log-in" : "log-in-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="register"
                options={{
                    title: "Register",
                    href: null,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "person-add" : "person-add-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
