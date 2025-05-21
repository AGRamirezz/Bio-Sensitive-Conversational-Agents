# Changelog

All notable changes to the Bio-Adaptive Tutor project will be documented in this file.

## [v0.4] - 2023-05-21

### Fixed
- Corrected webcam mode emotion detection and display issues
- Fixed gauge metrics in webcam mode to respond to detected emotions
- Resolved confidence score display in face detection boxes (previously showing values like 8700% instead of 87%)
- Improved synchronization between detected emotions and cognitive metrics
- Ensured webcam controls properly update all UI elements

### Added
- Enhanced emotion-to-metrics mapping for more realistic simulation of cognitive states
- Better error handling for API connection failures
- Added slight randomization to cognitive metrics for more natural fluctuations

### Changed
- Improved emotion bar visual feedback
- Removed unnecessary visual styling (webcam indicator and pulsing border)
- Enhanced emotion mapping to handle a wider range of detected emotions

### Known Issues
- The `/api/emotion-aggregate` endpoint may return 404 errors, but the application now bypasses this with direct metrics updates
- EEG signal visualization is still using simulated data, not actual readings
- Webcam may not detect certain emotions in challenging lighting conditions
- Face detection works best when facing the camera directly

### Troubleshooting
- If webcam doesn't appear to be working, check browser permissions
- If metrics seem stuck at 0.50, try disabling and re-enabling webcam mode
- For optimal emotion detection, ensure good lighting on your face
- Restart the application if you experience persistent connection issues with the face analysis server 