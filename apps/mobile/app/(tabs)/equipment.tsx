import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

import { MedText } from '../../components/medconnect/MedText';
import { MedCard } from '../../components/medconnect/MedCard';
import { MedButton } from '../../components/medconnect/MedButton';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { AppDispatch, RootState } from '../../store';
import { 
  searchEquipment, 
  fetchEquipmentCategories, 
  fetchEquipmentAnnouncements 
} from '../../store/slices/equipmentSlice';
import { LanguagePicker } from '../../components/LanguagePicker';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/ethiopianDate';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, any> = {
  MRI: 'scan-outline',
  CT_SCAN: 'barcode-outline',
  DIALYSIS: 'water-outline',
  ULTRASOUND: 'pulse-outline',
  XRAY: 'body-outline',
  VENTILATOR: 'air-outline',
  ECG: 'heart-outline',
  MAMMOGRAPHY: 'female-outline',
  DEFIBRILLATOR: 'flash-outline',
  OTHER: 'medical-outline',
};

export default function EquipmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { searchResults, categories, announcements, loading } = useSelector(
    (state: RootState) => state.equipment
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchEquipmentCategories());
    dispatch(fetchEquipmentAnnouncements());
    handleSearch();
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchEquipmentCategories());
    dispatch(fetchEquipmentAnnouncements());
    dispatch(searchEquipment({ 
      category: selectedCategory || '', 
      query: searchQuery || '' 
    }));
  }, [dispatch, selectedCategory, searchQuery]);

  const handleSearch = () => {
    dispatch(searchEquipment({ 
      category: selectedCategory || '', 
      query: searchQuery || '' 
    }));
  };

  const onCategoryPress = (category: string) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    dispatch(searchEquipment({ 
      category: newCategory || '', 
      query: searchQuery || '' 
    }));
  };

  const renderAnnouncement = ({ item }: { item: any }) => (
    <MedCard style={styles.announcementCard}>
      <View style={styles.announcementHeader}>
        <View style={[styles.announcementIcon, { backgroundColor: theme.primary + '10' }]}>
          <Ionicons name="megaphone-outline" size={20} color={theme.primary} />
        </View>
        <MedText variant="metadata" style={{ flex: 1, marginLeft: 8 }}>
          {formatDate(new Date(item.createdAt), 'medium')}
        </MedText>
      </View>
      <MedText variant="h2" style={{ marginTop: 8 }}>{item.title}</MedText>
      <MedText variant="body" style={{ marginTop: 4, color: theme.muted }}>
        {item.message}
      </MedText>
      {item.hospitalName && (
        <View style={styles.announcementFooter}>
          <Ionicons name="location-outline" size={14} color={theme.muted} />
          <MedText variant="metadata" style={{ marginLeft: 4 }}>
            {item.hospitalName}
          </MedText>
        </View>
      )}
    </MedCard>
  );

  const renderEquipmentItem = ({ item }: { item: any }) => (
    <Pressable onPress={() => router.push(`/item-detail?id=${item.id}`)}>
      <MedCard style={styles.equipmentCard}>
        <View style={styles.equipmentInfo}>
          <View style={{ flex: 1 }}>
            <MedText variant="h2">{item.name}</MedText>
            <MedText variant="metadata" style={{ color: theme.primary }}>
              {t(item.category) || item.category.replace('_', ' ')}
            </MedText>
            
            <View style={styles.hospitalInfo}>
              <Ionicons name="business-outline" size={14} color={theme.muted} />
              <MedText variant="body" style={styles.hospitalName}>
                {item.hospitalName}
              </MedText>
            </View>

            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={14} color={theme.muted} />
              <MedText variant="metadata" style={{ marginLeft: 4 }}>
                {item.address}
              </MedText>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: item.isOperational ? '#ECFDF3' : '#FEF3F2' }
            ]}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: item.isOperational ? '#027A48' : '#D92D20' }
              ]} />
              <MedText 
                variant="metadata" 
                style={{ color: item.isOperational ? '#027A48' : '#D92D20', fontWeight: 'bold' }}
              >
                {item.isOperational ? t('avail') : t('busy')}
              </MedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.border} style={{ marginTop: 12 }} />
          </View>
        </View>
      </MedCard>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <MedText variant="h1">Equipments</MedText>
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <LanguagePicker />
          </View>
          <MedText variant="body" style={{ color: theme.muted, marginTop: 12 }}>
            Find MRI, CT Scan, X-ray, Ultrasound & more near you
          </MedText>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={20} color={theme.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t("searchByNameOrCity") || "Search by name or city..."}
              placeholderTextColor={theme.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.category}
                onPress={() => onCategoryPress(cat.category)}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: selectedCategory === cat.category ? theme.primary : theme.surface,
                    borderColor: theme.border
                  }
                ]}
              >
                <Ionicons 
                  name={CATEGORY_ICONS[cat.category] || 'medical-outline'} 
                  size={16} 
                  color={selectedCategory === cat.category ? '#FFF' : theme.primary} 
                />
                <MedText 
                  variant="metadata" 
                  style={{ 
                    marginLeft: 6, 
                    color: selectedCategory === cat.category ? '#FFF' : theme.text,
                    fontWeight: '600'
                  }}
                >
                  {t(cat.category) || cat.category.replace('_', ' ')}
                </MedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {announcements.length > 0 && !selectedCategory && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MedText variant="h2">Announcements</MedText>
              <Ionicons name="notifications-outline" size={18} color={theme.primary} />
            </View>
            <FlatList
              data={announcements}
              renderItem={renderAnnouncement}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.85 + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MedText variant="h2">
                {selectedCategory ? `${t(selectedCategory) || selectedCategory.replace('_', ' ')} Equipments` : 'All Equipments'}
              </MedText>
              {loading && <ActivityIndicator size="small" color={theme.primary} />}
            </View>

            <FlatList
              data={searchResults}
              renderItem={renderEquipmentItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  searchContainer: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 12, height: 50, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 8 },
  categoriesList: { paddingHorizontal: 20, gap: 10 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  announcementCard: { width: width * 0.85, marginRight: 16, padding: 16 },
  announcementHeader: { flexDirection: 'row', alignItems: 'center' },
  announcementIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  announcementFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  equipmentCard: { marginBottom: 12, padding: 16 },
  equipmentInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  hospitalInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  hospitalName: { marginLeft: 6, fontWeight: '600' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusContainer: { alignItems: 'flex-end' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
});
