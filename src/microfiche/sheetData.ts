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
    {
        id: "voc-landing",
        kind: "capture",
        project: "vocalize",
        primary: true,
        src: `${CAPTURES}/vocalize-landing.jpg`,
        label: "vocalize · landing",
        x: 2, y: 2, w: 6.4, h: 4,
    },
    { id: "voc-cover", kind: "cover", project: "vocalize", x: 9, y: 2, w: 3, h: 1.9, tilt: -0.5 },
    {
        id: "voc-clip",
        kind: "clipping",
        project: "vocalize",
        headline: "Biofeedback for the vowel",
        body: [
            "A browser listens to a learner speaking Spanish and draws the shape of the sound back at them in real time.",
            "Formant tracking turns the first and second resonances of the voice into a moving point on a vowel chart.",
        ],
        x: 9, y: 4.3, w: 3, h: 1.7, tilt: 0.4,
    },
    {
        id: "voc-phonetic",
        kind: "artifact",
        project: "vocalize",
        variant: "phonetic",
        title: "Vowel chart · F1/F2",
        lines: ["i", "e", "a", "o", "u"],
        x: 2, y: 6.6, w: 3.2, h: 1.9,
    },
    {
        id: "voc-detail",
        kind: "capture",
        project: "vocalize",
        src: `${CAPTURES}/vocalize-detail.jpg`,
        label: "vocalize · interface",
        x: 5.6, y: 6.6, w: 2.8, h: 1.9, tilt: 0.5,
    },
    {
        id: "voc-mobile",
        kind: "capture",
        project: "vocalize",
        src: `${CAPTURES}/vocalize-mobile.jpg`,
        label: "vocalize · handheld",
        x: 9, y: 6.6, w: 1.5, h: 2.7,
    },

    // ── Satellite ── top-right ──────────────────────────────────────────────
    {
        id: "sat-landing",
        kind: "capture",
        project: "satellite",
        primary: true,
        src: `${CAPTURES}/satellite-landing.jpg`,
        label: "windborne · viewer",
        x: 22.4, y: 2.2, w: 6.6, h: 4.1,
    },
    { id: "sat-cover", kind: "cover", project: "satellite", x: 29.6, y: 2.2, w: 2.9, h: 1.9, tilt: 0.5 },
    {
        id: "sat-clip",
        kind: "clipping",
        project: "satellite",
        headline: "Constellation over fire",
        body: [
            "Interpolated balloon positions are drawn against EONET wildfire reports on a single rotating globe.",
            "A serverless proxy stands between the browser and the upstream feeds so the client can stay static.",
        ],
        x: 29.6, y: 4.5, w: 2.9, h: 1.8, tilt: -0.4,
    },
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
        x: 22.4, y: 6.7, w: 3.4, h: 1.9,
    },
    {
        id: "sat-detail",
        kind: "capture",
        project: "satellite",
        src: `${CAPTURES}/satellite-detail.jpg`,
        label: "windborne · globe",
        x: 26.2, y: 6.7, w: 2.8, h: 2, tilt: -0.6,
    },

    // ── Parking ── centre ───────────────────────────────────────────────────
    {
        id: "prk-landing",
        kind: "capture",
        project: "parking",
        primary: true,
        src: `${CAPTURES}/parking-landing.jpg`,
        label: "sjsu parking · history",
        x: 13.4, y: 8.4, w: 6.4, h: 4,
    },
    { id: "prk-cover", kind: "cover", project: "parking", x: 20.1, y: 8.9, w: 2.9, h: 1.9, tilt: -0.4 },
    {
        id: "prk-clip",
        kind: "clipping",
        project: "parking",
        headline: "Where the garages fill",
        body: [
            "A Python collector polls the campus parking status on a fixed interval and keeps the readings.",
            "The front end plots four garages against time so a driver can see the shape of a normal Tuesday.",
        ],
        x: 20.1, y: 11, w: 2.9, h: 1.7, tilt: 0.5,
    },
    {
        id: "prk-data",
        kind: "artifact",
        project: "parking",
        variant: "parking-data",
        title: "Occupancy · sample",
        lines: ["SOUTH 92%", "WEST 92%", "NORTH 81%", "SOUTH CAMPUS 9%"],
        x: 13.4, y: 12.8, w: 3.2, h: 1.9,
    },
    {
        id: "prk-detail",
        kind: "capture",
        project: "parking",
        src: `${CAPTURES}/parking-detail.jpg`,
        label: "sjsu parking · 30 days",
        x: 17, y: 12.8, w: 2.8, h: 1.9, tilt: 0.4,
    },

    // ── Balalaika ── bottom-left ────────────────────────────────────────────
    {
        id: "bal-landing",
        kind: "capture",
        project: "balalaika",
        primary: true,
        src: `${CAPTURES}/balalaika-landing.jpg`,
        label: "sfbalalaika.org",
        x: 2.4, y: 13.4, w: 6.4, h: 4,
    },
    { id: "bal-cover", kind: "cover", project: "balalaika", x: 9, y: 13.4, w: 2.9, h: 1.9, tilt: 0.5 },
    {
        id: "bal-clip",
        kind: "clipping",
        project: "balalaika",
        headline: "Folk music, plainly hosted",
        body: [
            "The ensemble needed a site that any member could edit without a build step or a framework.",
            "Raw HTML, CSS and JavaScript keep the pages legible and the hosting free.",
        ],
        x: 9, y: 15.7, w: 2.9, h: 1.7, tilt: -0.4,
    },
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
        x: 2.4, y: 17.8, w: 3.4, h: 1.7,
    },
    {
        id: "bal-detail",
        kind: "capture",
        project: "balalaika",
        src: `${CAPTURES}/balalaika-detail.jpg`,
        label: "sfbalalaika · about",
        x: 6.2, y: 17.8, w: 2.6, h: 1.7, tilt: 0.5,
    },
    {
        id: "bal-mobile",
        kind: "capture",
        project: "balalaika",
        src: `${CAPTURES}/balalaika-mobile.jpg`,
        label: "sfbalalaika · handheld",
        x: 9.2, y: 17.6, w: 1.4, h: 2.3,
    },

    // ── Asset System GUI ── bottom-right, restricted ────────────────────────
    {
        id: "ast-plate",
        kind: "artifact",
        project: "assets",
        variant: "restricted",
        title: "Asset System GUI",
        lines: ["Private project", "Documentation on request"],
        x: 23, y: 13.6, w: 5.4, h: 3.4,
    },
    { id: "ast-cover", kind: "cover", project: "assets", x: 28.8, y: 13.6, w: 2.9, h: 1.9, tilt: -0.5 },
    {
        id: "ast-clip",
        kind: "clipping",
        project: "assets",
        headline: "Inventory, made clickable",
        body: [
            "Hardware records for the Center for High Throughput Computing lived in a custom database and a lot of memory.",
            "A Tkinter front end put check-in, search and history in one window for staff.",
        ],
        x: 28.8, y: 15.9, w: 2.9, h: 1.7, tilt: 0.4,
    },
    {
        id: "ast-inventory",
        kind: "artifact",
        project: "assets",
        variant: "inventory",
        title: "Equipment record",
        lines: ["ASSET 04417", "CLASS · COMPUTE NODE", "STATUS · IN SERVICE", "LOC · CHTC"],
        x: 23, y: 17.4, w: 3.4, h: 1.8,
    },

    // ── Transitional artifacts ──────────────────────────────────────────────
    {
        id: "t-divider-ac",
        kind: "artifact",
        variant: "divider",
        title: "A–C",
        lines: ["Selected work", "1 of 1"],
        x: 12.9, y: 2.6, w: 2.2, h: 1.4,
    },
    {
        id: "t-code",
        kind: "artifact",
        variant: "code",
        title: "audio/formants.ts",
        lines: [
            "const [f1, f2] = peaks(spectrum)",
            "return chart.project(f1, f2)",
        ],
        x: 15.7, y: 3.4, w: 2.8, h: 1.7, tilt: 0.6,
    },
    {
        id: "t-testpattern",
        kind: "artifact",
        variant: "test-pattern",
        title: "Density",
        x: 19.2, y: 2.4, w: 1.9, h: 1.9,
    },
    {
        id: "t-voc-nav",
        kind: "capture",
        src: `${CAPTURES}/vocalize-nav.jpg`,
        label: "masthead crop",
        x: 12.4, y: 5.4, w: 3, h: 1.1,
    },
    {
        id: "t-stamp",
        kind: "artifact",
        variant: "stamp",
        title: "Filmed",
        lines: ["FRAME COMPLETE"],
        x: 16.6, y: 5.9, w: 2, h: 1.3, tilt: -1.2,
    },
    {
        id: "t-reference",
        kind: "artifact",
        variant: "reference",
        title: "Reference card",
        lines: ["REDUCTION 24:1", "POLARITY NEGATIVE", "SHEET 1 OF 1"],
        x: 10.75, y: 8.9, w: 2.5, h: 1.8, tilt: 0.5,
    },
    {
        id: "t-map",
        kind: "artifact",
        variant: "map",
        title: "San José · campus",
        x: 10.2, y: 11.3, w: 2.6, h: 1.7,
    },
    {
        id: "t-blank",
        kind: "artifact",
        variant: "blank",
        x: 20, y: 6.3, w: 2.1, h: 1.4,
    },
    {
        id: "t-coordinates",
        kind: "artifact",
        variant: "coordinates",
        title: "Index",
        lines: ["37.3352 N", "121.8811 W", "ALT 26 M"],
        x: 23.9, y: 10, w: 3, h: 1.3,
    },
    {
        id: "t-waveform",
        kind: "artifact",
        variant: "waveform",
        title: "Sustained /a/",
        x: 6, y: 9.4, w: 2.8, h: 1.5, tilt: -0.5,
    },
    {
        id: "t-bal-nav",
        kind: "capture",
        src: `${CAPTURES}/balalaika-nav.jpg`,
        label: "masthead crop",
        x: 12.9, y: 15, w: 3, h: 1.1,
    },
    {
        id: "t-program",
        kind: "artifact",
        variant: "program",
        title: "Programme",
        lines: ["Korobushka", "Dark Eyes", "Kalinka"],
        x: 12.9, y: 16.6, w: 2.6, h: 1.7, tilt: 0.6,
    },
    {
        id: "t-label",
        kind: "artifact",
        variant: "label",
        title: "CHTC",
        lines: ["PROPERTY RECORD"],
        x: 20, y: 13.2, w: 2.4, h: 1.3, tilt: -0.8,
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
        x: 17.4, y: 17, w: 3.2, h: 1.8,
    },
    {
        id: "t-prk-nav",
        kind: "capture",
        src: `${CAPTURES}/parking-nav.jpg`,
        label: "masthead crop",
        x: 16.2, y: 15.2, w: 2.8, h: 1,
    },
    {
        id: "t-sat-nav",
        kind: "capture",
        src: `${CAPTURES}/satellite-nav.jpg`,
        label: "masthead crop",
        x: 23.6, y: 11.9, w: 2.8, h: 1,
    },
    {
        id: "t-orbit",
        kind: "artifact",
        variant: "telemetry",
        title: "Pass · descending",
        lines: ["INC 51.6°", "PERIOD 92.7 MIN", "PROXY · EDGE"],
        x: 27.4, y: 11.6, w: 2.8, h: 1.5, tilt: 0.6,
    },
    {
        id: "t-divider-mid",
        kind: "artifact",
        variant: "divider",
        title: "D–J",
        lines: ["Continued", "Overleaf"],
        x: 4.4, y: 11.4, w: 2.6, h: 1.5,
    },
    {
        id: "t-divider-end",
        kind: "artifact",
        variant: "divider",
        title: "END",
        lines: ["Sheet complete", "Rewind"],
        x: 30.4, y: 9.4, w: 2.2, h: 1.4,
    },
];

/** A project's cells, its bounding box, and the point the lens centres on. */
export type Cluster = {
    project: Project;
    cells: Cell[];
    focus: { x: number; y: number };
    bounds: { x: number; y: number; w: number; h: number };
    /** Index-style coordinate for the cluster, e.g. "B2". */
    coordinate: string;
};

/** Sheet coordinates run A.. across in 2-unit columns and 1.. down in 2-unit rows. */
export function coordinateAt(x: number, y: number): string {
    const column = String.fromCharCode(65 + Math.max(0, Math.floor(x / 2)));
    const row = Math.max(1, Math.floor(y / 2) + 1);
    return `${column}${row}`;
}

export const clusters: Cluster[] = projects.map((project) => {
    const owned = cells.filter((cell) => cell.project === project.id);
    const minX = Math.min(...owned.map((c) => c.x));
    const minY = Math.min(...owned.map((c) => c.y));
    const maxX = Math.max(...owned.map((c) => c.x + c.w));
    const maxY = Math.max(...owned.map((c) => c.y + c.h));
    const bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    const focus = { x: minX + bounds.w / 2, y: minY + bounds.h / 2 };
    return { project, cells: owned, bounds, focus, coordinate: coordinateAt(focus.x, focus.y) };
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
