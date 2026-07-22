import pdfplumber
from docx import Document
from src.utils.logging import get_logger
logger = get_logger("document_extractor_logs")


def extract_text_from_pdf(file_path):
    logger.info(f"Extracting text from PDF: {file_path}")
    try:
        texts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                texts.append(page.extract_text())
        logger.debug(f"Extracted text from PDF: {texts}")
        return texts
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {e}")
        raise


def extract_text_from_docx(file_path):
    logger.info(f"Extracting text from DOCX: {file_path}")
    try:
        doc = Document(file_path)
        paragraphs = [paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()]
        logger.debug(f"Extracted text from DOCX: {paragraphs}")
        return paragraphs
    except Exception as e:
        logger.error(f"Failed to extract text from DOCX: {e}")
        raise


def extract_text_from_txt(file_path):
    logger.info(f"Extracting text from TXT: {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        logger.debug(f"Extracted text from TXT: {text}")
        return text
    except Exception as e:
        logger.error(f"Failed to extract text from TXT: {e}")
        raise
