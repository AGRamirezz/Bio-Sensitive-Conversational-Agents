# Gemini App Demo
This application acts as a Gemini based demonstration for introducing the topic of bio-adaptive AI Agent interactions. This application sets up a human-AI speech-to-speech interaction, where an AI Tutor is ready to answer any questions a learner may have. It uses webcam inputs to detect positive or negative sentiment from facial expressions. These detected states are then used to guide the behavior of the AI Tutor. 

## Run and deploy as an AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
