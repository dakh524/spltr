import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { ArrowLeft, CheckCircle, DollarSign, Clock, Check } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ProgressBar from '../components/ProgressBar';
import { Split, Friend } from '../types';

const { width } = Dimensions.get('window');

const ResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSplit = route.params?.split;
  
  const [split, setSplit] = useState<Split>(initialSplit);

  if (!split) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No split data found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const paidCount = split.friends.filter(f => f.paid).length;
  const totalFriends = split.friends.length;
  const progress = paidCount / totalFriends;

  const handleAskMoney = async (friend: Friend) => {
    // Load user details
    const myName = (await AsyncStorage.getItem('@splitr_myname'))
      ?.replace(/"/g, '').trim() || '';
    const myUPI = (await AsyncStorage.getItem('@splitr_myupi'))
      ?.replace(/"/g, '').trim() || '';

    // Validate name
    if (!myName || /^[0-9]+$/.test(myName)) {
      if (Platform.OS === 'web') {
        alert('Setup Required: Please go to Settings and enter your real name and UPI ID first.');
        navigation.navigate('Profile');
      } else {
        Alert.alert(
          'Setup Required',
          'Please go to Settings and enter your real name and UPI ID first.',
          [{ text: 'Go to Settings', onPress: () => navigation.navigate('Profile') }]
        );
      }
      return;
    }

    // Validate UPI
    if (!myUPI || !myUPI.includes('@')) {
      if (Platform.OS === 'web') {
        alert('UPI ID Missing: Please add your UPI ID in Settings before asking money.');
        navigation.navigate('Profile');
      } else {
        Alert.alert(
          'UPI ID Missing',
          'Please add your UPI ID in Settings before asking money.',
          [{ text: 'Go to Settings', onPress: () => navigation.navigate('Profile') }]
        );
      }
      return;
    }

    try {
      // Step 2: Build payment request message
      const message =
        `Hey ${friend.name}! 👋\n\n` +
        `*${myName}* paid for *${split.name}* 🧾\n` +
        `Your share: *₹${friend.amount.toFixed(2)}*\n\n` +
        `💳 Pay me on any UPI app:\n` +
        `*UPI ID: ${myUPI}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Kindly pay at your earliest convenience.\n` +
        `Thank you! 🙏\n\n` +
        `_Regards, SPLITR Team ⚡_`;

      if (Platform.OS === 'web') {
        // Web: Open WhatsApp immediately to avoid popup blocker
        const phone = friend.phone ? friend.phone.replace(/[^0-9]/g, '') : '';
        const whatsappURL = phone 
          ? `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappURL, '_blank');
        return;
      }

      // Native: Premium Image Sharing Flow
      const asset = Asset.fromModule(require('../../assets/ask_money.png'));
      await asset.downloadAsync();

      const destPath = (FileSystem as any).cacheDirectory + 'splitr_ask_money.png';
      await FileSystem.copyAsync({
        from: asset.localUri || asset.uri || '',
        to: destPath
      });

      // Step 3: Share branded image via native share sheet
      await Sharing.shareAsync(destPath, {
        mimeType: 'image/png',
        dialogTitle: `Ask money from ${friend.name}`,
      });

      // Step 4: Open WhatsApp with text after a short delay on Native
      setTimeout(async () => {
        const phone = friend.phone ? friend.phone.replace(/[^0-9]/g, '') : '';
        const whatsappURL = phone
          ? `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(message)}`
          : `whatsapp://send?text=${encodeURIComponent(message)}`;

        const canOpen = await Linking.canOpenURL(whatsappURL);
        if (canOpen) {
          await Linking.openURL(whatsappURL);
        } else {
          // Fallback: share text sheet
          Sharing.shareAsync(destPath, { dialogTitle: 'Share request text' });
        }
      }, 1000);

    } catch (error) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Could not share payment request. Try again.');
      }
      console.error('Ask Money error:', error);
    }
  };

  const handleMarkPaid = async (friendId: string) => {
    // Update friend paid status in the split
    const updatedFriends = split.friends.map(f =>
      f.id === friendId ? { ...f, paid: true } : f
    );

    const updatedSplit = { ...split, friends: updatedFriends };

    // Save updated split to AsyncStorage history
    const raw = await AsyncStorage.getItem('@splitr_history');
    const history: Split[] = raw ? JSON.parse(raw) : [];
    const updatedHistory = history.map(s =>
      s.id === split.id ? updatedSplit : s
    );
    await AsyncStorage.setItem('@splitr_history', JSON.stringify(updatedHistory));

    // Update local state so card turns green immediately
    setSplit(updatedSplit);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Split Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryName}>{split.name}</Text>
              <Text style={styles.summaryDate}>
                {new Date(split.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.summaryAmountContainer}>
              <Text style={styles.summaryAmountLabel}>Total</Text>
              <Text style={styles.summaryAmount}>₹{split.totalAmount.toLocaleString()}</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressText}>
                {paidCount} of {totalFriends} friends paid
              </Text>
              <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
            </View>
            <ProgressBar progress={progress} color={progress === 1 ? Colors.neonGreen : Colors.amber} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Friend Settlements</Text>

        {split.friends.map((friend) => {
          const isPaid = friend.paid;
          return (
            <View 
              key={friend.id} 
              style={[
                styles.friendCard, 
                isPaid ? styles.paidCard : styles.unpaidCard
              ]}
            >
              <View style={styles.friendHeader}>
                <View style={styles.nameRow}>
                  <View style={[styles.statusDot, { backgroundColor: isPaid ? Colors.neonGreen : Colors.hotPink }]} />
                  <Text style={styles.friendName}>{friend.name}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: isPaid ? '#0f2a0f' : '#2a0f0f' }]}>
                  {isPaid ? (
                    <Check color={Colors.neonGreen} size={12} style={{ marginRight: 4 }} />
                  ) : (
                    <Clock color={Colors.amber} size={12} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.statusText, { color: isPaid ? Colors.neonGreen : Colors.amber }]}>
                    {isPaid ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.friendAmount, { color: isPaid ? Colors.neonGreen : Colors.hotPink }]}>
                ₹{friend.amount.toFixed(2)}
              </Text>

              {isPaid ? (
                <View style={styles.paidFooter}>
                  <Text style={styles.paidFooterText}>Payment received 🎉</Text>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.askButton} 
                    onPress={() => handleAskMoney(friend)}
                  >
                    <DollarSign color={Colors.background} size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.askButtonText}>Ask Money</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.markPaidButton} 
                    onPress={() => handleMarkPaid(friend.id)}
                  >
                    <CheckCircle color={Colors.neonGreen} size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.markPaidButtonText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
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
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  summaryName: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  summaryDate: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 4,
  },
  summaryAmountContainer: {
    alignItems: 'flex-end',
  },
  summaryAmountLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  summaryAmount: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: 'BebasNeue-Regular',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  progressPercentage: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 16,
  },
  friendCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderLeftWidth: 4,
  },
  unpaidCard: {
    backgroundColor: '#0f0f1a',
    borderColor: '#1a1a2e',
    borderLeftColor: Colors.hotPink,
  },
  paidCard: {
    backgroundColor: '#0a1f0a',
    borderColor: '#1a3a1a',
    borderLeftColor: Colors.neonGreen,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  friendName: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk-Bold',
    textTransform: 'uppercase',
  },
  friendAmount: {
    fontSize: 32,
    fontFamily: 'BebasNeue-Regular',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  askButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neonGreen,
    height: 48,
    borderRadius: 10,
    marginRight: 8,
  },
  askButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  markPaidButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f2a0f',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neonGreen,
  },
  markPaidButtonText: {
    color: Colors.neonGreen,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  paidFooter: {
    alignItems: 'center',
    paddingTop: 4,
  },
  paidFooterText: {
    color: Colors.neonGreen,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  errorButtonText: {
    color: Colors.neonGreen,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default ResultsScreen;
