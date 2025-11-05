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
  const [photos, setPhotos] = useState([]); // 🖼️ lista de fotos del usuario
  const [photoIndex, setPhotoIndex] = useState(0); // 📸 índice actual

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setEmail(parsedUser.email || "");
          setPhone(parsedUser.phone_number || parsedUser.telefono || "");

          // 🧠 obtener fotos desde el endpoint
          const token = await AsyncStorage.getItem("accessToken");
          const res = await axios.get("https://turumiapi.onrender.com/user_photos", {
            headers: { accesstoken: token },
            withCredentials: true,
          });

          if (res.data?.images?.length > 0) {
            setPhotos(res.data.images);
          }
        }
      } catch (err) {
        console.error("❌ Error cargando usuario o fotos:", err.message);
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

      const body = {
        name: user.name,
        age: user.age,
        gender: user.gender || user.genero,
        email: email,
        phone_number: phone,
      };

      const res = await axios.put(`https://turumiapi.onrender.com/user/${user.id}`, body, {
        headers: { accesstoken: token },
        withCredentials: true,
      });

      console.log("✅ Usuario actualizado:", res.data);
      setUser({ ...user, ...body });
      setEditing(false);
      Alert.alert("✅ Actualizado", "Tu usuario se ha actualizado correctamente");
    } catch (err) {
      console.error("❌ Error al actualizar usuario:", err.response?.data || err.message);
      Alert.alert("Error", "No se pudo actualizar el usuario");
    }
  };

  // 🔄 Navegación entre fotos
  const nextPhoto = () => {
    if (photos.length > 0) {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 0) {
      setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>
        {/* 🖼️ Imagen de portada con navegación */}
        <View style={styles.imageContainer}>
          {photos.length > 0 ? (
            <>
              <Image source={{ uri: photos[photoIndex] }} style={styles.coverPhoto} />

              {/* 🔘 Botones izquierda / derecha */}
              {photos.length > 1 && (
                <>
                  <TouchableOpacity style={styles.leftButton} onPress={prevPhoto}>
                    <Entypo name="chevron-left" size={40} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rightButton} onPress={nextPhoto}>
                    <Entypo name="chevron-right" size={40} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.dotsContainer}>
                    {photos.map((_, i) => (
                      <View key={i} style={[styles.dot, i === photoIndex && styles.activeDot]} />
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
              }}
              style={styles.coverPhoto}
            />
          )}
        </View>

        {/* 🧾 Info del usuario */}
        <View style={styles.infoSection}>
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

        {/* 🧾 Sección de datos adicionales desplazable */}
        <View style={styles.scrollableInfoSection}>
          <View style={styles.infoRow}>
            <Entypo name="info" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.description || "Sin descripción"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cigar" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.smoker || "No especificado"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="beer" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.drinker || "No especificado"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="paw" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.pets ? "Sí" : "No"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.lifestyle_schedule || "No especificado"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="briefcase" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.occupation || "No especificado"}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-group" size={18} color="#444" style={styles.icon} />
            <Text style={styles.infoText}>{user.sociability || "No especificado"}</Text>
          </View>
        </View>

        {/* ✏️ Modal de edición */}
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
  gradientBackground: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10 },
  imageContainer: { width: "100%", height: height * 0.67, marginTop: 65 },
  coverPhoto: { width: "100%", height: "100%", resizeMode: "cover" },

  // 🔘 botones de navegación
  leftButton: {
    position: "absolute",
    top: "45%",
    left: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 25,
    padding: 5,
  },
  rightButton: {
    position: "absolute",
    top: "45%",
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 25,
    padding: 5,
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
  activeDot: { backgroundColor: "#fff" },

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

  scrollableInfoSection: {
    backgroundColor: "#fff",
    padding: 24,
    marginTop: 10,
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
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  name: { fontSize: 28, fontWeight: "bold", color: "#222" },
  age: { fontSize: 26, color: "#444" },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  icon: { marginRight: 10 },
  infoText: { fontSize: 16, color: "#555" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#EEE", borderRadius: 8 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.primary, borderRadius: 8 },
  btnText: { fontWeight: "600", fontSize: 16 },
});
