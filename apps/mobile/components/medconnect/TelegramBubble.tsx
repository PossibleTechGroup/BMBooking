import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MedText } from './MedText';

interface TelegramBubbleProps {
  content: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  isIncoming?: boolean;
  onClose?: () => void;
  style?: ViewStyle;
}

export const TelegramBubble: React.FC<TelegramBubbleProps> = ({ 
  content, 
  time, 
  status = 'read', 
  isIncoming = false,
  onClose,
  style 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const incomingTextColor = colorScheme === 'dark' && isIncoming ? '#101828' : undefined;

  return (
    <View style={[
      styles.container, 
      isIncoming ? styles.incomingAlign : styles.outgoingAlign,
      style
    ]}>
      <View style={[
        styles.bubble, 
        { 
          backgroundColor: isIncoming ? '#F2F4F7' : theme.surface,
          borderColor: theme.border,
          borderWidth: isIncoming ? 0 : 1
        }
      ]}>
        <View style={styles.contentRow}>
          <MedText 
            variant="body" 
            style={[styles.text, incomingTextColor ? { color: incomingTextColor } : undefined]}
          >
            {content}
          </MedText>
          {onClose ? (
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={16}
                color={incomingTextColor ?? theme.muted}
              />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.footer}>
          <MedText 
            variant="metadata" 
            style={[styles.time, incomingTextColor ? { color: incomingTextColor } : undefined]}
          >
            {time}
          </MedText>
          {!isIncoming && (
            <View style={styles.statusIcon}>
              <Ionicons 
                name={status === 'read' ? "checkmark-done" : "checkmark"} 
                size={16} 
                color={status === 'read' ? "#34B7F1" : theme.muted} 
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  incomingAlign: {
    alignItems: 'flex-start',
  },
  outgoingAlign: {
    alignItems: 'flex-end',
  },
  bubble: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    flex: 1,
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  time: {
    fontSize: 10,
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
});
