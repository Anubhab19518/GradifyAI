from transformers import pipeline

class TextProcessor:
    def __init__(self, model_name="facebook/bart-large-cnn"):
        """
        Initializes the Hugging Face NLP pipeline for text summarization.
        :param model_name: The model name for the Hugging Face pipeline.
        """
        self.summarizer = pipeline("summarization", model=model_name)

    def process_text(self, text, chunk_size=300):
        """
        Analyze, detect redundancies, correct errors, and refine the text.
        :param text: Raw text extracted from the image.
        :param chunk_size: Maximum size of each text chunk.
        :return: Processed text.
        """
        try:
            # Split the text into smaller chunks for processing
            text_chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
            processed_chunks = []

            for chunk in text_chunks:
                # Correct errors and improve readability for each chunk
                processed_chunk = self.correction_model(f"correct: {chunk}", max_length=512, truncation=True)
                processed_chunks.append(processed_chunk[0]['generated_text'])

            # Combine processed chunks
            return " ".join(processed_chunks)

        except Exception as e:
            raise RuntimeError(f"Text processing failed: {e}")

