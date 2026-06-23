Pod::Spec.new do |s|
  s.name           = 'PlantScopeVision'
  s.version        = '1.0.0'
  s.summary        = 'On-device basil disease diagnosis (CoreML YOLOv8 detector)'
  s.description    = 'Bundles and runs the PlantScope basil-disease CoreML model fully on-device, with no network calls.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"

  # Bundled CoreML models — Xcode automatically compiles .mlmodel resources
  # into .mlmodelc at build time. Using a named resource_bundles entry (not
  # plain `resources`) keeps the output bundle name predictable
  # ("PlantScopeVision.bundle") regardless of static/dynamic linking.
  s.resource_bundles = {
    'PlantScopeVision' => ['Models/*.mlmodel']
  }
end
