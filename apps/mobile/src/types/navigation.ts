export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  OnboardingSlides: undefined;
  OnboardingTrustScore: undefined;
  OnboardingTrackRecords: undefined;
  OnboardingVerifyPayments: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerify: { phone: string; mode: 'register' | 'reset' };
  ResetPIN: { phone: string };
  PrivacyConsent: undefined;
  DocumentUpload: undefined;
  Liveness: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Verify: undefined;
  Records: undefined;
  Inventory: undefined;
  Insights: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  Notifications: undefined;
  OfflineMode: undefined;
  Help: undefined;
  CreditScoreBreakdown: undefined;
};

export type VerifyStackParamList = {
  VerificationHub: undefined;
  Capture: undefined;
  ResultConfirmed: { amount: number; sender: string; txId: string; time: string };
  ResultSuspicious: { amount: number; reason: string };
  ResultPending: { amount: number };
  VerifyHistory: undefined;
};

export type RecordsStackParamList = {
  RecordsHub: undefined;
  AddSale: undefined;
  SalesHistory: undefined;
  AddExpense: undefined;
  ExpenseHistory: undefined;
  AddStock: undefined;
  StockHistory: undefined;
  RecordSuccess: { type: 'sale' | 'expense' | 'stock'; amount: number };
};

export type InventoryStackParamList = {
  InventoryHub: undefined;
};

export type InsightsStackParamList = {
  AIInsights: undefined;
  FinancialSummary: undefined;
  TrustScoreDetail: undefined;
  Statistics: undefined;
  AIPredictions: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Language: undefined;
  EditProfile: undefined;
};
