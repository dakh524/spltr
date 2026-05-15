import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActionSheetIOS,
  Image,
} from 'react-native';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus,
  Calendar,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react-native';
import { 
  VictoryChart, 
  VictoryBar, 
  VictoryGroup, 
  VictoryAxis, 
  VictoryPie, 
  VictoryLine, 
  VictoryArea,
  VictoryTheme,
  VictoryContainer
} from 'victory-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { Colors } from '../constants/Colors';
import { FinanceEntry } from '../types';
import * as financeStorage from '../utils/financeStorage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔', Travel: '✈️', Home: '🏠',
  Entertainment: '🎬', Shopping: '🛍️',
  Health: '💊', Education: '📚', Other: '📦',
  Salary: '💼', Freelance: '💻',
  Business: '🏢', Investment: '📈',
  Gift: '🎁',
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ffb800',
  Travel: '#00d4ff',
  Home: '#ff2d78',
  Entertainment: '#7c3aed',
  Shopping: '#39ff14',
  Health: '#ff6b35',
  Education: '#00d4ff',
  Other: '#888',
};

type Period = 'day' | 'week' | 'month' | 'year';

const FinanceScreen = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);

  const loadData = useCallback(async () => {
    let currentEntries: FinanceEntry[] = [];
    let prevEntries: FinanceEntry[] = [];

    if (period === 'day') {
      currentEntries = await financeStorage.getEntriesByDay(currentDate);
      prevEntries = await financeStorage.getEntriesByDay(subDays(currentDate, 1));
    } else if (period === 'week') {
      currentEntries = await financeStorage.getEntriesByWeek(currentDate);
      prevEntries = await financeStorage.getEntriesByWeek(subWeeks(currentDate, 1));
    } else if (period === 'month') {
      currentEntries = await financeStorage.getEntriesByMonth(currentDate.getFullYear(), currentDate.getMonth());
      prevEntries = await financeStorage.getEntriesByMonth(
        currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear(),
        currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1
      );
    } else {
      currentEntries = await financeStorage.getEntriesByYear(currentDate.getFullYear());
      prevEntries = await financeStorage.getEntriesByYear(currentDate.getFullYear() - 1);
    }

    setEntries(currentEntries);
    const summ = await financeStorage.getSummary(currentEntries);
    setSummary(summ);
    const comp = await financeStorage.getComparison(currentEntries, prevEntries);
    setComparison(comp);
  }, [period, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodChange = (p: Period) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPeriod(p);
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let newDate = new Date(currentDate);
    if (period === 'day') newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    else if (period === 'week') newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
    else if (period === 'month') newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
    else newDate = direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1);
    setCurrentDate(newDate);
  };

  const getPeriodLabel = () => {
    if (period === 'day') return format(currentDate, 'd MMM yyyy');
    if (period === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
    }
    if (period === 'month') return format(currentDate, 'MMMM yyyy');
    return format(currentDate, 'yyyy');
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setCurrentDate(selectedDate);
  };

  const handleAddPress = (type: 'income' | 'expense') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalType(type);
    setEditingEntry(null);
    setAmount('');
    setCategory('Other');
    setNote('');
    setEntryDate(new Date());
    setModalVisible(true);
  };

  const handleEditPress = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setModalType(entry.type);
    setAmount(entry.amount.toString());
    setCategory(entry.category);
    setNote(entry.note);
    setEntryDate(parseISO(entry.date));
    setModalVisible(true);
  };

  const handleDeletePress = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await financeStorage.deleteEntry(id);
            loadData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } 
        }
      ]
    );
  };

  const handleLongPress = (entry: FinanceEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', '✏️ Edit Entry', '🗑️ Delete Entry'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEditPress(entry);
          else if (buttonIndex === 2) handleDeletePress(entry.id);
        }
      );
    } else {
      Alert.alert(
        'Options',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => handleEditPress(entry) },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeletePress(entry.id) },
        ]
      );
    }
  };

  const handleSaveEntry = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const entry: FinanceEntry = {
      id: editingEntry?.id || Date.now().toString(),
      type: modalType,
      amount: parseFloat(amount),
      category,
      note,
      date: entryDate.toISOString(),
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      editedAt: editingEntry ? new Date().toISOString() : undefined,
    };

    if (editingEntry) {
      await financeStorage.editEntry(entry.id, entry);
    } else {
      await financeStorage.addEntry(entry);
    }

    setModalVisible(false);
    loadData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];
  const expenseCategories = ['Food', 'Travel', 'Home', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
  const currentCategories = modalType === 'income' ? incomeCategories : expenseCategories;

  // Chart Data Preparation
  const getOverviewData = () => {
    let data: any[] = [];
    if (period === 'day') {
      const hours = [6, 9, 12, 15, 18, 21];
      data = hours.map(h => {
        const hEntries = entries.filter(e => new Date(e.date).getHours() === h);
        return {
          label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`,
          income: hEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
          expense: hEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
        };
      });
    } else if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = days.map((d, i) => {
        const dEntries = entries.filter(e => {
          const day = new Date(e.date).getDay();
          return day === (i === 6 ? 0 : i + 1);
        });
        return {
          label: d,
          income: dEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
          expense: dEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
        };
      });
    } else if (period === 'month') {
      const weeks = ['W1', 'W2', 'W3', 'W4'];
      data = weeks.map((w, i) => {
        const wEntries = entries.filter(e => {
          const date = new Date(e.date).getDate();
          return date >= i * 7 + 1 && date <= (i + 1) * 7;
        });
        return {
          label: w,
          income: wEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
          expense: wEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
        };
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = months.map((m, i) => {
        const mEntries = entries.filter(e => new Date(e.date).getMonth() === i);
        return {
          label: m,
          income: mEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
          expense: mEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
        };
      });
    }
    return data;
  };

  const overviewData = getOverviewData();
  const filteredEntries = entries.filter(e => {
    if (filter === 'All') return true;
    return e.type.toLowerCase() === filter.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Finance</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddPress('expense')}>
          <Plus color={Colors.background} size={16} style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
            <TouchableOpacity 
              key={p} 
              style={[styles.periodPill, period === p && styles.activePeriodPill]}
              onPress={() => handlePeriodChange(p)}
            >
              <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigator */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity onPress={() => navigatePeriod('prev')}>
            <ChevronLeft color={Colors.muted} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateLabel}>{getPeriodLabel()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigatePeriod('next')}>
            <ChevronRight color={Colors.muted} size={24} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            onChange={onDateChange}
          />
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>INCOME</Text>
            <Text style={styles.summaryAmount}>₹{summary?.totalIncome.toLocaleString() || '0'}</Text>
            {comparison && (
              <View style={styles.changeRow}>
                {comparison.incomeChange >= 0 ? (
                  <TrendingUp size={14} color={Colors.neonGreen} />
                ) : (
                  <TrendingDown size={14} color={Colors.hotPink} />
                )}
                <Text style={[styles.changeText, { color: comparison.incomeChange >= 0 ? Colors.neonGreen : Colors.hotPink }]}>
                  {Math.abs(Math.round(comparison.incomeChange))}% {comparison.incomeChange >= 0 ? '↑' : '↓'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>EXPENSES</Text>
            <Text style={styles.summaryAmount}>₹{summary?.totalExpense.toLocaleString() || '0'}</Text>
            {comparison && (
              <View style={styles.changeRow}>
                {comparison.expenseChange <= 0 ? (
                  <TrendingDown size={14} color={Colors.neonGreen} />
                ) : (
                  <TrendingUp size={14} color={Colors.hotPink} />
                )}
                <Text style={[styles.changeText, { color: comparison.expenseChange <= 0 ? Colors.neonGreen : Colors.hotPink }]}>
                  {Math.abs(Math.round(comparison.expenseChange))}% {comparison.expenseChange > 0 ? '↑' : '↓'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Savings Bar */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <Text style={styles.savingsLabel}>Saved ₹{summary?.saved.toLocaleString() || '0'}</Text>
            <Text style={styles.savingsPercent}>{Math.round(summary?.savingsPercent || 0)}% of income</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, summary?.savingsPercent || 0))}%` }]} />
          </View>
        </View>

        {/* Bar Chart Overview */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Overview</Text>
          <VictoryChart
            theme={VictoryTheme.grayscale}
            domainPadding={{ x: 20 }}
            height={220}
            width={width - 40}
            padding={{ top: 20, bottom: 40, left: 45, right: 20 }}
            containerComponent={<VictoryContainer disableContainerEvents />}
          >
            <VictoryAxis
              style={{
                axis: { stroke: '#555' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
                grid: { stroke: 'transparent' }
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(x: number) => `₹${x >= 1000 ? (x / 1000) + 'k' : x}`}
              style={{
                axis: { stroke: '#555' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
                grid: { stroke: '#1a1a2e' }
              }}
            />
            <VictoryGroup offset={8}>
              <VictoryBar
                data={overviewData.map(d => ({ x: d.label, y: d.income }))}
                style={{ data: { fill: Colors.neonGreen, width: 8 } }}
                cornerRadius={{ top: 4 }}
              />
              <VictoryBar
                data={overviewData.map(d => ({ x: d.label, y: d.expense }))}
                style={{ data: { fill: Colors.hotPink, width: 8 } }}
                cornerRadius={{ top: 4 }}
              />
            </VictoryGroup>
          </VictoryChart>
        </View>

        {/* Donut Chart breakdown */}
        {summary?.byCategory.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Where did it go?</Text>
            <View style={{ alignItems: 'center' }}>
              <VictoryPie
                data={summary.byCategory.map((c: any) => ({ x: c.category, y: c.amount }))}
                colorScale={summary.byCategory.map((c: any) => c.color)}
                innerRadius={60}
                width={width - 40}
                height={200}
                padding={20}
                labels={() => null}
              />
            </View>
            <View style={styles.legendContainer}>
              {summary.byCategory.map((c: any, i: number) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendLabel}>{c.category}</Text>
                  <Text style={styles.legendValue}>₹{c.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Income Trend Line Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Income Trend</Text>
          <VictoryChart
            height={180}
            width={width - 40}
            padding={{ top: 10, bottom: 30, left: 45, right: 20 }}
            containerComponent={<VictoryContainer disableContainerEvents />}
          >
            <VictoryAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
                grid: { stroke: '#1a1a2e' }
              }}
            />
            <VictoryArea
              data={overviewData.map(d => ({ x: d.label, y: d.income }))}
              style={{
                data: { fill: 'rgba(57,255,20,0.1)', stroke: Colors.neonGreen, strokeWidth: 3 }
              }}
              interpolation="natural"
            />
          </VictoryChart>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionHeader}>
          <Text style={styles.chartTitle}>Transactions</Text>
          <View style={styles.filterPills}>
            {(['All', 'Income', 'Expense'] as const).map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.filterPill, filter === f && styles.activeFilterPill]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterPillText, filter === f && styles.activeFilterPillText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions for this period</Text>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <TouchableOpacity 
              key={entry.id} 
              style={styles.transactionRow}
              onLongPress={() => handleLongPress(entry)}
              activeOpacity={0.7}
            >
              <View style={styles.entryMain}>
                <View style={styles.entryIconContainer}>
                  <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[entry.category] || '📦'}</Text>
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryNote}>{entry.note || entry.category}</Text>
                  <Text style={styles.entrySubText}>{entry.category} • {format(parseISO(entry.date), 'dd MMM yyyy')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.entryAmount, { color: entry.type === 'income' ? Colors.neonGreen : Colors.hotPink }]}>
                    {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: Colors.neonGreen }]} onPress={() => handleAddPress('income')}>
          <Plus color={Colors.background} size={18} style={{ marginRight: 6 }} />
          <Text style={styles.fabText}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: Colors.hotPink, marginTop: 12 }]} onPress={() => handleAddPress('expense')}>
          <Minus color={Colors.white} size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.fabText, { color: Colors.white }]}>Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEntry ? 'Edit Entry' : `Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeToggle}>
              <TouchableOpacity 
                style={[styles.typeBtn, modalType === 'income' && { backgroundColor: Colors.neonGreen }]}
                onPress={() => setModalType('income')}
              >
                <Text style={[styles.typeBtnText, modalType === 'income' && { color: Colors.background }]}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, modalType === 'expense' && { backgroundColor: Colors.hotPink }]}
                onPress={() => setModalType('expense')}
              >
                <Text style={[styles.typeBtnText, modalType === 'expense' && { color: Colors.white }]}>Expense</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={Colors.muted}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {currentCategories.map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[
                    styles.categoryPill, 
                    category === cat && { backgroundColor: modalType === 'income' ? Colors.neonGreen : Colors.hotPink }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, category === cat && { color: modalType === 'income' ? Colors.background : Colors.white }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Note</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={Colors.muted}
            />

            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEntryDatePicker(true)}>
              <Calendar color={Colors.muted} size={18} style={{ marginRight: 8 }} />
              <Text style={styles.dateSelectorText}>{format(entryDate, 'dd MMMM yyyy')}</Text>
            </TouchableOpacity>

            {showEntryDatePicker && (
              <DateTimePicker
                value={entryDate}
                mode="date"
                onChange={(e, d) => { setShowEntryDatePicker(false); if (d) setEntryDate(d); }}
              />
            )}

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: modalType === 'income' ? Colors.neonGreen : Colors.hotPink }]}
              onPress={handleSaveEntry}
            >
              <Text style={[styles.saveBtnText, { color: modalType === 'income' ? Colors.background : Colors.white }]}>
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </Text>
            </TouchableOpacity>

            {editingEntry?.editedAt && (
              <Text style={styles.lastEditedText}>Last edited: {format(parseISO(editingEntry.editedAt), 'dd MMM, HH:mm')}</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080810' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 28, height: 28, marginRight: 10 },
  headerTitle: { color: Colors.white, fontSize: 24, fontFamily: 'SpaceGrotesk-Bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neonGreen, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: Colors.background, fontSize: 14, fontFamily: 'SpaceGrotesk-Bold' },
  content: { paddingHorizontal: 20 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  periodPill: { flex: 1, backgroundColor: '#0f0f1a', borderRadius: 99, paddingVertical: 8, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#1a1a2e' },
  activePeriodPill: { backgroundColor: Colors.neonGreen, borderColor: Colors.neonGreen },
  periodText: { color: '#555', fontFamily: 'SpaceGrotesk-Medium', fontSize: 13 },
  activePeriodText: { color: '#080810' },
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  dateLabel: { color: Colors.white, fontSize: 16, fontFamily: 'SpaceGrotesk-Bold' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#0f0f1a', padding: 16, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#1a1a2e' },
  summaryLabel: { color: Colors.muted, fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', marginBottom: 6 },
  summaryAmount: { color: Colors.white, fontSize: 22, fontFamily: 'BebasNeue-Regular' },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  changeText: { fontSize: 12, fontFamily: 'SpaceGrotesk-Bold', marginLeft: 4 },
  savingsCard: { backgroundColor: '#0f0f1a', padding: 16, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#1a1a2e' },
  savingsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  savingsLabel: { color: Colors.white, fontSize: 14, fontFamily: 'SpaceGrotesk-Bold' },
  savingsPercent: { color: Colors.muted, fontSize: 13, fontFamily: 'SpaceGrotesk-Medium' },
  progressTrack: { height: 10, backgroundColor: '#1a1a2e', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.neonGreen, borderRadius: 5 },
  chartSection: { backgroundColor: '#0f0f1a', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1a1a2e' },
  chartTitle: { color: Colors.white, fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', marginBottom: 10 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendLabel: { color: Colors.muted, fontSize: 12, fontFamily: 'SpaceGrotesk-Medium', flex: 1 },
  legendValue: { color: Colors.white, fontSize: 12, fontFamily: 'SpaceGrotesk-Bold', marginRight: 10 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 16 },
  filterPills: { flexDirection: 'row' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 8, backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#1a1a2e' },
  activeFilterPill: { backgroundColor: Colors.neonGreen + '20', borderColor: Colors.neonGreen },
  filterPillText: { color: Colors.muted, fontSize: 11, fontFamily: 'SpaceGrotesk-Bold' },
  activeFilterPillText: { color: Colors.neonGreen },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#555', fontSize: 15, fontFamily: 'SpaceGrotesk-Medium' },
  transactionRow: { backgroundColor: '#0f0f1a', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#1a1a2e' },
  entryMain: { flexDirection: 'row', alignItems: 'center' },
  entryIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  entryInfo: { flex: 1 },
  entryNote: { color: Colors.white, fontSize: 15, fontFamily: 'SpaceGrotesk-Bold' },
  entrySubText: { color: Colors.muted, fontSize: 12, fontFamily: 'SpaceGrotesk-Regular', marginTop: 2 },
  entryAmount: { fontSize: 18, fontFamily: 'BebasNeue-Regular' },
  fabContainer: { position: 'absolute', bottom: 30, right: 20, alignItems: 'flex-end' },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 99, elevation: 5 },
  fabText: { color: '#080810', fontSize: 14, fontFamily: 'SpaceGrotesk-Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f0f1a', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 50 : 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: Colors.white, fontSize: 22, fontFamily: 'SpaceGrotesk-Bold' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#080810', borderRadius: 14, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  typeBtnText: { color: Colors.muted, fontSize: 15, fontFamily: 'SpaceGrotesk-Bold' },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  amountPrefix: { color: '#555', fontSize: 32, fontFamily: 'BebasNeue-Regular', marginTop: 10 },
  amountInput: { color: Colors.white, fontSize: 48, fontFamily: 'BebasNeue-Regular', textAlign: 'center', minWidth: 100 },
  modalLabel: { color: Colors.muted, fontSize: 12, fontFamily: 'SpaceGrotesk-Bold', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  categoryScroll: { marginBottom: 24, width: '100%' },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#080810', marginRight: 10, borderWidth: 1, borderColor: '#1a1a2e' },
  categoryPillText: { color: Colors.muted, fontSize: 14, fontFamily: 'SpaceGrotesk-Bold' },
  noteInput: { backgroundColor: '#080810', color: Colors.white, borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'SpaceGrotesk-Medium', marginBottom: 24 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080810', borderRadius: 12, padding: 16, marginBottom: 30 },
  dateSelectorText: { color: Colors.white, fontSize: 16, fontFamily: 'SpaceGrotesk-Medium' },
  saveBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold' },
  lastEditedText: { color: '#555', fontSize: 12, fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center', marginTop: 12 },
});

export default FinanceScreen;
