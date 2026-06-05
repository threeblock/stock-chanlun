"""缠论分析辅助：缓存键与级别映射。"""
import os
import sys
import unittest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from core.chanlun_analysis import (
    DEFAULT_KLINE_LIMIT,
    SCREENING_KLINE_LIMIT,
    chanlun_cache_key,
    level_to_period,
)


class ChanlunAnalysisHelperTests(unittest.TestCase):
    def test_cache_key_includes_kline_limit(self):
        k_full = chanlun_cache_key("600519", "daily", DEFAULT_KLINE_LIMIT)
        k_screen = chanlun_cache_key("600519", "daily", SCREENING_KLINE_LIMIT)
        self.assertNotEqual(k_full, k_screen)
        self.assertIn(str(DEFAULT_KLINE_LIMIT), k_full)
        self.assertIn(str(SCREENING_KLINE_LIMIT), k_screen)

    def test_level_to_period_weekly_monthly(self):
        self.assertEqual(level_to_period("weekly"), "weekly")
        self.assertEqual(level_to_period("monthly"), "monthly")
        self.assertEqual(level_to_period("daily"), "daily")


if __name__ == "__main__":
    unittest.main()
