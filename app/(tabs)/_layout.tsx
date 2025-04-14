import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/user/AuthContext";
import { useTheme } from "@/utils/ThemeContext";

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: darkMode ? "#aaa" : "#888",
        tabBarStyle: {
          backgroundColor: darkMode ? "#1e1e1e" : "#fff",
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Supmap",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mon compte",
          headerShown: false,
          href: isAuthenticated ? "/profile" : null,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          title: "connexion",
          headerShown: false,
          href: !isAuthenticated ? "/login" : null,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "log-in" : "log-in-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: "Inscription",
          headerShown: false,
          href: null,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person-add" : "person-add-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Paramètres",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
