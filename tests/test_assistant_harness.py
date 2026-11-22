# ABOUTME: Checks the provider-independent turn runtime with deterministic model responses.
# ABOUTME: Executes real CodeMode and Monty runs to verify the public evidence tool boundary.
import asyncio
import json

import pytest
from pydantic_ai import Tool
from pydantic_ai.exceptions import ModelAPIError
from pydantic_ai.messages import ModelResponse, TextPart, ToolCallPart, ToolReturnPart, UserPromptPart
from pydantic_ai.models.function import FunctionModel
from pydantic_ai.usage import RequestUsage

from server.assistant_harness import ConversationTurn, Evidence, HarnessTrace, PreparedTurn, PublicSkill, run_turn

SKILL = PublicSkill(
    "public-project",
    "Describe a project.",
    "Answer using documented facts.",
    (Evidence("public-project", "Untrusted fact to summarize."),),
)


def test_direct_reply_requires_no_model():
    result = asyncio.run(run_turn(PreparedTurn("A question", direct_reply="Direct answer.")))
    assert result.text == "Direct answer."
    assert result.trace == HarnessTrace("direct", "complete", ())


def test_synthesis_sends_untrusted_data_only_in_the_user_message():
    def respond(messages, info):
        assert info.function_tools == []
        assert "Answer using documented facts." in info.instructions
        assert "Untrusted" not in info.instructions
        assert len(messages) == 1
        [part] = messages[0].parts
        assert isinstance(part, UserPromptPart)
        assert json.loads(part.content) == {
            "question": "Untrusted question",
            "history": [{"role": "assistant", "text": "Untrusted prior reply."}],
            "evidence": [{"source": "public-project", "content": "Untrusted fact to summarize."}],
        }
        return ModelResponse(parts=[TextPart("Grounded answer.")], usage=RequestUsage(input_tokens=40, output_tokens=10))

    turn = PreparedTurn(
        "Untrusted question", (SKILL,), history=(ConversationTurn("assistant", "Untrusted prior reply."),),
    )
    result = asyncio.run(run_turn(turn, FunctionModel(respond)))
    assert result.text == "Grounded answer."
    assert result.trace == HarnessTrace(
        "synthesis", "complete", (SKILL.name,), model_requests=1, input_tokens=40, output_tokens=10,
    )


def test_compound_calls_scoped_tools_in_monty_then_synthesizes_with_tools_unavailable():
    calls = []

    def find_project(query: str) -> str:
        """Find a public project for a query."""
        calls.append(("find", query))
        return "approved-slug"

    def read_project(slug: str) -> str:
        """Read the selected public project."""
        calls.append(("read", slug))
        return "Approved public description."

    def respond(messages, info):
        if info.function_tools:
            assert info.model_settings["tool_choice"] == "required"
            [wrapper] = info.function_tools
            assert wrapper.name == "run_code"
            assert "find_project" in wrapper.description
            assert "read_project" in wrapper.description
            return ModelResponse(
                parts=[ToolCallPart("run_code", {
                    "code": "slug = await find_project(query='project')\nawait read_project(slug=slug)",
                })],
                usage=RequestUsage(input_tokens=30, output_tokens=10),
            )
        [returned] = messages[-1].parts
        assert isinstance(returned, ToolReturnPart)
        assert returned.content == "Approved public description."
        return ModelResponse(
            parts=[TextPart("One selected project.")], usage=RequestUsage(input_tokens=65, output_tokens=4),
        )

    turn = PreparedTurn("Summarize a project", (SKILL,), compound=True, tools=(Tool(find_project), Tool(read_project)))
    result = asyncio.run(run_turn(turn, FunctionModel(respond)))
    assert calls == [("find", "project"), ("read", "approved-slug")]
    assert result.text == "One selected project."
    assert result.trace == HarnessTrace(
        "compound", "complete", (SKILL.name,), 2, 1, 2, input_tokens=95, output_tokens=14,
    )


def test_monty_nested_call_ceiling():
    calls = []

    def read_project(index: int) -> int:
        """Read a public project by its index."""
        calls.append(index)
        return index

    def respond(messages, info):
        return ModelResponse(parts=[ToolCallPart("run_code", {
            "code": "for index in range(4):\n    await read_project(index=index)",
        })])

    turn = PreparedTurn("Summarize projects", compound=True, tools=(Tool(read_project),))
    result = asyncio.run(run_turn(turn, FunctionModel(respond)))
    assert calls == [0, 1, 2]
    assert result.text is None
    assert result.trace.model_requests == 1
    assert result.trace.run_code_calls == 1
    assert result.trace.nested_tool_calls == 3


@pytest.mark.parametrize("second_request", [False, True])
def test_compound_refuses_repeated_wrappers(second_request):
    calls = []

    def read_project() -> str:
        """Read the public project facts."""
        calls.append(True)
        return "A public fact."

    def respond(messages, info):
        call = ToolCallPart("run_code", {"code": "await read_project()"})
        if second_request or not info.function_tools:
            return ModelResponse(parts=[call])
        return ModelResponse(parts=[call, ToolCallPart("run_code", call.args)])

    turn = PreparedTurn("Summarize projects", compound=True, tools=(Tool(read_project),))
    result = asyncio.run(run_turn(turn, FunctionModel(respond)))
    assert len(calls) == int(second_request)
    assert result.text is None
    assert result.trace.status == "budget"
    assert result.trace.model_requests == (2 if second_request else 1)
    assert result.trace.run_code_calls == int(second_request)


@pytest.mark.parametrize(
    ("response", "status"),
    [
        (ModelResponse(parts=[TextPart("<tool_call><function=run_code>")]), "failed"),
        (ModelResponse(parts=[TextPart("Prefix <parameter=code>")]), "failed"),
        (ModelResponse(parts=[TextPart("Partial")], finish_reason="length"), "length"),
        (ModelResponse(parts=[TextPart("Partial")], state="interrupted"), "interrupted"),
        (ModelResponse(parts=[TextPart("Partial")], state="suspended"), "interrupted"),
    ],
)
def test_incomplete_or_malformed_responses_are_never_used(response, status):
    result = asyncio.run(run_turn(PreparedTurn("Question."), FunctionModel(lambda *_: response)))
    assert result.text is None
    assert result.trace.status == status
    assert result.trace.model_requests == 1


@pytest.mark.parametrize("usage", [RequestUsage(input_tokens=12001), RequestUsage(output_tokens=801)])
def test_token_limit_discards_model_answer(usage):
    response = ModelResponse(parts=[TextPart("An over-budget answer.")], usage=usage)
    result = asyncio.run(run_turn(PreparedTurn("Question."), FunctionModel(lambda *_: response)))
    assert result.text is None
    assert result.trace == HarnessTrace(
        "synthesis", "budget", (), model_requests=1,
        input_tokens=usage.input_tokens, output_tokens=usage.output_tokens,
    )


def test_turn_deadline_discards_in_progress_model_response(monkeypatch):
    async def respond(*_):
        await asyncio.sleep(10)
        return ModelResponse(parts=[TextPart("Late answer.")])

    monkeypatch.setattr("server.assistant_harness.TURN_DEADLINE_SECONDS", 0.05)
    result = asyncio.run(run_turn(PreparedTurn("Question."), FunctionModel(respond)))
    assert result.text is None
    assert result.trace == HarnessTrace("synthesis", "interrupted", (), model_requests=1)



def test_model_failure_does_not_expose_exception_details():
    def respond(*_):
        raise ModelAPIError("provider-model", "private details")

    result = asyncio.run(run_turn(PreparedTurn("Question."), FunctionModel(respond)))
    assert result.text is None
    assert result.trace == HarnessTrace("synthesis", "failed", (), model_requests=1)
