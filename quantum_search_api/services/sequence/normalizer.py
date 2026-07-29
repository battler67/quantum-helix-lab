from __future__ import annotations

from dataclasses import dataclass

from .fasta_parser import parse_fasta
from .validator import validate_query_acgt, validate_target_iupac


@dataclass(frozen=True)
class NormalizedSequence:
    original: str
    sequence: str
    length: int
    ambiguous_bases: int
    has_ambiguity: bool
    sequence_preview: str


def normalize_query_input(text: str, *, is_fasta: bool = False, max_length: int = 128) -> NormalizedSequence:
    sequence = parse_fasta(text)[0].sequence if is_fasta or text.lstrip().startswith(">") else text
    normalized = validate_query_acgt(sequence)
    if len(normalized) > max_length:
        raise ValueError(f"Query length {len(normalized)} exceeds configured maximum {max_length}")
    return NormalizedSequence(
        original=text,
        sequence=normalized,
        length=len(normalized),
        ambiguous_bases=0,
        has_ambiguity=False,
        sequence_preview=preview_sequence(normalized),
    )


def normalize_target_sequence(text: str) -> NormalizedSequence:
    normalized, ambiguous = validate_target_iupac(text)
    return NormalizedSequence(
        original=text,
        sequence=normalized,
        length=len(normalized),
        ambiguous_bases=ambiguous,
        has_ambiguity=ambiguous > 0,
        sequence_preview=preview_sequence(normalized),
    )


def preview_sequence(sequence: str, width: int = 24) -> str:
    if len(sequence) <= width:
        return sequence
    return f"{sequence[:width]}..."
