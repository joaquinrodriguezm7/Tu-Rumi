import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import globalStyles, { COLORS } from "../styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import AnimatedLine from "../components/titleBorder";
import { Ionicons } from "@expo/vector-icons";  

const { width, height } = Dimensions.get("window");

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("user_w_housing");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !userType) {
      Alert.alert("Error", "Debes ingresar email, contraseña y tipo de usuario");
      return;
    }

    if (password != confirmPassword) {
      Alert.alert("Error", "Las contraseñas deben coincidir");
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

      Alert.alert("✅ Registro exitoso", "Usuario registrado correctamente");

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (error) {
      console.error("Error en registro:", error.message);
      Alert.alert("Error", "No se pudo crear el usuario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.gradientBackground}
      start={{ x:0 , y:0}}
      end={{ x:1, y:0 }}
    >
      <View style={styles.overlay}>
        <View style={styles.imageOverlay}>
          <Image
            source={require("../../assets/logo_blanco.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: "absolute",
              bottom: 16,
              left: 16
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={{
              alignSelf: "flex-start",
              marginBottom: 36
            }}>
              <Text style={styles.title}>Registrate</Text>
              <AnimatedLine widthFinal={150}/>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <Text style={styles.labelForm}>
                  Email
                </Text>
                <TextInput
                  style={[
                    globalStyles.input,
                    styles.inputForm
                  ]}
                  placeholder="example@email.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={styles.labelForm}>
                  Contraseña
                </Text>
                <TextInput
                  style={[
                    globalStyles.input,
                    styles.inputForm
                  ]}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <Text style={styles.labelForm}>
                  Confirmar Contraseña
                </Text>
                <TextInput
                  style={[
                    globalStyles.input,
                    styles.inputForm
                  ]}
                  placeholder="Confirma la contraseña ingresada"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <Text style={styles.label}>Tipo de usuario</Text>

                <View style={globalStyles.pickerWrapper}>
                  <Picker
                    selectedValue={userType}
                    onValueChange={(itemValue) => setUserType(itemValue)}
                    style={globalStyles.picker}
                  >
                    <Picker.Item label="Con vivienda" value="user_w_housing" />
                    <Picker.Item label="Sin vivienda" value="user_wo_housing" />
                  </Picker>
                </View>

                <TouchableOpacity
                  style={globalStyles.button}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={globalStyles.buttonText}>
                    {loading ? "Cargando..." : "Registrarse"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </View>
    </LinearGradient>
  );
}

/* ============================
   RESPONSIVE STYLES
=============================== */
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
  },

  overlay: {
    flex: 1,
    width: "100%"
  },

  logo: {
    width: 80,
    height: 80
  },
  imageOverlay: {
    width: "100%",
    flex: 0.15,
    justifyContent: "flex-end",
    alignItems: "center",   
  },
  formContainer: {
    width: "100%",
    flex: 0.85,
    justifyContent: "flex-start",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
    borderTopLeftRadius:24,
    borderTopRightRadius:24,
  },
  form: {
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 16,
    marginBottom: 24,
    marginTop: 24,
    marginHorizontal: 24,
  },
  inputForm: {
    borderBottomWidth: 1,
    borderBottomColor: "#929292ff",
    borderRadius: 0,
    borderWidth: 0,
    paddingRight: 36
  },
  labelForm: {
    fontSize: 18, 
    color: COLORS.primary, 
    marginBottom: 8,
    fontWeight: "600" 
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3C8DFF",
    textAlign: "start",
  },
  label: {
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "600",
    color: "black",
    fontSize: width * 0.04,
  },
});