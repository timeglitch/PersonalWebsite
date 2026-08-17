/**
 * The portfolio's content: the projects themselves.
 *
 * This is the site's source of truth about the work, independent of how any
 * one view chooses to present it. The microfiche sheet consumes it; a future
 * list, print stylesheet or feed could consume the same thing.
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
