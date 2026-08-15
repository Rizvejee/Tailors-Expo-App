import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  get: async (key) => {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set: async (key, value) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove: async (key) => {
    try { await AsyncStorage.removeItem(key); } catch {}
  },
};

export const KEYS = {
  USERS:        'rt_users',
  LOGGED_IN:    'rt_logged_in',
  CUSTOMERS:    'rt_customers',
  ORDERS:       'rt_orders',
  MEASUREMENTS: 'rt_measurements',
  TRASH:        'rt_trash',
};

// User-specific keys — data logout پر محفوظ رہے
// یہ function uid کے ساتھ key بناتا ہے
export const userKey = (key, uid) => `${key}_${uid}`;
