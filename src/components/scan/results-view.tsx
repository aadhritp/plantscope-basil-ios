import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { Spacing } from '@/constants/theme';
import { lookupDiagnosis } from '@/data/diseaseInfo';
import type { DiagnosisResult } from '@/lib/plantVision';

type Props = {
  imageUri: string;
  result: DiagnosisResult;
  onCheckAnother: () => void;
};

export function ResultsView({ imageUri, result, onCheckAnother }: Props) {
  if (result.noDetections) {
    return (
      <View style={styles.container}>
        <Pressable onPress={onCheckAnother} style={styles.backRow}>
          <Text style={styles.backText}>‹ Choose a different photo</Text>
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.noLeafTitle}>Couldn&apos;t get a clear look</Text>
          <Text style={styles.bodyText}>
            This photo doesn&apos;t show enough of a basil leaf to check it properly. It might be
            too far away, too blurry, or missing the leaf entirely.
          </Text>
          <Text style={styles.bodyText}>
            Try again with the leaf filling most of the frame, in good light, held steady.
          </Text>
          <Pressable style={styles.retryButton} onPress={onCheckAnother}>
            <Text style={styles.retryButtonText}>Try another photo</Text>
          </Pressable>
          {result.debugMaxScore !== undefined && (
            <Text style={styles.debugText}>
              Debug: best raw score {result.debugMaxScore}% for &quot;{result.debugMaxClass}&quot;
              {' '}across {result.debugNumAnchors} anchors
            </Text>
          )}
        </View>
      </View>
    );
  }

  const diag = lookupDiagnosis(result.primaryClassId);
  const showUncertainBanner = result.uncertain && result.alternatives.length > 1;
  const altText = showUncertainBanner
    ? result.alternatives
        .slice(1)
        .map((a) => `${a.classId.replace(/_/g, ' ')} (${a.confidence}%)`)
        .join(' or ')
    : '';

  return (
    <View style={styles.container}>
      <Pressable onPress={onCheckAnother} style={styles.backRow}>
        <Text style={styles.backText}>‹ Check another leaf</Text>
      </Pressable>

      <View style={styles.photoWrap}>
        <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="contain" />
      </View>

      <View style={styles.headRow}>
        <Text style={styles.tagline}>{diag.tagline}</Text>
        <Text style={styles.label}>{diag.label}</Text>
        <View style={[styles.chip, result.uncertain && styles.chipLow]}>
          <Text style={[styles.chipText, result.uncertain && styles.chipTextLow]}>
            {result.primaryConfidence}% confident
          </Text>
        </View>
      </View>

      {showUncertainBanner && (
        <View style={styles.uncertainBanner}>
          <Text style={styles.uncertainStrong}>This one&apos;s a close call.</Text>
          <Text style={styles.uncertainText}>
            {' '}
            It could also be {altText}. Use the notes below, but keep an eye on how the leaf
            changes over the next few days.
          </Text>
        </View>
      )}

      <Section title="What it is">
        <Text style={styles.bodyText}>{diag.whatItIs}</Text>
        {diag.keywords.length > 0 && (
          <View style={styles.keywordsRow}>
            {diag.keywords.map((k) => (
              <View key={k} style={styles.keywordTag}>
                <Text style={styles.keywordText}>{k}</Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Why it happened">
        <Text style={styles.bodyText}>{diag.whyItHappened}</Text>
      </Section>

      <Section title="What to do">
        {diag.whatToDo.map((step, i) => (
          <View key={i} style={styles.fixRow}>
            <View style={styles.fixNumber}>
              <Text style={styles.fixNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.fixText}>{step}</Text>
          </View>
        ))}
      </Section>

      <Section title="Next best step">
        <Text style={styles.bodyText}>{diag.nextStep}</Text>
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  backRow: {
    paddingVertical: Spacing.one,
  },
  backText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  card: {
    backgroundColor: Brand.card,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  noLeafTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  retryButton: {
    marginTop: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  retryButtonText: {
    color: Brand.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  debugText: {
    marginTop: Spacing.two,
    fontSize: 11,
    lineHeight: 14,
    color: Brand.textMuted,
  },
  photoWrap: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Brand.surfaceMuted,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  headRow: {
    gap: Spacing.one,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
    color: Brand.textMuted,
  },
  label: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Brand.greenSoft,
  },
  chipLow: {
    backgroundColor: Brand.terracottaSoft,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: Brand.greenText,
  },
  chipTextLow: {
    color: Brand.terracottaText,
  },
  uncertainBanner: {
    backgroundColor: Brand.terracottaSoft,
    borderColor: Brand.terracottaBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  uncertainStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Brand.terracottaText,
  },
  uncertainText: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.terracottaText,
  },
  section: {
    backgroundColor: Brand.card,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: Brand.textPrimary,
    marginBottom: Spacing.two,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.textSecondary,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  keywordTag: {
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  keywordText: {
    fontSize: 11,
    lineHeight: 14,
    color: Brand.textSecondary,
  },
  fixRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  fixNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  fixNumberText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: Brand.textSecondary,
  },
  fixText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.textSecondary,
  },
});
