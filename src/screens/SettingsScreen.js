import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  updatePassword, updateProfile as fbUpdateProfile,
  EmailAuthProvider, reauthenticateWithCredential, deleteUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Storage, KEYS } from '../utils/storage';
import useShopName from '../utils/useShopName';
import CustomAlert from '../components/CustomAlert';
import { createBackup, restoreBackup } from '../services/backupService';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8', danger: '#DC2626',
};

export default function SettingsScreen() {
  const shopName   = useShopName();
  const navigation = useNavigation();

  const [user,        setUser]        = useState(null);
  const [name,        setName]        = useState('');
  const [oldPass,     setOldPass]     = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [editProfile,     setEditProfile]     = useState(false);
  const [editPassword,    setEditPassword]    = useState(false);
  const [backupLoading,   setBackupLoading]   = useState(false);
  const [restoreLoading,  setRestoreLoading]  = useState(false);
  const [lastBackup,      setLastBackup]      = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const n = firebaseUser.displayName || firebaseUser.email.split('@')[0];
      setName(n);
      setUser({ uid: firebaseUser.uid, name: n, email: firebaseUser.email });
    } else {
      Storage.get(KEYS.LOGGED_IN).then(u => {
        if (u) { setUser(u); setName(u.name || ''); }
      });
    }
    Storage.get('last_backup_time').then(t => { if (t) setLastBackup(t); });
  }, []);

  // ── Profile update ──
  const saveProfile = async () => {
    if (!name.trim()) {
      showAlert('Missing Info', 'Name cannot be empty.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    setLoadingProfile(true);
    try {
      if (auth.currentUser) {
        await fbUpdateProfile(auth.currentUser, { displayName: name.trim() });
      }
      const updatedUser = { ...user, name: name.trim() };
      await Storage.set(KEYS.LOGGED_IN, updatedUser);
      setUser(updatedUser);
      setLoadingProfile(false);
      setEditProfile(false);
      showAlert('Profile Updated', 'Your name has been updated successfully.', [{ text: 'OK', style: 'confirm' }]);
    } catch {
      setLoadingProfile(false);
      showAlert('Error', 'Could not update profile. Please try again.', [{ text: 'OK', style: 'confirm' }]);
    }
  };

  // ── Password change ──
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
    setLoadingPassword(true);
    try {
      const currentUser = auth.currentUser;
      const credential  = EmailAuthProvider.credential(currentUser.email, oldPass);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPass);
      setOldPass(''); setNewPass(''); setConfirmPass('');
      setLoadingPassword(false);
      setEditPassword(false);
      showAlert('Password Changed', 'Your password has been updated successfully.', [{ text: 'OK', style: 'confirm' }]);
    } catch (e) {
      setLoadingPassword(false);
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : 'Could not change password. Please try again.';
      showAlert('Error', msg, [{ text: 'OK', style: 'confirm' }]);
    }
  };

  // ── Backup ──
  const doBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await createBackup();
      const now = new Date().toISOString();
      await Storage.set('last_backup_time', now);
      setLastBackup(now);
      setBackupLoading(false);
      const msg = result.savedTo
        ? `Backup saved to app storage.\n\nFile: ${result.fileName}`
        : 'Backup completed successfully.';
      showAlert('Backup Successful', msg, [{ text: 'OK', style: 'confirm' }]);
    } catch (e) {
      setBackupLoading(false);
      showAlert('Backup Failed', e.message || 'Could not create backup. Please try again.', [{ text: 'OK', style: 'confirm' }]);
    }
  };

  // ── Restore ──
  const doRestore = () => {
    showAlert(
      'Restore Backup?',
      'Your current local data will be replaced by the backup data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore', style: 'confirm',
          onPress: async () => {
            setRestoreLoading(true);
            try {
              const result = await restoreBackup();
              setRestoreLoading(false);
              if (result.success) {
                showAlert('Restored Successfully', 'Your data has been restored from backup.', [{ text: 'OK', style: 'confirm' }]);
              }
            } catch (e) {
              setRestoreLoading(false);
              showAlert('Restore Failed', e.message || 'Could not restore backup. Please try again.', [{ text: 'OK', style: 'confirm' }]);
            }
          },
        },
      ]
    );
  };

  // ── Account delete ──
  const deleteAccount = () => {
    showAlert(
      'Delete Account',
      'This will permanently delete your account and ALL data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: async () => {
            setLoadingProfile(true);
            try {
              await deleteUser(auth.currentUser);
              await Promise.all([
                Storage.remove(KEYS.LOGGED_IN),
                Storage.remove(KEYS.CUSTOMERS),
                Storage.remove(KEYS.ORDERS),
                Storage.remove(KEYS.MEASUREMENTS),
                Storage.remove(KEYS.TRASH),
                Storage.remove(KEYS.EXPENSES),
                Storage.remove('last_backup_time'),
              ]);
              router.replace('/login');
            } catch {
              setLoadingProfile(false);
              showAlert('Error', 'Could not delete account. Please try again.', [{ text: 'OK', style: 'confirm' }]);
            }
          },
        },
      ]
    );
  };

  const formatBackupTime = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
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
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{user.name || 'No name'}</Text>
              <Text style={s.profileEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditProfile(p => !p)} style={s.editBtn}>
              <Text style={s.editBtnText}>{editProfile ? 'Cancel' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>
          {editProfile && (
            <>
              <View style={s.group}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input} value={name} onChangeText={setName}
                  placeholder="Your name" placeholderTextColor={C.textLight}
                  autoCapitalize="words"
                />
              </View>
              <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={loadingProfile}>
                {loadingProfile
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveBtnText}>Save Profile</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Password card */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={s.cardTitle}>CHANGE PASSWORD</Text>
            <TouchableOpacity onPress={() => setEditPassword(p => !p)} style={s.editBtn}>
              <Text style={s.editBtnText}>{editPassword ? 'Cancel' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>
          {editPassword && (
            <>
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
              <TouchableOpacity style={s.saveBtn} onPress={changePassword} disabled={loadingPassword}>
                {loadingPassword
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveBtnText}>Change Password</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Backup & Restore card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>BACKUP & RESTORE</Text>

          <View style={s.backupInfoRow}>
            <Text style={s.backupIcon}>🕐</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.backupLabel}>Last Backup</Text>
              <Text style={s.backupValue}>{formatBackupTime(lastBackup)}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <TouchableOpacity
            style={[s.backupBtn, backupLoading && s.btnDisabled]}
            onPress={doBackup}
            disabled={backupLoading || restoreLoading}
          >
            {backupLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.backupBtnText}>📤  Backup Now</Text>
            }
          </TouchableOpacity>

          <Text style={s.backupHint}>
            A JSON file will be created. You can save it to Google Drive, WhatsApp, or anywhere you like.
          </Text>

          <View style={s.divider} />

          <TouchableOpacity
            style={[s.restoreBtn, restoreLoading && s.btnDisabled]}
            onPress={doRestore}
            disabled={backupLoading || restoreLoading}
          >
            {restoreLoading
              ? <ActivityIndicator color={C.green} size="small" />
              : <Text style={s.restoreBtnText}>📥  Restore Backup</Text>
            }
          </TouchableOpacity>

          <Text style={s.backupHint}>
            Select a previously saved backup file to restore your data.
          </Text>
        </View>

        {/* Danger zone */}
        <View style={[s.card, s.dangerCard]}>
          <Text style={s.dangerTitle}>⚠️ DANGER ZONE</Text>
          <Text style={s.dangerSub}>
            Permanently deletes your account and all data. Cannot be undone.
          </Text>
          <TouchableOpacity style={s.deleteBtn} onPress={deleteAccount} disabled={loadingProfile}>
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
  editBtn:         { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText:     { fontSize: 13, fontWeight: '600', color: C.green },
  backupInfoRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backupIcon:      { fontSize: 22 },
  backupLabel:     { fontSize: 12, color: C.textLight, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  backupValue:     { fontSize: 14, color: C.dark, fontWeight: '600', marginTop: 2 },
  divider:         { height: 1, backgroundColor: C.border, marginVertical: 16 },
  backupBtn:       { backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backupBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  restoreBtn:      { backgroundColor: C.bg, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.green },
  restoreBtnText:  { color: C.green, fontSize: 15, fontWeight: '700' },
  backupHint:      { fontSize: 12, color: C.textLight, marginTop: 10, lineHeight: 18 },
  btnDisabled:     { opacity: 0.6 },
  dangerCard:      { borderWidth: 1.5, borderColor: '#FECACA', marginBottom: 20 },
  dangerTitle:     { fontSize: 11, fontWeight: '700', color: C.danger, letterSpacing: 0.5, marginBottom: 8 },
  dangerSub:       { fontSize: 13, color: C.textMid, marginBottom: 16 },
  deleteBtn:       { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText:   { color: C.danger, fontSize: 15, fontWeight: '700' },
});
