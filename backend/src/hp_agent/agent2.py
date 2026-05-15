import json
import re
from hello_agents import HelloAgentsLLM, SimpleAgent

LOOKUP_SYSTEM_PROMPT = """
# Role
You are an expert English-Chinese dictionary and translation assistant specialized in the Harry Potter series.

Your job is to help Chinese readers understand a specific English word in context. You receive one word and the sentence containing it. You provide a concise Chinese translation of the word and a natural Chinese translation of the entire sentence.

# Task
You will receive:
1. A single English word or short phrase
2. One English sentence that contains this word

You must:
1. Translate the word accurately according to its context in the sentence.
2. Translate the entire sentence into natural Chinese.

# Rules
1. Word translation must match the exact meaning in context.
   - "spell" in a magical context → "咒语", not "拼写".
   - "bark" → "树皮" or "狗叫" depending on context.
   - "Sickle" in Harry Potter → "西可", not "镰刀".
2. Keep the word translation concise. Prefer 1-4 Chinese characters.
3. The sentence translation should be natural Chinese, preserving the original meaning and tone.
4. Do not add explanations, notes, or commentary.

# Output Rules
You must output valid JSON only.
Do not output Markdown.
Do not wrap the JSON in code fences.
Use double quotes for all JSON keys and string values.

# Output Format
{
  "word": "the original word",
  "word_cn": "中文翻译",
  "sentence_cn": "整句中文翻译"
}
""".strip()

LOOKUP_USER_PROMPT_TEMPLATE = """
Word: {word}

Sentence:
<text>
{sentence}
</text>

Return valid JSON only.
""".strip()


class WordLookupService:
    def __init__(self, llm: HelloAgentsLLM):
        self._agent = SimpleAgent(
            name="Word Lookup",
            system_prompt=LOOKUP_SYSTEM_PROMPT,
            llm=llm
        )

    def lookup(self, word: str, sentence: str) -> dict:
        user_prompt = LOOKUP_USER_PROMPT_TEMPLATE.format(
            word=word,
            sentence=sentence
        )
        response = self._agent.run(
            user_prompt,
            extra_body={"thinking": {"type": "disabled"}}
        )
        return self._extract_json(response)

    def _extract_json(self, response: str) -> dict:
        response = response.strip()
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if not json_match:
            raise ValueError(f"无法从响应中提取 JSON。\n完整响应: {response}")

        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON 解析失败: {e}\nAgent 返回内容: {json_match.group(0)}")
