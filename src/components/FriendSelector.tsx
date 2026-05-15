import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Colors, AvatarColors } from '../constants/Colors';
import FriendAvatar from './FriendAvatar';
import * as Haptics from 'expo-haptics';

interface Friend {
  id: string;
  name: string;
  avatarColor: string;
}

interface FriendSelectorProps {
  friends: Friend[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAddMore: () => void;
}

const FriendSelector: React.FC<FriendSelectorProps> = ({ friends, selectedIds, onToggle, onAddMore }) => {
  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(id);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {friends.map((friend) => {
        const isSelected = selectedIds.includes(friend.id);
        return (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendItem}
            onPress={() => handleToggle(friend.id)}
            activeOpacity={0.8}
          >
            <FriendAvatar
              name={friend.name}
              color={friend.avatarColor}
              size={60}
              isSelected={isSelected}
            />
            <Text style={[styles.name, { color: isSelected ? Colors.white : Colors.muted }]}>
              {friend.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        );
      })}
      
      <TouchableOpacity style={styles.friendItem} onPress={onAddMore} activeOpacity={0.8}>
        <View style={styles.addCircle}>
          <Plus color={Colors.white} size={24} />
        </View>
        <Text style={styles.name}>Add More</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  friendItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 70,
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    textAlign: 'center',
  },
  addCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FriendSelector;
