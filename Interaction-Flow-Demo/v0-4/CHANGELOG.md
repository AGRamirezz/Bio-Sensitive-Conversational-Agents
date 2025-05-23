# Changelog

All notable changes to the Bio-Adaptive Tutor project will be documented in this file.

## [v0.4.0] - 2024-01-15

### Added
- **Telemetry Snapshot System**: 5-second time window emotion analysis with composite scoring (frequency × confidence × recency)
- **Enhanced LLM Integration**: Emotion-aware AI responses with mandatory emotional acknowledgment patterns
- **Advanced Prompt Templates**: Sophisticated context injection that requires AI to recognize user emotional states
- **Comprehensive Logging**: Complete emotion detection pipeline tracing from webcam to LLM response
- **Time Window Analysis**: Intelligent emotion selection based on recent detection history rather than instant readings
- **Test Infrastructure**: `test_fixes.html` for debugging emotion detection and global variable issues

### Fixed
- **Global Variable Accessibility**: `window.currentEmotion` and `window.emotionIntensity` now properly accessible across all modules
- **Webcam Integration**: Emotion detection now correctly populates the emotion buffer and triggers LLM context
- **Neutral Emotion Over-representation**: 90% confidence threshold and 10% scoring penalty for neutral emotions
- **Biometric Context Generation**: Proper emotion data flow from detection to LLM prompt engineering

### Improved
- **Chain of Reasoning**: Clear processing pipeline: Detection → Buffer → Analysis → Context → LLM → Response
- **Emotion Recognition Messaging**: AI agent now acknowledges user emotions with patterns like "I can see you're feeling frustrated..."
- **Debugging Capabilities**: Enhanced console logging throughout the entire emotion processing workflow
- **Code Architecture**: Better separation of concerns between emotion detection, analysis, and LLM integration

### Technical Details
- Emotion buffer stores last 5 seconds of detection data with timestamp and confidence
- Composite scoring algorithm weighs recent emotions more heavily
- LLM server processes biometric snapshots with enhanced emotion context
- Visual pulse effects indicate successful emotion state changes

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