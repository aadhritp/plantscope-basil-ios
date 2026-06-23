export type NativeBox = {
  classId: string;
  confidence: number; // 0-100
  /** Pixel coords in the original, full-resolution photo: [x1, y1, x2, y2]. */
  box: [number, number, number, number];
};

export type NativeAlternative = {
  classId: string;
  confidence: number; // 0-100
};

export type NativeDiagnosisResult = {
  primaryClassId: string;
  primaryConfidence: number; // 0-100
  alternatives: NativeAlternative[];
  uncertain: boolean;
  boxes: NativeBox[];
  noDetections: boolean;
};
