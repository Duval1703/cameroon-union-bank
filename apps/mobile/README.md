# MboaTrust AI - Mobile App

## Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npx expo start
```

3. Scan the QR code with Expo Go (Android/iOS) or press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web browser

## Tech Stack
- React Native + Expo SDK 52
- React Navigation v6 (Stack + Bottom Tabs)
- react-native-safe-area-context
- expo-linear-gradient
- react-native-svg (Trust Score ring)
- @expo/vector-icons (Ionicons)

## Project Structure
```
src/
  constants/     # Colors, Theme, spacing tokens
  components/    # Reusable UI components
    common/      # Button, Input, Card, Badge, Header, TrustScoreRing
  screens/       # All app screens
    Landing/     # Splash, Welcome, Onboarding
    Auth/        # Login, Register, OTP, ForgotPassword, ResetPIN, PrivacyConsent
    Dashboard/   # Home, AIInsights, Notifications, Profile, Language, Offline, Help
    Records/     # Hub, AddSale, AddExpense, AddStock, Histories, Success
    Verification/# Capture, ResultConfirmed, ResultSuspicious, ResultPending, History
    TrustScore/  # TrustScoreDetail, FinancialSummary, VerificationHub
    Statistics/  # Statistics, AIPredictions
  navigation/    # RootNavigator + all sub-navigators
  types/         # TypeScript navigation types
```
