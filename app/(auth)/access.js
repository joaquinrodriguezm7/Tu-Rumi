import { useState } from "react";
import {
  View,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import globalStyles, { COLORS } from "../styles";
import { useRouter } from "expo-router";
import axios from "axios";
import AnimatedLine from "../components/titleBorder"
import Svg, { Path } from "react-native-svg";

axios.defaults.baseURL = "https://turumiapi.onrender.com";
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.code === "ACCESS_TOKEN_EXPIRED") {
      console.warn("🔁 Token expirado, refrescando...");
      try {
        await axios.get("/auth/refresh", { withCredentials: true });
        console.log("✅ Token refrescado correctamente");
        return axios(error.config);
      } catch (refreshError) {
        console.error("❌ Error al refrescar token:", refreshError);
        Alert.alert("Sesión expirada", "Por favor vuelve a iniciar sesión.");
      }
    }
    return Promise.reject(error);
  }
);

export default function Login() {
  const router = useRouter();

  // Expo Go no soporta cookies nativas, así que devolvemos null siempre
  const getCsrfToken = async () => null;

  // Función para obtener un valor de cookie por nombre (solo Web)
  function getCookie(name) {
    if (Platform.OS !== "web") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.gradientBackground}
      start={{ x:0 , y:0}}
      end={{ x:1, y:0 }}
    >
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.overlay}>
                <View style={styles.textOverlay}>
                    <Text style={{ fontSize: 36, color: "white"}}>¡Bienvenido!</Text>
                    <Text style={{ fontSize: 24, color: "white", marginBottom: 8}}>Encuentra a tu próximo roommate fácilmente</Text>
                    <Text style={{ fontSize: 12, color: "white", opacity: 0.8}}>Busca, publica y conecta con personas que buscan compartir hogar</Text>
                </View>
                <View style={styles.buttonOverlay}>
                    <Pressable
                        style={ styles.buttonLogin }
                        onPress={() => {
                            router.push("/login")
                        }}
                    >
                        <Text 
                            style={styles.buttonLoginText}
                        >Iniciar sesión</Text>
                    </Pressable>
                    <Pressable
                        style={ styles.buttonRegister }
                        onPress={() => {
                            router.push("/register")
                        }}
                    >
                        <Text 
                            style={styles.buttonRegisterText}
                        >
                            Registrate
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
        <View pointerEvents="none" style={ styles.svgWrapper}>
            <Svg width="100%" height="100%" viewBox="0 0 1440 250" preserveAspectRatio="xMidYMax slice">
                <Path
                fill="white"
                d="M0,192L60,165.3C120,139,240,85,360,85.3C480,85,600,139,720,165.3C840,192,960,192,1080,186.7C1200,181,1320,171,1380,165.3L1440,160L1440,320L0,320Z"
                />
            </Svg>
        </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    width: "100%"
  },
  textOverlay: {
    flex: 0.65,
    justifyContent: "center",
    alignItems: "flex-start",
    marginHorizontal: 16
  },
  buttonOverlay: {
    flex: 0.45,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "80%",
    margin: "auto",
    paddingHorizontal: 16,
    gap:24
  },
  buttonLogin: {
    backgroundColor: "white",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    paddingVertical: 12
  },
  buttonRegister: {
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    paddingVertical: 12
  },
  buttonLoginText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3C8DFF",
  },
  buttonRegisterText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white"
  },
  svgWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,        // <- aumenta este valor para que la curva baje más
    zIndex: 10,
  },
});
