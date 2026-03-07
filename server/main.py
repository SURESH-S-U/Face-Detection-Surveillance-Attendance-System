import insightface
import cv2
import numpy as np
import faiss
import os
import json
import time
import threading
from queue import Queue
from threading import Event, Timer
import warnings
from datetime import datetime
import hashlib
import shutil
from threading import Timer
import base64
from flask import Flask, jsonify, Response, request, send_from_directory
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Suppress warnings
warnings.filterwarnings("ignore", category=RuntimeWarning, module="insightface")
warnings.filterwarnings("ignore", category=FutureWarning, module="numpy")

# Initialize face analysis model
model = insightface.app.FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider'])
model.prepare(ctx_id=0, det_size=(640, 640), det_thresh=0.75)
print("\n✅ Model loaded successfully!")

# Global variables
FACES_DIR = "Data/Faces"
KNOWN_FACES_DIR = os.path.join(FACES_DIR, "known")
UNKNOWN_FACES_DIR = os.path.join(FACES_DIR, "unknown")
FACE_UPDATE_INTERVAL = 10
cleanup_timer = None
face_last_saved = {}

face_db = {}
id_to_name = []
unknown_counter = 1
embedding_dim = 512  
index = faiss.IndexFlatIP(embedding_dim)
db_file = "face_db.json"
known_faces = set()

face_trackers = {}  
GRACE_PERIOD = 15  
UNKNOWN_THRESHOLD = 15  
SIMILARITY_THRESHOLD = 0.7  
IOU_THRESHOLD = 0.5

known_log_file = "detect_known.json"
unknown_log_file = "detect_unknown.json"
sent_hashes_file = "sent_hashes.json"
known_detections = {}
unknown_detections = {}
last_save_time = time.time()
SAVE_INTERVAL = 5

# Video stream variables
video_stream = None
stop_event = Event()
current_frame = None
frame_lock = threading.Lock()

# Track shown faces
shown_face_hashes = set()
sent_face_hashes = set()
FACE_COOLDOWN = 300  # 5 minutes cooldown for sending the same face again
last_sent_times = {}  # Track when each face was last sent

def initialize_detection_files():
    """Initialize or clear the detection JSON files"""
    global known_detections, unknown_detections, shown_face_hashes, sent_face_hashes, last_sent_times
    
    # Clear existing files if needed
    for file_path in [known_log_file, unknown_log_file]:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️ Cleared existing file: {file_path}")
        except Exception as e:
            print(f"⚠️ Error clearing {file_path}: {e}")
    
    # Initialize empty dictionaries and clear shown faces
    known_detections = {}
    unknown_detections = {}
    shown_face_hashes = set()
    sent_face_hashes = set()
    last_sent_times = {}
    
    # Create new empty files
    try:
        with open(known_log_file, 'w') as f:
            json.dump({}, f)
        with open(unknown_log_file, 'w') as f:
            json.dump({}, f)
        with open(sent_hashes_file, 'w') as f:
            json.dump([], f)
        print("✅ Initialized empty detection files")
    except Exception as e:
        print(f"⚠️ Error initializing detection files: {e}")

def load_sent_hashes():
    """Load the set of face hashes that have already been sent"""
    global sent_face_hashes, last_sent_times
    try:
        if os.path.exists(sent_hashes_file):
            with open(sent_hashes_file, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    # New format with timestamps
                    last_sent_times = data
                    sent_face_hashes = set(data.keys())
                else:
                    # Old format (list of hashes)
                    sent_face_hashes = set(data)
        else:
            sent_face_hashes = set()
            last_sent_times = {}
    except Exception as e:
        print(f"⚠️ Error loading sent hashes: {e}")
        sent_face_hashes = set()
        last_sent_times = {}

def save_sent_hashes():
    """Save the set of face hashes that have been sent"""
    try:
        with open(sent_hashes_file, 'w') as f:
            json.dump(last_sent_times, f)
    except Exception as e:
        print(f"⚠️ Error saving sent hashes: {e}")

def generate_face_hash(embedding):
    """Generate a unique hash for a face embedding to avoid duplicates."""
    if embedding is None or embedding.size == 0:
        return None
    hash_obj = hashlib.md5(embedding.tobytes())
    return hash_obj.hexdigest()[:12]  # Longer hash for better uniqueness

def save_face_image(frame, bbox, name, embedding):
    """Save a detected face image with timestamp and hash, deleting previous images."""
    global face_last_saved
    
    current_time = time.time()
    face_id = name.replace(" (tracking)", "")
    
    # Check if this face was recently saved
    if face_id in face_last_saved and current_time - face_last_saved[face_id] < FACE_UPDATE_INTERVAL:
        return
    
    # Create directory structure
    if "Unknown" in face_id:
        face_dir = os.path.join(UNKNOWN_FACES_DIR, face_id)
    else:
        face_dir = os.path.join(KNOWN_FACES_DIR, face_id)
    
    os.makedirs(face_dir, exist_ok=True)
    
    # Extract face from frame
    x1, y1, x2, y2 = [int(coord) for coord in bbox]
    # Add padding to the face crop
    pad = 20
    h, w = frame.shape[:2]
    x1 = max(0, x1 - pad)
    y1 = max(0, y1 - pad)
    x2 = min(w, x2 + pad)
    y2 = min(h, y2 + pad)
    face_img = frame[y1:y2, x1:x2]
    
    if face_img.size == 0:
        return  # Skip if face extraction failed
    
    # Generate timestamp and hash for filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    face_hash = generate_face_hash(embedding)
    if face_hash is None:
        face_hash = str(hash(str(bbox)))[:12]  # Fallback if embedding is None
    
    filename = f"{timestamp}_{face_hash}.jpg"
    file_path = os.path.join(face_dir, filename)
    
    # Delete previous images for this person (if not an Unknown)
    if "Unknown" not in face_id:
        for old_file in os.listdir(face_dir):
            if old_file.endswith(('.jpg', '.jpeg', '.png')):
                old_path = os.path.join(face_dir, old_file)
                try:
                    os.remove(old_path)
                    print(f"🗑️ Removed previous image for {face_id}: {old_file}")
                except Exception as e:
                    print(f"⚠️ Error removing old image {old_path}: {e}")
    
    # Save the face image
    cv2.imwrite(file_path, face_img)
    face_last_saved[face_id] = current_time
    
    print(f"💾 Saved face image for {face_id} to {file_path}")

def delete_old_images(interval=60):
    """Periodically clean up old face images for known faces."""
    global cleanup_timer
    
    current_time = time.time()
    
    try:
        # Process known faces - keep only the most recent images
        if os.path.exists(KNOWN_FACES_DIR):
            for name_dir in os.listdir(KNOWN_FACES_DIR):
                person_dir = os.path.join(KNOWN_FACES_DIR, name_dir)
                if os.path.isdir(person_dir):
                    images = [f for f in os.listdir(person_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    if len(images) > 5:  # Keep only 5 most recent images per person
                        # Sort by timestamp (which is at the beginning of filename)
                        images.sort(reverse=True)
                        for old_img in images[5:]:
                            os.remove(os.path.join(person_dir, old_img))
                            print(f"🗑️ Removed old image for {name_dir}: {old_img}")
    
        # Do not delete unknown faces automatically as per requirements
    except Exception as e:
        print(f"⚠️ Error in cleanup: {e}")
    
    # Schedule next cleanup
    cleanup_timer = Timer(interval, delete_old_images, [interval])
    cleanup_timer.daemon = True
    cleanup_timer.start()

def start_cleanup_thread():
    """Start the background cleanup thread."""
    # Create required directories if they don't exist
    os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
    os.makedirs(UNKNOWN_FACES_DIR, exist_ok=True)
    
    # Start the cleanup thread
    delete_old_images(60)

def load_detection_logs():
    """Load existing detection logs if they exist."""
    global known_detections, unknown_detections, shown_face_hashes
    
    try:
        if os.path.exists(known_log_file):
            with open(known_log_file, 'r') as f:
                known_detections = json.load(f)
            print(f"✅ Loaded {len(known_detections)} known face logs")
        else:
            known_detections = {}
            
        if os.path.exists(unknown_log_file):
            with open(unknown_log_file, 'r') as f:
                unknown_detections = json.load(f)
            print(f"✅ Loaded {len(unknown_detections)} unknown face logs")
        else:
            unknown_detections = {}
            
        # Initialize shown face hashes from existing detections
        shown_face_hashes = set()
        for det_id, data in known_detections.items():
            if "face_hash" in data:
                shown_face_hashes.add(data["face_hash"])
        for det_id, data in unknown_detections.items():
            if "face_hash" in data:
                shown_face_hashes.add(data["face_hash"])
                
    except Exception as e:
        print(f"⚠️ Error loading detection logs: {e}")
        known_detections = {}
        unknown_detections = {}
        shown_face_hashes = set()

def save_detection_data(name, bbox, score, embedding, camera_id=0):
    """Save detection data to the appropriate JSON file, ensuring unique entries per unknown person."""
    global known_detections, unknown_detections, last_save_time, shown_face_hashes
    
    timestamp = datetime.now().isoformat()
    face_hash = generate_face_hash(embedding)
    
    if face_hash is None:
        face_hash = hashlib.md5(name.encode() + timestamp.encode()).hexdigest()[:12]
    
    # Unique identifier based on name
    unique_id = name.replace(" (tracking)", "")
    
    # Skip if we've already shown this face
    if face_hash in shown_face_hashes:
        return
    
    detection_data = {
        "name": unique_id,
        "first_detected": timestamp,  # Keep track of first detection time
        "last_detected": timestamp,   # Update with latest detection time
        "timestamps": [timestamp],    # Store multiple detection times
        "detections": [{
            "timestamp": timestamp,
            "bbox": [float(coord) for coord in bbox],
            "score": float(score),
            "camera_id": camera_id,
            "face_hash": face_hash
        }]
    }
    
    try:
        # Check if this is a known or unknown face
        if "Unknown" in name:
            # For unknown faces, look for an existing entry with the same name pattern
            existing_entry = None
            for det_hash, data in list(unknown_detections.items()):
                if data["name"] == unique_id and det_hash != face_hash:
                    existing_entry = det_hash
                    break
            
            if existing_entry:
                # Update existing entry for the unknown face
                existing_data = unknown_detections[existing_entry]
                # Update last detection time
                existing_data["last_detected"] = timestamp
                # Append new timestamp if not already present
                if timestamp not in existing_data.get("timestamps", []):
                    existing_data["timestamps"].append(timestamp)
                
                # Add new detection to the list
                existing_data["detections"].append({
                    "timestamp": timestamp,
                    "bbox": [float(coord) for coord in bbox],
                    "score": float(score),
                    "camera_id": camera_id,
                    "face_hash": face_hash
                })
                
                print(f"🔄 Updated existing unknown detection for {unique_id}")
            else:
                # Add new entry for the unknown face
                unknown_detections[face_hash] = detection_data
                print(f"➕ Added new unknown detection for {unique_id}")
        
        else:
            # For known faces, similar logic as before
            existing_entry = None
            for det_id, data in known_detections.items():
                if data["name"] == unique_id:
                    existing_entry = det_id
                    break
            
            if existing_entry:
                # Update existing entry
                existing_data = known_detections[existing_entry]
                # Update last detection time
                existing_data["last_detected"] = timestamp
                # Append new timestamp
                if timestamp not in existing_data.get("timestamps", []):
                    existing_data["timestamps"].append(timestamp)
                
                # Add new detection to the list
                existing_data["detections"].append({
                    "timestamp": timestamp,
                    "bbox": [float(coord) for coord in bbox],
                    "score": float(score),
                    "camera_id": camera_id,
                    "face_hash": face_hash
                })
                
                print(f"🔄 Updated existing detection for {unique_id}")
            else:
                # Add new entry for the known person
                known_detections[unique_id] = detection_data
                print(f"➕ Added new detection for {unique_id}")
        
        # Mark this face as shown
        shown_face_hashes.add(face_hash)
        
        # Save periodically
        current_time = time.time()
        if current_time - last_save_time > SAVE_INTERVAL:
            save_detection_logs()
            last_save_time = current_time
    except Exception as e:
        print(f"⚠️ Error saving detection data: {e}")

        

def save_detection_logs():
    """Save detection logs to JSON files, ensuring uniqueness and data integrity."""
    global known_detections, unknown_detections
    
    try:
        # Save known detections
        with open(known_log_file, 'w') as f:
            json.dump(known_detections, f, indent=2)
        
        # Save unknown detections
        with open(unknown_log_file, 'w') as f:
            json.dump(unknown_detections, f, indent=2)
            
        print(f"💾 Detection logs saved: {len(known_detections)} known, {len(unknown_detections)} unknown")
    except Exception as e:
        print(f"⚠️ Error saving detection logs: {e}")


def bbox_iou(box1, box2):
    """Calculate IoU (Intersection over Union) between two bounding boxes."""
    box1 = [float(x) for x in box1]
    box2 = [float(x) for x in box2]
    
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    if x2 < x1 or y2 < y1:
        return 0.0
    
    intersection_area = (x2 - x1) * (y2 - y1)
    
    # Calculate union area
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - intersection_area
    
    iou = intersection_area / union_area if union_area > 0 else 0
    
    return iou

def normalize(emb):
    """Normalize embeddings for cosine similarity."""
    return emb / np.linalg.norm(emb, axis=1, keepdims=True)

def detect_and_embed(img):
    """Detects faces in an image and extracts embeddings."""
    faces = model.get(img)
    if not faces:
        return [], None

    # Validate face bounding boxes
    valid_faces = []
    for face in faces:
        w = face.bbox[2] - face.bbox[0]
        h = face.bbox[3] - face.bbox[1]
        if w > 10 and h > 10:  # Minimum reasonable face size
            valid_faces.append(face)
    
    if not valid_faces:
        return [], None

    # Sort valid faces by size
    valid_faces = sorted(valid_faces, key=lambda face: (face.bbox[2] - face.bbox[0]) * (face.bbox[3] - face.bbox[1]), reverse=True)
    
    embeddings = np.array([face.embedding for face in valid_faces], dtype=np.float32)
    return valid_faces, embeddings

def add_unknown_face(embedding):
    global unknown_counter, id_to_name

    unknown_name = f"Unknown{unknown_counter}"
    unknown_counter += 1
    normalized_embedding = normalize(embedding.reshape(1, -1))
    
    index.add(normalized_embedding)
    id_to_name.append(unknown_name)
    save_db()
    print(f"⚠️ New unknown face added as {unknown_name}")
    return unknown_name

def check_similar_unknown_faces(embeddings, name):
    # Simplified version to avoid FAISS 'xb' error
    # This skips the automatic removal of similar unknowns for now
    # to ensure the system starts up correctly.
    return 0

def add_face(name, img_path=None):
    global index, id_to_name

    person_dir = f"Data/Images/{name}"
    
    # If a specific image is provided, use it
    if img_path:
        img_paths = [img_path]
    else:
        if not os.path.exists(person_dir):
            print(f"❌ No images found for {name}!")
            return
        img_paths = [os.path.join(person_dir, img) for img in os.listdir(person_dir) if img.endswith(('.jpg', '.png', '.jpeg'))]

    all_embeddings = []
    
    for img_path in img_paths:
        img = cv2.imread(img_path)
        if img is None:
            print(f"❌ Error reading {img_path}")
            continue
        
        faces, embeddings = detect_and_embed(img)
        if embeddings is None or len(embeddings) == 0:
            print(f"⚠️ No face detected in {img_path}")
            continue

        embeddings = normalize(embeddings)  # Normalize for FAISS
        all_embeddings.append(embeddings[0])  # Only take the largest face

    if not all_embeddings:
        print(f"❌ No valid faces added for {name}")
        return

    all_embeddings = np.vstack(all_embeddings)  # Stack all embeddings together
    
    # Check for similar unknown faces and replace them
    removed_count = check_similar_unknown_faces(all_embeddings, name)
    
    # Inside add_face function
    index.add(all_embeddings)
    for _ in range(len(all_embeddings)):
        id_to_name.append(name)
    save_db()
    print(f"✅ {name} added with {len(all_embeddings)} images!" + 
          (f" Replaced {removed_count} unknowns." if removed_count else ""))

def search_face(img):
    """Search for faces in an image using FAISS, with improved tracking for transient faces."""
    global face_trackers
    
    faces, test_embeddings = detect_and_embed(img)
    if test_embeddings is None:
        # No faces detected in this frame, but keep track of previously known faces
        current_time = time.time()
        results = []
        
        # Check for recently seen faces and include them with "tracking" label
        for track_id, info in list(face_trackers.items()):
            if current_time - info["last_seen"] < GRACE_PERIOD:
                # Still within grace period, return the last known identity
                results.append((info["bbox"], info["name"] + " (tracking)", info["score"]))
            else:
                # Remove old tracks
                face_trackers.pop(track_id, None)
                
        return results
    
    # Faces were detected, run recognition
    norm_test_embeddings = normalize(test_embeddings)
    D, I = index.search(norm_test_embeddings, 1)  # Search for the closest match
    
    results = []
    current_time = time.time()
    
    # Process detected faces
    for idx, (face, embedding, best_match_idx, best_score) in enumerate(zip(faces, norm_test_embeddings, I[:, 0], D[:, 0])):
        bbox = face.bbox
        matched_track_id = None
        
        # Try to match with existing tracks using IOU
        for track_id, info in face_trackers.items():
            iou = bbox_iou(bbox, info["bbox"])
            if iou > IOU_THRESHOLD:
                matched_track_id = track_id
                break
        
        # If this face matches a known track
        if matched_track_id is not None:
            track_info = face_trackers[matched_track_id]
            if "Identifying" not in track_info["name"]:
                save_face_image(img, bbox, track_info["name"], track_info["embedding"])
            # If face is recognized confidently
            print(f"DEBUG: Best Match Index: {best_match_idx}, Score: {best_score}") # ADD THIS
            if best_match_idx != -1 and best_score > 0.35: # Lowered from 0.5 to 0.35
                matched_name = id_to_name[best_match_idx]
                
                # Update tracker with new recognition
                track_info["name"] = matched_name
                track_info["last_seen"] = current_time
                track_info["bbox"] = bbox
                track_info["embedding"] = embedding
                track_info["unrecognized_count"] = 0
                track_info["score"] = best_score
                
                # Save detection data
                save_detection_data(matched_name, bbox, best_score, embedding)
            else:
                # Face not recognized confidently, but we have a tracking history
                track_info["last_seen"] = current_time
                track_info["bbox"] = bbox
                track_info["embedding"] = embedding
                
                # Only increment counter if score is really bad
                if best_score < 0.3:
                    track_info["unrecognized_count"] += 1
                
                # Only register as Unknown after many consecutive failures
                # and if we've already tried recognizing confidently before
                if track_info["unrecognized_count"] >= UNKNOWN_THRESHOLD and "Unknown" not in track_info["name"]:
                    unknown_name = add_unknown_face(embedding)
                    track_info["name"] = unknown_name
                    track_info["score"] = 0.0
                    save_detection_data(unknown_name, bbox, 0.0, embedding)
            
            results.append((bbox, track_info["name"], track_info["score"]))
            
        else:
            # New face detected that doesn't match any existing tracks
            new_track_id = str(len(face_trackers) + 1)
            
            if best_match_idx != -1 and best_score > 0.4:
                # Confidently recognized new face
                matched_name = id_to_name[best_match_idx]
                face_trackers[new_track_id] = {
                    "name": matched_name,
                    "last_seen": current_time,
                    "bbox": bbox,
                    "embedding": embedding,
                    "unrecognized_count": 0,
                    "score": best_score
                }
                results.append((bbox, matched_name, best_score))
                save_detection_data(matched_name, bbox, best_score, embedding)
                save_face_image(img, bbox, matched_name, embedding)
            else:
                # Unrecognized new face - don't immediately create Unknown entry
                # Instead, start tracking and wait for more confident recognition
                face_trackers[new_track_id] = {
                    "name": "Identifying...",
                    "last_seen": current_time,
                    "bbox": bbox,
                    "embedding": embedding,
                    "unrecognized_count": 1,
                    "score": 0.0
                }
                results.append((bbox, "Identifying...", 0.0))
    
    # Clean up old tracks
    for track_id in list(face_trackers.keys()):
        if current_time - face_trackers[track_id]["last_seen"] > GRACE_PERIOD:
            face_trackers.pop(track_id, None)
    
    return results

def capture_and_save(name,src=0):
    """Captures all profile images using the webcam and saves them."""
    angles = ["front", "left", "right", "up"]
    os.makedirs(f"Data/Images/{name}", exist_ok=True)

    for angle in angles:
        input(f"📸 Look {angle} and press ENTER to capture...")
        
        cam = cv2.VideoCapture(src)
        if not cam.isOpened():
            print("❌ Error: Could not open camera.")
            return

        ret, frame = cam.read()
        cam.release()
        if not ret:
            print(f"❌ Error: Could not capture {angle} image.")
            return
        
        img_path = f"Data/Images/{name}/{angle}.jpg"
        cv2.imwrite(img_path, frame)
        print(f"✅ {angle} image saved.")
        
    add_face(name)  # Load all images after capturing

def save_db():
    """Save FAISS index and name mappings."""
    faiss.write_index(index, "face_db.faiss")
    with open("name_mapping.json", "w") as f:
        json.dump(id_to_name, f)
    print("💾 Database saved!")

def load_db():
    global index, id_to_name, unknown_counter

    if not (os.path.exists("face_db.faiss") and os.path.exists("name_mapping.json")):
        print("⚠️ No database found. Starting fresh!")
        index = faiss.IndexFlatIP(embedding_dim)
        id_to_name = []
        unknown_counter = 1
        return

    index = faiss.read_index("face_db.faiss")
    with open("name_mapping.json", "r") as f:
        id_to_name = json.load(f)

    # Initialize unknown counter
    unknown_counter = 1
    for name in id_to_name:
        if name.startswith("Unknown"):
            try:
                num = int(name[7:])
                unknown_counter = max(unknown_counter, num + 1)
            except ValueError:
                pass
    print(f"✅ Loaded {len(id_to_name)} faces from database!")

def delete_files_and_folders(json_files, folder_name = 'Data'):
    for file in json_files:
        if os.path.exists(file):
            try:
                os.remove(file)
                print(f"Deleted file: {file}")
            except Exception as e:
                print(f"Error deleting {file}: {e}")
        else:
            print(f"File not found: {file}")
    
    # Delete folder
    if os.path.exists(folder_name) and os.path.isdir(folder_name):
        try:
            shutil.rmtree(folder_name)
            print(f"Deleted folder: {folder_name}")
        except Exception as e:
            print(f"Error deleting folder {folder_name}: {e}")
    else:
        print(f"Folder not found: {folder_name}")

class VideoStream:
    def __init__(self, src=0):
        self.stream = cv2.VideoCapture(src)
        self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 2)
        self.grabbed, self.frame = self.stream.read()
        self.stopped = False
        self.retry_count = 0
        self.thread = None

    def update(self):
        while not self.stopped:
            grabbed = self.stream.grab()
            if not grabbed:
                self.retry_count += 1
                if self.retry_count > 5:
                    self.stop()
                time.sleep(0.1)
                continue
            self.retry_count = 0
            self.grabbed, self.frame = self.stream.retrieve()

    def start(self):
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.start()
        return self

    def stop(self):
        self.stopped = True
        if self.thread is not None:
            self.thread.join()
        self.stream.release()

    def read(self):
        return self.frame

# Flask routes for serving face images
@app.route('/known_faces')
def get_known_faces():
    """Get list of all known faces with their latest images"""
    known_faces = []
    try:
        if os.path.exists(KNOWN_FACES_DIR):
            for name in os.listdir(KNOWN_FACES_DIR):
                face_dir = os.path.join(KNOWN_FACES_DIR, name)
                if os.path.isdir(face_dir):
                    # Get the most recent image
                    images = [f for f in os.listdir(face_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    if images:
                        images.sort(reverse=True)  # Sort by timestamp (newest first)
                        latest_image = images[0]
                        image_path = os.path.join(face_dir, latest_image)
                        
                        # Read and encode the image
                        with open(image_path, 'rb') as img_file:
                            encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
                        
                        known_faces.append({
                            "name": name,
                            "image": f"data:image/jpeg;base64,{encoded_image}",
                            "last_updated": latest_image.split('_')[0]  # Extract timestamp from filename
                        })
        return jsonify(known_faces)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/unknown_faces')
def get_unknown_faces():
    """Get list of all unknown faces with their images"""
    unknown_faces = []
    try:
        if os.path.exists(UNKNOWN_FACES_DIR):
            for folder in os.listdir(UNKNOWN_FACES_DIR):
                if folder.startswith('Unknown'):
                    face_dir = os.path.join(UNKNOWN_FACES_DIR, folder)
                    if os.path.isdir(face_dir):
                        # Get all images for this unknown face
                        images = [f for f in os.listdir(face_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        if images:
                            images.sort(reverse=True)  # Sort by timestamp (newest first)
                            latest_image = images[0]
                            image_path = os.path.join(face_dir, latest_image)
                            
                            with open(image_path, 'rb') as img_file:
                                encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
                            
                            unknown_faces.append({
                                "id": folder,
                                "image": f"data:image/jpeg;base64,{encoded_image}",
                                "first_detected": images[-1].split('_')[0],  # Oldest image timestamp
                                "last_detected": latest_image.split('_')[0]   # Newest image timestamp
                            })
        return jsonify(unknown_faces)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/face_images/<path:filename>')
def get_face_image(filename):
    """Serve face images directly"""
    try:
        # Check if it's a known or unknown face
        if filename.startswith('Unknown'):
            directory = os.path.join(UNKNOWN_FACES_DIR, filename.split('_')[0])
        else:
            directory = os.path.join(KNOWN_FACES_DIR, filename.split('_')[0])
        
        return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/video_feed')
def video_feed():
    """Route to stream live video feed"""
    def generate():
        while not stop_event.is_set():
            with frame_lock:
                if current_frame is not None:
                    ret, jpeg = cv2.imencode('.jpg', current_frame)
                    if ret:
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            time.sleep(0.05)

    return Response(generate(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detection_data')
def get_detection_data():
    """Route to fetch known and unknown detection data with improved deduplication"""
    global sent_face_hashes, last_sent_times
    
    try:
        # Load latest detection logs
        with open(known_log_file, 'r') as f:
            known_detections = json.load(f)
                
        with open(unknown_log_file, 'r') as f:
            unknown_detections = json.load(f)
        
        current_time = time.time()
        
        # Process known detections
        known_users = []
        for name, data in known_detections.items():
            # Take the most recent detection
            latest_detection = max(data['detections'], key=lambda x: x['timestamp'])
            face_hash = latest_detection.get("face_hash", "")
            
            # Skip if within cooldown period
            if face_hash in last_sent_times:
                if current_time - last_sent_times[face_hash] < FACE_COOLDOWN:
                    continue
            
            face_image = find_latest_face_image(name, known=True)
            if face_image:
                known_users.append({
                    "_id": name,
                    "name": data["name"],
                    "first_detected": data.get("first_detected", latest_detection['timestamp']),
                    "last_detected": data.get("last_detected", latest_detection['timestamp']),
                    "camera_id": latest_detection.get("camera_id", 0),
                    "face_image": face_image,
                    "confidence": latest_detection.get("score", 0),
                    "status": "known"
                })
                # Update last sent time
                last_sent_times[face_hash] = current_time
        
        # Process unknown detections
        unknown_users = []
        for face_hash, data in unknown_detections.items():
            # Take the most recent detection
            latest_detection = max(data['detections'], key=lambda x: x['timestamp'])
            
            # Skip if within cooldown period
            if face_hash in last_sent_times:
                if current_time - last_sent_times[face_hash] < FACE_COOLDOWN:
                    continue
            
            face_image = find_latest_face_image(data["name"], known=False)
            if face_image:
                unknown_users.append({
                    "_id": face_hash,
                    "name": "Unknown",
                    "first_detected": data.get("first_detected", latest_detection['timestamp']),
                    "last_detected": data.get("last_detected", latest_detection['timestamp']),
                    "camera_id": latest_detection.get("camera_id", 0),
                    "face_image": face_image,
                    "confidence": latest_detection.get("score", 0),
                    "status": "unknown"
                })
                # Update last sent time
                last_sent_times[face_hash] = current_time
        
        # Save the updated sent hashes
        save_sent_hashes()
        
        # Combine and sort by last_detected (newest first)
        all_detections = known_users + unknown_users
        all_detections.sort(key=lambda x: x["last_detected"], reverse=True)
        
        return jsonify(all_detections)
        
    except Exception as e:
        print(f"Error in get_detection_data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/stop', methods=['POST'])
def stop_processing():
    """Route to stop the recognition process"""
    try:
        stop_event.set()
        if video_stream is not None:
            video_stream.stop()
        return jsonify({"status": "stopped"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/clear_detections', methods=['POST'])
def clear_detections():
    """Route to clear all detection data"""
    try:
        initialize_detection_files()
        return jsonify({"status": "success", "message": "Detection data cleared"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def find_latest_face_image(user_id, known=True):
    """Helper function to find the latest face image for a user"""
    if known:
        user_dir = os.path.join(KNOWN_FACES_DIR, user_id)
    else:
        user_dir = os.path.join(UNKNOWN_FACES_DIR, user_id)
    
    if not os.path.exists(user_dir):
        return None
    
    image_files = [f for f in os.listdir(user_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not image_files:
        return None
    
    # Sort by timestamp (first part of filename)
    image_files.sort(reverse=True)
    latest_image = os.path.join(user_dir, image_files[0])
    
    try:
        with open(latest_image, 'rb') as img_file:
            encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded_image}"
    except Exception as e:
        print(f"Error reading face image: {e}")
        return None

def run_recognition():
    """Function to run recognition in a background thread"""
    global video_stream, current_frame
    src = 0  # Default webcam
    video_stream = VideoStream(src=src).start()
    time.sleep(2.0)  # Allow camera to warm up
    
    while not stop_event.is_set():
        frame = video_stream.read()
        if frame is not None:
            # Process frame for recognition
            small_frame = cv2.resize(frame, (0,0), fx=0.5, fy=0.5)
            results = search_face(small_frame)
            
            # Draw results on frame
            scale_factor = 2
            for bbox, name, score in results:
                x1, y1, x2, y2 = [int(coord * scale_factor) for coord in bbox]
                color = (0, 255, 0) if "Unknown" not in name else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"{name} ({score:.2f})", (x1, y1-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Update global frame
            with frame_lock:
                current_frame = frame.copy()
        
        time.sleep(0.05)
    
    video_stream.stop()

def initialize():
    """Initialize the application"""
    # Initialize detection files (clears old data)
    initialize_detection_files()
    
    # Load face database
    load_db()
    
    # Load sent face hashes
    load_sent_hashes()
    
    # Start cleanup thread
    start_cleanup_thread()
    
    # Start recognition thread
    recognition_thread = threading.Thread(target=run_recognition)
    recognition_thread.daemon = True
    recognition_thread.start()

def final_cleanup():
    """Wipes all unknown data and the temporary database on exit."""
    print("\n🧹 Performing final cleanup...")
    
    # 1. Remove the unknown detection log
    if os.path.exists(unknown_log_file):
        try:
            os.remove(unknown_log_file)
            print(f"🗑️ Deleted: {unknown_log_file}")
        except: pass

    # 2. Remove all unknown face screenshots
    if os.path.exists(UNKNOWN_FACES_DIR):
        try:
            shutil.rmtree(UNKNOWN_FACES_DIR)
            os.makedirs(UNKNOWN_FACES_DIR, exist_ok=True)
            print(f"🗑️ Cleared: {UNKNOWN_FACES_DIR}")
        except: pass

    # 3. Delete the database files so they are rebuilt fresh next time
    # This prevents "Unknown1" from being stuck in memory
    for db_file in ["face_db.faiss", "name_mapping.json"]:
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
                print(f"🗑️ Reset: {db_file}")
            except: pass
            
    print("✨ System is now clean for the next run.")

if __name__ == '__main__':
    try:
        # 1. Start system folders and threads
        initialize()
        
        # 2. Automatically detect and add EVERY person in the Images folder
        base_img_path = "Data/Images"
        if os.path.exists(base_img_path):
            # Loop through every folder in Data/Images
            for person_name in os.listdir(base_img_path):
                person_folder = os.path.join(base_img_path, person_name)
                
                # Check if it's actually a folder
                if os.path.isdir(person_folder):
                    print(f"📂 Processing images for: {person_name}")
                    add_face(person_name)
            
            # Save the combined database of all people
            save_db()
        else:
            print("⚠️ Warning: Data/Images folder not found!")

        # 3. Start the Flask Server
        app.run(host='0.0.0.0', port=5000, threaded=True)
        
    except KeyboardInterrupt:
        print("\n🛑 Stopping system...")
    except Exception as e:
        print(f"\n❌ System error: {e}")
    finally:
        # This ALWAYS runs when you stop the script
        final_cleanup()