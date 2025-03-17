# Face Detection CV Model

This project is a full-stack face detection system using a React frontend (with TypeScript and Tailwind CSS) and a Python-based ML backend. The backend processes live multiple camera feeds using the RTSP protocol, detects faces, and streams the detected faces using FastAPI's streaming response.

## Features
- **Real-time Face Detection**: Uses an ML model to detect faces from RTSP video streams.
- **Live Multiple Camera Feeds**: Supports multiple RTSP streams for real-time monitoring.
- **Streaming Response**: The backend streams detected face data to the frontend.
- **React with TypeScript**: Provides a modular and scalable frontend.
- **Tailwind CSS**: Enhances UI styling and responsiveness.

## Tech Stack
### Frontend
- React (TypeScript)
- Tailwind CSS

### Backend
- FastAPI (Python)
- YOLOv8 / InsightFace for face detection
- OpenCV for video processing
- RTSP protocol for multiple live camera feeds
- MongoDB (optional, for storing detected faces)

## Installation & Setup
### Prerequisites
- Node.js & npm
- Python 3.8+
- MongoDB (optional, if storing detected faces)

### Backend Setup
1. **Create a virtual environment:**
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
2. **Install dependencies:**
   ```sh
   pip install fastapi uvicorn opencv-python-headless numpy pyyaml torch torchvision ultralytics insightface onnxruntime aiohttp pymongo
   ```
3. **Run FastAPI server:**
   ```sh
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. **Navigate to the frontend folder:**
   ```sh
   cd frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install react react-dom typescript tailwindcss axios
   ```
3. **Run the development server:**
   ```sh
   npm run dev
   ```

### YOLOv8 Model Setup
1. **Download YOLOv8 model:**
   ```sh
   yolo task=detect mode=export model=yolov8n.pt format=onnx
   ```

## API Endpoints
### Face Detection Stream
- `GET /detect_faces` - Streams detected faces
- `GET /video_feed` - Streams live RTSP video

## Usage
1. Start the backend and frontend services.
2. Access the frontend in the browser.
3. Add RTSP URLs to monitor multiple camera feeds.
4. View detected faces in real-time.

## Future Enhancements
- Implement WebSocket for faster real-time updates.
- Store detected faces in MongoDB for historical analysis.
- Add user authentication for access control.

