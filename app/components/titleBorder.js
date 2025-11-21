import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { COLORS } from "../styles";

export default function AnimatedLine({ widthFinal = 200}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(widthFinal, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [widthFinal]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View style={[animatedStyle, { overflow: "hidden" }]}>
      <LinearGradient
        colors={[COLORS.primary, "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          height: 2,
          width: widthFinal,
          borderRadius: 100,
          marginTop:1
        }}
      />
    </Animated.View>
  );
}
