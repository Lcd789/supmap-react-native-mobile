import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // focused tabIcon color
        tabBarActiveTintColor: "#ffd33d"
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
          )

        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: "My profile" ,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
                name={focused ? "person" : "person-outline"}
                size={24} 
                color={color}
            />
            /*
            <Ionicons 
                name={focused ? "person" : "person-outline"}
                size={24} 
                color={color}
            /> */
          )
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
