#!/bin/bash

# Bio-Adaptive AI Tutor - One-Time Setup Script
# This script sets up your environment and installs all dependencies

set -e  # Exit on any error

echo "========================================"
echo "   Bio-Adaptive AI Tutor Setup"
echo "========================================"
echo ""

# Step 1: Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "❌ Error: conda not found. Please install Anaconda or Miniconda first."
    echo "   Download from: https://conda.io/en/latest/miniconda.html"
    exit 1
fi

# Step 2: Interactive environment naming
echo "Environment Setup:"
echo "1. Use default name 'bio-adaptive-ai'"
echo "2. Choose a custom name"
echo ""
read -p "Select option (1 or 2): " choice

if [[ "$choice" == "2" ]]; then
    read -p "Enter your custom environment name: " env_name
else
    env_name="bio-adaptive-ai"
fi

echo ""
echo "Creating conda environment: $env_name"

# Step 3: Create conda environment
if conda info --envs | grep -q "^$env_name "; then
    echo "⚠️  Environment '$env_name' already exists."
    read -p "Remove and recreate? (y/n): " recreate
    if [[ "$recreate" =~ ^[Yy]$ ]]; then
        echo "Removing existing environment..."
        conda env remove -n "$env_name" -y
    else
        echo "Skipping environment creation."
        exit 1
    fi
fi

echo "Creating new environment..."
conda env create -f environment.yml -n "$env_name"

# Step 4: Activate environment and install packages
echo ""
echo "Installing Python packages..."
eval "$(conda shell.bash hook)"
conda activate "$env_name"

# Check if running on macOS and install Apple Silicon prerequisites first
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - installing Apple Silicon TensorFlow prerequisites..."
    pip install tensorflow-macos==2.16.2 tensorflow-metal==1.2.0
    echo "✅ Apple Silicon prerequisites installed"
fi

# Install all packages via pip
pip install -r requirements.txt

# Step 5: Validation tests
echo ""
echo "========================================"
echo "   Testing Installation"
echo "========================================"

# Test core imports
python -c "
import sys
print('✅ Python:', sys.version.split()[0])

try:
    import cv2
    print('✅ OpenCV:', cv2.__version__)
    print('✅ cv2.data available:', hasattr(cv2, 'data'))
    
    # Test face cascade
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print('✅ Face cascade loaded:', not cascade.empty())
except Exception as e:
    print('❌ OpenCV error:', e)
    sys.exit(1)

try:
    import tensorflow
    print('✅ TensorFlow:', tensorflow.__version__)
except Exception as e:
    print('❌ TensorFlow error:', e)
    sys.exit(1)

try:
    import deepface
    print('✅ DeepFace imported successfully')
except Exception as e:
    print('❌ DeepFace error:', e)
    sys.exit(1)

try:
    import gpt4all
    print('✅ GPT4All imported successfully')
except Exception as e:
    print('❌ GPT4All error:', e)
    sys.exit(1)

print('\\n🎉 All core packages installed successfully!')
"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "   Setup Complete!"
    echo "========================================"
    echo ""
    echo "Your environment '$env_name' is ready to use."
    echo ""
    echo "Next steps:"
    echo "1. Activate your environment: conda activate $env_name"
    echo "2. Start the application: ./start_servers.sh"
    echo ""
    echo "Note: The first run will download the AI model (~4GB)"
else
    echo ""
    echo "❌ Setup encountered errors. Please check the output above."
    exit 1
fi 