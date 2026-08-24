import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Storage, KEYS } from '../utils/storage';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};

export default function LoginScreen() {
  const [tab,       setTab]       = useState('login');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [lEmail,    setLEmail]    = useState('');
  const [lPass,     setLPass]     = useState('');
  const [sName,     setSName]     = useState('');
  const [sEmail,    setSEmail]    = useState('');
  const [sPass,     setSPass]     = useState('');
  const [sConf,     setSConf]     = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // اگر پہلے سے logged in ہے تو dashboard
  useEffect(() => {
    Storage.get(KEYS.LOGGED_IN).then(u => {
      if (u) router.replace('/(drawer)/');
    });
  }, []);

  // ── Login ──
  const doLogin = async () => {
    if (!lEmail.trim() || !lPass) {
      showAlert('Missing Info', 'Please fill all fields.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, lEmail.trim(), lPass);
      await Storage.set(KEYS.LOGGED_IN, {
        uid:   cred.user.uid,
        name:  cred.user.displayName || cred.user.email.split('@')[0],
        email: cred.user.email,
      });
      router.replace('/(drawer)/');
    } catch (e) {
      setLoading(false);
      const msg =
        e.code === 'auth/user-not-found'   ? 'No account found with this email.' :
        e.code === 'auth/wrong-password'   ? 'Incorrect password.' :
        e.code === 'auth/invalid-email'    ? 'Invalid email address.' :
        e.code === 'auth/invalid-credential' ? 'Incorrect email or password.' :
        'Something went wrong. Please try again.';
      showAlert('Login Failed', msg, [{ text: 'Try Again', style: 'confirm' }]);
    }
  };

  // ── Signup ──
  const doSignup = async () => {
    if (!sName.trim() || !sEmail.trim() || !sPass || !sConf) {
      showAlert('Missing Info', 'Please fill all fields.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (sPass.length < 6) {
      showAlert('Too Short', 'Password must be at least 6 characters.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (sPass !== sConf) {
      showAlert('Mismatch', 'Passwords do not match.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, sEmail.trim(), sPass);
      await updateProfile(cred.user, { displayName: sName.trim() });
      setLoading(false);
      // signup کے بعد login tab پر جائیں
      setSName(''); setSEmail(''); setSPass(''); setSConf('');
      setTab('login');
      showAlert('Account Created!', 'Your account is ready. Please login.', [
        { text: 'OK', style: 'confirm' },
      ]);
    } catch (e) {
      setLoading(false);
      const msg =
        e.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
        e.code === 'auth/invalid-email'         ? 'Invalid email address.' :
        e.code === 'auth/weak-password'         ? 'Password is too weak.' :
        'Something went wrong. Please try again.';
      showAlert('Sign Up Failed', msg, [{ text: 'OK', style: 'confirm' }]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.hero}>
        <View style={s.logoCircle}><Text style={{ fontSize: 38 }}>🧵</Text></View>
        <Text style={s.heroTitle}>Tailors</Text>
        <Text style={s.heroSub}>Tailor Shop Management</Text>
      </View>

      <ScrollView style={s.card} contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'login'  && s.tabActive]} onPress={() => setTab('login')}>
            <Text style={[s.tabText, tab === 'login'  && s.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'signup' && s.tabActive]} onPress={() => setTab('signup')}>
            <Text style={[s.tabText, tab === 'signup' && s.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {tab === 'login' ? (
          <View>
            <Field label="Email"    value={lEmail} onChange={setLEmail}
              placeholder="you@example.com" keyboard="email-address" />
            <PassField label="Password" value={lPass} onChange={setLPass}
              show={showPass} toggle={() => setShowPass(p => !p)} />
            <TouchableOpacity style={s.submitBtn} onPress={doLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('signup')}>
              <Text style={s.switchText}>
                Don't have an account? <Text style={s.switchLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Field label="Full Name" value={sName}  onChange={setSName}  placeholder="e.g. Rizwan" />
            <Field label="Email"     value={sEmail} onChange={setSEmail}
              placeholder="you@example.com" keyboard="email-address" />
            <PassField label="Password"         value={sPass} onChange={setSPass}
              show={showPass}  toggle={() => setShowPass(p => !p)} />
            <PassField label="Confirm Password" value={sConf} onChange={setSConf}
              show={showPass2} toggle={() => setShowPass2(p => !p)} />
            <TouchableOpacity style={s.submitBtn} onPress={doSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create Account</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('login')}>
              <Text style={s.switchText}>
                Already have an account? <Text style={s.switchLink}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={C.textLight}
        keyboardType={keyboard || 'default'} autoCapitalize="none" />
    </View>
  );
}
function PassField({ label, value, onChange, show, toggle }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <View style={s.passWrap}>
        <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} value={value}
          onChangeText={onChange} placeholder="••••••" placeholderTextColor={C.textLight}
          secureTextEntry={!show} autoCapitalize="none" />
        <TouchableOpacity onPress={toggle} style={s.eyeBtn}>
          <Text style={{ fontSize: 18 }}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.green },
  hero:          { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: C.green },
  logoCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  heroTitle:     { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub:       { fontSize: 13, color: C.light, fontWeight: '500' },
  card:          { flex: 1, backgroundColor: C.bg, borderRadius: 28, paddingHorizontal: 24, paddingTop: 28 },
  tabs:          { flexDirection: 'row', backgroundColor: C.border, borderRadius: 14, padding: 4, marginBottom: 24 },
  tab:           { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  tabActive:     { backgroundColor: C.card, elevation: 2 },
  tabText:       { fontSize: 14, fontWeight: '700', color: C.textMid },
  tabTextActive: { color: C.green },
  group:         { marginBottom: 18 },
  label:         { fontSize: 12, fontWeight: '700', color: C.textMid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input:         { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.dark },
  passWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 13 },
  eyeBtn:        { paddingHorizontal: 14 },
  submitBtn:     { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  submitText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText:    { textAlign: 'center', fontSize: 13, color: C.textLight },
  switchLink:    { color: C.green, fontWeight: '700' },
});
