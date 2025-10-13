import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axios from "axios";

let Cookies = null;
if (Platform.OS !== "web") {
  Cookies = require("@react-native-cookies/cookies").default;
}

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
  const router = useRouter();

  const getCsrfToken = async () => {
    if (Platform.OS === "web") return null;

    try {
      const cookies = await Cookies.get("https://turumiapi.onrender.com");
      return cookies.csrfToken?.value || null;
    } catch (err) {
      console.error("❌ Error obteniendo CSRF Token:", err);
      return null;
    }
  };

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

    // 🔸 Si el login no devuelve todos los datos, pedimos el perfil completo
    if (!user.name || !user.age || !user.gender || !user.phone_number) {
      console.log("🔎 Obteniendo datos completos del usuario...");
      const profileRes = await axios.get(`/user/${userId}`);
      user = profileRes.data;
      console.log("👀 Usuario completo:", user);
    }

    await AsyncStorage.setItem("user", JSON.stringify(user));

    // 🔹 Validamos perfil
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
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Cargando..." : "Ingresar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#4D96FF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
