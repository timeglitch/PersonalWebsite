/**
 * Captures the live project sites into public/microfiche/captures/.
 *
 * The microfiche viewer deliberately shows an archived moment, so these images
 * are committed and only refreshed on demand:  npm run capture
 *
 * They are written as JPEGs at 2x, which covers the framed tile filling most of
 * the lens on a retina display. Every capture passes through a duotone before
 * it is seen, so compression artefacts never survive to the screen.
 */
import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/microfiche/captures");

/**
 * Each shot is a viewport-sized capture; `clip` crops a region out of the page
 * for interface details and headline/nav strips.
 */
const sites = [
    {
        slug: "vocalize",
        url: "https://vocalize-web-ten.vercel.app/",
        settle: 4000,
        shots: [
            { name: "landing", viewport: { width: 1280, height: 800 } },
            { name: "nav", viewport: { width: 1280, height: 800 }, clip: { x: 0, y: 0, width: 1280, height: 190 } },
            { name: "detail", viewport: { width: 1280, height: 800 }, clip: { x: 140, y: 220, width: 1000, height: 460 } },
            { name: "mobile", viewport: { width: 420, height: 760 } },
        ],
    },
    {
        slug: "parking",
        url: "https://timeglitch.github.io/SJSUParkingMonitor/",
        settle: 5000,
        // The scraper stopped in April 2026, so "Today" and the recent windows
        // plot nothing. Step the 30-day view back to the last populated month
        // so the capture shows a real dataset rather than an empty grid.
        prepare: async (page) => {
            await page.selectOption("select", "month").catch(() => {});
            await sleep(2500);
            for (let step = 0; step < 4; step++) {
                await page.click("text=< Back").catch(() => {});
                await sleep(2000);
            }
            await sleep(2000);
        },
        shots: [
            { name: "landing", viewport: { width: 1280, height: 800 } },
            { name: "nav", viewport: { width: 1280, height: 800 }, clip: { x: 0, y: 0, width: 1280, height: 190 } },
            { name: "detail", viewport: { width: 1280, height: 800 }, clip: { x: 90, y: 200, width: 1100, height: 500 } },
        ],
    },
    {
        slug: "satellite",
        url: "https://windborne-nu.vercel.app/",
        // WebGL globe needs time to load tiles and draw a frame worth capturing.
        settle: 9000,
        shots: [
            { name: "landing", viewport: { width: 1280, height: 800 } },
            { name: "nav", viewport: { width: 1280, height: 800 }, clip: { x: 0, y: 0, width: 1280, height: 190 } },
            { name: "detail", viewport: { width: 1280, height: 800 }, clip: { x: 240, y: 140, width: 800, height: 620 } },
        ],
    },
    {
        slug: "balalaika",
        url: "https://sfbalalaika.org",
        settle: 3500,
        shots: [
            { name: "landing", viewport: { width: 1280, height: 800 } },
            { name: "nav", viewport: { width: 1280, height: 800 }, clip: { x: 0, y: 0, width: 1280, height: 190 } },
            { name: "detail", viewport: { width: 1280, height: 800 }, clip: { x: 100, y: 230, width: 1080, height: 470 } },
            { name: "mobile", viewport: { width: 420, height: 760 } },
        ],
    },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    await rm(OUT, { recursive: true, force: true });
    await mkdir(OUT, { recursive: true });

    const browser = await chromium.launch();
    const results = [];

    for (const site of sites) {
        for (const shot of site.shots) {
            const file = path.join(OUT, `${site.slug}-${shot.name}.jpg`);
            const context = await browser.newContext({
                viewport: shot.viewport,
                deviceScaleFactor: 2,
                colorScheme: "light",
                reducedMotion: "reduce",
            });
            const page = await context.newPage();
            try {
                await page.goto(site.url, { waitUntil: "networkidle", timeout: 45000 });
            } catch {
                // networkidle never settles on the polling dashboards; the load
                // event plus the settle delay is enough for a stable frame.
                await page.waitForLoadState("load").catch(() => {});
            }
            await sleep(site.settle);
            if (site.prepare) await site.prepare(page);

            // Clips are authored against the viewport, not the full document.
            const clip = shot.clip
                ? {
                      x: shot.clip.x,
                      y: shot.clip.y,
                      width: Math.min(shot.clip.width, shot.viewport.width - shot.clip.x),
                      height: Math.min(shot.clip.height, shot.viewport.height - shot.clip.y),
                  }
                : undefined;

            await page.screenshot({ path: file, clip, type: "jpeg", quality: 80 });
            results.push(`${site.slug}-${shot.name}`);
            console.log(`captured ${site.slug}-${shot.name}`);
            await context.close();
        }
    }

    await browser.close();
    console.log(`\n${results.length} captures written to ${OUT}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
