import CoreGraphics
import CoreImage
import CoreML
import ExpoModulesCore
import UIKit

/// On-device basil disease diagnosis. Runs the bundled CoreML YOLOv8
/// detection model fully locally — no network calls are made here.
///
/// Ported from the Python pipeline (plantscope_app/inference.py
/// _predict_detection): a single detect pass over the full photo, scored
/// per anchor, grouped by class after NMS to rank a primary finding plus
/// up to two alternatives.
public class PlantScopeVisionModule: Module {

  // MARK: - Constants

  /// Index-to-label mapping for the detector output, in the exact order
  /// reported by the trained model's `.names` dict (alphabetical). This
  /// MUST stay in sync with src/data/diseaseInfo.ts's CLASS_NAMES.
  private static let classLabels: [String] = [
    "bacterial_spot",
    "bug_spot",
    "downy_mildew",
    "healthy",
    "magnesium_deficiency",
    "nitrogen_deficiency",
    "powdery_mildew",
  ]

  /// Matches plantscope_app/inference.py's DETECTION_CONF_THRESHOLD.
  private static let confidenceThreshold: Float = 0.35
  /// Matches Ultralytics' default NMS IoU threshold.
  private static let iouThreshold: Float = 0.45
  /// Matches plantscope_app/inference.py's UNCERTAIN_GAP (percentage points).
  private static let uncertainGap: Double = 20.0
  private static let inputSize: CGFloat = 640

  // MARK: - Lazily-loaded model (loaded once, on first use)

  private lazy var detectorModel: MLModel? = Self.loadCompiledModel(named: "BASIL-DETECT")

  // MARK: - Module definition

  public func definition() -> ModuleDefinition {
    Name("PlantScopeVision")

    AsyncFunction("diagnose") { (imageUri: String) -> [String: Any] in
      try self.runDiagnosis(imageUri: imageUri)
    }

    AsyncFunction("isReady") { () -> Bool in
      self.detectorModel != nil
    }
  }

  // MARK: - Main pipeline

  private func runDiagnosis(imageUri: String) throws -> [String: Any] {
    guard let detector = detectorModel else {
      throw PlantScopeVisionError.modelNotLoaded("BASIL-DETECT")
    }

    let cgImage = try Self.loadCGImage(fromUri: imageUri)
    let srcWidth = Double(cgImage.width)
    let srcHeight = Double(cgImage.height)
    guard srcWidth > 0, srcHeight > 0 else {
      throw PlantScopeVisionError.invalidImage
    }

    guard
      let prep = Self.makePixelBuffer(
        from: cgImage,
        targetSize: CGSize(width: Self.inputSize, height: Self.inputSize)
      )
    else {
      throw PlantScopeVisionError.preprocessingFailed
    }

    let input = try MLDictionaryFeatureProvider(dictionary: [
      "image": MLFeatureValue(pixelBuffer: prep.buffer)
    ])
    let output = try detector.prediction(from: input)
    guard
      let outputName = detector.modelDescription.outputDescriptionsByName.keys.first,
      let array = output.featureValue(for: outputName)?.multiArrayValue
    else {
      throw PlantScopeVisionError.invalidOutput("detector")
    }

    let rawBoxes = Self.decodeDetectOutput(array, confidenceThreshold: Self.confidenceThreshold)
    let finalBoxes = Self.nonMaxSuppressPerClass(rawBoxes, iouThreshold: Self.iouThreshold)

    if finalBoxes.isEmpty {
      return [
        "primaryClassId": "healthy",
        "primaryConfidence": 0.0,
        "alternatives": [] as [[String: Any]],
        "uncertain": true,
        "boxes": [] as [[String: Any]],
        "noDetections": true,
      ]
    }

    var boxesPayload: [[String: Any]] = []
    var bestScoreByClass: [Int: Float] = [:]

    for box in finalBoxes {
      let cxOriginal = (Double(box.cx) - prep.offsetX) / prep.scale
      let cyOriginal = (Double(box.cy) - prep.offsetY) / prep.scale
      let wOriginal = Double(box.w) / prep.scale
      let hOriginal = Double(box.h) / prep.scale
      let x1 = (cxOriginal - wOriginal / 2).rounded()
      let y1 = (cyOriginal - hOriginal / 2).rounded()
      let x2 = (cxOriginal + wOriginal / 2).rounded()
      let y2 = (cyOriginal + hOriginal / 2).rounded()

      let label = Self.classLabels[box.classIndex]
      let confidencePct = (Double(box.score) * 1000).rounded() / 10 // one decimal place

      boxesPayload.append([
        "classId": label,
        "confidence": confidencePct,
        "box": [x1, y1, x2, y2],
      ])

      if box.score > (bestScoreByClass[box.classIndex] ?? -1) {
        bestScoreByClass[box.classIndex] = box.score
      }
    }

    let rankedClasses = bestScoreByClass
      .map { (classIndex: $0.key, score: $0.value) }
      .sorted { $0.score > $1.score }

    let alternatives: [[String: Any]] = rankedClasses.prefix(3).map {
      ["classId": Self.classLabels[$0.classIndex], "confidence": (Double($0.score) * 1000).rounded() / 10]
    }

    let primary = alternatives[0]
    let primaryConfidence = primary["confidence"] as! Double
    let secondConfidence = alternatives.count > 1 ? (alternatives[1]["confidence"] as! Double) : 0.0
    let gap = primaryConfidence - secondConfidence

    return [
      "primaryClassId": primary["classId"] as! String,
      "primaryConfidence": primaryConfidence,
      "alternatives": alternatives,
      "uncertain": gap < Self.uncertainGap,
      "boxes": boxesPayload,
      "noDetections": false,
    ]
  }

  // MARK: - Image loading

  private static func loadCGImage(fromUri uri: String) throws -> CGImage {
    guard let url = URL(string: uri) else {
      throw PlantScopeVisionError.invalidURI
    }
    let data: Data
    do {
      data = try Data(contentsOf: url)
    } catch {
      throw PlantScopeVisionError.invalidImage
    }
    guard let uiImage = UIImage(data: data) else {
      throw PlantScopeVisionError.invalidImage
    }
    // Camera captures frequently carry non-.up EXIF orientation; normalize
    // it so downstream pixel math (and the model itself) sees the photo
    // right-side-up, matching what the user sees on screen.
    let normalized = Self.normalizeOrientation(uiImage)
    guard let cgImage = normalized.cgImage else {
      throw PlantScopeVisionError.invalidImage
    }
    return cgImage
  }

  private static func normalizeOrientation(_ image: UIImage) -> UIImage {
    if image.imageOrientation == .up {
      return image
    }
    let renderer = UIGraphicsImageRenderer(size: image.size)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: image.size))
    }
  }

  // MARK: - Model loading

  private static func loadCompiledModel(named name: String) -> MLModel? {
    guard let url = Self.locateCompiledModelURL(named: name) else {
      NSLog("[PlantScopeVision] Could not locate compiled model resource: \(name).mlmodelc")
      return nil
    }
    do {
      return try MLModel(contentsOf: url)
    } catch {
      NSLog("[PlantScopeVision] Failed to load model \(name): \(error)")
      return nil
    }
  }

  /// CocoaPods resource_bundles can end up in a few different places
  /// depending on static/dynamic framework linking. Try the common
  /// locations in order before giving up.
  private static func locateCompiledModelURL(named name: String) -> URL? {
    let fileName = "\(name).mlmodelc"
    let bundleName = "PlantScopeVision.bundle"

    let moduleCodeBundle = Bundle(for: PlantScopeVisionModule.self)
    let mainBundle = Bundle.main

    let candidateBundles: [Bundle?] = [
      // 1. A dedicated resource bundle alongside the main app bundle.
      Bundle(url: mainBundle.bundleURL.appendingPathComponent(bundleName)),
      // 2. A dedicated resource bundle inside the app's PrivateFrameworks
      //    directory (typical with `use_frameworks! :linkage => :static`).
      (mainBundle.privateFrameworksURL?.appendingPathComponent(bundleName)).flatMap(Bundle.init(url:)),
      // 3. Inside the module's own compiled framework/bundle.
      moduleCodeBundle.url(forResource: "PlantScopeVision", withExtension: "bundle").flatMap(Bundle.init(url:)),
      // 4. The module's own code bundle directly (resources merged in).
      moduleCodeBundle,
      // 5. The main app bundle directly, as a last resort.
      mainBundle,
    ]

    for bundle in candidateBundles {
      if let url = bundle?.url(forResource: name, withExtension: "mlmodelc") {
        return url
      }
    }

    // Final fallback: scan the main bundle's resource directory for the
    // compiled model by filename, in case it landed somewhere unexpected.
    if let resourceURL = mainBundle.resourceURL {
      let direct = resourceURL.appendingPathComponent(fileName)
      if FileManager.default.fileExists(atPath: direct.path) {
        return direct
      }
    }
    return nil
  }

  // MARK: - Image preprocessing (manual, deterministic — no implicit Vision auto-scaling)

  private struct PixelBufferPrep {
    let buffer: CVPixelBuffer
    let scale: Double
    let offsetX: Double
    let offsetY: Double
  }

  /// Renders `image` into a square `targetSize` CVPixelBuffer using a
  /// letterbox fit (matches YOLO training preprocessing), returning the
  /// exact scale/offset used so callers can invert the transform for any
  /// detections found.
  ///
  /// Uses Core Image (not raw CGContext byte manipulation) specifically to
  /// avoid manual pixel-format/byte-order bugs — CIContext.render handles
  /// the CVPixelBuffer's raster orientation and color format correctly.
  private static func makePixelBuffer(
    from cgImage: CGImage,
    targetSize: CGSize
  ) -> PixelBufferPrep? {
    let srcW = CGFloat(cgImage.width)
    let srcH = CGFloat(cgImage.height)
    guard srcW > 0, srcH > 0 else { return nil }

    let targetW = targetSize.width
    let targetH = targetSize.height
    let scale: CGFloat = min(targetW / srcW, targetH / srcH)

    let drawnW = srcW * scale
    let drawnH = srcH * scale
    // Centered placement — symmetric, so this value is correct regardless
    // of whether it's measured from the top or bottom of the canvas.
    let offsetX = (targetW - drawnW) / 2
    let offsetY = (targetH - drawnH) / 2

    var pixelBuffer: CVPixelBuffer?
    let attrs: [CFString: Any] = [
      kCVPixelBufferCGImageCompatibilityKey: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey: true,
    ]
    let status = CVPixelBufferCreate(
      kCFAllocatorDefault,
      Int(targetW.rounded()),
      Int(targetH.rounded()),
      kCVPixelFormatType_32BGRA,
      attrs as CFDictionary,
      &pixelBuffer
    )
    guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return nil }

    let ciImage = CIImage(cgImage: cgImage)
    // Neutral gray padding, matching Ultralytics' default letterbox fill
    // color (114,114,114).
    let background = CIImage(color: CIColor(red: 114.0 / 255.0, green: 114.0 / 255.0, blue: 114.0 / 255.0))
      .cropped(to: CGRect(x: 0, y: 0, width: targetW, height: targetH))

    // Explicit matrix (x' = scale*x + offsetX, y' = scale*y + offsetY) —
    // written out directly rather than chaining transform calls, to avoid
    // any ambiguity about composition order.
    let transform = CGAffineTransform(a: scale, b: 0, c: 0, d: scale, tx: offsetX, ty: offsetY)
    let transformedImage = ciImage.transformed(by: transform)

    let composited = transformedImage.composited(over: background)

    let ciContext = CIContext(options: [.workingColorSpace: NSNull()])
    ciContext.render(composited, to: buffer)

    return PixelBufferPrep(buffer: buffer, scale: Double(scale), offsetX: Double(offsetX), offsetY: Double(offsetY))
  }

  // MARK: - Detect output decoding

  private struct RawBox {
    let cx: Float
    let cy: Float
    let w: Float
    let h: Float
    let classIndex: Int
    let score: Float
  }

  /// Decodes the raw detect head output. Expected shape is [1, 4 + nc, numAnchors]:
  /// channels 0-3 = box (cx, cy, w, h) already decoded to pixel space by the
  /// model's own head; channels 4..(4+nc-1) = per-class sigmoid scores. Takes
  /// the best class per anchor, mirroring Ultralytics' own NMS input prep.
  private static func decodeDetectOutput(_ array: MLMultiArray, confidenceThreshold: Float) -> [RawBox] {
    let shape = array.shape.map { $0.intValue }
    guard shape.count == 3 else { return [] }
    let numChannels = shape[1]
    let numAnchors = shape[2]
    let numClasses = numChannels - 4
    guard numClasses > 0 else { return [] }

    let strides = array.strides.map { $0.intValue }
    let channelStride = strides[1]
    let anchorStride = strides[2]

    func value(_ channel: Int, _ anchor: Int) -> Float {
      array[channel * channelStride + anchor * anchorStride].floatValue
    }

    var boxes: [RawBox] = []
    boxes.reserveCapacity(64)

    for anchor in 0..<numAnchors {
      var bestScore: Float = -Float.greatestFiniteMagnitude
      var bestClass = 0
      for c in 0..<numClasses {
        let score = value(4 + c, anchor)
        if score > bestScore {
          bestScore = score
          bestClass = c
        }
      }
      if bestScore >= confidenceThreshold {
        boxes.append(
          RawBox(
            cx: value(0, anchor),
            cy: value(1, anchor),
            w: value(2, anchor),
            h: value(3, anchor),
            classIndex: bestClass,
            score: bestScore
          )
        )
      }
    }
    return boxes
  }

  /// Greedy NMS run separately within each class group — matches
  /// Ultralytics' default (non-agnostic) NMS, where boxes of different
  /// classes never suppress each other.
  private static func nonMaxSuppressPerClass(_ boxes: [RawBox], iouThreshold: Float) -> [RawBox] {
    let grouped = Dictionary(grouping: boxes, by: { $0.classIndex })
    var kept: [RawBox] = []
    for (_, group) in grouped {
      kept.append(contentsOf: nonMaxSuppress(group, iouThreshold: iouThreshold))
    }
    return kept
  }

  private static func nonMaxSuppress(_ boxes: [RawBox], iouThreshold: Float) -> [RawBox] {
    let sorted = boxes.sorted { $0.score > $1.score }
    var kept: [RawBox] = []
    for candidate in sorted {
      var overlapsKept = false
      for keptBox in kept {
        if iou(candidate, keptBox) > iouThreshold {
          overlapsKept = true
          break
        }
      }
      if !overlapsKept {
        kept.append(candidate)
      }
    }
    return kept
  }

  private static func iou(_ a: RawBox, _ b: RawBox) -> Float {
    let ax1 = a.cx - a.w / 2, ay1 = a.cy - a.h / 2, ax2 = a.cx + a.w / 2, ay2 = a.cy + a.h / 2
    let bx1 = b.cx - b.w / 2, by1 = b.cy - b.h / 2, bx2 = b.cx + b.w / 2, by2 = b.cy + b.h / 2

    let interX1 = max(ax1, bx1), interY1 = max(ay1, by1)
    let interX2 = min(ax2, bx2), interY2 = min(ay2, by2)
    let interW = max(0, interX2 - interX1)
    let interH = max(0, interY2 - interY1)
    let interArea = interW * interH

    let areaA = a.w * a.h
    let areaB = b.w * b.h
    let unionArea = areaA + areaB - interArea
    return unionArea > 0 ? interArea / unionArea : 0
  }
}

// MARK: - Errors

enum PlantScopeVisionError: Error, LocalizedError {
  case invalidURI
  case invalidImage
  case modelNotLoaded(String)
  case preprocessingFailed
  case invalidOutput(String)

  var errorDescription: String? {
    switch self {
    case .invalidURI:
      return "Invalid image URI provided to PlantScopeVision."
    case .invalidImage:
      return "Could not load image data for diagnosis."
    case .modelNotLoaded(let name):
      return "On-device model '\(name)' failed to load."
    case .preprocessingFailed:
      return "Failed to prepare the image for the model."
    case .invalidOutput(let stage):
      return "Model produced an unexpected output during \(stage)."
    }
  }
}
