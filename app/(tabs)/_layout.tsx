import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUserData } from "@/hooks/user/UserHooks";
import { useEffect, useState } from "react";

export default function TabsLayout() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const authStatus = await getUserData();

                // Vérifie si la valeur retournée est vide (null, undefined ou une chaîne vide)
                if (!authStatus || Object.keys(authStatus).length === 0) {
                    console.warn("⚠️ Aucune donnée utilisateur trouvée !");
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(authStatus);
                    console.log("✅ Utilisateur authentifié :", authStatus);
                }
            } catch (error) {
                console.error(
                    "❌ Erreur lors de la récupération des données utilisateur :",
                    error
                );
                setIsAuthenticated(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <Tabs
            screenOptions={{
                // focused tabIcon color
                tabBarActiveTintColor: "#ffd33d",
            }}
        >
            <Tabs.Screen
                // name="[NAME OF FILE]"
                name="index"
                options={{
                    title: "SUPMAP",
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "My profile",
                    href: isAuthenticated ? "/profile" : null,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="login"
                options={{
                    title: "Login",
                    href: !isAuthenticated ? "/login" : null,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={focused ? "log-in" : "log-in-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="register"
                options={{
                    title: "Register",
                    href: null,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={focused ? "person-add" : "person-add-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={focused ? "settings" : "settings-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    ); // end of return
} // end of TabsLayout function
