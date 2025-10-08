import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker"; // 👈 instalar si no lo tienes

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user_w_housing"); // valor inicial
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !userType) {
      Alert.alert("Error", "Debes ingresar email, contraseña y tipo de usuario");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("https://turumiapi.onrender.com/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, user_type: userType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.errors ? JSON.stringify(data.errors) : data.message
        );
      }

      console.log("✅ Usuario creado:", data);

      await AsyncStorage.setItem("user", JSON.stringify(data));
      Alert.alert("✅ Registro exitoso", "Ahora puedes iniciar sesión");
      router.replace("/login");
    } catch (error) {
      console.error("Error en registro:", error.message);
      Alert.alert("Error", "No se pudo crear el usuario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Tipo de usuario</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={userType}
          onValueChange={(itemValue) => setUserType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Con vivienda" value="user_w_housing" />
          <Picker.Item label="Sin vivienda" value="user_wo_housing" />
        </Picker>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Cargando..." : "Registrarse"}
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
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
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
    width: "100%",
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
