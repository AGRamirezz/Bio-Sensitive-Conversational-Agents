# Bio-Adaptive AI Tutor GUI Prototype (v0.2)

## Overview

This project implements an interactive dashboard for visualizing cognitive and emotional states in real-time. It's designed to display bio-signal data from EEG readings and computer vision, tracking engagement, attention, cognitive load, and emotional states.

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

## Technical Implementation

- Built with p5.js for interactive graphics and animations
- Uses circular gauges for cognitive metrics and a vertical bar graph for emotion
- Implements smooth animations and transitions between states
- Responsive design that adapts to different screen sizes

## Usage

1. Open the application in a web browser
2. Observe the real-time visualization of cognitive and emotional states
3. In demo mode, watch how the metrics change through different learning scenarios

## Future Development

- Integration with recorded EEG data
- Integration with real-time webcam based emotion detection
- Integration with API services (e.g., Hume, GPT-4, Llama, etc..)
- Additional visualization options and customization features
