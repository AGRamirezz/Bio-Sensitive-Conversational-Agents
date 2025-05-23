# Bio-Adaptive AI Tutor GUI Prototype (v0.4)

## Overview

This project implements an interactive dashboard representing cognitive and emotional states in real-time for Adaptive AI Agent responses. It's designed to display bio-signal data from computer vision emotion detection and simulate EEG readings, tracking engagement, attention, cognitive load, and emotional states. A preliminary integration with a local LLM for bio-adaptive responses has been added as an experimental feature.

## Environment Setup

### Using Conda Environment (Recommended)

1. **Set up the conda environment using the provided environment.yml file:**
   ```bash
   # Before using the environment.yml file, remove or update the prefix line to match your system
   # Open environment.yml and delete the 'prefix:' line or update it with your path
   
   # Create the environment from the YAML file
   conda env create -f environment.yml
   
   # Activate the environment
   conda activate bio_agent1
   
   # Install required packages
   pip install -r requirements.txt
   ```

2. **If you prefer to create the environment manually:**
   ```bash
   # Create a new conda environment
   conda create -n bio_agent1 python=3.9
   
   # Activate the environment
   conda activate bio_agent1
   
   # Install required packages
   pip install -r requirements.txt
   ```

3. **To export your environment (for sharing with others):**
   ```bash
   conda env export --from-history --no-builds > environment.yml
   ```

### Required Packages
The application requires the following Python packages:
- flask
- flask_cors
- requests
- gpt4all
- opencv-python
- pillow
- numpy
- deepface (optional, for enhanced emotion detection)

## Features

### 1. Bio-Signal Visualization System

- **EEG Monitor**: Displays simulated alpha, beta, theta, and delta wave patterns with real-time animation
- **Computer Vision**: Live webcam integration with facial emotion detection or simulated facial tracking
- **Cognitive Metrics Simulation**: Maps detected emotions to simulated engagement, attention, and cognitive load metrics

### 2. Cognitive State Tracking

The dashboard displays four key metrics:

- **Engagement**: Simulates the user's level of involvement with the content based on facial expressions
- **Attention**: Represents simulated focus and concentration levels derived from detected emotions
- **Cognitive Load**: Indicates simulated mental effort based on emotional state
- **Emotion**: Displays the current emotional state (happy, neutral, confused, frustrated) with intensity

### 3. Multiple Operating Modes

- **Autonomous Mode**: System autonomously simulates emotional and cognitive states
- **Demo Mode**: Simulates different learning scenarios with corresponding bio-signal patterns
- **Webcam Mode**: Uses real-time facial emotion detection to drive the cognitive state simulation

### 4. Dynamic State System

- **Responsive Emotional States**: The system dynamically adjusts emotional and cognitive states based on the active mode
- **Intelligent Transitions**: Changes follow a probability model based on current emotional state
- **Coherent Cognitive Metrics**: When emotional states change, engagement, attention, and cognitive load metrics shift accordingly
- **Realistic Bio-Signals**: Simulated EEG wave patterns and facial expressions update to match the emotional state
- **Contextual Telemetry**: System provides appropriate backend messages reflecting the state changes

### 5. AI Integration

- **Experimental LLM Server**: Python backend running a local Mistral model
- **Bio-adaptive response system**: Basic conditioning of AI responses based on user's cognitive state
- **Interactive chat interface**: Implementation of conversational interaction with the AI tutor

### 6. Webcam Integration

- **Live Emotion Detection**: Real-time analysis of facial expressions using computer vision
- **Adaptive Interface**: Webcam feed seamlessly replaces simulated face when enabled
- **Toggle Control**: Easy-to-use button to enable/disable webcam access
- **Privacy Focused**: All processing happens locally, no data is sent to external servers
- **Emotion-to-Metrics Mapping**: Translates detected emotions into simulated cognitive metrics

## Technical Implementation

- Built with p5.js for interactive graphics and animations
- Uses circular gauges for cognitive metrics and a vertical bar graph for emotion
- Implements smooth animations and transitions between states
- Responsive design that adapts to different screen sizes
- Python backend with Flask for the AI integration and face analysis

### Face Analysis Backend

- **OpenCV Integration**: Uses OpenCV for basic face detection
- **DeepFace Analysis**: Optional DeepFace integration for enhanced emotion detection
- **Asynchronous Processing**: Background thread handles image processing to maintain UI responsiveness
- **Efficient Communication**: Throttled API calls prevent overwhelming the server
- **Graceful Degradation**: Falls back to basic detection if advanced features unavailable

## Using the Webcam Feature

1. **Start the face analysis server:**
   - Use the provided `start_servers.sh` script to launch both backends
   - Or manually start `face_analysis.py` alongside the LLM server

2. **Enable the webcam:**
   - Click the "Enable Webcam" button in the top-right corner of the webcam panel
   - Grant browser permissions when prompted
   - Your webcam feed will replace the simulated face

3. **Real-time emotion detection:**
   - The system will analyze your facial expressions
   - Detected emotions influence the simulated cognitive state metrics
   - Watch how your real emotions affect the AI tutor's responses

4. **Disable when not needed:**
   - Click "Disable Webcam" to stop the feed and return to simulation
   - All webcam resources are properly released

## Usage

1. Open the application in a web browser
2. Observe the real-time visualization of cognitive and emotional states
3. Switch between operating modes:
   - Regular autonomous mode for simulated states
   - Demo mode for guided scenarios
   - Webcam mode for emotion-driven simulation
4. Interact with the AI and observe the dynamic state changes
5. Enable the webcam to use real facial emotion detection

### Starting All Services

For convenience, a startup script has been provided:

1. **Make the script executable:**
   ```bash
   chmod +x start_servers.sh
   ```

2. **Run the startup script:**
   ```bash
   ./start_servers.sh
   ```
   This will:
   - Set up the Python environment if needed
   - Start both the LLM server and face analysis server
   - Provide instructions for accessing the application

### Using the LLM Integration

1. **Ensure your conda environment is activated:**
   ```bash
   conda activate bio_agent1
   ```

2. **Start the Python servers:**
   ```bash
   python LLM_Server.py
   python face_analysis.py
   ```
   - First run will download the Mistral model (~4GB)
   - LLM server runs on http://localhost:5000
   - Face analysis server runs on http://localhost:5005

3. **Serve the p5.js application:**
   ```bash
   npx http-server . -c-1 -p 8000
   ```

4. **Open your browser to http://localhost:8000**

5. **Type messages in the chat box to interact with the AI tutor**
   - The system sends current cognitive/emotional state with each message
   - Responses are conditioned based on these bio-signals
   - Watch how the emotional and cognitive states dynamically respond to the conversation

## Future Development

- **Enhancement of AI Tutor Behavior**: Further refinement of prompt templates and cognitive conditioning
- **Integration with Real EEG Data**: Replace simulated metrics with actual EEG readings
- **Advanced Emotion Detection**: More sophisticated algorithms and personalized calibration
- **Multi-Person Support**: Detection and tracking of multiple faces in the frame
- **Eye Tracking Integration**: Additional biometric input for enhanced cognitive state assessment
- **Comprehensive Cognitive Modeling**: More nuanced and accurate cognitive state representation
