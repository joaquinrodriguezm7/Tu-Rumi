import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
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
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (res.canceled) return;

    const converted = [];

    for (const asset of res.assets) {
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );

      converted.push({
        uri: manip.uri,
        type: "image/jpeg",
        name: `housing_${Date.now()}.jpg`,
      });
    }

    setPhotos(converted);
  };

  // Upload photos
  const uploadPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos 1 foto");
      return;
    }

    try {
      setLoading(true);

      const housingId = await AsyncStorage.getItem("housingId");
      const token = await AsyncStorage.getItem("accessToken");

      const formData = new FormData();

      photos.forEach((p, i) => {
        formData.append("images", {
          uri: p.uri,
          name: `housing_${housingId}_${i}.jpg`,
          type: "image/jpeg",
        });
      });

      await axios.post("/housing_photos/upload", formData, {
        headers: {
         "Content-Type": "multipart/form-data",
          accesstoken: token,
        },
      });

      Alert.alert("Éxito", "Fotos subidas con éxito.");
      router.replace("/(tabs)/matching");

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudieron subir las fotos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>FOTOS DE TU VIVIENDA</Text>

        <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
          <Text style={styles.pickText}>Seleccionar imágenes</Text>
        </TouchableOpacity>

        <ScrollView horizontal style={{ marginTop: 20 }}>
          {photos.map((p, i) => (
            <Image key={i} source={{ uri: p.uri }} style={styles.preview} />
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.uploadButton} onPress={uploadPhotos}>
          <Text style={styles.uploadText}>
            {loading ? "Subiendo..." : "Subir fotos"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, alignItems: "center" },
  title: { fontSize: 26, color: "#FFF", fontWeight: "bold", marginBottom: 20 },
  pickButton: {
    backgroundColor: "#6736D5",
    padding: 14,
    borderRadius: 12,
    width: "95%",
  },
  pickText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  preview: {
    width: 110,
    height: 110,
    marginRight: 12,
    borderRadius: 12,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    width: "95%",
    marginTop: 25,
  },
  uploadText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});
