"""
ParkSense - Computer Vision Detector
-------------------------------------
One CameraDetector instance = one CCTV feed.
Pipeline: Video -> Mask -> YOLO11 -> SORT -> Counting -> Speed -> Congestion

Each detector runs in its own background thread (started from FastAPI) and
continuously writes its latest results into a shared dict that the API reads
from. There is no queue, no broker, no websocket - just a dict update each
frame, guarded by a lock.
"""

import threading
import time

import cv2
import numpy as np
from ultralytics import YOLO

from sort import Sort

# ---------------------------------------------------------------------------
# Shared state - imported by main.py
# ---------------------------------------------------------------------------
# Lock protects traffic_status since two camera threads write to it
# concurrently and the FastAPI endpoint reads from it.
status_lock = threading.Lock()

traffic_status = {
    "camera1": {
        "vehicle_count": 0,
        "slow_vehicle_count": 0,
        "status": "NORMAL",
        "officer_required": False,
    },
    "camera2": {
        "vehicle_count": 0,
        "slow_vehicle_count": 0,
        "status": "NORMAL",
        "officer_required": False,
    },
}

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
COCO_CLASS_NAMES = [
    "person", "bicycle", "car", "motorbike", "aeroplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
    "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
    "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
    "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "sofa", "pottedplant", "bed", "diningtable", "toilet", "tvmonitor",
    "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
    "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
    "scissors", "teddy bear", "hair drier", "toothbrush",
]

VEHICLE_CLASSES = ["car", "motorbike", "bus", "truck"]
CONFIDENCE_THRESHOLD = 0.4
SLOW_SPEED_THRESHOLD = 15        # pixel-speed cutoff for "slow"
CONGESTION_VEHICLE_THRESHOLD = 5  # slow vehicles needed to trigger congestion

# One shared YOLO model instance for both camera threads (saves memory/load
# time - ultralytics inference is thread-safe enough for this hackathon use).
_model = None
_model_lock = threading.Lock()


def get_model():
    global _model
    with _model_lock:
        if _model is None:
            _model = YOLO("yolo11s.pt")
    return _model


class CameraDetector:
    """
    Runs the full CV pipeline for a single camera feed in a loop:
        Video -> Mask -> YOLO -> SORT -> Counting -> Speed -> Congestion

    Call `.start()` to launch the background thread. The thread loops the
    video file forever (restarting at frame 0 on end) to simulate a
    continuous CCTV stream.
    """

    def __init__(self, camera_id: str, video_path: str, mask_path: str):
        self.camera_id = camera_id
        self.video_path = video_path
        self.mask_path = mask_path

        self.tracker = Sort(max_age=20, min_hits=2, iou_threshold=0.3)
        self.vehicle_positions = {}
        self.vehicle_speeds = {}

        self._thread = None
        self._running = False

    def start(self):
        """Launch the detection loop in a daemon background thread."""
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------
    def _update_status(self, vehicle_count: int, slow_vehicle_count: int):
        congested = slow_vehicle_count >= CONGESTION_VEHICLE_THRESHOLD

        with status_lock:
            traffic_status[self.camera_id] = {
                "vehicle_count": vehicle_count,
                "slow_vehicle_count": slow_vehicle_count,
                "status": "CONGESTED" if congested else "NORMAL",
                "officer_required": congested,
            }

    def _run(self):
        model = get_model()

        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            print(f"[{self.camera_id}] ERROR: could not open video {self.video_path}")
            return

        mask = cv2.imread(self.mask_path)
        if mask is None:
            print(f"[{self.camera_id}] ERROR: could not load mask {self.mask_path}")
            return

        fps = cap.get(cv2.CAP_PROP_FPS) or 20.0  # fallback if FPS metadata missing

        print(f"[{self.camera_id}] started - video={self.video_path} mask={self.mask_path}")

        while self._running:
            success, img = cap.read()

            # Video ended -> loop back to frame 0 to simulate continuous CCTV
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            mask_resized = cv2.resize(mask, (img.shape[1], img.shape[0]))
            img_region = cv2.bitwise_and(img, mask_resized)

            results = model(img_region, stream=True, verbose=False)

            detections = np.empty((0, 5))
            vehicle_count = 0

            for res in results:
                for box in res.boxes:
                    x1, y1, x2, y2 = box.xyxy[0]
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    current_class = COCO_CLASS_NAMES[cls]

                    if current_class in VEHICLE_CLASSES and conf > CONFIDENCE_THRESHOLD:
                        vehicle_count += 1
                        current_array = np.array(
                            [int(x1), int(y1), int(x2), int(y2), conf]
                        )
                        detections = np.vstack((detections, current_array))

            results_tracker = self.tracker.update(detections)

            slow_vehicle_count = 0

            for result in results_tracker:
                x1, y1, x2, y2, track_id = result
                track_id = int(track_id)

                cx = int((x1 + x2) // 2)
                cy = int((y1 + y2) // 2)

                if track_id in self.vehicle_positions:
                    prev_cx, prev_cy = self.vehicle_positions[track_id]
                    distance = np.sqrt((cx - prev_cx) ** 2 + (cy - prev_cy) ** 2)
                    speed = distance * fps
                    self.vehicle_speeds[track_id] = speed

                self.vehicle_positions[track_id] = (cx, cy)

                current_speed = self.vehicle_speeds.get(track_id, 0)
                if current_speed < SLOW_SPEED_THRESHOLD:
                    slow_vehicle_count += 1

            self._update_status(vehicle_count, slow_vehicle_count)

            if slow_vehicle_count >= CONGESTION_VEHICLE_THRESHOLD:
                print(f"[{self.camera_id}] TRAFFIC OFFICER REQUIRED | slow={slow_vehicle_count}")

        cap.release()
        print(f"[{self.camera_id}] stopped")
