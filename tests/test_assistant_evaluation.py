# ABOUTME: Verifies that the candidate release gate compares like-for-like runs.
# ABOUTME: Replays zero-inference acceptance cases against the deployed guide.
import asyncio
import json

import pytest
from scripts.evaluate_assistant import CASES, matches_answer, regressions
from server.assistant_harness import run_turn
from server.portfolio_guide import prepare_turn


def test_review_gate_rejects_a_regression_and_incomparable_results():
    baseline = {"provider": "fixture", "model": "fixture", "dataset": "v1",
                "cases": [{"id": "comparison", "passed": True}]}
    assert regressions(baseline, baseline) == []
    assert regressions(baseline, {**baseline, "cases": [{"id": "comparison", "passed": False}]}) == ["comparison"]
    with pytest.raises(ValueError):
        regressions(baseline, {**baseline, "dataset": "v2"})
    with pytest.raises(ValueError):
        regressions(baseline, {**baseline, "cases": []})


@pytest.mark.parametrize("case", json.loads(CASES.read_text()), ids=lambda case: case["id"])
def test_release_case_uses_expected_budget(case):
    turn = prepare_turn(case["question"], case["lang"], case.get("history", []))
    if case["max_requests"] == 0:
        result = asyncio.run(run_turn(turn))
        assert turn.destination == case["destination"]
        assert matches_answer(case, result.text)
        assert result.trace.model_requests == 0
    else:
        assert turn.direct_reply is None
        assert turn.compound == (case["max_requests"] == 2)


def test_selection_needs_evidence_for_two_distinct_cases():
    case = {"required": [], "projects": ["Cookobot", "GLIO-IA"], "minimum_projects": 2}
    assert not matches_answer(case, "Cookobot y Cookobot")
    assert matches_answer(case, "Cookobot y GLIO-IA")


@pytest.mark.parametrize(("lang", "unsupported_claim"), [
    ("es", "Cookobot: Desarrolló modelos TensorFlow para reconocimiento visual de ingredientes y utensilios."),
    ("en", "Alex trained the TensorFlow models for Cookobot."),
])
def test_attribution_gate_rejects_unsupported_claim_even_with_correct_evidence(lang, unsupported_claim):
    case = next(row for row in json.loads(CASES.read_text()) if row["id"] == f"selection-{lang}")
    reply = prepare_turn(case["question"], lang, ()).direct_reply
    assert matches_answer(case, reply)
    assert not matches_answer(case, f"{reply}\n\n{unsupported_claim}")
