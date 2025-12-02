import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==============================
// CONFIG AXIOS
// ==============================
axios.defaults.baseURL = "https://turumiapi.onrender.com";
axios.defaults.withCredentials = true;

// ==============================
// CREAR MATCH (POST /match o PUT si ya existe inverso)
// ==============================
export const createMatch = async (targetUserId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const userStr = await AsyncStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    // 🧩 Aseguramos IDs correctos
    const currentUserId = Number(currentUser?.id_user || currentUser?.id);
    const targetId = Number(targetUserId);

    if (!currentUserId || !targetId) {
      throw new Error(`IDs inválidos → currentUserId: ${currentUserId}, targetUserId: ${targetId}`);
    }

    console.log(`👤 Usuario actual: ${currentUserId} → da like a: ${targetId}`);

    // 1️⃣ Obtener todos los matches del usuario
    const configGet = {
      headers: { accesstoken: token },
      withCredentials: true,
    };
    const resMatches = await axios.get("/match", configGet);
    const allMatches = resMatches.data?.matches || [];

    // 2️⃣ Buscar si existe un match inverso pendiente
    const inverseMatch = allMatches.find((m) => {
      const status = m.match_status || m.status || m.matchStatus;
      return (
        Number(m.from_id_user) === targetId &&
        Number(m.to_id_user) === currentUserId &&
        status === "pending"
      );
    });

    if (inverseMatch) {
      // 3️⃣ Confirmar el match (PUT /match)
      const body = { matchId: inverseMatch.id || inverseMatch.match_id, like: true };
      const configPut = {
        headers: {
          accesstoken: token,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      };
      const resUpdate = await axios.put("/match", body, configPut);
      console.log("🎉 Match confirmado:", resUpdate.data);
      return { matched: true, match: resUpdate.data.match };
    }

    // 4️⃣ Verificar si ya existe algún match o like previo
    const alreadyExists = allMatches.find((m) => {
      const status = m.match_status || m.status || m.matchStatus;
      return (
        ((Number(m.from_id_user) === currentUserId && Number(m.to_id_user) === targetId) ||
          (Number(m.from_id_user) === targetId && Number(m.to_id_user) === currentUserId)) &&
        ["pending", "matched"].includes(status)
      );
    });

    if (alreadyExists) {
      console.warn("⚠️ Ya existe un match entre estos usuarios:", alreadyExists);
      return { alreadyExists: true, match: alreadyExists };
    }

    console.log("📦 Matches obtenidos desde backend:", resMatches.data);

    // 5️⃣ Crear nuevo match (POST /match)
    console.log("🆕 No hay match inverso, creando uno nuevo (pending)...");
    // Algunos backends requieren también el from_id_user explícito; enviamos variantes para máxima compatibilidad
    const body = {
      from_id_user: currentUserId,
      to_id_user: targetId,
      // Campos redundantes por si el backend usa otros nombres
      targetUserId: targetId,
      like: true,
    };
    console.log("🛫 POST /match body:", body);
    const configPost = {
      headers: {
        accesstoken: token,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };
    let resPost;
    try {
      resPost = await axios.post("/match", body, configPost);
    } catch (e) {
      // Si falla por usuario objetivo, intentamos con sólo to_id_user
      const msg = e.response?.data?.message || e.message || "";
      if (/usuario objetivo/i.test(msg)) {
        const fallbackBody = { to_id_user: targetId, like: true };
        console.warn("🔁 Reintentando creación de match con cuerpo simplificado:", fallbackBody);
        resPost = await axios.post("/match", fallbackBody, configPost);
      } else {
        throw e;
      }
    }
    console.log("📬 Match creado (pending):", resPost.data);
    return { matched: false, match: resPost.data.match };

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
      headers: { accesstoken: token },
      withCredentials: true,
    };

    const res = await axios.get("/match", config);
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
