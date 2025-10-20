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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import globalStyles, { COLORS } from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker"; // 👈 mantenerlo

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user_w_housing"); // valor inicial
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

      console.log("✅ Usuario creado:", data);

      // No guardamos sesión ni más lógica, solo avisamos
      Alert.alert("✅ Registro exitoso", "Usuario registrado correctamente");

      // Redirigir al login tras un breve delay
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
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
  <View style={styles.formContainer}>
          <Text style={styles.title}>¿Aún no tienes cuenta? Regístrate</Text>
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
          <Text style={{ fontWeight: 'bold', color: COLORS.card }}>Tipo de usuario</Text>
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
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    padding: 24,
    ...(Platform.OS === "web" ? { backdropFilter: "blur(10px)" } : {}),
    shadowColor: "#000",
    shadowOpacity: 0.2,
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
});


