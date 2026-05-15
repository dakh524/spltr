import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import CategoryIcon from './CategoryIcon';
import StatusPill from './StatusPill';
import FriendAvatar from './FriendAvatar';
import { Split } from '../types';
import * as Haptics from 'expo-haptics';

interface SplitCardProps {
  split: Split;
  onPress: () => void;
}

const SplitCard: React.FC<SplitCardProps> = ({ split, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const paidCount = split.friends.filter((f) => f.paid).length;
  const isSettled = paidCount === split.friends.length;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.header}>
        <CategoryIcon category={split.category} size={48} />
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{split.name}</Text>
          <Text style={styles.date}>{split.date}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: isSettled ? Colors.neonGreen : Colors.hotPink }]}>
            ₹{split.totalAmount.toLocaleString()}
          </Text>
          <StatusPill status={isSettled ? 'Settled' : 'Pending'} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.avatarsContainer}>
          {split.friends.slice(0, 4).map((friend, index) => (
            <View key={friend.id} style={[styles.avatarWrapper, { marginLeft: index === 0 ? 0 : -15 }]}>
              <FriendAvatar name={friend.name} color={friend.avatarColor} size={30} />
            </View>
          ))}
          {split.friends.length > 4 && (
            <View style={[styles.avatarWrapper, styles.moreAvatar]}>
              <Text style={styles.moreText}>+{split.friends.length - 4}</Text>
            </View>
          )}
        </View>
        <Text style={styles.friendsText}>
          {paidCount} of {split.friends.length} paid
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  date: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontFamily: 'BebasNeue-Regular',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: Colors.card,
    borderRadius: 15,
  },
  moreAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -15,
  },
  moreText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  friendsText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
  },
});

export default SplitCard;
