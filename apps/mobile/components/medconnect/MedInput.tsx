import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MedText } from './MedText';

interface MedInputProps extends TextInputProps {
  label: string;
  error?: boolean;
  errorText?: string;
}

export const MedInput: React.FC<MedInputProps> = ({ label, error, errorText, ...props }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <MedText variant="metadata" style={[styles.label, error && { color: "#D92D20" }]}>{label}</MedText>
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: theme.surface, 
            borderColor: error ? "#D92D20" : theme.border,
            color: theme.text,
            height: props.multiline ? undefined : 56,
            minHeight: props.multiline ? 120 : undefined,
            paddingTop: props.multiline ? 12 : 0,
          }
        ]}
        placeholderTextColor={theme.muted}
        {...props}
      />
      {error && errorText ? (
        <MedText variant="metadata" style={styles.errorText}>{errorText}</MedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    // Soft shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  errorText: {
    color: "#D92D20",
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
  },
});
