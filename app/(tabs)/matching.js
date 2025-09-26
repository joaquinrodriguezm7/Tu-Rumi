import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { ThumbsUp, ThumbsDown } from "lucide-react-native"; // 👈 íconos

const { width } = Dimensions.get("window");

export default function Matching() {
  const [users, setUsers] = useState([]);
  const [showEmpty, setShowEmpty] = useState(false);

  // 👇 Mock data con imagen
  useEffect(() => {
    setUsers([
      {
        id: 1,
        name: "María",
        age: 23,
        carrera: "Ingeniería",
        bio: "Me gusta leer y correr 🏃‍♀️",
        photo: require("../../assets/juan.jpeg"),
      },
      {
        id: 2,
        name: "José",
        age: 25,
        carrera: "Derecho",
        bio: "Fanático del cine 🎬",
        photo: require("../../assets/juan.jpeg"),
      },
      {
        id: 3,
        name: "Ana",
        age: 22,
        carrera: "Medicina",
        bio: "Amo los perros 🐶",
        photo: require("../../assets/juan.jpeg"),
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <Swiper
        cards={users}
        renderCard={(user) =>
          user ? (
            <View style={styles.card}>
              <Image source={user.photo} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name}>
                  {user.name}, {user.age}
                </Text>
                <Text style={styles.carrera}>{user.carrera}</Text>
                <Text style={styles.bio}>{user.bio}</Text>
              </View>
            </View>
          ) : null
        }
        stackSize={2}
        backgroundColor={"#F9FAFB"}
        onSwipedLeft={(i) => console.log("❌ DISLIKE:", users[i]?.name)}
        onSwipedRight={(i) => console.log("💚 LIKE:", users[i]?.name)}
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
