from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import os
import requests
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Define model directory
model_dir = os.path.join(os.path.expanduser("~"), ".cache", "gpt4all")
os.makedirs(model_dir, exist_ok=True)

# Direct download a model
def download_model_direct():
    # Use a newer model in GGUF format
    model_name = "mistral-7b-instruct-v0.1.Q4_0.gguf"
    model_path = os.path.join(model_dir, model_name)
    
    # Check if model already exists
    if os.path.exists(model_path):
        logging.info(f"Model already exists at: {model_path}")
        return model_path
    
    # Direct download URL for a compatible model in GGUF format
    url = "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_0.gguf"
    
    logging.info(f"Downloading model from {url}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024 * 1024  # 1MB
        
        with open(model_path, 'wb') as f:
            for i, chunk in enumerate(response.iter_content(chunk_size=block_size)):
                if chunk:
                    f.write(chunk)
                    # Log progress
                    if i % 10 == 0 and total_size > 0:
                        downloaded = i * block_size
                        percent = (downloaded / total_size) * 100
                        logging.info(f"Downloaded: {percent:.1f}% ({downloaded/(1024*1024):.1f}MB/{total_size/(1024*1024):.1f}MB)")
        
        logging.info(f"Model downloaded successfully to {model_path}")
        return model_path
    
    except Exception as e:
        logging.error(f"Error downloading model: {str(e)}")
        return None

# Download model and initialize
try:
    model_path = download_model_direct()
    
    if model_path and os.path.exists(model_path):
        # Import GPT4All only after confirming model exists
        from gpt4all import GPT4All
        model = GPT4All(model_path)
        model_name = os.path.basename(model_path)
        logging.info(f"Model loaded successfully: {model_name}")
    else:
        logging.error("Could not download or find model")
        model = None
        model_name = None
except Exception as e:
    logging.error(f"Error initializing model: {str(e)}")
    model = None
    model_name = None

# Store conversation history
conversation_history = []

@app.route('/api/status', methods=['GET'])
def status():
    """Endpoint to check if the model is loaded and ready"""
    return jsonify({
        'status': 'ready' if model is not None else 'error',
        'model': model_name if model is not None else None,
        'error': None if model is not None else "Model failed to load"
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    # Check if model is loaded
    if model is None:
        return jsonify({
            'error': 'Model not loaded. Check server logs for details.',
            'timestamp': time.time()
        }), 503  # Service Unavailable
    
    data = request.json
    user_message = data.get('message', '')
    cognitive_state = data.get('cognitive_state', {})
    
    # Add user message to history
    conversation_history.append(f"User: {user_message}")
    
    # Adjust LLM parameters based on bio-signals
    temperature = 0.7  # Default
    top_p = 0.95       # Default
    
    # Example conditionings based on emotional state
    if cognitive_state.get('emotion') == 'frustrated':
        # More focused responses for frustrated users
        temperature = 0.5
        top_p = 0.85
    elif cognitive_state.get('emotion') == 'happy':
        # More creative responses for happy users
        temperature = 0.8
        top_p = 0.98
    
    # Adjust based on engagement
    engagement = cognitive_state.get('engagement', 0.5)
    max_tokens = int(256 * (0.5 + engagement/2))  # 128-256 tokens
    
    # Format conversation for context
    prompt = "\n".join(conversation_history[-5:])  # Last 5 messages
    prompt += "\nAI Instructor: "
    
    try:
        # Generate response with GPT4All
        ai_response = model.generate(
            prompt, 
            max_tokens=max_tokens,
            temp=temperature,
            top_p=top_p
        )
        
        # Add AI response to history
        conversation_history.append(f"AI Instructor: {ai_response}")
        
        return jsonify({
            'message': ai_response,
            'timestamp': time.time(),
            'parameters_used': {
                'temperature': temperature,
                'top_p': top_p,
                'max_tokens': max_tokens,
                'emotion_detected': cognitive_state.get('emotion'),
                'model': model_name
            }
        })
    except Exception as e:
        logging.error(f"Error generating response: {str(e)}")
        return jsonify({
            'error': f"Error generating response: {str(e)}",
            'timestamp': time.time()
        }), 500

@app.route('/api/reset', methods=['POST'])
def reset_conversation():
    global conversation_history
    conversation_history = []
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
