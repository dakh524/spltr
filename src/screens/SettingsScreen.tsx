import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { ArrowLeft, Bell, CreditCard, User, Shield, Info } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import ProBanner from '../components/ProBanner';
import { getData, saveData } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

const SettingRow = ({
  icon: Icon,
  label,
  isInput = false,
  inputValue,
  onInputChange,
  placeholder,
  value
}: any) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLabelContainer}>
      <View style={styles.settingIcon}>
        <Icon color={Colors.muted} size={20} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <View style={styles.settingValueContainer}>
      {isInput ? (
        <TextInput
          style={styles.settingInput}
          value={inputValue}
          onChangeText={onInputChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.muted}
          selectionColor={Colors.blue}
          autoCorrect={false}
        />
      ) : (
        <Text style={styles.settingValue}>{value}</Text>
      )}
    </View>
  </View>
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [upiId, setUpiId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(true);

  // Auto-fix and Load on screen open
  useEffect(() => {
    const loadSettings = async () => {
      let upi = await getData(StorageKeys.MY_UPI);
      let sName = await getData(StorageKeys.MY_NAME);
      let sPhone = await getData(StorageKeys.MY_PHONE);

      // AUTO-FIX: Aggressive detect if keys are swapped
      // If Name HAS an '@', it's almost certainly a UPI ID. Swap it.
      if (sName && sName.includes('@')) {
        console.log('[Settings] Detected UPI in Name field. Swapping keys...');
        const temp = upi;
        upi = sName;
        sName = temp || 'User'; // Fallback if temp was empty
        // Save back correctly
        await saveData(StorageKeys.MY_UPI, upi);
        await saveData(StorageKeys.MY_NAME, sName);
      }

      if (upi) setUpiId(upi);
      if (sName) setName(sName);
      if (sPhone) setPhone(sPhone);
    };
    loadSettings();
  }, []);

  // BUG 5 Fix: Save immediately on every change
  const handleSaveUPI = async (value: string) => {
    setUpiId(value);
    await saveData(StorageKeys.MY_UPI, value);
  };

  const handleSaveName = async (value: string) => {
    setName(value);
    await saveData(StorageKeys.MY_NAME, value);
  };

  const handleSavePhone = async (value: string) => {
    setPhone(value);
    await saveData(StorageKeys.MY_PHONE, value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <SettingRow
            icon={CreditCard}
            label="UPI ID"
            isInput
            inputValue={upiId}
            onInputChange={handleSaveUPI}
            placeholder="example@upi"
          />
          <SettingRow
            icon={User}
            label="Profile Name"
            isInput
            inputValue={name}
            onInputChange={handleSaveName}
            placeholder="Your Name"
          />
          <SettingRow
            icon={Shield}
            label="Phone Number"
            isInput
            inputValue={phone}
            onInputChange={handleSavePhone}
            placeholder="+91 XXXXX XXXXX"
          />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIcon}>
                <Info color={Colors.muted} size={20} />
              </View>
              <Text style={styles.settingLabel}>Currency</Text>
            </View>
            <Text style={styles.settingValue}>INR (₹)</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIcon}>
                <Info color={Colors.muted} size={20} />
              </View>
              <Text style={styles.settingLabel}>Default Split</Text>
            </View>
            <Text style={styles.settingValue}>Equal</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={styles.settingIcon}>
                <Bell color={Colors.muted} size={20} />
              </View>
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={(val) => {
                setNotifications(val);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: Colors.border, true: Colors.neonGreen + '80' }}
              thumbColor={notifications ? Colors.neonGreen : Colors.muted}
            />
          </View>
        </View>

        <ProBanner />
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  settingValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingValue: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  settingInput: {
    color: Colors.blue,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
    textAlign: 'right',
    width: '100%',
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
});

export default SettingsScreen;
