import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { COLORS } from "../styles";

export default function Settings() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post(
        "https://turumiapi.onrender.com/auth/logout",
        {},
        { withCredentials: true }
      );

      await AsyncStorage.removeItem("user");
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
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
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
      <View style={styles.container}>
        <Text style={styles.title}>⚙️ Ajustes</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión 🚪</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  logoutText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "bold",
  },
});
