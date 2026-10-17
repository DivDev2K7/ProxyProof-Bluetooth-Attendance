import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, radii } from "../theme";

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  delay?: number;
};

export function GlassCard({ children, style, delay = 0 }: GlassCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(480)} style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.highlight} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
