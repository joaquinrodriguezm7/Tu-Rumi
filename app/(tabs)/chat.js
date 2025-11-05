import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../styles";

// Función para obtener los matches del usuario
const getMatches = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) throw new Error("No se encontró accessToken en AsyncStorage");

    const config = {
      headers: { accesstoken: token },
      withCredentials: true,
    };

    const res = await axios.get("https://turumiapi.onrender.com/match", config);
    console.log("📬 Matches recibidos:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error al obtener matches:", err.response?.data || err.message);
    throw err;
  }
};

export default function Chat() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar los matches
  const fetchMatches = async () => {
    try {
      const data = await getMatches();
      const allMatches = data.matches || [];

      // Filtrar los matches con status "matched"
      const confirmed = allMatches.filter((m) => m.match_status === "matched");

      setMatches(confirmed); // Guardar solo los matches confirmados
    } catch (err) {
      console.error("Error cargando matches:", err);
    } finally {
      setLoading(false); // Terminar el estado de carga
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval); // Limpiar el intervalo cuando el componente se desmonte
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 10, color: "#fff" }}>Cargando matches...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aún no tienes matches 😅</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {matches.map((item, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <Image
                source={{
                  uri:
                    item.photo_url ||
                    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg", // Imagen por defecto si no hay foto
                }}
                style={styles.image}
              />
              <View style={styles.infoBox}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name
                    ? `${item.name.split(" ")[0]}, ${item.age || "?"}`
                    : "Usuario"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 100,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: "#fff", fontSize: 16 },

  // 💬 Cards translúcidas horizontales
  card: {
    width: 100,
    height: 160,
    backgroundColor: "rgba(255,255,255,0.15)", // translúcido
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  image: {
    width: "100%",
    height: 115,
    resizeMode: "cover",
  },
  infoBox: {
    height: 45,
    backgroundColor: "rgba(255,255,255,0.2)", // translúcido en la parte inferior
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  name: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
});
