import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Storage, KEYS } from '../utils/storage';
import { syncHelper } from '../utils/syncHelper';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};
const CLOTH_TYPES = ['Shalwar Kameez','Pant Shirt','Sherwani','Waistcoat','Kurta','Suit','Other'];

export default function AddOrderScreen() {
  const [customers,    setCustomers]    = useState([]);
  const [customerId,   setCustomerId]   = useState('');
  const [clothType,    setClothType]    = useState('');
  const [clothOwner,   setClothOwner]   = useState('Customer');
  const [instructions, setInstructions] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [price,        setPrice]        = useState('');
  const [advance,      setAdvance]      = useState('');
  const [alertConfig,  setAlertConfig]  = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => { Storage.get(KEYS.CUSTOMERS).then(c => setCustomers(c || [])); }, []);

  const remaining = Math.max(0, (parseFloat(price) || 0) - (parseFloat(advance) || 0));

  const save = async () => {
    if (!customerId) { showAlert('Missing Info', 'Please select a customer.', [{ text: 'OK', style: 'confirm' }]); return; }
    if (!clothType)  { showAlert('Missing Info', 'Please select a cloth type.', [{ text: 'OK', style: 'confirm' }]); return; }
    if (!deliveryDate) { showAlert('Missing Info', 'Please enter a delivery date.', [{ text: 'OK', style: 'confirm' }]); return; }
    if (!price || parseFloat(price) <= 0) { showAlert('Missing Info', 'Please enter a valid price.', [{ text: 'OK', style: 'confirm' }]); return; }

    const orders = (await Storage.get(KEYS.ORDERS)) || [];
    orders.push({
      id: 'o_' + Date.now(), customerId, clothType, clothOwner,
      instructions, deliveryDate,
      price: parseFloat(price),
      advance: parseFloat(advance) || 0,
      remaining,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });
    // ✅ AsyncStorage + Firebase دونوں میں save
    await syncHelper.saveOrders(orders);
    showAlert('Order Saved!', 'New order has been created successfully.', [
      { text: 'OK', style: 'confirm', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>Tailors</Text>
            <Text style={s.headerTitle}>Add Order</Text>
          </View>
        </View>

        <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Text style={s.cardTitle}>ORDER DETAILS</Text>
            <Text style={s.label}>Customer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              {customers.length === 0
                ? <Text style={{ color: C.textLight, paddingVertical: 8 }}>No customers yet</Text>
                : customers.map(c => (
                  <TouchableOpacity key={c.id} style={[s.chip, customerId === c.id && s.chipActive]} onPress={() => setCustomerId(c.id)}>
                    <Text style={[s.chipText, customerId === c.id && s.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={s.label}>Cloth Type</Text>
            <View style={s.typeGrid}>
              {CLOTH_TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn, clothType === t && s.typeBtnActive]} onPress={() => setClothType(t)}>
                  <Text style={[s.typeBtnText, clothType === t && s.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Cloth Owner</Text>
            <View style={s.toggleRow}>
              <TouchableOpacity style={[s.toggleBtn, clothOwner === 'Customer' && s.toggleActive]} onPress={() => setClothOwner('Customer')}>
                <Text style={[s.toggleText, clothOwner === 'Customer' && s.toggleTextActive]}>Customer's Cloth</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toggleBtn, clothOwner === 'Shop' && s.toggleActive]} onPress={() => setClothOwner('Shop')}>
                <Text style={[s.toggleText, clothOwner === 'Shop' && s.toggleTextActive]}>Shop's Cloth</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>INSTRUCTIONS & DELIVERY</Text>
            <Text style={s.label}>Special Instructions</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top', marginBottom: 18 }]}
              value={instructions} onChangeText={setInstructions}
              placeholder="Collar type, pockets..." placeholderTextColor={C.textLight} multiline />
            <Text style={s.label}>Delivery Date</Text>
            <TextInput style={s.input} value={deliveryDate} onChangeText={setDeliveryDate}
              placeholder="e.g. 2025-12-31" placeholderTextColor={C.textLight} />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>PAYMENT</Text>
            <View style={s.priceRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Total Price (Rs.)</Text>
                <TextInput style={s.input} value={price} onChangeText={setPrice}
                  placeholder="0" placeholderTextColor={C.textLight} keyboardType="numeric" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Advance (Rs.)</Text>
                <TextInput style={s.input} value={advance} onChangeText={setAdvance}
                  placeholder="0" placeholderTextColor={C.textLight} keyboardType="numeric" />
              </View>
            </View>
            <View style={s.remainingRow}>
              <Text style={s.remainingLabel}>Remaining:</Text>
              <Text style={s.remainingValue}>Rs. {remaining.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={save}>
            <Text style={s.saveBtnText}>Save Order</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.green },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  backBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:        { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:             { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  card:             { backgroundColor: C.card, borderRadius: 18, padding: 20, marginHorizontal: 20, marginTop: 20, elevation: 2 },
  cardTitle:        { fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 0.5, marginBottom: 16 },
  label:            { fontSize: 12, fontWeight: '700', color: C.textMid, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  input:            { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.dark },
  chip:             { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 2, borderColor: C.border, backgroundColor: C.bg, marginRight: 8 },
  chipActive:       { borderColor: C.green, backgroundColor: C.green },
  chipText:         { fontSize: 14, fontWeight: '600', color: C.textMid },
  chipTextActive:   { color: '#fff' },
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  typeBtn:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: C.border, backgroundColor: C.bg },
  typeBtnActive:    { borderColor: C.green, backgroundColor: '#ECFDF5' },
  typeBtnText:      { fontSize: 13, fontWeight: '600', color: C.textMid },
  typeBtnTextActive:{ color: C.green },
  toggleRow:        { flexDirection: 'row', gap: 10 },
  toggleBtn:        { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.card, alignItems: 'center' },
  toggleActive:     { borderColor: C.green, backgroundColor: C.green },
  toggleText:       { fontSize: 13, fontWeight: '600', color: C.textMid },
  toggleTextActive: { color: '#fff' },
  priceRow:         { flexDirection: 'row', marginBottom: 12 },
  remainingRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  remainingLabel:   { fontSize: 13, color: C.textMid },
  remainingValue:   { fontSize: 15, fontWeight: '800', color: C.green },
  saveBtn:          { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 20 },
  saveBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
});
