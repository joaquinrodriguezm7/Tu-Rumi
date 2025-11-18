import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { COLORS } from "./styles";

export default function HousingPhoto() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pick Images
  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permiso requerido", "Se necesita acceso a la galería para seleccionar fotos.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (res.canceled) return;

      const converted = [];

      for (const asset of res.assets) {
        const manip = await ImageManipulator.manipulateAsync(
          asset.uri,
          [],
          { 
            format: ImageManipulator.SaveFormat.JPEG, 
            compress: 0.8 
          }
        );

        // 🆕 Mantener el nombre original o generar uno similar
        const originalName = asset.fileName || `housing_${Date.now()}.jpg`;
        converted.push({
          uri: manip.uri,
          type: "image/jpeg",
          name: originalName,
        });
      }

      setPhotos(converted);
    } catch (error) {
      console.error("❌ Error seleccionando imágenes:", error);
      Alert.alert("Error", "No se pudieron seleccionar las imágenes");
    }
  };

  // Upload photos - ESTRUCTURA IDÉNTICA A POSTMAN
  const uploadPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos 1 foto");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("accessToken");
      const csrfToken = await AsyncStorage.getItem("csrfToken");

      if (!token) {
        Alert.alert("Error", "No se encontró el token de acceso");
        return;
      }

      console.log("🚀 Iniciando upload con estructura Postman...");

      const formData = new FormData();

      // 🆕 ESTRUCTURA IDÉNTICA A POSTMAN
      // En Postman: Key="images", Value=File, Type=File
      photos.forEach((photo) => {
        formData.append("images", {
          uri: photo.uri,
          name: photo.name,
          type: 'image/jpeg'
        });
      });

      console.log("📤 FormData creado:", {
        key: "images",
        files: photos.length,
        firstFile: photos[0]?.name
      });

      // 🆕 HEADERS IDÉNTICOS A POSTMAN
      const headers = {
        'accesstoken': token,
        'x-csrf-token': csrfToken || '',
        // 🆕 NO incluir 'Content-Type': 'multipart/form-data' - axios lo hace automáticamente
      };

      console.log("📨 Headers:", headers);

      // 🆕 PETICIÓN IDÉNTICA A POSTMAN
      const response = await axios.post(
        "https://turumiapi.onrender.com/housing_photos/upload", 
        formData, 
        {
          headers: headers,
          // 🆕 NO withCredentials: true (Postman no lo usa por defecto)
          timeout: 30000,
        }
      );

      console.log("✅ Respuesta del servidor:", response.data);

      // 🆕 VERIFICAR RESPUESTA IDÉNTICA A POSTMAN
      if (response.data && response.data.message === "Imagenes subida") {
        Alert.alert("Éxito", "Fotos subidas con éxito.");
        // 🆕 Redirigir después de confirmar que todo salió bien
        setTimeout(() => {
          router.replace("/(tabs)/matching");
        }, 1500);
      } else {
        console.warn("⚠️ Respuesta inesperada:", response.data);
        Alert.alert("Aviso", "Fotos subidas pero respuesta inesperada del servidor.");
      }

    } catch (error) {
      console.error("❌ Error detallado:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          headers: error.config?.headers
        }
      });

      let errorMessage = "No se pudieron subir las fotos.";
      
      if (error.response?.data?.message) {
        errorMessage = `Error del servidor: ${error.response.data.message}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Timeout: La solicitud tardó demasiado tiempo.";
      } else if (error.message.includes('Network Error')) {
        errorMessage = "Error de red: Verifica tu conexión a internet.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove photo
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>FOTOS DE TU VIVIENDA</Text>
        <Text style={styles.subtitle}>Selecciona al menos una foto de tu vivienda</Text>

        <TouchableOpacity 
          style={styles.pickButton} 
          onPress={pickImages}
          disabled={loading}
        >
          <Text style={styles.pickText}>
            {photos.length > 0 ? "Agregar más imágenes" : "Seleccionar imágenes"}
          </Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <>
            <Text style={styles.photosCount}>
              {photos.length} foto(s) seleccionada(s)
            </Text>
            
            <ScrollView 
              horizontal 
              style={styles.photosContainer}
              showsHorizontalScrollIndicator={false}
            >
              {photos.map((p, i) => (
                <View key={i} style={styles.photoItem}>
                  <Image source={{ uri: p.uri }} style={styles.preview} />
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removePhoto(i)}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.uploadButton, 
                loading && styles.uploadButtonDisabled
              ]} 
              onPress={uploadPhotos}
              disabled={loading}
            >
              <Text style={styles.uploadText}>
                {loading ? "Subiendo..." : "Subir fotos"}
              </Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { 
    flex: 1 
  },
  container: { 
    padding: 20, 
    alignItems: "center",
    paddingTop: 60,
  },
  title: { 
    fontSize: 26, 
    color: "#FFF", 
    fontWeight: "bold", 
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 30,
    textAlign: "center",
  },
  pickButton: {
    backgroundColor: "#6736D5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    maxWidth: 300,
  },
  pickText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  photosCount: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  photosContainer: {
    marginTop: 10,
    marginBottom: 20,
    maxHeight: 130,
  },
  photoItem: {
    position: "relative",
    marginRight: 15,
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF3B30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    width: "100%",
    maxWidth: 300,
    marginTop: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  uploadText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});