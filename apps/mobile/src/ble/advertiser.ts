import { AppState, NativeModules, PermissionsAndroid, Platform } from "react-native";
import { encodeTotpManufacturerData, generateTotp, validateTotpSecret } from "./totp";

const BLE_COMPANY_ID_FOR_TESTING = 0xffff;
const TOTP_PERIOD_SECONDS = 3;
const MAX_SESSION_DURATION_SECONDS = 60 * 60 * 12;
const ADVERTISE_OPTIONS = {
  advertiseMode: 1,
  txPowerLevel: 2,
  connectable: false,
  includeDeviceName: false,
  includeTxPowerLevel: false,
};

type AdvertiserNativeModule = {
  setCompanyId(companyId: number): void;
  broadcast(serviceUuid: string, manufacturerData: number[], options: typeof ADVERTISE_OPTIONS): Promise<string>;
  stopBroadcast(): Promise<string>;
};

type AdvertiserState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "broadcasting"; sessionId: string; expiresAt: number; counter: number }
  | { status: "stopping" }
  | { status: "stopped"; reason: "expired" | "manual" | "background" }
  | { status: "error"; message: string };

export type OrganizerBroadcastState = AdvertiserState;

export type OrganizerBroadcastCredentials = {
  sessionId: string;
  totpSecretHex: string;
  serverTime: string;
  expiresAt: string;
};

type StateListener = (state: AdvertiserState) => void;

const nativeAdvertiser = NativeModules.BLEAdvertiser as AdvertiserNativeModule | undefined;

function getAdvertiser(): AdvertiserNativeModule {
  if (Platform.OS !== "android") {
    throw new Error("Organizer BLE broadcasting is currently supported on Android only; iOS does not broadcast the rotating token.");
  }
  if (!nativeAdvertiser) {
    throw new Error("BLE advertising requires a native development build; it is not available in Expo Go.");
  }
  return nativeAdvertiser;
}

function parseUuidBytes(value: string): number[] {
  const normalized = value.toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
    throw new Error("The server returned an invalid session UUID.");
  }
  return normalized.replace(/-/g, "").match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16));
}

function parseIsoTime(value: string, fieldName: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`The server returned an invalid ${fieldName}.`);
  return timestamp;
}

function getTotpCounter(timestampMs: number): number {
  return Math.floor(timestampMs / (TOTP_PERIOD_SECONDS * 1000));
}

async function requestAdvertisePermission(): Promise<void> {
  if (Platform.OS !== "android" || Number(Platform.Version) < 31) return;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  const denied = permissions.filter((permission) => result[permission] !== PermissionsAndroid.RESULTS.GRANTED);
  if (denied.length > 0) {
    throw new Error("Bluetooth advertising permission is required to start an attendance session.");
  }
}

export class OrganizerBleBroadcaster {
  private state: AdvertiserState = { status: "idle" };
  private listener?: StateListener;
  private rotationTimer?: ReturnType<typeof setTimeout>;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private appStateSubscription?: ReturnType<typeof AppState.addEventListener>;
  private isAdvertising = false;
  private sessionId?: string;
  private secretHex?: string;
  private expiresAt = 0;
  private serverOffsetMs = 0;
  private counter = -1;
  private operation = Promise.resolve();
  private generation = 0;

  subscribe(listener: StateListener): () => void {
    this.listener = listener;
    listener(this.state);
    return () => {
      if (this.listener === listener) this.listener = undefined;
    };
  }

  private setState(state: AdvertiserState): void {
    this.state = state;
    this.listener?.(state);
  }

  async start(credentials: OrganizerBroadcastCredentials): Promise<void> {
    if (
      this.state.status === "starting" ||
      this.state.status === "broadcasting" ||
      this.state.status === "stopping"
    ) {
      throw new Error("An attendance session is already starting or broadcasting.");
    }
    const generation = ++this.generation;
    const advertiser = getAdvertiser();
    const serviceUuid = credentials.sessionId.toLowerCase();
    parseUuidBytes(serviceUuid);
    validateTotpSecret(credentials.totpSecretHex);
    const serverTime = parseIsoTime(credentials.serverTime, "server time");
    this.expiresAt = parseIsoTime(credentials.expiresAt, "session expiry");
    this.serverOffsetMs = serverTime - Date.now();
    const durationSeconds = (this.expiresAt - serverTime) / 1000;
    if (durationSeconds <= 0 || durationSeconds > MAX_SESSION_DURATION_SECONDS) {
      throw new Error("The session expiry must be in the future and no more than 12 hours away.");
    }

    await requestAdvertisePermission();
    this.sessionId = serviceUuid;
    this.secretHex = credentials.totpSecretHex;
    this.counter = -1;
    advertiser.setCompanyId(BLE_COMPANY_ID_FOR_TESTING);
    this.appStateSubscription = AppState.addEventListener("change", (appState) => {
      if (appState !== "active" && (this.state.status === "starting" || this.state.status === "broadcasting")) {
        void this.stop("background").catch((error: unknown) => {
          this.setState({ status: "error", message: error instanceof Error ? error.message : "Failed to stop BLE advertising." });
        });
      }
    });

    try {
      this.setState({ status: "starting" });
      await this.advertiseCurrentToken(advertiser, generation);
      if (generation !== this.generation || AppState.currentState !== "active") {
        throw new Error("The organizer app left the foreground before BLE advertising could start.");
      }
      this.expiryTimer = setTimeout(() => {
        void this.stop("expired").catch((error: unknown) => {
          this.setState({ status: "error", message: error instanceof Error ? error.message : "Failed to stop BLE advertising." });
        });
      }, this.expiresAt - (Date.now() + this.serverOffsetMs));
      this.setState({
        status: "broadcasting",
        sessionId: this.sessionId,
        expiresAt: this.expiresAt - this.serverOffsetMs,
        counter: this.counter,
      });
      this.scheduleRotation(advertiser, generation);
    } catch (error) {
      if (this.rotationTimer) clearTimeout(this.rotationTimer);
      if (this.expiryTimer) clearTimeout(this.expiryTimer);
      this.appStateSubscription?.remove();
      this.appStateSubscription = undefined;
      if (this.isAdvertising && generation === this.generation) {
        try {
          await advertiser.stopBroadcast();
          this.isAdvertising = false;
        } catch (stopError) {
          const stopMessage = stopError instanceof Error ? stopError.message : "Unknown BLE stop error.";
          this.secretHex = undefined;
          this.sessionId = undefined;
          this.setState({
            status: "error",
            message: `${error instanceof Error ? error.message : "Failed to start BLE advertising."} Also failed to stop advertising: ${stopMessage}`,
          });
          throw new Error(`Failed to start BLE advertising and failed to stop it: ${stopMessage}`);
        }
      }
      this.secretHex = undefined;
      this.sessionId = undefined;
      if (generation === this.generation && this.state.status !== "stopped") {
        this.setState({ status: "error", message: error instanceof Error ? error.message : "Failed to start BLE advertising." });
      }
      throw error;
    }
  }

  private async advertiseCurrentToken(advertiser: AdvertiserNativeModule, generation: number): Promise<void> {
    const sessionId = this.sessionId;
    const secretHex = this.secretHex;
    if (!sessionId || !secretHex) throw new Error("No active attendance session is available to broadcast.");
    if (generation !== this.generation) return;

    const now = Date.now() + this.serverOffsetMs;
    if (now >= this.expiresAt) throw new Error("The attendance session has expired.");
    const nextCounter = getTotpCounter(now);
    const tokenData = encodeTotpManufacturerData(generateTotp(secretHex, nextCounter));

    if (this.isAdvertising) {
      await advertiser.stopBroadcast();
      this.isAdvertising = false;
    }
    if (generation !== this.generation) return;
    await advertiser.broadcast(sessionId, tokenData, ADVERTISE_OPTIONS);
    if (generation !== this.generation) {
      await advertiser.stopBroadcast();
      return;
    }
    this.isAdvertising = true;
    this.counter = nextCounter;
    if (this.state.status !== "starting") {
      this.setState({
        status: "broadcasting",
        sessionId,
        expiresAt: this.expiresAt - this.serverOffsetMs,
        counter: nextCounter,
      });
    }
  }

  private scheduleRotation(advertiser: AdvertiserNativeModule, generation: number): void {
    if (generation !== this.generation || this.state.status !== "broadcasting") return;
    const now = Date.now() + this.serverOffsetMs;
    const delay = TOTP_PERIOD_SECONDS * 1000 - (now % (TOTP_PERIOD_SECONDS * 1000));
    this.rotationTimer = setTimeout(() => {
      this.operation = this.operation.then(async () => {
        if (generation !== this.generation || this.state.status !== "broadcasting") return;
        if (Date.now() + this.serverOffsetMs >= this.expiresAt) {
          await this.stopAdvertising("expired");
          return;
        }
        await this.advertiseCurrentToken(advertiser, generation);
        this.scheduleRotation(advertiser, generation);
      }).catch(async (error: unknown) => {
        const message = error instanceof Error ? error.message : "BLE token rotation failed.";
        try {
          await this.stopAdvertising("manual");
        } catch (stopError) {
          const stopMessage = stopError instanceof Error ? stopError.message : "Unknown BLE stop error.";
          this.setState({ status: "error", message: `${message} Also failed to stop advertising: ${stopMessage}` });
          return;
        }
        this.setState({ status: "error", message });
      });
    }, delay);
  }

  async stop(reason: "expired" | "manual" | "background" = "manual"): Promise<void> {
    if (this.state.status === "idle" || this.state.status === "stopped") return;
    if (this.state.status !== "stopping") {
      this.generation += 1;
      this.setState({ status: "stopping" });
    }
    const pendingOperation = this.operation;
    await pendingOperation;
    await this.stopAdvertising(reason);
  }

  private async stopAdvertising(reason: "expired" | "manual" | "background"): Promise<void> {
    if (this.rotationTimer) clearTimeout(this.rotationTimer);
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.rotationTimer = undefined;
    this.expiryTimer = undefined;
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;

    try {
      if (this.isAdvertising) {
        await getAdvertiser().stopBroadcast();
        this.isAdvertising = false;
      }
      this.secretHex = undefined;
      this.sessionId = undefined;
      this.setState({ status: "stopped", reason });
    } catch (error) {
      this.setState({ status: "error", message: error instanceof Error ? error.message : "Failed to stop BLE advertising." });
      throw error;
    }
  }
}
