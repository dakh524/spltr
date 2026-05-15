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
  Platform,
  Image,
} from 'react-native';
import { Bell, Zap, PlusCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
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
import * as financeStorage from '../utils/financeStorage';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [splits, setSplits] = useState<Split[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, amount: 0, pending: 0 });
  const [financeMetrics, setFinanceMetrics] = useState({ earned: 0, spent: 0, saved: 0, savingsPercent: 0, trend: [] as any[] });
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
    const myName = await getData(StorageKeys.MY_NAME);
    const myUPI = await getData(StorageKeys.MY_UPI);

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

    const now = new Date();
    const currentMonthEntries = await financeStorage.getEntriesByMonth(now.getFullYear(), now.getMonth());
    const summ = await financeStorage.getSummary(currentMonthEntries);
    
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEntries = await financeStorage.getEntriesByMonth(d.getFullYear(), d.getMonth());
      const s = await financeStorage.getSummary(mEntries);
      trend.push({ x: 5 - i, y: s.saved });
    }

    setFinanceMetrics({ 
      earned: summ.totalIncome, 
      spent: summ.totalExpense, 
      saved: summ.saved,
      savingsPercent: Math.round(summ.savingsPercent),
      trend 
    });
  };

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
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
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
          activeOpacity={0.9}
        >
          <View style={styles.financeHeader}>
            <View style={styles.financeTitleRow}>
              <DollarSign color={Colors.neonGreen} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.financeTitle}>My Finance</Text>
            </View>
            <Text style={styles.financeMonth}>{format(new Date(), 'MMMM yyyy')}</Text>
          </View>

          <View style={styles.financeGrid}>
            <View style={styles.financeStat}>
              <Text style={styles.statLabel}>Earned</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>₹{financeMetrics.earned.toLocaleString()}</Text>
                <TrendingUp color={Colors.neonGreen} size={14} style={{ marginLeft: 6 }} />
              </View>
            </View>
            <View style={styles.financeStat}>
              <Text style={styles.statLabel}>Spent</Text>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: Colors.hotPink }]}>₹{financeMetrics.spent.toLocaleString()}</Text>
                <TrendingDown color={Colors.hotPink} size={14} style={{ marginLeft: 6 }} />
              </View>
            </View>
          </View>

          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Saved</Text>
            <Text style={styles.savingsValue}>₹{financeMetrics.saved.toLocaleString()} ({financeMetrics.savingsPercent}%)</Text>
          </View>

          <View style={styles.sparklineContainer}>
            {financeMetrics.trend.length > 0 && (
              <VictoryLine
                data={financeMetrics.trend}
                width={width - 80}
                height={40}
                padding={0}
                style={{
                  data: { stroke: Colors.neonGreen, strokeWidth: 2 }
                }}
              />
            )}
          </View>

          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>View Details →</Text>
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
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 10,
    shadowColor: Colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
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
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  financeTitle: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  financeMonth: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  financeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  financeStat: {
    flex: 1,
  },
  statLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
    textTransform: 'uppercase',
  },
  statValue: {
    color: Colors.neonGreen,
    fontSize: 20,
    fontFamily: 'BebasNeue-Regular',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  savingsLabel: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  savingsValue: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  sparklineContainer: {
    marginTop: 15,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsRow: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    color: Colors.neonGreen,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default HomeScreen;
