import cv2
import numpy as np
from io import BytesIO
from pdf2image import convert_from_bytes
from src.utils.logging import get_logger

logger = get_logger("image_preprocessor_logs")

class ImagePreprocessor:
    def __init__(self):
        logger.info("Initializing ImagePreprocessor.")

    def preprocess_image(self, file_content, file_extension):
        """
        Preprocesses an image or a PDF (first page).

        :param file_content: File content in bytes
        :param file_extension: File extension ('.jpg', '.png', or '.pdf')
        :return: Processed image in byte format
        """
        try:
            logger.info("Preprocessing file.")

            if file_extension.lower() == ".pdf":
                # Convert PDF to image (first page only)
                images = convert_from_bytes(file_content, dpi=300)
                if not images:
                    raise ValueError("Failed to extract images from PDF.")
                
                # Convert PIL image to OpenCV format
                image = np.array(images[0])
                image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                # Process regular images (JPG, PNG)
                np_image = np.frombuffer(file_content, dtype=np.uint8)
                image = cv2.imdecode(np_image, cv2.IMREAD_GRAYSCALE)
            
            # Resize image for better detection
            image = cv2.resize(image, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LINEAR)

            # Apply Gaussian blur for noise reduction
            image = cv2.GaussianBlur(image, (5, 5), 0)

            # Apply Otsu's thresholding to binarize the image
            _, image = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # Convert image back to byte format
            _, buffer = cv2.imencode('.jpg', image)
            logger.debug("Image preprocessing completed successfully.")
            return buffer.tobytes()

        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise RuntimeError(f"Image preprocessing failed: {e}")