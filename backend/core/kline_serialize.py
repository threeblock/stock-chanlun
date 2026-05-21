"""K 线 DataFrame / 缠论模型 与 API JSON 互转。"""
from __future__ import annotations

import pandas as pd

from chanlun.elements import ChanlunAnalysis, KLine


def df_to_kline_dicts(df: pd.DataFrame) -> list[dict]:
    """将 K 线 DataFrame 序列化为 API 响应格式。"""
    if df.empty:
        return []
    out: list[dict] = []
    for row in df.itertuples(index=False):
        out.append(
            {
                "date": str(row.date)[:19],
                "open": float(row.open),
                "high": float(row.high),
                "low": float(row.low),
                "close": float(row.close),
                "volume": float(getattr(row, "volume", 0) or 0),
            }
        )
    return out


def analysis_klines_to_df(klines: list[KLine]) -> pd.DataFrame:
    """从缠论分析结果中的 K 线对象重建 DataFrame（避免重复拉取行情）。"""
    if not klines:
        return pd.DataFrame()
    records = [
        {
            "date": k.date,
            "open": k.open,
            "high": k.high,
            "low": k.low,
            "close": k.close,
            "volume": k.volume,
        }
        for k in klines
    ]
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)
