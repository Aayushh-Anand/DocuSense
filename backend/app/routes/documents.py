
import shutil
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field

from app.services.answer_service import generate_answer
from app.services.pdf_service import extract_text_from_pdf
from app.services.chunk_service import create_chunks
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.summary_service import analyze_document


router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

embedding_service = EmbeddingService()
vector_service = VectorService()


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=10)


@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}.pdf"
    started = time.perf_counter()

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(
            f"[Upload] File saved in {time.perf_counter() - started:.2f}s",
            flush=True,
        )

        # Step 1: Extract text from PDF
        stage = time.perf_counter()
        text = extract_text_from_pdf(str(file_path))

        print(
            f"[Upload] PDF extraction: {time.perf_counter() - stage:.2f}s",
            flush=True,
        )

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "No extractable text found. "
                    "Scanned PDFs may require OCR."
                ),
            )

        # Step 2: Split document into chunks
        stage = time.perf_counter()
        chunks = create_chunks(text)

        print(
            f"[Upload] Chunking: {time.perf_counter() - stage:.2f}s "
            f"({len(chunks)} chunks)",
            flush=True,
        )

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="Could not create document chunks.",
            )

        # Step 3: Generate embeddings
        stage = time.perf_counter()
        embeddings = embedding_service.create_embeddings(chunks)

        print(
            f"[Upload] Embeddings: {time.perf_counter() - stage:.2f}s",
            flush=True,
        )

        # Step 4: Generate summary and key points
        stage = time.perf_counter()
        summary, key_points = analyze_document(
            text,
            max_sentences=5,
            max_points=5,
        )

        print(
            f"[Upload] Summary and key points: "
            f"{time.perf_counter() - stage:.2f}s",
            flush=True,
        )

        # Step 5: Update the in-memory vector index
        stage = time.perf_counter()
        vector_service.replace_chunks(chunks, embeddings)

        print(
            f"[Upload] Index update: {time.perf_counter() - stage:.2f}s",
            flush=True,
        )

        print(
            f"[Upload] TOTAL: {time.perf_counter() - started:.2f}s",
            flush=True,
        )

        return {
            "filename": file.filename,
            "characters": len(text),
            "chunks": len(chunks),
            "embedding_dimension": int(embeddings.shape[1]),
            "summary": summary,
            "key_points": key_points,
            "message": "PDF processed successfully.",
        }

    except HTTPException:
        raise

    except Exception as error:
        print(f"[Upload] ERROR: {error!r}", flush=True)

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {error}",
        ) from error

    finally:
        file.file.close()


@router.post("/chat")
def chat_with_document(request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not vector_service.chunks:
        raise HTTPException(
            status_code=400,
            detail="Upload a PDF before asking questions.",
        )

    try:
        # Step 1: Convert the question into an embedding
        query_embedding = embedding_service.create_query_embedding(
            question
        )

        # Step 2: Retrieve the most relevant chunks
        results = vector_service.search(
            query_embedding,
            request.top_k,
        )

        passages = [
            result["chunk"].strip()
            for result in results
            if result.get("chunk", "").strip()
        ]

        if not passages:
            return {
                "question": question,
                "answer": (
                    "I couldn't find relevant information "
                    "in the uploaded PDF."
                ),
                "sources": [],
                "answer_type": "extractive_answer",
            }

        # Step 3: Create an answer from retrieved passages
        answer = generate_answer(question, passages)

        if not isinstance(answer, str) or not answer.strip():
            answer = passages[0]

        return {
            "question": question,
            "answer": answer.strip(),
            "sources": results,
            "answer_type": "generated_answer",
        }

    except Exception as error:
        print(f"[Chat] ERROR: {error!r}", flush=True)

        raise HTTPException(
            status_code=500,
            detail=f"Question processing failed: {error}",
        ) from error
