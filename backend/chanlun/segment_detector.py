"""
线段与中枢检测器
"""
from typing import Optional
from datetime import datetime
from .elements import Bi, XiangSegment, Zhongshu


class SegmentDetector:
    """
    线段规则:
    - 3笔（或以上）重叠构成线段
    - 线段被更高一级别笔破坏则线段结束

    中枢规则:
    - 3个（或以上）连续同级别线段的重叠区域构成中枢
    """

    def __init__(self, bis: list[Bi]):
        self.bis = bis

    def detect_segments(self, min_overlap_bis: int = 3, max_iterations: int = 10000) -> list[XiangSegment]:
        """
        线段检测（特征序列破坏法 + 趋势转折辅助）：

        向上线段终结条件（满足任一即终结）：
          a) 标准：down笔低点 < 前一down笔低点
          b) 辅助：up笔高点 < 前一up笔高点（高点不再创新高，趋势衰竭）

        向下线段终结条件（对称）：
          a) 标准：up笔高点 > 前一up笔高点
          b) 辅助：down笔低点 > 前一down笔低点（低点不再创新低）

        线段至少包含3笔。
        """
        if len(self.bis) < 3:
            return []

        segments: list[XiangSegment] = []
        seg_start_idx = 0

        while seg_start_idx < len(self.bis) - 2:
            seg_direction = self.bis[seg_start_idx].direction
            end_idx = seg_start_idx + 2

            broken = False
            j = seg_start_idx + 2
            while j < len(self.bis):
                current_bi = self.bis[j]

                if seg_direction == "up":
                    if current_bi.direction == "down":
                        # 标准条件：down笔低点破前down低点
                        prev_down = self._find_prev_same_dir(j, "down", seg_start_idx)
                        if prev_down is not None and current_bi.low < self.bis[prev_down].low:
                            end_idx = j - 1
                            broken = True
                            break
                    else:
                        # 辅助条件：up笔高点不再创新高
                        prev_up = self._find_prev_same_dir(j, "up", seg_start_idx)
                        if prev_up is not None and current_bi.high < self.bis[prev_up].high:
                            end_idx = j - 1
                            broken = True
                            break
                else:  # down
                    if current_bi.direction == "up":
                        prev_up = self._find_prev_same_dir(j, "up", seg_start_idx)
                        if prev_up is not None and current_bi.high > self.bis[prev_up].high:
                            end_idx = j - 1
                            broken = True
                            break
                    else:
                        # 辅助条件：down笔低点不再创新低
                        prev_down = self._find_prev_same_dir(j, "down", seg_start_idx)
                        if prev_down is not None and current_bi.low > self.bis[prev_down].low:
                            end_idx = j - 1
                            broken = True
                            break
                j += 1

            if not broken:
                end_idx = len(self.bis) - 1

            seg_bis = self.bis[seg_start_idx:end_idx + 1]
            if len(seg_bis) >= 3:
                start = seg_bis[0].start
                end = seg_bis[-1].end
                high = max(b.high for b in seg_bis)
                low = min(b.low for b in seg_bis)
                start_price = seg_bis[0].start_price
                end_price = seg_bis[-1].end_price
                direction = "up" if end_price > start_price else "down"

                segments.append(XiangSegment(
                    id=f"xiang_{len(segments) + 1}",
                    start=start,
                    end=end,
                    direction=direction,
                    high=high,
                    low=low,
                    start_price=start_price,
                    end_price=end_price,
                    bi_ids=[b.id for b in seg_bis],
                    level=2
                ))

            if broken:
                seg_start_idx = end_idx + 1
            else:
                break

        return segments

    def _find_prev_same_dir(self, current_idx: int, direction: str, lower_bound: int) -> Optional[int]:
        """从 current_idx-1 向前找同方向的最近一笔索引"""
        for k in range(current_idx - 1, lower_bound - 1, -1):
            if self.bis[k].direction == direction:
                return k
        return None

    def _has_overlap(self, bis_group: list[Bi]) -> bool:
        """判断一组笔是否有重叠"""
        if len(bis_group) < 2:
            return False
        high = min(b.high for b in bis_group)
        low = max(b.low for b in bis_group)
        return high > low  # 有重叠区域

    def _overlaps(self, bi: Bi, existing_high: float, existing_low: float) -> bool:
        """判断笔是否与已有区域重叠"""
        return bi.high > existing_low and bi.low < existing_high

    def detect_zhongshus(self, segments: list[XiangSegment]) -> list[Zhongshu]:
        """
        检测中枢（滑动窗口算法）：
        遍历线段序列，每取得连续3段计算重叠区间：
        - 有重叠 → 构成中枢，尝试向后延伸（后续线段若与之重叠则并入）
        - 无重叠 → 跳过，继续寻找下一组
        相邻中枢之间必然间隔至少3个线段，不会重复。
        """
        if len(segments) < 3:
            return []

        zhongshus: list[Zhongshu] = []
        i = 0

        while i <= len(segments) - 3:
            group = segments[i:i + 3]

            # 计算三段重叠区间
            range_high = min(s.high for s in group)
            range_low = max(s.low for s in group)

            if range_high > range_low:
                # 重叠 → 形成中枢，尝试向后延伸
                cur_start = group[0].start
                cur_end = group[-1].end
                xiang_ids = [s.id for s in group]
                extend_idx = i + 3

                while extend_idx < len(segments):
                    nxt = segments[extend_idx]
                    # 新段与当前中枢区间有重叠 → 并入（但不扩大中枢区间）
                    if nxt.high > range_low and nxt.low < range_high:
                        cur_end = nxt.end
                        xiang_ids.append(nxt.id)
                        extend_idx += 1
                    else:
                        break

                zhongshus.append(Zhongshu(
                    id=f"zs_{len(zhongshus)+1}",
                    start=cur_start,
                    end=cur_end,
                    range_high=float(range_high),
                    range_low=float(range_low),
                    xiang_ids=xiang_ids,
                    level=group[0].level
                ))
                i = extend_idx  # 跳到中枢结束后的第一个线段
            else:
                i += 1

        return zhongshus

    def get_zhongshu_for_price(self, zhongshus: list[Zhongshu],
                                 price: float) -> Optional[Zhongshu]:
        """找到价格所在的中枢"""
        for zs in reversed(zhongshus):
            if zs.range_low <= price <= zs.range_high:
                return zs
        return None
