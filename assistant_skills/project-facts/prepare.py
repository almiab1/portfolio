# ABOUTME: Formats exact answers from public project facts.
# ABOUTME: Provides localized recovery for facts absent from a public case study.


def fact_reply(title: str, label: str | None, value: str | None, lang: str) -> str:
    if label and value:
        return f"**{title} · {label}**\n\n{value}"
    if lang == "es":
        return f"La ficha pública de **{title}** no indica ese dato."
    return f"The public case study for **{title}** does not specify that detail."
