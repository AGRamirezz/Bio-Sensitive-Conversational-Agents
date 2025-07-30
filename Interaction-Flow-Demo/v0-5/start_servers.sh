#!/bin/bash

# Bio-Adaptive AI Tutor - Start Servers Script
# This script starts the application servers (setup must be completed first)

set -e  # Exit on any error

echo "========================================"
echo "   Bio-Adaptive AI Tutor - Starting..."
echo "========================================"
echo ""

# Step 1: Check if we're in any Python environment
if [[ -z "$CONDA_DEFAULT_ENV" && -z "$VIRTUAL_ENV" ]]; then
    echo "❌ No Python environment detected."
    echo ""
    echo "Please activate your environment first:"
    echo "   conda activate your-environment-name"
    echo ""
    echo "If you haven't set up the environment yet, run:"
    echo "   ./setup.sh"
    echo ""
    exit 1
fi

# Display current environment
if [[ -n "$CONDA_DEFAULT_ENV" ]]; then
    echo "Using conda environment: $CONDA_DEFAULT_ENV"
elif [[ -n "$VIRTUAL_ENV" ]]; then
    echo "Using virtual environment: $(basename $VIRTUAL_ENV)"
fi

# Step 2: Quick validation that key packages are available
echo "Checking core dependencies..."
python -c "
try:
    import cv2, tensorflow, deepface, gpt4all
    print('✅ Core packages available')
except ImportError as e:
    print('❌ Missing dependency:', e)
    print('\\nPlease run ./setup.sh to install dependencies')
    exit(1)
" || exit 1

echo ""

# Step 3: Start servers
echo "Starting Bio-Adaptive AI Tutor servers..."
echo ""

# Ask user about EEG device
echo "EEG Device Setup:"
echo "Do you have a Muse 2 headset connected and ready? (y/n)"
read -p "Enter choice: " eeg_choice
echo ""

# Function to handle cleanup
cleanup() {
    echo ""
    echo "Shutting down servers..."
    
    # Kill tracked PIDs (more reliable for nohup processes)
    [[ -n "$llm_pid" ]] && kill $llm_pid 2>/dev/null || true
    [[ -n "$face_pid" ]] && kill $face_pid 2>/dev/null || true
    [[ -n "$muselsl_pid" ]] && kill $muselsl_pid 2>/dev/null || true
    [[ -n "$eeg_pid" ]] && kill $eeg_pid 2>/dev/null || true
    
    # Fallback: Kill background processes and specific patterns
    jobs -p | xargs -r kill 2>/dev/null || true
    pkill -f "LLM_Server.py" 2>/dev/null || true
    pkill -f "face_analysis.py" 2>/dev/null || true
    pkill -f "muselsl stream" 2>/dev/null || true
    pkill -f "read_eeg.py" 2>/dev/null || true
    
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start LLM Server
echo "🤖 Starting LLM Server (port 5000)..."
python LLM_Server.py &
llm_pid=$!

# Give LLM server time to start
sleep 3

# Start Face Analysis Server  
echo "📷 Starting Face Analysis Server (port 5005)..."
python face_analysis.py &
face_pid=$!

# Give face analysis server time to start
sleep 3

# Conditional EEG startup
if [[ "$eeg_choice" =~ ^[Yy]$ ]]; then
    echo "🧠 Starting EEG streaming with Muse 2..."
    echo "   Please ensure your Muse 2 headset is powered on and nearby"
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start muselsl stream with process isolation (nohup)
    echo "   Starting Muse LSL stream (isolated process)..."
    nohup muselsl stream > logs/muselsl.log 2>&1 &
    muselsl_pid=$!
    
    # Give muselsl more time to connect and establish stream
    echo "   Waiting for Muse device connection..."
    sleep 10
    
    # Start EEG Server with process isolation
    echo "🧠 Starting EEG Server (port 8765)..."
    nohup python read_eeg.py > logs/read_eeg.log 2>&1 &
    eeg_pid=$!
    sleep 3
    
    eeg_status="EEG Server: ws://localhost:8765 (with Muse 2)"
else
    echo "⏭️  Skipping EEG setup - running in webcam-only mode"
    eeg_status="EEG Server: Skipped (webcam-only mode)"
fi

echo ""
echo "========================================"
echo "   Servers Started Successfully!"
echo "========================================"
echo ""
echo "🌐 Next steps:"
echo "   1. Start frontend server: npx http-server . -c-1 -p 8000"
echo "   2. Open browser to: http://localhost:8000/index.html"
echo ""
echo "📊 Server Status:"
echo "   • LLM Server: http://localhost:5000"
echo "   • Face Analysis: http://localhost:5005"
echo "   • $eeg_status"
echo ""
echo "📋 Process Logs (if EEG enabled):"
echo "   • Muse LSL: logs/muselsl.log"
echo "   • EEG Server: logs/read_eeg.log"
echo ""
echo "⚠️  Note: First run will download AI model (~4GB)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for background processes 