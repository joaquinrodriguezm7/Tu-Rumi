import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { COLORS } from "./styles";

axios.defaults.baseURL = "https://turumiapi.onrender.com";
axios.defaults.withCredentials = true;

export default function CreateHousing() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [size, setSize] = useState("");
  const [availableRoom, setAvailableRoom] = useState("1");
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveHousing = async () => {
    if (!address || !rent || !size) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("accessToken");

      const payload = {
        address,
        id_region: 1,    // RM
        id_comuna: 4,    // Santiago
        rent: Number(rent),
        size: Number(size),
        available_room: Number(availableRoom),
        pets_allowed: petsAllowed,
        smoking_allowed: smokingAllowed,
      };

      const res = await axios.post("/housing", payload, {
        headers: { accesstoken: token },
      });

      const housingId = res.data?.housing?.id_housing;

      if (!housingId) throw new Error("No se recibió id_housing");

      // Guardar ID de vivienda
      await AsyncStorage.setItem("housingId", String(housingId));

      Alert.alert("Éxito", "Vivienda creada. Ahora sube fotos.");
      router.replace("/housingPhotos");

    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("Error", "No se pudo crear la vivienda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>CREAR VIVIENDA</Text>

        <TextInput
          style={styles.input}
          placeholder="Dirección"
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={styles.input}
          placeholder="Arriendo (CLP)"
          keyboardType="numeric"
          value={rent}
          onChangeText={setRent}
        />

        <TextInput
          style={styles.input}
          placeholder="Tamaño (m²)"
          keyboardType="numeric"
          value={size}
          onChangeText={setSize}
        />

        <TextInput
          style={styles.input}
          placeholder="Habitaciones disponibles"
          keyboardType="numeric"
          value={availableRoom}
          onChangeText={setAvailableRoom}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Mascotas permitidas</Text>
          <Switch value={petsAllowed} onValueChange={setPetsAllowed} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Fumar permitido</Text>
          <Switch value={smokingAllowed} onValueChange={setSmokingAllowed} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveHousing}>
          <Text style={styles.saveText}>
            {loading ? "Guardando..." : "Crear vivienda"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, alignItems: "center" },
  title: { fontSize: 28, color: "#FFF", fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "95%",
    backgroundColor: "#FFF",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
  },
  switchRow: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  switchText: { fontSize: 16, color: "#FFF" },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    width: "95%",
    marginTop: 30,
  },
  saveText: {
    textAlign: "center",
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
