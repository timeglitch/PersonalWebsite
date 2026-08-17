/**
 * The microfiche contact sheet.
 *
 * Everything lives on one finite two-dimensional sheet measured in grid units
 * (see SHEET.unit for the pixel size of a unit at zoom 1). Projects occupy
 * clusters of cells; transitional artifacts sit in the gaps so that travelling
 * between two projects pulls intervening material through the viewport.
 */

export type ProjectId = "vocalize" | "parking" | "satellite" | "balalaika" | "assets";

export type Project = {
    id: ProjectId;
    name: string;
    year: string;
    dates: string;
    role: string;
    description: string;
    /** Archive reference printed on the cover card. */
    archive: string;
    url?: string;
    /** Private work: shown as a restricted plate with no external link. */
    restricted?: boolean;
};

export const projects: Project[] = [
    {
        id: "vocalize",
        name: "Vocalize",
        year: "2025",
        dates: "2025",
        role: "React · TypeScript · Audio",
        description:
            "Help people learn vowel sounds for Spanish using live audio processing and visualizations. A novel application for accessible biofeedback in language learning.",
        archive: "FZ·VOC·2025",
        url: "https://vocalize-web-ten.vercel.app/",
    },
    {
        id: "parking",
        name: "SJSU Parking Tracker",
        year: "2024",
        dates: "2024–2026",
        role: "React · Python",
        description:
            "A tracker for parking availability at San Jose State University, built with React and a Python backend.",
        archive: "FZ·PRK·2024",
        url: "https://timeglitch.github.io/SJSUParkingMonitor/",
    },
    {
        id: "satellite",
        name: "Satellite Tracker",
        year: "2024",
        dates: "2024",
        role: "React · Three.js · Data",
        description:
            "Visualize interpolated satellite data overlaid on EONET wildfire locations, built with React, Three.js and a serverless proxy.",
        archive: "FZ·SAT·2024",
        url: "https://windborne-nu.vercel.app/",
    },
    {
        id: "balalaika",
        name: "SF Balalaika Ensemble",
        year: "2023",
        dates: "2023–",
        role: "HTML · CSS · JavaScript",
        description:
            "A website for the San Francisco Balalaika Ensemble, a local folk music group I play in. Built in raw HTML/CSS/JavaScript, to make it as easy as possible to update and host.",
        archive: "FZ·BAL·2023",
        url: "https://sfbalalaika.org",
    },
    {
        id: "assets",
        name: "Asset System GUI",
        year: "2023",
        dates: "2023",
        role: "Python · Tkinter · Database",
        description:
            "A graphical user interface for Center for High Throughput Computing assets, built with Python and Tkinter on top of a custom database.",
        archive: "FZ·AST·2023",
        restricted: true,
    },
];

/** Sheet extents in grid units, and the pixel size of one unit at zoom 1. */
export const SHEET = { width: 34, height: 20, unit: 100 } as const;

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

export type ArtifactVariant =
    | "phonetic"
    | "waveform"
    | "code"
    | "parking-data"
    | "map"
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
          }
        | { kind: "cover" }
        | { kind: "clipping"; headline: string; body: string[] }
        | {
              kind: "artifact";
              variant: ArtifactVariant;
              title?: string;
              lines?: string[];
          }
    );

const CAPTURES = "/microfiche/captures";

export const cells: Cell[] = [
    // ── Vocalize ── top-left ────────────────────────────────────────────────
    // Standard composition: capture with a wide caption clipping butted under it.
    {
        id: "voc-landing",
        kind: "capture",
        project: "vocalize",
        primary: true,
        framed: true,
        src: `${CAPTURES}/vocalize-landing.jpg`,
        label: "vocalize · landing",
        x: 2, y: 1.8, w: 6.4, h: 4,
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
        x: 2, y: 5.95, w: 6.4, h: 0.95,
    },
    { id: "voc-cover", kind: "cover", project: "vocalize", x: 9, y: 1.8, w: 3, h: 1.9, tilt: -0.5 },
    {
        id: "voc-phonetic",
        kind: "artifact",
        project: "vocalize",
        variant: "phonetic",
        title: "Vowel chart · F1/F2",
        lines: ["i", "e", "a", "o", "u"],
        x: 9, y: 3.95, w: 3, h: 1.9,
    },
    {
        id: "voc-detail",
        kind: "capture",
        project: "vocalize",
        src: `${CAPTURES}/vocalize-detail.jpg`,
        label: "vocalize · interface",
        x: 9, y: 6.05, w: 3, h: 1.9, tilt: 0.5,
    },
    {
        id: "voc-mobile",
        kind: "capture",
        project: "vocalize",
        src: `${CAPTURES}/vocalize-mobile.jpg`,
        label: "vocalize · handheld",
        x: 12.4, y: 1.8, w: 1.5, h: 2.7,
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
        x: 23.4, y: 1.8, w: 6.4, h: 4,
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
        x: 23.4, y: 5.95, w: 6.4, h: 0.95,
    },
    { id: "sat-cover", kind: "cover", project: "satellite", x: 30.4, y: 1.8, w: 3, h: 1.9, tilt: 0.5 },
    {
        id: "sat-telemetry",
        kind: "artifact",
        project: "satellite",
        variant: "telemetry",
        title: "Telemetry · T−3h",
        lines: [
            "SONDE 0412   37.77 N  122.41 W   18.9 km",
            "SONDE 0577   34.05 N  118.24 W   19.4 km",
            "EONET 41133  FIRE · CALIFORNIA",
            "EONET 41151  FIRE · OREGON",
        ],
        x: 30.4, y: 3.95, w: 3, h: 1.9,
    },
    {
        id: "sat-detail",
        kind: "capture",
        project: "satellite",
        src: `${CAPTURES}/satellite-detail.jpg`,
        label: "windborne · globe",
        x: 30.4, y: 6.05, w: 3, h: 1.9, tilt: -0.6,
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
        x: 13.6, y: 9.2, w: 6.4, h: 4,
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
        x: 13.6, y: 13.35, w: 6.4, h: 0.95,
    },
    { id: "prk-cover", kind: "cover", project: "parking", x: 20.5, y: 9.2, w: 2.9, h: 1.9, tilt: -0.4 },
    {
        id: "prk-data",
        kind: "artifact",
        project: "parking",
        variant: "parking-data",
        title: "Occupancy · sample",
        lines: ["SOUTH 92%", "WEST 92%", "NORTH 81%", "SOUTH CAMPUS 9%"],
        x: 20.5, y: 11.35, w: 2.9, h: 1.9,
    },
    {
        id: "prk-detail",
        kind: "capture",
        project: "parking",
        src: `${CAPTURES}/parking-detail.jpg`,
        label: "sjsu parking · 30 days",
        x: 20.5, y: 13.45, w: 2.9, h: 1.9, tilt: 0.4,
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
        x: 2, y: 13.2, w: 6.4, h: 4,
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
        x: 2, y: 17.35, w: 6.4, h: 0.95,
    },
    { id: "bal-cover", kind: "cover", project: "balalaika", x: 9, y: 13.2, w: 3, h: 1.9, tilt: 0.5 },
    {
        id: "bal-repertoire",
        kind: "artifact",
        project: "balalaika",
        variant: "repertoire",
        title: "Instrumentation",
        lines: [
            "BALALAIKA · prima to kontrabass",
            "DOMRA · small to bass",
            "ZHALEIKA · BRELKA · SVIREL",
            "ROZHOK · SOPILKA",
            "BAYAN · VIOLIN",
        ],
        x: 9, y: 15.35, w: 3, h: 1.9,
    },
    {
        id: "bal-detail",
        kind: "capture",
        project: "balalaika",
        src: `${CAPTURES}/balalaika-detail.jpg`,
        label: "sfbalalaika · about",
        x: 9, y: 17.45, w: 3, h: 1.9, tilt: 0.5,
    },
    {
        id: "bal-mobile",
        kind: "capture",
        project: "balalaika",
        src: `${CAPTURES}/balalaika-mobile.jpg`,
        label: "sfbalalaika · handheld",
        x: 12.2, y: 13.2, w: 1.2, h: 2.4,
    },

    // ── Asset System GUI ── bottom-right, restricted ────────────────────────
    // Deliberately a different composition: a square plate with its clipping and
    // equipment record stacked beside it, rather than a wide capture and caption.
    {
        id: "ast-plate",
        kind: "artifact",
        project: "assets",
        framed: true,
        variant: "restricted",
        title: "Asset System GUI",
        lines: ["Private project", "Documentation on request"],
        x: 23.6, y: 13.2, w: 4.2, h: 4.2,
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
        x: 28, y: 13.2, w: 3.2, h: 1.2,
    },
    {
        id: "ast-inventory",
        kind: "artifact",
        project: "assets",
        framed: true,
        variant: "inventory",
        title: "Equipment record",
        lines: ["ASSET 04417", "CLASS · COMPUTE NODE", "STATUS · IN SERVICE", "LOC · CHTC"],
        x: 28, y: 14.9, w: 3.2, h: 0.95,
    },
    { id: "ast-cover", kind: "cover", project: "assets", x: 23.6, y: 17.6, w: 3.4, h: 1.8, tilt: -0.5 },

    // ── Transitional artifacts ──────────────────────────────────────────────
    // Top band, between Vocalize and Satellite.
    {
        id: "t-divider-ac",
        kind: "artifact",
        variant: "divider",
        title: "A–C",
        lines: ["Selected work", "1 of 1"],
        x: 14.4, y: 2, w: 2.2, h: 1.4,
    },
    {
        id: "t-code",
        kind: "artifact",
        variant: "code",
        title: "audio/formants.ts",
        lines: ["const [f1, f2] = peaks(spectrum)", "return chart.project(f1, f2)"],
        x: 17.2, y: 1.9, w: 2.8, h: 1.7, tilt: 0.6,
    },
    {
        id: "t-testpattern",
        kind: "artifact",
        variant: "test-pattern",
        title: "Density",
        x: 20.6, y: 2, w: 1.9, h: 1.9,
    },
    {
        id: "t-voc-nav",
        kind: "capture",
        src: `${CAPTURES}/vocalize-nav.jpg`,
        label: "masthead crop",
        x: 14.4, y: 4, w: 3, h: 1.1,
    },
    {
        id: "t-stamp",
        kind: "artifact",
        variant: "stamp",
        title: "Filmed",
        lines: ["FRAME COMPLETE"],
        x: 18, y: 4.2, w: 2, h: 1.3, tilt: -1.2,
    },
    {
        id: "t-blank",
        kind: "artifact",
        variant: "blank",
        x: 20.8, y: 4.2, w: 2.1, h: 1.3,
    },
    {
        id: "t-reference",
        kind: "artifact",
        variant: "reference",
        title: "Reference card",
        lines: ["REDUCTION 24:1", "POLARITY NEGATIVE", "SHEET 1 OF 1"],
        x: 14.6, y: 5.8, w: 2.8, h: 1.8, tilt: 0.5,
    },
    {
        id: "t-sat-nav",
        kind: "capture",
        src: `${CAPTURES}/satellite-nav.jpg`,
        label: "masthead crop",
        x: 17.9, y: 6, w: 2.7, h: 1,
    },
    {
        id: "t-coordinates",
        kind: "artifact",
        variant: "coordinates",
        title: "Index",
        lines: ["37.3352 N", "121.8811 W", "ALT 26 M"],
        x: 21, y: 5.9, w: 2.2, h: 1.1,
    },
    {
        id: "t-timestamp",
        kind: "artifact",
        variant: "timestamp",
        title: "Development log",
        lines: [
            "2023·07  asset system gui",
            "2023·11  sfbalalaika.org",
            "2024·09  satellite tracker",
            "2024·12  parking tracker",
            "2025·05  vocalize",
        ],
        x: 18.2, y: 7.2, w: 3.2, h: 1.7,
    },

    // Left band, between Vocalize and the Balalaika ensemble.
    {
        id: "t-waveform",
        kind: "artifact",
        variant: "waveform",
        title: "Sustained /a/",
        x: 2.4, y: 8.4, w: 2.8, h: 1.5, tilt: -0.5,
    },
    {
        id: "t-divider-mid",
        kind: "artifact",
        variant: "divider",
        title: "D–J",
        lines: ["Continued", "Overleaf"],
        x: 6, y: 8.4, w: 2.6, h: 1.5,
    },
    {
        id: "t-map",
        kind: "artifact",
        variant: "map",
        title: "San José · campus",
        x: 9.4, y: 8.4, w: 2.6, h: 1.7,
    },
    {
        id: "t-bal-nav",
        kind: "capture",
        src: `${CAPTURES}/balalaika-nav.jpg`,
        label: "masthead crop",
        x: 2.4, y: 10.6, w: 3, h: 1.1,
    },

    // Right band, between Satellite and the asset archive.
    {
        id: "t-orbit",
        kind: "artifact",
        variant: "telemetry",
        title: "Pass · descending",
        lines: ["INC 51.6°", "PERIOD 92.7 MIN", "PROXY · EDGE"],
        x: 24, y: 8.6, w: 2.8, h: 1.5, tilt: 0.6,
    },
    {
        id: "t-prk-nav",
        kind: "capture",
        src: `${CAPTURES}/parking-nav.jpg`,
        label: "masthead crop",
        x: 27.6, y: 8.6, w: 2.8, h: 1,
    },
    {
        id: "t-divider-end",
        kind: "artifact",
        variant: "divider",
        title: "END",
        lines: ["Sheet complete", "Rewind"],
        x: 30.8, y: 8.6, w: 2.2, h: 1.4,
    },

    // Lower band, between the ensemble and the asset archive.
    {
        id: "t-program",
        kind: "artifact",
        variant: "program",
        title: "Programme",
        lines: ["Korobushka", "Dark Eyes", "Kalinka"],
        x: 14.6, y: 16.4, w: 2.6, h: 1.7, tilt: 0.6,
    },
    {
        id: "t-label",
        kind: "artifact",
        variant: "label",
        title: "CHTC",
        lines: ["PROPERTY RECORD"],
        x: 18.2, y: 16.6, w: 2.4, h: 1.3, tilt: -0.8,
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
