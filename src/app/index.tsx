import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingView } from '@/components/scan/loading-view';
import { ResultsView } from '@/components/scan/results-view';
import { UploadView } from '@/components/scan/upload-view';
import { Brand } from '@/constants/brand';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { runDiagnosis, type DiagnosisResult } from '@/lib/plantVision';
import { recordScan } from '@/lib/scanHistory';

type Screen = 'upload' | 'loading' | 'results';

export default function ScanScreen() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  async function processImage(uri: string) {
    setImageUri(uri);
    setScreen('loading');
    try {
      const diagnosis = await runDiagnosis(uri);
      setResult(diagnosis);
      setScreen('results');
      recordScan(diagnosis).catch((err) => console.warn('Failed to save scan to history:', err));
    } catch {
      Alert.alert('Something went wrong', 'Could not analyze that photo. Please try again.');
      setScreen('upload');
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in Settings to take a photo.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!picked.canceled && picked.assets[0]) {
      processImage(picked.assets[0].uri);
    }
  }

  async function handleChooseFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access in Settings to choose a leaf photo.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets[0]) {
      processImage(picked.assets[0].uri);
    }
  }

  function reset() {
    setScreen('upload');
    setImageUri(null);
    setResult(null);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Header />
        {screen === 'upload' && (
          <UploadView onTakePhoto={handleTakePhoto} onChooseFromGallery={handleChooseFromGallery} />
        )}
        {screen === 'loading' && imageUri && <LoadingView imageUri={imageUri} />}
        {screen === 'results' && imageUri && result && (
          <ResultsView imageUri={imageUri} result={result} onCheckAnother={reset} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <Text style={styles.header}>
      <Text style={styles.headerEmerald}>Plant</Text>Scope
    </Text>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  headerEmerald: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: Brand.terracotta,
  },
});
