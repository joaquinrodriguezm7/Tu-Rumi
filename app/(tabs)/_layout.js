import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTitleAlign: "center",
        headerTintColor: "#00C2C7",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 4,
          height: 60,
        },
        tabBarActiveTintColor: "#00C2C7",
        tabBarInactiveTintColor: "#6B7280",
        // botón de ajustes arriba a la derecha
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color="#2E2E2E" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matching"
        options={{
          title: "Match",
          tabBarIcon: () => (
            <Image
              source={require("../../assets/logo.png")} // tu logo original
              style={{
                width: 32,
                height: 32,
                resizeMode: "contain",
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
