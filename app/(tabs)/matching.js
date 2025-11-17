import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Swiper from "react-native-deck-swiper";
import { Check, X } from "lucide-react-native";
import axios from "axios";
import { createMatch } from "../../services/matchService";
import { COLORS } from "../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";   // 🆕 Para navegar al chat

const { width, height } = Dimensions.get("window");

export default function Matching() {
  const [users, setUsers] = useState([]);
  const [myPhoto, setMyPhoto] = useState(null);
  const [myUserId, setMyUserId] = useState(null);   // 🆕 Tu ID real
  const [showEmpty, setShowEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHearts, setShowHearts] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const swiperRef = useRef(null);

  const router = useRouter();  // 🆕

  const defaultPhoto =
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg";

  // 🧠 Cargar tu userId + usuarios recomendados
  useEffect(() => {
    const loadMyData = async () => {
      const storedId = await AsyncStorage.getItem("userId");
      setMyUserId(Number(storedId));
    };
    loadMyData();
  }, []);

  useEffect(() => {
    const fetchUsersAndSelf = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const config = {
          headers: { accesstoken: token },
          withCredentials: true,
        };

        // 👥 Obtener usuarios recomendados
        const res = await axios.get(
          "https://turumiapi.onrender.com/user/recommendations",
          config
        );
        setUsers(res.data.recommendations || []);

        // 🧍‍♂️ Obtener tu foto
        try {
          const myRes = await axios.get(
            "https://turumiapi.onrender.com/user_photos",
            config
          );

          if (myRes.data?.images?.length > 0) {
            setMyPhoto(myRes.data.images[0]);
          } else {
            setMyPhoto(defaultPhoto);
          }
        } catch {
          setMyPhoto(defaultPhoto);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setUsers([]);
        setMyPhoto(defaultPhoto);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndSelf();
  }, []);

  // 🟩 Abre ChatRoom
  const openChat = () => {
    if (!matchedUser || !myUserId) return;

    router.push({
      pathname: "/chat/ChatRoom",
      params: {
        userId: myUserId,
        otherUserId: matchedUser.id_user || matchedUser.id,
      },
    });
  };

  // 🏠 Animación de match
  const triggerHearts = (user) => {
    setMatchedUser(user);
    setShowHearts(true);
    setShowMatchModal(true);

    const heartsArray = Array.from({ length: 25 }).map(() => ({
      id: Math.random().toString(),
      left: Math.random() * width,
      size: 24 + Math.random() * 20,
      emoji: ["🏠", "🏡", "🏘️"][Math.floor(Math.random() * 3)],
      anim: new Animated.Value(0),
    }));

    setHearts(heartsArray);

    heartsArray.forEach((heart) => {
      Animated.timing(heart.anim, {
        toValue: 1,
        duration: 5500 + Math.random() * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => setShowHearts(false), 6000);
    setTimeout(() => setShowMatchModal(false), 4000);
  };

  // 💚 LIKE
  const handleLike = async (index) => {
    const likedUser = users[index];
    if (!likedUser?.id_user && !likedUser?.id) return;

    try {
      const res = await createMatch(likedUser.id_user || likedUser.id);

      if (res?.match?.match_status === "matched") {
        triggerHearts(likedUser);
      }
    } catch (err) {
      console.error("❌ Error creando match:", err.response?.data || err.message);
    }
  };

  // ❌ DISLIKE
  const handleDislike = (index) => {};

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
        {/* 💳 Swiper */}
        <Swiper
          ref={swiperRef}
          cards={users}
          renderCard={(user) =>
            user ? (
              <View style={styles.card}>
                <Image
                  source={{
                    uri: user.images?.[0] || defaultPhoto,
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

        {/* Botones */}
        {!showEmpty && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.likeButton]}
              onPress={() => swiperRef.current.swipeRight()}
            >
              <Check size={48} strokeWidth={3.5} color="#00C853" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dislikeButton]}
              onPress={() => swiperRef.current.swipeLeft()}
            >
              <X size={48} strokeWidth={3.5} color="#FF4C4C" />
            </TouchableOpacity>
          </View>
        )}

        {/* 🏠 Animación de casitas */}
        {showHearts &&
          hearts.map((heart) => (
            <Animated.Text
              key={heart.id}
              style={[
                styles.heart,
                {
                  left: heart.left,
                  fontSize: heart.size,
                  opacity: heart.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [
                    {
                      translateY: heart.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height * 0.8],
                      }),
                    },
                    {
                      rotate: heart.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", `${Math.random() * 360}deg`],
                      }),
                    },
                  ],
                },
              ]}
            >
              {heart.emoji}
            </Animated.Text>
          ))}

        {/* 🏡 Modal Match */}
        {showMatchModal && matchedUser && (
          <View style={styles.matchModalOverlay}>
            <View style={styles.matchModal}>
              <Text style={styles.matchTitle}>🏡¡Es un Match!🏡</Text>

              <View style={styles.matchPhotos}>
                <Image source={{ uri: myPhoto || defaultPhoto }} style={styles.matchPhoto} />
                <Image
                  source={{
                    uri: matchedUser.images?.[0] || defaultPhoto,
                  }}
                  style={styles.matchPhoto}
                />
              </View>

              {/* 🆕 Botón para abrir Chat */}
              <TouchableOpacity style={styles.chatButton} onPress={openChat}>
                <Text style={styles.chatButtonText}>Enviar mensaje 💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 10, marginTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flex: 0.75,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 6,
    overflow: "hidden",
  },
  image: { width: "100%", height: width * 1.1, resizeMode: "cover" },
  info: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 6, color: "#111" },
  carrera: { fontSize: 18, color: COLORS.primary, marginBottom: 6 },
  bio: { fontSize: 16, color: "#6B7280" },
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
  likeButton: { borderWidth: 2, borderColor: "#00C853" },
  dislikeButton: { borderWidth: 2, borderColor: "#FF4C4C" },
  heart: { position: "absolute", top: 0 },
  matchModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  matchModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "80%",
    elevation: 8,
  },
  matchTitle: { fontSize: 28, fontWeight: "bold", color: COLORS.primary, marginBottom: 20 },
  matchPhotos: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  matchPhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginHorizontal: 10,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },

  // 🆕 Estilos botón chat
  chatButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
