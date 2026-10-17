import { Text, type TextProps, type TextStyle } from "react-native";

type TextVariant = "eyebrow" | "caption" | "body" | "bodyStrong" | "subtitle" | "title" | "display";

const variantStyles: Record<TextVariant, TextStyle> = {
  eyebrow: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.7, textTransform: "uppercase" },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12, letterSpacing: 0.1, lineHeight: 17 },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  bodyStrong: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  subtitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, letterSpacing: -0.35, lineHeight: 24 },
  title: { fontFamily: "Inter_700Bold", fontSize: 27, letterSpacing: -1, lineHeight: 34 },
  display: { fontFamily: "Inter_700Bold", fontSize: 38, letterSpacing: -1.8, lineHeight: 44 },
};

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

export function AppText({ variant = "body", color, style, ...props }: AppTextProps) {
  return <Text {...props} style={[variantStyles[variant], color ? { color } : null, style]} />;
}
