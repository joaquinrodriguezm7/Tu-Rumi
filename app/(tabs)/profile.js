import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("❌ Error cargando usuario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4D96FF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No hay usuario guardado 😢</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {user.photo_url ? (
          <Image source={{ uri: user.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={{ color: "#888" }}>Sin foto</Text>
          </View>
        )}

        <Text style={styles.name}>{user.name}</Text>

        {user.age && <Text style={styles.info}>Edad: {user.age}</Text>}
        {user.gender || user.genero ? (
          <Text style={styles.info}>Género: {user.gender || user.genero}</Text>
        ) : null}
        {user.phone_number || user.telefono ? (
          <Text style={styles.info}>Teléfono: {user.phone_number || user.telefono}</Text>
        ) : null}
        {user.email && <Text style={styles.info}>Correo: {user.email}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  errorText: {
    fontSize: 16,
    color: "#777",
  },
  card: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
});
