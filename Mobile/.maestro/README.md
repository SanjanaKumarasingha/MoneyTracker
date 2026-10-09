# Mobile E2E flows (Maestro)

[Maestro](https://maestro.mobile.dev) drives the real app on an emulator,
simulator, or Android device, tapping elements by `testID` (set on the
React Native components) or visible text.

| Flow | Journey |
| --- | --- |
| `register-and-login.yaml` | Register → redirected to login → log in → Home with no wallets |
| `wallet-and-expense.yaml` | (runs the above) → create a wallet → add a 1,500 expense → it shows in Recent Activity |

## Running

1. Install Maestro: `curl -fsSL "https://get.maestro.mobile.dev" | bash`
   (needs Java 17+).
2. Start the API (`Server/`, `npm run start:dev`) and point
   `EXPO_PUBLIC_API_URL` in `Mobile/.env` at it.
3. Install a **development build** on an Android emulator / device
   (`npx expo run:android`) or iOS simulator (`npx expo run:ios`, macOS only),
   with Metro running.
4. From `Mobile/`: `maestro test .maestro/`

The flows target the development build's app id
(`com.sanjanakumarasingha.moneytracker`). To run against **Expo Go** instead,
change `appId` to `host.exp.exponent` and replace `launchApp` with
`- openLink: exp://<your-lan-ip>:8081`.

Maestro can't drive a physical iPhone - use the iOS simulator on a Mac, or
an Android emulator/device.

Each run registers new users, and the API allows 5 sign-ups per minute per
IP - wait a minute between back-to-back full runs.
