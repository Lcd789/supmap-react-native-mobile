import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/user/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/utils/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen name="+not-found" options={{}} />
            </Stack>
          </GestureHandlerRootView>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
