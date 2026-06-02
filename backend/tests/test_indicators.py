"""共享指标模块。"""
import os
import sys
import unittest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from core.indicators import calc_macd_lists


class IndicatorsTests(unittest.TestCase):
    def test_calc_macd_lists_length(self):
        closes = [float(10 + i * 0.1) for i in range(60)]
        dif, dea = calc_macd_lists(closes)
        self.assertEqual(len(dif), len(closes))
        self.assertEqual(len(dea), len(closes))


if __name__ == "__main__":
    unittest.main()
