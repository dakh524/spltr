import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { ArrowLeft, MessageCircle, CheckCircle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import FriendAvatar from '../components/FriendAvatar';
import StatusPill from '../components/StatusPill';
import AnimatedAmount from '../components/AnimatedAmount';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { updateSplit, getData, saveData } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import { formatWhatsAppMessage } from '../utils/shareMessage';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // READ THE SPLIT FROM PARAMS
  const { split } = route.params;
  
  const [currentSplit, setCurrentSplit] = useState(split);
  const qrRef = useRef<any>(null);
  const [myUPI, setMyUPI] = useState('');
  
  useEffect(() => {
    loadMyUPI();
  }, []);

  const loadMyUPI = async () => {
    const upi = await AsyncStorage.getItem(StorageKeys.MY_UPI);
    if (upi) setMyUPI(upi.trim());
  };

  if (!split) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080810', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontFamily: 'SpaceGrotesk-Bold', fontSize: 18 }}>No split data found.</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, padding: 12, backgroundColor: Colors.card, borderRadius: 12 }}
        >
          <Text style={{ color: Colors.neonGreen }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const markAsPaid = async (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = {
      ...currentSplit,
      friends: currentSplit.friends.map((f: any) =>
        f.id === friendId ? { ...f, paid: !f.paid } : f
      )
    };
    setCurrentSplit(updated);
    await updateSplit(currentSplit.id, updated);
  };

  const sendWhatsAppRequest = async (friend: any) => {
    const upiFromStorage = (await AsyncStorage.getItem(StorageKeys.MY_UPI))?.trim() || '';
    const nameFromStorage = (await AsyncStorage.getItem(StorageKeys.MY_NAME))?.trim() || '';
    
    console.log('DEBUG myUPI:', upiFromStorage);
    console.log('DEBUG myName:', nameFromStorage);

    if (!upiFromStorage) {
      Alert.alert('Setup Required', 'Please set your UPI ID in Settings first.');
      return;
    }

    const message = formatWhatsAppMessage(
      friend.name,
      nameFromStorage || 'Me',
      upiFromStorage,
      friend.amount,
      currentSplit.name
    );

    try {
      // 1. Generate QR Code Image
      if (qrRef.current && Platform.OS !== 'web') {
        qrRef.current.toDataURL(async (base64Data: string) => {
          try {
            const path = FileSystem.cacheDirectory + 'splitr_qr.png';
            await FileSystem.writeAsStringAsync(path, base64Data, {
              encoding: FileSystem.EncodingType.Base64
            });

            // 2. Share Image
            await Sharing.shareAsync(path, {
              mimeType: 'image/png',
              dialogTitle: 'Send Payment Request'
            });

            // 3. Open WhatsApp for the text part
            const phoneNumber = friend.phone ? friend.phone.replace(/[^0-9]/g, '') : '';
            const waURL = phoneNumber 
              ? `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`
              : `https://wa.me/?text=${encodeURIComponent(message)}`;
            
            await Linking.openURL(waURL);
          } catch (e) {
            console.error('QR Share Error:', e);
            // Fallback to text only
            await shareTextOnly(message, friend);
          }
        });
      } else {
        await shareTextOnly(message, friend);
      }
    } catch (error) {
      console.error('[WhatsAppShare] Error:', error);
      await shareTextOnly(message, friend);
    }
  };

  const shareTextOnly = async (message: string, friend: any) => {
    const phoneNumber = friend.phone ? friend.phone.replace(/[^0-9]/g, '') : '';
    const encodedMessage = encodeURIComponent(message);
    
    const waURL = phoneNumber 
      ? `https://wa.me/91${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    if (Platform.OS === 'web') {
      window.open(waURL, '_blank');
    } else {
      await Linking.openURL(waURL).catch(async () => {
        await Share.share({ message });
      });
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ position: 'absolute', opacity: 0, left: -1000 }}>
        {myUPI ? (
          <QRCode
            value={`upi://pay?pa=${myUPI}&cu=INR`}
            size={200}
            getRef={(ref) => (qrRef.current = ref)}
          />
        ) : null}
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Split Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.splitInfoCard}>
          <View>
            <Text style={styles.splitName}>{currentSplit.name}</Text>
            <Text style={styles.splitDate}>
              {new Date(currentSplit.date).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.amountBadge}>
            <Text style={styles.totalAmountLabel}>Total</Text>
            <AnimatedAmount amount={currentSplit.totalAmount} style={styles.totalAmountValue} />
          </View>
        </View>

        <View style={styles.peopleHeader}>
          <Text style={styles.peopleTitle}>Split between {currentSplit.friends.length + 1} people</Text>
          <Text style={styles.perPersonText}>₹{(currentSplit.totalAmount / (currentSplit.friends.length + 1)).toFixed(2)} each</Text>
        </View>

        {currentSplit.friends.map((friend: any) => {
          const isPaid = friend.paid;
          return (
            <View 
              key={friend.id} 
              style={[styles.friendCard, isPaid && styles.paidCard]}
            >
              <View style={styles.friendTopRow}>
                <FriendAvatar name={friend.name} color={friend.avatarColor} size={48} />
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, isPaid && styles.paidText]}>{friend.name}</Text>
                  <Text style={[styles.friendAmount, isPaid && styles.paidTextMuted]}>₹{friend.amount.toFixed(2)}</Text>
                </View>
                <StatusPill status={isPaid ? 'Paid' : 'Pending'} />
              </View>

              {!isPaid && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.sendBtn} 
                    onPress={() => sendWhatsAppRequest(friend)}
                  >
                    <MessageCircle color={Colors.white} size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.sendBtnText}>Send Request</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.paidBtn} 
                    onPress={() => markAsPaid(friend.id)}
                  >
                    <CheckCircle color={Colors.neonGreen} size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.paidBtnText}>Mark Paid</Text>
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
  splitInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  splitName: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  splitDate: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 4,
  },
  amountBadge: {
    alignItems: 'flex-end',
  },
  totalAmountLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  totalAmountValue: {
    color: Colors.neonGreen,
    fontSize: 28,
    fontFamily: 'BebasNeue-Regular',
  },
  peopleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  peopleTitle: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  perPersonText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  friendCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paidCard: {
    borderColor: Colors.neonGreen,
    backgroundColor: Colors.neonGreen + '10',
  },
  friendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 16,
  },
  friendName: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  friendAmount: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 2,
  },
  paidText: {
    color: Colors.neonGreen,
  },
  paidTextMuted: {
    color: Colors.neonGreen + '80',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  sendBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.hotPink,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 8,
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  paidBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.neonGreen,
  },
  paidBtnText: {
    color: Colors.neonGreen,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default ResultsScreen;
