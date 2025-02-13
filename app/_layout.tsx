import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
    <StatusBar style="dark" />
      <Stack>
        {/* Tabs at the bottom, name = directory, each file inside becomes a tab */}
        <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false 
        }} 
        />
        <Stack.Screen name="login" options={{}} />
        <Stack.Screen name="register" options={{}} />
        <Stack.Screen name="+not-found" options={{}} />
      </Stack>
    </>
  );
}
