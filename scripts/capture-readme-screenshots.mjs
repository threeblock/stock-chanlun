import { chromium, devices } from 'playwright';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../assets/screenshots');
const BASE_PATH = '/stock-chanlun';
const PORT_START = Number(process.env.SCREENSHOT_PORT_START || 5173);
const PORT_END = Number(process.env.SCREENSHOT_PORT_END || 5188);

const pcPages = [
  { file: 'pc-home.png', route: '/', selector: '.nav-brand', extraMs: 2000 },
  { file: 'pc-stock.png', route: '/stock/600519', selector: '.nav-brand', extraMs: 5000 },
  { file: 'pc-watchlist.png', route: '/watchlist', selector: '.nav-brand', extraMs: 2000 },
  { file: 'pc-screen.png', route: '/screen', selector: '.nav-brand', extraMs: 2000 },
  { file: 'pc-sector.png', route: '/sector/半导体', selector: '.nav-brand', extraMs: 3000 },
];

const mobilePages = [
  { file: 'mobile-home.png', route: '/m/', selector: '.tab-bar', extraMs: 2000 },
  { file: 'mobile-stock.png', route: '/m/stock/600519', selector: '.tab-bar', extraMs: 5000 },
  { file: 'mobile-watchlist.png', route: '/m/watchlist', selector: '.page-title', extraMs: 2000 },
  { file: 'mobile-screen.png', route: '/m/screen', selector: '.page-title', extraMs: 2000 },
  { file: 'mobile-sector.png', route: '/m/sector/半导体', selector: '.ph-title', extraMs: 3000 },
];

async function probePort(port) {
  for (const host of ['127.0.0.1', 'localhost']) {
    const probe = `http://${host}:${port}${BASE_PATH}/`;
    try {
      const res = await fetch(probe, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const html = await res.text();
      if (/ChanStock|chanstock/i.test(html)) {
        return `http://${host}:${port}${BASE_PATH}`;
      }
    } catch {
      /* try next host */
    }
  }
  return null;
}

async function detectBaseUrl() {
  const env = process.env.SCREENSHOT_BASE_URL?.replace(/\/+$/, '');
  if (env) return env;

  const preferred = Number(process.env.SCREENSHOT_PREFERRED_PORT || 5188);
  const ports = [preferred];
  for (let port = PORT_START; port <= PORT_END; port++) {
    if (port !== preferred) ports.push(port);
  }

  for (const port of ports) {
    const base = await probePort(port);
    if (base) {
      console.log(`✓ 检测到开发服务器: ${base}`);
      return base;
    }
  }
  throw new Error(
    `未找到 ChanStock 前端（优先 ${preferred}，范围 ${PORT_START}-${PORT_END}）。请先启动后端与 npm run dev:screenshots。`,
  );
}

async function compressPng(src, dest) {
  await sharp(src)
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(dest);
  await unlink(src);
}

async function shot(page, base, { file, route, selector, extraMs }) {
  const url = `${base}${route}`;
  console.log(`→ ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector(selector, { timeout: 30000 });
  if (extraMs > 0) await page.waitForTimeout(extraMs);

  const title = await page.title();
  if (!/ChanStock|缠论/i.test(title) && !await page.locator('.nav-brand, .tab-bar').count()) {
    throw new Error(`页面校验失败: ${url}（title="${title}"）`);
  }

  const tmp = path.join(OUT_DIR, `.tmp-${file}`);
  const out = path.join(OUT_DIR, file);
  await page.screenshot({ path: tmp, fullPage: false, animations: 'disabled' });
  await compressPng(tmp, out);
  console.log(`  saved ${file}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const base = await detectBaseUrl();
  const browser = await chromium.launch({ headless: true });

  const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const p of pcPages) await shot(pc, base, p);
  await pc.close();

  const iPhone = devices['iPhone 13'];
  const mobile = await browser.newPage({ ...iPhone, viewport: iPhone.viewport });
  for (const p of mobilePages) await shot(mobile, base, p);
  await mobile.close();

  await browser.close();
  console.log(`Done. Screenshots in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
