import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MedText } from './medconnect/MedText';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic (አማርኛ)' },
  { code: 'om', label: 'Oromo (Afaan Oromoo)' },
];

export const LanguagePicker = () => {
  const { i18n, t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    try {
      await storage.setItem('user-language', code);
    } catch (e) {
      // storage may fail in some environments, language still changes in memory
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.trigger, { backgroundColor: theme.surface, borderColor: theme.border }]} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="language" size={18} color={theme.primary} />
        <MedText variant="metadata" style={styles.triggerText}>
          {currentLanguage.label}
        </MedText>
        <Ionicons name="chevron-down" size={14} color={theme.muted} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <MedText variant="h2" style={styles.modalTitle}>{t('selectLanguage')}</MedText>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    i18n.language === item.code && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => changeLanguage(item.code)}
                >
                  <MedText 
                    variant="body" 
                    style={[
                      styles.langText,
                      i18n.language === item.code && { color: theme.primary, fontWeight: '600' }
                    ]}
                  >
                    {item.label}
                  </MedText>
                  {i18n.language === item.code && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  triggerText: {
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  langText: {
    fontSize: 16,
  }
});
