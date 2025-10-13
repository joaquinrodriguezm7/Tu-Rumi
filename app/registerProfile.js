// app/registerProfile.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
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
    <View style={styles.container}>
      <Text style={styles.title}>Completa tu información personal</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Edad"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Número de teléfono"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <View style={styles.pickerContainer}>
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
        style={styles.button}
        onPress={handleSaveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Guardando..." : "Continuar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "white",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#4D96FF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
