from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import os
import requests
import logging
import json

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Define model directory
model_dir = os.path.join(os.path.expanduser("~"), ".cache", "gpt4all")
os.makedirs(model_dir, exist_ok=True)

# Define the instructor prompt template
INSTRUCTOR_PROMPT = """
You are an AI technical instructor helping professionals learn new skills.
Your approach is:
- Clear, concise explanations with practical examples
- Patient, encouraging tone
- Breaking complex topics into manageable parts

When the learner seems:
- Confused or frustrated: Simplify explanations and offer encouragement
- Engaged and focused: Maintain current complexity and positive reinforcement
- Showing high cognitive load: Slow down, simplify, and check understanding

Always respond in a supportive, educational manner.
"""

# Set default LLM parameters based on best practices for instruction
DEFAULT_TEMPERATURE = 0.6  # Increased from 0.5 to allow more flexibility for emotional acknowledgment
DEFAULT_TOP_P = 0.85       # Reduced from 0.9 to narrow token selection and reduce tangential responses
DEFAULT_MAX_TOKENS = 325   # Adjusted to discourage overly long responses that might drift into self-talk

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

# Store last request timestamp for rate limiting
last_request_time = 0

# Store last AI response timestamp for conversation context
last_ai_response_time = 0

# Process biometric snapshot to generate LLM context
def process_biometric_snapshot(snapshot):
    """
    Process a biometric snapshot into a structured context string for the LLM.
    This function analyzes the snapshot data and creates a description of the
    user's current cognitive and emotional state.
    
    Args:
        snapshot: The biometric snapshot object from the frontend
        
    Returns:
        str: A formatted string describing the user's state
    """
    if not snapshot or not isinstance(snapshot, dict):
        return ""
    
    try:
        # Extract core information
        emotion = snapshot.get('emotion', {}).get('name', 'neutral')
        emotion_intensity = snapshot.get('emotion', {}).get('intensity', 0.5)
        engagement = snapshot.get('metrics', {}).get('engagement', 0.5)
        attention = snapshot.get('metrics', {}).get('attention', 0.5)
        cognitive_load = snapshot.get('metrics', {}).get('cognitive_load', 0.5)
        source = snapshot.get('metadata', {}).get('source', 'unknown')
        
        # Determine confidence if available
        confidence = None
        if 'webcam' in snapshot and source == 'webcam':
            confidence = snapshot['webcam'].get('confidence', None)
        
        # Classify each metric as low, medium, or high
        def classify_level(value):
            if value < 0.35:
                return "low"
            elif value < 0.7:
                return "moderate"
            else:
                return "high"
        
        # Analyze user's state
        engagement_level = classify_level(engagement)
        attention_level = classify_level(attention)
        cognitive_load_level = classify_level(cognitive_load)
        emotion_level = "mild" if emotion_intensity < 0.4 else ("moderate" if emotion_intensity < 0.7 else "strong")
        
        # Build context description with enhanced directives
        context_parts = []
        
        # Add emotion context
        if confidence is not None:
            confidence_desc = f"{int(confidence * 100)}% confidence" if confidence <= 1.0 else f"{int(confidence)}% confidence"
            context_parts.append(f"The learner appears {emotion} (with {confidence_desc}) with {emotion_level} intensity.")
        else:
            context_parts.append(f"The learner appears {emotion} with {emotion_level} intensity.")
        
        # Add cognitive metrics context
        context_parts.append(f"They show {engagement_level} engagement, {attention_level} attention, and {cognitive_load_level} cognitive load.")
        
        # Add enhanced specific directives based on state
        if cognitive_load_level == "high":
            context_parts.append("REQUIRED: Begin your response by acknowledging their cognitive load. Say something like 'I can see this is mentally demanding right now...' then use simpler explanations with concrete examples.")
        
        if attention_level == "low":
            context_parts.append("REQUIRED: Begin your response by acknowledging their attention state. Say something like 'I notice your attention might be wandering...' then use more engaging examples and shorter explanations.")
        
        if emotion in ["confused", "frustrated", "angry"]:
            context_parts.append(f"REQUIRED: Begin your response by directly acknowledging that they seem {emotion}. Say something like 'I can see you're feeling {emotion} about this...' then offer reassurance that this topic can be challenging.")
        
        if emotion == "sad":
            context_parts.append("REQUIRED: Begin your response by acknowledging their emotional state with empathy. Say something like 'I notice you seem discouraged...' then use encouraging language and emphasize that making progress takes time.")
        
        if emotion == "fear":
            context_parts.append("REQUIRED: Begin your response by acknowledging their apprehension. Say something like 'I can see you might be apprehensive about this...' then provide reassurance and break down concepts into manageable pieces.")
        
        if emotion == "happy" and engagement_level == "high":
            context_parts.append("REQUIRED: Begin your response by acknowledging their positive state. Say something like 'I can see you're really engaged with this material...' then build on their momentum with slightly more advanced content.")
        
        if emotion == "neutral":
            # For neutral emotion, focus on cognitive metrics instead
            if engagement_level == "low":
                context_parts.append("REQUIRED: While they appear neutral, their engagement is low. Begin with something like 'I notice your engagement might be waning...' then try to spark interest with a relevant example.")
            elif cognitive_load_level == "high":
                context_parts.append("REQUIRED: While they appear neutral, their cognitive load is high. Begin with something like 'I can see this is quite demanding cognitively...' then simplify your explanation.")
        
        # Combine all parts
        return "\n".join(context_parts)
        
    except Exception as e:
        logging.error(f"Error processing biometric snapshot: {str(e)}")
        return "Learner's biometric data available but could not be processed."

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
    global last_request_time, conversation_history, last_ai_response_time
    
    # Check if model is loaded
    if model is None:
        return jsonify({
            'error': 'Model not loaded. Check server logs for details.',
            'timestamp': time.time()
        }), 503  # Service Unavailable
    
    # Rate limiting check (2 second minimum between requests)
    current_time = time.time()
    time_since_last_request = current_time - last_request_time
    if time_since_last_request < 2.0:
        wait_time = 2.0 - time_since_last_request
        logging.info(f"Rate limiting: Request too soon. Wait {wait_time:.2f} seconds.")
        return jsonify({
            'error': f'Please wait a moment before sending another message.',
            'timestamp': current_time,
            'retry_after': wait_time
        }), 429  # Too Many Requests
    
    # Update last request time
    last_request_time = current_time
    
    # Calculate time since last AI response (for conversation flow context)
    time_since_last_ai_response = current_time - last_ai_response_time if last_ai_response_time > 0 else 0
    
    data = request.json
    user_message = data.get('message', '')
    cognitive_state = data.get('cognitive_state', {})
    biometric_snapshot = data.get('biometric_snapshot', None)
    
    # Enhanced logging for emotion processing debugging
    logging.info(f"📩 RECEIVED MESSAGE: '{user_message}'")
    logging.info(f"🧠 COGNITIVE STATE: {json.dumps(cognitive_state, indent=2)}")
    if biometric_snapshot:
        logging.info(f"📊 BIOMETRIC SNAPSHOT: {json.dumps(biometric_snapshot, indent=2)}")
        emotion_data = biometric_snapshot.get('emotion', {})
        logging.info(f"🎭 EMOTION FROM SNAPSHOT: {emotion_data.get('name')} (intensity: {emotion_data.get('intensity')})")
    else:
        logging.info("❌ NO BIOMETRIC SNAPSHOT PROVIDED")
    
    # Log received data for debugging (excluding large fields)
    log_data = {
        'message': user_message,
        'cognitive_state': cognitive_state,
        'has_biometric_snapshot': biometric_snapshot is not None
    }
    logging.info(f"Received chat request: {json.dumps(log_data)}")
    
    # Add user message to history
    conversation_history.append(f"User: {user_message}")
    
    # Adjust LLM parameters based on bio-signals
    temperature = DEFAULT_TEMPERATURE
    top_p = DEFAULT_TOP_P
    max_tokens = DEFAULT_MAX_TOKENS
    
    # Example conditionings based on emotional state
    if cognitive_state.get('emotion') == 'frustrated':
        # More focused responses for frustrated users
        temperature = 0.55  # Adjusted to maintain acknowledgment flexibility
        top_p = 0.8
    elif cognitive_state.get('emotion') == 'happy':
        # More creative responses for happy users
        temperature = 0.65  # Adjusted to maintain acknowledgment flexibility
        top_p = 0.9
    
    # Adjust based on engagement
    engagement = cognitive_state.get('engagement', 0.5)
    # Scale tokens between 275-325 based on engagement (narrower range to reduce self-talk)
    max_tokens = int(275 + (engagement * 50))
    
    # Process biometric data for context
    biometric_context = ""
    emotion = "neutral"  # Default emotion
    emotion_intensity = 0.5  # Default intensity
    cognitive_load_level = "moderate"  # Default cognitive load
    
    logging.info("🔄 PROCESSING BIOMETRIC DATA FOR LLM CONTEXT...")
    
    if biometric_snapshot:
        logging.info("✅ Using biometric snapshot for context generation")
        biometric_context = process_biometric_snapshot(biometric_snapshot)
        logging.info(f"📝 GENERATED BIOMETRIC CONTEXT: {biometric_context}")
        
        # Extract emotion and intensity for mandatory acknowledgment
        emotion = biometric_snapshot.get('emotion', {}).get('name', 'neutral')
        emotion_intensity = biometric_snapshot.get('emotion', {}).get('intensity', 0.5)
        
        logging.info(f"🎯 EXTRACTED FOR LLM: emotion={emotion}, intensity={emotion_intensity}")
        
        # Get cognitive load level
        cognitive_load = biometric_snapshot.get('metrics', {}).get('cognitive_load', 0.5)
        if cognitive_load < 0.35:
            cognitive_load_level = "low"
        elif cognitive_load < 0.7:
            cognitive_load_level = "moderate"
        else:
            cognitive_load_level = "high"
            
        logging.info(f"🧠 COGNITIVE LOAD LEVEL: {cognitive_load_level} (raw: {cognitive_load})")
            
    elif cognitive_state:
        logging.info("⚠️ Falling back to simple cognitive state (no biometric snapshot)")
        # Fallback to simple cognitive state if no snapshot
        emotion = cognitive_state.get('emotion', 'neutral')
        engagement_level = cognitive_state.get('engagement', 0.5)
        attention_level = cognitive_state.get('attention', 0.5)
        cognitive_load = cognitive_state.get('cognitiveLoad', 0.5)
        
        biometric_context = f"The learner currently appears {emotion} with engagement level {engagement_level:.2f}, attention level {attention_level:.2f}, and cognitive load {cognitive_load:.2f}."
        # Add basic acknowledgment requirement for fallback
        biometric_context += f"\nREQUIRED: Begin your response by acknowledging their {emotion} state before answering their question."
        
        logging.info(f"📝 FALLBACK CONTEXT GENERATED: {biometric_context}")
    else:
        logging.warning("❌ NO BIOMETRIC DATA OR COGNITIVE STATE PROVIDED - USING DEFAULTS")
    
    # Format conversation for context with instructor prompt
    recent_history = "\n".join(conversation_history[-5:])  # Last 5 messages
    
    # Add conversation flow context if available
    conversation_flow_context = ""
    if time_since_last_ai_response > 0:
        # Add note about how long the user took to respond
        if time_since_last_ai_response < 5:
            conversation_flow_context = "The learner responded very quickly."
        elif time_since_last_ai_response < 15:
            conversation_flow_context = "The learner took a brief moment to respond."
        elif time_since_last_ai_response < 60:
            conversation_flow_context = "The learner took some time to consider before responding."
        else:
            conversation_flow_context = f"The learner took {int(time_since_last_ai_response)} seconds before responding."
    
    # Restructured prompt order for better instruction hierarchy
    prompt = f"{INSTRUCTOR_PROMPT}\n\n"
    
    # 1. MANDATORY acknowledgment instruction (highest priority)
    mandatory_acknowledgment = """
MANDATORY FIRST STEP: Your response MUST begin with acknowledging the learner's emotional state.
Use one of these required formats:
- "I can see you're feeling [emotion]..."
- "I notice you seem [emotion] about this..."  
- "It looks like you're [emotion] with this topic..."

Only after this acknowledgment, proceed to answer their question.

RESPONSE SEQUENCE:
1. FIRST: Acknowledge emotional state
2. THEN: Answer the user's question  
3. END: Do not add follow-up questions

BOUNDARIES: Respond only to the user's question. Do not generate follow-up questions or continue the conversation with yourself.
"""
    
    prompt += mandatory_acknowledgment + "\n"
    
    # 2. Biometric context (provides specific data)
    if biometric_context:
        prompt += f"Learner's Current State:\n{biometric_context}\n\n"
        
        # 3. Add emphasis for non-neutral emotions (neutral requires higher threshold)
        if emotion != 'neutral':
            prompt += f"IMPORTANT: Make sure to acknowledge the learner's {emotion} state prominently in your first sentence.\n\n"
        elif emotion == 'neutral' and emotion_intensity > 0.6:
            prompt += f"IMPORTANT: Make sure to acknowledge the learner's {emotion} state prominently in your first sentence.\n\n"
    
    # 4. Conversation flow context
    if conversation_flow_context:
        prompt += f"{conversation_flow_context}\n"
    
    # 5. Recent conversation history
    prompt += f"Recent conversation:\n{recent_history}\n"
    
    # 6. Clear separator for the actual response
    prompt += "AI Instructor: "
    
    logging.info(f"Generating response with temp={temperature}, top_p={top_p}, max_tokens={max_tokens}")
    
    try:
        # Generate response with GPT4All
        ai_response = model.generate(
            prompt, 
            max_tokens=max_tokens,
            temp=temperature,
            top_p=top_p
        )
        
        # Update last AI response time
        last_ai_response_time = time.time()
        
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
    global conversation_history, last_ai_response_time
    conversation_history = []
    last_ai_response_time = 0
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
