import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Storage, KEYS } from '../utils/storage';
import { syncHelper } from '../utils/syncHelper';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};

export default function AddCustomerScreen() {
  const [name,        setName]        = useState('');
  const [phone,       setPhone]       = useState('');
  const [address,     setAddress]     = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const save = async () => {
    if (!name.trim()) {
      showAlert('Missing Info', 'Please enter the customer name.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (phone.trim().length < 7) {
      showAlert('Missing Info', 'Please enter a valid phone number.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    const customers = (await Storage.get(KEYS.CUSTOMERS)) || [];
    customers.push({
      id: 'c_' + Date.now(), name: name.trim(),
      phone: phone.trim(), address: address.trim(),
      createdAt: new Date().toISOString(),
    });
    await syncHelper.saveCustomers(customers);
    showAlert('Saved!', 'Customer saved successfully.', [
      { text: 'OK', style: 'confirm', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>Tailors</Text>
            <Text style={s.headerTitle}>Add Customer</Text>
          </View>
        </View>
        <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={s.formCard}>
            <FormField label="Full Name"    value={name}    onChange={setName}    placeholder="e.g. Ahmed Ali" />
            <FormField label="Phone Number" value={phone}   onChange={setPhone}   placeholder="e.g. 0300-1234567" keyboard="phone-pad" />
            <View style={s.group}>
              <Text style={s.label}>Address <Text style={s.optional}>(optional)</Text></Text>
              <TextInput style={[s.input, { height: 90, textAlignVertical: 'top' }]}
                value={address} onChangeText={setAddress} placeholder="Street, area, city..."
                placeholderTextColor={C.textLight} multiline numberOfLines={3} />
            </View>
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={save}>
            <Text style={s.saveBtnText}>Save Customer</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </SafeAreaView>
  );
}

function FormField({ label, value, onChange, placeholder, keyboard }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#9CA3AF" keyboardType={keyboard || 'default'} autoCapitalize="words" />
    </View>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.green },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:   { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:        { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  formCard:    { backgroundColor: C.card, borderRadius: 18, padding: 20, margin: 20, elevation: 2 },
  group:       { marginBottom: 18 },
  label:       { fontSize: 12, fontWeight: '700', color: C.textMid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  optional:    { fontSize: 10, fontWeight: '400', color: C.textLight, textTransform: 'none' },
  input:       { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.dark },
  saveBtn:     { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
