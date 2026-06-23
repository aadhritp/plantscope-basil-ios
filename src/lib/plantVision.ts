import PlantScopeVision from '../../modules/plant-scope-vision/src/PlantScopeVisionModule';

/**
 * On-device basil diagnosis - runs entirely on the phone via the
 * PlantScopeVision native module (Swift + CoreML), wrapping the basil
 * YOLOv8 detection model. No network call, mirrors plantscope_app/inference.py.
 *
 * NOTE: this custom native module cannot run inside Expo Go - it requires a
 * build with the native module included (e.g. the GitHub Actions IPA).
 */

export type DetectionBox = {
  classId: string;
  confidence: number; // 0-100
  /** Pixel coords in the original photo: [x1, y1, x2, y2]. */
  box: [number, number, number, number];
};

export type Alternative = {
  classId: string;
  confidence: number; // 0-100
};

export type DiagnosisResult = {
  primaryClassId: string;
  primaryConfidence: number; // 0-100
  alternatives: Alternative[];
  uncertain: boolean;
  boxes: DetectionBox[];
  noDetections: boolean;
  isHealthy: boolean;
  /** TEMPORARY debug fields, only present when noDetections is true. */
  debugMaxScore?: number;
  debugMaxClass?: string;
  debugNumAnchors?: number;
};

export async function runDiagnosis(imageUri: string): Promise<DiagnosisResult> {
  try {
    const native = await PlantScopeVision.diagnose(imageUri);
    return {
      ...native,
      isHealthy: native.primaryClassId === 'healthy',
    };
  } catch (err) {
    if (__DEV__) {
      console.error('PlantScopeVision.diagnose failed:', err);
    }
    throw new Error(
      'On-device diagnosis is unavailable. This requires a PlantScope build with the native ' +
        'vision module (it will not work inside Expo Go).'
    );
  }
}
