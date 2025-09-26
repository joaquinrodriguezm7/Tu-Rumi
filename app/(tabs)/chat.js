import { View, Text, StyleSheet } from "react-native";

export default function Chat() {
  return (
    <View style={[styles.container, { backgroundColor: "lightpink" }]}>
      <Text style={styles.text}>Pantalla Chat 💬</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, fontWeight: "bold" },
});
