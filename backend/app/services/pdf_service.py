
import pymupdf


def extract_text_from_pdf(file_path: str) -> str:
    extracted_text = []

    with pymupdf.open(file_path) as document:
        for page in document:
            text = page.get_text("text")

            if text.strip():
                extracted_text.append(text)

    return "\n".join(extracted_text)
