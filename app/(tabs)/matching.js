import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { ThumbsUp, ThumbsDown } from "lucide-react-native";
import axios from "axios";
import { createMatch } from "../../services/matchService";


const { width } = Dimensions.get("window");

export default function Matching() {
  const [users, setUsers] = useState([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("https://turumiapi.onrender.com/user")
      .then(res => {
        setUsers(res.data);
      })
      .catch(err => {
        console.error("Error al obtener usuarios:", err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4D96FF" />
        <Text style={{marginTop: 16}}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={users}
        renderCard={(user) =>
          user ? (
            <View style={styles.card}>
              {/* Si tienes una propiedad de foto, usa user.photo, si no, muestra un placeholder */}
              {user.photo_url ? (
                <Image source={{ uri: user.photo_url }} style={styles.image} />
              ) : (
                <View style={[styles.image, {justifyContent:'center',alignItems:'center',backgroundColor:'#eee'}]}>
                  <Text>Sin foto</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>
                  {user.name}{user.age ? `, ${user.age}` : ''}
                </Text>
                {user.carrera && <Text style={styles.carrera}>{user.carrera}</Text>}
                {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
              </View>
            </View>
          ) : null
        }
        stackSize={2}
        backgroundColor={"#F9FAFB"}
        onSwipedLeft={(i) => console.log("❌ DISLIKE:", users[i]?.name)}
        onSwipedRight={async (i) => {
          const likedUser = users[i];
          if (!likedUser?.id_user) return console.warn("⚠️ Usuario sin ID, no se puede crear match");

          console.log("💚 LIKE:", likedUser.name);

          try {
            const res = await createMatch(likedUser.id_user || likedUser.id);
            console.log("✅ Match creado:", res);
          } catch (err) {
            console.error("❌ Error creando match:", err.response?.data || err.message);
          }
        }}
        onSwipedAll={() => setShowEmpty(true)}
        overlayLabels={{
          left: {
            element: (
              <View style={styles.dislikeOverlay}>
                <ThumbsDown size={60} color="white" />
                <Text style={styles.dislikeText}>NOPE</Text>
              </View>
            ),
            style: {
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                marginTop: 40,
                marginRight: 20,
              },
            },
          },
          right: {
            element: (
              <View style={styles.likeOverlay}>
                <ThumbsUp size={60} color="white" />
                <Text style={styles.likeText}>LIKE</Text>
              </View>
            ),
            style: {
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                marginTop: 40,
                marginLeft: 20,
              },
            },
          },
        }}
      />

      {showEmpty && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🚫No hay más usuarios🚫</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#F9FAFB" },
  card: {
    flex: 0.75,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 4,
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
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 6 },
  carrera: { fontSize: 18, color: "#4D96FF", marginBottom: 6 },
  bio: { fontSize: 16, color: "#6B7280" },
  emptyContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emptyText: { fontSize: 18, color: "#6B7280" },

  // 🎨 overlays personalizados
  dislikeOverlay: {
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  dislikeText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  likeOverlay: {
    backgroundColor: "rgba(0, 200, 0, 0.7)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  likeText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
});
