import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import { registerUser } from '../../services/api';
import { saveAuthToken, saveUserData } from '../../services/storage';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [city, setCity] = useState('Douala');
  const [region, setRegion] = useState('Littoral');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [streetAddress, setStreetAddress] = useState('');
  const [businessType, setBusinessType] = useState('Shop');
  const [monthlyIncomeRange, setMonthlyIncomeRange] = useState('Under 100,000 FCFA');
  const [incomeSource, setIncomeSource] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [idType, setIdType] = useState<'CNI' | 'PASSPORT'>('CNI');
  const [idNumber, setIdNumber] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      pin.length < 4 ||
      !dateOfBirth.trim() ||
      !streetAddress.trim() ||
      !incomeSource.trim() ||
      !emergencyName.trim() ||
      !emergencyRelationship.trim() ||
      !emergencyPhone.trim() ||
      !idNumber.trim()
    ) {
      Alert.alert('Missing KYC Information', 'Complete the identity, business, emergency contact, and ID details before continuing.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: pin.repeat(2),
        date_of_birth: dateOfBirth.trim(),
        gender,
        nationality: 'Cameroonian',
        street_address: streetAddress.trim(),
        city: city.trim() || 'Douala',
        region: region.trim() || 'Littoral',
        occupation: 'CUB Member',
        employer_name: businessType,
        monthly_income_range: monthlyIncomeRange,
        income_source: incomeSource.trim(),
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_relationship: emergencyRelationship.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        id_type: idType,
        id_number: idNumber.trim(),
        is_minor: false,
      });

      if (!result.success) {
        Alert.alert('Registration Failed', result.error || 'Please try again.');
        return;
      }

      await saveAuthToken(result.data.access_token);
      await saveUserData(result.data.user);
      navigation.navigate('DocumentUpload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <LinearGradient colors={['#00172F','#002853','#133E72']} style={[styles.hero, { paddingTop: insets.top + rs(10) }]}>
        <View style={styles.orb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Create CUB Profile</Text>
          <Text style={styles.heroSub}>Start your AI financial identity and credit access journey</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.card}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Alain Kamga" value={name} onChangeText={setName} placeholderTextColor="#9CA3AF" autoCapitalize="words" />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="member@example.com" value={email} onChangeText={setEmail} placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <View style={styles.inputRow}>
              <View style={styles.flagChip}>
                <Text style={styles.flagText}>🇨🇲 +237</Text>
              </View>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="6XX XXX XXX" value={phone} onChangeText={setPhone} placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            </View>
          </View>

          {/* PIN */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>4-DIGIT PIN</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput
                style={styles.input}
                placeholder="••••"
                value={pin}
                onChangeText={t => setPin(t.slice(0, 4))}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                secureTextEntry={!showPin}
                maxLength={4}
              />
              <TouchableOpacity onPress={() => setShowPin(s => !s)}>
                <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Identity KYC</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
            <View style={styles.inputRow}>
              <Ionicons name="calendar-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={dateOfBirth} onChangeText={setDateOfBirth} placeholderTextColor="#9CA3AF" keyboardType="numbers-and-punctuation" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>GENDER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['Male','Female','Other'].map(t => (
                <TouchableOpacity key={t} style={[styles.chip, gender === t && styles.chipActive]} onPress={() => setGender(t)} activeOpacity={0.8}>
                  <Text style={[styles.chipText, gender === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Business type */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Financial Profile</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>INCOME ACTIVITY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['Shop','Market','Restaurant','Salary','Service','Other'].map(t => (
                <TouchableOpacity key={t} style={[styles.chip, businessType === t && styles.chipActive]} onPress={() => setBusinessType(t)} activeOpacity={0.8}>
                  <Text style={[styles.chipText, businessType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ADDRESS</Text>
            <View style={styles.inputRow}>
              <Ionicons name="storefront-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Quarter, market, or street" value={streetAddress} onChangeText={setStreetAddress} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CITY</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Douala" value={city} onChangeText={setCity} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>REGION</Text>
            <View style={styles.inputRow}>
              <Ionicons name="map-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Littoral" value={region} onChangeText={setRegion} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>MONTHLY INCOME</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['Under 100,000 FCFA','100,000 - 300,000 FCFA','300,000 - 500,000 FCFA','Above 500,000 FCFA'].map(t => (
                <TouchableOpacity key={t} style={[styles.chip, monthlyIncomeRange === t && styles.chipActive]} onPress={() => setMonthlyIncomeRange(t)} activeOpacity={0.8}>
                  <Text style={[styles.chipText, monthlyIncomeRange === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>INCOME SOURCE</Text>
            <View style={styles.inputRow}>
              <Ionicons name="cash-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Retail sales, food service, mobile money..." value={incomeSource} onChangeText={setIncomeSource} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CONTACT NAME</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-add-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Mrs Samantha" value={emergencyName} onChangeText={setEmergencyName} placeholderTextColor="#9CA3AF" autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>RELATIONSHIP</Text>
            <View style={styles.inputRow}>
              <Ionicons name="people-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="Mother, spouse, business partner..." value={emergencyRelationship} onChangeText={setEmergencyRelationship} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CONTACT PHONE</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="6XX XXX XXX" value={emergencyPhone} onChangeText={setEmergencyPhone} placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Identity Document</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ID TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {(['CNI','PASSPORT'] as const).map(t => (
                <TouchableOpacity key={t} style={[styles.chip, idType === t && styles.chipActive]} onPress={() => setIdType(t)} activeOpacity={0.8}>
                  <Text style={[styles.chipText, idType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ID NUMBER</Text>
            <View style={styles.inputRow}>
              <Ionicons name="card-outline" size={rs(16)} color="#9CA3AF" style={{ marginRight: rs(8) }} />
              <TextInput style={styles.input} placeholder="CNI or passport number" value={idNumber} onChangeText={setIdNumber} placeholderTextColor="#9CA3AF" autoCapitalize="characters" />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.75 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#002853','#133E72']} style={styles.submitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitBtnText}>{loading ? 'Creating Profile...' : 'Create Profile & Continue KYC'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8} style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(28), overflow: 'hidden' },
  orb: { position: 'absolute', top: rs(-40), right: rs(-40), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: rs(16) },
  heroText: { gap: rs(5) },
  heroTitle: { fontSize: ms(28), fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },
  card: { backgroundColor: '#FFFFFF', margin: rs(16), borderRadius: Radius.xl, padding: rs(20), gap: rs(18), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, marginTop: rs(-20) },
  field: { gap: rs(8) },
  fieldLabel: { fontSize: FontSize.xs, color: '#6B7280', letterSpacing: 0.8, fontWeight: FontWeight.semibold },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: Radius.lg, paddingHorizontal: rs(14), paddingVertical: rs(12), borderWidth: 1.5, borderColor: '#E5E7EB' },
  input: { flex: 1, fontSize: FontSize.base, color: '#111827' },
  flagChip: { flexDirection: 'row', alignItems: 'center', paddingRight: rs(10), marginRight: rs(4), borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  flagText: { fontSize: FontSize.base, color: '#374151', fontWeight: FontWeight.medium },
  sectionDivider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: rs(14), marginTop: rs(2) },
  sectionTitle: { fontSize: FontSize.base, color: '#002853', fontWeight: FontWeight.bold },
  chipRow: { gap: rs(8) },
  chip: { paddingHorizontal: rs(14), paddingVertical: rs(8), backgroundColor: '#F0F4F2', borderRadius: Radius.full, borderWidth: 1.5, borderColor: '#E5E7EB' },
  chipText: { fontSize: FontSize.sm, color: '#374151', fontWeight: FontWeight.medium },
  chipActive: { backgroundColor: '#DCE7F3', borderColor: '#002853' },
  chipTextActive: { color: '#002853', fontWeight: FontWeight.bold },
  submitBtn: { borderRadius: Radius.full, overflow: 'hidden', shadowColor: '#002853', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, marginTop: rs(4) },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(15), gap: rs(8) },
  submitBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  loginRow: { alignItems: 'center', paddingVertical: rs(4) },
  loginText: { fontSize: FontSize.base, color: '#6B7280' },
  loginLink: { color: '#002853', fontWeight: FontWeight.bold },
});
