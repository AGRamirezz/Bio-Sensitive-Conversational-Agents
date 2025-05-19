import cv2
import base64
import numpy as np
import io
import traceback
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time
from threading import Thread, Lock
import queue
import os
import sys

# Add helper function to convert NumPy types to Python types for JSON serialization
def convert_to_json_serializable(obj):
    """Convert NumPy types to Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list) or isinstance(obj, tuple):
        return [convert_to_json_serializable(i) for i in obj]
    else:
        return obj

# Set up more detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Add a file handler to save logs
try:
    os.makedirs('logs', exist_ok=True)
    file_handler = logging.FileHandler('logs/face_analysis.log')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logging.getLogger().addHandler(file_handler)
    logging.info("Started logging to logs/face_analysis.log")
except Exception as e:
    logging.error(f"Failed to set up file logging: {str(e)}")

# Optional: Import DeepFace if available
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    logging.info("DeepFace successfully imported")
except ImportError:
    DEEPFACE_AVAILABLE = False
    logging.warning("DeepFace not installed. Running with basic face detection only.")

app = Flask(__name__)
CORS(app)

# Queue for processing frames asynchronously
frame_queue = queue.Queue(maxsize=1)  # Only keep the latest frame
results_cache = {"timestamp": 0, "result": None}
processing_lock = Lock()

# Add history tracking for emotion results
results_history = []  # List of (timestamp, result) tuples
results_history_max_size = 100  # Maximum history size
results_history_lock = Lock()  # Separate lock for history operations

# Load pre-trained face detection model
try:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if face_cascade.empty():
        logging.error("Failed to load cascade classifier")
    else:
        logging.info("Face cascade classifier loaded successfully")
except Exception as e:
    logging.error(f"Error loading face cascade: {str(e)}")
    face_cascade = None

def process_frame_worker():
    """Worker thread to process frames from the queue"""
    logging.info("Frame processing worker started")
    while True:
        try:
            # Get frame from queue (blocking)
            frame_data = frame_queue.get()
            if frame_data is None:  # None is our signal to stop
                break
                
            # Process the frame for face detection and emotion analysis
            try:
                with processing_lock:
                    start_time = time.time()
                    result = analyze_face(frame_data)
                    processing_time = time.time() - start_time
                    
                    # Log processing results
                    faces_detected = result.get('faces_detected', 0)
                    emotion = result.get('emotion', 'unknown')
                    logging.info(f"Processed frame in {processing_time:.3f}s: faces_detected={faces_detected}, emotion={emotion}")
                    
                    # Update cache with results
                    results_cache["timestamp"] = time.time()
                    results_cache["result"] = result
                    
                    # Add to history with a separate lock
                    with results_history_lock:
                        results_history.append((results_cache["timestamp"], result))
                        
                        # Trim history if needed
                        if len(results_history) > results_history_max_size:
                            results_history = results_history[-results_history_max_size:]
            except Exception as e:
                logging.error(f"Error processing frame: {str(e)}")
                logging.error(traceback.format_exc())
                # Still update the cache with an error result
                with processing_lock:
                    results_cache["timestamp"] = time.time()
                    results_cache["result"] = {
                        "faces_detected": 0,
                        "emotion": "neutral",
                        "emotions": {"neutral": 1.0},
                        "error": f"Processing error: {str(e)}"
                    }
                
            # Mark task as done
            frame_queue.task_done()
        except Exception as e:
            logging.error(f"Error in processing thread: {str(e)}")
            logging.error(traceback.format_exc())
            # Try to mark the task as done if possible
            try:
                frame_queue.task_done()
            except Exception:
                pass

def decode_image(base64_string):
    """Decode base64 image to numpy array for OpenCV processing"""
    try:
        if not base64_string:
            logging.error("Empty base64 string")
            return np.zeros((100, 100, 3), dtype=np.uint8)
            
        if ',' in base64_string:
            # Remove data URL prefix if present
            parts = base64_string.split(',')
            if len(parts) != 2:
                logging.error(f"Invalid data URL format: {base64_string[:30]}...")
                return np.zeros((100, 100, 3), dtype=np.uint8)
            base64_string = parts[1]
        
        # Decode base64
        try:
            image_bytes = base64.b64decode(base64_string)
        except Exception as e:
            logging.error(f"Base64 decoding error: {str(e)}")
            return np.zeros((100, 100, 3), dtype=np.uint8)
        
        # Open as PIL Image
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logging.error(f"PIL Image open error: {str(e)}")
            return np.zeros((100, 100, 3), dtype=np.uint8)
            
        # Convert to numpy array
        try:
            np_image = np.array(image)
            if len(np_image.shape) < 3:  # Convert grayscale to RGB if needed
                np_image = cv2.cvtColor(np_image, cv2.COLOR_GRAY2BGR)
            elif np_image.shape[2] == 4:  # Convert RGBA to RGB if needed
                np_image = cv2.cvtColor(np_image, cv2.COLOR_RGBA2BGR)
            else:
                np_image = cv2.cvtColor(np_image, cv2.COLOR_RGB2BGR)
            return np_image
        except Exception as e:
            logging.error(f"Image conversion error: {str(e)}")
            return np.zeros((100, 100, 3), dtype=np.uint8)
    except Exception as e:
        logging.error(f"Error decoding image: {str(e)}")
        logging.error(traceback.format_exc())
        # Return a small black image as fallback
        return np.zeros((100, 100, 3), dtype=np.uint8)

def analyze_face(image_data):
    """Analyze face in image: detect faces and emotions"""
    try:
        # Validate input
        if not image_data or not isinstance(image_data, str):
            logging.error("Invalid image data received")
            return {
                "faces_detected": 0,
                "emotion": "neutral",
                "emotions": {"neutral": 1.0},
                "error": "Invalid image data"
            }
        
        logging.debug(f"Processing image data of length {len(image_data)}")
        
        # Decode the image
        img = decode_image(image_data)
        
        # Check if image is valid
        if img is None or img.size == 0:
            logging.error("Failed to decode image")
            return {
                "faces_detected": 0,
                "emotion": "neutral",
                "emotions": {"neutral": 1.0},
                "error": "Failed to decode image"
            }
        
        logging.debug(f"Image decoded successfully: shape={img.shape}")
        
        # Detect faces using OpenCV
        if face_cascade is None:
            logging.error("Face cascade not available")
            faces = []
        else:
            try:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                logging.debug(f"Detected {len(faces)} faces")
            except Exception as e:
                logging.error(f"Error in face detection: {str(e)}")
                faces = []
        
        # Return basic face detection if DeepFace not available or no faces detected
        if not DEEPFACE_AVAILABLE or len(faces) == 0:
            return {
                "faces_detected": len(faces),
                "emotion": "neutral",  # Default emotion 
                "emotions": {"neutral": 1.0},
                "face_locations": [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces]
            }
        
        # Process with DeepFace for the first detected face
        try:
            x, y, w, h = faces[0]
            face_img = img[y:y+h, x:x+w]  # Extract the face region
            
            # Ensure face region is valid before proceeding
            if face_img.size == 0 or face_img is None:
                logging.error("Extracted face region is empty or invalid")
                return {
                    "faces_detected": len(faces),
                    "emotion": "neutral",
                    "emotions": {"neutral": 1.0},
                    "face_locations": [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces]
                }
            
            # Log face region dimensions for debugging
            logging.debug(f"Face region dimensions: {face_img.shape}")
            
            # Try to analyze emotions with DeepFace with better error handling
            try:
                analysis = DeepFace.analyze(
                    face_img, 
                    actions=['emotion'],
                    enforce_detection=False,  # Don't enforce face detection (already detected)
                    detector_backend='opencv'
                )
                
                # Get the emotions dictionary (first face if multiple)
                emotions = analysis[0]['emotion'] if isinstance(analysis, list) else analysis['emotion']
                
                # Get the dominant emotion
                dominant_emotion = max(emotions, key=emotions.get)
                logging.debug(f"Detected emotion: {dominant_emotion}")
                
                # Convert NumPy values to standard Python types for JSON serialization
                emotions = convert_to_json_serializable(emotions)
                
                return {
                    "faces_detected": len(faces),
                    "emotion": dominant_emotion,
                    "emotions": emotions,
                    "face_locations": [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces]
                }
            except Exception as e:
                logging.error(f"DeepFace analysis error: {str(e)}")
                logging.error(traceback.format_exc())
                # Still return face detection results even if emotion analysis failed
                return {
                    "faces_detected": len(faces),
                    "emotion": "neutral",
                    "emotions": {"neutral": 1.0},
                    "face_locations": [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces],
                    "error": f"Emotion analysis error: {str(e)}"
                }
        except Exception as e:
            logging.error(f"Error in face processing: {str(e)}")
            logging.error(traceback.format_exc())
            return {
                "faces_detected": len(faces) if isinstance(faces, list) else 0,
                "emotion": "neutral",
                "emotions": {"neutral": 1.0},
                "face_locations": [[int(x), int(y), int(w), int(h)] for (x, y, w, h) in faces] if isinstance(faces, list) and len(faces) > 0 else [],
                "error": str(e)
            }
    except Exception as e:
        logging.error(f"Error analyzing face: {str(e)}")
        logging.error(traceback.format_exc())
        return {
            "faces_detected": 0,
            "emotion": "neutral",
            "emotions": {"neutral": 1.0},
            "error": str(e)
        }

@app.route('/api/detect-face', methods=['POST'])
def detect_face():
    """Endpoint to detect faces and emotions in an image"""
    try:
        if not request.json:
            logging.error("No JSON data in request")
            return jsonify({"error": "No JSON data provided"}), 400
            
        if 'image' not in request.json:
            logging.error("No 'image' field in request JSON")
            return jsonify({"error": "No image provided"}), 400
            
        image_data = request.json['image']
        
        # Validate image data
        if not isinstance(image_data, str):
            logging.error(f"Invalid image format: {type(image_data)}")
            return jsonify({"error": "Invalid image format"}), 400
            
        # Log some basic info about the request
        logging.debug(f"Received image data of length: {len(image_data)}")
        logging.debug(f"Image data starts with: {image_data[:30]}...")
            
        # Check if we should process now or queue for background processing
        process_now = request.json.get('sync', False)
        
        if process_now:
            # Synchronous processing
            logging.debug("Processing synchronously")
            try:
                result = analyze_face(image_data)
                logging.debug(f"Analysis result: faces_detected={result.get('faces_detected', 0)}, emotion={result.get('emotion', 'unknown')}")
                return jsonify(convert_to_json_serializable(result))
            except Exception as e:
                logging.error(f"Error in synchronous processing: {str(e)}")
                logging.error(traceback.format_exc())
                return jsonify({"error": f"Processing error: {str(e)}"}), 500
        else:
            # Asynchronous processing (put in queue)
            logging.debug("Processing asynchronously")
            try:
                # Put frame in queue, replace previous frame if queue full
                if frame_queue.full():
                    # Remove old frame first
                    try:
                        frame_queue.get_nowait()
                        frame_queue.task_done()
                        logging.debug("Removed old frame from queue")
                    except queue.Empty:
                        logging.debug("Queue was unexpectedly empty")
                        pass
                        
                frame_queue.put_nowait(image_data)
                logging.debug("Added frame to processing queue")
                
                # Return the latest cached result
                with processing_lock:
                    if results_cache["result"] is None:
                        logging.debug("No cached result available yet")
                        return jsonify({
                            "status": "processing",
                            "timestamp": time.time()
                        })
                    else:
                        # Returning cached result
                        result = results_cache["result"]
                        logging.debug(f"Returning cached result: faces_detected={result.get('faces_detected', 0)}, emotion={result.get('emotion', 'unknown')}")
                        return jsonify({
                            "status": "success",
                            "timestamp": results_cache["timestamp"],
                            "result": convert_to_json_serializable(results_cache["result"])
                        })
            except queue.Full:
                logging.error("Frame queue is full")
                return jsonify({
                    "error": "Server is busy processing frames",
                    "timestamp": time.time()
                }), 503
            except Exception as e:
                logging.error(f"Error in asynchronous processing: {str(e)}")
                logging.error(traceback.format_exc())
                return jsonify({"error": f"Queue processing error: {str(e)}"}), 500
    except Exception as e:
        logging.error(f"Unhandled error in detect-face endpoint: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/emotion-status', methods=['GET'])
def emotion_status():
    """Get the latest cached emotion analysis"""
    with processing_lock:
        if results_cache["result"] is None:
            return jsonify({
                "status": "no_data",
                "timestamp": time.time()
            })
        else:
            return jsonify({
                "status": "success",
                "timestamp": results_cache["timestamp"],
                "result": convert_to_json_serializable(results_cache["result"])
            })

@app.route('/api/emotion-aggregate', methods=['GET'])
def emotion_aggregate():
    """Get aggregated emotion data over the last few seconds"""
    # Time window in seconds
    window_seconds = float(request.args.get('window', 5))
    
    # Get timestamps from last N seconds
    now = time.time()
    min_time = now - window_seconds
    
    # Filter the results cache by time
    with results_history_lock:
        # Filter and collect results from cache history
        recent_results = [r for t, r in results_history 
                        if t >= min_time and r is not None]
        
        if not recent_results:
            return jsonify({
                "status": "no_data",
                "timestamp": now
            })
        
        # Calculate emotion frequencies and average confidence
        emotion_counts = {}
        emotion_confidences = {}
        face_detected_frames = 0
        total_results = len(recent_results)
        
        for result in recent_results:
            emotion = result.get('emotion', 'neutral')
            emotions = result.get('emotions', {})
            faces_detected = result.get('faces_detected', 0)
            
            if faces_detected > 0:
                face_detected_frames += 1
            
            # Count frequencies
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            
            # Sum confidence scores
            for e, conf in emotions.items():
                emotion_confidences[e] = emotion_confidences.get(e, 0) + conf
        
        # Calculate averages
        for e in emotion_confidences:
            emotion_confidences[e] /= total_results
        
        # Determine dominant emotion
        dominant_emotion = 'neutral'
        if emotion_counts:
            dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0]
        
        return jsonify({
            "status": "success",
            "timestamp": now,
            "window_seconds": window_seconds,
            "total_frames": total_results,
            "frames_with_faces": face_detected_frames,
            "face_detection_rate": face_detected_frames / total_results if total_results > 0 else 0,
            "dominant_emotion": dominant_emotion,
            "emotion_frequencies": {k: v/total_results for k, v in emotion_counts.items()},
            "average_confidences": emotion_confidences
        })

@app.route('/api/system-info', methods=['GET'])
def system_info():
    """Return info about the face analysis system"""
    return jsonify({
        "opencv_version": cv2.__version__,
        "deepface_available": DEEPFACE_AVAILABLE,
        "timestamp": time.time(),
        "status": "ready"
    })

# Start the processing thread when the app starts
processing_thread = Thread(target=process_frame_worker, daemon=True)
processing_thread.start()

if __name__ == '__main__':
    print(f"DeepFace available: {DEEPFACE_AVAILABLE}")
    port = int(os.environ.get('PORT', 5005))  # Use different port than LLM server
    logging.info(f"Starting face analysis server on port {port}")
    app.run(debug=False, port=port, threaded=True) 