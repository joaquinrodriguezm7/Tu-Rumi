import { View, Text, TouchableOpacity, Alert } from "react-native";
import globalStyles from "./styles";
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
    <View style={globalStyles.containerCentered}>
      <Text style={globalStyles.text}>Pantalla registerPreferences ⚙️</Text>

      <TouchableOpacity style={globalStyles.buttonDanger} onPress={handleLogout}>
        <Text style={globalStyles.buttonText}>Cerrar sesión 🚪</Text>
      </TouchableOpacity>
    </View>
  );
}


