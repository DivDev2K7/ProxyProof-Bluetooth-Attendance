import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { AppText } from "../components/AppText";
import { GlassCard } from "../components/GlassCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing } from "../theme";

const clubs = [
  { initials: "RC", name: "Robotics Club", detail: "Today · 5:30 PM", tint: "#FF6B00" },
  { initials: "DS", name: "Developer Student Club", detail: "Tomorrow · 6:00 PM", tint: "#668CFF" },
];

export function StudentHomeScreen() {
  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <AppText variant="eyebrow" color={colors.orange}>VIT VELLORE  /  STUDENT</AppText>
            <AppText variant="title" style={styles.greeting}>Good evening,</AppText>
            <AppText variant="title" color={colors.textMuted}>Divya.</AppText>
          </View>
          <View style={styles.avatar}>
            <AppText variant="bodyStrong" color={colors.text}>D</AppText>
            <View style={styles.avatarDot} />
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(650)}>
          <LinearGradient
            colors={["#25120C", "#151014", "#0D1018"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />
            <View style={styles.heroTop}>
              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, !previewEnabled && styles.offlineDot]} />
                <AppText variant="eyebrow" color={previewEnabled ? colors.success : colors.textMuted}>
                  {previewEnabled ? "ATTENDANCE PREVIEW" : "PREVIEW PAUSED"}
                </AppText>
              </View>
              <Ionicons name="bluetooth" size={19} color={previewEnabled ? colors.orangeLight : colors.textDim} />
            </View>
            <AppText variant="title" style={styles.heroTitle}>Just show up.</AppText>
            <AppText variant="body" color="#B5AFB3" style={styles.heroCopy}>
              {previewEnabled
                ? "Automatic check-ins will activate after BLE and location services are connected."
                : "Preview paused. Automatic check-ins are not connected yet."}
            </AppText>
            <View style={styles.heroBottom}>
              <View style={styles.secureNote}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.success} />
                <AppText variant="caption" color="#CBC6C9">Device verification preview</AppText>
              </View>
              <PrimaryButton
                label={previewEnabled ? "Pause preview" : "Resume preview"}
                variant="secondary"
                onPress={() => setPreviewEnabled((enabled) => !enabled)}
                style={styles.scanButton}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Your momentum</AppText>
          <AppText variant="caption" color={colors.textMuted}>SAMPLE SNAPSHOT</AppText>
        </View>
        <View style={styles.statsRow}>
          <GlassCard delay={80} style={styles.statCard}>
            <View style={styles.statIconOrange}>
              <Ionicons name="flame" size={17} color={colors.orangeLight} />
            </View>
            <AppText variant="display" style={styles.statNumber}>06</AppText>
            <AppText variant="caption" color={colors.textMuted}>week streak</AppText>
          </GlassCard>
          <GlassCard delay={150} style={styles.statCard}>
            <View style={styles.statIconBlue}>
              <Ionicons name="checkmark-done" size={17} color="#8BA5FF" />
            </View>
            <AppText variant="display" style={styles.statNumber}>94%</AppText>
            <AppText variant="caption" color={colors.textMuted}>attendance</AppText>
          </GlassCard>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle">On your radar</AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.sectionSubtext}>Your next club sessions</AppText>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
        </View>
        <View style={styles.clubList}>
          {clubs.map((club, index) => (
            <GlassCard key={club.name} delay={210 + index * 70} style={styles.clubCard}>
              <View style={[styles.clubMark, { backgroundColor: `${club.tint}22`, borderColor: `${club.tint}55` }]}>
                <AppText variant="eyebrow" color={club.tint}>{club.initials}</AppText>
              </View>
              <View style={styles.clubInfo}>
                <AppText variant="bodyStrong">{club.name}</AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.clubTime}>{club.detail}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.textDim} />
            </GlassCard>
          ))}
        </View>

        <View style={styles.footer}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.textDim} />
          <AppText variant="caption" color={colors.textDim}>Location checks are designed for active sessions only.</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  greeting: {
    marginTop: 9,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  hero: {
    minHeight: 218,
    overflow: "hidden",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.22)",
    borderRadius: radii.xl,
    marginBottom: 30,
  },
  heroGlow: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 110,
    right: -86,
    top: 42,
    backgroundColor: "rgba(229,9,20,0.17)",
    shadowColor: colors.crimson,
    shadowRadius: 65,
    shadowOpacity: 0.75,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 19,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  offlineDot: {
    backgroundColor: colors.textDim,
  },
  heroTitle: {
    fontSize: 29,
  },
  heroCopy: {
    maxWidth: 285,
    marginTop: 7,
    lineHeight: 20,
  },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 19,
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  scanButton: {
    minWidth: 102,
    minHeight: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionSubtext: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    padding: 15,
    minHeight: 145,
    justifyContent: "space-between",
  },
  statIconOrange: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,0,0.12)",
  },
  statIconBlue: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(102,140,255,0.14)",
  },
  statNumber: {
    marginTop: 10,
    fontSize: 32,
  },
  clubList: {
    gap: 10,
  },
  clubCard: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  clubMark: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clubInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clubTime: {
    marginTop: 4,
  },
  footer: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
});
