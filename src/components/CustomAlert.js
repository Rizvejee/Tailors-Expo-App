import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback,
} from 'react-native';

// Modal نہیں — screen کے اندر render ہوتا ہے
// اس طرح navigation bar کا رنگ override نہیں ہوتا
export default function CustomAlert({ visible, title, message, buttons, onClose }) {
  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>
      <View style={s.box}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>🧵</Text>
        </View>
        <Text style={s.title}>{title}</Text>
        {!!message && <Text style={s.message}>{message}</Text>}
        <View style={[s.btnRow, buttons.length === 1 && { justifyContent: 'center' }]}>
          {buttons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[
                s.btn,
                btn.style === 'cancel'      && s.btnCancel,
                btn.style === 'confirm'     && s.btnConfirm,
                btn.style === 'destructive' && s.btnDanger,
                buttons.length === 1        && { flex: 0, paddingHorizontal: 40 },
              ]}
              onPress={() => {
                onClose();
                if (btn.onPress) btn.onPress();
              }}
              activeOpacity={0.82}
            >
              <Text style={[
                s.btnText,
                btn.style === 'cancel'      && s.btnTextCancel,
                btn.style === 'confirm'     && s.btnTextConfirm,
                btn.style === 'destructive' && s.btnTextDanger,
              ]}>
                {btn.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  backdrop:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  box:            { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, width: '88%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, elevation: 12, zIndex: 10000 },
  iconWrap:       { width: 68, height: 68, borderRadius: 34, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon:           { fontSize: 32 },
  title:          { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  message:        { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btnRow:         { flexDirection: 'row', gap: 10, width: '100%' },
  btn:            { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnCancel:      { backgroundColor: '#F3F4F6' },
  btnConfirm:     { backgroundColor: '#1B4332' },
  btnDanger:      { backgroundColor: '#FEE2E2' },
  btnText:        { fontSize: 14, fontWeight: '700' },
  btnTextCancel:  { color: '#4B5563' },
  btnTextConfirm: { color: '#FFFFFF' },
  btnTextDanger:  { color: '#DC2626' },
});
