import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

type Props = {
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
};

export function UploadView({ onTakePhoto, onChooseFromGallery }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.title}>What&apos;s going on with your basil?</Text>
        <Text style={styles.subtitle}>
          Take a photo of a leaf that&apos;s bothering you, or upload one you already have.
          PlantScope looks it over, entirely on this device.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>🌿</Text>
        </View>
        <Text style={styles.cardTitle}>Add a basil leaf photo</Text>
        <Text style={styles.cardHint}>Nothing leaves your phone</Text>

        <Pressable style={styles.primaryButton} onPress={onTakePhoto}>
          <Text style={styles.primaryButtonText}>Take a photo</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onChooseFromGallery}>
          <Text style={styles.secondaryButtonText}>Choose from gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  intro: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: Brand.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: Brand.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Brand.card,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  iconGlyph: {
    fontSize: 26,
    lineHeight: 32,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: Brand.textPrimary,
  },
  cardHint: {
    fontSize: 12,
    lineHeight: 16,
    color: Brand.textMuted,
    marginBottom: Spacing.three,
  },
  primaryButton: {
    backgroundColor: Brand.terracotta,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  secondaryButtonText: {
    color: Brand.textPrimary,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
});
