import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { AppText } from "./AppText";
import { colors, radii } from "../theme";

type PrimaryButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
};

export function PrimaryButton({ label, icon, variant = "primary", style, onPress, ...props }: PrimaryButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handlePress: NonNullable<PressableProps["onPress"]> = (event) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.pressable, pressed && styles.pressed, style]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={[colors.orangeLight, colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.content}>
          {icon}
          <AppText variant="bodyStrong" color="#160B04">{label}</AppText>
        </LinearGradient>
      ) : (
        <LinearGradient colors={["rgba(255,255,255,0.09)", "rgba(255,255,255,0.04)"]} style={[styles.content, styles.secondary]}>
          {icon}
          <AppText variant="bodyStrong" color={colors.text}>{label}</AppText>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  content: {
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
