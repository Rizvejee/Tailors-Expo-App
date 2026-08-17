import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Storage, KEYS } from '../utils/storage';
import useShopName from '../utils/useShopName';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8', danger: '#DC2626',
};

export default function SettingsScreen() {
  const shopName = useShopName();
  const navigation = useNavigation();
  const [user,        setUser]        = useState(null);
  const [name,        setName]        = useState('');
  const [oldPass,     setOldPass]     = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    Storage.get(KEYS.LOGGED_IN).then(u => {
      if (u) { setUser(u); setName(u.name || ''); }
    });
  }, []);

  // ── Profile update — Firebase Auth + AsyncStorage ──
  const saveProfile = async () => {
    if (!name.trim()) {
      showAlert('Missing Info', 'Name cannot be empty.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    setLoading(true);
    try {
      const updatedUser = { ...user, name: name.trim() };

      // LOGGED_IN update کریں
      await Storage.set(KEYS.LOGGED_IN, updatedUser);

      // USERS list میں بھی name update کریں
      const users = (await Storage.get(KEYS.USERS)) || [];
      const idx = users.findIndex(u => u.uid === user.uid);
      if (idx !== -1) {
        users[idx].name = name.trim();
        await Storage.set(KEYS.USERS, users);
      }

      setUser(updatedUser);
      setLoading(false);
      showAlert('Profile Updated', 'Your name has been updated successfully.', [{ text: 'OK', style: 'confirm' }]);
    } catch (e) {
      setLoading(false);
      showAlert('Error', 'Could not update profile. Please try again.', [{ text: 'OK', style: 'confirm' }]);
    }
  };

  // ── Password change — AsyncStorage ──
  const changePassword = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      showAlert('Missing Info', 'Please fill all password fields.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (newPass.length < 6) {
      showAlert('Too Short', 'New password must be at least 6 characters.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (newPass !== confirmPass) {
      showAlert('Mismatch', 'Passwords do not match.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    setLoading(true);
    try {
      const users = (await Storage.get(KEYS.USERS)) || [];
      const idx = users.findIndex(u => u.uid === user.uid);
      if (idx === -1 || users[idx].password !== oldPass) {
        setLoading(false);
        showAlert('Wrong Password', 'Current password is incorrect.', [{ text: 'OK', style: 'confirm' }]); return;
      }
      users[idx].password = newPass;
      await Storage.set(KEYS.USERS, users);
      setOldPass(''); setNewPass(''); setConfirmPass('');
      setLoading(false);
      showAlert('Password Changed', 'Your password has been updated successfully.', [{ text: 'OK', style: 'confirm' }]);
    } catch (e) {
      setLoading(false);
      showAlert('Error', 'Could not change password. Please try again.', [{ text: 'OK', style: 'confirm' }]);
    }
  };

  // ── Account delete — Firebase Auth + AsyncStorage ──
  const deleteAccount = () => {
    showAlert(
      'Delete Account',
      'This will permanently delete your account and ALL data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // AsyncStorage سے سب data ہٹائیں
              await Promise.all([
                Storage.remove(KEYS.LOGGED_IN),
                Storage.remove(KEYS.CUSTOMERS),
                Storage.remove(KEYS.ORDERS),
                Storage.remove(KEYS.MEASUREMENTS),
                Storage.remove(KEYS.TRASH),
              ]);
              router.replace('/login');
            } catch (e) {
              setLoading(false);
              showAlert('Error', 'Could not delete account. Please try again.', [{ text: 'OK', style: 'confirm' }]);
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerSub}>{shopName}</Text>
            <Text style={s.headerTitle}>Settings</Text>
          </View>
        </View>

        <ScrollView
          style={s.body}
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>PROFILE</Text>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={s.profileName}>{user.name || 'No name'}</Text>
                <Text style={s.profileEmail}>{user.email}</Text>
              </View>
            </View>
            <View style={s.group}>
              <Text style={s.label}>Full Name</Text>
              <TextInput
                style={s.input} value={name} onChangeText={setName}
                placeholder="Your name" placeholderTextColor={C.textLight}
                autoCapitalize="words"
              />
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnText}>Save Profile</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Password card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>CHANGE PASSWORD</Text>
            <PassField
              label="Current Password" value={oldPass} onChange={setOldPass}
              show={showOld} toggle={() => setShowOld(p => !p)}
            />
            <PassField
              label="New Password" value={newPass} onChange={setNewPass}
              show={showNew} toggle={() => setShowNew(p => !p)}
            />
            <PassField
              label="Confirm New Password" value={confirmPass} onChange={setConfirmPass}
              show={showNew} toggle={() => setShowNew(p => !p)}
            />
            <TouchableOpacity style={s.saveBtn} onPress={changePassword} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnText}>Change Password</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Danger zone */}
          <View style={[s.card, s.dangerCard]}>
            <Text style={s.dangerTitle}>⚠️ DANGER ZONE</Text>
            <Text style={s.dangerSub}>
              Permanently deletes your account and all data. Cannot be undone.
            </Text>
            <TouchableOpacity style={s.deleteBtn} onPress={deleteAccount} disabled={loading}>
              <Text style={s.deleteBtnText}>Delete My Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

function PassField({ label, value, onChange, show, toggle }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <View style={s.passWrap}>
        <TextInput
          style={[s.input, { flex: 1, borderWidth: 0 }]}
          value={value} onChangeText={onChange}
          placeholder="••••••" placeholderTextColor="#9CA3AF"
          secureTextEntry={!show} autoCapitalize="none"
        />
        <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 18 }}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.green },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:       { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:            { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  card:            { backgroundColor: C.card, borderRadius: 18, padding: 20, margin: 20, marginBottom: 0, marginTop: 20, elevation: 2 },
  cardTitle:       { fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 0.5, marginBottom: 16 },
  avatarWrap:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar:          { width: 56, height: 56, borderRadius: 28, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileName:     { fontSize: 16, fontWeight: '700', color: C.dark },
  profileEmail:    { fontSize: 13, color: C.textMid },
  group:           { marginBottom: 16 },
  label:           { fontSize: 12, fontWeight: '700', color: C.textMid, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  input:           { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.dark },
  passWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12 },
  saveBtn:         { backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  dangerCard:      { borderWidth: 1.5, borderColor: '#FECACA' },
  dangerTitle:     { fontSize: 11, fontWeight: '700', color: C.danger, letterSpacing: 0.5, marginBottom: 8 },
  dangerSub:       { fontSize: 13, color: C.textMid, marginBottom: 16 },
  deleteBtn:       { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText:   { color: C.danger, fontSize: 15, fontWeight: '700' },
});
