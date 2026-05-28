import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../assets/screenshots');
const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173/stock-chanlun';

const pcPages = [
  { file: 'pc-home.png', path: '/', waitMs: 8000 },
  { file: 'pc-stock.png', path: '/stock/600519', waitMs: 12000 },
  { file: 'pc-watchlist.png', path: '/watchlist', waitMs: 6000 },
  { file: 'pc-screen.png', path: '/screen', waitMs: 8000 },
  { file: 'pc-sector.png', path: '/sector/半导体', waitMs: 8000 },
];

const mobilePages = [
  { file: 'mobile-home.png', path: '/m/', waitMs: 8000 },
  { file: 'mobile-stock.png', path: '/m/stock/600519', waitMs: 12000 },
];

async function shot(page, { file, path: route, waitMs }) {
  const url = `${BASE}${route}`;
  console.log(`→ ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(waitMs);
  await page.screenshot({
    path: path.join(OUT_DIR, file),
    fullPage: false,
    animations: 'disabled',
  });
  console.log(`  saved ${file}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const p of pcPages) await shot(pc, p);
  await pc.close();

  const iPhone = devices['iPhone 13'];
  const mobile = await browser.newPage({
    ...iPhone,
    viewport: iPhone.viewport,
  });
  for (const p of mobilePages) await shot(mobile, p);
  await mobile.close();

  await browser.close();
  console.log(`Done. Screenshots in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
