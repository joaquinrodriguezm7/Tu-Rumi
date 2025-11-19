import { useEffect, useState, useRef } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, KeyboardAvoidingView, Image, Platform 
} from "react-native";
import io from "socket.io-client";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import globalStyles, { COLORS } from "../styles";
import { useHeaderHeight } from "@react-navigation/elements";

export default function ChatRoom() {
  const { userId, otherUserId } = useLocalSearchParams();

  const chatId = [Number(userId), Number(otherUserId)].sort().join("_");

  const socket = useRef(
    io("https://turumisocket.onrender.com", {
      transports: ["websocket"],
      reconnection: true,
    })
  ).current;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [userPhoto, setUserPhoto] = useState(null);
  const [otherPhoto, setOtherPhoto] = useState(null);
  const [otherName, setOtherName] = useState("Usuario");
  const headerHeight = useHeaderHeight();


  // ==========================
  // CARGAR FOTOS Y NOMBRE REAL
  // ==========================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (!token) {
          console.log("❌ No hay token en AsyncStorage");
          return;
        }

        const res = await axios.get(
          "https://turumiapi.onrender.com/user/recommendations",
          {
            headers: {
              accesstoken: token,
            },
            withCredentials: true,
          }
        );

        const users = res.data.recommendations;

        const me = users.find((u) => u.id_user === Number(userId));
        const other = users.find((u) => u.id_user === Number(otherUserId));

        // FOTO MÍA
        setUserPhoto(
          me?.user_images?.length > 0
            ? me.user_images[0]
            : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Cristiano_Ronaldo_2018.jpg"
        );

        // FOTO OTRO USER
        setOtherPhoto(
          other?.user_images?.length > 0
            ? other.user_images[0]
            : "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
        );

        if (other?.name) setOtherName(other.name);

      } catch (err) {
        console.log("❌ Error cargando usuarios:", err.response?.data || err);
      }
    };

    fetchUsers();
  }, []);

  // ==========================
  // SOCKET
  // ==========================
  useEffect(() => {
    socket.emit("user_connected", Number(userId));
    socket.emit("join_chat", chatId);

    const handleReceive = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      chatId,
      from: Number(userId),
      message,
      created_at: new Date(),
    };

    socket.emit("send_message", msgData);
    setMessage("");
  };

      const renderItem = ({ item }) => {
        const isMine = item.from === Number(userId);

        return (
          <View
            style={[
              styles.msgRow,
              isMine ? styles.rowRight : styles.rowLeft,
            ]}
          >

            {/* SOLO MOSTRAR FOTO SI ES DEL OTRO */}
            {!isMine && (
              <Image
                source={{ uri: otherPhoto }}
                style={styles.avatar}
              />
            )}

            <View style={styles.msgContent}>
              <View style={styles.headerRow}>
                <Text style={styles.username}>
                  {isMine ? "Tú" : otherName}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
                </Text>
              </View>

              <View
                style={[
                  styles.bubble,
                  isMine ? styles.myBubble : styles.otherBubble,
                ]}
              >
                <Text style={styles.msgText}>{item.message}</Text>
              </View>
            </View>
          </View>
        );
      };


  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.gradientBackground}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          style={styles.chatList}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: headerHeight, flexGrow: 1 }}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
  },

  container: {
    flex: 1,
  },

  chatList: {
    flex: 1,
    paddingHorizontal: 15,
  },

  /* ============================
     FILA DE MENSAJE (FILAMENTO)
     ============================ */
  msgRow: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "flex-start",
    gap: 10,
  },

  rowLeft: {
    alignSelf: "flex-start",
    flexDirection: "row",
  },

  rowRight: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },

  /* ============================
     AVATAR (SOLO OTRO USUARIO)
     ============================ */
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 50,
  },

  /* ============================
     CONTENIDO DEL MENSAJE
     ============================ */
  msgContent: {
    maxWidth: "75%",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 3,
  },

  username: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 14,
  },

  time: {
    fontSize: 10,
    color: "#ddd",
  },

  /* ============================
     BURBUJAS
     ============================ */
  bubble: {
    borderRadius: 15,
    padding: 10,
  },

  myBubble: {
    backgroundColor: "#4CAF50",
    alignSelf: "flex-end",
  },

  otherBubble: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
  },

  msgText: {
    fontSize: 15,
    color: "#fff",
  },

  /* ============================
     INPUT
     ============================ */
  inputArea: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "transparent",
    width: "100%",
    alignItems: "center",
    marginBottom: 70,
  },

  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",                    // texto blanco
    fontSize: 16,
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    borderRadius: 25,
  },

  sendText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

});
