import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Debes ingresar email y contraseña");
      return;
    }

    try {
      setLoading(true);

      // 🔹 Request al login
      const res = await fetch("https://turumiapi.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Guardar token y user en AsyncStorage
        await AsyncStorage.setItem("token", data.token);
        if (data.user) {
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
        }

        console.log("✅ Token:", data.token);
        console.log("✅ Usuario:", data.user);

        // 🔹 Intentar obtener el perfil (puede fallar si no está en Render todavía)
        try {
          const profileRes = await fetch(
            "https://turumiapi.onrender.com/user",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${data.token}`,
                "Content-Type": "application/json",
              },
            }
          );

          let profileData;
          try {
            profileData = await profileRes.json();
          } catch {
            profileData = await profileRes.text();
          }

          if (profileRes.ok) {
            console.log("📌 Perfil obtenido:", profileData);
          } else {
            console.warn(
              "⚠️ No se pudo obtener perfil:",
              profileRes.status,
              profileData
            );
          }
        } catch (err) {
          console.warn("⚠️ Error al obtener perfil:", err.message);
        }

        // 🔹 Redirigir a pantalla principal
        router.replace("/(tabs)/matching");
      } else {
        Alert.alert("❌ Error", data.message || "Credenciales inválidas");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
      console.error(error);
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
