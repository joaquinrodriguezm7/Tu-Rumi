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
import { getMatches } from "../../services/matchService";
import { COLORS } from "../styles";

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

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
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
                    item.user?.photo_url ||
                    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
                }}
                style={styles.image}
              />
              <View style={styles.infoBox}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.user?.name
                    ? `${item.user.name.split(" ")[0]}, ${item.user.age || "?"}`
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
