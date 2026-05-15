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
import { ArrowLeft, Bell, CreditCard, User, Shield, Info, Users, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import ProBanner from '../components/ProBanner';
import { getData, saveData } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Modal, Alert } from 'react-native';
import { AvatarColors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [myUPI, setMyUPI] = useState('');
  const [myName, setMyName] = useState('');
  const [myPhone, setMyPhone] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [editingFriend, setEditingFriend] = useState<any>(null);
  
  // Friend modal state
  const [fName, setFName] = useState('');
  const [fUPI, setFUPI] = useState('');
  const [fPhone, setFPhone] = useState('');

  // STEP 5: One-time data correction for swapped values
  useEffect(() => {
    const fixCorruptedData = async () => {
      const name = await AsyncStorage.getItem(StorageKeys.MY_NAME);
      // if name looks like a phone number, it means fields were swapped or corrupted
      if (name && /^[0-9]{10}$/.test(name.replace(/"/g, '').trim())) {
        console.log('[Settings] Corrupted data detected. Wiping profile keys...');
        await AsyncStorage.multiRemove([StorageKeys.MY_NAME, StorageKeys.MY_UPI, StorageKeys.MY_PHONE]);
        setMyName('');
        setMyUPI('');
        setMyPhone('');
      }
    };
    fixCorruptedData();
  }, []);

  // STEP 1: Load and strip quotes
  useEffect(() => {
    const loadSettings = async () => {
      const name = await AsyncStorage.getItem(StorageKeys.MY_NAME);
      const upi = await AsyncStorage.getItem(StorageKeys.MY_UPI);
      const phone = await AsyncStorage.getItem(StorageKeys.MY_PHONE);

      setMyName(name?.replace(/"/g, '').trim() || '');
      setMyUPI(upi?.replace(/"/g, '').trim() || '');
      setMyPhone(phone?.replace(/"/g, '').trim() || '');

      // Load Friends
      const savedFriends = await getData(StorageKeys.FRIENDS);
      if (savedFriends) setFriends(savedFriends);
    };
    loadSettings();
  }, []);

  // STEP 2: Save function with EXACT keys and trimming
  const handleSaveName = async (value: string) => {
    setMyName(value);
    await AsyncStorage.setItem(StorageKeys.MY_NAME, value.trim());
  };

  const handleSaveUPI = async (value: string) => {
    setMyUPI(value);
    await AsyncStorage.setItem(StorageKeys.MY_UPI, value.trim());
  };

  const handleSavePhone = async (value: string) => {
    setMyPhone(value);
    await AsyncStorage.setItem(StorageKeys.MY_PHONE, value.trim());
  };

  // Friends Management Logic
  const openAddFriend = () => {
    setEditingFriend(null);
    setFName('');
    setFUPI('');
    setFPhone('');
    setShowFriendModal(true);
  };

  const openEditFriend = (friend: any) => {
    setEditingFriend(friend);
    setFName(friend.name);
    setFUPI(friend.upiId);
    setFPhone(friend.phone);
    setShowFriendModal(true);
  };

  const handleSaveFriend = async () => {
    if (!fName) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    let updatedFriends = [...friends];
    if (editingFriend) {
      // Edit existing
      const index = updatedFriends.findIndex(f => f.id === editingFriend.id);
      if (index !== -1) {
        updatedFriends[index] = {
          ...editingFriend,
          name: fName,
          upiId: fUPI,
          phone: fPhone,
        };
      }
    } else {
      // Add new
      const newFriend = {
        id: Date.now().toString(),
        name: fName,
        upiId: fUPI,
        phone: fPhone,
        avatarColor: AvatarColors[friends.length % AvatarColors.length],
      };
      updatedFriends.push(newFriend);
    }

    setFriends(updatedFriends);
    await saveData(StorageKeys.FRIENDS, updatedFriends);
    setShowFriendModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteFriend = (id: string) => {
    Alert.alert(
      'Delete Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updated = friends.filter(f => f.id !== id);
            setFriends(updated);
            await saveData(StorageKeys.FRIENDS, updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
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
            inputValue={myUPI}
            onInputChange={handleSaveUPI}
            placeholder="example@upi"
          />
          <SettingRow
            icon={User}
            label="Profile Name"
            isInput
            inputValue={myName}
            onInputChange={handleSaveName}
            placeholder="Your Name"
          />
          <SettingRow
            icon={Shield}
            label="Phone Number"
            isInput
            inputValue={myPhone}
            onInputChange={handleSavePhone}
            placeholder="10 digit number"
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Saved Friends</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddFriend}>
            <Plus color={Colors.neonGreen} size={18} style={{ marginRight: 4 }} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No saved friends yet</Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendRow}>
                <View style={styles.friendInfo}>
                  <View style={[styles.avatar, { backgroundColor: friend.avatarColor + '20' }]}>
                    <Text style={[styles.avatarText, { color: friend.avatarColor }]}>
                      {friend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendSub}>{friend.upiId || 'No UPI'} • {friend.phone || 'No Phone'}</Text>
                  </View>
                </View>
                <View style={styles.friendActions}>
                  <TouchableOpacity onPress={() => openEditFriend(friend)} style={styles.actionBtn}>
                    <Edit2 color={Colors.muted} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteFriend(friend.id)} style={styles.actionBtn}>
                    <Trash2 color={Colors.hotPink} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <ProBanner />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Friend Add/Edit Modal */}
      <Modal visible={showFriendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingFriend ? 'Edit Friend' : 'Add Friend'}</Text>
              <TouchableOpacity onPress={() => setShowFriendModal(false)}>
                <X color={Colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor={Colors.muted}
                value={fName}
                onChangeText={setFName}
              />

              <Text style={styles.inputLabel}>UPI ID</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="example@upi"
                placeholderTextColor={Colors.muted}
                value={fUPI}
                onChangeText={setFUPI}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="10 digit number"
                placeholderTextColor={Colors.muted}
                value={fPhone}
                onChangeText={setFPhone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveFriend}>
                <Text style={styles.saveButtonText}>Save Friend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neonGreen + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neonGreen + '30',
  },
  addButtonText: {
    color: Colors.neonGreen,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  friendName: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  friendSub: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  modalBody: {
    marginTop: 10,
  },
  inputLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    color: Colors.white,
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.neonGreen,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default SettingsScreen;
