import { useState } from "react";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import globalStyles, { COLORS } from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axios from "axios";



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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Expo Go no soporta cookies nativas, así que devolvemos null siempre
  const getCsrfToken = async () => null;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Debes ingresar email y contraseña");
      return;
    }

    try {
      setLoading(true);
      const csrfToken = await getCsrfToken();

      const res = await axios.post(
        "/auth/login",
        { email, password },
        { headers: csrfToken ? { "x-csrf-token": csrfToken } : {} }
      );

      console.log("✅ Login correcto:", res.data);

      let user = res.data.user || {};
      const userId = user.id_user || user.id;

      if (!user.name || !user.age || !user.gender || !user.phone_number) {
        console.log("🔎 Obteniendo datos completos del usuario...");
        const profileRes = await axios.get(`/user/${userId}`);
        user = profileRes.data;
        console.log("👀 Usuario completo:", user);
      }

      await AsyncStorage.setItem("user", JSON.stringify(user));

      const requiredFields = ["name", "age", "gender", "phone_number"];
      const missingFields = requiredFields.filter(
        (f) =>
          user[f] === null ||
          user[f] === undefined ||
          String(user[f]).trim() === ""
      );

      if (missingFields.length > 0) {
        console.log("🧩 Faltan campos del perfil:", missingFields);
        router.replace("/registerProfile");
      } else {
        console.log("💙 Perfil completo, yendo a matching...");
        router.replace("/(tabs)/matching");
      }
    } catch (error) {
      console.error("❌ Error en login:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Credenciales inválidas"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.gradientBackground}
    >
      <View style={styles.overlay}>
        <Image
          source={require("../assets/logo.png")} // 👈 coloca tu logo en /assets/logo.png
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>

          <TextInput
            style={globalStyles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ position: "relative" }}>
            <TextInput
              style={[globalStyles.input, { paddingRight: 36 }]}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={{ position: "absolute", right: 10, top: -6, height: "100%", justifyContent: "center" }}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={globalStyles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={globalStyles.buttonText}>
              {loading ? "Cargando..." : "Ingresar"}
            </Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: COLORS.card }}>
              ¿Aún no tienes cuenta?{' '}
              <Text
                style={{ color: COLORS.card, textDecorationLine: 'underline' }}
                onPress={() => router.replace('/register')}
              >
                Regístrate
              </Text>
            </Text>
          </View>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.card,
    textAlign: "center",
    marginBottom: 24,
  },

  formContainer: {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.25)", // translúcido
  borderRadius: 20,
  padding: 24,
  backdropFilter: "blur(10px)", // efecto blur en web
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 6,
},

});
