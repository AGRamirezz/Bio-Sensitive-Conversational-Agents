# Bio-Adaptive AI Tutor GUI Prototype

This prototype demonstrates how real-time bio-signal monitoring can enhance AI tutoring by modifying an AI's chain-of-thought reasoning based on detected cognitive-emotional states. This demo focuses on the visual UI of the behind-the-scenes of the system telemetry and behavior. 

## Overview

The system visualizes:
- EEG waveforms and brain activity patterns
- Emotional state transitions (neutral, confused, frustrated, happy)
- System telemetry showing real-time bio-signal processing
- Simulated dialogue between a user and an AI tutor

## Getting Started

### Local Setup

1. **Download the Files**
   - Download `index.html`, `interaction_flow_demo.js`, and `p5.js` files
   - Keep all files in the same directory

2. **Run Locally**
   - Open `index.html` in a modern web browser
   - No server required - it runs entirely in the browser

### Web Interpreter Setup

1. **p5.js Web Editor**
   - Go to [p5.js Web Editor](https://editor.p5js.org/)
   - Create a new project
   - Copy the contents of `interaction_flow_demo.js` into the sketch.js file
   - Run the sketch

2. **CodePen or JSFiddle**
   - Create a new pen/fiddle
   - Add p5.js in the JavaScript settings
   - Copy the contents of `interaction_flow_demo.js`
   - Run the project

## Using the Prototype

- **Demo Mode**: Click the "Start Demo" button to see a scripted demonstration of emotional transitions
- **Next Scene**: Progress through different emotional states and interactions
- **Reset**: Return to the initial state
- **Chat**: Type in the input field to interact with the simulated AI tutor

## Key Features

- **Real-time Visualization**: See how EEG patterns change with different emotional states
- **Adaptive Responses**: Observe how the AI tutor modifies its approach based on detected emotions
- **System Telemetry**: Monitor the backend processing of bio-signals and emotional state transitions

## Technical Notes

- Built with p5.js for interactive visualizations
- Simulates EEG patterns based on research into cognitive-emotional states
- Demonstrates a narrative progression from confusion to understanding
- All bio-signal data is simulated for demonstration purposes

## Future Development

This prototype illustrates the telemetry of the bio-adaptive AI tutoring concept. Future development will focus on refining the UI and interaction flow. Other demos will focus on using this as a lauching pad for different development layers such as including the backend wearable hardware connection, API calls to open source LLMs and LLM based Agents, and inference level reasoning processing of Human-AI Agent interactions. 
