# Bio-Adaptive AI Tutor GUI Prototype (v0.3)

## Overview

This project implements an interactive dashboard for visualizing cognitive and emotional states in real-time. It's designed to display bio-signal data from EEG readings and computer vision, tracking engagement, attention, cognitive load, and emotional states. A preliminary integration with a local LLM for bio-adaptive responses has been added as an experimental feature.

## Features

### 1. Bio-Signal Input Visualization

- **EEG Monitor**: Displays alpha, beta, theta, and delta wave patterns with real-time animation
- **Computer Vision**: Simulates facial tracking with emotion detection capabilities

### 2. Cognitive State Tracking

The dashboard displays four key metrics:

- **Engagement**: Measures the user's level of involvement with the content
- **Attention**: Tracks focus and concentration levels
- **Cognitive Load**: Indicates mental effort and processing demands
- **Emotion**: Displays the current emotional state (happy, neutral, confused, frustrated) with intensity

### 3. Interactive Demo Mode

- Simulates different learning scenarios with corresponding bio-signal patterns
- Demonstrates how cognitive and emotional states change during different phases of learning

### 4. AI Integration (Preliminary)

- **Experimental LLM Server**: Python backend running a local Mistral model
- **Early bio-adaptive response system**: Basic conditioning of AI responses based on user's cognitive state
- **Proof-of-concept chat**: Initial implementation of interactive communication with the AI tutor

## Technical Implementation

- Built with p5.js for interactive graphics and animations
- Uses circular gauges for cognitive metrics and a vertical bar graph for emotion
- Implements smooth animations and transitions between states
- Responsive design that adapts to different screen sizes
- Python backend with Flask for the AI integration

## Usage

1. Open the application in a web browser
2. Observe the real-time visualization of cognitive and emotional states
3. In demo mode, watch how the metrics change through different learning scenarios

### Using the LLM Integration

1. Start the Python server:
   ```
   python LLM_Server.py
   ```
   - First run will download the Mistral model (~4GB)
   - Server runs on http://localhost:5000

2. Serve the p5.js application:
   ```
   npx http-server . -c-1 -p 8000
   ```

3. Open your browser to http://localhost:8000

4. Type messages in the chat box to interact with the AI tutor
   - The system sends current cognitive/emotional state with each message
   - Responses are conditioned based on these bio-signals

## TODO Items

- **Improve LLM Behavior**:
  - Add proper prompt templates to guide the LLM's role as a tutor
  - Refine the cognitive state conditioning logic
  - Implement conversation memory and context management
  - Set up telemetry stream as a live document for LLM chain-of-thought
  - Add proper error handling and recovery

- **Integration Improvements**:
  - Add server status indicator
  - Implement conversation reset functionality
  - Add model parameter controls

- **Future Development**:
  - Integration with recorded EEG data
  - Integration with real-time webcam based emotion detection
  - Additional visualization options and customization features
