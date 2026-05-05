# Mobile CI/CD

The mobile app is built from:

```text
apps/mobile
```

## Workflows

- `Mobile CI`: runs `npm ci` and `npm run typecheck` on pull requests and pushes that touch the mobile app.
- `Android EAS Build`: builds Android through EAS Build. It can be triggered manually from GitHub Actions, or by pushing a tag named `mobile-v*`.

## One-Time Expo Setup

From the mobile app folder, log in and link the app to an Expo/EAS project:

```powershell
cd C:\Users\ngong\Documents\CUB\MboaTrust\apps\mobile
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` should add an EAS project ID to the Expo config. Commit that change.

## GitHub Secrets

Add this secret in GitHub:

```text
EXPO_TOKEN
```

Create it from your Expo account access tokens page, then add it under:

```text
GitHub repo > Settings > Secrets and variables > Actions > New repository secret
```

## Build Profiles

Configured in `apps/mobile/eas.json`:

- `development`: internal APK with development client.
- `preview`: internal APK for testers.
- `production`: Android App Bundle (`.aab`) for Play Store.

## Production URLs

Production builds use these public Expo variables:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_DATA_AGENT_URL
```

Defaults are currently:

```text
https://api.mboatrust.ai
https://data.mboatrust.ai
```

Change the values in `apps/mobile/eas.json` when your real deployed backend domains are ready.

## Manual Build Commands

Preview APK:

```powershell
cd apps/mobile
npx eas-cli@latest build --platform android --profile preview
```

Production AAB:

```powershell
cd apps/mobile
npx eas-cli@latest build --platform android --profile production
```

## Release Tag

To trigger a production Android build from GitHub:

```powershell
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```
