import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { MedButton } from "../../components/medconnect/MedButton";
import { MedCard } from "../../components/medconnect/MedCard";
import { MedText } from "../../components/medconnect/MedText";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { AppDispatch, RootState } from "../../store";
import {
  addPayoutMethod,
  deletePayoutMethod,
  fetchPayoutMethods,
  fetchWallet,
  requestWithdrawal,
  setPrimaryMethod,
} from "../../store/slices/walletSlice";

const PROVIDERS = ["CBE", "Commercial Bank of Ethiopia", "Awash Bank", "Dashen Bank", "Telebirr", "M-Pesa", "Other"];
const METHOD_TYPES = [
  { value: "BANK", label: "Bank Account" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
];

export default function DoctorWalletScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { wallet, methods, loading, methodsLoading, withdrawLoading, error } = useSelector(
    (state: RootState) => state.wallet,
  );

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchWallet());
    dispatch(fetchPayoutMethods());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const primaryMethod = useMemo(() => methods.find((m) => m.isPrimary) || null, [methods]);

  const formatAmount = (n: number) => `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ETB`;

  const handleSetPrimary = (id: number) => {
    dispatch(setPrimaryMethod(id));
  };

  const handleDelete = (m: any) => {
    Alert.alert("Delete Payout Method", `Delete ${m.provider} ${m.accountNumber}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => dispatch(deletePayoutMethod(m.id)),
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        <View style={styles.header}>
          <MedText variant="metadata">{t("myWallet")}</MedText>
          <MedText variant="h1">{t("wallet")}</MedText>
        </View>

        {/* Balance card */}
        <MedCard style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <MedText variant="metadata" style={{ color: "#FFFFFF", opacity: 0.85 }}>
              {t("availableBalance")}
            </MedText>
            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
          </View>
          <MedText variant="h1" style={styles.balanceValue}>
            {wallet ? formatAmount(wallet.balance) : "0 ETB"}
          </MedText>
          <View style={styles.balanceActions}>
            <Pressable
              style={styles.balanceAction}
              onPress={() => setShowWithdraw(true)}
            >
              <Ionicons name="arrow-down-circle-outline" size={16} color="#FFFFFF" />
              <MedText style={styles.balanceActionText}>{t("withdraw")}</MedText>
            </Pressable>
            <Pressable
              style={styles.balanceAction}
              onPress={() => setShowAddMethod(true)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
              <MedText style={styles.balanceActionText}>{t("payoutSetup")}</MedText>
            </Pressable>
          </View>
        </MedCard>

        {/* Payout methods */}
        <View style={styles.sectionHeader}>
          <MedText variant="h2">{t("payoutMethods")}</MedText>
          <Pressable onPress={() => setShowAddMethod(true)}>
            <Ionicons name="add" size={24} color={theme.primary} />
          </Pressable>
        </View>

        {methodsLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
        ) : methods.length === 0 ? (
          <MedCard>
            <View style={styles.emptyRow}>
              <Ionicons name="card-outline" size={20} color={theme.muted} />
              <MedText variant="body" style={{ color: theme.muted, marginLeft: 8 }}>
                {t("noPayoutLinked")}
              </MedText>
            </View>
          </MedCard>
        ) : (
          methods.map((m) => (
            <MedCard key={m.id} style={styles.methodCard}>
              <View style={styles.methodRow}>
                <View style={[styles.methodIcon, { backgroundColor: m.isPrimary ? theme.success + "18" : theme.primary + "12" }]}>
                  <Ionicons
                    name={m.type === "MOBILE_MONEY" ? "phone-portrait-outline" : "business-outline"}
                    size={18}
                    color={m.isPrimary ? theme.success : theme.primary}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodTitleRow}>
                    <MedText variant="body" style={{ fontWeight: "600" }}>{m.provider}</MedText>
                    {m.isPrimary && (
                      <View style={[styles.primaryBadge, { backgroundColor: theme.success + "18" }]}>
                        <MedText style={[styles.primaryBadgeText, { color: theme.success }]}>
                          {t("primaryPayout")}
                        </MedText>
                      </View>
                    )}
                  </View>
                  <MedText variant="metadata" style={{ marginTop: 2 }}>{m.accountName}</MedText>
                  <MedText variant="metadata" style={{ opacity: 0.7 }}>{m.accountNumber}</MedText>
                </View>
              </View>
              {!m.isPrimary && (
                <View style={styles.methodActions}>
                  <Pressable onPress={() => handleSetPrimary(m.id)} style={styles.linkBtn}>
                    <MedText style={[styles.linkText, { color: theme.primary }]}>Make Primary</MedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(m)} style={styles.linkBtn}>
                    <MedText style={[styles.linkText, { color: "#D92D20" }]}>Remove</MedText>
                  </Pressable>
                </View>
              )}
            </MedCard>
          ))
        )}

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <MedText variant="h2">{t("transactions")}</MedText>
        </View>

        {!wallet || wallet.transactions.length === 0 ? (
          <MedCard>
            <MedText variant="body" style={{ textAlign: "center", color: theme.muted, marginVertical: 8 }}>
              No transactions yet.
            </MedText>
          </MedCard>
        ) : (
          wallet.transactions.map((tx) => {
            const isCredit = String(tx.type).toUpperCase() === "CREDIT";
            return (
              <MedCard key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: isCredit ? theme.success + "18" : theme.muted + "18" }]}>
                    <Ionicons
                      name={isCredit ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                      size={18}
                      color={isCredit ? theme.success : theme.muted}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <MedText variant="body">{tx.description || (isCredit ? "Earnings" : "Withdrawal")}</MedText>
                    <MedText variant="metadata" style={{ marginTop: 2 }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </MedText>
                  </View>
                  <MedText
                    variant="body"
                    style={{ fontWeight: "600", color: isCredit ? theme.success : theme.text }}
                  >
                    {isCredit ? "+" : "-"}{formatAmount(tx.amount)}
                  </MedText>
                </View>
              </MedCard>
            );
          })
        )}
      </ScrollView>

      <PayoutMethodModal
        visible={showAddMethod}
        onClose={() => setShowAddMethod(false)}
        onSave={async (data: { type: string; provider: string; accountNumber: string; accountName: string }) => {
          const res = await dispatch(addPayoutMethod(data));
          if (addPayoutMethod.fulfilled.match(res)) {
            setShowAddMethod(false);
          } else {
            Alert.alert("Error", (res.payload as string) || "Failed to add payout method");
          }
        }}
        theme={theme}
      />

      <WithdrawModal
        visible={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={wallet?.balance || 0}
        primary={primaryMethod}
        submitting={withdrawLoading}
        onSubmit={async (amount: number) => {
          const res = await dispatch(requestWithdrawal({ amount }));
          if (requestWithdrawal.fulfilled.match(res)) {
            setShowWithdraw(false);
            Alert.alert("Success", "Withdrawal request submitted.");
            dispatch(fetchWallet());
          } else {
            Alert.alert("Error", (res.payload as string) || "Withdrawal failed");
          }
        }}
        theme={theme}
      />
    </SafeAreaView>
  );
}

function PayoutMethodModal({ visible, onClose, onSave, theme }: any) {
  const [type, setType] = useState("BANK");
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!accountNumber.trim() || !accountName.trim()) {
      Alert.alert("Error", "Please fill in account number and account name.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ type, provider, accountNumber: accountNumber.trim(), accountName: accountName.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <MedText variant="h2">Add Payout Method</MedText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <MedText variant="metadata" style={{ marginBottom: 8 }}>Type</MedText>
            <View style={styles.segmented}>
              {METHOD_TYPES.map((mt) => (
                <Pressable
                  key={mt.value}
                  onPress={() => setType(mt.value)}
                  style={[
                    styles.segment,
                    { backgroundColor: type === mt.value ? theme.primary : "transparent" },
                  ]}
                >
                  <MedText
                    style={{
                      color: type === mt.value ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {mt.label}
                  </MedText>
                </Pressable>
              ))}
            </View>

            <MedText variant="metadata" style={{ marginBottom: 8, marginTop: 16 }}>Provider</MedText>
            <View style={styles.providerWrap}>
              {PROVIDERS.map((p) => {
                const active = provider === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setProvider(p)}
                    style={[
                      styles.providerChip,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.primary + "12" : "transparent",
                      },
                    ]}
                  >
                    <MedText style={{ color: active ? theme.primary : theme.text, fontWeight: active ? "600" : "400" }}>
                      {p}
                    </MedText>
                  </Pressable>
                );
              })}
            </View>

            <MedText variant="metadata" style={{ marginBottom: 8, marginTop: 16 }}>Account Number</MedText>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="e.g. 100020003000"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />

            <MedText variant="metadata" style={{ marginBottom: 8, marginTop: 16 }}>Account Name</MedText>
            <TextInput
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Full name on the account"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />

            <MedButton
              title={saving ? "Saving..." : "Save Payout Method"}
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: 24 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function WithdrawModal({ visible, onClose, balance, primary, submitting, onSubmit, theme }: any) {
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Error", "Enter a valid amount.");
      return;
    }
    if (val > balance) {
      Alert.alert("Error", "Insufficient balance.");
      return;
    }
    if (!primary) {
      Alert.alert("Payout Required", "Add and set a primary payout method before withdrawing.");
      return;
    }
    onSubmit(val);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <MedText variant="h2">Withdraw Funds</MedText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>
          <View style={{ padding: 20 }}>
            <MedText variant="metadata">
              Available balance: {balance.toLocaleString()} ETB
            </MedText>

            <MedText variant="metadata" style={{ marginBottom: 8, marginTop: 16 }}>Amount (ETB)</MedText>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />

            <MedText variant="metadata" style={{ marginBottom: 8, marginTop: 16 }}>Transferring to</MedText>
            {primary ? (
              <View style={[styles.primaryRow, { borderColor: theme.border }]}>
                <Ionicons
                  name={primary.type === "MOBILE_MONEY" ? "phone-portrait-outline" : "business-outline"}
                  size={18}
                  color={theme.primary}
                />
                <MedText variant="body" style={{ marginLeft: 8 }}>
                  {primary.provider} • {primary.accountNumber}
                </MedText>
              </View>
            ) : (
              <MedText variant="body" style={{ color: theme.muted }}>
                No payout account linked.
              </MedText>
            )}

            <MedButton
              title={submitting ? "Processing..." : "Request Payout"}
              onPress={handleSubmit}
              loading={submitting}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 16 },
  balanceCard: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
    borderRadius: 20,
    padding: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginVertical: 10,
  },
  balanceActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  balanceAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  balanceActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodCard: {
    marginBottom: 10,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  methodActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  linkBtn: {
    marginLeft: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  txCard: {
    marginBottom: 8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  providerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  providerChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
});
