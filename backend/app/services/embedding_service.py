
import torch
import numpy as np
from sentence_transformers import SentenceTransformer

torch.set_num_threads(2)

class EmbeddingService: 
    MODEL_NAME = "all-MiniLM-L6-v2"
    DIMENSION = 384

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model = SentenceTransformer(
            self.MODEL_NAME,
            device=self.device,
        )

        print(f"[Embedding] Device: {self.device}", flush=True)

    def create_embeddings(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.DIMENSION), dtype=np.float32)

        print(
            f"[Embedding] Processing {len(texts)} chunks...",
            flush=True,
        )

        embeddings = self.model.encode(
            texts,
            batch_size=16,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return np.asarray(embeddings, dtype=np.float32)

    def create_query_embedding(self, query: str) -> np.ndarray:
        embeddings = self.model.encode(
            [query],
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return np.asarray(embeddings, dtype=np.float32)
