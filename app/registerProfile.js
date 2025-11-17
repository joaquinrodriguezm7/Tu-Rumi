// app/registerProfile.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import globalStyles, { COLORS } from "./styles";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";

axios.defaults.baseURL = "https://turumiapi.onrender.com";
axios.defaults.withCredentials = true;

export default function RegisterProfile() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Masculino");
  const [phone, setPhone] = useState(""); // 👈 nuevo campo
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSaveProfile = async () => {
  console.log("🟦 Botón presionado, intentando guardar perfil...");

  if (!name || !age || !gender || !phone) {
    Alert.alert("Error", "Por favor completa todos los campos.");
    return;
  }

  try {
    setLoading(true);
    const userData = await AsyncStorage.getItem("user");
    if (!userData) {
      Alert.alert("Error", "No se encontró información del usuario.");
      return;
    }

    const user = JSON.parse(userData);
    const userId = user.id_user || user.id; // ✅ corregido
    if (!userId) {
      Alert.alert("Error", "El ID de usuario no es válido.");
      return;
    }

    const payload = {
      name,
      age: Number(age),
      gender,
      phone_number: phone,
    };

    console.log("📦 Enviando payload:", payload);

    const res = await axios.put(`/user/${userId}`, payload, { withCredentials: true });

    console.log("✅ Respuesta del backend:", res.data);

    if (res.status === 200) {
      await AsyncStorage.setItem("profileCompleted", "true");
      Alert.alert("Listo", "Información personal guardada con éxito.");
      router.replace("/matching");
    } else {
      console.warn("⚠️ Código inesperado:", res.status);
      Alert.alert("Error", "No se pudo guardar la información.");
    }
  } catch (error) {
    console.error("❌ Error actualizando perfil:", error.response?.data || error.message);
    Alert.alert("Error", error.response?.data?.message || "No se pudo actualizar el perfil.");
  } finally {
    setLoading(false);
  }
};


  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientBackground}>
      <View style={styles.card}>
        <Text style={[globalStyles.titleSmall, styles.title]}>
          Completa tu información personal
        </Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Edad"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <TextInput
          style={globalStyles.input}
          placeholder="Número de teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View style={globalStyles.pickerWrapper}>
          <Picker
            selectedValue={gender}
            onValueChange={(value) => setGender(value)}
          >
            <Picker.Item label="Masculino" value="Masculino" />
            <Picker.Item label="Femenino" value="Femenino" />
            <Picker.Item label="Otro" value="Otro" />
          </Picker>
        </View>

        <TouchableOpacity
          style={globalStyles.button}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          <Text style={globalStyles.buttonText}>
            {loading ? "Guardando..." : "Continuar"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
    color: "#FFF",
  },
});


