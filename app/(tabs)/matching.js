import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Swiper from "react-native-deck-swiper";
import { Check, X } from "lucide-react-native";
import axios from "axios";
import { createMatch } from "../../services/matchService";
import { COLORS } from "../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function Matching() {
  const [users, setUsers] = useState([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const config = {
          headers: { accesstoken: token },
          withCredentials: true,
        };
        const res = await axios.get("https://turumiapi.onrender.com/user/allusers", config);
        console.log("Usuarios recibidos:", res.data); // <-- Aquí ves los usuarios en consola
        setUsers(res.data.users);
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLike = async (index) => {
    const likedUser = users[index];
    if (!likedUser?.id_user && !likedUser?.id) return console.warn("⚠️ Usuario sin ID");

    console.log("💚 LIKE:", likedUser.name);
    console.log("🧭 targetUserId enviado:", likedUser.id_user);


    try {
      const res = await createMatch(likedUser.id_user || likedUser.id);
      if (res.matched) {
        console.log("🎉 ¡Match! Ahora están emparejados:", res.match);
      } else {
        console.log("⏳ Match pendiente, esperando reciprocidad:", res.match);
      }
    } catch (err) {
      if (err.response?.data?.message?.includes("Ya existe un Like o match")) {
        // Mostrar alerta si ya existe un like o match
        if (typeof Alert !== "undefined") {
          Alert.alert("Ya existe un match", "Ya le diste like a este usuario o ya son match.");
        } else {
          console.warn("Ya existe un match: Ya le diste like a este usuario o ya son match.");
        }
      } else {
        console.error("❌ Error creando match:", err.response?.data || err.message);
      }
    }
  };

  const handleDislike = (index) => {
    const dislikedUser = users[index];
    console.log("❌ DISLIKE:", dislikedUser?.name);
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 16, color: "#fff" }}>Cargando usuarios...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
      <View style={styles.container}>
        <Swiper
          ref={swiperRef}
          cards={users}
          renderCard={(user) =>
            user ? (
              <View style={styles.card}>
                <Image
                  source={{
                    uri: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
                  }}
                  style={styles.image}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {user.name}
                    {user.age ? `, ${user.age}` : ""}
                  </Text>
                  {user.carrera && <Text style={styles.carrera}>{user.carrera}</Text>}
                  {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
                </View>
              </View>
            ) : null
          }
          stackSize={2}
          backgroundColor="transparent"
          onSwipedLeft={(i) => handleDislike(i)}
          onSwipedRight={(i) => handleLike(i)}
          onSwipedAll={() => setShowEmpty(true)}
        />

        {/* ✅ Botones físicos debajo del card */}
        {!showEmpty && (
          <View style={styles.buttonsContainer}>
            {/* ✅ Like (izquierda, verde) */}
            <TouchableOpacity
              style={[styles.button, styles.likeButton]}
              onPress={() => swiperRef.current.swipeRight()}
            >
              <Check size={48} strokeWidth={3.5} color="#00C853" />
            </TouchableOpacity>

            {/* ❌ Dislike (derecha, rojo) */}
            <TouchableOpacity
              style={[styles.button, styles.dislikeButton]}
              onPress={() => swiperRef.current.swipeLeft()}
            >
              <X size={48} strokeWidth={3.5} color="#FF4C4C" />
            </TouchableOpacity>
          </View>
        )}

        {showEmpty && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🚫 No hay más usuarios 🚫</Text>
          </View>
        )}
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
    paddingHorizontal: 10,
    marginTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flex: 0.75,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 6,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: width * 1.1,
    resizeMode: "cover",
  },
  info: {
    padding: 16,
  },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 6, color: "#111" },
  carrera: { fontSize: 18, color: COLORS.primary, marginBottom: 6 },
  bio: { fontSize: 16, color: "#6B7280" },

  // ✅ Botones de acción
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    position: "absolute",
    bottom: 140,
    left: 0,
    right: 0,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: "#00C853",
  },
  dislikeButton: {
    borderWidth: 2,
    borderColor: "#FF4C4C",
  },


  emptyContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emptyText: { fontSize: 18, color: "#fff" },
});
