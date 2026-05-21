import os
import sys
import unittest

import pandas as pd

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from chanlun.elements import KLine
from core.kline_serialize import analysis_klines_to_df, df_to_kline_dicts
from datetime import datetime


class KlineSerializeTests(unittest.TestCase):
    def test_df_to_kline_dicts_roundtrip_shape(self):
        df = pd.DataFrame(
            {
                "date": pd.to_datetime(["2024-01-01", "2024-01-02"]),
                "open": [10.0, 11.0],
                "high": [10.5, 11.5],
                "low": [9.5, 10.5],
                "close": [10.2, 11.2],
                "volume": [1000, 2000],
            }
        )
        rows = df_to_kline_dicts(df)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["open"], 10.0)

    def test_analysis_klines_to_df(self):
        klines = [
            KLine(
                date=datetime(2024, 1, 1),
                open=1,
                high=2,
                low=0.5,
                close=1.5,
                volume=100,
            ),
            KLine(
                date=datetime(2024, 1, 2),
                open=1.5,
                high=2.5,
                low=1.0,
                close=2.0,
                volume=200,
            ),
        ]
        df = analysis_klines_to_df(klines)
        self.assertEqual(len(df), 2)
        self.assertAlmostEqual(float(df.iloc[-1]["close"]), 2.0)


if __name__ == "__main__":
    unittest.main()
