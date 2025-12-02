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
  Platform,
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

const TABBAR_HEIGHT = 60;

const defaultPhoto = require("../../assets/general-img-landscape.png");

export default function Matching() {
  const [users, setUsers] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [myPhoto, setMyPhoto] = useState(null);
  const [myUserId, setMyUserId] = useState(null);   // 🆕 Tu ID real
  const [showEmpty, setShowEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHearts, setShowHearts] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const swiperRef = useRef(null);

  // 🆕 Tabs y fotos de vivienda
  const [activeTab, setActiveTab] = useState("perfil");
  const [housingPhotoIndices, setHousingPhotoIndices] = useState({}); // { [id_user]: index }

  const router = useRouter();  // 🆕

  useEffect(() => {
    const loadMyData = async () => {
      const storedId = await AsyncStorage.getItem("userId");
      setMyUserId(Number(storedId));
    };
    loadMyData();
  }, []);

  // 🆕 Helpers de vivienda
  const getCurrentUser = () => users[cardIndex] || null;

  const getCurrentHousingPhotoIndex = (u) => {
    const user = u || getCurrentUser();
    if (!user) return 0;
    return housingPhotoIndices[user.id_user] || 0;
  };

  const nextHousingPhoto = () => {
    const user = getCurrentUser();
    if (user?.housing_images?.length > 0) {
      const current = housingPhotoIndices[user.id_user] || 0;
      const next = (current + 1) % user.housing_images.length;
      setHousingPhotoIndices((prev) => ({ ...prev, [user.id_user]: next }));
    }
  };

  const prevHousingPhoto = () => {
    const user = getCurrentUser();
    if (user?.housing_images?.length > 0) {
      const current = housingPhotoIndices[user.id_user] || 0;
      const prev = (current - 1 + user.housing_images.length) % user.housing_images.length;
      setHousingPhotoIndices((prevState) => ({ ...prevState, [user.id_user]: prev }));
    }
  };

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
        const recs = res.data.recommendations || [];
        setUsers(recs);
        setCardIndex(0);

        // 🧍‍♂️ Obtener tu foto
        try {
          const myRes = await axios.get(
            "https://turumiapi.onrender.com/user_photos",
            config
          );

          if (myRes.data?.images?.length > 0) {
            setMyPhoto(myRes.data.images[0]);
          } else {
            setMyPhoto(null);
          }
        } catch {
          setMyPhoto(null);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setUsers([]);
        setMyPhoto(null);
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
    // Aseguramos obtener el usuario correcto aún si el índice del callback difiere
    const likedUser = users[index] || users[cardIndex];
    if (!likedUser) {
      console.warn("⚠️ No se encontró usuario para crear match en índice", index, "cardIndex", cardIndex);
      return;
    }

    const targetId = likedUser.id_user ?? likedUser.id;
    if (!targetId) {
      console.warn("⚠️ Usuario sin id válido:", likedUser);
      Alert.alert("No se puede crear match", "Falta el id del usuario objetivo.");
      return;
    }

    try {
      console.log("📤 Creando match con usuario:", targetId, likedUser);
      const res = await createMatch(Number(targetId));

      console.log("📥 Respuesta createMatch:", res);
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
    <LinearGradient colors={["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)"]} style={styles.gradientBackground}>
      <View style={{ flex: 1 }}>
        {/* 💳 Swiper */}
        <View style={styles.swiperContainer}>
        <Swiper
          key={`sw-${cardIndex}-${activeTab}-${getCurrentHousingPhotoIndex()}`}
          ref={swiperRef}
          cards={users}
          cardIndex={cardIndex}
          renderCard={(user) =>
            user ? (
              <View style={styles.card} key={`${user.id_user || user.id}-${activeTab}-${getCurrentHousingPhotoIndex(user)}`}>
                <View style={styles.imageContainer}>
                  {/* Tabs sobre la foto si tiene vivienda */}
                  {user?.user_type === "user_w_housing" && (
                    <View style={styles.tabsContainer} onStartShouldSetResponder={() => true}>
                      <TouchableOpacity
                        style={[styles.tab, activeTab === "perfil" && styles.activeTab]}
                        onPress={() => setActiveTab("perfil")}
                      >
                        <Text style={[styles.tabText, activeTab === "perfil" && styles.activeTabText]}>PERFIL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tab, activeTab === "casa" && styles.activeTab]}
                        onPress={() => setActiveTab("casa")}
                      >
                        <Text style={[styles.tabText, activeTab === "casa" && styles.activeTabText]}>CASA</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === "casa" ? (
                    <>
                      <Image
                        source={{
                          uri:
                            (user.housing_images && user.housing_images[getCurrentHousingPhotoIndex(user)]) ||
                            "https://placehold.co/800x600?text=Sin%20imagen%20de%20vivienda",
                        }}
                        style={styles.image}
                      />
                      {user.housing_images && user.housing_images.length > 1 && (
                        <>
                          <TouchableOpacity style={styles.leftButton} onPress={prevHousingPhoto}>
                            <Text style={styles.navButtonText}>‹</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rightButton} onPress={nextHousingPhoto}>
                            <Text style={styles.navButtonText}>›</Text>
                          </TouchableOpacity>
                          <View style={styles.dotsContainer}>
                            {user.housing_images.map((_, i) => (
                              <View
                                key={`dot-${user.id_user}-${i}`}
                                style={[styles.dot, i === getCurrentHousingPhotoIndex(user) && styles.activeDot]}
                              />
                            ))}
                          </View>
                        </>
                      )}
                    </>
                  ) : (
                    <Image
                      source={user.user_images?.[0] ? { uri: user.user_images[0] } : defaultPhoto}
                      style={styles.image}
                    />
                  )}
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.name}>
                    {user.name}
                    {user.age ? `, ${user.age}` : ""}
                  </Text>
                  {user.occupation && <Text style={styles.carrera}>{user.occupation}</Text>}
                  {user.description && <Text style={styles.bio}>{user.description}</Text>}
                  {user.lifestyle_schedule && <Text style={styles.bio}>{user.lifestyle_schedule}</Text>}
                </View>
              </View>
            ) : null
          }
          stackSize={1}
          backgroundColor="transparent"
          verticalSwipe={false}
          disableTopSwipe
          disableBottomSwipe
          stackSeparation={0}
          animateCardOpacity
          cardStyle={styles.swiperCard}
          containerStyle={styles.swiperAbsoluteContainer}
          onSwiped={(i) => setCardIndex((prev) => Math.min(prev + 1, Math.max(i + 1, prev + 1, users.length - 1)))}
          onSwipedAborted={() => { /* no-op to keep state */ }}
          onSwipedLeft={(i) => {
            // Avanza el índice usando el índice provisto por el callback
            setCardIndex((prev) => Math.min(i + 1, users.length - 1));
            setActiveTab('perfil');
            handleDislike(i);
          }}
          onSwipedRight={(i) => {
            setCardIndex((prev) => Math.min(i + 1, users.length - 1));
            setActiveTab('perfil');
            handleLike(i);
          }}
          onSwipedAll={() => setShowEmpty(true)}
        />
        </View>

        {/* Botones 
          {!showEmpty && (
            <View style={styles.buttonsContainer} pointerEvents="box-none">
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
        */}

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
                  source={typeof myPhoto === 'string' && myPhoto ? { uri: myPhoto } : defaultPhoto}
                  style={styles.matchPhoto}
                />
                <Image
                  source={matchedUser?.images?.[0] ? { uri: matchedUser.images[0] } : defaultPhoto}
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
  // En web reservamos espacio manual para el tab bar; en móvil dejamos que el tab bar se superponga
  gradientBackground: { flex: 1, paddingBottom: Platform.OS === 'web' ? TABBAR_HEIGHT : 0 },
  container: { flex: 1, justifyContent: "center"},
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  swiperContainer: {
    flex: 1,
    width: '100%',
  },
  swiperCard: {
    width: '100%',
    height: '100%',
    marginLeft: 0,
    marginRight: 0,
    padding: Platform.OS === 'web' ? 12 : 8,
  },
  swiperAbsoluteContainer: {
    flex: 1,
    width: '100%',
    marginLeft: 0,
    marginRight: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: Platform.OS === 'web' ? TABBAR_HEIGHT : 60,
    left: -20,
    right: 0,
  },
  card: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  imageContainer: {
    flex: 3, // 75%
    width: '100%',
  },
  infoContainer: {
    flex: 1, // 25%
    padding: 16,
    justifyContent: 'flex-start',
  },
  image: { flex: 1, width: '100%', height: '100%', resizeMode: 'cover' },
  name: { fontSize: 24, fontWeight: "bold", color: "#111" },
  carrera: { fontSize: 18, color: COLORS.primary, marginBottom: 6 },
  bio: { fontSize: 16, color: "#6B7280" },
  // Tabs sobre imagen
  tabsContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    color: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeTabText: {
    color: '#fff',
  },
  // Navegación de fotos vivienda
  leftButton: {
    position: 'absolute',
    top: '45%',
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  rightButton: {
    position: 'absolute',
    top: '45%',
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    // En móvil los dejamos algo más arriba para no chocar con el tab bar nativo
    bottom: Platform.OS === 'web' ? 10 : TABBAR_HEIGHT + -50,
    left: 0,
    right: 0,
    zIndex: 999,
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
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 48,
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
