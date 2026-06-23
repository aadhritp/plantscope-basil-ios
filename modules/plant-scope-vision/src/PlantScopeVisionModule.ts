import { NativeModule, requireNativeModule } from 'expo';

import type { NativeDiagnosisResult } from './PlantScopeVision.types';

declare class PlantScopeVisionModule extends NativeModule<{}> {
  diagnose(imageUri: string): Promise<NativeDiagnosisResult>;
  isReady(): Promise<boolean>;
}

export default requireNativeModule<PlantScopeVisionModule>('PlantScopeVision');
