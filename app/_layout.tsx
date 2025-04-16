import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/user/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/utils/ThemeContext";
import SplashScreen from "../components/SplashScreen";

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <SplashScreen onFinish={() => {}} />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="forgot-password"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="+not-found"
                options={{ title: "Page introuvable" }}
              />
            </Stack>
          </GestureHandlerRootView>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
