import os
import sys
import time
import unittest
from unittest.mock import patch

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from utils import LRUCache, with_retry


class LRUCacheTests(unittest.TestCase):
    def test_purge_expired_removes_only_expired_entries(self):
        cache = LRUCache(maxsize=4, ttl=0.01)
        cache.set("expired", 1)
        time.sleep(0.02)
        cache.set("alive", 2)

        removed = cache.purge_expired()

        self.assertEqual(removed, 1)
        self.assertIsNone(cache.get("expired"))
        self.assertEqual(cache.get("alive"), 2)

    def test_stats_returns_basic_cache_metadata(self):
        cache = LRUCache(maxsize=8, ttl=60.0)
        cache.set("a", 1)
        cache.set("b", 2)

        stats = cache.stats()

        self.assertEqual(stats["size"], 2)
        self.assertEqual(stats["maxsize"], 8)
        self.assertEqual(stats["ttl_seconds"], 60)


class RetryDecoratorTests(unittest.TestCase):
    def test_retry_uses_backoff_and_jitter(self):
        attempts = {"count": 0}

        @with_retry(max_attempts=3, delay=0.5, jitter=0.2, exceptions=(ValueError,))
        def flaky():
            attempts["count"] += 1
            if attempts["count"] < 3:
                raise ValueError("transient")
            return "ok"

        with patch("utils.random.uniform", return_value=0.1), patch("utils.time.sleep") as mock_sleep:
            result = flaky()

        self.assertEqual(result, "ok")
        self.assertEqual(attempts["count"], 3)
        mock_sleep.assert_any_call(0.6)
        mock_sleep.assert_any_call(1.1)
        self.assertEqual(mock_sleep.call_count, 2)


if __name__ == "__main__":
    unittest.main()
