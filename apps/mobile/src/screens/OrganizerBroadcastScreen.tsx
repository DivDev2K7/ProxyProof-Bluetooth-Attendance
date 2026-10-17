import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { GlassCard } from "../components/GlassCard";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  OrganizerBleBroadcaster,
  type OrganizerBroadcastCredentials,
  type OrganizerBroadcastState,
} from "../ble/advertiser";
import { colors, spacing } from "../theme";

type OrganizerBroadcastScreenProps = {
  createSession: () => Promise<OrganizerBroadcastCredentials>;
};

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function OrganizerBroadcastScreen({ createSession }: OrganizerBroadcastScreenProps) {
  const broadcaster = useMemo(() => new OrganizerBleBroadcaster(), []);
  const [state, setState] = useState<OrganizerBroadcastState>({ status: "idle" });
  const [now, setNow] = useState(Date.now());
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = broadcaster.subscribe(setState);
    return () => {
      unsubscribe();
      void broadcaster.stop("manual").catch((error: unknown) => {
        console.error("Failed to stop the organizer BLE broadcast on screen exit.", error);
      });
    };
  }, [broadcaster]);

  useEffect(() => {
    if (state.status !== "broadcasting") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.status]);

  const isWorking = state.status === "starting" || state.status === "stopping";

  async function startSession() {
    setRequestError(null);
    try {
      const credentials = await createSession();
      await broadcaster.start(credentials);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to start the attendance session.");
    }
  }

  async function stopSession() {
    setRequestError(null);
    try {
      await broadcaster.stop("manual");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to stop the BLE broadcast.");
    }
  }

  const isBroadcasting = state.status === "broadcasting";
  const canStop = isBroadcasting || state.status === "error";
  const statusTitle = isBroadcasting
    ? "Session is on air"
    : state.status === "starting"
      ? "Preparing broadcast"
      : state.status === "stopping"
        ? "Stopping broadcast"
        : state.status === "error"
          ? "Broadcast needs attention"
          : "Ready when you are";
  const remaining = isBroadcasting ? formatRemaining(state.expiresAt - now) : null;
  const errorMessage = requestError ?? (state.status === "error" ? state.message : null);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <AppText variant="eyebrow" color={colors.orange}>PROXYPROOF  /  ORGANIZER</AppText>
        <AppText variant="title" style={styles.title}>Take attendance.</AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Start a session to broadcast its rotating check-in code over Bluetooth.
        </AppText>

        <GlassCard style={styles.statusCard}>
          <View style={[styles.statusIcon, isBroadcasting && styles.statusIconActive]}>
            <Ionicons name={isBroadcasting ? "radio" : "bluetooth"} size={23} color={isBroadcasting ? colors.success : colors.orangeLight} />
          </View>
          <AppText variant="subtitle" style={styles.statusTitle}>{statusTitle}</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.statusText}>
            {isBroadcasting
              ? "The session UUID is visible to nearby student devices. A fresh HMAC-SHA256 code is broadcast every 3 seconds."
              : state.status === "stopped" && state.reason === "background"
                ? "Broadcast stopped because the app left the foreground. Start the session again when ready."
                : "Session credentials are issued by the server before any Bluetooth broadcast begins."}
          </AppText>
          {isBroadcasting && remaining && (
            <View style={styles.timer}>
              <AppText variant="eyebrow" color={colors.textMuted}>TIME LEFT</AppText>
              <AppText variant="display" color={colors.text}>{remaining}</AppText>
            </View>
          )}
        </GlassCard>

        {errorMessage && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={17} color="#FF8C8C" />
            <AppText variant="caption" color="#FFD2D2" style={styles.errorText}>{errorMessage}</AppText>
          </View>
        )}

        <PrimaryButton
          label={canStop ? "Close session" : "Start session"}
          icon={<Ionicons name={canStop ? "stop" : "radio"} size={17} color={canStop ? colors.text : "#160B04"} />}
          variant={canStop ? "secondary" : "primary"}
          disabled={isWorking}
          onPress={() => void (canStop ? stopSession() : startSession())}
          style={styles.actionButton}
        />

        <View style={styles.footnote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textDim} />
          <AppText variant="caption" color={colors.textDim} style={styles.footnoteText}>
            Android only for this broadcast. Keep this screen open; background BLE advertising is not enabled.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    marginTop: 12,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 330,
    lineHeight: 22,
  },
  statusCard: {
    alignItems: "center",
    padding: 24,
    marginTop: 32,
  },
  statusIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,0,0.13)",
    marginBottom: 17,
  },
  statusIconActive: {
    backgroundColor: "rgba(87,211,155,0.12)",
  },
  statusTitle: {
    textAlign: "center",
  },
  statusText: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  timer: {
    alignItems: "center",
    marginTop: 23,
    gap: 5,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(229,9,20,0.35)",
    backgroundColor: "rgba(229,9,20,0.1)",
  },
  errorText: {
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: 24,
  },
  footnote: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  footnoteText: {
    flex: 1,
    lineHeight: 18,
  },
});
