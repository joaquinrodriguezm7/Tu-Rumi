import axios from "axios";

const API_URL = "https://turumiapi.onrender.com/match";

// Crear un match (dar like)
export const createMatch = async (targetUserId) => {
  try {
    const res = await axios.post(API_URL, { targetUserId });
    return res.data;
  } catch (error) {
    console.error("❌ Error al crear match:", error.response?.data || error);
    throw error;
  }
};
