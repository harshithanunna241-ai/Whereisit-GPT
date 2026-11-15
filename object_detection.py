
from pathlib import Path
from ultralytics import YOLO

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_DIR = PROJECT_ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "yolov8n.pt"

# Download pretrained weights automatically if missing
model = YOLO(str(MODEL_PATH))


def detect_objects(image_path: str):
    """
    Detect everyday objects in an image using YOLO.
    Returns detected object names and confidence scores.
    """

    results = model.predict(
        source=image_path,
        conf=0.25,
        verbose=False
    )

    detections = []

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            detections.append({
                "object": result.names[class_id],
                "confidence": round(confidence, 4)
            })

    return detections
