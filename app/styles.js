export const COLORS = {
  primary: '#3C8DFF',      // Botones principales, enlaces, íconos activos
  secondary: '#836FFF',    // Acentos, indicadores activos en tabs
  background: '#0B1426',   // Fondo global o modo oscuro
  card: '#FFFFFF',         // Fondo de tarjeta (claro)
  cardAlt: '#F9FAFB',      // Alternativa fondo de tarjeta
  textDark: '#1E293B',     // Texto principal (oscuro)
  textLight: '#E2E8F0',    // Texto principal (claro)
};
import { StyleSheet } from "react-native";

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  containerCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  titleSmall: {
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
  buttonDanger: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
  },
});

export default globalStyles;
