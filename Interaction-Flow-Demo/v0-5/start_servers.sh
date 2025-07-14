#!/bin/bash

# Start the servers
echo "Starting Bio-Adaptive AI Tutor v0.4 backend servers..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3."
    exit 1
fi

# Function to check if a package is installed
check_package_installed() {
    local pkg=$1
    local env_type=$2
    
    if [[ "$env_type" == "conda" ]]; then
        # Check in conda environment
        conda list | grep -q "^$pkg "
        return $?
    else
        # Check in venv/pip environment
        python3 -m pip list | grep -i "^$pkg " >/dev/null
        return $?
    fi
}

# Function to install missing packages from requirements.txt
install_missing_packages() {
    local env_type=$1
    local requirements_file="requirements.txt"
    
    echo "Checking for missing packages..."
    
    # Read requirements file
    if [ ! -f "$requirements_file" ]; then
        echo "Warning: $requirements_file not found."
        return
    fi
    
    local missing_packages=()
    
    while IFS= read -r pkg; do
        # Skip empty lines and comments
        [[ -z "$pkg" || "$pkg" =~ ^# ]] && continue
        
        # Extract the package name (remove version specifier if any)
        pkg_name=$(echo "$pkg" | cut -d'=' -f1 | cut -d'>' -f1 | cut -d'<' -f1 | cut -d'~' -f1 | tr -d ' ')
        
        # Check if package is installed
        if ! check_package_installed "$pkg_name" "$env_type"; then
            missing_packages+=("$pkg")
        fi
    done < "$requirements_file"
    
    # Install missing packages if any
    if [ ${#missing_packages[@]} -gt 0 ]; then
        echo "Installing missing packages: ${missing_packages[*]}"
        
        if [[ "$env_type" == "conda" ]]; then
            # For conda environments, use pip directly instead of trying conda install
            echo "Using pip to install packages in conda environment..."
            python3 -m pip install "${missing_packages[@]}"
        else
            # Install with pip for venv
            python3 -m pip install "${missing_packages[@]}"
        fi
    else
        echo "All required packages are already installed."
    fi
}

# Determine environment type and activate/create as needed
if [[ -n "$CONDA_PREFIX" ]]; then
    # Already in a conda environment
    echo "Using active conda environment: $CONDA_PREFIX"
    ENV_TYPE="conda"
    
    # Check and install missing packages
    install_missing_packages "$ENV_TYPE"
    
elif [[ -n "$VIRTUAL_ENV" ]]; then
    # Already in a virtual environment
    echo "Using active virtual environment: $VIRTUAL_ENV"
    ENV_TYPE="venv"
    
    # Check and install missing packages
    install_missing_packages "$ENV_TYPE"
    
elif command -v conda &> /dev/null && [[ -d "$HOME/miniforge3/envs/bio_agent1" || -d "$HOME/anaconda3/envs/bio_agent1" || -d "$HOME/miniconda3/envs/bio_agent1" ]]; then
    # Conda is installed and bio_agent1 environment exists but not activated
    echo "Found conda environment 'bio_agent1'. Activating..."
    
    # Try different potential conda locations
    if [[ -f "$HOME/miniforge3/etc/profile.d/conda.sh" ]]; then
        source "$HOME/miniforge3/etc/profile.d/conda.sh"
    elif [[ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]]; then
        source "$HOME/anaconda3/etc/profile.d/conda.sh"
    elif [[ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]]; then
        source "$HOME/miniconda3/etc/profile.d/conda.sh"
    else
        echo "Error: Could not find conda.sh to activate conda"
        exit 1
    fi
    
    conda activate bio_agent1
    ENV_TYPE="conda"
    
    # Check and install missing packages
    install_missing_packages "$ENV_TYPE"
    
elif [ -d "venv" ]; then
    # Local venv environment exists
    echo "Using existing virtual environment..."
    source venv/bin/activate
    ENV_TYPE="venv"
    
    # Check and install missing packages
    install_missing_packages "$ENV_TYPE"
    
else
    # No environment found, create a new venv
    echo "No environment found. Creating new virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    ENV_TYPE="venv"
    
    echo "Installing all dependencies..."
    python3 -m pip install -r requirements.txt
fi

# Start servers in separate terminals (MacOS specific)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # MacOS - use osascript to open new Terminal windows
    echo "Starting servers in new terminal windows..."
    if [[ "$ENV_TYPE" == "conda" && -n "$CONDA_PREFIX" ]]; then
        # For conda environments
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && conda activate ${CONDA_PREFIX##*/} && python LLM_Server.py\""
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && conda activate ${CONDA_PREFIX##*/} && python face_analysis.py\""
    else
        # For venv environments
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && source venv/bin/activate && python LLM_Server.py\""
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && source venv/bin/activate && python face_analysis.py\""
    fi
else
    # Linux/other - use different approach
    echo "Starting LLM server..."
    python LLM_Server.py &
    LLM_PID=$!
    
    echo "Starting Face Analysis server..."
    python face_analysis.py &
    FACE_PID=$!
    
    # Set up trap to kill servers on script exit
    trap "kill $LLM_PID $FACE_PID; exit" INT TERM EXIT
    
    # Wait for servers
    wait
fi

echo "Both servers started. Open index.html in your browser to use the application."
echo "Press Ctrl+C to stop the servers." 