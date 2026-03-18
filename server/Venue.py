import cv2
from flask import Flask, Response, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import threading
import time

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model (Nano version for speed)
model = YOLO('yolov8n.pt')

current_person_count = 0
lock = threading.Lock()

def detect_people_logic():
    global current_person_count
    cap = cv2.VideoCapture(0)

    while True:
        success, frame = cap.read()
        if not success:
            break

        # Detect only class 0 (Person)
        results = model(frame, classes=[0], conf=0.4, verbose=False)
        detections = results[0].boxes
        
        with lock:
            current_person_count = len(detections)

        # Draw Blue boxes (matches your UI theme)
        for box in detections:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 130, 0), 2)
            cv2.putText(frame, "Person", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 130, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()

# --- RENAMED ROUTES ---

@app.route('/venue_stream')  # Changed from /video_feed
def venue_stream():
    return Response(detect_people_logic(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/venue_occupancy')  # Changed from /detection_data
def venue_occupancy():
    with lock:
        return jsonify({
            "person_count": current_person_count,
            "status": "active",
            "timestamp": time.time()
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)