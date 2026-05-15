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
import { ArrowLeft, Edit3, Link as LinkIcon, X } from 'lucide-react-native';
import { Colors, AvatarColors } from '../constants/Colors';
import AmountInput from '../components/AmountInput';
import FriendSelector from '../components/FriendSelector';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { getData, saveData, saveSplit } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import { Split, Friend, Category } from '../types';

const NewSplitScreen = () => {
  const navigation = useNavigation<any>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendUPI, setNewFriendUPI] = useState('');
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
        { id: '1', name: 'Naman Vani', upiId: 'naman@upi', avatarColor: AvatarColors[0] },
        { id: '2', name: 'Aman Gupta', upiId: 'aman@upi', avatarColor: AvatarColors[1] },
        { id: '3', name: 'Shubham', upiId: 'shubham@upi', avatarColor: AvatarColors[2] },
      ];
      setAllFriends(defaults);
      await saveData(StorageKeys.FRIENDS, defaults);
    }
  };

  const handleToggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleAddFriend = async () => {
    if (!newFriendName) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    const newFriend = {
      id: Date.now().toString(),
      name: newFriendName,
      upiId: newFriendUPI || '',
      avatarColor: AvatarColors[allFriends.length % AvatarColors.length],
    };
    const updated = [...allFriends, newFriend];
    setAllFriends(updated);
    await saveData(StorageKeys.FRIENDS, updated);
    setNewFriendName('');
    setNewFriendUPI('');
    setShowAddFriend(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleGenerateLinks = async () => {
    // 1. Check myUPI exists
    const myUPI = await getData(StorageKeys.MY_UPI);
    if (!myUPI || myUPI.trim() === '') {
      Alert.alert(
        "Setup Required",
        "Please set your UPI ID in Settings first",
        [
          { text: "Go to Settings", onPress: () => navigation.navigate('Profile') },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    if (!amount || amount === '0' || !splitName.trim() || selectedFriends.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incomplete Fields', 'Please enter a valid amount, split name, and select at least one friend.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const total = parseFloat(amount);
      if (isNaN(total) || total <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid total amount.");
        return;
      }

      // 2. Calculate amount per person (including self)
      const perPerson = total / (selectedFriends.length + 1);

      const friendsData: Friend[] = selectedFriends.map((id) => {
        const f = allFriends.find((af) => af.id === id);
        if (!f) throw new Error("Friend not found");
        return {
          id: f.id,
          name: f.name,
          upiId: f.upiId || '', // Default to empty string if missing
          amount: perPerson,
          paid: false,
          avatarColor: f.avatarColor,
        };
      });

      // 3. Build split object
      const newSplit: Split = {
        id: Date.now().toString(),
        name: splitName,
        category,
        totalAmount: total,
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        friends: friendsData,
        note: note || splitName,
        createdBy: 'Me',
      };

      // 4. Save to AsyncStorage via saveSplit()
      await saveSplit(newSplit);

      // 5. Navigate to ResultsScreen
      navigation.navigate('Results', { splitId: newSplit.id });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate split. Please try again.");
    }
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

            <View style={[styles.inputContainer, { marginTop: 12 }]}>
              <Edit3 color={Colors.muted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Add Note (optional)"
                placeholderTextColor={Colors.muted}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          <Text style={styles.label}>Split Between</Text>
          <FriendSelector
            friends={allFriends}
            selectedIds={selectedFriends}
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
              autoFocus
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
              <Text style={styles.modalButtonText}>Add Friend</Text>
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
