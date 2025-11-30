# HaramBlocker - Content Blocking Timer App

A React Native Android app that hides itself, blocks harmful content via VPN, and reappears when a timer expires.

## Features

- ⏱️ **Timer-based Content Blocking**: Set a duration and the app will block harmful sites until the timer expires
- 🔒 **App Icon Hiding**: App disappears from launcher and recent apps while timer is active
- 🛡️ **Local VPN Blocking**: Intercepts all network traffic to block domains on your blocklist
- 📋 **Customizable Blocklist**: Manage blocked domains - add/remove as needed
- 🔐 **Device Admin Protection**: Optional device admin privileges to prevent easy uninstallation
- 🔄 **Persistent Across Reboots**: Timer and VPN restart automatically after device restart

## Tech Stack

- **React Native 0.82** with TypeScript
- **Native Android Modules** (Kotlin)
  - VpnService for traffic interception
  - DeviceAdminReceiver for protection
  - PackageManager for icon hiding
  - AlarmManager for precise timing
- **Zustand** for state management
- **AsyncStorage** for persistent blocklist storage
- **Notifee** for notifications
- **React Navigation** for routing

## Setup Instructions

### Prerequisites

- Node.js 20+
- Android Studio with SDK (API 29+)
- JDK 11 or higher
- Android device or emulator running Android 10+

### Installation

1. **Install Dependencies**

   ```bash
   cd Musafir
   npm install
   ```

2. **Install Ruby Dependencies (for iOS, optional)**

   ```bash
   cd ios && bundle install && cd ..
   ```

3. **Link Native Modules**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

### Running the App

#### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

Or manually:

```bash
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Testing

#### Manual Testing Steps

1. **Launch the app** on an Android device/emulator (API 29+)

2. **Grant Permissions**:

   - VPN permission (system dialog)
   - Notification permission
   - Device Admin (optional but recommended)
   - Battery optimization exemption

3. **Test Timer Start**:

   - Set timer duration (try 5 minutes for testing)
   - Tap "Start Timer"
   - Confirm the warning dialog
   - **Expected**: App icon should disappear from launcher

4. **Test Content Blocking**:

   - While timer is active, open Chrome/Firefox
   - Try accessing `pornhub.com` or other blocked domains
   - **Expected**: Sites should fail to load
   - Try `google.com` - should work normally

5. **Test Timer Expiry**:

   - Wait for timer to expire (or set 1-minute timer)
   - **Expected**:
     - Notification: "Timer Expired"
     - App icon reappears
     - VPN stops

6. **Test Blocklist Management**:

   - Navigate to Settings from home screen
   - Add custom domain (e.g., `example.com`)
   - Remove a domain
   - Reset to default

7. **Test Persistence**:
   - Start a timer
   - Reboot device (`adb reboot`)
   - **Expected**: Timer continues, VPN restarts

#### Debugging

View logs during testing:

```bash
adb logcat | grep -E "HaramBlocker|VPN|Timer"
```

Check VPN status:

```bash
adb shell dumpsys connectivity | grep -A 10 VPN
```

## Project Structure

```
Musafir/
├── src/
│   ├── components/       # UI components
│   │   ├── TimerInput.tsx
│   │   └── StatusCard.tsx
│   ├── screens/          # Main screens
│   │   ├── HomeScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/         # Business logic
│   │   ├── TimerService.ts
│   │   └── BlocklistService.ts
│   ├── native/           # Native module interfaces
│   │   ├── AppIconManager.ts
│   │   ├── VPNModule.ts
│   │   ├── DeviceAdminModule.ts
│   │   └── AlarmManagerModule.ts
│   ├── store/            # State management
│   │   └── appStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── constants/        # Constants
│       └── defaultBlocklist.ts
├── android/
│   └── app/src/main/java/com/musafir/
│       ├── modules/      # Native modules
│       │   ├── AppIconManagerModule.kt
│       │   ├── DeviceAdminModule.kt
│       │   ├── VPNModule.kt
│       │   ├── AlarmManagerModule.kt
│       │   └── NativeModulesPackage.kt
│       ├── services/     # Android services
│       │   ├── HaramBlockerVPNService.kt
│       │   └── TimerExpiryHandler.kt
│       └── receivers/    # Broadcast receivers
│           └── BootReceiver.kt
└── App.tsx               # Entry point
```

## Known Limitations

- **Android Only**: iOS doesn't allow VPN-based content filtering or icon hiding
- **DNS-Based Blocking**: HTTPS traffic is blocked via DNS interception (not deep packet inspection)
- **VPN Overhead**: Some performance impact from packet processing
- **Device Admin**: May trigger security warnings on some devices

## Privacy & Ethics

- **No Data Collection**: All processing happens locally
- **User Consent**: Explicit permission required for all invasive features
- **Productivity Tool**: Intended for self-control, not surveillance
- **Open Source**: Code is transparent and auditable

## Troubleshooting

### App won't start

- Run `cd android && ./gradlew clean`
- Clear Metro cache: `npm start -- --reset-cache`

### VPN not blocking

- Check VPN permission granted
- Verify blocklist is loaded: View Settings screen
- Check logcat for VPN service errors

### Icon won't hide

- Requires Android 10+ (API 29+)
- Check device admin permission granted
- Some launchers cache icons

### Timer doesn't survive reboot

- Ensure BOOT_COMPLETED permission granted
- Check BootReceiver is registered in manifest

## License

MIT License - Use responsibly

## Support

For issues or questions, check the implementation plan in `.gemini/antigravity/brain/*/implementation_plan.md`
