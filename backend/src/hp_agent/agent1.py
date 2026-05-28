"""
全文标注服务 (AnnotatorService)。

核心职责：
- 接收英文段落 → 根据阅读场景和阅读水平选择标注策略 → 返回 [[word|翻译]] 格式的标注文本
- 场景预设和三级标注密度通过 prompt_profiles 组合生成
- 已掌握词汇列表传入 prompt 以避免重复标注
"""

import os
from dataclasses import dataclass

from hello_agents import SimpleAgent

from hp_agent.prompt_profiles import (
    BASE_ANNOTATOR_SYSTEM_PROMPT,
    build_annotator_user_prompt,
)
from hp_agent.utils import extract_json


# 1. 定义数据结构
@dataclass
class VocabItem:
    """单个生词条目。"""
    word: str
    translation: str
    context: str

@dataclass
class AnnotationResult:
    """标注结果：标注后文本 + 提取的生词列表。"""
    annotated_text: str
    vocabulary: list[VocabItem]

# 3. 核心服务类
class AnnotatorService:
    """全文标注 Agent，根据阅读水平自动标注生词/短语/专有名词。"""

    def __init__(self, llm):
        self._agent = SimpleAgent(
            name="ReadingHelper Annotator",
            system_prompt=BASE_ANNOTATOR_SYSTEM_PROMPT,
            llm=llm
        )

    def _json_retry_count(self) -> int:
        try:
            return max(0, int(os.getenv("ANNOTATOR_JSON_RETRY", "1")))
        except ValueError:
            return 1

    def annotate_text(
        self,
        text: str,
        mastered_words: list[str] = None,
        level: str = "intermediate",
        profile: str = "general",
    ) -> AnnotationResult:
        """
        标注文本并返回 AnnotationResult。
        - level: beginner / intermediate / advanced，控制标注密度
        - profile: general / fiction / harry_potter / technical / academic / news_business
        - mastered_words: 已掌握词列表，这些词在 prompt 中被跳过不标注
        - 关闭 thinking mode 以加速翻译标注任务
        """
        user_prompt = build_annotator_user_prompt(
            text=text,
            mastered_words=mastered_words,
            level=level,
            profile=profile,
        )
        
        parsed_payload = None
        last_error = None

        for attempt in range(self._json_retry_count() + 1):
            prompt = user_prompt
            if attempt > 0:
                prompt += (
                    "\n\nYour previous response was not valid JSON. "
                    "Return the same task result again as valid JSON only."
                )

            response = self._agent.run(
                prompt,
                extra_body={"thinking": {"type": "disabled"}}
            )

            try:
                parsed_payload = extract_json(response)
                break
            except ValueError as exc:
                last_error = exc

        if parsed_payload is None:
            raise last_error or ValueError("LLM did not return valid JSON")
        
        # 验证并创建返回对象
        vocab_items = []
        for item in parsed_payload.get("extracted_vocabulary", []):
            vocab_items.append(
                VocabItem(
                    word=item.get("word", ""),
                    translation=item.get("translation", ""),
                    context=item.get("context", "")
                )
            )
            
        return AnnotationResult(
            annotated_text=parsed_payload.get("annotated_text", text),
            vocabulary=vocab_items
        )
