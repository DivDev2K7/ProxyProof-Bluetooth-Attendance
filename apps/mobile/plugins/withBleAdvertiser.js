const { withAndroidManifest } = require("expo/config-plugins");

const ANDROID_PERMISSIONS = [
  { name: "android.permission.BLUETOOTH", maxSdkVersion: "30" },
  { name: "android.permission.BLUETOOTH_ADMIN", maxSdkVersion: "30" },
  { name: "android.permission.BLUETOOTH_ADVERTISE" },
  { name: "android.permission.BLUETOOTH_CONNECT" },
];

function withBleAndroidPermissions(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    manifest["uses-permission"] ??= [];
    for (const permission of ANDROID_PERMISSIONS) {
      const existing = manifest["uses-permission"].find((entry) => entry.$["android:name"] === permission.name);
      if (existing) {
        if (permission.maxSdkVersion) existing.$["android:maxSdkVersion"] = permission.maxSdkVersion;
        continue;
      }

      manifest["uses-permission"].push({
        $: {
          "android:name": permission.name,
          ...(permission.maxSdkVersion ? { "android:maxSdkVersion": permission.maxSdkVersion } : {}),
        },
      });
    }
    return modConfig;
  });
}

module.exports = function withBleAdvertiser(config) {
  return withBleAndroidPermissions(config);
};
