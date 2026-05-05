import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser, submitLivenessVerification, uploadSelfiePhoto } from '../../services/api';
import { getAuthToken, getUserData, saveUserData } from '../../services/storage';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';

type ChallengeType = 'center' | 'blink' | 'smile' | 'turnLeft' | 'turnRight';

type LivenessChallenge = {
  type: ChallengeType;
  instruction: string;
  successText: string;
};

const CHALLENGE_POOL: LivenessChallenge[] = [
  { type: 'blink', instruction: 'Blink both eyes', successText: 'Blink detected' },
  { type: 'smile', instruction: 'Smile naturally', successText: 'Smile detected' },
  { type: 'turnLeft', instruction: 'Turn your head left', successText: 'Left turn detected' },
  { type: 'turnRight', instruction: 'Turn your head right', successText: 'Right turn detected' },
];

const FACE_DETECTION_OPTIONS = {
  performanceMode: 'fast' as const,
  landmarkMode: 'none' as const,
  contourMode: 'none' as const,
  classificationMode: 'all' as const,
  minFaceSize: 0.18,
};

const LIVENESS_SAMPLE_INTERVAL_MS = 2500;
const CHALLENGE_SUCCESS_PAUSE_MS = 650;

function buildChallengeSequence(): LivenessChallenge[] {
  const shuffled = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5);

  return [
    { type: 'center', instruction: 'Center your face and look straight', successText: 'Face centered' },
    ...shuffled.slice(0, 3),
  ];
}

function getBestFace(faces: Face[]): Face | null {
  if (faces.length !== 1) return null;
  return faces[0];
}

function formatProbability(value?: number): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '--';
}

function isChallengePassed(challenge: ChallengeType, face: Face): boolean {
  const rotationX = face.rotationX ?? 0;
  const rotationY = face.rotationY ?? 0;
  const smile = face.smilingProbability ?? 0;
  const leftEye = face.leftEyeOpenProbability ?? 1;
  const rightEye = face.rightEyeOpenProbability ?? 1;

  switch (challenge) {
    case 'center':
      return Math.abs(rotationY) < 12 && Math.abs(rotationX) < 15;
    case 'blink':
      return leftEye < 0.45 && rightEye < 0.45;
    case 'smile':
      return smile > 0.65;
    case 'turnLeft':
      return rotationY > 15;
    case 'turnRight':
      return rotationY < -15;
    default:
      return false;
  }
}

export const LivenessScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const isSamplingRef = useRef(false);
  const isMountedRef = useRef(true);
  const challengeAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const challenges = useMemo(() => buildChallengeSequence(), []);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [statusText, setStatusText] = useState('Position your face inside the circle');
  const [lastFace, setLastFace] = useState<Face | null>(null);

  const activeChallenge = challenges[currentStep] ?? challenges[challenges.length - 1];

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (challengeAdvanceTimeoutRef.current) {
        clearTimeout(challengeAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const resetVerification = useCallback((message: string) => {
    setCurrentStep(0);
    setIsVerifying(false);
    setIsFinalizing(false);
    setStatusText(message);
    setLastFace(null);
  }, []);

  const finalizeVerification = useCallback(async (photoUri: string) => {
    if (isFinalizing) return;

    try {
      setIsFinalizing(true);
      setStatusText('Uploading verified selfie...');

      const [token, user] = await Promise.all([getAuthToken(), getUserData()]);
      if (!token || !user?.id) {
        Alert.alert('Login required', 'Please log in before submitting liveness verification.');
        resetVerification('Login required. Please try again.');
        return;
      }

      const uploadResult = await uploadSelfiePhoto(token, photoUri);
      if (!uploadResult.success) {
        Alert.alert('Selfie Upload Failed', uploadResult.error || 'Please try again.');
        resetVerification('Selfie upload failed. Please try again.');
        return;
      }

      setStatusText('Submitting liveness result...');
      const result = await submitLivenessVerification(user.id, 0.95, true);

      if (result.success) {
        const currentUser = await getCurrentUser(token);
        if (currentUser.success && currentUser.data) {
          await saveUserData(currentUser.data);
        }

        Alert.alert('Liveness Verified', 'Your merchant identity check is complete.', [
          { text: 'OK', onPress: () => navigation.getParent()?.replace('Main') },
        ]);
      } else {
        Alert.alert('Verification Failed', result.error || 'Please try again.');
        resetVerification('Verification failed. Please try again.');
      }
    } catch (error: any) {
      const message = String(error?.message || error);
      if (message.includes("doesn't seem to be linked") || message.includes('not using Expo managed workflow')) {
        Alert.alert('Custom Build Required', 'Face detection needs a custom Android development build, not Expo Go.');
        resetVerification('Custom development build required');
        return;
      }

      Alert.alert('Verification Error', 'Please try the liveness check again.');
      resetVerification('Verification error. Please try again.');
    }
  }, [isFinalizing, navigation, resetVerification]);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isSamplingRef.current || isFinalizing) return;

    isSamplingRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.18,
        imageType: 'jpg',
        skipProcessing: false,
        shutterSound: false,
        base64: false,
      });

      if (!photo?.uri) {
        setStatusText('Could not capture a clear image. Try again.');
        return;
      }

      const faces = await FaceDetection.detect(photo.uri, FACE_DETECTION_OPTIONS);
      const face = getBestFace(faces);

      if (!isMountedRef.current) return;

      if (!face) {
        setLastFace(null);
        setStatusText(faces.length > 1 ? 'Only one face should be visible' : 'No face detected');
        return;
      }

      setLastFace(face);
      const passed = isChallengePassed(activeChallenge.type, face);

      if (!passed) {
        setStatusText(activeChallenge.instruction);
        return;
      }

      setStatusText(activeChallenge.successText);

      if (currentStep >= challenges.length - 1) {
        setIsVerifying(false);
        await finalizeVerification(photo.uri);
        return;
      }

      setIsVerifying(false);
      if (challengeAdvanceTimeoutRef.current) {
        clearTimeout(challengeAdvanceTimeoutRef.current);
      }
      challengeAdvanceTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCurrentStep((step) => step + 1);
        setIsVerifying(true);
      }, CHALLENGE_SUCCESS_PAUSE_MS);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (message.includes("doesn't seem to be linked") || message.includes('not using Expo managed workflow')) {
        Alert.alert('Custom Build Required', 'Face detection needs a custom Android development build, not Expo Go.');
        resetVerification('Custom development build required');
      } else {
        setStatusText('Could not analyze face. Hold still and try again.');
      }
    } finally {
      isSamplingRef.current = false;
    }
  }, [activeChallenge, challenges.length, currentStep, finalizeVerification, isFinalizing, resetVerification]);

  useEffect(() => {
    if (!isVerifying || isFinalizing) return;

    const interval = setInterval(() => {
      captureAndAnalyze();
    }, LIVENESS_SAMPLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [captureAndAnalyze, isFinalizing, isVerifying]);

  const startVerification = () => {
    setCurrentStep(0);
    setLastFace(null);
    setStatusText(challenges[0].instruction);
    setIsVerifying(true);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is needed for merchant liveness verification.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={requestPermission}>
          <Text style={styles.ctaButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = ((currentStep + 1) / challenges.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + rs(10) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rs(22)} color="#065F46" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Liveness Check</Text>
        <View style={{ width: rs(38) }} />
      </View>

      <View style={styles.content}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Face Movement Verification</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.cameraFrameWrapper}>
          <View style={styles.instructionBadge}>
            <Text style={styles.instructionText}>{activeChallenge.instruction}</Text>
          </View>

          <View style={styles.viewfinderWrapper}>
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
            <View style={styles.guideOverlay}>
              <Ionicons name={lastFace ? 'happy-outline' : 'scan-outline'} size={rs(112)} color={lastFace ? 'rgba(5,150,105,0.35)' : 'rgba(255,255,255,0.38)'} />
            </View>
          </View>
        </View>

        <Text style={styles.hintText}>{statusText}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            {isVerifying && !isFinalizing ? (
              <ActivityIndicator color="#065F46" />
            ) : (
              <Ionicons name="eye-outline" size={rs(24)} color="#065F46" />
            )}
          </View>
          <View style={styles.infoTexts}>
            <Text style={styles.infoTitle}>Live Face Signals</Text>
            <Text style={styles.infoDesc}>
              Smile {formatProbability(lastFace?.smilingProbability)} | Left eye {formatProbability(lastFace?.leftEyeOpenProbability)} | Right eye {formatProbability(lastFace?.rightEyeOpenProbability)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {!isVerifying ? (
            <TouchableOpacity style={styles.ctaButton} onPress={startVerification}>
              <Text style={styles.ctaButtonText}>Start Face Liveness Check</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.ctaButton, styles.ctaButtonDisabled]} disabled>
              <Text style={styles.ctaButtonText}>{isFinalizing ? 'Uploading Verification...' : 'Analyzing Face Movement...'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F2' },
  message: { textAlign: 'center', padding: rs(20), fontSize: FontSize.base, color: '#374151', marginTop: vs(120) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: rs(16), paddingBottom: rs(12), backgroundColor: '#F8FAFC' },
  backButton: { width: rs(38), height: rs(38), borderRadius: rs(19), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#065F46' },
  content: { flex: 1, padding: rs(24), alignItems: 'center' },
  stepContainer: { width: '100%', marginBottom: rs(36) },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#064E3B', marginBottom: rs(12) },
  progressBar: { height: rs(6), width: '100%', backgroundColor: '#DDE5E1', borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981' },
  cameraFrameWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: rs(24) },
  instructionBadge: { position: 'absolute', top: rs(-20), zIndex: 10, backgroundColor: '#FFFFFF', paddingHorizontal: rs(22), paddingVertical: rs(8), borderRadius: Radius.full, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  instructionText: { fontWeight: FontWeight.bold, color: '#064E3B' },
  viewfinderWrapper: { width: rs(280), height: rs(280), borderRadius: rs(140), borderWidth: rs(4), borderColor: '#FFFFFF', elevation: 5, overflow: 'hidden', backgroundColor: '#0D4A35' },
  camera: { width: '100%', height: '100%' },
  guideOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  hintText: { fontSize: FontSize.sm, color: '#6B7280', marginBottom: rs(28), textAlign: 'center' },
  infoCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: rs(16), borderRadius: Radius.xl, borderWidth: 1, borderColor: '#E5E7EB', width: '100%', marginBottom: rs(36) },
  infoIconBox: { width: rs(48), height: rs(48), backgroundColor: '#ECFDF5', borderRadius: Radius.md, marginRight: rs(14), justifyContent: 'center', alignItems: 'center' },
  infoTexts: { flex: 1 },
  infoTitle: { fontWeight: FontWeight.bold, color: '#064E3B', marginBottom: rs(4) },
  infoDesc: { fontSize: FontSize.xs, color: '#42474E', lineHeight: ms(12) * 1.5 },
  footer: { width: '100%', marginTop: 'auto' },
  ctaButton: { backgroundColor: '#065F46', minHeight: rs(56), borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(16), paddingVertical: rs(12) },
  ctaButtonDisabled: { backgroundColor: '#9CA3AF' },
  ctaButtonText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'center' },
});
