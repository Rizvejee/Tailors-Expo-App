import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Storage, KEYS } from './storage';

// تمام screens میں یہ hook use کریں
// ہر بار screen focus ہو تو fresh name آئے
export default function useShopName() {
  const [shopName, setShopName] = useState('Tailors');

  useFocusEffect(useCallback(() => {
    Storage.get(KEYS.LOGGED_IN).then(u => {
      if (u?.name) setShopName(u.name + ' Tailors');
      else setShopName('Tailors');
    });
  }, []));

  return shopName;
}
