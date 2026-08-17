/**
 * Bakes the film's low-frequency texture into images:
 *   npm run film-ground
 *
 * Only the emulsion mottling and the indexing rules are baked. The grain and
 * dust stay as inline SVG turbulence in the stylesheet: baking those too was
 * measured at the same frame cost (7 dropped frames per 110 during the longest
 * travel, against 6) while adding 310 kB, because random noise does not
 * compress.
 *
 * These blotches used to be a dozen radial-gradients on `.fiche-sheet`. That
 * element is ~3300x3070 CSS px, far too large for the browser to hold as one
 * texture, so it is split into tiles that are rasterised on demand — and every
 * newly exposed tile had to evaluate all twelve gradients. Worse, the travel
 * blur forces the visible region to be re-rasterised each frame, so during a
 * pan the gradients were being re-evaluated 60 times a second. Baking them to
 * a raster turns that arithmetic into a blit.
 *
 * The source is low-frequency by nature, so a small image stretched over the
 * whole sheet is indistinguishable from the gradients that produced it.
 */
import { chromium } from "playwright";
import path from "node:path";

const OUT = path.resolve("public/microfiche/archive/film-ground.jpg");
const GRID_OUT = path.resolve("public/microfiche/archive/film-grid.png");
/** One major division, in --unit multiples, and the minor divisions inside it. */
const MAJOR = 8;
const MINOR = 2;
const GRID_PX = 800; // MAJOR units at 100px, the tile's natural size
const WIDTH = 800;
const HEIGHT = 744; // roughly the sheet's 33:30.7 aspect

/** Kept in step with --fiche-film in microfiche.css. */
const FILM = "#23201a";

const BLOTCHES = `
  radial-gradient(115% 115% at 50% 50%, transparent 58%, rgba(9, 7, 4, 0.3) 100%),
  radial-gradient(15% 26% at 39% 47%, rgba(227, 215, 184, 0.075), transparent 66%),
  radial-gradient(11% 15% at 84% 80%, rgba(227, 215, 184, 0.08), transparent 62%),
  radial-gradient(13% 21% at 57% 15%, rgba(9, 7, 4, 0.2), transparent 64%),
  radial-gradient(9% 17% at 26% 63%, rgba(9, 7, 4, 0.17), transparent 60%),
  radial-gradient(62% 84% at 16% 22%, rgba(227, 215, 184, 0.07), transparent 68%),
  radial-gradient(46% 62% at 73% 61%, rgba(227, 215, 184, 0.055), transparent 70%),
  radial-gradient(70% 58% at 43% 92%, rgba(9, 7, 4, 0.17), transparent 70%),
  radial-gradient(44% 58% at 88% 33%, rgba(9, 7, 4, 0.15), transparent 66%),
  radial-gradient(38% 74% at 4% 71%, rgba(9, 7, 4, 0.13), transparent 70%),
  radial-gradient(92% 120% at 97% 4%, rgba(227, 215, 184, 0.045), transparent 72%),
  radial-gradient(110% 90% at 62% 40%, rgba(9, 7, 4, 0.09), transparent 74%)
`;

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
});
await page.setContent(
    `<style>
       html, body { margin: 0; }
       #ground {
         width: ${WIDTH}px;
         height: ${HEIGHT}px;
         background-color: ${FILM};
         background-image: ${BLOTCHES.trim()};
       }
     </style>
     <div id="ground"></div>`,
);
await page.locator("#ground").screenshot({ path: OUT, type: "jpeg", quality: 92 });

/**
 * The indexing rules, as one tile. Four repeating linear-gradients on the sheet
 * cost the same way the blotches did — re-evaluated per exposed tile, and again
 * every frame under the travel blur. One PNG with alpha blits instead.
 */
const step = (GRID_PX / MAJOR) * MINOR;
const minor = [];
for (let at = step; at < GRID_PX; at += step) {
    minor.push(`<rect x="${at}" y="0" width="1" height="${GRID_PX}" fill="#e3d7b8" opacity=".05"/>`);
    minor.push(`<rect x="0" y="${at}" width="${GRID_PX}" height="1" fill="#e3d7b8" opacity=".05"/>`);
}
const gridPage = await browser.newPage({
    viewport: { width: GRID_PX, height: GRID_PX },
    deviceScaleFactor: 1,
});
await gridPage.setContent(
    `<style>html,body{margin:0;background:transparent}</style>
     <svg xmlns="http://www.w3.org/2000/svg" width="${GRID_PX}" height="${GRID_PX}">
       ${minor.join("")}
       <rect x="0" y="0" width="1" height="${GRID_PX}" fill="#e3d7b8" opacity=".1"/>
       <rect x="0" y="0" width="${GRID_PX}" height="1" fill="#e3d7b8" opacity=".1"/>
     </svg>`,
);
await gridPage.screenshot({ path: GRID_OUT, omitBackground: true });

await browser.close();
console.log(`film ground written to ${OUT} (${WIDTH}x${HEIGHT})`);
console.log(`film grid written to ${GRID_OUT} (${GRID_PX}x${GRID_PX})`);
