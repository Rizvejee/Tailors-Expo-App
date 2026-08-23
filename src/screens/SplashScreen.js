import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Storage, KEYS } from '../utils/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale   = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const lineScale   = useRef(new Animated.Value(0)).current;
  const subOpacity  = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(lineScale,   { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(subOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      // Firebase auth state check
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        router.replace(user ? '/(drawer)/' : '/login');
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.circleLarge} />
      <View style={s.circleSmall} />
      <View style={s.circleMid} />
      <View style={s.center}>
        <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Text style={s.logoEmoji}>🧵</Text>
        </Animated.View>
        <Animated.Text style={[s.title, { opacity: textOpacity }]}>Tailors</Animated.Text>
        <Animated.View style={[s.line, { transform: [{ scaleX: lineScale }] }]} />
        <Animated.Text style={[s.subtitle, { opacity: subOpacity }]}>Tailor Shop Management</Animated.Text>
        <Animated.View style={[s.dots, { opacity: dotsOpacity }]}>
          <DotPulse delay={0} /><DotPulse delay={200} /><DotPulse delay={400} />
        </Animated.View>
      </View>
      <Animated.Text style={[s.tagline, { opacity: subOpacity }]}>Crafted with ❤️ for your shop</Animated.Text>
    </View>
  );
}

function DotPulse({ delay }) {
  const anim = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1,    duration: 500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.25, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.dot, { opacity: anim }]} />;
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  circleLarge: { position: 'absolute', width: width*0.85, height: width*0.85, borderRadius: width*0.425, backgroundColor: 'rgba(255,255,255,0.04)', top: -width*0.2, right: -width*0.2 },
  circleSmall: { position: 'absolute', width: width*0.55, height: width*0.55, borderRadius: width*0.275, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -width*0.1, left: -width*0.1 },
  circleMid:   { position: 'absolute', width: width*0.4,  height: width*0.4,  borderRadius: width*0.2,   backgroundColor: 'rgba(212,168,83,0.07)', bottom: 100, right: -30 },
  center:      { alignItems: 'center' },
  logoWrap:    { width: 110, height: 110, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.11)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  logoEmoji:   { fontSize: 54 },
  title:       { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 16 },
  line:        { width: 60, height: 3, backgroundColor: '#D4A853', borderRadius: 2, marginBottom: 14 },
  subtitle:    { fontSize: 14, fontWeight: '500', color: '#A7C4B5', letterSpacing: 0.5 },
  dots:        { flexDirection: 'row', gap: 8, marginTop: 48 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4A853' },
  tagline:     { position: 'absolute', bottom: 48, fontSize: 13, color: 'rgba(255,255,255,0.3)' },
});
