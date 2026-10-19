from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.documents import router as document_router

app = FastAPI(
    title="AI Document Analyzer",
    description="PDF analysis and retrieval-based Q&A",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(
    document_router,
    prefix="/api/documents",
    tags=["Documents"],
)


@app.get("/")
def root():
    return {"message": "AI Document Analyzer API is running"}