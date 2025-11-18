import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import globalStyles, { COLORS } from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const { width, height } = Dimensions.get("window");

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user_w_housing");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !userType) {
      Alert.alert("Error", "Debes ingresar email, contraseña y tipo de usuario");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("https://turumiapi.onrender.com/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, user_type: userType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.errors ? JSON.stringify(data.errors) : data.message
        );
      }

      Alert.alert("✅ Registro exitoso", "Usuario registrado correctamente");

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (error) {
      console.error("Error en registro:", error.message);
      Alert.alert("Error", "No se pudo crear el usuario: " + error.message);
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
        
        {/* LOGO RESPONSIVE */}
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* FORM RESPONSIVE */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Regístrate</Text>

          <TextInput
            style={globalStyles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={globalStyles.input}
            placeholder="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Tipo de usuario</Text>

          <View style={globalStyles.pickerWrapper}>
            <Picker
              selectedValue={userType}
              onValueChange={(itemValue) => setUserType(itemValue)}
              style={globalStyles.picker}
            >
              <Picker.Item label="Con vivienda" value="user_w_housing" />
              <Picker.Item label="Sin vivienda" value="user_wo_housing" />
            </Picker>
          </View>

          <TouchableOpacity
            style={globalStyles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={globalStyles.buttonText}>
              {loading ? "Cargando..." : "Registrarse"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

/* ============================
   RESPONSIVE STYLES
=============================== */
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
  },

  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.06,   // responsive padding
  },

  logo: {
    width: width * 0.5,         // 50% del ancho de la pantalla
    height: width * 0.5,
    marginBottom: height * 0.04,
  },

  formContainer: {
    width: "100%",
    maxWidth: 420,              // límite para pantallas grandes
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    padding: width * 0.06,      // padding RESPONSIVE
    ...(Platform.OS === "web" && { backdropFilter: "blur(10px)" }),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: height * 0.08,
  },

  title: {
    fontSize: width * 0.07,     // ≈ 24–28 según pantalla
    fontWeight: "bold",
    color: COLORS.card,
    textAlign: "center",
    marginBottom: 20,
  },

  label: {
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "600",
    color: COLORS.card,
    fontSize: width * 0.04,
  },
});
