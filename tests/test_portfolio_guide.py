# ABOUTME: Checks deterministic portfolio facts and localized skill evidence.
# ABOUTME: Covers project matching, comparison, conversation follow-ups, and safe evidence scope.
import json

import pytest

from server.portfolio_guide import catalog, prepare_turn

DURATIONS = {
    "aipassportguardnet": 11,
    "cookobot": 5,
    "crop-monitoring": 6,
    "dlt4aitoys": 10,
    "glio-ia": 24,
    "lost-scout": 4,
    "multimedia-arvr": 3,
    "neuroevolutionary-ai": 6,
    "simdat-4-0": 18,
    "smart-scale": 4,
    "wotics": 18,
}


@pytest.mark.parametrize("lang", ["es", "en"])
@pytest.mark.parametrize(("project", "months"), DURATIONS.items())
def test_reads_exact_published_duration_in_each_language(lang, project, months):
    title = catalog()[lang]["entries"][project]["title"]
    question = f"¿Cuánto duró {title}?" if lang == "es" else f"How long did {title} last?"
    turn = prepare_turn(question, lang, ())
    duration = f"{months} meses" if lang == "es" else f"{months} months"
    assert duration in turn.direct_reply
    assert not turn.skills
    assert not turn.tools


@pytest.mark.parametrize("lang", ["es", "en"])
@pytest.mark.parametrize("preset", ["glio", "career", "cv"])
def test_exact_presets_need_no_inference(lang, preset):
    expected = catalog()[lang]["presets"][preset]
    turn = prepare_turn(expected["question"], lang, ())
    assert turn.direct_reply == expected["reply"]
    assert not turn.skills
    assert not turn.compound


def test_funding_followup_uses_previous_public_project():
    turn = prepare_turn("¿Y quién lo financió?", "es", [
        {"role": "user", "text": "¿Cuánto duró GLIO-IA?"},
        {"role": "assistant", "text": "24 meses"},
    ])
    assert "INNEST/2022/159" in turn.direct_reply
    assert turn.destination == "glio"


def test_missing_funding_recovers_without_inventing_a_funder():
    turn = prepare_turn("Who funded Cookobot?", "en", ())
    assert "does not specify" in turn.direct_reply


def test_comparison_has_localized_evidence_and_one_synthesis_call():
    turn = prepare_turn("Compara GLIO-IA con SIMDAT", "es", ())
    skill, = turn.skills
    assert skill.name == "compare-projects"
    assert turn.direct_reply is None
    assert not turn.compound
    assert not turn.compound_instructions
    assert "Spanish" in skill.instructions
    by_source = {item.source: item.content for item in skill.evidence}
    assert by_source["glio-ia/duration"].endswith("24 meses")
    assert by_source["simdat-4-0/duration"].endswith("18 meses")


@pytest.mark.parametrize(("lang", "question"), [
    ("es", "¿Qué dos proyectos demuestran mejor experiencia en robótica?"),
    ("en", "Which two projects best demonstrate experience in robotics?"),
])
def test_compound_recommendation_has_bounded_evidence_from_multiple_cases(lang, question):
    turn = prepare_turn(question, lang, ())
    assert turn.compound
    assert "await search_evidence" in turn.compound_instructions
    assert [skill.name for skill in turn.skills] == ["project-facts", "compare-projects"]
    search, read = (tool.function for tool in turn.tools)
    hits = search("visión artificial" if lang == "es" else "computer vision")
    assert len(hits) <= 6
    assert {"glio-ia", "cookobot"} <= {hit["source"].split("/")[0] for hit in hits}
    assert len(read([hits[0]["source"]] * 12)) == 6
    assert read(["../../.env", "cv/overview", "profile/overview"]) == []


@pytest.mark.parametrize(("lang", "question"), [
    ("es", "¿Qué dos proyectos demuestran mejor experiencia en visión artificial aplicada a cultivos?"),
    ("en", "Which two projects best demonstrate computer vision in agriculture?"),
])
def test_qualified_vision_recommendation_keeps_its_question_specific_evidence(lang, question):
    turn = prepare_turn(question, lang, ())
    assert turn.direct_reply is None
    assert turn.compound
    assert any(item.source.startswith("crop-monitoring/") for skill in turn.skills for item in skill.evidence)


@pytest.mark.parametrize(("lang", "question", "credit", "scope"), [
    ("es", "¿Alex entrenó los modelos TensorFlow de Cookobot?", "Integré modelos TensorFlow",
     "La documentación del proyecto no me atribuye su creación ni su entrenamiento."),
    ("en", "Did Alex develop the TensorFlow models for Cookobot?", "Integrated TensorFlow models",
     "The project documentation does not attribute model creation or training to me."),
])
def test_cookobot_model_authorship_question_returns_the_documented_scope(lang, question, credit, scope):
    turn = prepare_turn(question, lang, ())
    assert credit in turn.direct_reply
    assert scope in turn.direct_reply
    assert not turn.skills


@pytest.mark.parametrize(("lang", "question", "credit"), [
    ("es", "Compara GLIO-IA con Cookobot", "Integré modelos TensorFlow"),
    ("en", "Compare GLIO-IA and Cookobot", "Integrated TensorFlow models"),
])
def test_open_cookobot_comparison_preserves_scope_and_published_attribution(lang, question, credit):
    turn = prepare_turn(question, lang, ())
    assert turn.direct_reply is None
    skill, = turn.skills
    assert skill.name == "compare-projects"
    evidence = {item.source: item.content for item in skill.evidence}
    assert credit in evidence["cookobot/contribution"]
    for project in ("cookobot", "glio-ia"):
        assert f"{project}/overview" in evidence
        assert f"{project}/stack" in evidence


@pytest.mark.parametrize(("lang", "question", "credit"), [
    ("es", "Explícame cómo funcionaba la visión artificial de Cookobot", "Integré modelos TensorFlow"),
    ("en", "Explain how Cookobot's computer vision worked", "Integrated TensorFlow models"),
    ("es", "Compara las tecnologías de GLIO-IA y Cookobot", "Integré modelos TensorFlow"),
    ("en", "Compare the technologies used in GLIO-IA and Cookobot", "Integrated TensorFlow models"),
])
def test_cookobot_synthesis_prioritizes_published_attribution_evidence(lang, question, credit):
    turn = prepare_turn(question, lang, ())
    skill, = turn.skills
    assert skill.evidence[0].source == "cookobot/contribution"
    assert credit in skill.evidence[0].content
    assert any(item.source == "cookobot/approach" or item.source == "cookobot/stack" for item in skill.evidence)


@pytest.mark.parametrize(("lang", "question", "credit"), [
    ("es", "¿Qué aportó Alex a GLIO-IA?", "Investigué y desarrollé modelos de Deep Learning"),
    ("en", "What were Alex's contributions to GLIO-IA?", "Researched and developed Deep Learning models"),
])
def test_contribution_question_returns_work_performed_in_addition_to_role(lang, question, credit):
    turn = prepare_turn(question, lang, ())
    assert credit in turn.direct_reply
    assert turn.destination == "glio"
    assert not turn.skills


@pytest.mark.parametrize("question", ["How do I bake a cake?", "How long did Project Atlantis last?"])
def test_unknown_request_gets_localized_recovery_without_a_model(question):
    assert prepare_turn(question, "en", ()).direct_reply == catalog()["en"]["fallback"]


def test_multiple_facts_are_available_in_one_synthesis_turn():
    turn = prepare_turn("How long did GLIO-IA last and who funded it?", "en", ())
    skill, = turn.skills
    assert turn.direct_reply is None
    assert not turn.compound
    assert {"glio-ia/duration", "glio-ia/funding"} <= {item.source for item in skill.evidence}



def test_public_catalog_excludes_private_and_infrastructure_content():
    public_catalog = json.dumps(catalog())
    assert "NVIDIA_API_KEY" not in public_catalog
    assert "@" not in public_catalog
    assert ".pdf" not in public_catalog
    assert "https://" not in public_catalog and "http://" not in public_catalog
    assert catalog()["es"]["entries"]["glio-ia"]["url"] == "/work/glio-ia"
    assert catalog()["en"]["entries"]["glio-ia"]["url"] == "/en/work/glio-ia"


@pytest.mark.parametrize(("lang", "question", "destination", "source"), [
    ("es", "¿Cuál es su formación?", "experience", "education/overview"),
    ("en", "What is his education?", "experience", "education/overview"),
    ("en", "What did he study?", "experience", "education/overview"),
    ("en", "Where did he study?", "experience", "education/overview"),
    ("es", "¿Dónde estudió Alex?", "experience", "education/overview"),
    ("es", "¿Cuáles son sus capacidades?", "skills", "skills/agents"),
    ("en", "What are his capabilities?", "skills", "skills/agents"),
])
def test_profile_topics_use_their_published_evidence(lang, question, destination, source):
    turn = prepare_turn(question, lang, ())
    assert turn.destination == destination
    assert source in {item.source for skill in turn.skills for item in skill.evidence}
    entry = source.split("/")[0]
    assert catalog()[lang]["entries"][entry]["url"].endswith(
        "/experience" if entry == "education" else "/skills"
    )


def test_case_study_does_not_route_to_education():
    turn = prepare_turn("Tell me about the GLIO-IA case study", "en", ())
    assert turn.destination == "glio"
    assert all(not item.source.startswith("education/") for skill in turn.skills for item in skill.evidence)
