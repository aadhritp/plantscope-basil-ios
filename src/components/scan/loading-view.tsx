import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

type Props = {
  imageUri: string;
};

export function LoadingView({ imageUri }: Props) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.preview} />
      <ActivityIndicator size="small" color={Brand.green} style={styles.spinner} />
      <Text style={styles.title}>Looking it over…</Text>
      <Text style={styles.subtitle}>Checking your basil leaf, entirely on this device</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  preview: {
    width: 192,
    height: 192,
    borderRadius: 16,
    backgroundColor: Brand.surfaceMuted,
    marginBottom: Spacing.three,
  },
  spinner: {
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: Brand.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Brand.textMuted,
  },
});
