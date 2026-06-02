"""共享技术指标计算（选股 / 背驰 / 前端算法对齐）。"""
from __future__ import annotations

import pandas as pd


def ema_series(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    k = 2 / (period + 1)
    out = [values[0]]
    for i in range(1, len(values)):
        out.append(values[i] * k + out[-1] * (1 - k))
    return out


def calc_macd_lists(
    closes: list[float],
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> tuple[list[float], list[float]]:
    """返回 (dif, dea)，与前端 stockIndicators / 选股双金叉一致。"""
    ema12 = ema_series(closes, fast)
    ema26 = ema_series(closes, slow)
    dif = [a - b for a, b in zip(ema12, ema26)]
    dea = ema_series(dif, signal)
    return dif, dea


def calculate_macd_df(
    df: pd.DataFrame,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> pd.DataFrame:
    """向量化 MACD，供背驰检测使用。"""
    out = df.copy()
    ema_fast = out["close"].ewm(span=fast, adjust=False).mean()
    ema_slow = out["close"].ewm(span=slow, adjust=False).mean()
    out["dif"] = ema_fast - ema_slow
    out["dea"] = out["dif"].ewm(span=signal, adjust=False).mean()
    out["bar"] = (out["dif"] - out["dea"]) * 2
    return out
