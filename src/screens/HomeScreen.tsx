import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Bell, Zap, PlusCircle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import SplitCard from '../components/SplitCard';
import AdBanner from '../components/AdBanner';
import FriendAvatar from '../components/FriendAvatar';
import { Split } from '../types';
import { getSplits, getData } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [splits, setSplits] = useState<Split[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, amount: 0, pending: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getSplits();
    const savedFriends = await getData(StorageKeys.FRIENDS);
    
    setSplits(data);
    if (savedFriends) setFriends(savedFriends);

    let totalAmount = 0;
    let pendingAmount = 0;
    let pCount = 0;

    data.forEach(split => {
      totalAmount += split.totalAmount;
      const unpaid = split.friends.filter(f => !f.paid);
      if (unpaid.length > 0) {
        pCount++;
        unpaid.forEach(f => {
          pendingAmount += f.amount;
        });
      }
    });

    setMetrics({
      total: data.length,
      amount: totalAmount,
      pending: pendingAmount
    });
    setPendingCount(pCount);
  };

  // BUG 2 Fix: onRefresh now calls loadData
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const MetricCard = ({ label, value }: any) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Zap color={Colors.neonGreen} size={28} fill={Colors.neonGreen} />
          <Text style={styles.logoText}>SPLITR</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell color={Colors.white} size={24} />
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.neonGreen} 
          />
        }
      >
        <View style={styles.metricsRow}>
          <MetricCard label="Total Splits" value={metrics.total} />
          {/* BUG 3 Fix: Clean formatting with toLocaleString */}
          <MetricCard 
            label="Total Amount" 
            value={`₹${metrics.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          />
          <MetricCard 
            label="Pending" 
            value={`₹${metrics.pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          />
        </View>

        {friends.length > 0 && (
          <View style={styles.friendsSection}>
            <Text style={styles.subLabel}>Quick Split</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsScroll}>
              {friends.map((friend) => (
                <TouchableOpacity 
                  key={friend.id} 
                  style={styles.friendItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('New Split');
                  }}
                >
                  <FriendAvatar name={friend.name} color={friend.avatarColor} size={50} />
                  <Text style={styles.friendName} numberOfLines={1}>{friend.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionLabel}>Recent Splits</Text>

        {splits.length === 0 ? (
          <View style={styles.emptyState}>
            <Zap color={Colors.neonGreen} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No splits yet</Text>
            <Text style={styles.emptySubtitle}>Split your first bill in seconds</Text>
            
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('New Split');
              }}
            >
              <PlusCircle color={Colors.neonGreen} size={20} style={{ marginRight: 10 }} />
              <Text style={styles.emptyButtonText}>Start New Split</Text>
            </TouchableOpacity>
          </View>
        ) : (
          splits.slice(0, 10).map((split) => (
            <SplitCard
              key={split.id}
              split={split}
              onPress={() => navigation.navigate('Results', { splitId: split.id })}
            />
          ))
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bannerContainer}>
        <AdBanner />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: Colors.neonGreen,
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  iconButton: {
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.hotPink,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricValue: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
  },
  metricLabel: {
    color: Colors.muted,
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 4,
    textAlign: 'center',
  },
  friendsSection: {
    marginBottom: 24,
  },
  subLabel: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  friendsScroll: {
    flexDirection: 'row',
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  friendName: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 6,
  },
  sectionLabel: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 20,
  },
  emptySubtitle: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 8,
    marginBottom: 30,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.neonGreen,
    backgroundColor: Colors.background,
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyButtonText: {
    color: Colors.neonGreen,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default HomeScreen;
