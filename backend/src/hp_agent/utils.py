"""
hp_agent 公共工具：SSE 事件格式化和 LLM 响应 JSON 提取。
"""

import json
import re


def sse_event(payload: dict) -> str:
    """将 dict 序列化为 SSE 标准格式：data: {...}\n\n"""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def extract_json(response: str) -> dict:
    """
    从 LLM 原始响应中提取 JSON 对象。

    LLM 有时在 JSON 前后附加说明文字或 markdown 代码块，
    需要先尝试直接解析，失败后用非贪婪正则兜底。
    正则技巧：交替匹配非花括号字符与递归花括号对，正确处理嵌套。
    """
    response = response.strip()

    # 优先：直接解析（LLM 按要求只输出 JSON 时的快速路径）
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass

    # 兜底：非贪婪正则提取第一个完整 JSON 对象
    json_match = re.search(
        r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", response, re.DOTALL
    )
    if not json_match:
        raise ValueError(f"无法从响应中提取 JSON。\n完整响应: {response}")

    json_str = json_match.group(0)
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON 解析失败: {e}\n提取内容: {json_str}")
