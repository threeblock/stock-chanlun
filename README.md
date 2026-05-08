# ChanStock — 缠论智能股票分析系统

> 基于缠中说禅理论的智能股票分析工具，融合缠论结构识别、AI 背驰判断与多级别共振分析，支持 PC 端与移动端，涵盖 A 股日线/周线/月线及分钟级别 K 线可视化。

---

## 目录

- [项目概览](#项目概览)
- [系统架构](#系统架构)
- [目录结构](#目录结构)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [安装部署](#安装部署)
- [API 接口文档](#api-接口文档)
- [缠论算法说明](#缠论算法说明)
- [前端页面说明](#前端页面说明)
- [配置与参数](#配置与参数)
- [常见问题](#常见问题)
- [免责声明](#免责声明)

---

## 项目概览

ChanStock 是一款面向 A 股的智能技术分析工具，核心逻辑基于缠中说禅理论，通过程序化识别分型、笔、线段、中枢等结构，判断趋势、背驰与买卖点，并结合 AI 大模型（DeepSeek / Gemini）输出可操作的投资建议。

### 目标用户

- **缠论学习者**：借助系统快速识别笔、线段、中枢，将理论应用于实战
- **技术分析爱好者**：综合 MA、MACD、RSI、SKDJ 等经典指标与缠论结构
- **量化研究开发者**：基于缠论数据接口做二次策略开发

---

## 系统架构

### 技术架构图

```
┌──────────────────────────────────────────────────────────────┐
│                     前端  (Vue 3 + TypeScript + ECharts)       │
│                        统一项目，端口 5173                      │
│                                                              │
│   ┌────────────────────────┐    ┌────────────────────────┐   │
│   │      PC 端             │    │      移动端 (/m/)       │   │
│   │  HomeView             │    │  MobileHomeView         │   │
│   │  StockView            │    │  MobileStockView        │   │
│   │  WatchlistView        │    │  MobileWatchlistView    │   │
│   │  StockScreenView      │    │  MobileScreenView       │   │
│   │  SectorView           │    │  MobileSectorView       │   │
│   └───────────┬────────────┘    └───────────┬────────────┘   │
│               │                              │                │
│               └──────────────┬───────────────┘                │
│                          Pinia Store                          │
│               ┌──────────────┼───────────────┐                │
│               │ chanlunStore  │ watchlistStore │                │
│               │ commentStore  │                │                │
│               └───────┬───────┴───────┬───────┘                │
│                       │  axios /api   │                        │
│                       └───────────────┼────────────────────────┘
│                                │ /api 或 /{base}/api │   端口 8000
│    ┌─────────────────────────┼───────────────┼────────────────────────┐
│    │                     后端 (FastAPI + Uvicorn)                    │
│    │                                                              │
│    │   ┌──────────────────────────────────────────────────────┐   │
│    │   │         REST API（routers/ + main.py 挂载）             │   │
│    │   │   /api/stocks/*  /api/chanlun/*  /api/watchlist/*   │   │
│    │   │   /api/market/*  /api/sector/*  /api/comments/*    │   │
│    │   └──────────────────────────────────────────────────────┘   │
│    │                            │                                 │
│    │   ┌────────────────────────┼────────────────────────────┐   │
│    │   │                      业务逻辑层                       │   │
│    │   │  ChanlunEngine  BiDetector  FenxingDetector         │   │
│    │   │  SegmentDetector  SignalDetector  StrategyEngine      │   │
│    │   │  DivergenceDetector  WaveClassifier                 │   │
│    │   └──────────────────────────────────────────────────────┘   │
│    │                            │                                 │
│    │   ┌──────────────────────────────────────────────────────┐   │
│    │   │        数据服务层 (akshare 多源降级：东方财富/腾讯/新浪)  │   │
│    │   └──────────────────────────────────────────────────────┘   │
│    │                            │                                 │
│    │   ┌──────────────────────────────────────────────────────┐   │
│    │   │           AI 层 (DeepSeek / Gemini，可选)               │   │
│    │   └──────────────────────────────────────────────────────┘   │
│    └──────────────────────────────────────────────────────────────┘
```

### 端口说明

| 服务 | 地址 |
|------|------|
| 前端（PC + 移动端统一） | 默认 http://localhost:5173（若端口占用，Vite 会自动顺延如 5174） |
| 后端 API | http://localhost:8000 |

默认前端 **`vite.config.ts` 的 `base` 为 `/stock-chanlun/`**，开发时请在浏览器打开 **`http://localhost:5173/stock-chanlun/`**（端口以终端输出为准）。路由仍写作 `/`、`/stock/:code` 等，由 Vue Router 与 `base` 拼接。

### URL 路由

**PC 端**（相对于前端 `base`，例如 `/stock-chanlun/`）

| 路径 | 页面 |
|------|------|
| `/` | 首页：大盘指数、热门板块、热门股票、财经要闻 |
| `/stock/:code` | 个股分析页：三栏布局（行情统计 + K线图 + AI策略） |
| `/watchlist` | 自选股监控：添加/删除/刷新 |
| `/screen` | 条件选股：SSE 流式结果 |
| `/sector/:name` | 板块详情页：成分股列表 |

**移动端**

| 路径 | 页面 |
|------|------|
| `/m/` | 首页：搜索栏 + 指数 + 热门板块 + 热门股票 |
| `/m/stock/:code` | 个股页：顶部价格 + K线图 + 级别切换 + 底部抽屉 |
| `/m/watchlist` | 自选股列表 |
| `/m/screen` | 条件选股 |
| `/m/sector/:name` | 板块详情页（移动端） |

---

## 目录结构

```
stock-chanlun/
├── .github/workflows/                   # CI（前端 Pages 部署、后端 pytest）
├── backend/                              # FastAPI 后端
│   ├── main.py                         # 应用入口：CORS、lifespan、挂载 routers
│   ├── config.py                       # 环境变量（CORS、金融 TLS 等）
│   ├── http_adapter_patch.py           # requests 补丁（金融域名禁用代理等）
│   ├── deps.py                         # 依赖注入：客户端 IP、限流校验
│   ├── routers/                        # 按域拆分的路由
│   │   ├── stocks.py                  # 行情、K 线、选股、大盘、新闻、板块
│   │   ├── chanlun_routes.py          # 缠论分析、多级别、AI 策略
│   │   ├── watchlist.py / comments.py / system.py / diagnosis.py
│   ├── core/                           # 共享分析辅助（chanlun_analysis、数值工具）
│   ├── stores/                         # 自选/笔记/设置的本地 JSON 持久化（带锁）
│   ├── chanlun/                        # 缠论核心算法
│   │   ├── elements.py              # Pydantic 数据模型
│   │   ├── engine.py                 # 缠论引擎（整合所有分析步骤）
│   │   ├── kline_processor.py        # K 线预处理
│   │   ├── fenxing_detector.py       # 分型检测器
│   │   ├── bi_detector.py            # 笔检测器
│   │   ├── segment_detector.py       # 线段 & 中枢检测器
│   │   └── signals.py                # 买卖点判定 + 支撑阻力位
│   ├── ai/                            # AI 增强模块
│   │   ├── llm_client.py            # LLM 客户端（DeepSeek / Gemini）
│   │   ├── chat_sessions.py         # 诊股对话会话（进程内）
│   │   ├── analysis_agent.py        # Prompt 构建 & 响应解析
│   │   ├── strategy_engine.py       # 规则策略引擎
│   │   ├── wave_classifier.py        # 走势分类器
│   │   └── divergence.py             # 背驰检测器
│   ├── services/                      # 数据服务
│   │   ├── akshare_service.py        # 多源数据（东方财富/腾讯/新浪，含降级）
│   │   └── screening_service.py       # 选股服务（SSE 流式）
│   ├── requirements.txt
│   ├── tests/                         # pytest（缠论组件、工具、LLM 解析、背驰边界）
│   ├── .env.example                   # 环境变量示例（复制为 .env）
│   ├── .env                           # 本地密钥（勿提交）：AI Key、CORS 等
│   ├── watchlist.json               # 自选股持久化
│   ├── comments.json                 # 笔记持久化
│   └── settings.json                # AI 模型设置持久化
│
├── frontend/                           # Vue 3 前端（统一项目）
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── api/
│   │   │   └── stock.ts            # resolveApiBaseURL、axios、类型与错误拦截
│   │   ├── stores/
│   │   │   ├── chanlun.ts         # 缠论状态（独立错误状态）
│   │   │   ├── watchlist.ts       # 自选股状态（含乐观更新回滚）
│   │   │   └── comment.ts         # 笔记评论状态
│   │   ├── router/
│   │   │   └── index.ts          # 统一路由（PC + Mobile）
│   │   ├── composables/
│   │   │   ├── useToast.ts        # Toast 通知系统（统一方案）
│   │   │   ├── useLoading.ts     # 全局加载状态
│   │   │   ├── useInterval.ts     # 定时器 hooks
│   │   │   ├── useDebounce.ts     # 防抖节流
│   │   │   ├── useClipboard.ts     # 剪贴板
│   │   │   ├── useStorage.ts      # LocalStorage
│   │   │   └── useFormatters.ts   # 数据格式化
│   │   ├── views/                  # PC 页面
│   │   │   ├── HomeView.vue          # 首页：大盘/板块/股票/新闻，自动5分钟刷新
│   │   │   ├── StockView.vue          # 个股：多级别K线+缠论+AI策略，键盘快捷键
│   │   │   ├── WatchlistView.vue     # 自选股：排序/自动2分钟刷新
│   │   │   ├── StockScreenView.vue   # 选股：SSE流式+进度+错误处理
│   │   │   └── SectorView.vue       # 板块详情
│   │   ├── components/
│   │   │   ├── Chart/
│   │   │   │   ├── KLineChart.vue     # 主图（K线 + 缠论叠加）
│   │   │   │   ├── VolumeChart.vue   # 成交量副图
│   │   │   │   ├── MACDChart.vue      # MACD（DIF/DEA + 柱状图）
│   │   │   │   ├── RSIChart.vue       # RSI 副图
│   │   │   │   └── SKDJChart.vue      # SKDJ 副图
│   │   │   ├── Signal/
│   │   │   │   ├── SignalCard.vue     # 买卖点卡片
│   │   │   │   ├── StrategyCard.vue   # AI 策略卡片
│   │   │   │   ├── AIChat.vue         # AI 诊股对话助手（SSE流式）
│   │   │   │   └── CommentSection.vue # 笔记评论
│   │   │   ├── IndicatorSelector.vue # 指标选择器
│   │   │   └── SkeletonLoader.vue   # 骨架屏组件
│   │   └── mobile/                  # 移动端页面和组件
│   │       ├── views/
│   │       │   ├── MobileHomeView.vue
│   │       │   ├── MobileStockView.vue
│   │       │   ├── MobileWatchlistView.vue
│   │       │   ├── MobileScreenView.vue
│   │       │   └── MobileSectorView.vue
│   │       └── components/
│   │           ├── MobileLayout.vue
│   │           ├── MobileBottomNav.vue
│   │           ├── MobileSearchBar.vue
│   │           ├── MobileKLineChart.vue   # 移动端K线：触摸滑动/长按tooltip
│   │           ├── MobileIndicatorSelector.vue
│   │           ├── MobileStockSheet.vue   # 底部抽屉（行情/缠论/AI/笔记）
│   │           ├── MobileCommentSection.vue
│   │           └── PullRefresh.vue        # 下拉刷新组件
│   ├── package.json
│   ├── vite.config.ts              # base、开发代理（/api 与 /{base}/api → 8000）
│   ├── .env.production             # 生产构建：VITE_BASE_URL、VITE_API_BASE_URL
│   └── index.html
│
├── README.md
```

---

## 功能特性

### 1. 缠论结构识别

| 功能 | 说明 |
|------|------|
| **分型检测** | 自动识别顶分型和底分型，严格五笔窗口；包含关系处理由两根K线相对位置决定方向 |
| **笔识别** | 顶分型 + 底分型，默认至少 5 根 K 线 |
| **线段识别** | 由连续 3 笔重叠构成，代表次级别走势 |
| **中枢识别** | 连续 3 个同级别线段重叠区域，输出上下沿价格区间 |
| **走势判断** | 上涨/下跌/盘整/震荡 |

### 2. 买卖点判定

**买点**

| 买点 | 条件 |
|------|------|
| **一买** | 下跌趋势背驰点：当前段力度 < 前一段力度×0.8，且价格创阶段新低 |
| **二买** | 一买后回调低点，回调低点不跌破一买点 |
| **三买** | 向上笔确认突破某中枢后，回踩低点不跌入该中枢上沿 |

**卖点**

| 卖点 | 条件 |
|------|------|
| **一卖** | 上涨趋势背驰点：当前段力度 < 前一段力度×0.8 |
| **二卖** | 一卖后反弹高点，不超过一卖点 |
| **三卖** | 向下笔确认跌破某中枢后，反弹高点不突破该中枢下沿 |

### 3. 支撑阻力位

多级别自动计算并标注：中枢上下沿（强度 0.85）> 线段高低点（0.75）> 笔高低点（0.6）> 买卖点价格 > 历史高低价（0.5）。

### 4. K 线可视化

主图叠加：MA5/20/60、笔（红涨绿跌）、线段（黄/橙）、中枢（紫色矩形）、买卖点标记、AI 入场/止损/止盈线、支撑阻力水平线。

副图：成交量、MACD（DIF/DEA+柱状图）、RSI、SKDJ。

### 5. AI 策略增强

规则策略引擎 + MACD 背驰检测 + 走势分类 + 多级别共振（日线+30分钟）+ LLM 自然语言分析（需配置 API Key）。

### 6. 大盘概览

实时展示上证/深证/创业板/科创50/沪深300/中证500 指数、涨跌家数，行业板块涨跌排行。每 5 分钟自动刷新。

### 7. 行业/概念板块

支持查看板块涨跌排行、板块详情（成分股列表），PC 端和移动端均支持。

### 8. 智能选股

MACD+SKDJ 双金叉共振 + 缠论买卖点过滤 + 基础指标过滤（涨跌幅、成交量、市盈率、市净率、行业）。SSE 流式返回，边算边展示，支持分页加载。

### 9. 个股扩展信息

五档盘口（买一到买五/卖一到卖五）、行业/题材概念、个股财经新闻，一站式聚合展示，减少前端请求次数。

### 10. 股票笔记

PC 端右侧栏 + 移动端底部抽屉笔记 Tab，支持发布/编辑/删除，提交后显示成功 Toast。

### 11. AI 诊股对话

个股页内置 AI 助手"缠师"，支持流式对话：
- 结合缠论数据（K线、笔、中枢、买卖点）进行诊断
- 支持多轮对话记忆，自动携带历史上下文
- 支持模型切换（DeepSeek / Gemini）
- 打字机效果实时展示 AI 回复
- 快捷问题推荐：一键填入常见问题

---

## 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 主力语言 |
| FastAPI | 0.115.x | Web 框架，异步 API |
| Uvicorn | 0.32.x | ASGI 服务器 |
| AKShare | 1.14.x | 金融数据源 |
| Pandas | 2.2.x | K 线数据处理 |
| NumPy | 1.26.x | 数值计算 |
| Pydantic | 2.10.x | 数据模型校验 |
| httpx | 0.28.x | HTTP 客户端 |
| TA-Lib (ta) | 1.9.x | 技术指标计算 |
| python-dotenv | 1.0.x | 环境变量加载 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5.x | 渐进式 JS 框架 |
| TypeScript | 5.7.x | 类型安全 |
| Vite | 6.0.x | 构建工具 |
| Pinia | 2.3.x | 状态管理 |
| Vue Router | 4.5.x | 前端路由 |
| ECharts | 5.5.x | K 线 & 副图图表库 |
| vue-echarts | 7.0.x | Vue + ECharts 绑定 |
| Axios | 1.7.x | HTTP 请求 |

### AI 模型（可选）

| 模型 | 用途 |
|------|------|
| DeepSeek API | 自然语言缠论分析 |
| Gemini API | 自然语言缠论分析 |

---

## 安装部署

### 前置条件

- Python 3.10+
- Node.js 18+
- npm 或 pnpm

### 1. 克隆项目

```bash
git clone <repo-url>
cd stock-chanlun
```

### 2. 安装后端依赖

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv .venv

# Windows 激活
.venv\Scripts\activate

# macOS/Linux 激活
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置环境变量（可选）

可参考 `backend/.env.example` 在 `backend/` 下创建 `.env`：

```env
# DeepSeek API（可选）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Gemini API（可选，二选一）
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx

# 生产建议：逗号分隔的前端源，默认 *（此时浏览器跨域凭证关闭）
# CORS_ORIGINS=http://localhost:5173,https://yourname.github.io

# 仅在东方财富等接口 SSL/代理异常时设为 1（默认校验证书，更安全）
# FINANCE_TLS_RELAXED=0
```

> 不配置 AI Key 时，系统以纯规则模式运行，所有缠论分析和买卖点判定仍然正常工作，仅 LLM 增强分析不可用。

### 4. 启动后端

```bash
cd backend
python main.py

# API 文档：http://localhost:8000/docs
# 健康检查：http://localhost:8000/health
```

> **注意**：后端默认端口为 **8000**，前端已配置代理到此端口。

### 5. 安装前端依赖

```bash
cd frontend
npm install
```

### 6. 启动前端开发服务器

```bash
npm run dev
# 终端会打印 Local 地址；默认 base 为 /stock-chanlun/，例如：
# PC 首页： http://localhost:5173/stock-chanlun/
# 移动端：  http://localhost:5173/stock-chanlun/m/
# 开发环境 axios 请求相对路径下的 API 根（见 frontend/src/api/stock.ts 中 resolveApiBaseURL），
# Vite 将 /api 与 /stock-chanlun/api 代理到 http://127.0.0.1:8000
```

### 7. 生产构建

```bash
cd frontend
npm run build
# 构建产物输出到 frontend/dist/
```

编辑 `frontend/.env.production`：`VITE_BASE_URL` 与部署子路径一致；`VITE_API_BASE_URL` 填后端根地址（仅域名时会自动补 `/api`，也可直接填 `https://xxx/api`）。

### 8. 后端测试（可选）

```bash
cd backend
pip install pytest
python -m pytest tests/ -q
```

仓库 CI：`.github/workflows/backend.yml` 在变更 `backend/` 时运行 pytest；`.github/workflows/frontend.yml` 构建并部署 GitHub Pages。

---

## API 接口文档

> 基础路径：`http://localhost:8000/api`

### 股票数据

```
GET  /api/stocks/search?q={keyword}          搜索股票
GET  /api/stocks/{code}/quote                实时行情
GET  /api/stocks/{code}/kline?level=&limit=  K线数据
GET  /api/stocks/{code}/info                 股票基本信息
GET  /api/stocks/{code}/extras              扩展信息（五档盘口/行业/新闻）
GET  /api/stocks/hot?limit=                  当日涨幅榜
GET  /api/stocks/screen?...                  选股（REST）
GET  /api/stocks/screen-stream?...           选股（SSE 流式）
```

`level` 参数支持：`1min` `5min` `15min` `30min` `60min` `daily` `weekly` `monthly`

### 市场数据

```
GET  /api/market/overview                    大盘概览（指数+涨跌家数+板块）
GET  /api/news?limit=                        财经要闻
GET  /api/sector/{name}/stocks               板块成分股（行业/概念）
```

### 缠论分析

```
GET  /api/chanlun/{code}?level=              缠论完整分析（结构+买卖点+支撑阻力）
GET  /api/chanlun/{code}/ai?level=&model=   AI 策略信号（背驰+走势+LLM）
```

### AI 诊股对话（流式 SSE）

```
GET   /api/ai/diagnosis?code=&question=&session_id=&model=   AI 诊股对话（流式返回）
POST  /api/ai/diagnosis                                              同上（POST 版本）
```

返回格式（SSE）：
- `{"token": "..."}` - 流式 token
- `{"done": true, "full": "..."}` - 完成信号
- `{"error": "..."}` - 错误信息

### 自选股管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/watchlist` | 获取自选股列表 |
| POST | `/api/watchlist/{code}` | 添加自选股 |
| DELETE | `/api/watchlist/{code}` | 删除自选股 |

### 笔记管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/comments/{stock_code}` | 获取笔记列表 |
| POST | `/api/comments/{stock_code}` | 创建笔记 |
| PUT | `/api/comments/{stock_code}/{id}` | 更新笔记 |
| DELETE | `/api/comments/{stock_code}/{id}` | 删除笔记 |

### 系统

```
GET  /api/settings                            获取当前 AI 模型设置
PUT  /api/settings?model=                     切换 AI 模型（deepseek / gemini）
GET  /health                                 健康检查
```

---

## 缠论算法说明

### 分型检测

分型是缠论最基础的结构单元，分为顶分型和底分型：

- **顶分型**：中间 K 线高点最高、低点也最高（相邻三根 K 线呈「∧」形）
- **底分型**：中间 K 线高点最低、低点也最低（相邻三根 K 线呈「∨」形）

包含关系处理：两根 K 线产生包含时，依据相对位置决定取高高或取低低。

### 笔（Bi）

笔是连接相邻顶底分型的 K 线段：
- **向上笔**：底分型 → 顶分型
- **向下笔**：顶分型 → 底分型
- **最小笔长**：默认 5 根 K 线

### 线段（Segment）

由连续 3 笔重叠构成，代表次级别走势。线段结束需要被反向线段破坏。

### 中枢（Zhongshu）

连续 3 个同级别线段重叠区域，代表多空博弈均衡区间。

### 背驰判断

比较相邻同向段的价格变化幅度与 MACD 面积：
- **底背驰**：价格新低，但 MACD 面积未新低
- **顶背驰**：价格新高，但 MACD 面积未新高

---

## 前端页面说明

以下路径为 **Vue Router 路径**（浏览器地址栏需加上前端 `base`，默认前缀 `/stock-chanlun/`）。

### PC 端

| 路径 | 说明 |
|------|------|
| `/` | 首页：大盘指数 + 热门板块 + 热门股票 + 财经要闻，自动5分钟刷新 |
| `/stock/:code` | 个股分析：三栏布局（左侧行情统计 + 中间K线图 + 右侧AI策略），键盘快捷键（R刷新、1/5/D/W/M切换级别） |
| `/watchlist` | 自选股监控：添加/删除/刷新，含最后更新时间，自动2分钟刷新 |
| `/screen` | 条件选股：SSE流式结果，含进度条和错误处理 |
| `/sector/:name` | 板块详情：成分股按涨跌幅降序排列 |

### 移动端

| 路径 | 说明 |
|------|------|
| `/m/` | 首页：搜索栏 + 指数 + 热门板块 + 热门股票 |
| `/m/stock/:code` | 个股页：顶部价格 + K线图 + 级别切换 + 信号摘要（可展开）+ 底部抽屉 |
| `/m/watchlist` | 自选股列表 |
| `/m/screen` | 条件选股 |
| `/m/sector/:name` | 板块详情（移动端） |

---

## 配置与参数

### 后端环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 否 | DeepSeek API Key |
| `GEMINI_API_KEY` | 否 | Gemini API Key |
| `CORS_ORIGINS` | 否 | 逗号分隔的允许来源；默认 `*`（与 `allow_credentials` 组合符合浏览器规则） |
| `FINANCE_TLS_RELAXED` | 否 | 设为 `1`/`true` 时对部分金融站点请求放宽 TLS 校验（默认关闭，优先安全） |

### 限流说明（后端）

缠论 / AI 策略、K 线（含 quote、导出）、AI 诊股等接口带有 **全局限流 + 按客户端 IP 限流**（支持 `X-Forwarded-For`）。触发时返回 HTTP **429**，前端会提示「请求过于频繁」。

### 持久化说明

自选、笔记、AI 模型设置写入 `backend/` 下 JSON 文件，进程内有锁与原子写；**多 Uvicorn worker 或多机部署时各实例状态不共享**，仅适合单机或明确约束下的部署。

### 前端环境变量（生产构建）

| 变量 | 说明 |
|------|------|
| `VITE_BASE_URL` | 静态资源与路由 base，如 `/stock-chanlun/` 或 `/` |
| `VITE_API_BASE_URL` | 后端 API 根；可填 `https://host`（自动补 `/api`）或 `https://host/api` |

### 前端指标默认值

| 指标 | 默认 | 指标 | 默认 |
|------|------|------|------|
| MA5/20/60 | 开启 | 成交量 | 开启 |
| 笔/线段/中枢 | 开启 | MACD | 开启 |
| 买卖点 | 开启 | RSI | 关闭 |
| AI 信号线 | 开启 | SKDJ | 关闭 |
| 支撑阻力 | 开启 | | |

所有指标可通过 `IndicatorSelector` 组件实时切换，无需重新加载数据。

---

## 常见问题

### Q: K 线数据获取超时？
后端已实现多源降级（东方财富 → 腾讯 → 新浪），超时后自动尝试备用源。

### Q: 缠论分析结果为空？
K 线数据不足 20 根时返回空，请确认股票有足够交易历史。

### Q: AI 分析不可用？
确认已配置 `.env` 中的 API Key，或切换至另一 AI 模型（DeepSeek ↔ Gemini）。在个股页面 AI 策略卡片中可切换模型。

### Q: 前端代理不生效或首页无数据？
确认后端已在 **8000** 运行；浏览器访问地址需带 **`/stock-chanlun/`**（与默认 `VITE_BASE_URL` 一致）。若设置了 `VITE_API_BASE_URL` 指向错误后端或缺少 `/api` 前缀，也会导致请求 404——可参考 `frontend/src/api/stock.ts` 中 `resolveApiBaseURL` 的逻辑。

### Q: 接口返回 429？
请求频率超过后端限流，稍后再试或降低自动刷新频率。

### Q: 板块数据获取失败？
板块数据依赖东方财富接口，获取失败时返回空列表，请稍后重试。

### Q: 如何添加新指标？
1. 后端：在 `backend/chanlun/` 中计算
2. 前端：在 `frontend/src/api/stock.ts` 添加类型
3. 在 `frontend/src/components/Chart/` 新建 `XxxChart.vue`
4. 在 `StockView.vue` 或 `MobileStockView.vue` 中引入并通过 `indicators.xxx` 控制

---

## 免责声明

本系统仅供技术研究与学习使用，不构成任何投资建议。股票投资有风险，入市需谨慎。系统分析结果可能与实际走势存在偏差，投资者应自行承担决策风险。
