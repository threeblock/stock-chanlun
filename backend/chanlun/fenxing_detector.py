"""Fenxing detector: top and bottom fractals after inclusion processing."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

import pandas as pd


@dataclass
class Fenxing:
    """A top or bottom fractal."""

    date: datetime
    type: Literal["top", "bottom"]
    high: float
    low: float
    index: int


class FenxingDetector:
    """
    Detect Chanlun fenxing.

    The detector first removes containing K-line relationships. In an upward
    merge, keep the higher high and higher low; in a downward merge, keep the
    lower high and lower low. This preserves the effective swing shape used by
    later bi detection.
    """

    def __init__(self, klines: pd.DataFrame):
        self.klines = klines.reset_index(drop=True)
        self._process_inclusion()

    def _process_inclusion(self):
        """Process containing K-lines before fenxing detection."""
        rows = self.klines.to_dict("records")
        if not rows:
            self.klines = pd.DataFrame(rows)
            return

        result = [rows[0]]

        def merge_direction(prev: dict, cur: dict) -> str:
            if len(result) >= 2:
                before = result[-2]
                if prev["high"] >= before["high"] and prev["low"] >= before["low"]:
                    return "up"
                if prev["high"] <= before["high"] and prev["low"] <= before["low"]:
                    return "down"
            return "up" if cur["high"] >= prev["high"] and cur["low"] >= prev["low"] else "down"

        def merge_bar(prev: dict, cur: dict, keep_date, direction: str) -> dict:
            if direction == "up":
                high = max(prev["high"], cur["high"])
                low = max(prev["low"], cur["low"])
            else:
                high = min(prev["high"], cur["high"])
                low = min(prev["low"], cur["low"])

            return {
                "date": keep_date,
                "open": prev["open"],
                "high": high,
                "low": low,
                "close": cur["close"],
                "volume": prev.get("volume", 0) + cur.get("volume", 0),
            }

        for i in range(1, len(rows)):
            cur = rows[i]
            prev = result[-1]

            if prev["low"] <= cur["low"] and prev["high"] >= cur["high"]:
                result[-1] = merge_bar(prev, cur, prev["date"], merge_direction(prev, cur))
            elif cur["low"] <= prev["low"] and cur["high"] >= prev["high"]:
                result[-1] = merge_bar(prev, cur, cur["date"], merge_direction(prev, cur))
            else:
                result.append(cur)

        self.klines = pd.DataFrame(result).reset_index(drop=True)

    def detect(self) -> list[Fenxing]:
        """
        Detect strict three-bar fractals.

        Top: middle high and low are both higher than neighbours.
        Bottom: middle high and low are both lower than neighbours.
        """
        df = self.klines
        fenxings = []

        for i in range(1, len(df) - 1):
            prev = df.iloc[i - 1]
            middle = df.iloc[i]
            next_ = df.iloc[i + 1]

            mid_h, mid_l = middle["high"], middle["low"]

            if (
                mid_h > prev["high"]
                and mid_h > next_["high"]
                and mid_l > prev["low"]
                and mid_l > next_["low"]
            ):
                fenxings.append(
                    Fenxing(
                        date=middle["date"],
                        type="top",
                        high=float(mid_h),
                        low=float(mid_l),
                        index=i,
                    )
                )
            elif (
                mid_h < prev["high"]
                and mid_h < next_["high"]
                and mid_l < prev["low"]
                and mid_l < next_["low"]
            ):
                fenxings.append(
                    Fenxing(
                        date=middle["date"],
                        type="bottom",
                        high=float(mid_h),
                        low=float(mid_l),
                        index=i,
                    )
                )

        return fenxings
