import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import {
  CollectedFinancialData,
  filterCollectionsForUser,
  getCollectedFinancialData,
} from '../../services/data_collection';
import { getUserData } from '../../services/storage';

function formatFcfa(value?: number | string | null): string {
  const amount = Number(value || 0);
  if (!amount) return '0';
  return Math.round(amount).toLocaleString();
}

function formatDate(value?: string): string {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleString();
}

function getTransactionAmount(transaction: any): number {
  return Number(transaction.amount ?? transaction.value ?? transaction.transaction_amount ?? 0);
}

function getTransactionType(transaction: any): string {
  return String(transaction.type ?? transaction.transaction_type ?? transaction.direction ?? 'transaction');
}

function getTransactionDate(transaction: any): string | undefined {
  return transaction.date ?? transaction.transaction_date ?? transaction.timestamp ?? transaction.created_at;
}

function getCounterparty(transaction: any): string {
  return transaction.counterparty_name
    ?? transaction.counterparty
    ?? transaction.sender
    ?? transaction.receiver
    ?? transaction.phone
    ?? 'Mobile Money transaction';
}

export const MobileMoneyTransactionsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [collections, setCollections] = React.useState<CollectedFinancialData[]>([]);

  const loadTransactions = React.useCallback(async () => {
    setLoading(true);
    const [user, allCollections] = await Promise.all([
      getUserData(),
      getCollectedFinancialData(),
    ]);
    setCollections(filterCollectionsForUser(allCollections, user));
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const latestCollection = collections[0];
  const latestSummary = latestCollection?.data?.summary;
  const transactions = collections.flatMap((collection) =>
    (collection.data?.transactions || []).map((transaction, index) => ({
      transaction,
      collection,
      index,
    }))
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['#061E14', '#0D4A35']} style={[styles.header, { paddingTop: insets.top + rs(12) }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(20)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uploaded Transactions</Text>
          <TouchableOpacity onPress={loadTransactions}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Only transactions synced for your logged-in phone number appear here.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#0D4A35" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={rs(30)} color="#0D4A35" />
            </View>
            <Text style={styles.emptyTitle}>No uploaded transactions yet</Text>
            <Text style={styles.emptyText}>Sync MTN or Orange, approve the ntfy request, then refresh this page.</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{transactions.length}</Text>
                <Text style={styles.summaryLabel}>Transactions</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{formatFcfa(latestSummary?.total_received)}</Text>
                <Text style={styles.summaryLabel}>Received</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{latestCollection?.data?.provider || '--'}</Text>
                <Text style={styles.summaryLabel}>Provider</Text>
              </View>
            </View>

            <View style={styles.listCard}>
              {transactions.map(({ transaction, collection, index }, rowIndex) => {
                const type = getTransactionType(transaction);
                const amount = getTransactionAmount(transaction);
                const isIncoming = /receive|received|in|credit/i.test(type);
                const color = isIncoming ? '#059669' : '#DC2626';

                return (
                  <View
                    key={`${collection.request_id}-${index}-${rowIndex}`}
                    style={[styles.transactionRow, rowIndex < transactions.length - 1 && styles.transactionDivider]}
                  >
                    <View style={[styles.transactionIcon, { backgroundColor: `${color}18` }]}>
                      <Ionicons name={isIncoming ? 'arrow-down-outline' : 'arrow-up-outline'} size={rs(18)} color={color} />
                    </View>
                    <View style={styles.transactionBody}>
                      <Text style={styles.transactionTitle}>{getCounterparty(transaction)}</Text>
                      <Text style={styles.transactionMeta}>
                        {collection.data?.provider || 'Mobile Money'} • {formatDate(getTransactionDate(transaction) || collection.timestamp)}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color }]}>
                      {isIncoming ? '+' : '-'}{formatFcfa(amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(18), paddingBottom: rs(20) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  refreshText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#A7F3D0' },
  headerSub: { marginTop: rs(12), fontSize: FontSize.sm, color: 'rgba(255,255,255,0.72)', lineHeight: ms(14) * 1.45 },
  content: { padding: rs(16), paddingBottom: vs(80), gap: rs(14) },
  loadingBox: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(22), alignItems: 'center', gap: rs(10) },
  loadingText: { fontSize: FontSize.sm, color: '#6B7280' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(22), alignItems: 'center', gap: rs(10) },
  emptyIcon: { width: rs(58), height: rs(58), borderRadius: rs(20), backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  emptyText: { fontSize: FontSize.sm, color: '#6B7280', textAlign: 'center', lineHeight: ms(14) * 1.45 },
  summaryCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(12), gap: rs(8) },
  summaryStat: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: Radius.md, padding: rs(10) },
  summaryValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: '#0D4A35' },
  summaryLabel: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(14) },
  transactionDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  transactionIcon: { width: rs(40), height: rs(40), borderRadius: rs(20), alignItems: 'center', justifyContent: 'center' },
  transactionBody: { flex: 1 },
  transactionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#111827' },
  transactionMeta: { fontSize: FontSize.xs, color: '#9CA3AF', marginTop: rs(2) },
  transactionAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
