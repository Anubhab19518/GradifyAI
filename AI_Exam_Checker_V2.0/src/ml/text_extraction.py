import os

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


class TextExtractor:
    """
    Utility class to extract text from PDF, DOCX, and TXT files.
    Used by AdvancedRAGModel.upload_and_process_documents().
    """

    def extract_text_from_pdf(self, file_path):
        if not PYMUPDF_AVAILABLE:
            raise ImportError("PyMuPDF (fitz) is not installed. Run: pip install pymupdf")
        pages = []
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text = page.get_text("text")
                if text.strip():
                    pages.append(text)
            doc.close()
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF '{file_path}': {e}") from e
        return pages

    def extract_text_from_docx(self, file_path):
        if not DOCX_AVAILABLE:
            raise ImportError("python-docx is not installed. Run: pip install python-docx")
        try:
            doc = Document(file_path)
            full_text = "\n".join(
                para.text for para in doc.paragraphs if para.text.strip()
            )
            return [full_text] if full_text.strip() else []
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX '{file_path}': {e}") from e

    def extract_text_from_txt(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return [content] if content.strip() else []
        except Exception as e:
            raise ValueError(f"Failed to read TXT file '{file_path}': {e}") from e
