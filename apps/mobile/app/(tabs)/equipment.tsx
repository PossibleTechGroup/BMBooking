import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MedText } from '../../components/medconnect/MedText';
import { BMHeader } from '../../components/BMHeader';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useUserLocation } from '../../hooks/useUserLocation';
import { haversineKm } from '../../utils/location';
import { AppDispatch, RootState } from '../../store';
import {
  searchEquipment,
  fetchEquipmentCategories,
} from '../../store/slices/equipmentSlice';

const CATEGORY_LABELS: Record<string, string> = {
  MRI: 'MRI',
  CT_SCAN: 'CT SCAN',
  DIALYSIS: 'DIALYSIS',
  ULTRASOUND: 'ULTRASOUND',
  XRAY: 'X-Ray',
  VENTILATOR: 'VENTILATOR',
  ECG: 'ECG',
  MAMMOGRAPHY: 'MAMMOGRAPHY',
  DEFIBRILLATOR: 'DEFIBRILLATOR',
  OTHER: 'OTHER',
};

interface CenterGroup {
  hospitalId: number | null;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  services: any[];
}

export default function EquipmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { searchResults, categories, loading, error } = useSelector(
    (state: RootState) => state.equipment
  );
  const { latitude, longitude } = useUserLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = useCallback(() => {
    dispatch(fetchEquipmentCategories());
    dispatch(
      searchEquipment({
        category: selectedCategory || '',
        query: searchQuery || '',
      })
    );
  }, [dispatch, selectedCategory, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    load();
  }, [load]);

  const onCategoryPress = (category: string) => {
    const newCategory = selectedCategory === category ? null : category || null;
    setSelectedCategory(newCategory);
  };

  const centers = useMemo<CenterGroup[]>(() => {
    const map = new Map<number | string, CenterGroup>();
    for (const item of searchResults || []) {
      const key = item.hospitalId != null ? item.hospitalId : item.hospitalName;
      if (key == null || !key) continue;
      let group = map.get(key);
      if (!group) {
        group = {
          hospitalId: item.hospitalId != null ? item.hospitalId : null,
          name: item.hospitalName || 'Diagnosis Center',
          address: item.address || '',
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
          phone: item.hospitalPhone || '',
          services: [],
        };
        map.set(key, group);
      }
      group.services.push(item);
    }
    return Array.from(map.values());
  }, [searchResults]);

  const distanceFor = (center: CenterGroup): number | null => {
    if (latitude == null || longitude == null) return null;
    if (!center.latitude || !center.longitude) return null;
    return Math.round(haversineKm(latitude, longitude, center.latitude, center.longitude) * 10) / 10;
  };

  const renderCenterCard = ({ item }: { item: CenterGroup }) => {
    const distanceKm = distanceFor(item);
    const availableCount = item.services.filter((s) => s.isOperational !== false).length;
    const chips = item.services.slice(0, 3);

    return (
      <Pressable
        style={[styles.centerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => router.push({ pathname: '/center-detail', params: { id: item.hospitalId } })}
      >
        <View style={styles.cardRow}>
          {/* Left Icon in Rounded Box */}
          <View style={[styles.centerAvatar, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="business-outline" size={24} color="#1E56A0" />
          </View>

          {/* Middle Info */}
          <View style={styles.centerInfo}>
            <MedText style={[styles.centerTag, { color: theme.primary }]}>
              DIAGNOSIS CENTER
            </MedText>
            <MedText variant="body" style={[styles.centerName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </MedText>

            {item.address ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <MedText style={styles.metaText} numberOfLines={1}>
                  {item.address}
                </MedText>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Ionicons name="navigate-outline" size={13} color={theme.primary} />
              <MedText style={[styles.distanceText, { color: theme.primary }]}>
                {distanceKm != null ? `${distanceKm.toFixed(1)} km away` : 'Distance unavailable'}
              </MedText>
              <Ionicons name="pulse-outline" size={13} color="#64748B" style={{ marginLeft: 8 }} />
              <MedText style={styles.metaText}>
                {availableCount} {availableCount === 1 ? 'service' : 'services'}
              </MedText>
            </View>

            {chips.length > 0 ? (
              <View style={styles.chipRow}>
                {chips.map((s, idx) => (
                  <View key={`${s.id}-${idx}`} style={[styles.chip, { backgroundColor: theme.secondaryBg }]}>
                    <MedText style={styles.chipText} numberOfLines={1}>
                      {CATEGORY_LABELS[s.category] || s.category}
                    </MedText>
                  </View>
                ))}
                {item.services.length > chips.length ? (
                  <MedText style={[styles.moreText, { color: theme.textSecondary }]}>
                    +{item.services.length - chips.length} more
                  </MedText>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Right Arrow */}
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* BM Brand Header */}
      <BMHeader />

      {/* Page Title */}
      <View style={styles.titleRow}>
        <MedText variant="h1" style={[styles.pageTitle, { color: theme.text }]}>
          {t('diagnosisCenters') || 'Diagnosis Centers'}
        </MedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t("searchEquipmentPlaceholder") || "Search services or centers..."}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={load}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Horizontal Category Pills */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          <Pressable
            style={[
              styles.subTab,
              !selectedCategory
                ? { backgroundColor: '#1E56A0', borderColor: '#1E56A0' }
                : { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => onCategoryPress('')}
          >
            <MedText
              style={[
                styles.subTabText,
                { color: !selectedCategory ? '#FFFFFF' : theme.textSecondary, fontWeight: !selectedCategory ? '700' : '500' },
              ]}
            >
              All
            </MedText>
          </Pressable>
          {categories.map((cat) => {
            const active = selectedCategory === cat.category;
            return (
              <Pressable
                key={cat.category}
                style={[
                  styles.subTab,
                  active
                    ? { backgroundColor: '#1E56A0', borderColor: '#1E56A0' }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => onCategoryPress(cat.category)}
              >
                <MedText
                  style={[
                    styles.subTabText,
                    { color: active ? '#FFFFFF' : theme.textSecondary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {CATEGORY_LABELS[cat.category] || cat.category}
                </MedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Centers List */}
      {loading && centers.length === 0 ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : error && centers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.secondaryBg }]}>
            <Ionicons name="cloud-offline-outline" size={32} color={theme.textSecondary} />
          </View>
          <MedText style={[styles.emptyTitle, { color: theme.text }]}>
            {t("equipmentLoadError") || "Couldn't load diagnosis centers"}
          </MedText>
          <MedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {error || (t("checkYourConnection") || "Check your connection and try again.")}
          </MedText>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={load}
          >
            <MedText style={styles.retryButtonText}>Retry</MedText>
          </Pressable>
        </View>
      ) : centers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.secondaryBg }]}>
            <Ionicons name="business-outline" size={32} color={theme.textSecondary} />
          </View>
          <MedText style={[styles.emptyTitle, { color: theme.text }]}>
            {t("noEquipmentFound") || "No diagnosis centers found"}
          </MedText>
          <MedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {t("tryDifferentCategory") || "Try selecting another category or different search terms."}
          </MedText>
        </View>
      ) : (
        <FlatList
          data={centers}
          renderItem={renderCenterCard}
          keyExtractor={(item) => String(item.hospitalId ?? item.name)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryScrollWrap: {
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subTab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  subTabText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  centerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInfo: {
    flex: 1,
    minWidth: 0,
  },
  centerTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
    alignSelf: 'center',
  },
  chevron: {
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});