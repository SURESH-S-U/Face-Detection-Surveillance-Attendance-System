import insightface
import cv2
import numpy as np
import faiss
import os
import json
import time
import threading
import warnings
import hashlib
import shutil
import base64
from datetime import datetime
from flask import Flask, jsonify, Response, request
from flask_cors import CORS
from threading import Event, Lock

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Suppress technical warnings
warnings.filterwarnings("ignore")

# --- GPU INITIALIZATION (RTX 3050 Ti) ---
model = insightface.app.FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
model.prepare(ctx_id=0, det_size=(640, 640), det_thresh=0.75)
print("\n✅ VisionGuard: GPU Model loaded successfully!")

# --- CONFIGURATION ---
FACES_DIR = "Data/Faces"
KNOWN_FACES_DIR = os.path.join(FACES_DIR, "known")
UNKNOWN_FACES_DIR = os.path.join(FACES_DIR, "unknown")
REF_IMAGES_DIR = "Data/Images"
FACE_UPDATE_INTERVAL = 10 
GRACE_PERIOD = 2.0  # Seconds to remember a face after it leaves the frame

# Files
known_log_file = "detect_known.json"
unknown_log_file = "detect_unknown.json"

# AI State
id_to_name = []
index = faiss.IndexFlatIP(512)
unknown_counter = 1
face_last_saved = {}
# Global tracker: { 'track_id': {'bbox': [], 'name': '', 'score': 0.0, 'last_seen': time} }
face_trackers = {}

# Threading & Control
data_lock = Lock()
frame_lock = Lock()
stop_event = Event()
current_frame = None
known_detections = {}
unknown_detections = {}
is_surveillance_active = True  # NEW: Global flag for camera control

# --- CORE UTILITIES ---

def initialize_system():
    global known_detections, unknown_detections
    for folder in [KNOWN_FACES_DIR, UNKNOWN_FACES_DIR]:
        if os.path.exists(folder): shutil.rmtree(folder)
        os.makedirs(folder, exist_ok=True)
    known_detections, unknown_detections = {}, {}
    for f in [known_log_file, unknown_log_file]:
        with open(f, 'w') as file: json.dump({}, file)
    print("✅ System: Session logs and directories ready.")

def get_base64_image(directory):
    if not os.path.exists(directory): return None
    files = sorted([f for f in os.listdir(directory) if f.lower().endswith(('.jpg', '.png'))], reverse=True)
    if not files: return None
    try:
        with open(os.path.join(directory, files[0]), 'rb') as f:
            return f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"
    except: return None

def generate_face_hash(embedding):
    return hashlib.md5(embedding.tobytes()).hexdigest()[:12]

def save_face_image(frame, bbox, name, embedding):
    global face_last_saved
    curr = time.time()
    clean_id = name.replace(" (tracking)", "")
    if clean_id in face_last_saved and curr - face_last_saved[clean_id] < FACE_UPDATE_INTERVAL: return
    
    target_dir = UNKNOWN_FACES_DIR if "Unknown" in clean_id else KNOWN_FACES_DIR
    person_dir = os.path.join(target_dir, clean_id)
    os.makedirs(person_dir, exist_ok=True)
    
    x1, y1, x2, y2 = [int(c) for c in bbox]
    h, w = frame.shape[:2]
    crop = frame[max(0, y1-20):min(h, y2+20), max(0, x1-20):min(w, x2+20)]
    
    if crop.size > 0:
        filename = f"{datetime.now().strftime('%H%M%S')}_{generate_face_hash(embedding)}.jpg"
        cv2.imwrite(os.path.join(person_dir, filename), crop)
        face_last_saved[clean_id] = curr

def save_detection_data(name, score):
    global known_detections, unknown_detections
    ts = datetime.now().isoformat()
    clean_id = name.replace(" (tracking)", "")
    with data_lock:
        target_dict = known_detections if "Unknown" not in name else unknown_detections
        if clean_id not in target_dict:
            target_dict[clean_id] = {"first_detected": ts, "last_detected": ts, "score": float(score)}
        else:
            target_dict[clean_id]["last_detected"] = ts
            target_dict[clean_id]["score"] = float(score)

def bbox_iou(box1, box2):
    x1, y1, x2, y2 = max(box1[0], box2[0]), max(box1[1], box2[1]), min(box1[2], box2[2]), min(box1[3], box2[3])
    if x2 < x1 or y2 < y1: return 0.0
    inter = (x2 - x1) * (y2 - y1)
    area1, area2 = (box1[2]-box1[0])*(box1[3]-box1[1]), (box2[2]-box2[0])*(box2[3]-box2[1])
    return inter / (area1 + area2 - inter)

# --- AI ENGINE ---

def add_face(name):
    global index, id_to_name
    person_path = os.path.join(REF_IMAGES_DIR, name)
    if not os.path.exists(person_path): return
    count = 0
    for img_name in os.listdir(person_path):
        img = cv2.imread(os.path.join(person_path, img_name))
        if img is None: continue
        faces = model.get(img)
        if faces:
            embedding = faces[0].embedding.reshape(1, -1)
            norm_emb = embedding / np.linalg.norm(embedding)
            index.add(norm_emb.astype(np.float32))
            id_to_name.append(name)
            count += 1
    if count > 0: print(f"✅ Registered: {name} ({count} images)")

def search_face(img):
    global unknown_counter, face_trackers
    faces = model.get(img)
    curr_time = time.time()
    
    # 1. Clear old trackers
    face_trackers = {tid: info for tid, info in face_trackers.items() if curr_time - info['last_seen'] < GRACE_PERIOD}
    
    if not faces: return []

    results = []
    for face in faces:
        bbox = face.bbox
        embedding = face.embedding.reshape(1, -1)
        norm_emb = embedding / np.linalg.norm(embedding)
        
        # Recognition
        D, I = index.search(norm_emb.astype(np.float32), 1)
        score = float(D[0][0])
        
        # 2. Check for existing track by overlap (IOU)
        matched_tid = None
        for tid, info in face_trackers.items():
            if bbox_iou(bbox, info['bbox']) > 0.4:
                matched_tid = tid
                break
        
        if I[0][0] != -1 and score > 0.45:
            name = id_to_name[I[0][0]]
        elif matched_tid:
            name = face_trackers[matched_tid]['name'] # Keep the same "UnknownX" ID
        else:
            # Truly new person
            name = f"Unknown{unknown_counter}"
            unknown_counter += 1
            # Optional: Add stranger to database temporarily to improve consistency
            index.add(norm_emb.astype(np.float32))
            id_to_name.append(name)
            
        # 3. Update or create tracker
        tid = matched_tid if matched_tid else f"track_{curr_time}_{bbox[0]}"
        face_trackers[tid] = {'bbox': bbox, 'name': name, 'score': score, 'last_seen': curr_time}
        
        save_detection_data(name, score)
        save_face_image(img, bbox, name, face.embedding)
        results.append({"bbox": bbox, "name": name, "score": score})
        
    return results

# --- ROUTES ---

@app.route('/pause_surveillance')
def pause_surveillance():
    global is_surveillance_active
    is_surveillance_active = False
    return jsonify({"status": "Surveillance Paused - Camera Released"})

@app.route('/resume_surveillance')
def resume_surveillance():
    global is_surveillance_active
    is_surveillance_active = True
    return jsonify({"status": "Surveillance Resumed - Camera Re-acquired"})

@app.route('/known_faces')
def get_known_faces():
    res = []
    with data_lock:
        for name in os.listdir(REF_IMAGES_DIR) if os.path.exists(REF_IMAGES_DIR) else []:
            log = known_detections.get(name, {})
            
            # --- IMPROVEMENT: Prioritize profile.jpg for known users ---
            user_dir = os.path.join(REF_IMAGES_DIR, name)
            profile_path = os.path.join(user_dir, 'profile.jpg')
            
            img_base64 = None
            if os.path.exists(profile_path):
                try:
                    with open(profile_path, 'rb') as f:
                        img_base64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"
                except Exception as e:
                    print(f"Error reading profile for {name}: {e}")
                    img_base64 = get_base64_image(user_dir) # Fallback to any image in folder
            else:
                img_base64 = get_base64_image(user_dir) # Fallback if profile.jpg missing
            
            res.append({
                "name": name, 
                "face_image": img_base64, # Key name matched to frontend 'user.face_image'
                "last_detected": log.get("last_detected", "Never"),
                "confidence": log.get("score", 0), 
                "status": "known"
            })
    return jsonify(sorted(res, key=lambda x: str(x['last_detected']), reverse=True))

@app.route('/unknown_faces')
def get_unknown_faces():
    res = []
    with data_lock:
        if os.path.exists(UNKNOWN_FACES_DIR):
            for folder in os.listdir(UNKNOWN_FACES_DIR):
                folder_path = os.path.join(UNKNOWN_FACES_DIR, folder)
                if os.path.isdir(folder_path):
                    log = unknown_detections.get(folder, {})
                    # This fetches the most recent .jpg captured for this unknown person
                    captured_img = get_base64_image(folder_path)
                    
                    res.append({
                        "id": folder,
                        "name": folder, 
                        "face_image": captured_img, # The captured face
                        "last_detected": log.get("last_detected", "N/A"),
                        "confidence": log.get("score", 0),
                        "status": "unknown"
                    })
    return jsonify(sorted(res, key=lambda x: str(x['last_detected']), reverse=True))

@app.route('/detection_data')
def get_detection_data():
    # Merges both known (with profile pics) and unknown (with captures)
    known = get_known_faces().get_json()
    unknown = get_unknown_faces().get_json()
    
    # Filter known faces to only show those detected in this session
    active_known = [k for k in known if k['last_detected'] != "Never"]
    
    return jsonify(active_known + unknown)


@app.route('/video_feed')
def video_feed():
    def generate():
        while not stop_event.is_set():
            with frame_lock:
                if current_frame is not None:
                    _, jpeg = cv2.imencode('.jpg', current_frame)
                    yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            time.sleep(0.04)
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


# Get image for Register using the same surveillance camera
@app.route('/get_snapshot')
def get_snapshot():
    """Allows the registration page to capture the current frame from the backend stream"""
    with frame_lock:
        if current_frame is not None:
            _, buffer = cv2.imencode('.jpg', current_frame)
            return Response(buffer.tobytes(), mimetype='image/jpeg')
    return jsonify({'success': False, 'message': 'Frame not available'}), 500


@app.route('/register', methods=['POST'])
def register_user():
    try:
        # 1. Get the name from the form data
        name = request.form.get('name')
        if not name:
            return jsonify({'success': False, 'message': 'Name is required'}), 400
        
        # 2. Get the profile picture
        profile_picture = request.files.get('profile_picture')
        if not profile_picture:
            return jsonify({'success': False, 'message': 'Profile picture is required'}), 400
        
        # 3. Create the directory for the user in Data/Images
        user_dir = os.path.join(REF_IMAGES_DIR, name)
        
        # If user already exists, we clear the folder to update the dataset fresh
        if os.path.exists(user_dir):
            shutil.rmtree(user_dir)
        os.makedirs(user_dir, exist_ok=True)
        
        # 4. Save the profile picture specifically as 'profile.jpg'
        # This is used for the UI and also as part of the AI dataset
        profile_path = os.path.join(user_dir, 'profile.jpg')
        profile_picture.save(profile_path)
        
        # 5. Save all gallery images as gallery_0.jpg, gallery_1.jpg, etc.
        gallery_count = 0
        for key in request.files:
            if key.startswith('gallery_'):
                file = request.files[key]
                gallery_path = os.path.join(user_dir, f'gallery_{gallery_count}.jpg')
                file.save(gallery_path)
                gallery_count += 1
        
        # 6. Update the face database/index immediately
        # This calls your existing add_face function to process the new images
        add_face(name)
        
        print(f"✅ Successfully registered {name} with {gallery_count} gallery images and 1 profile pic.")
        
        return jsonify({
            'success': True, 
            'message': f'User {name} registered successfully with {gallery_count} gallery images'
        })
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@app.route('/attendance_data')
def get_attendance_data():
    try:
        res = []
        with data_lock:
            # Get list of all registered people from the filesystem
            all_registered = os.listdir(REF_IMAGES_DIR) if os.path.exists(REF_IMAGES_DIR) else []
            
            for name in all_registered:
                user_dir = os.path.join(REF_IMAGES_DIR, name)
                if not os.path.isdir(user_dir): continue
                
                # Check if they were detected in this session
                is_present = name in known_detections
                log = known_detections.get(name, {})
                
                # Get profile image
                profile_path = os.path.join(user_dir, 'profile.jpg')
                img_base64 = None
                if os.path.exists(profile_path):
                    with open(profile_path, 'rb') as f:
                        img_base64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"
                
                res.append({
                    "name": name,
                    "face_image": img_base64,
                    "status": "present" if is_present else "absent",
                    "last_detected": log.get("last_detected", "N/A")
                })
        return jsonify(res)
    except Exception as e:
        print(f"Attendance data error: {e}")
        return jsonify([])

# --- RUNTIME ---

def run_recognition():
    global current_frame, is_surveillance_active
    cap = None
    
    while not stop_event.is_set():
        if is_surveillance_active:
            # 1. Initialize camera if it's not open (Re-acquire hardware)
            if cap is None or not cap.isOpened():
                cap = cv2.VideoCapture(0)
                if cap.isOpened():
                    print("📷 Surveillance Camera Re-acquired")
            
            ret, frame = cap.read()
            if not ret: 
                time.sleep(0.1)
                continue
            
            small = cv2.resize(frame, (0,0), fx=0.5, fy=0.5)
            search_face(small) # This updates global face_trackers
            
            # Draw from global face_trackers to ensure continuous bounding boxes
            with data_lock:
                for tid, info in face_trackers.items():
                    bbox, name, score = info['bbox'], info['name'], info['score']
                    x1, y1, x2, y2 = [int(c * 2) for c in bbox]
                    color = (0, 255, 0) if "Unknown" not in name else (0, 0, 255)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    label = f"{name} ({score:.2f})"
                    cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            with frame_lock: 
                current_frame = frame.copy()
        else:
            # 2. Surveillance is PAUSED: Release the camera hardware completely
            if cap is not None:
                cap.release()
                cap = None
                with frame_lock: 
                    current_frame = None
                print("📷 Camera Hardware Released (Surveillance Paused)")
            
            # Sleep slightly to prevent high CPU usage while the camera is released
            time.sleep(0.5)

    # Final cleanup if the thread stops
    if cap: 
        cap.release()

def final_cleanup():
    print("\n🧹 Performing deep session cleanup...")
    
    # 1. Delete JSON logs and AI signatures
    files = [known_log_file, unknown_log_file, "face_db.faiss", "name_mapping.json"]
    for f in files: 
        if os.path.exists(f): 
            try: os.remove(f)
            except: pass

    # 2. Delete all detected session crops (Known & Unknown)
    for folder in [KNOWN_FACES_DIR, UNKNOWN_FACES_DIR]:
        if os.path.exists(folder):
            try:
                shutil.rmtree(folder)
                # Recreate empty directory so the path exists for next run
                os.makedirs(folder, exist_ok=True)
                print(f"🗑️ Wiped evidence photos in: {folder}")
            except Exception as e:
                print(f"⚠️ Error clearing {folder}: {e}")

    print("✨ Cleanup complete. (Reference photos in Data/Images are preserved)")

if __name__ == '__main__':
    try:
        initialize_system()
        if os.path.exists(REF_IMAGES_DIR):
            for person in os.listdir(REF_IMAGES_DIR): add_face(person)
        threading.Thread(target=run_recognition, daemon=True).start()
        app.run(host='0.0.0.0', port=5000, threaded=True)
    except KeyboardInterrupt: pass  
    finally: final_cleanup()