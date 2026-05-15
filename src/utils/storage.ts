import AsyncStorage from '@react-native-async-storage/async-storage';
import { Split } from '../types';
import { StorageKeys } from '../constants/StorageKeys';

// Generic save function
export const saveData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving data:', e);
  }
};

// Generic get function
export const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error getting data:', e);
    return null;
  }
};

// Save a new split
export async function saveSplit(split: Split) {
  try {
    const existing = await getSplits();
    const updated = [split, ...existing];
    await AsyncStorage.setItem(StorageKeys.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving split:', e);
  }
}

// Get all splits
export async function getSplits(): Promise<Split[]> {
  try {
    const data = await AsyncStorage.getItem(StorageKeys.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error getting splits:', e);
    return [];
  }
}

// Update one split (mark paid etc)
export async function updateSplit(id: string, updated: Split) {
  try {
    const splits = await getSplits();
    const index = splits.findIndex((s) => s.id === id);
    if (index !== -1) {
      splits[index] = updated;
      await AsyncStorage.setItem(StorageKeys.HISTORY, JSON.stringify(splits));
    }
  } catch (e) {
    console.error('Error updating split:', e);
  }
}
