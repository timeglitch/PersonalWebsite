/**
 * The microfiche contact sheet: how the projects are laid out as film.
 *
 * Everything lives on one finite two-dimensional sheet measured in grid units
 * (see SHEET.unit for the pixel size of a unit at zoom 1). Projects occupy
 * clusters of cells; transitional artifacts sit in the gaps so that travelling
 * between two projects pulls intervening material through the viewport.
 */
import { projects, type Project, type ProjectId } from "../projects";

/** Sheet extents in grid units, and the pixel size of one unit at zoom 1. */
export const SHEET = { width: 33, height: 30.7, unit: 100 } as const;

type CellBase = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    /** Cluster membership. Transitional artifacts leave this undefined. */
    project?: ProjectId;
    /**
     * Part of what the lens frames when this project is selected. The framed
     * cells' bounding box is what gets fitted, so a cluster composes its own
     * shape: most stack a wide caption clipping under the capture, but a
     * cluster is free to arrange its framed cells any way it likes.
     */
    framed?: boolean;
    /** Slight print rotation, in degrees. */
    tilt?: number;
};

export type PlateVariant =
    | "phonetic"
    | "code"
    | "parking-data"
    | "telemetry"
    | "coordinates"
    | "repertoire"
    | "program"
    | "inventory"
    | "restricted"
    | "divider"
    | "timestamp"
    | "test-pattern"
    | "stamp"
    | "reference"
    | "label"
    | "blank";

export type Cell = CellBase &
    (
        | {
              kind: "capture";
              src: string;
              label: string;
              /** The one capture per project that carries the live-site action. */
              primary?: boolean;
              /**
               * Website captures fill their cell and crop ("cover", the
               * default). Diagrams must be shown whole, so they use "contain"
               * and are printed as ink on paper rather than screened onto film.
               */
              fit?: "cover" | "contain";
          }
        | { kind: "cover" }
        | { kind: "clipping"; headline: string; body: string[] }
        | {
              kind: "plate";
              variant: PlateVariant;
              title?: string;
              lines?: string[];
          }
    );

const CAPTURES = "/microfiche/captures";
/** Hand-placed images. Kept apart from CAPTURES, which `npm run capture` wipes. */
const ARCHIVE = "/microfiche/archive";

/**
 * Spanish vowel formant ranges in Hz, lifted from Vocalize's own
 * src/VowelStimuli.json, which cites Martínez Celdrán (1995). The vowel chart
 * cell plots the midpoints, so the plate is a real chart rather than a prop.
 */
export const SPANISH_VOWELS = [
    { ipa: "i", f1: [258, 448], f2: [2151, 2687] },
    { ipa: "e", f1: [380, 691], f2: [1892, 2462] },
    { ipa: "a", f1: [605, 1045], f2: [1399, 1780] },
    { ipa: "o", f1: [395, 725], f2: [871, 1460] },
    { ipa: "u", f1: [285, 474], f2: [570, 1227] },
] as const;

export const cells: Cell[] = [
    // ── Vocalize ── top-left ────────────────────────────────────────────────
    // Every cluster centres on its hero: the primary capture sits in the middle
    // with the rest of the material printed above, below and to either side of
    // it, so the framed block reads as the middle of the group rather than its
    // top-left corner.
    {
        id: "voc-landing",
        kind: "capture",
        project: "vocalize",
        primary: true,
        framed: true,
        src: `${CAPTURES}/vocalize-landing.jpg`,
        label: "vocalize · landing",
        x: 5.4, y: 3.9, w: 6.4, h: 4,
    },
    {
        id: "voc-clip",
        kind: "clipping",
        project: "vocalize",
        framed: true,
        headline: "Biofeedback for the vowel",
        body: [
            "A browser listens to a learner speaking Spanish and draws the shape of the sound back at them in real time.",
            "Formant tracking turns the first and second resonances of the voice into a moving point on a vowel chart.",
        ],
        x: 5.4, y: 8.1, w: 6.4, h: 0.95,
    },
    { id: "voc-cover", kind: "cover", project: "vocalize", x: 9.6, y: 1.8, w: 3, h: 1.9, tilt: -0.5 },
    {
        id: "voc-formant",
        kind: "capture",
        project: "vocalize",
        fit: "contain",
        src: `${ARCHIVE}/formant-spectra.jpg`,
        label: "formant envelopes · f0 100–300 hz",
        x: 2.2, y: 3.9, w: 3, h: 2.5,
    },
    {
        // The source–filter model formant tracking rests on.
        id: "voc-lpc",
        kind: "capture",
        project: "vocalize",
        fit: "contain",
        src: `${ARCHIVE}/lpc-source-filter.jpg`,
        label: "lpc · source–filter model",
        x: 5, y: 1.95, w: 4.4, h: 1.75,
    },
    {
        id: "voc-phonetic",
        kind: "plate",
        project: "vocalize",
        variant: "phonetic",
        title: "Spanish vowels · F1/F2 (Hz)",
        lines: ["Martínez Celdrán 1995", "n = 5"],
        x: 1.8, y: 6.6, w: 3.4, h: 2,
    },
    {
        // The app mid-use: a vowel selected, with the F1 and F2 bands marked
        // on the live spectrum. Cell height set so the 1.64:1 shot fills the
        // image area once the caption strip is subtracted.
        id: "voc-detail",
        kind: "capture",
        project: "vocalize",
        src: `${ARCHIVE}/vocalize-formant-ui.jpg`,
        label: "vocalize · formant tracking",
        x: 12, y: 3.9, w: 3, h: 2, tilt: 0.5,
    },
    {
        id: "voc-mobile",
        kind: "capture",
        project: "vocalize",
        src: `${CAPTURES}/vocalize-mobile.jpg`,
        label: "vocalize · handheld",
        x: 12, y: 6.1, w: 1.5, h: 2.7,
    },

    // ── Satellite ── top-right ──────────────────────────────────────────────
    {
        id: "sat-landing",
        kind: "capture",
        project: "satellite",
        primary: true,
        framed: true,
        src: `${CAPTURES}/satellite-landing.jpg`,
        label: "windborne · viewer",
        x: 21.6, y: 3.9, w: 6.4, h: 4,
    },
    {
        id: "sat-clip",
        kind: "clipping",
        project: "satellite",
        framed: true,
        headline: "Constellation over fire",
        body: [
            "Interpolated balloon positions are drawn against EONET wildfire reports on a single rotating globe.",
            "A serverless proxy stands between the browser and the upstream feeds so the client can stay static.",
        ],
        x: 21.6, y: 8.1, w: 6.4, h: 0.95,
    },
    { id: "sat-cover", kind: "cover", project: "satellite", x: 23.3, y: 1.8, w: 3, h: 1.9, tilt: 0.5 },
    {
        id: "sat-telemetry",
        kind: "plate",
        project: "satellite",
        variant: "telemetry",
        title: "EONET · wildfires",
        lines: [
            "EONET_22614  PLAINS · SAN LUIS OBISPO CA",
            "EONET_22607  SHEEP PEN · LAS ANIMAS CO",
            "EONET_22619  RANCHER · OGLALA LAKOTA SD",
            "EONET_22610  DOS PISTOLAS · BROOKS TX",
        ],
        x: 18.4, y: 4.95, w: 3, h: 1.9,
    },
    {
        id: "sat-detail",
        kind: "capture",
        project: "satellite",
        src: `${CAPTURES}/satellite-detail.jpg`,
        label: "windborne · globe",
        x: 28.2, y: 4.95, w: 3, h: 1.9, tilt: -0.6,
    },

    // ── Parking ── centre ───────────────────────────────────────────────────
    {
        id: "prk-landing",
        kind: "capture",
        project: "parking",
        primary: true,
        framed: true,
        src: `${CAPTURES}/parking-landing.jpg`,
        label: "sjsu parking · history",
        x: 13.5, y: 13.75, w: 6.4, h: 4,
    },
    {
        id: "prk-clip",
        kind: "clipping",
        project: "parking",
        framed: true,
        headline: "Where the garages fill",
        body: [
            "A Python collector polls the campus parking status on a fixed interval and keeps the readings.",
            "The front end plots four garages against time so a driver can see the shape of a normal Tuesday.",
        ],
        x: 13.5, y: 17.95, w: 6.4, h: 0.95,
    },
    { id: "prk-cover", kind: "cover", project: "parking", x: 15.25, y: 11.65, w: 2.9, h: 1.9, tilt: -0.4 },
    {
        // The subject of the project: the campus whose garages are being
        // counted. Height set so the 1.68:1 map fills the image area once the
        // caption strip is subtracted, and nothing is cropped away.
        id: "t-map",
        kind: "capture",
        project: "parking",
        src: `${ARCHIVE}/sjsu-campus-map.jpg`,
        label: "sjsu · campus map",
        x: 9.9, y: 14.65, w: 3.4, h: 2.18,
    },
    {
        id: "prk-data",
        kind: "plate",
        project: "parking",
        variant: "parking-data",
        title: "2025·09·03 13:00 · full",
        lines: ["SOUTH 100%", "WEST 100%", "NORTH 100%", "SOUTH CAMPUS 53%"],
        x: 20.1, y: 13.75, w: 2.9, h: 1.9,
    },
    {
        id: "prk-detail",
        kind: "capture",
        project: "parking",
        src: `${CAPTURES}/parking-detail.jpg`,
        label: "sjsu parking · 30 days",
        x: 20.1, y: 15.85, w: 2.9, h: 1.9, tilt: 0.4,
    },

    // ── Balalaika ── bottom-left ────────────────────────────────────────────
    {
        id: "bal-landing",
        kind: "capture",
        project: "balalaika",
        primary: true,
        framed: true,
        src: `${CAPTURES}/balalaika-landing.jpg`,
        label: "sfbalalaika.org",
        x: 5, y: 23.6, w: 6.4, h: 4,
    },
    {
        id: "bal-clip",
        kind: "clipping",
        project: "balalaika",
        framed: true,
        headline: "Folk music, plainly hosted",
        body: [
            "The ensemble needed a site that any member could edit without a build step or a framework.",
            "Raw HTML, CSS and JavaScript keep the pages legible and the hosting free.",
        ],
        x: 5, y: 27.8, w: 6.4, h: 0.95,
    },
    { id: "bal-cover", kind: "cover", project: "balalaika", x: 6.7, y: 21.5, w: 3, h: 1.9, tilt: 0.5 },
    {
        id: "bal-repertoire",
        kind: "plate",
        project: "balalaika",
        variant: "repertoire",
        title: "Instrumentation",
        lines: [
            "BALALAIKA · piccolo to contrabass",
            "DOMRA · three or four strings",
            "BAYAN · chromatic button accordion",
            "ZHALEIKA · single reed",
            "SOPILKA · VIOLIN",
        ],
        x: 1.8, y: 24.65, w: 3, h: 1.9,
    },
    {
        id: "bal-detail",
        kind: "capture",
        project: "balalaika",
        src: `${CAPTURES}/balalaika-detail.jpg`,
        label: "sfbalalaika · about",
        x: 11.6, y: 23.6, w: 3, h: 1.9, tilt: 0.5,
    },
    {
        id: "bal-mobile",
        kind: "capture",
        project: "balalaika",
        src: `${CAPTURES}/balalaika-mobile.jpg`,
        label: "sfbalalaika · handheld",
        x: 11.6, y: 25.7, w: 1.2, h: 2.4,
    },

    // ── Asset System GUI ── bottom-right, restricted ────────────────────────
    // Deliberately a different composition: a square plate rather than a wide
    // capture, with its clipping above, the equipment record and machine room
    // below, and the building and cover card either side of it.
    {
        id: "ast-plate",
        kind: "plate",
        project: "assets",
        framed: true,
        variant: "restricted",
        title: "Asset System GUI",
        lines: ["Private project", "Documentation on request"],
        x: 23.4, y: 23.1, w: 3.6, h: 3.6,
    },
    {
        id: "ast-clip",
        kind: "clipping",
        project: "assets",
        framed: true,
        headline: "Inventory, made clickable",
        body: [
            "Hardware records for the Center for High Throughput Computing lived in a custom database and a lot of memory.",
            "A Tkinter front end put check-in, search and history in one window for staff.",
        ],
        x: 23.6, y: 21.5, w: 3.2, h: 1.2,
    },
    {
        id: "ast-inventory",
        kind: "plate",
        project: "assets",
        variant: "inventory",
        title: "Equipment record",
        lines: [
            "MODEL · POWEREDGE R740XD",
            "MFR · DELL EMC",
            "SERVICE TAG · 7J2QX53",
            "ASSET · 04417",
            "STATUS · IN SERVICE",
        ],
        x: 25.3, y: 27.3, w: 3.2, h: 1.15,
    },
    {
        // The software is withheld, so the machine room stands in for it.
        id: "ast-machine-room",
        kind: "capture",
        project: "assets",
        src: `${ARCHIVE}/chtc-machine-room.jpg`,
        label: "chtc · machine room",
        x: 21.9, y: 27.3, w: 3.2, h: 1.6,
    },
    {
        id: "ast-building",
        kind: "capture",
        project: "assets",
        src: `${ARCHIVE}/uw-computer-sciences.jpg`,
        label: "computer sciences · 1210 w dayton",
        x: 27.5, y: 24.15, w: 3.4, h: 1.7, tilt: 0.4,
    },
    { id: "ast-cover", kind: "cover", project: "assets", x: 20, y: 24.25, w: 2.9, h: 1.5, tilt: -0.5 },

    // ── Transitional artifacts ──────────────────────────────────────────────
    // The clusters are tight, so the artifacts run along the routes between
    // them: a column in the gap that separates each pair of side-by-side
    // clusters, and a band across the sheet between each pair of rows.

    // Column between Vocalize and Satellite.
    {
        id: "t-divider-ac",
        kind: "plate",
        variant: "divider",
        title: "A–C",
        lines: ["Selected work", "1 of 1"],
        x: 15.6, y: 2, w: 2.2, h: 1.4,
    },
    {
        id: "t-testpattern",
        kind: "plate",
        variant: "test-pattern",
        title: "Density",
        x: 15.75, y: 4, w: 1.9, h: 1.9,
    },
    {
        id: "t-code",
        kind: "plate",
        variant: "code",
        title: "src/audioUtils.js",
        lines: [
            "const res = await fetch(url)",
            "return ctx.decodeAudioData(",
            "  await res.arrayBuffer())",
        ],
        x: 15.3, y: 6.5, w: 2.8, h: 1.7, tilt: 0.6,
    },

    // Band between the top row and the parking cluster below it.
    {
        id: "t-voc-nav",
        kind: "capture",
        src: `${CAPTURES}/vocalize-nav.jpg`,
        label: "masthead crop",
        x: 2, y: 9.6, w: 3, h: 1.1,
    },
    {
        id: "t-stamp",
        kind: "plate",
        variant: "stamp",
        title: "Filmed",
        lines: ["FRAME COMPLETE"],
        x: 5.6, y: 9.9, w: 2, h: 1.3, tilt: -1.2,
    },
    {
        id: "t-blank",
        kind: "plate",
        variant: "blank",
        x: 8.2, y: 9.5, w: 2.1, h: 1.3,
    },
    {
        id: "t-reference",
        kind: "plate",
        variant: "reference",
        title: "Reference card",
        lines: ["REDUCTION 24:1", "POLARITY NEGATIVE", "SHEET 1 OF 1"],
        x: 11, y: 9.5, w: 2.8, h: 1.8, tilt: 0.5,
    },
    {
        id: "t-timestamp",
        kind: "plate",
        variant: "timestamp",
        title: "Repositories · created",
        lines: [
            "2025·06  vocalizeweb",
            "2025·09  windborne",
            "2025·09  sjsuparkingmonitor",
            "2026·01  sfbalalaika.org",
        ],
        x: 14.6, y: 9.6, w: 3.2, h: 1.7,
    },
    {
        id: "t-sat-nav",
        kind: "capture",
        src: `${CAPTURES}/satellite-nav.jpg`,
        label: "masthead crop",
        x: 18.6, y: 9.9, w: 2.7, h: 1,
    },
    {
        id: "t-coordinates",
        kind: "plate",
        variant: "coordinates",
        title: "EONET_22614",
        lines: ["35.4166 N", "120.0015 W"],
        x: 27.5, y: 9.9, w: 2.2, h: 1.1,
    },

    // Band between the parking cluster and the bottom row.
    {
        id: "t-bal-nav",
        kind: "capture",
        src: `${CAPTURES}/balalaika-nav.jpg`,
        label: "masthead crop",
        x: 2.6, y: 19.6, w: 3, h: 1.1,
    },
    {
        id: "t-divider-mid",
        kind: "plate",
        variant: "divider",
        title: "D–J",
        lines: ["Continued", "Overleaf"],
        x: 6.6, y: 19.4, w: 2.6, h: 1.5,
    },
    {
        id: "t-prk-nav",
        kind: "capture",
        src: `${CAPTURES}/parking-nav.jpg`,
        label: "masthead crop",
        x: 10.4, y: 19.6, w: 2.8, h: 1,
    },
    {
        id: "t-orbit",
        kind: "plate",
        variant: "telemetry",
        title: "Balloon constellation",
        lines: ["1000 SONDES / HOUR", "ALT 2.0 – 22.0 KM", "24 H OF HISTORY"],
        x: 20.6, y: 19.4, w: 2.8, h: 1.5, tilt: 0.6,
    },
    {
        id: "t-divider-end",
        kind: "plate",
        variant: "divider",
        title: "END",
        lines: ["Sheet complete", "Rewind"],
        x: 26, y: 19.5, w: 2.2, h: 1.4,
    },

    // Column between the ensemble and the asset archive.
    {
        id: "t-program",
        kind: "plate",
        variant: "program",
        title: "Performance notice",
        lines: ["2026 San Francisco Slavic Festival", "Russian Center", "31 January 2026 · afternoon"],
        x: 16, y: 22.6, w: 2.6, h: 1.7, tilt: 0.6,
    },
    {
        id: "t-label",
        kind: "plate",
        variant: "label",
        title: "CHTC",
        lines: ["PROPERTY RECORD"],
        x: 16.1, y: 25.3, w: 2.4, h: 1.3, tilt: -0.8,
    },
];

/** A project's cells, the block the lens frames, and where it centres. */
export type Cluster = {
    project: Project;
    cells: Cell[];
    /**
     * Bounding box of the cluster's `framed` cells. Each cluster composes this
     * for itself, so the lens fits whatever shape the project calls for rather
     * than one fixed arrangement.
     */
    frame: { x: number; y: number; w: number; h: number };
    /** The cell the live-site action hangs off: the primary capture, if any. */
    hero: Cell;
    focus: { x: number; y: number };
    /** Index-style coordinate for the cluster, e.g. "B2". */
    coordinate: string;
};

/** Sheet coordinates run A.. across in 2-unit columns and 1.. down in 2-unit rows. */
export function coordinateAt(x: number, y: number): string {
    const column = String.fromCharCode(65 + Math.max(0, Math.floor(x / 2)));
    const row = Math.max(1, Math.floor(y / 2) + 1);
    return `${column}${row}`;
}

const boundingBox = (group: Cell[]) => {
    const minX = Math.min(...group.map((c) => c.x));
    const minY = Math.min(...group.map((c) => c.y));
    return {
        x: minX,
        y: minY,
        w: Math.max(...group.map((c) => c.x + c.w)) - minX,
        h: Math.max(...group.map((c) => c.y + c.h)) - minY,
    };
};

export const clusters: Cluster[] = projects.map((project) => {
    const owned = cells.filter((cell) => cell.project === project.id);

    // Fall back to the largest cell so a cluster that marks nothing still frames.
    const marked = owned.filter((cell) => cell.framed);
    const frame = boundingBox(
        marked.length
            ? marked
            : [owned.reduce((biggest, cell) => (cell.w * cell.h > biggest.w * biggest.h ? cell : biggest))],
    );

    const hero =
        owned.find((cell) => cell.kind === "capture" && cell.primary === true) ?? marked[0] ?? owned[0];

    return {
        project,
        cells: owned,
        frame,
        hero,
        focus: { x: frame.x + frame.w / 2, y: frame.y + frame.h / 2 },
        coordinate: coordinateAt(frame.x, frame.y),
    };
});

/** Index of the cluster whose focus is closest to a point on the sheet. */
export function nearestClusterIndex(x: number, y: number): number {
    let best = 0;
    let bestDistance = Infinity;
    clusters.forEach((cluster, index) => {
        const dx = cluster.focus.x - x;
        const dy = cluster.focus.y - y;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
        }
    });
    return best;
}
