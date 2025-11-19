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
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function Matching() {
  const [users, setUsers] = useState([]);
  const [myPhoto, setMyPhoto] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHearts, setShowHearts] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const swiperRef = useRef(null);

  // 🆕 Estados para tabs
  const [activeTab, setActiveTab] = useState("perfil");
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  // 🆕 Estado para manejar índices de fotos por usuario
  const [housingPhotoIndices, setHousingPhotoIndices] = useState({});
  // 🆕 Estado para forzar re-mount del Swiper
  const [swiperKey, setSwiperKey] = useState("swiper-0");

  const router = useRouter();

  const defaultPhoto =
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg";

  const forceSwiperRerender = () => {
    setSwiperKey((prev) => prev + "-r");
  };

  // 🧠 Cargar tu userId
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

  // 🆕 Verificar si el usuario actual tiene vivienda
  const currentUserHasHousing = () => {
    if (users.length === 0) return false;
    const currentUser = users[currentUserIndex];

    return (
      currentUser?.user_type === "user_with_housing" ||
      currentUser?.id_housing !== null ||
      currentUser?.housing_images?.length > 0
    );
  };

  // 🆕 Obtener usuario actual
  const getCurrentUser = () => {
    return users[currentUserIndex] || null;
  };

  // 🆕 Navegación de fotos de vivienda - CORREGIDO
  const nextHousingPhoto = () => {
    const currentUser = getCurrentUser();
    if (currentUser?.housing_images?.length > 0) {
      const currentIndex = housingPhotoIndices[currentUser.id_user] || 0;
      const newIndex =
        (currentIndex + 1) % currentUser.housing_images.length;

      setHousingPhotoIndices((prev) => ({
        ...prev,
        [currentUser.id_user]: newIndex,
      }));
    }
  };

  const prevHousingPhoto = () => {
    const currentUser = getCurrentUser();
    if (currentUser?.housing_images?.length > 0) {
      const currentIndex = housingPhotoIndices[currentUser.id_user] || 0;
      const newIndex =
        (currentIndex - 1 + currentUser.housing_images.length) %
        currentUser.housing_images.length;

      setHousingPhotoIndices((prev) => ({
        ...prev,
        [currentUser.id_user]: newIndex,
      }));
    }
  };

  // 🆕 Obtener índice de foto actual para el usuario
  const getCurrentHousingPhotoIndex = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return 0;
    return housingPhotoIndices[currentUser.id_user] || 0;
  };

  // 🟩 Abre ChatRoom
  const openChat = () => {
    if (!matchedUser || !myUserId) return;

    router.push({
      pathname: "/chatroom",
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
    if (!likedUser?.id_user) return;

    try {
      const res = await createMatch(likedUser.id_user);

      if (res?.match?.match_status === "matched") {
        triggerHearts(likedUser);
      }
    } catch (err) {
      console.error(
        "❌ Error creando match:",
        err.response?.data || err.message
      );
    }
  };

  // ❌ DISLIKE
  const handleDislike = (index) => {
    // No necesita hacer nada adicional
  };

  // 🆕 Manejar cambio de card en el swiper (sin usar index del callback)
  const handleSwiped = () => {
    setCurrentUserIndex((prev) => prev + 1);
    setActiveTab("perfil");
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradientBackground}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 16, color: "#fff" }}>
            Cargando usuarios...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.gradientBackground}
    >
      <View style={styles.container}>
        <Swiper
          key={swiperKey}               // 👈 fuerza remount cuando cambia
          cardIndex={currentUserIndex}  // 👈 controlamos el índice desde afuera
          ref={swiperRef}
          cards={users}
          renderCard={(user, index) => {
            if (!user) return null;

            const cardKey = `${user.id_user}-${activeTab}-${getCurrentHousingPhotoIndex()}`;

            const currentHousingPhotoIndex = getCurrentHousingPhotoIndex();
            const hasHousing =
              user?.user_type === "user_with_housing" ||
              user?.id_housing !== null ||
              user?.housing_images?.length > 0;

            return (
              <View key={cardKey} style={styles.card}>
                {/* 🆕 Tabs de navegación - DENTRO de cada card, arriba de la foto */}
                {hasHousing && (
                  <View style={styles.tabsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.tab,
                        activeTab === "perfil" && styles.activeTab,
                      ]}
                      onPress={() => {
                        setActiveTab("perfil");
                        forceSwiperRerender(); // 👈 ACTUALIZA AL TOQUE
                      }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === "perfil" && styles.activeTabText,
                        ]}
                      >
                        PERFIL
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tab,
                        activeTab === "casa" && styles.activeTab,
                      ]}
                      onPress={() => {
                        setActiveTab("casa");
                        forceSwiperRerender(); // 👈 ACTUALIZA AL TOQUE
                      }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === "casa" && styles.activeTabText,
                        ]}
                      >
                        CASA
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Contenido según tab activo */}
                {activeTab === "perfil" ? (
                  <>
                    <Image
                      source={{
                        uri: user.user_images?.[0] || defaultPhoto,
                      }}
                      style={styles.image}
                    />
                    <View style={styles.info}>
                      <Text style={styles.name}>
                        {user.name}
                        {user.age ? `, ${user.age}` : ""}
                      </Text>

                      {user.description &&
                        user.description !==
                          "Perfil de usuario " + user.id_user && (
                          <View style={styles.infoRow}></View>
                        )}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.imageContainer}>
                      {user.housing_images?.length > 0 ? (
                        <>
                          <Image
                            source={{
                              uri:
                                user.housing_images[
                                  currentHousingPhotoIndex
                                ] ||
                                "https://placehold.co/400x300?text=Sin%20imagen%20de%20vivienda",
                            }}
                            style={styles.image}
                          />
                          {user.housing_images.length > 1 && (
                            <>
                              <TouchableOpacity
                                style={styles.leftButton}
                                onPress={prevHousingPhoto}
                              >
                                <Text style={styles.navButtonText}>‹</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rightButton}
                                onPress={nextHousingPhoto}
                              >
                                <Text style={styles.navButtonText}>›</Text>
                              </TouchableOpacity>

                              <View style={styles.dotsContainer}>
                                {user.housing_images.map((_, i) => (
                                  <View
                                    key={i}
                                    style={[
                                      styles.dot,
                                      i === currentHousingPhotoIndex &&
                                        styles.activeDot,
                                    ]}
                                  />
                                ))}
                              </View>
                            </>
                          )}
                        </>
                      ) : (
                        <Image
                          source={{
                            uri: "https://placehold.co/400x300?text=Sin%20imagen%20de%20vivienda",
                          }}
                          style={styles.image}
                        />
                      )}
                    </View>

                    <View style={styles.info}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>Casa</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            );
          }}
          stackSize={2}
          backgroundColor="transparent"
          onSwipedLeft={() => {
            handleDislike(currentUserIndex);
            handleSwiped();
          }}
          onSwipedRight={() => {
            handleLike(currentUserIndex);
            handleSwiped();
          }}
          onSwipedAll={() => setShowEmpty(true)}
        />

        {/* Botones */}
        {!showEmpty && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.dislikeButton]}
              onPress={() => swiperRef.current.swipeLeft()}
            >
              <X size={48} strokeWidth={3.5} color="#FF4C4C" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.likeButton]}
              onPress={() => swiperRef.current.swipeRight()}
            >
              <Check size={48} strokeWidth={3.5} color="#00C853" />
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
                <Image
                  source={{ uri: myPhoto || defaultPhoto }}
                  style={styles.matchPhoto}
                />
                <Image
                  source={{
                    uri: matchedUser.user_images?.[0] || defaultPhoto,
                  }}
                  style={styles.matchPhoto}
                />
              </View>

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

// Los estilos se mantienen igual que en el código anterior
const styles = StyleSheet.create({
  // 🆕 Estilos para tabs - DENTRO de la card
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  activeTabText: {
    color: "#fff",
  },

  // 🆕 Estilos para navegación de fotos de vivienda
  imageContainer: {
    width: "100%",
    height: width * 1.1,
    position: "relative",
  },
  leftButton: {
    position: "absolute",
    top: "45%",
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rightButton: {
    position: "absolute",
    top: "45%",
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
  },

  // 🆕 Estilos para info
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoRow: {
    marginVertical: 2,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
  },

  // 🆕 Estilos para detalles del perfil
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  detail: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },

  // 🆕 Estilos para reglas de la casa
  houseRules: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  rule: {
    fontSize: 14,
    color: "#2E7D32",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },

  // Estilos existentes
  gradientBackground: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingTop: 60,
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
    position: "relative",
    marginTop: 20,
  },
  image: {
    width: "100%",
    height: width * 1.1,
    resizeMode: "cover",
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111",
  },
  bio: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    position: "absolute",
    bottom: 200,
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
  heart: {
    position: "absolute",
    top: 0,
  },
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
  matchTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
  },
  matchPhotos: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  matchPhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginHorizontal: 10,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
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
