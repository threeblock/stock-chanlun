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


def calc_skdj_lists(
    highs: list[float],
    lows: list[float],
    closes: list[float],
    n: int = 9,
    smooth_n: int = 3,
    smooth_m: int = 1,
) -> tuple[list[float | None], list[float | None]]:
    """通达信风格 SKDJ，与前端 stockIndicators / 选股一致。"""
    rsv: list[float | None] = [None] * len(closes)
    for i in range(n - 1, len(closes)):
        ln = min(lows[i - n + 1 : i + 1])
        hn = max(highs[i - n + 1 : i + 1])
        rsv[i] = 50 if hn == ln else (closes[i] - ln) / (hn - ln) * 100

    sk: list[float | None] = [None] * len(closes)
    prev_sk: float | None = None
    for i in range(len(closes)):
        r = rsv[i]
        if r is None:
            continue
        prev_sk = r if prev_sk is None else (smooth_m * r + (smooth_n - smooth_m) * prev_sk) / smooth_n
        sk[i] = prev_sk

    sd: list[float | None] = [None] * len(closes)
    prev_sd: float | None = None
    for i in range(len(closes)):
        s = sk[i]
        if s is None:
            continue
        prev_sd = s if prev_sd is None else (smooth_m * s + (smooth_n - smooth_m) * prev_sd) / smooth_n
        sd[i] = prev_sd

    return sk, sd


def macd_gold_cross_indices(dif: list[float], dea: list[float]) -> list[int]:
    out: list[int] = []
    for i in range(1, len(dif)):
        if dif[i - 1] <= dea[i - 1] and dif[i] > dea[i]:
            out.append(i)
    return out


def skdj_gold_cross_indices(sk: list[float | None], sd: list[float | None]) -> list[int]:
    out: list[int] = []
    for i in range(1, len(sk)):
        a, b = sk[i - 1], sk[i]
        ap, bp = sd[i - 1], sd[i]
        if a is None or b is None or ap is None or bp is None:
            continue
        if a <= ap and b > bp:
            out.append(i)
    return out


def _valid_dual_cross_at(
    hi: int,
    dif: list[float],
    dea: list[float],
    sk: list[float | None],
    sd: list[float | None],
) -> bool:
    """hi 为双金叉标记日：DIF>DEA、SK>SD，且当日不能是任一指标死叉。"""
    if not (dif[hi] > dea[hi]):
        return False
    s, d = sk[hi], sd[hi]
    if s is None or d is None or s <= d:
        return False
    if hi > 0 and dif[hi - 1] >= dea[hi - 1] and dif[hi] < dea[hi]:
        return False
    if hi > 0:
        sp, dp = sk[hi - 1], sd[hi - 1]
        if sp is not None and dp is not None and sp >= dp and s < d:
            return False
    return True


def find_latest_dual_cross_bar(
    dif: list[float],
    dea: list[float],
    sk: list[float | None],
    sd: list[float | None],
    window: int = 3,
) -> int | None:
    """
    最近一根有效 MACD+SKDJ 双金叉 K 线索引（bar 最大）。
    与前端 computeDualMacdSkdjMarkerIndices / 选股逻辑对齐。
    """
    if len(dif) < 30:
        return None
    macd_g = macd_gold_cross_indices(dif, dea)
    skdj_g = skdj_gold_cross_indices(sk, sd)
    if not macd_g or not skdj_g:
        return None

    best_hi = -1
    j = 0
    for m in macd_g:
        while j < len(skdj_g) and skdj_g[j] < m - window:
            j += 1
        k = j
        while k < len(skdj_g) and skdj_g[k] <= m + window:
            hi = max(m, skdj_g[k])
            if hi > best_hi and _valid_dual_cross_at(hi, dif, dea, sk, sd):
                best_hi = hi
            k += 1
    return best_hi if best_hi >= 0 else None


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
