import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==============================
// CONFIG AXIOS
// ==============================
axios.defaults.baseURL = "https://turumiapi.onrender.com";
axios.defaults.withCredentials = true;

// ==============================
// CREAR MATCH (POST /match)
// ==============================
export const createMatch = async (targetUserId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("🔍 TOKEN A ENVIAR:", token);

    const body = { targetUserId }; // 👈 el backend espera este campo
    const config = {
      headers: {
        accesstoken: token, // 👈 en minúsculas exactas
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    console.log("📤 Configuración del request:", {
      endpoint: "/match",
      body,
      headers: config.headers,
    });

    const res = await axios.post("/match", body, config);

    console.log("📬 Respuesta completa del servidor:", res);
    return res.data;
  } catch (err) {
    console.error("❌ Error al crear match:", err.response?.data || err.message);
    console.error("🧱 Detalle del error:", err.response || err);
    throw err;
  }
};

// ==============================
// OBTENER MATCHES (GET /match)
// ==============================
export const getMatches = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) throw new Error("No se encontró accessToken en AsyncStorage");

    const config = {
      headers: {
        accesstoken: token,
      },
      withCredentials: true,
    };

    const res = await axios.get("/match", config);
    console.log("📬 Matches recibidos:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error al obtener matches:", err.response?.data || err.message);
    throw err;
  }
};

// ==============================
// ACTUALIZAR ESTADO DEL MATCH (PUT /match)
// ==============================
export const updateMatchStatus = async (matchId, like) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) throw new Error("No hay token guardado");

    const body = { matchId, like };
    const config = {
      headers: {
        accesstoken: token,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    console.log("📝 Actualizando match:", body);

    const res = await axios.put("/match", body, config);

    console.log("✅ Match actualizado:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error al actualizar match:", err.response?.data || err.message);
    throw err;
  }
};
