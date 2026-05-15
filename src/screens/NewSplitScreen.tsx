import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { ArrowLeft, Edit3, Link as LinkIcon, X, Contact } from 'lucide-react-native';
import { Colors, AvatarColors } from '../constants/Colors';
import AmountInput from '../components/AmountInput';
import FriendSelector from '../components/FriendSelector';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';
import { getData, saveData, saveSplit } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import { Split, Friend, Category } from '../types';
import { makeUPILink } from '../utils/upiLink';

const NewSplitScreen = () => {
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendUPI, setNewFriendUPI] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [splitName, setSplitName] = useState('');
  const [category, setCategory] = useState<Category>('other');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    const friends = await getData(StorageKeys.FRIENDS);
    if (friends) {
      setAllFriends(friends);
    } else {
      const defaults = [
        { id: '1', name: 'Naman Vani', upiId: 'naman@upi', phone: '', avatarColor: AvatarColors[0] },
        { id: '2', name: 'Aman Gupta', upiId: 'aman@upi', phone: '', avatarColor: AvatarColors[1] },
        { id: '3', name: 'Shubham', upiId: 'shubham@upi', phone: '', avatarColor: AvatarColors[2] },
      ];
      setAllFriends(defaults);
      await saveData(StorageKeys.FRIENDS, defaults);
    }
  };

  const handleToggleFriend = (id: string) => {
    const friend = allFriends.find(f => f.id === id);
    if (!friend) return;

    setSelectedFriends((prev) =>
      prev.some(f => f.id === id) ? prev.filter((f) => f.id !== id) : [...prev, friend]
    );
  };

  // IMPROVEMENT 1: Contact Picker
  const pickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        setNewFriendName(contact.name);
        const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 
          ? contact.phoneNumbers[0].number?.replace(/[^0-9]/g, '') 
          : '';
        
        // Clean phone number (remove +91 if present)
        const cleanPhone = phone?.startsWith('91') && phone.length > 10 
          ? phone.substring(2) 
          : phone;
        
        setNewFriendPhone(cleanPhone || '');

        // Auto-fill UPI if previously saved
        const existingFriend = allFriends.find(f => 
          f.name === contact.name || (cleanPhone && f.phone === cleanPhone)
        );
        if (existingFriend && existingFriend.upiId) {
          setNewFriendUPI(existingFriend.upiId);
        } else {
          setNewFriendUPI('');
        }
        
        setShowAddFriend(true);
      }
    } else {
      Alert.alert("Permission Denied", "We need access to your contacts to pick a friend.");
    }
  };

  const handleAddFriend = async () => {
    if (!newFriendName) return;
    
    const friendId = Date.now().toString();
    const newFriend = {
      id: friendId,
      name: newFriendName,
      upiId: newFriendUPI || '',
      phone: newFriendPhone || '',
      avatarColor: AvatarColors[allFriends.length % AvatarColors.length],
    };

    // Update existing or add new
    let updatedFriends;
    const existingIndex = allFriends.findIndex(f => 
      (newFriendPhone && f.phone === newFriendPhone) || (f.name === newFriendName && !f.phone)
    );

    if (existingIndex !== -1) {
      updatedFriends = [...allFriends];
      updatedFriends[existingIndex] = { ...updatedFriends[existingIndex], ...newFriend, id: updatedFriends[existingIndex].id };
    } else {
      updatedFriends = [...allFriends, newFriend];
    }

    setAllFriends(updatedFriends);
    await saveData(StorageKeys.FRIENDS, updatedFriends);
    
    // Automatically select the added friend
    const finalFriend = existingIndex !== -1 ? updatedFriends[existingIndex] : newFriend;
    if (!selectedFriends.some(f => f.id === finalFriend.id)) {
      setSelectedFriends([...selectedFriends, finalFriend]);
    }

    setNewFriendName('');
    setNewFriendUPI('');
    setNewFriendPhone('');
    setShowAddFriend(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleGenerateLinks = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please add at least one friend');
      return;
    }

    const myUPI = await getData(StorageKeys.MY_UPI);
    const myName = await getData(StorageKeys.MY_NAME);

    if (!myUPI) {
      Alert.alert(
        'UPI ID Missing',
        'Please set your UPI ID in Settings first',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Profile') }, { text: 'Cancel' }]
      );
      return;
    }

    const totalAmount = parseFloat(amount);
    const splitAmount = totalAmount / (selectedFriends.length + 1);
    const splitAmountVal = parseFloat(splitAmount.toFixed(2));

    const friendsWithLinks = selectedFriends.map(friend => ({
      ...friend,
      amount: splitAmountVal,
      paid: false,
      upiLink: makeUPILink(
        myUPI,
        myName || 'Me',
        splitAmountVal,
        splitName || note || 'Bill Split'
      )
    }));

    const newSplit: Split = {
      id: Date.now().toString(),
      name: splitName || note || 'Bill Split',
      category: category || 'other',
      totalAmount: totalAmount,
      date: new Date().toISOString(),
      note: note || '',
      friends: friendsWithLinks,
      createdBy: 'Me'
    };

    await saveSplit(newSplit);
    navigation.navigate('Results', { split: newSplit });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={Colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Split</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Total Amount</Text>
          <AmountInput value={amount} onChangeText={setAmount} />

          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Edit3 color={Colors.muted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="What is this for?"
                placeholderTextColor={Colors.muted}
                value={splitName}
                onChangeText={setSplitName}
              />
            </View>
          </View>

          <View style={styles.friendsHeader}>
            <Text style={styles.labelSmall}>Split Between</Text>
            <TouchableOpacity style={styles.contactPickerBtn} onPress={pickContact}>
              <Contact color={Colors.neonGreen} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.contactPickerText}>Contacts</Text>
            </TouchableOpacity>
          </View>
          
          <FriendSelector
            friends={allFriends}
            selectedIds={selectedFriends.map(f => f.id)}
            onToggle={handleToggleFriend}
            onAddMore={() => setShowAddFriend(true)}
          />

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateLinks}>
            <LinkIcon color={Colors.neonGreen} size={20} style={{ marginRight: 10 }} />
            <Text style={styles.generateButtonText}>Generate Links</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showAddFriend} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setShowAddFriend(false)}>
                <X color={Colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Friend's Name"
              placeholderTextColor={Colors.muted}
              value={newFriendName}
              onChangeText={setNewFriendName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              placeholderTextColor={Colors.muted}
              value={newFriendPhone}
              onChangeText={setNewFriendPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="UPI ID (optional)"
              placeholderTextColor={Colors.muted}
              value={newFriendUPI}
              onChangeText={setNewFriendUPI}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleAddFriend}>
              <Text style={styles.modalButtonText}>Save Friend</Text>
            </TouchableOpacity>
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
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  label: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  labelSmall: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    textTransform: 'uppercase',
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  contactPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neonGreen + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neonGreen + '30',
  },
  contactPickerText: {
    color: Colors.neonGreen,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  inputSection: {
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: Colors.white,
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 16,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.neonGreen,
    backgroundColor: Colors.background,
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  generateButtonText: {
    color: Colors.neonGreen,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
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
    paddingBottom: 40,
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
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    color: Colors.white,
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButton: {
    backgroundColor: Colors.neonGreen,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default NewSplitScreen;
