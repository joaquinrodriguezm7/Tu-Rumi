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
  Platform,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../styles";
import { Entypo, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

const { width, height } = Dimensions.get("window");

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Modales
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [prefModalVisible, setPrefModalVisible] = useState(false);

  // Preferencias
  const [preferences, setPreferences] = useState({
    smoker: "",
    drinker: "",
    pets: "",
    lifestyle_schedule: "",
    occupation: "",
    sociability: "",
    preferred_gender: "",
    min_age: 18,
    max_age: 40,
    min_rent: 100000,
    max_rent: 500000,
    min_km_radius: 0,
    max_km_radius: 20,
  });

  // Fotos
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setEmail(parsedUser.email || "");
          setPhone(parsedUser.phone_number || parsedUser.telefono || "");

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

  const handleSelectPhotos = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return Alert.alert("Permiso denegado", "Se necesita acceso a tu galería para agregar fotos.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const assets = result.assets || [result];
        setSelectedImages(assets.map((a) => a.uri));
      }
    } catch (err) {
      console.error("❌ Error al seleccionar fotos:", err.message);
    }
  };

  const handleUploadPhoto = async () => {
    try {
      if (selectedImages.length === 0) {
        return Alert.alert("Selecciona al menos una foto antes de subir.");
      }

      setUploading(true);
      const token = await AsyncStorage.getItem("accessToken");
      const csrf = await AsyncStorage.getItem("csrfToken");
      if (!token) return Alert.alert("Error", "No se encontró el token.");

      const formData = new FormData();
      for (const uri of selectedImages) {
        if (Platform.OS === "web") {
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileName = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
          formData.append("images", file);
        } else {
          const fileName = uri.split("/").pop();
          const fileType = "image/jpeg";
          formData.append("images", { uri, name: fileName, type: fileType });
        }
      }

      const res = await axios.post(
        "https://turumiapi.onrender.com/user_photos/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            accesstoken: token,
            "x-csrf-token": csrf,
          },
          withCredentials: true,
        }
      );

      if (res.data?.images?.length > 0) {
        const nuevas = res.data.images.map((img) => img.url);
        setPhotos((prev) => [...prev, ...nuevas]);
        setPhotoIndex(photos.length);
        setSelectedImages([]);
        setPhotoModalVisible(false);
        Alert.alert("✅ Éxito", "Fotos subidas correctamente");
      } else {
        Alert.alert("⚠️ Aviso", "No se recibieron imágenes en la respuesta");
      }
    } catch (err) {
      console.error("❌ Error al subir foto:", err.response?.data || err.message);
      Alert.alert("Error", "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const nextPhoto = () => {
    if (photos.length > 0) setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (photos.length > 0) setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
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
        {/* Imagen principal */}
        <TouchableOpacity style={styles.imageContainer} onPress={() => setPhotoModalVisible(true)}>
          {photos.length > 0 ? (
            <>
              <Image source={{ uri: photos[photoIndex] }} style={styles.coverPhoto} />

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
        </TouchableOpacity>

        {/* Info usuario */}
        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
            <Feather name="edit-3" size={22} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={() => setPhotoModalVisible(true)}>
            <Feather name="camera" size={22} color="#444" />
          </TouchableOpacity>

          {/* 🆕 Botón de preferencias */}
          <TouchableOpacity style={styles.prefButton} onPress={() => setPrefModalVisible(true)}>
            <MaterialCommunityIcons name="tune" size={22} color="#444" />
            <Text style={styles.prefText}>Preferencias</Text>
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

        {/* Modal editar info */}
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

        {/* Modal fotos */}
        <Modal visible={photoModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Administrar fotos</Text>

              <TouchableOpacity style={styles.addPhotoBtn} onPress={handleSelectPhotos}>
                <Feather name="image" size={20} color="#fff" />
                <Text style={styles.addPhotoText}>Agregar foto</Text>
              </TouchableOpacity>

              {selectedImages.length > 0 ? (
                <View>
                  <FlatList
                    data={selectedImages}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(uri) => uri}
                    renderItem={({ item }) => (
                      <Image source={{ uri: item }} style={styles.previewImage} />
                    )}
                    style={{ marginVertical: 10 }}
                  />
                  <TouchableOpacity
                    style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
                    onPress={handleUploadPhoto}
                    disabled={uploading}
                  >
                    <Text style={styles.uploadBtnText}>
                      {uploading ? "Subiendo..." : "Subir fotos"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={{ textAlign: "center", color: "#555", marginVertical: 10 }}>
                    No has seleccionado fotos todavía
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setPhotoModalVisible(false)}>
                <Text style={styles.btnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 🆕 Modal de preferencias mejorado */}
{/* 🆕 Modal de preferencias con Pickers */}
<Modal visible={prefModalVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { maxHeight: "80%" }]}>
      <Text style={styles.modalTitle}>Preferencias</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Smoker */}
        <Text style={styles.label}>Fumador</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferences.smoker}
            onValueChange={(itemValue) =>
              setPreferences({ ...preferences, smoker: itemValue })
            }
          >
            <Picker.Item label="Seleccionar..." value="" />
            <Picker.Item label="Diario" value="Diario" />
            <Picker.Item label="Ocasional" value="Ocasional" />
            <Picker.Item label="No fumador" value="No fumador" />
          </Picker>
        </View>

        {/* Drinker */}
        <Text style={styles.label}>Bebedor</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferences.drinker}
            onValueChange={(itemValue) =>
              setPreferences({ ...preferences, drinker: itemValue })
            }
          >
            <Picker.Item label="Seleccionar..." value="" />
            <Picker.Item label="Diario" value="Diario" />
            <Picker.Item label="Ocasional" value="Ocasional" />
            <Picker.Item label="No bebedor" value="No bebedor" />
          </Picker>
        </View>

        {/* Pets */}
        <Text style={styles.label}>Mascotas</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferences.pets}
            onValueChange={(itemValue) =>
              setPreferences({ ...preferences, pets: itemValue })
            }
          >
            <Picker.Item label="Seleccionar..." value="" />
            <Picker.Item label="Sí" value={1} />
            <Picker.Item label="No" value={0} />
          </Picker>
        </View>

        {/* Lifestyle schedule */}
        <Text style={styles.label}>Horario de vida</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferences.lifestyle_schedule}
            onValueChange={(itemValue) =>
              setPreferences({ ...preferences, lifestyle_schedule: itemValue })
            }
          >
            <Picker.Item label="Seleccionar..." value="" />
            <Picker.Item label="Diurno" value="Diurno" />
            <Picker.Item label="Nocturno" value="Nocturno" />
          </Picker>
        </View>

        {/* Occupation */}
        <Text style={styles.label}>Ocupación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Ingeniero, Estudiante..."
          placeholderTextColor="#aaa"
          maxLength={25}
          value={preferences.occupation}
          onChangeText={(text) =>
            setPreferences({ ...preferences, occupation: text })
          }
        />

        {/* Sociability */}
        <Text style={styles.label}>Sociabilidad</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferences.sociability}
            onValueChange={(itemValue) =>
              setPreferences({ ...preferences, sociability: itemValue })
            }
          >
            <Picker.Item label="Seleccionar..." value="" />
            <Picker.Item label="Extrovertido" value="Extrovertido" />
            <Picker.Item label="Introvertido" value="Introvertido" />
          </Picker>
        </View>

        {/* Preferred gender */}
        <Text style={styles.label}>Género preferido</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferences.preferred_gender}
            onValueChange={(itemValue) =>
              setPreferences({ ...preferences, preferred_gender: itemValue })
            }
          >
            <Picker.Item label="Seleccionar..." value="" />
            <Picker.Item label="Masculino" value="Masculino" />
            <Picker.Item label="Femenino" value="Femenino" />
          </Picker>
        </View>
      </ScrollView>

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setPrefModalVisible(false)}
        >
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => setPrefModalVisible(false)}
        >
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
  photoButton: {
    position: "absolute",
    right: 20,
    top: 60,
    backgroundColor: "#F2F2F2",
    padding: 8,
    borderRadius: 50,
    elevation: 3,
    zIndex: 9,
  },
  prefButton: {
    position: "absolute",
    right: 20,
    top: 100,
    backgroundColor: "#F2F2F2",
    padding: 8,
    borderRadius: 50,
    elevation: 3,
    zIndex: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  prefText: { marginLeft: 6, fontSize: 15, color: "#444", fontWeight: "500" },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  name: { fontSize: 28, fontWeight: "bold", color: "#222" },
  age: { fontSize: 26, color: "#444" },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  icon: { marginRight: 10 },
  infoText: { fontSize: 16, color: "#555" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },
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
  btnText: { fontWeight: "600", fontSize: 16 },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
  },
  addPhotoText: { color: "#fff", fontSize: 16, marginLeft: 8 },
  previewImage: { width: 100, height: 100, borderRadius: 10, marginRight: 8 },
  uploadBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  uploadBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelBtnModal: {
    marginTop: 10,
    backgroundColor: "#EEE",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

label: {
  fontWeight: "600",
  color: "#333",
  marginTop: 10,
  marginBottom: 6,
},
pickerContainer: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  marginBottom: 10,
  backgroundColor: "#fafafa",
},

dropdown: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 10,
},
option: {
  backgroundColor: "#f0f0f0",
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  marginRight: 8,
  marginBottom: 8,
},
selectedOption: {
  backgroundColor: COLORS.primary,
},
optionText: {
  color: "#444",
  fontWeight: "500",
},
optionTextSelected: {
  color: "#fff",
  fontWeight: "700",
},

});
