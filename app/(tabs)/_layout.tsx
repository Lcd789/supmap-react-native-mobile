import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  const isAuthenticated = false;

  return (
    <Tabs
      screenOptions={{
        // focused tabIcon color
        tabBarActiveTintColor: "#ffd33d"
      }}
    >
      <Tabs.Screen 
      //name="[NAME OF FILE]"
        name="index" 
        options={{ 
          title: "SUPMAP",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
                name={focused ? "home" : "home-outline"}
                size={24} 
                color={color}
            /> 
          )

        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: "My profile",
          href: isAuthenticated ? "/(tabs)/profile" : null,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
                name={focused ? "person" : "person-outline"}
                size={24} 
                color={color}
            />
          )
        }} 
      />
      <Tabs.Screen
        name="login"
        options={{
          title: "Login",
          href: isAuthenticated ? null : "/login",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "log-in" : "log-in-outline"}
              size={24}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
      //Here just to keep the bottom tabs layout from login to register
        name="register"
        options={{
          // Not visible in the bottom tabs
          href: null,
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
          )
        }} 
      />
    </Tabs>
  ); // end of return
} // end of TabsLayout function
