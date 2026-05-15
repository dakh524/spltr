import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Bell, Zap, PlusCircle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import SplitCard from '../components/SplitCard';
import AdBanner from '../components/AdBanner';
import FriendAvatar from '../components/FriendAvatar';
import { VictoryLine } from 'victory-native';
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
  const [financeMetrics, setFinanceMetrics] = useState({ earned: 0, spent: 0, trend: [] as any[] });
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      checkFirstLaunch();
      loadData();
    }, [])
  );

  const checkFirstLaunch = async () => {
    const name = await getData(StorageKeys.MY_NAME);
    if (!name) {
      Alert.alert(
        'Welcome to SPLITR! ⚡',
        'Before you start, please set your name and UPI ID in Settings.',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Profile') }]
      );
    }
  };

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

    // Load Finance Data for Sparkline
    const txData = await getData(StorageKeys.TRANSACTIONS);
    if (txData) {
      const now = new Date();
      const last6 = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        const monthTx = txData.filter((t: any) => {
          const td = new Date(t.date);
          return td.getMonth() === m && td.getFullYear() === y;
        });
        const income = monthTx.filter((t: any) => t.type === 'income').reduce((acc: number, curr: any) => acc + curr.amount, 0);
        const expense = monthTx.filter((t: any) => t.type === 'expense').reduce((acc: number, curr: any) => acc + curr.amount, 0);
        last6.push({ x: i, y: income - expense });
      }
      const currentMonthTx = txData.filter((t: any) => {
        const td = new Date(t.date);
        return td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear();
      });
      const earned = currentMonthTx.filter((t: any) => t.type === 'income').reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const spent = currentMonthTx.filter((t: any) => t.type === 'expense').reduce((acc: number, curr: any) => acc + curr.amount, 0);
      setFinanceMetrics({ earned, spent, trend: last6 });
    }
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

        <TouchableOpacity 
          style={styles.financeCard} 
          onPress={() => navigation.navigate('Finance')}
        >
          <View style={styles.financeInfo}>
            <Text style={styles.financeLabel}>Finance Summary</Text>
            <Text style={styles.financeValue}>
              ₹{(financeMetrics.earned - financeMetrics.spent).toLocaleString()} 
              <Text style={styles.financeSub}> saved</Text>
            </Text>
          </View>
          <View style={styles.sparkline}>
            <VictoryLine
              data={financeMetrics.trend.length > 0 ? financeMetrics.trend : [{x:0, y:0}, {x:1, y:0}, {x:2, y:0}]}
              width={120}
              height={40}
              padding={0}
              style={{
                data: { stroke: Colors.neonGreen, strokeWidth: 3 }
              }}
              interpolation="natural"
            />
          </View>
        </TouchableOpacity>

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
            <View style={styles.emptyLogoContainer}>
              <Zap color={Colors.neonGreen} size={80} fill={Colors.neonGreen} />
            </View>
            <Text style={styles.emptyTitle}>No splits yet</Text>
            <Text style={styles.emptySubtitle}>Split your first bill in seconds</Text>
            
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('New Split');
              }}
            >
              <PlusCircle color={Colors.background} size={20} style={{ marginRight: 10 }} />
              <Text style={styles.emptyButtonText}>Start your first split →</Text>
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
    backgroundColor: Colors.neonGreen,
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  emptyLogoContainer: {
    padding: 20,
    backgroundColor: '#0f0f1a',
    borderRadius: 40,
    marginBottom: 10,
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
  financeCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  financeInfo: {
    flex: 1,
  },
  financeLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    marginBottom: 4,
  },
  financeValue: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  financeSub: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  sparkline: {
    width: 120,
    height: 40,
    justifyContent: 'center',
  },
});

export default HomeScreen;
