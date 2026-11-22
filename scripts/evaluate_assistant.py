# ABOUTME: Replays versioned public cases against a configured inference provider under an explicit budget.
# ABOUTME: Compares candidate outcomes with matching baseline reports and retains evidence for review.
import argparse
import asyncio
import hashlib
import json
import time
from dataclasses import asdict, replace
from pathlib import Path

from server.assistant_harness import run_turn
from server.assistant_inference import InferenceBudgetDenied, open_model, provider_settings
from server.portfolio_guide import prepare_turn

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / "tests/evals/assistant.json"


def digest(paths):
    value = hashlib.sha256()
    for path in sorted(paths):
        value.update(str(path.relative_to(ROOT)).encode() + b"\0" + path.read_bytes() + b"\0")
    return value.hexdigest()


def regressions(baseline, candidate):
    for key in ("dataset", "provider", "model"):
        if baseline[key] != candidate[key]:
            raise ValueError(f"Incompatible benchmark {key}")
    previous = {row["id"]: row for row in baseline["cases"]}
    current = {row["id"]: row for row in candidate["cases"]}
    if previous.keys() != current.keys():
        raise ValueError("Baseline and candidate must cover identical cases")
    return [key for key in previous if previous[key]["passed"] and not current[key]["passed"]]


def matches_answer(case, text):
    answer = text.casefold()
    projects = sum(project.casefold() in answer for project in case.get("projects", []))
    return bool(text) and projects >= case.get("minimum_projects", 0) and all(
        term.casefold() in answer for term in case["required"]
    )


async def evaluate(options):
    settings = provider_settings()
    remaining = options.max_posts
    cases = json.loads(CASES.read_text())
    if options.case:
        cases = [case for case in cases if case["id"] == options.case]
        if not cases:
            raise ValueError("Unknown evaluation case")
    report = {
        "dataset": digest([CASES]), "catalog": digest([ROOT / "server/assistant_catalog.json"]),
        "skills": digest([p for p in (ROOT / "assistant_skills").rglob("*") if p.suffix in {".py", ".md"}]),
        "provider": settings.provider, "model": settings.model, "compound": options.compound, "cases": [],
    }
    baseline = None
    if options.baseline:
        if options.baseline.resolve() == options.output.resolve():
            raise ValueError("Keep baseline and candidate reports in separate files")
        baseline = json.loads(options.baseline.read_text())
        expected = {**report, "cases": [{"id": case["id"], "passed": True} for case in cases]}
        regressions(baseline, expected)
    for case in cases:
        posts = 0

        async def reserve():
            nonlocal posts, remaining
            if remaining <= 0:
                return False
            remaining -= 1
            posts += 1
            return True

        turn = prepare_turn(case["question"], case["lang"], case.get("history", []))
        if turn.compound and not options.compound:
            turn = replace(turn, compound=False, tools=())
        start = time.monotonic()
        try:
            if turn.direct_reply is not None:
                result = await run_turn(turn)
            else:
                async with open_model(reserve, settings=settings) as model:
                    result = await run_turn(turn, model)
            answer = result.text or ""
            trace = asdict(result.trace)
        except InferenceBudgetDenied:
            answer, trace = "", {"status": "budget"}
        elapsed = round((time.monotonic() - start) * 1000)
        passed = (trace["status"] == "complete" and posts <= case["max_requests"]
                  and ("destination" not in case or turn.destination == case["destination"])
                  and matches_answer(case, answer))
        report["cases"].append({"id": case["id"], "passed": passed, "answer": answer,
                                "destination": turn.destination, "http_posts": posts,
                                "elapsed_ms": elapsed, "trace": trace})
    options.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    if baseline and regressions(baseline, report):
        raise SystemExit("Candidate regressed on a previously passing case")
    if not all(case["passed"] for case in report["cases"]):
        raise SystemExit("Acceptance case failed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--max-posts", required=True, type=int, choices=range(1, 17), metavar="1..16")
    parser.add_argument("--case", help="Replay one public acceptance case by ID")
    parser.add_argument("--compound", action="store_true")
    parser.add_argument("--baseline", type=Path)
    asyncio.run(evaluate(parser.parse_args()))
