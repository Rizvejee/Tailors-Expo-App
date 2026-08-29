import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Storage, KEYS } from '../utils/storage';
import useShopName from '../utils/useShopName';
import { syncHelper } from '../utils/syncHelper';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8', orange: '#E07B39',
};

const MALE_FIELDS = [
  { key: 'shirt_length',   label: 'Shirt Length' },
  { key: 'sleeve',         label: 'Sleeve' },
  { key: 'shoulder',       label: 'Shoulder' },
  { key: 'collar',         label: 'Collar / Baan' },
  { key: 'daman',          label: 'Daman' },
  { key: 'shalwar_length', label: 'Shalwar Length' },
  { key: 'mohri',          label: 'Mohri (Bottom)' },
  
];
const FEMALE_FIELDS = [
  { key: 'kameez_length',  label: 'Kameez Length' },
  { key: 'sleeve',         label: 'Sleeve' },
  { key: 'chest',          label: 'Chest' },
  { key: 'waist',          label: 'Waist' },
  { key: 'daman',          label: 'Daman (Hem)' },
  { key: 'shalwar_length', label: 'Shalwar Length' },
  { key: 'mohri',          label: 'Mohri (Bottom)' },
];

const STATUS_COLORS = { Pending: '#E07B39', Ready: '#2D6A4F', Delivered: '#6B7280' };
const STATUS_BG     = { Pending: '#FFF3E0', Ready: '#ECFDF5', Delivered: '#F3F4F6' };

export default function MeasurementsScreen() {
  const shopName = useShopName();
  const { customerId: routeCustomerId } = useLocalSearchParams();
  const [customers,      setCustomers]      = useState([]);
  const [selectedCId,    setSelectedCId]    = useState(null);
  const [gender,         setGender]         = useState('male');
  const [values,         setValues]         = useState({});
  const [isEditing,      setIsEditing]      = useState(false);
  const [hasSaved,       setHasSaved]       = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [alertConfig,    setAlertConfig]    = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useFocusEffect(useCallback(() => { loadCustomers(); }, [routeCustomerId]));

  const loadCustomers = async () => {
    const list = (await Storage.get(KEYS.CUSTOMERS)) || [];
    setCustomers(list);
    if (list.length === 0) { setSelectedCId(null); return; }

    // نیا customer آنے پر پہلے state reset کریں
    setSelectedCId(null);
    setValues({});
    setCustomerOrders([]);

    // صرف routeCustomerId ہو تو select کریں
    if (routeCustomerId && list.find(c => c.id === routeCustomerId)) {
      setSelectedCId(routeCustomerId);
      await loadMeasurements(routeCustomerId, gender);
      await loadCustomerOrders(routeCustomerId);
    }
  };

  const selectCustomer = async (cId) => {
    setSelectedCId(cId);
    setIsEditing(false);
    await loadMeasurements(cId, gender);
    await loadCustomerOrders(cId);
  };

  const changeGender = async (g) => {
    setGender(g);
    setIsEditing(false);
    if (selectedCId) await loadMeasurements(selectedCId, g);
  };

  const loadMeasurements = async (cId, g) => {
    const all  = (await Storage.get(KEYS.MEASUREMENTS)) || {};
    const data = (all[cId] && all[cId][g]) || {};
    setValues(data);
    setHasSaved(Object.keys(data).length > 0);
  };

  // ── Customer کے orders load کریں ──
  const loadCustomerOrders = async (cId) => {
    const allOrders = (await Storage.get(KEYS.ORDERS)) || [];
    const filtered  = allOrders.filter(o => o.customerId === cId);
    setCustomerOrders(filtered);
  };

  const save = async () => {
    if (!selectedCId) {
      showAlert('No Customer', 'Please select a customer first.', [{ text: 'OK', style: 'confirm' }]);
      return;
    }
    const all = (await Storage.get(KEYS.MEASUREMENTS)) || {};
    if (!all[selectedCId]) all[selectedCId] = {};
    all[selectedCId][gender] = values;
    await syncHelper.saveMeasurements(all);
    setIsEditing(false);
    setHasSaved(true);
    showAlert('Saved!', 'Measurements saved successfully.', [{ text: 'OK', style: 'confirm' }]);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCId);
  const fields            = gender === 'male' ? MALE_FIELDS : FEMALE_FIELDS;
  const isReadOnly        = hasSaved && !isEditing;

  return (
    <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.menuBtn} onPress={() => router.push('/(drawer)/customers')}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerSub}>{shopName}</Text>
            <Text style={s.headerTitle}>
              {selectedCustomer ? selectedCustomer.name : 'Measurements'}
            </Text>
          </View>
          <TouchableOpacity
            style={s.addOrderBtn}
            onPress={() => router.push({ pathname: '/add-order', params: { preCustomerId: selectedCId } })}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Order</Text>
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Gender tabs ── */}
            <View style={s.tabs}>
              <TouchableOpacity
                style={[s.tab, gender === 'male' && s.tabActive]}
                onPress={() => changeGender('male')}
              >
                <Text style={[s.tabText, gender === 'male' && s.tabTextActive]}>👔 Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, gender === 'female' && s.tabActive]}
                onPress={() => changeGender('female')}
              >
                <Text style={[s.tabText, gender === 'female' && s.tabTextActive]}>👗 Female</Text>
              </TouchableOpacity>
            </View>

            {/* ── Measurement fields ── */}
            {customers.length > 0 && selectedCId && (
              <View style={s.formCard}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>
                    📐 {gender === 'male' ? 'Male' : 'Female'} Measurements
                  </Text>
                  {isReadOnly && (
                    <TouchableOpacity style={s.editBadge} onPress={() => setIsEditing(true)}>
                      <Text style={s.editBadgeText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {fields.map((f, i) => (
                  <View
                    key={f.key}
                    style={[s.fieldRow, i === fields.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={[s.fieldInput, isReadOnly && s.fieldInputReadOnly]}
                        value={values[f.key] ? String(values[f.key]) : ''}
                        onChangeText={v => setValues(prev => ({ ...prev, [f.key]: v }))}
                        placeholder={isReadOnly ? '—' : '0'}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        editable={!isReadOnly}
                      />
                      <Text style={s.unit}>in</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Save button ── */}
            {customers.length > 0 && selectedCId && !isReadOnly && (
              <TouchableOpacity style={s.saveBtn} onPress={save}>
                <Text style={s.saveBtnText}>
                  {hasSaved ? 'Update Measurements' : 'Save Measurements'}
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Latest Special Instructions — ایک کارڈ ── */}
            {(() => {
              // سب orders میں سے latest instructions والا نکالیں
              const withInstructions = customerOrders
                .filter(o => o.instructions && o.instructions.trim())
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              const latest = withInstructions[0];
              if (!latest) return null;
              return (
                <View style={s.ordersCard}>
                  <Text style={s.ordersCardTitle}>📝 Special Instructions</Text>
                  <Text style={s.instructionsText}>{latest.instructions}</Text>
                </View>
              );
            })()}
          </ScrollView>
        </View>

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

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: C.green },
  header:             { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  addOrderBtn:  { backgroundColor: 'rgba(212,168,83,0.9)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  menuBtn:            { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:          { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:        { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:               { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 22 },
  sectionLabel:       { fontSize: 12, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  // Customer chips
  chip:               { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 2, borderColor: C.border, backgroundColor: C.card, marginRight: 8 },
  chipActive:         { borderColor: C.green, backgroundColor: C.green },
  chipText:           { fontSize: 14, fontWeight: '600', color: C.textMid },
  chipTextActive:     { color: '#fff' },
  noCustomerBox:      { backgroundColor: C.card, borderRadius: 14, padding: 18, marginBottom: 20, alignItems: 'center' },
  noCustomerText:     { fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 12 },
  addCustBtn:         { backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  addCustBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Orders card
  ordersCard:         { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  ordersCardTitle:    { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  orderItem:          { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  orderItemTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderClothType:     { fontSize: 14, fontWeight: '700', color: C.dark },
  statusBadge:        { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText:    { fontSize: 11, fontWeight: '700' },
  orderMeta:          { fontSize: 12, color: C.textMid, marginBottom: 6 },
  instructionsBox:    { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, marginTop: 4 },
  instructionsLabel:  { fontSize: 11, fontWeight: '700', color: C.mid, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 },
  instructionsText:   { fontSize: 13, color: C.dark, lineHeight: 18 },
  noInstructions:     { fontSize: 12, color: C.textLight, fontStyle: 'italic', marginTop: 2 },

  // Gender tabs
  tabs:               { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab:                { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.card, alignItems: 'center' },
  tabActive:          { borderColor: C.green, backgroundColor: C.green },
  tabText:            { fontSize: 14, fontWeight: '600', color: C.textMid },
  tabTextActive:      { color: '#fff' },

  // Measurement form
  formCard:           { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 16, elevation: 2 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  cardTitle:          { fontSize: 13, fontWeight: '700', color: C.dark },
  editBadge:          { backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  editBadgeText:      { fontSize: 12, fontWeight: '700', color: C.green },
  fieldRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  fieldLabel:         { fontSize: 14, color: C.dark, fontWeight: '500' },
  fieldInput:         { width: 80, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, fontSize: 14, color: C.dark, textAlign: 'right' },
  fieldInputReadOnly: { backgroundColor: C.bg, borderColor: 'transparent', color: C.textMid },
  unit:               { fontSize: 12, color: C.textLight, marginLeft: 6, width: 16 },
  saveBtn:            { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
});
