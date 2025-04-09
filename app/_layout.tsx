import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/user/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <>
        <SafeAreaProvider>
            <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style={
                    colorScheme === "dark" 
                    ? "light" 
                    : "dark"
                } backgroundColor={colorScheme === "dark" ? "#000" : "#fff"} />
                <Stack>
                    {/* Tabs at the bottom, name = directory, each file inside becomes a tab */}
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
        </SafeAreaProvider>
        </>
    );
}
