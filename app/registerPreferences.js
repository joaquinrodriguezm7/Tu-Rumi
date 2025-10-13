import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";

export default function Settings() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 🔹 Llamar al endpoint de logout (borra cookies en el backend)
      await axios.post(
        "https://turumiapi.onrender.com/auth/logout",
        {},
        { withCredentials: true }
      );

      // 🔹 Limpiar datos locales
      await AsyncStorage.removeItem("user");

      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");

      // 🔹 Redirigir al login
      router.replace("/login");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      Alert.alert(
        "Error",
        "No se pudo cerrar sesión. Intenta nuevamente más tarde."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla registerPreferences ⚙️</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión 🚪</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
