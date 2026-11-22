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
        assert all(term in result.text for term in case["required"])
        assert result.trace.model_requests == 0
    else:
        assert turn.direct_reply is None
        assert turn.compound == (case["max_requests"] == 2)


def test_selection_needs_evidence_for_two_distinct_cases():
    case = next(row for row in json.loads(CASES.read_text()) if row["id"] == "selection-es")
    assert not matches_answer(case, "Cookobot y Cookobot")
    assert matches_answer(case, "Cookobot y GLIO-IA")
