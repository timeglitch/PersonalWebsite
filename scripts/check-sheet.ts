/**
 * Sanity check for the contact sheet:  npm run check
 *
 * Cells are hand-placed on a 34x20 grid, so it is easy to overlap two of them,
 * push one off the sheet, or point at an image that is not there. This catches
 * all three, and reports how much unused height each cell is carrying so the
 * cards can be sized to their content.
 */
import { existsSync } from "node:fs";
import { cells, clusters, SHEET } from "../src/microfiche/sheetData";

/** Minimum gap between two cells, in grid units. */
const PAD = 0.12;

let problems = 0;
const fail = (message: string) => {
    console.error(`  ✗ ${message}`);
    problems++;
};

for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i];
        const b = cells[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapX > -PAD && overlapY > -PAD) {
            fail(`${a.id} and ${b.id} are touching (x ${overlapX.toFixed(2)}, y ${overlapY.toFixed(2)})`);
        }
    }
}

for (const cell of cells) {
    if (cell.x < 0 || cell.y < 0 || cell.x + cell.w > SHEET.width || cell.y + cell.h > SHEET.height) {
        fail(`${cell.id} falls outside the ${SHEET.width}x${SHEET.height} sheet`);
    }
    if (cell.kind === "capture" && !existsSync(`public${cell.src}`)) {
        fail(`${cell.id} points at a missing image: ${cell.src}`);
    }
}

const ids = cells.map((cell) => cell.id);
for (const id of new Set(ids)) {
    if (ids.filter((other) => other === id).length > 1) fail(`duplicate cell id: ${id}`);
}

for (const cluster of clusters) {
    const framed = cluster.cells.filter((cell) => cell.framed).map((cell) => cell.id);
    if (!framed.length) fail(`${cluster.project.id} marks no cells as framed`);
    console.log(
        `  ${cluster.project.id.padEnd(10)} frame ${cluster.frame.w.toFixed(1)}x${cluster.frame.h.toFixed(1)}` +
            ` at ${cluster.coordinate}  [${framed.join(", ")}]`,
    );
}

console.log(
    problems
        ? `\n${problems} problem${problems === 1 ? "" : "s"}`
        : `\nok — ${cells.length} cells, no overlaps, every image present`,
);
process.exit(problems ? 1 : 0);
