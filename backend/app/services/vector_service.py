
import faiss
import numpy as np


class VectorService:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = self._new_index()
        self.chunks: list[str] = []

    def _new_index(self):
        return faiss.IndexFlatIP(self.dimension)

    def _prepare_embeddings(self, embeddings):
        embeddings = np.asarray(embeddings, dtype=np.float32)

        if embeddings.ndim != 2:
            raise ValueError("Embeddings must be a 2D array.")

        if embeddings.shape[1] != self.dimension:
            raise ValueError("Embedding dimension does not match.")

        if not np.isfinite(embeddings).all():
            raise ValueError("Embeddings contain invalid values.")

        embeddings = np.ascontiguousarray(embeddings.copy())

        if len(embeddings):
            faiss.normalize_L2(embeddings)

        return embeddings

    def replace_chunks(self, chunks, embeddings):
        embeddings = self._prepare_embeddings(embeddings)

        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings count do not match.")

        new_index = self._new_index()

        if len(chunks):
            new_index.add(embeddings)

        self.index = new_index
        self.chunks = list(chunks)

    def add_chunks(self, chunks, embeddings):
        embeddings = self._prepare_embeddings(embeddings)

        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings count do not match.")

        if len(chunks):
            self.index.add(embeddings)
            self.chunks.extend(chunks)

    def search(self, query_embedding, top_k: int = 3):
        if top_k < 1 or self.index.ntotal == 0:
            return []

        query_embedding = self._prepare_embeddings(query_embedding)

        if query_embedding.shape[0] != 1:
            raise ValueError("Search expects exactly one query embedding.")

        scores, indices = self.index.search(
            query_embedding,
            min(top_k, self.index.ntotal),
        )

        results = []

        for score, chunk_index in zip(scores[0], indices[0]):
            if chunk_index < 0:
                continue

            results.append({
                "chunk": self.chunks[int(chunk_index)],
                "score": float(score),
            })

        return results

    def reset(self):
        self.index = self._new_index()
        self.chunks.clear()
