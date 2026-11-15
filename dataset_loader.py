
import json
from pathlib import Path
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATASET_DIR = PROJECT_ROOT / "data" / "coco2017"
IMAGE_DIR = DATASET_DIR / "images" / "val2017"
ANNOTATION_FILE = DATASET_DIR / "annotations" / "instances_val2017.json"


def load_dataset():
    if not ANNOTATION_FILE.exists():
        raise FileNotFoundError(
            f"Annotation file not found: {ANNOTATION_FILE}"
        )

    with open(ANNOTATION_FILE, "r", encoding="utf-8") as file:
        dataset = json.load(file)

    categories = {
        category["id"]: category["name"]
        for category in dataset["categories"]
    }

    images = {
        image["id"]: image
        for image in dataset["images"]
    }

    samples = []

    for annotation in dataset["annotations"]:
        image_info = images.get(annotation["image_id"])

        if image_info is None:
            continue

        image_path = IMAGE_DIR / image_info["file_name"]

        if not image_path.exists():
            continue

        samples.append({
            "image_path": str(image_path),
            "object": categories.get(
                annotation["category_id"], "unknown"
            ),
            "bbox": annotation["bbox"],
            "image_id": annotation["image_id"],
        })

    return samples


if __name__ == "__main__":
    samples = load_dataset()

    print("Dataset loaded successfully!")
    print("Total annotated objects:", len(samples))
    print("Unique images:", len(set(s["image_id"] for s in samples)))
    print("Categories:", sorted(set(s["object"] for s in samples)))

    if samples:
        first_image = Image.open(samples[0]["image_path"])
        print("First image size:", first_image.size)
