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
import globalStyles, { COLORS } from "../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axios from "axios";
import AnimatedLine from "../components/titleBorder"
import { Ionicons } from "@expo/vector-icons";  


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

  // Función para obtener un valor de cookie por nombre (solo Web)
  function getCookie(name) {
    if (Platform.OS !== "web") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Debes ingresar email y contraseña");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/auth/login", { email, password }, { withCredentials: true });

      console.log("✅ Login correcto:", res.data);

      // 🧠 Extraemos usuario y tokens del backend
      const { user, tokens } = res.data;

      // 🔐 Obtener tokens desde cookies (solo web)
      let accessToken = getCookie("accessToken");
      let refreshToken = getCookie("refreshToken");

      // Si vienen en el body (como hace tu compañero), usarlos
      if (tokens?.accessToken) accessToken = tokens.accessToken;
      if (tokens?.refreshToken) refreshToken = tokens.refreshToken;

      console.log("🔑 Tokens recibidos:", { accessToken, refreshToken });

      // Guardar usuario y tokens en AsyncStorage
      const userWithPhoto = {
        ...user,
        photo_url:
        user.photo_url ||
        "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
      };

      await AsyncStorage.setItem("user", JSON.stringify(userWithPhoto));

      // 🆕 Guardar el ID del usuario de forma segura
      if (user?.id) {
        await AsyncStorage.setItem("userId", String(user.id));
        console.log("💾 userId guardado:", user.id);
      } else {
        console.warn("⚠️ No se encontró id_user en la respuesta del backend");
      }

      if (accessToken) {
        await AsyncStorage.setItem("accessToken", accessToken);
        console.log("💾 accessToken guardado en AsyncStorage");
      } else {
        console.warn("⚠️ No se recibió accessToken del backend");
      }

      if (refreshToken) {
        await AsyncStorage.setItem("refreshToken", refreshToken);
      }

      // Verificar guardado (debug)
      const savedToken = await AsyncStorage.getItem("accessToken");
      console.log("🧩 accessToken verificado:", savedToken);

      // Redirigir según campos requeridos
      const requiredFields = ["name", "age", "gender", "phone_number"];
      const missingFields = requiredFields.filter(
        (f) => !user[f] || String(user[f]).trim() === ""
      );

      if (missingFields.length > 0) {
        router.replace("/registerProfile");
      } else {
        
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
      start={{ x:0 , y:0}}
      end={{ x:1, y:0 }}
    >
      <View style={styles.overlay}>
        <View style={styles.imageOverlay}>
          <Image
            source={require("../../assets/logo_blanco.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: "absolute",
              bottom: 16,
              left: 16
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={{
              alignSelf: "flex-start",
              marginBottom: 36
            }}>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <AnimatedLine/>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={styles.labelForm}>
                Email
              </Text>
              <TextInput
                style={[
                      globalStyles.input,
                      styles.inputForm
                    ]}
                placeholder="example@email.com"
                placeholderTextColor="rgba(0,0,0,0.7)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <View>
                <Text
                  style={styles.labelForm}
                >
                  Contraseña
                </Text>

                {/* Contenedor sólo para input + icono */}
                <View style={{ position: "relative", justifyContent: "center" }}>
                  <TextInput
                    style={[
                      globalStyles.input,
                      styles.inputForm
                    ]}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor="rgba(0,0,0,0.7)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 0,
                      bottom: 16,
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={{ marginTop: 48 }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    ...globalStyles.button,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 12,
                  }}
                >
                  <Text style={globalStyles.buttonText}>
                    {loading ? "Cargando..." : "Ingresar"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Text
                  style={{ fontWeight: "bold", fontSize: 13, color: "black", opacity: 0.75}}
                >
                  ¿Aún no tienes cuenta?{" "}
                  <Text
                    style={{
                      color: "black",
                      opacity: 0.9,
                      textDecorationLine: "underline",
                    }}
                    onPress={() => router.push("/register")}
                  >
                    Regístrate
                  </Text>
                </Text>
              </View>
            </View>
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
    width: "100%"
  },
  logo: {
    width: 180,
    height: 180,
  },
  imageOverlay: {
    width: "100%",
    flex: 0.3,
    justifyContent: "center",
    alignItems: "center",   
  },
  formContainer: {
    width: "100%",
    flex: 0.7,
    justifyContent: "flex-start",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
    borderTopLeftRadius:24,
    borderTopRightRadius:24,
  },
  form: {
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 16,
    marginBottom: 24,
    marginTop: 24,
    marginHorizontal: 24,
  },
  inputForm: {
    borderBottomWidth: 1,
    borderBottomColor: "#929292ff",
    borderRadius: 0,
    borderWidth: 0,
    paddingRight: 36
  },
  labelForm: {
    fontSize: 18, 
    color: COLORS.primary, 
    marginBottom: 8,
    fontWeight: "600" 
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3C8DFF",
    textAlign: "start",
  },
});
