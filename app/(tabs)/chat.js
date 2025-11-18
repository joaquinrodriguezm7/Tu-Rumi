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
import { useRouter } from "expo-router";

// ================================
// GET MATCHES
// ================================
const getMatches = async () => {
  const token = await AsyncStorage.getItem("accessToken");

  const res = await axios.get("https://turumiapi.onrender.com/match", {
    headers: { accesstoken: token },
  });

  return res.data;
};

// ================================
// GET ALL USERS (con imágenes)
// ================================
const getAllUsers = async () => {
  const token = await AsyncStorage.getItem("accessToken");

  const res = await axios.get("https://turumiapi.onrender.com/user/recommendations", {
    headers: { accesstoken: token },
  });

  return res.data.recommendations || [];
};

export default function Chat() {
  const [matches, setMatches] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);

  const router = useRouter();

  // 1️⃣ Cargar mi ID
  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => setMyUserId(Number(id)));
  }, []);

  // 2️⃣ Cargar matches + allUsers
  const loadEverything = async () => {
    try {
      const matchesData = await getMatches();
      const confirmed = matchesData.matches.filter(
        (m) => m.match_status === "matched"
      );

      setMatches(confirmed);

      // 🔥 allUsers ya trae IMÁGENES
      const usersData = await getAllUsers();
      setAllUsers(usersData);

    } catch (err) {
      console.error("❌ Error en loadEverything:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEverything();
    const interval = setInterval(loadEverything, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3️⃣ Abrir chat
  const openChat = (match) => {
    const otherId =
      match.from_id_user === myUserId ? match.to_id_user : match.from_id_user;

    router.push(`/chatroom?userId=${myUserId}&otherUserId=${otherId}`);
  };

  // 4️⃣ Obtener foto desde allUsers
  const getPhotoOfMatch = (match) => {
    const CR7 =
      "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg";

    const otherId =
      match.from_id_user === myUserId ? match.to_id_user : match.from_id_user;

    const user = allUsers.find((u) => u.id_user === otherId);

    // Si no existe el usuario, o no tiene imágenes, vuelve CR7
    if (!user || !user.images || user.images.length === 0) return CR7;

    const url = user.images[0];

    // Si vino null o undefined o string vacía
    if (!url) return CR7;

    return url;
  };


  // ================================
  // LOADING
  // ================================
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

  // ================================
  // SIN MATCHES
  // ================================
  if (!matches.length) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aún no tienes matches 😅</Text>
        </View>
      </LinearGradient>
    );
  }

  // ================================
  // RENDER
  // ================================
  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {matches.map((item, index) => {
            const photo = getPhotoOfMatch(item);

            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => openChat(item)}
              >
                <Image
                  source={{
                    uri:
                      photo ??
                      "https://via.placeholder.com/200x200.png?text=Sin+Foto",
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
            );
          })}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },

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

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  emptyText: { color: "#fff", fontSize: 16 },

  card: {
    width: 100,
    height: 160,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  image: {
    width: "100%",
    height: 115,
    resizeMode: "cover",
  },

  infoBox: {
    height: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
});
