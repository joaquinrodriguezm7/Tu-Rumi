import { useEffect, useState, useRef } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, KeyboardAvoidingView, Platform 
} from "react-native";
import io from "socket.io-client";
import { useLocalSearchParams } from "expo-router";

export default function ChatRoom() {
  const { userId, otherUserId } = useLocalSearchParams();

  // chat_id único para esta conversación
  const chatId = [Number(userId), Number(otherUserId)].sort().join("_");

  const socket = useRef(
    io("https://turumisocket.onrender.com", {
      transports: ["websocket"],
      reconnection: true,
    })
  ).current;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // identificarse
    socket.emit("user_connected", Number(userId));

    // unirse a la sala
    socket.emit("join_chat", chatId);
    console.log("📌 unido a chat:", chatId);

    // escuchar mensajes
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
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

    setMessages((prev) => [...prev, msgData]);
    setMessage("");
  };

  const renderItem = ({ item }) => {
    const isMine = item.from === Number(userId);

    return (
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.msgText}>{item.message}</Text>
        <Text style={styles.msgTime}>
          {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        style={styles.chatList}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    paddingVertical: 10,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  myMessage: {
    backgroundColor: "#4CAF50",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: "#ddd",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 0,
  },
  msgText: {
    color: "#000",
    fontSize: 16,
  },
  msgTime: {
    fontSize: 10,
    color: "#333",
    marginTop: 3,
    alignSelf: "flex-end",
  },
  inputArea: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#aaa",
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 20,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
