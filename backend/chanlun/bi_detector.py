"""
笔检测器 — 基于分型识别笔
"""
import numpy as np
import pandas as pd
from typing import Optional
from datetime import datetime
from .elements import Bi
from .fenxing_detector import FenxingDetector, Fenxing


class BiDetector:
    """
    笔规则:
    1. 顶分型 + 底分型 = 一笔（向上笔: 底→顶，向下笔: 顶→底）
    2. 笔至少需要5根K线（含分型）
    3. 同级别笔由连续顶底分型构成
    """

    def __init__(self, klines: pd.DataFrame):
        self.klines = klines.reset_index(drop=True)
        self._date_values = self.klines["date"].values
        self._fenxing_detector = FenxingDetector(klines)
        self._fenxings: list[Fenxing] = []

    @property
    def processed_klines(self) -> pd.DataFrame:
        """包含关系处理后的 K 线（与笔/分型检测一致）。"""
        return self._fenxing_detector.klines

    @staticmethod
    def compress_fenxings(fenxings: list[Fenxing]) -> list[Fenxing]:
        """
        压缩分型序列：连续同类型分型仅保留更“极值”的那个。
        - 连续 top：保留 high 更高者
        - 连续 bottom：保留 low 更低者
        """
        if not fenxings:
            return []

        out: list[Fenxing] = [fenxings[0]]
        for fx in fenxings[1:]:
            last = out[-1]
            if fx.type != last.type:
                out.append(fx)
                continue

            if fx.type == "top":
                if fx.high >= last.high:
                    out[-1] = fx
            else:  # bottom
                if fx.low <= last.low:
                    out[-1] = fx

        return out

    def detect(self, min_bars: int = 5) -> list[Bi]:
        """
        检测所有笔
        min_bars: 笔最少K线数（默认5根）

        核心逻辑：从压缩后的分型序列中，交替配对顶底分型构成笔。
        当某对分型不满足K线数条件时，跳过当前fx2继续找下一个
        匹配的分型，而不是简单i+=1，确保笔严格交替。
        """
        self._fenxings = self.compress_fenxings(self._fenxing_detector.detect())
        if len(self._fenxings) < 2:
            return []

        bis: list[Bi] = []
        i = 0

        while i < len(self._fenxings) - 1:
            fx1 = self._fenxings[i]

            # 寻找与fx1配对的下一个分型
            matched = False
            j = i + 1
            while j < len(self._fenxings):
                fx2 = self._fenxings[j]

                # 底→顶 = 向上笔
                if fx1.type == "bottom" and fx2.type == "top":
                    bar_count = self._count_klines_between(fx1.date, fx2.date)
                    if bar_count >= min_bars and fx2.high > fx1.low:
                        bis.append(Bi(
                            id=f"bi_up_{len(bis)+1}",
                            start=fx1.date,
                            end=fx2.date,
                            direction="up",
                            high=float(fx2.high),
                            low=float(fx1.low),
                            start_price=float(fx1.low),
                            end_price=float(fx2.high),
                        ))
                        i = j  # 下一轮从fx2开始找配对
                        matched = True
                        break
                    else:
                        j += 1

                # 顶→底 = 向下笔
                elif fx1.type == "top" and fx2.type == "bottom":
                    bar_count = self._count_klines_between(fx1.date, fx2.date)
                    if bar_count >= min_bars and fx1.high > fx2.low:
                        bis.append(Bi(
                            id=f"bi_down_{len(bis)+1}",
                            start=fx1.date,
                            end=fx2.date,
                            direction="down",
                            high=float(fx1.high),
                            low=float(fx2.low),
                            start_price=float(fx1.high),
                            end_price=float(fx2.low),
                        ))
                        i = j
                        matched = True
                        break
                    else:
                        j += 1

                else:
                    # 同类型分型（不该出现在compress后，但保险处理）
                    j += 1

            if not matched:
                i += 1

        bis = self._merge_same_direction(bis)
        return bis

    @staticmethod
    def _merge_same_direction(bis: list[Bi]) -> list[Bi]:
        """合并连续同方向笔：保留更极端的那一笔（上取更高，下取更低）"""
        if len(bis) <= 1:
            return bis

        merged: list[Bi] = [bis[0]]
        for b in bis[1:]:
            last = merged[-1]
            if b.direction == last.direction:
                # 同方向合并：取更大的区间
                if b.direction == "up":
                    if b.high >= last.high:
                        merged[-1] = Bi(
                            id=last.id,
                            start=last.start,
                            end=b.end,
                            direction="up",
                            high=b.high,
                            low=min(last.low, b.low),
                            start_price=last.start_price,
                            end_price=b.end_price,
                        )
                    # 否则忽略较弱的笔
                else:
                    if b.low <= last.low:
                        merged[-1] = Bi(
                            id=last.id,
                            start=last.start,
                            end=b.end,
                            direction="down",
                            high=max(last.high, b.high),
                            low=b.low,
                            start_price=last.start_price,
                            end_price=b.end_price,
                        )
            else:
                merged.append(b)

        return merged

    def _count_klines_between(self, start: datetime, end: datetime) -> int:
        """计算两个时间之间的K线数量（searchsorted，避免全表布尔掩码）"""
        dates = self._date_values
        start_val = np.datetime64(start)
        end_val = np.datetime64(end)
        left = int(np.searchsorted(dates, start_val, side="left"))
        right = int(np.searchsorted(dates, end_val, side="right"))
        return max(0, right - left)
