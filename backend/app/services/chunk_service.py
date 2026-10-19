
from langchain_text_splitters import RecursiveCharacterTextSplitter


def clean_text(text: str) -> str:
    return " ".join(text.split())


def create_chunks(
    text: str,
    chunk_size: int = 1200,
    overlap: int = 120,
) -> list[str]:
    text = text.strip()

    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and smaller than chunk_size.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
        length_function=len,
        add_start_index=False,
    )

    chunks = splitter.split_text(text)

    return [chunk.strip() for chunk in chunks if chunk.strip()]
