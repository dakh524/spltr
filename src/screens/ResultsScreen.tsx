import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { ArrowLeft, MessageCircle, Link as LinkIcon } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import FriendAvatar from '../components/FriendAvatar';
import StatusPill from '../components/StatusPill';
import AnimatedAmount from '../components/AnimatedAmount';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { getSplits, updateSplit, getData } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import { Split } from '../types';
import { formatWhatsAppMessage } from '../utils/shareMessage';
import { makeUPILink } from '../utils/upiLink';

const ResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { splitId } = route.params;
  const [split, setSplit] = useState<Split | null>(null);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [splitId]);

  const loadData = async () => {
    const history = await getSplits();
    const found = history?.find((s: Split) => s.id === splitId);
    if (found) {
      setSplit(found);
    }

    const upi = await getData(StorageKeys.MY_UPI);
    const name = await getData(StorageKeys.MY_NAME);
    setMyProfile({ upiId: upi || '', name: name || 'User' });
  };

  const togglePaid = async (friendId: string) => {
    if (!split) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedFriends = split.friends.map((f) =>
      f.id === friendId ? { ...f, paid: !f.paid } : f
    );
    const updatedSplit = { ...split, friends: updatedFriends };

    setSplit(updatedSplit);
    await updateSplit(split.id, updatedSplit);
  };

  const handleShareWhatsApp = async (friendId?: string) => {
    if (!split || !myProfile.upiId) {
       Alert.alert("Error", "Please set your UPI ID in Settings first");
       return;
    }

    const targetFriend = friendId 
      ? split.friends.find(f => f.id === friendId)
      : split.friends.find(f => !f.paid);

    if (!targetFriend) {
      Alert.alert('All Settled', 'Everyone has already paid!');
      return;
    }

    const message = formatWhatsAppMessage(
      targetFriend.name,
      targetFriend.amount,
      split.name,
      myProfile.upiId,
      myProfile.name
    );

    try {
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    if (!split || !myProfile.upiId) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Generate a generic payment link for the first unpaid person or just a link to the app
    const upiLink = makeUPILink(myProfile.upiId, myProfile.name, split.totalAmount, split.name);
    await Clipboard.setStringAsync(upiLink);
    Alert.alert('Copied!', 'UPI Payment Link copied to clipboard');
  };

  if (!split) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.splitName}>{split.name}</Text>
            <Text style={styles.splitDate}>{split.date}</Text>
          </View>
          <View style={styles.amountBadge}>
            <Text style={styles.totalAmountLabel}>Total</Text>
            <AnimatedAmount amount={split.totalAmount} style={styles.totalAmountValue} />
          </View>
        </View>

        <View style={styles.peopleHeader}>
          <Text style={styles.peopleTitle}>Split between {split.friends.length + 1} people</Text>
          <Text style={styles.perPersonText}>
            ₹{(split.totalAmount / (split.friends.length + 1)).toFixed(2)} each
          </Text>
        </View>

        {split.friends.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendCard}
            onPress={() => togglePaid(friend.id)}
            activeOpacity={0.8}
          >
            <FriendAvatar name={friend.name} color={friend.avatarColor} size={48} />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <AnimatedAmount amount={friend.amount} style={styles.friendAmount} />
            </View>
            <View style={styles.statusRow}>
              <StatusPill status={friend.paid ? 'Paid' : 'Pending'} />
              {!friend.paid && (
                <TouchableOpacity 
                  onPress={() => handleShareWhatsApp(friend.id)}
                  style={styles.miniShare}
                >
                  <MessageCircle color={Colors.hotPink} size={20} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.whatsappButton} onPress={() => handleShareWhatsApp()}>
          <MessageCircle color={Colors.white} size={20} style={{ marginRight: 10 }} />
          <Text style={styles.whatsappButtonText}>Share with Unpaid</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
          <LinkIcon color={Colors.muted} size={18} style={{ marginRight: 8 }} />
          <Text style={styles.copyButtonText}>Copy UPI Payment Link</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniShare: {
    marginLeft: 10,
    padding: 5,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.hotPink,
    shadowColor: Colors.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  whatsappButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  copyButtonText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
});

export default ResultsScreen;
