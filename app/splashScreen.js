import { View, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { router } from "expo-router";

export default function SplashScreen() {
  const scale = useSharedValue(0);    // comienza invisible
  const opacity = useSharedValue(0);  // fade-in

  useEffect(() => {
    // Animación de entrada
    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });

    opacity.value = withDelay(
      200,
      withTiming(1, { duration: 600 })
    );

    setTimeout(() => {
      router.replace("/access"); 
    }, 1500);
  }, []);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/logo.png")}
        style={[styles.logo, animatedStyles]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF", // o tu color primario
  },
  logo: {
    width: 180,
    height: 180,
  },
});
