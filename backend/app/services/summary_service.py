
import re
from collections import Counter


STOPWORDS = set("""
a an the and or but if while is am are was were be been being
to of in on at by for from with about as into through during
it its this that these those i you he she we they them their
my your our what which who when where why how can could should
would will may might do does did have has had not no so than
then also very more most some any each other such only own
""".split())


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", text)
        if sentence.strip()
    ]


def tokenize(text: str) -> list[str]:
    words = re.findall(
        r"\b[a-zA-Z0-9][a-zA-Z0-9'-]*\b",
        text.lower(),
    )

    return [
        word for word in words
        if word not in STOPWORDS and len(word) > 2
    ]


def rank_sentences(sentences: list[str]) -> list[tuple[str, float]]:
    if not sentences:
        return []

    sentence_words = [tokenize(sentence) for sentence in sentences]
    frequencies = Counter(
        word for words in sentence_words for word in words
    )

    if not frequencies:
        return [(sentence, 0.0) for sentence in sentences]

    max_frequency = max(frequencies.values())
    normalized = {
        word: count / max_frequency
        for word, count in frequencies.items()
    }

    ranked = []

    for position, (sentence, words) in enumerate(
        zip(sentences, sentence_words)
    ):
        score = (
            sum(normalized[word] for word in words) / len(words)
            if words else 0.0
        )

        score += 0.03 / (position + 1)
        ranked.append((position, sentence, score))

    ranked.sort(key=lambda item: item[2], reverse=True)

    return [
        (sentence, score)
        for _, sentence, score in ranked
    ]


def analyze_document(
    text: str,
    max_sentences: int = 5,
    max_points: int = 5,
) -> tuple[str, list[str]]:
    sentences = split_sentences(text)

    if not sentences:
        return "No readable text was found in this document.", []

    if max_sentences < 1 or max_points < 1:
        raise ValueError("Summary and key-point limits must be positive.")

    ranked = rank_sentences(sentences)

    # Map each sentence to its original position for readable ordering.
    positions = {sentence: i for i, sentence in enumerate(sentences)}

    summary_sentences = sorted(
        (sentence for sentence, _ in ranked[:max_sentences]),
        key=lambda sentence: positions[sentence],
    )

    candidates = [
        sentence
        for sentence, _ in ranked
        if len(tokenize(sentence)) >= 4
    ]

    if not candidates:
        candidates = [sentence for sentence, _ in ranked]

    key_points = []
    seen = set()

    for sentence in candidates:
        normalized_sentence = sentence.casefold()

        if normalized_sentence not in seen:
            key_points.append(sentence)
            seen.add(normalized_sentence)

        if len(key_points) >= max_points:
            break

    return " ".join(summary_sentences), key_points


def generate_summary(text: str, max_sentences: int = 5) -> str:
    summary, _ = analyze_document(
        text,
        max_sentences=max_sentences,
        max_points=5,
    )
    return summary


def extract_key_points(
    text: str,
    max_points: int = 5,
) -> list[str]:
    _, points = analyze_document(
        text,
        max_sentences=5,
        max_points=max_points,
    )
    return points
