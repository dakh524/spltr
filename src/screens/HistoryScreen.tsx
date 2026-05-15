import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Filter, DollarSign, Users, TrendingUp, TrendingDown, Clock } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import ProgressBar from '../components/ProgressBar';
import AdBanner from '../components/AdBanner';
import { Split, FinanceEntry } from '../types';
import { getSplits } from '../utils/storage';
import * as financeStorage from '../utils/financeStorage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';

type UnifiedEntry = 
  | { type: 'split'; data: Split }
  | { type: 'finance'; data: FinanceEntry };

const HistoryScreen = () => {
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<UnifiedEntry[]>([]);
  const [filter, setFilter] = useState<'All' | 'Settled' | 'Pending' | 'Finance'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      loadAllHistory();
    }, [])
  );

  const loadAllHistory = async () => {
    const splitsData = await getSplits();
    const financeData = await financeStorage.getAllEntries();

    const unified: UnifiedEntry[] = [
      ...splitsData.map(s => ({ type: 'split' as const, data: s })),
      ...financeData.map(f => ({ type: 'finance' as const, data: f }))
    ];

    // Sort by date descending
    unified.sort((a, b) => {
      const dateA = a.type === 'split' ? parseISO(a.data.date) : parseISO(a.data.date);
      const dateB = b.type === 'split' ? parseISO(b.data.date) : parseISO(b.data.date);
      return dateB.getTime() - dateA.getTime();
    });

    setEntries(unified);
    applyFilter(unified, filter);
  };

  const applyFilter = (data: UnifiedEntry[], currentFilter: string) => {
    if (currentFilter === 'All') {
      setFilteredEntries(data);
    } else if (currentFilter === 'Settled') {
      setFilteredEntries(data.filter(e => 
        e.type === 'split' && e.data.friends.every(f => f.paid)
      ));
    } else if (currentFilter === 'Pending') {
      setFilteredEntries(data.filter(e => 
        e.type === 'split' && e.data.friends.some(f => !f.paid)
      ));
    } else if (currentFilter === 'Finance') {
      setFilteredEntries(data.filter(e => e.type === 'finance'));
    }
  };

  useEffect(() => {
    applyFilter(entries, filter);
  }, [filter, entries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllHistory().then(() => setRefreshing(false));
  }, []);

  const handleFilterPress = (f: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(f);
  };

  const renderEntry = (entry: UnifiedEntry) => {
    if (entry.type === 'split') {
      const split = entry.data;
      const paidCount = split.friends.filter((f) => f.paid).length;
      const progress = paidCount / split.friends.length;
      const progressColor = progress === 1 ? Colors.neonGreen : progress > 0 ? Colors.amber : Colors.hotPink;

      return (
        <TouchableOpacity
          key={split.id}
          style={styles.card}
          onPress={() => navigation.navigate('Results', { splitId: split.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconContainer}>
              <Users color={Colors.blue} size={20} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{split.name}</Text>
              <Text style={styles.date}>{format(parseISO(split.date), 'dd MMM yyyy, HH:mm')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amount}>₹{split.totalAmount.toLocaleString()}</Text>
              <Text style={[styles.status, { color: progressColor }]}>
                {progress === 1 ? 'Settled' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <ProgressBar progress={progress} color={progressColor} />
            <Text style={styles.progressText}>{paidCount} of {split.friends.length} paid</Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      const finance = entry.data;
      const isIncome = finance.type === 'income';
      
      return (
        <TouchableOpacity
          key={finance.id}
          style={styles.card}
          onPress={() => navigation.navigate('Finance')}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconContainer, { backgroundColor: isIncome ? Colors.neonGreen + '20' : Colors.hotPink + '20' }]}>
              {isIncome ? <TrendingUp color={Colors.neonGreen} size={20} /> : <TrendingDown color={Colors.hotPink} size={20} />}
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{finance.note || finance.category}</Text>
              <Text style={styles.date}>{format(parseISO(finance.date), 'dd MMM yyyy, HH:mm')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amount, { color: isIncome ? Colors.neonGreen : Colors.hotPink }]}>
                {isIncome ? '+' : '-'}₹{finance.amount.toLocaleString()}
              </Text>
              <Text style={styles.tag}>{finance.category}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['All', 'Settled', 'Pending', 'Finance'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            onPress={() => handleFilterPress(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.activeFilterTabText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neonGreen} />}
      >
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock color={Colors.muted} size={48} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No activity found</Text>
          </View>
        ) : (
          filteredEntries.map(renderEntry)
        )}
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080810' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: Colors.white, fontSize: 22, fontFamily: 'SpaceGrotesk-Bold' },
  filterBtn: { padding: 10, backgroundColor: '#0f0f1a', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a2e' },
  filterRow: { maxHeight: 60, paddingHorizontal: 20, marginBottom: 10 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, height: 40, justifyContent: 'center' },
  activeFilterTab: { backgroundColor: Colors.neonGreen, borderWidth: 0 },
  filterTabText: { color: Colors.muted, fontFamily: 'SpaceGrotesk-Bold', fontSize: 13 },
  activeFilterTabText: { color: '#080810' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#0f0f1a', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a2e' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { color: Colors.white, fontSize: 16, fontFamily: 'SpaceGrotesk-Bold' },
  date: { color: Colors.muted, fontSize: 11, fontFamily: 'SpaceGrotesk-Regular', marginTop: 2 },
  amount: { color: Colors.white, fontSize: 18, fontFamily: 'BebasNeue-Regular' },
  status: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', marginTop: 2 },
  tag: { color: Colors.muted, fontSize: 11, fontFamily: 'SpaceGrotesk-Medium', marginTop: 2 },
  progressSection: { marginTop: 16 },
  progressText: { color: Colors.muted, fontSize: 10, fontFamily: 'SpaceGrotesk-Medium', marginTop: 8, textAlign: 'right' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: '#555', fontFamily: 'SpaceGrotesk-Bold', fontSize: 16 },
});

export default HistoryScreen;
