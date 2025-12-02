import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, TouchableOpacity, View, Text, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../styles";

const hiddenTabs = ["chatroom", "settings"];

function CustomHeader({ router }) {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: 60,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 12,
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>TuRumi</Text>
      <TouchableOpacity
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    </LinearGradient>
  )
}

function MyCustomTabBar({ state, descriptors, navigation }) {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexDirection: "row",
        height: 60,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      {state.routes
        .filter(route => !hiddenTabs.includes(route.name))
        .map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
              }}
            >
              {options.tabBarIcon?.({
                color: isFocused ? "#FFF" : "rgba(255,255,255,0.6)",
                size: 24,
                focused: isFocused,
              })}
              {options.title && (
                <Text style={{ color: isFocused ? "#FFF" : "rgba(255,255,255,0.6)", fontSize: 12 }}>
                  {options.title}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
    </LinearGradient>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const SAFE_COLOR = COLORS.primary; // Cambia aquí si quieres otro color
  // Si deseas controlar la barra de navegación Android, instala: npx expo install expo-navigation-bar
  // y reintroduce el import y llamada. Aquí usamos sólo SafeArea + StatusBar.

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SAFE_COLOR }} edges={["top","bottom"]}>
      <StatusBar backgroundColor={SAFE_COLOR} barStyle="light-content" />
      <Tabs
        screenOptions={{
          header: () => <CustomHeader router={router} />,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            height: 60,
          },
          headerTitleAlign: "center",
          headerTintColor: "#FFFFFF",
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: SAFE_COLOR },
          tabBarStyle: {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
        }}
      tabBar={(props) => <MyCustomTabBar {...props} />}
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
                  width: 28,
                  height: 28,
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
          options={{ href: null, title: "CHAT", 
          tabBarIcon: ({ color, size }) => ( <Ionicons name="chatbubbles" size={size} color={color} /> ), }} 
        /> 

        <Tabs.Screen 
          name="settings" 
          options={{ href: null, title: "AJUSTES", }} 
        />
      </Tabs>
    </SafeAreaView>
  );
}
