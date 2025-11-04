import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../styles";
import { Entypo, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import axios from "axios";

const { width, height } = Dimensions.get("window");

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setEmail(parsedUser.email || "");
          setPhone(parsedUser.phone_number || parsedUser.telefono || "");
        }
      } catch (err) {
        console.error("❌ Error cargando usuario:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return Alert.alert("Error", "No se encontró el token");

      // 🧠 Crear el body con todos los campos actuales + los editados
      const body = {
        name: user.name,
        age: user.age,
        gender: user.gender || user.genero,
        email: email,
        phone_number: phone,
      };

      // 📨 Hacer PUT al endpoint correcto
      const res = await axios.put(`https://turumiapi.onrender.com/user/${user.id}`, body, {
        headers: { accesstoken: token },
        withCredentials: true,
      });

      console.log("✅ Usuario actualizado:", res.data);

      // 🗃️ Actualizar el estado local y cerrar modal
      setUser({ ...user, ...body });
      setEditing(false);
      Alert.alert("✅ Actualizado", "Tu usuario se ha actualizado correctamente");
    } catch (err) {
      console.error("❌ Error al actualizar usuario:", err.response?.data || err.message);
      Alert.alert("Error", "No se pudo actualizar el usuario");
    }
  };


  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={[styles.loadingText, { color: "#fff" }]}>Cargando perfil...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
        <View style={styles.center}>
          <Text style={{ color: "#fff", fontSize: 16 }}>No hay usuario guardado 😢</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Imagen de portada */}
        <View style={styles.imageContainer}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, styles.placeholder]}>
              <Text style={{ color: "#aaa" }}>Sin foto</Text>
            </View>
          )}
        </View>

        {/* Sección blanca con la info */}
        <View style={styles.infoSection}>
          {/* Botón editar */}
          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
            <Feather name="edit-3" size={22} color="#444" />
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.age && <Text style={styles.age}> {user.age}</Text>}
            <MaterialCommunityIcons name="check-decagram" size={20} color="#3C8DFF" style={{ marginLeft: 4 }} />
          </View>

          <View style={styles.infoRow}>
            <Entypo name="user" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.gender || user.genero || "No especificado"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Entypo name="phone" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{phone || "No definido"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Entypo name="mail" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{email || "No definido"}</Text>
          </View>
        </View>

        {/* Modal de edición */}
        <Modal visible={editing} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar información</Text>

              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={[styles.btnText, { color: "#fff" }]}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
  },
  imageContainer: {
    width: "100%",
    height: height * 0.672,
    marginTop: 65,
  },
  coverPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  infoSection: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    position: "relative",
  },
  editButton: {
    position: "absolute",
    right: 20,
    top: 20,
    backgroundColor: "#F2F2F2",
    padding: 8,
    borderRadius: 50,
    elevation: 3,
    zIndex: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
  },
  age: {
    fontSize: 26,
    color: "#444",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  icon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#EEE",
    borderRadius: 8,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  btnText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
