# DocuSense — AI-Powered PDF Document Analyzer

**Understand your documents. Ask questions. Discover insights.**

DocuSense is a local AI-powered PDF document analysis application that helps users understand lengthy documents through semantic search, AI-generated answers, extractive summaries, and key-point extraction.

Instead of manually searching through a PDF, users can upload a document, review its summary, explore important points, ask questions in natural language, and inspect the source passages retrieved from the document.

The application combines a React frontend, FastAPI backend, local text embeddings, FAISS vector search, LangChain, and an Ollama-hosted language model.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Learning Outcomes](#learning-outcomes)
- [License](#license)
- [Project Summary](#project-summary)

---

## Overview

Reading and understanding large PDF documents can be time-consuming, especially when users need specific information, definitions, explanations, or key takeaways.

DocuSense addresses this problem through a document question-answering workflow based on Retrieval-Augmented Generation (RAG).

The application extracts text from uploaded PDFs, divides the text into smaller chunks, converts those chunks into vector embeddings, and stores the vectors in a FAISS index. When a user asks a question, the system retrieves semantically relevant passages and passes them to a locally running language model to generate a readable answer.

DocuSense also provides an extractive summary and key points to help users review a document quickly.

### Project Goals

- Simplify the process of understanding lengthy PDF documents.
- Enable natural-language questions about uploaded documents.
- Retrieve relevant passages using semantic similarity.
- Generate answers grounded in retrieved document context.
- Extract summaries and key points without requiring a cloud-based summarization API.
- Provide a clean, light-themed interface for document analysis.

---

## System Architecture

```text
                    USER
                     |
                     v
             React + Vite UI
                     |
                     v
               FastAPI Backend
                     |
          +----------+-----------+
          |                      |
          v                      v
     PDF Processing        Chat Request
          |                      |
          v                      v
       PyMuPDF          Local Query Embedding
          |                      |
          v                      v
    Extracted Text          FAISS Search
          |                      |
          v                      v
      Text Chunks          Relevant Passages
          |                      |
          v                      v
 Local SentenceTransformer   LangChain Prompt
          |                      |
          v                      v
    Chunk Embeddings       Ollama + Qwen 2.5
          |                      |
          v                      v
     FAISS Index          Generated Answer
          |                      |
          +----------+-----------+
                     |
                     v
          Response to React UI
```

The upload workflow also generates the document summary and key points, which are returned to the frontend.

---

## Project Structure

The following is a representative structure based on the current project architecture. Keep existing filenames and additional files as they are in your repository.

```text
ai-document-analyzer/
|
+-- backend/
|   +-- app/
|   |   +-- main.py
|   |   +-- routes/
|   |   |   +-- documents.py
|   |   |
|   |   +-- services/
|   |       +-- answer_service.py
|   |       +-- pdf_service.py
|   |       +-- chunk_service.py
|   |       +-- embedding_service.py
|   |       +-- vector_service.py
|   |       +-- summary_service.py
|   |
|   +-- requirements.txt
|   +-- venv/
|   +-- uploads/
|
+-- frontend/
|   +-- src/
|   |   +-- App.jsx
|   |   +-- index.css
|   |
|   +-- package.json
|   +-- index.html
|
+-- README.md
+-- .gitignore
```

The virtual environment, uploaded documents, and other generated files should be excluded from version control as appropriate.

---

## Learning Outcomes

Building DocuSense provides practical experience with:

- Full-stack application development using React and FastAPI.
- REST API design and request validation.
- PDF text extraction and document preprocessing.
- Text chunking and vector embeddings.
- Semantic search and FAISS indexing.
- Retrieval-Augmented Generation (RAG).
- Local language-model inference with Ollama.
- Prompt engineering and evidence-grounded answering.
- Extractive summarization and key-point extraction.
- Error handling, performance measurement, and UI integration.

---

## License

Choose and add an appropriate open-source license before publishing the repository publicly. Ensure that the licenses of all dependencies and model weights are compatible with your intended distribution.

---

## Project Summary

**DocuSense** is a local AI-powered PDF analyzer that combines semantic retrieval, local language-model inference, extractive summarization, and key-point extraction in a single web application.

It demonstrates a practical RAG workflow using React, FastAPI, Sentence Transformers, FAISS, LangChain, and Ollama.

The current version is intended as a learning and portfolio project, with persistent indexing, advanced retrieval, OCR, and production deployment remaining potential areas for future development.