# ABOUTME: Builds a bounded comparison packet from preselected public case studies.
# ABOUTME: Keeps fact selection deterministic before the comparison model call.
from collections.abc import Iterable, Sequence

DEFAULT_SECTIONS = ("role", "contribution", "duration", "stack", "outcome", "overview")


def comparison_sections(entries: Iterable[str], requested: Sequence[str]):
    """Select the same public fields for each case, with the requested fact first."""
    fields = tuple(dict.fromkeys((*requested, *DEFAULT_SECTIONS)))
    cases = tuple(entries)
    return tuple((entry, field) for field in fields for entry in cases)
