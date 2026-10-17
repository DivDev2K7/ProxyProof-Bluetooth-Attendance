# ProxyProof mobile app

## Organizer BLE broadcast

This broadcaster currently supports Android only. On iOS, CoreBluetooth does not allow this advertiser to include the rotating manufacturer-data token; the app reports that limitation instead of starting an unverifiable session.

The organizer broadcast screen expects a `createSession` callback to call the backend and return credentials with this shape:

```ts
{
  sessionId: string;       // UUID for the active session
  totpSecretHex: string;   // 32 random bytes, hex-encoded; keep this secret
  serverTime: string;      // ISO timestamp from the same server response
  expiresAt: string;       // ISO timestamp
}
```

The server must authenticate the organizer, authorize the club, create the session, and issue a fresh secret over TLS. Do not hard-code or commit a TOTP secret. `OrganizerBroadcastScreen` is an integration point; pass the API-backed callback when mounting it for an authenticated organizer.

The Android BLE packet uses the session UUID as its 128-bit service UUID and encodes the six-digit TOTP in three manufacturer-data bytes. This preserves the complete session ID while fitting a legacy 31-byte advertisement. The manufacturer company ID is `0xFFFF`, the Bluetooth SIG's reserved testing value; it is suitable only for development and must be replaced with an assigned company ID before public production use.

The TOTP is HMAC-SHA256 with a 3-second counter and RFC 4226 dynamic truncation. Server time from the session response offsets the device clock. The native advertiser rotates the payload every counter boundary, stops on expiry, and stops when the app leaves the foreground. Background advertising is intentionally not enabled.

This native BLE module requires an Expo development build or prebuilt native app; Expo Go is not supported. After changing the native dependency or config plugin, regenerate native projects and rebuild:

```powershell
npx expo prebuild
npx expo run:android
```

BLE advertising should be tested on physical Android devices; simulators do not provide representative BLE hardware behavior.
