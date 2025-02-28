import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/hooks/user/AuthContext";

export default function RootLayout() {
    return (
        <>
            <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="dark" />
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
        </>
    );
}
