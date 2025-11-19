import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
        },
        headerTitleAlign: "center",
        headerTintColor: "#FFFFFF",
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backdropFilter: "blur(10px)",
        },
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",

        // ⚙️ Botón de ajustes arriba a la derecha
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "PERFIL",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matching"
        options={{
          title: "MATCH",
          tabBarIcon: () => (
            <Image
              source={require("../../assets/logo_blanco.png")}
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
          title: "CHAT",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />

        <Tabs.Screen
          name="chatroom"
          options={{
            href: null,
            title: "CHAT",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />

      {/* ⚙️ Pantalla Settings — sin icono en la barra */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "AJUSTES",
        }}
      />
    </Tabs>
  );
}
