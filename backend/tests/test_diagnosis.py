"""AI 诊股路由：请求体校验。"""
import os
import sys
import unittest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from routers.diagnosis import DiagnosisBody, _normalize_model


class DiagnosisBodyTests(unittest.TestCase):
    def test_body_accepts_long_question(self):
        body = DiagnosisBody(
            code="600519",
            question="请分析" + "走势" * 500,
            session_id="s1",
            model="deepseek",
        )
        self.assertEqual(body.code, "600519")
        self.assertGreater(len(body.question), 100)

    def test_normalize_model(self):
        self.assertEqual(_normalize_model("gemini"), "gemini")
        self.assertEqual(_normalize_model("unknown"), "deepseek")


if __name__ == "__main__":
    unittest.main()
