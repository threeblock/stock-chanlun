"""共享指标模块。"""
import os
import sys
import unittest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from core.indicators import (
    calc_macd_lists,
    calc_skdj_lists,
    find_latest_dual_cross_bar,
    macd_gold_cross_indices,
    skdj_gold_cross_indices,
)


class IndicatorsTests(unittest.TestCase):
    def test_calc_macd_lists_length(self):
        closes = [float(10 + i * 0.1) for i in range(60)]
        dif, dea = calc_macd_lists(closes)
        self.assertEqual(len(dif), len(closes))
        self.assertEqual(len(dea), len(closes))

    def test_calc_skdj_lists_length(self):
        n = 40
        highs = [float(11 + i * 0.1) for i in range(n)]
        lows = [float(9 + i * 0.08) for i in range(n)]
        closes = [float(10 + i * 0.09) for i in range(n)]
        sk, sd = calc_skdj_lists(highs, lows, closes)
        self.assertEqual(len(sk), n)
        self.assertEqual(len(sd), n)
        self.assertIsNotNone(sk[-1])
        self.assertIsNotNone(sd[-1])

    def test_gold_cross_indices(self):
        dif = [0.0, -0.1, 0.2, 0.3]
        dea = [0.0, 0.0, 0.1, 0.2]
        self.assertEqual(macd_gold_cross_indices(dif, dea), [2])
        sk = [None, 40.0, 60.0, 70.0]
        sd = [None, 50.0, 50.0, 60.0]
        self.assertEqual(skdj_gold_cross_indices(sk, sd), [2])

    def test_find_latest_dual_cross_bar_short_series(self):
        n = 20
        closes = [10.0 + i * 0.1 for i in range(n)]
        dif, dea = calc_macd_lists(closes)
        sk, sd = calc_skdj_lists(closes, closes, closes)
        self.assertIsNone(find_latest_dual_cross_bar(dif, dea, sk, sd))

    def test_find_latest_dual_cross_bar_picks_latest(self):
        n = 40
        closes = [10.0 + i * 0.15 for i in range(n)]
        highs = [c + 0.5 for c in closes]
        lows = [c - 0.5 for c in closes]
        dif, dea = calc_macd_lists(closes)
        sk, sd = calc_skdj_lists(highs, lows, closes)
        idx = find_latest_dual_cross_bar(dif, dea, sk, sd)
        if idx is not None:
            self.assertGreaterEqual(idx, 29)
            self.assertLess(idx, n)


if __name__ == "__main__":
    unittest.main()
