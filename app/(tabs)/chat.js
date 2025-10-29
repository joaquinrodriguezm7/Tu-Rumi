import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMatches } from "../../services/matchService";

const getUserById = async (id) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const res = await axios.get(`https://turumiapi.onrender.com/user/${id}`, {
      headers: { accesstoken: token },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error(`❌ Error obteniendo usuario ${id}:`, err.response?.data || err.message);
    return null;
  }
};

export default function Chat() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const data = await getMatches();
      const allMatches = data.matches || [];
      const confirmed = allMatches.filter((m) => m.match_status === "matched");

      // enriquecemos cada match con datos del usuario correspondiente
      const enriched = await Promise.all(
        confirmed.map(async (m) => {
          const currentUser = await AsyncStorage.getItem("user");
          const currentId = currentUser ? JSON.parse(currentUser).id_user : null;

          const isFromUser = m.from_id_user === currentId;
          const otherUserId = isFromUser ? m.to_id_user : m.from_id_user;

          const user = await getUserById(otherUserId);
          return { ...m, user };
        })
      );

      setMatches(enriched);
    } catch (err) {
      console.error("Error cargando matches:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 carga inicial y auto-refresh cada 5 s
  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval); // limpiamos al desmontar
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4D96FF" />
        <Text style={{ marginTop: 10 }}>Cargando matches...</Text>
      </View>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aún no tienes matches 😅</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <Text style={styles.name}>
              {item.user?.name || "Usuario desconocido"}
            </Text>
            <Text style={styles.status}>Estado: {item.match_status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  matchCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  status: { color: "#4B5563", marginTop: 4 },
  emptyText: { color: "#6B7280", fontSize: 16 },
});
