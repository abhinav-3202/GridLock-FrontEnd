"""
ParkSense - FastAPI entrypoint
--------------------------------
Starts two CameraDetector background threads on app startup (no separate
`python detector.py` process needed - just run this one file with uvicorn).

Endpoints:
    GET /traffic-status            -> status for both cameras
    GET /traffic-status/{camera_id} -> status for a single camera

Frontend polls /traffic-status every ~2s. No websockets, no broker, no DB.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from detector import CameraDetector, traffic_status, status_lock

# ---------------------------------------------------------------------------
# Camera config - edit paths here if your files live elsewhere
# ---------------------------------------------------------------------------
CAMERAS = {
    "camera1": {
        "video_path": "./videos/video1.mp4",
        "mask_path": "./masks/mask1.png",
    },
    "camera2": {
        "video_path": "./videos/video2.mp4",
        "mask_path": "./masks/mask2.png",
    },
}

detectors = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch one background thread per camera
    for camera_id, cfg in CAMERAS.items():
        detector = CameraDetector(
            camera_id=camera_id,
            video_path=cfg["video_path"],
            mask_path=cfg["mask_path"],
        )
        detector.start()
        detectors[camera_id] = detector

    yield

    # Shutdown: signal threads to stop (they're daemon threads so this is
    # best-effort cleanup, fine for a hackathon demo)
    for detector in detectors.values():
        detector.stop()


app = FastAPI(title="ParkSense Traffic API", lifespan=lifespan)

# Allow the React dev server to poll this API directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/traffic-status")
def get_all_traffic_status():
    with status_lock:
        # shallow copy is enough - inner dicts are replaced wholesale on each update
        return dict(traffic_status)


@app.get("/traffic-status/{camera_id}")
def get_camera_traffic_status(camera_id: str):
    with status_lock:
        if camera_id not in traffic_status:
            raise HTTPException(status_code=404, detail=f"Unknown camera_id '{camera_id}'")
        return traffic_status[camera_id]


@app.get("/")
def root():
    return {"message": "ParkSense API running", "endpoints": ["/traffic-status", "/traffic-status/{camera_id}"]}
