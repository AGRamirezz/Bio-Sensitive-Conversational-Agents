# Bio-Adaptive AI Tutor

An intelligent tutoring system that adapts to your physiological and emotional state using real-time EEG monitoring, webcam-based emotion detection, and AI-powered responses.

## 🎯 What This Does

- **Real-time EEG monitoring** via Muse 2 headset (optional)
- **Webcam emotion detection** using computer vision
- **AI-powered responses** that adapt to your cognitive and emotional state
- **Interactive dashboard** showing brainwave patterns and emotional metrics
- **Personalized learning** based on your bio-signals

## 🚀 Quick Start

### 1. One-Time Setup

**Prerequisites**: Python 3.9+ and conda (Anaconda/Miniconda)

```bash
# Clone the repository
git clone <repository-url>
cd bio-adaptive-ai-tutor

# Run the interactive setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Let you choose a custom environment name (or use the default)
- Create a conda environment with Python 3.9
- Auto-detect macOS and install Apple Silicon TensorFlow prerequisites
- Install all required packages via pip
- Test that everything works correctly

### 2. Running the Application

#### Method A: Automatic (Recommended)
```bash
# Terminal 1: Start backend servers (will prompt about EEG device)
conda activate bio-adaptive-ai
chmod +x start_servers.sh
./start_servers.sh

# Terminal 2: Start frontend server
npx http-server . -c-1 -p 8000

# Browser: Open http://localhost:8000/index.html
```

#### Method B: Manual (Advanced Users)
```bash
# Terminal 1: LLM Server
conda activate bio-adaptive-ai
python LLM_Server.py

# Terminal 2: Face Analysis Server
python face_analysis.py

# Terminal 3: EEG Server (Optional - only if you have Muse 2)
muselsl stream &
python read_eeg.py

# Terminal 4: Frontend Server
npx http-server . -c-1 -p 8000

# Browser: Open http://localhost:8000/index.html
```

### 3. First Time Setup Notes
- The AI model (~4GB) will download automatically on first use
- The frontend server command `npx http-server . -c-1 -p 8000` serves the web interface
- Use `http://localhost:8000/index.html` (not file:// URLs)
- The `-c-1` flag disables caching for development

## 🧠 Hardware Setup (Optional)

### EEG Device (Muse 2)
If you have a Muse 2 headset:

1. **Power on** your Muse 2 headset
2. **Start EEG streaming** (in a separate terminal):
   ```bash
   conda activate bio-adaptive-ai
   muselsl stream
   ```
3. **Start the servers** as normal - EEG data will be automatically detected

### Webcam Only
The system works perfectly without EEG hardware:
- Webcam emotion detection will still work
- Dashboard shows simulated brainwave patterns
- All AI features remain functional

## 📋 System Requirements

- **Python**: 3.9+
- **Operating System**: macOS, Linux, Windows
- **Memory**: 8GB+ RAM (for AI model)
- **Storage**: 5GB+ free space (AI model download)
- **Hardware**: Webcam required, Muse 2 headset optional

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Package Version Conflicts
**Problem**: Error messages about TensorFlow, OpenCV, or NumPy versions

**Solutions**:
- Run `./setup.sh` again to reinstall with correct versions
- If using a different OS/architecture, package versions may need adjustment
- Check that you're using Python 3.9 (not 3.10+ or older versions)

#### Environment Activation Issues
**Problem**: `conda activate` not working

**Solutions**:
- Initialize conda: `conda init zsh` (or `bash`)
- Restart your terminal: `exec zsh`
- Use full path: `conda activate /path/to/envs/your-env-name`

#### Computer Vision Not Working
**Problem**: Face detection returns "neutral" for all frames

**Key Version Requirements**:
- OpenCV: Must be 4.11.0.86 (NOT 4.12.0+)
- TensorFlow: 2.19.0 with matching tf-keras
- NumPy: 2.0.2

**Quick Test**:
```bash
python -c "import cv2; print('OpenCV:', cv2.__version__); print('Has cv2.data:', hasattr(cv2, 'data'))"
```
Should show: `OpenCV: 4.11.0.86` and `Has cv2.data: True`

#### Model Download Issues
**Problem**: AI model fails to download (~4GB file)

**Solutions**:
- Ensure stable internet connection
- Check available disk space (5GB+ needed)
- Restart the application if download was interrupted

### Validation Commands

Test your installation:
```bash
# Test core imports
python -c "import cv2, tensorflow, deepface, gpt4all; print('✅ All packages working')"

# Test face detection
python -c "
import cv2
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
print('✅ Face detection ready:', not cascade.empty())
"
```

## 📁 Project Structure

```
bio-adaptive-ai-tutor/
├── setup.sh              # One-time environment setup
├── start_servers.sh       # Start application servers
├── environment.yml        # Conda environment specification
├── requirements.txt       # Python package dependencies
├── LLM_Server.py         # AI model server
├── face_analysis.py      # Computer vision server
├── read_eeg.py           # EEG processing server
├── index.html            # Main web interface
├── sketch.js             # p5.js visualization
├── panels.js             # Dashboard panels
└── ui_components.js      # UI components
```

## 🛠️ Development Notes

### Environment Strategy
- **Conda**: Creates Python 3.9 environment
- **Pip**: Installs all application packages (avoids conda/pip conflicts)
- **Versions**: Locked to tested combinations for stability

### Architecture
- **Frontend**: p5.js interactive dashboard
- **Backend**: Flask servers for AI and computer vision
- **Communication**: WebSocket for real-time data
- **AI Model**: Local Mistral 7B (first run downloads ~4GB)

### Custom Environment Names
You can use any environment name during setup:
```bash
# During setup, choose option 2 and enter your preferred name
./setup.sh

# Then activate with your custom name
conda activate my-custom-env-name
```

## 📊 Features

- **EEG Visualization**: Real-time brainwave patterns
- **Emotion Tracking**: Webcam-based facial emotion analysis
- **AI Chat**: Context-aware responses based on your state
- **Cognitive Metrics**: Attention, meditation, stress indicators
- **Learning Analytics**: Track your learning patterns over time

## 🤝 Contributing

This project uses specific package versions for stability. When contributing:
1. Test changes with the provided `setup.sh`
2. Ensure computer vision components work correctly
3. Verify EEG integration if you have hardware access

---

**Note**: First run downloads ~4GB AI model. Ensure stable internet connection and sufficient disk space. 