import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { user } = useAuth();
  console.log("Valor de user en RootLayoutNav:", user);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
