import { useEffect, useState } from "react"; // 
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
import Slider from "@react-native-community/slider";

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
  const [preferences, setPreferences] = useState(false);

  // Fotos
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // PROFILE INFO (nuevo modal)
  const [profile, setProfile] = useState(null);  
  const [profileModalVisible, setProfileModalVisible] = useState(false);


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

        // ================================
        // 📸 Cargar fotos del usuario
        // ================================
        const res = await axios.get(
          "https://turumiapi.onrender.com/user_photos",
          {
            headers: { accesstoken: token },
            withCredentials: true,
          }
        );

        if (res.data?.images?.length > 0) {
          setPhotos(res.data.images);
        }

        // ================================
        // 🎯 Cargar preferencias del usuario
        // ================================
        try {
          const prefRes = await axios.get(
            "https://turumiapi.onrender.com/preference",
            {
              headers: { accesstoken: token },
              withCredentials: true,
            }
          );

          // Si existen preferencias → cargarlas
          if (prefRes.data?.id_preferences) {
            setPreferences(prefRes.data);
          }

          // Si NO existen → dejar default pero marcar null
          else {
            setPreferences((prev) => ({
              ...prev,
              id_preferences: null,
            }));
          }
        } catch (err) {
          console.error("❌ Error cargando preferencias:", err.message);
        }
      }

      // ================================
      // 🧩 Cargar PROFILE del usuario
      // ================================
        try {

          const token = await AsyncStorage.getItem("accessToken");
          const profileRes = await axios.get(
            "https://turumiapi.onrender.com/profile",
            {
              headers: { accesstoken: token },
              withCredentials: true,
            }
          );

          if (profileRes.data?.id_profile) {
            setProfile(profileRes.data);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("❌ Error cargando profile:", err.message);
        }

    } catch (err) {
      console.error("❌ Error cargando usuario o fotos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  loadUser();
}, []);

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

  // Refresca las fotos desde el backend
  const fetchPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(
        "https://turumiapi.onrender.com/user_photos",
        {
          headers: { accesstoken: token },
          withCredentials: true,
        }
      );
      if (res.data?.images?.length > 0) {
        setPhotos(res.data.images);
        setPhotoIndex(0);
      }
    } catch (err) {
      console.error("❌ Error recargando fotos:", err.message);
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
        // Después de subir, refresca la lista de fotos
        await fetchPhotos();
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
          <TouchableOpacity style={styles.editButton} onPress={() => setProfileModalVisible(true)}>
            <Feather name="edit-3" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={() => setPhotoModalVisible(true)}>
            <Feather name="camera" size={22} color="white" />
          </TouchableOpacity>

          {/* 🆕 Botón de preferencias */}
          <TouchableOpacity style={styles.prefButton} onPress={() => setPrefModalVisible(true)}>
            <MaterialCommunityIcons name="tune" size={22} color="white" />
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

        {/* 🆕 Modal información del perfil */}
        <Modal visible={profileModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: "85%" }]}>

              <Text style={styles.modalTitle}>Información de perfil</Text>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* DESCRIPTION */}
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Descripción breve"
                  value={profile?.description || ""}
                  onChangeText={(text) =>
                    setProfile({ ...(profile || {}), description: text })
                  }
                />

                {/* SMOKER */}
                <Text style={styles.label}>Fumas?</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile?.smoker || ""}
                    onValueChange={(val) =>
                      setProfile({ ...(profile || {}), smoker: val })
                    }
                  >
                    <Picker.Item label="Seleccionar..." value="" />
                    <Picker.Item label="Sí" value="Si" />
                    <Picker.Item label="No" value="No" />
                    <Picker.Item label="Socialmente" value="Socialmente" />
                  </Picker>
                </View>

                {/* DRINKER */}
                <Text style={styles.label}>Bebes alcohol?</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile?.drinker || ""}
                    onValueChange={(val) =>
                      setProfile({ ...(profile || {}), drinker: val })
                    }
                  >
                    <Picker.Item label="Seleccionar..." value="" />
                    <Picker.Item label="No" value="No" />
                    <Picker.Item label="Socialmente" value="Socialmente" />
                    <Picker.Item label="Frecuentemente" value="Frecuentemente" />
                  </Picker>
                </View>

                {/* PETS */}
                <Text style={styles.label}>Mascotas (0 a 5)</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile?.pets ?? 0}
                    onValueChange={(val) =>
                      setProfile({ ...(profile || {}), pets: Number(val) })
                    }
                  >
                    {[0,1,2,3,4,5].map((n) => (
                      <Picker.Item key={n} label={String(n)} value={n} />
                    ))}
                  </Picker>
                </View>

                {/* LIFESTYLE */}
                <Text style={styles.label}>Horario de vida</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile?.lifestyle_schedule || ""}
                    onValueChange={(val) =>
                      setProfile({ ...(profile || {}), lifestyle_schedule: val })
                    }
                  >
                    <Picker.Item label="Seleccionar..." value="" />
                    <Picker.Item label="Diurno" value="Diurno" />
                    <Picker.Item label="Nocturno" value="Nocturno" />
                  </Picker>
                </View>

                {/* OCCUPATION */}
                <Text style={styles.label}>Ocupación</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Estudiante, Ingeniero..."
                  value={profile?.occupation || ""}
                  onChangeText={(text) =>
                    setProfile({ ...(profile || {}), occupation: text })
                  }
                />

                {/* SOCIABILITY */}
                <Text style={styles.label}>Sociabilidad</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile?.sociability || ""}
                    onValueChange={(val) =>
                      setProfile({ ...(profile || {}), sociability: val })
                    }
                  >
                    <Picker.Item label="Seleccionar..." value="" />
                    <Picker.Item label="Introvertido" value="Introvertido" />
                    <Picker.Item label="Extrovertido" value="Extrovertido" />
                  </Picker>
                </View>

                {/* ID COMUNA */}
              <Text style={styles.label}>Comuna</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={profile?.id_comuna || 1}
                  onValueChange={(val) =>
                    setProfile({ ...(profile || {}), id_comuna: Number(val) })
                  }
                >
                  <Picker.Item label="1" value={1} />
                  <Picker.Item label="2" value={2} />
                  <Picker.Item label="3" value={3} />
                  <Picker.Item label="4" value={4} />
                  <Picker.Item label="5" value={5} />
                </Picker>
              </View>

              </ScrollView>

              {/* BOTONES */}
              <View style={styles.modalButtons}>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={async () => {
                    try {
                      const token = await AsyncStorage.getItem("accessToken");
                      const body = {
                        id_user: user.id,
                        description: profile?.description || "",
                        smoker: profile?.smoker || null,
                        drinker: profile?.drinker || null,
                        pets: profile?.pets ?? null,
                        lifestyle_schedule: profile?.lifestyle_schedule || null,
                        occupation: profile?.occupation || null,
                        sociability: profile?.sociability || null,
                        id_comuna: Number(profile?.id_comuna) || 1
                      };

                      let res;

                      if (!profile?.id_profile) {
                        // POST
                        res = await axios.post(
                          "https://turumiapi.onrender.com/profile",
                          body,
                          { headers: { accesstoken: token }, withCredentials: true }
                        );
                      } else {
                        // PUT
                        res = await axios.put(
                          "https://turumiapi.onrender.com/profile",
                          { ...body, id_profile: profile.id_profile },
                          { headers: { accesstoken: token }, withCredentials: true }
                        );
                      }

                      console.log("Profile guardado:", res.data);

                      setProfile(res.data);
                      setProfileModalVisible(false);
                      Alert.alert("Éxito", "Información guardada correctamente");

                    } catch (err) {
                      console.log("❌ Error guardando profile:", err.response?.data || err);
                      Alert.alert("Error", "No se pudo guardar la información");
                    }
                  }}
                >
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

  {/* 🆕 Modal de preferencias (ACTUALIZADO CON SLIDERS) */}
  <Modal visible={prefModalVisible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { maxHeight: "80%" }]}>
        <Text style={styles.modalTitle}>Preferencias</Text>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* preferred_gender */}
          <Text style={styles.label}>Género preferido</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={preferences.preferred_gender || ""}
              onValueChange={(itemValue) =>
                setPreferences({ ...preferences, preferred_gender: itemValue })
              }
            >
              <Picker.Item label="Seleccionar..." value="" />
              <Picker.Item label="Femenino" value="Femenino" />
              <Picker.Item label="Masculino" value="Masculino" />
              <Picker.Item label="Indistinto" value="Indistinto" />
            </Picker>
          </View>

          {/* Edad mínima */}
          <Text style={styles.label}>Edad mínima: {preferences.min_age}</Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={18}
            maximumValue={100}
            step={1}
            value={preferences.min_age ?? 18}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#ccc"
            onValueChange={(val) =>
              setPreferences({ ...preferences, min_age: Math.round(val) })
            }
          />

          {/* Edad máxima */}
          <Text style={styles.label}>Edad máxima: {preferences.max_age}</Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={18}
            maximumValue={100}
            step={1}
            value={preferences.max_age ?? 40}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#ccc"
            onValueChange={(val) =>
              setPreferences({ ...preferences, max_age: Math.round(val) })
            }
          />

          {/* Arriendo mínimo */}
          <Text style={styles.label}>
            Arriendo mínimo: ${preferences.min_rent?.toLocaleString("es-CL")}
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={500000}
            step={10000}
            value={preferences.min_rent ?? 0}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#ccc"
            onValueChange={(val) =>
              setPreferences({ ...preferences, min_rent: Math.round(val) })
            }
          />

          {/* Arriendo máximo */}
          <Text style={styles.label}>
            Arriendo máximo: ${preferences.max_rent?.toLocaleString("es-CL")}
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={500000}
            step={10000}
            value={preferences.max_rent ?? 0}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#ccc"
            onValueChange={(val) =>
              setPreferences({ ...preferences, max_rent: Math.round(val) })
            }
          />

          {/* Distancia mínima */}
          <Text style={styles.label}>
            Distancia mínima (km): {preferences.min_km_radius}
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={180}
            step={1}
            value={preferences.min_km_radius ?? 1}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#ccc"
            onValueChange={(val) =>
              setPreferences({
                ...preferences,
                min_km_radius: Math.round(val),
              })
            }
          />

          {/* Distancia máxima */}
          <Text style={styles.label}>
            Distancia máxima (km): {preferences.max_km_radius}
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={180}
            step={1}
            value={preferences.max_km_radius ?? 180}
            minimumTrackTintColor={COLORS.secondary}
            maximumTrackTintColor="#ccc"
            onValueChange={(val) =>
              setPreferences({
                ...preferences,
                max_km_radius: Math.round(val),
              })
            }
          />

          {/* Región preferida */}
          <Text style={styles.label}>Región preferida</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={preferences.preferred_region || ""}
              onValueChange={(itemValue) =>
                setPreferences({ ...preferences, preferred_region: itemValue })
              }
            >
              <Picker.Item label="Seleccionar..." value="" />
              <Picker.Item label="1" value={1} />
              <Picker.Item label="2" value={2} />
              <Picker.Item label="3" value={3} />
              {/* Agrega todas las regiones que necesites */}
            </Picker>
          </View>

        </ScrollView>

        {/* BOTONES */}
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setPrefModalVisible(false)}
          >
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              try {
                const token = await AsyncStorage.getItem("accessToken");

                const body = {
                  preferred_gender: preferences.preferred_gender,
                  min_age: preferences.min_age,
                  max_age: preferences.max_age,
                  min_rent: preferences.min_rent,
                  max_rent: preferences.max_rent,
                  min_km_radius: preferences.min_km_radius,
                  max_km_radius: preferences.max_km_radius,
                  preferred_region: preferences.preferred_region,
                };

                let res;

                // POST si no existen
                if (!preferences.id_preferences) {
                  res = await axios.post(
                    "https://turumiapi.onrender.com/preference",
                    body,
                    {
                      headers: { accesstoken: token },
                      withCredentials: true,
                    }
                  );
                  console.log("🆕 Preferencias creadas:", res.data);
                }

                // PUT si existen
                else {
                  res = await axios.put(
                    "https://turumiapi.onrender.com/preference",
                    body,
                    {
                      headers: { accesstoken: token },
                      withCredentials: true,
                    }
                  );
                  console.log("♻ Preferencias actualizadas:", res.data);
                }

                Alert.alert("Éxito", "Preferencias guardadas correctamente");
                setPrefModalVisible(false);

              } catch (err) {
                console.error("❌ Error al guardar preferencias:", err);
                Alert.alert("Error", "No se pudo guardar las preferencias");
              }
            }}
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
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    position: "relative",
  },
  editButton: {
    position: "absolute",
    right: 20,
    top: 30,
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 50,
    elevation: 3,
    zIndex: 10,
  },
  photoButton: {
    position: "absolute",
    right: 20,
    top: 75,
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 50,
    elevation: 3,
    zIndex: 9,
  },
  prefButton: {
    position: "absolute",
    right: 20,
    top: 120,
    backgroundColor: COLORS.secondary,
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
    backgroundColor: COLORS.secondary,
    borderRadius: 8,

  },
  btnText: { fontWeight: "600", fontSize: 16 },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
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
