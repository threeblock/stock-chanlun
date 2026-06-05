"""统一 datetime / 日期字符串格式化。"""
from __future__ import annotations

from datetime import date, datetime


def format_date_short(value: object) -> str:
    """格式化为 YYYY-MM-DD，供 LLM 上下文等使用。"""
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.isoformat()
    text = str(value).strip()
    if not text:
        return ""
    return text.replace("T", " ").split(" ")[0][:10]
