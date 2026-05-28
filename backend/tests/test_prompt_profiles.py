from hp_agent.prompt_profiles import (
    build_annotator_user_prompt,
    normalize_level,
    normalize_profile,
)


def test_build_prompt_uses_general_profile_by_default():
    prompt = build_annotator_user_prompt("The bark was rough.", ["rough"])

    assert "general English reading" in prompt
    assert '"rough"' in prompt
    assert "<text>\nThe bark was rough.\n</text>" in prompt


def test_build_prompt_can_use_harry_potter_profile():
    prompt = build_annotator_user_prompt(
        "He bought a new wand.",
        level="advanced",
        profile="harry_potter",
    )

    assert "Harry Potter and wizarding-world reading" in prompt
    assert "wizarding-world terms" in prompt
    assert "near-fluent English reader" in prompt


def test_unknown_profile_and_level_fall_back_to_defaults():
    assert normalize_profile("unknown") == "general"
    assert normalize_level("unknown") == "intermediate"
