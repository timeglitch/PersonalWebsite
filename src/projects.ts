/**
 * The portfolio's content: the projects themselves, led by an entry about the
 * author. That entry is index 0, so it is numbered 00 and is where the site opens.
 *
 * This is the site's source of truth about the work, independent of how any
 * one view chooses to present it. The microfiche sheet consumes it; a future
 * list, print stylesheet or feed could consume the same thing.
 */

export type ProjectId = "about" | "vocalize" | "parking" | "satellite" | "balalaika" | "assets";

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
        id: "about",
        name: "About me",
        year: "",
        dates: "Bay Area, CA",
        role: "Systems · Software · IT",
        description:
            "Test Engineer at 1X Technologies, previously a system administrator intern at the Center for High Throughput Computing. Studied Computer Sciences and Linguistics at UW–Madison.",
        archive: "FZ·ABT·2026",
    },
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
        year: "2025",
        dates: "2025–2026",
        role: "React · Python",
        description:
            "Plots four San Jose State University garages against time, so a driver can see the shape of a normal Tuesday. A Python collector polls the campus parking status; the front end is React.",
        archive: "FZ·PRK·2025",
        url: "https://timeglitch.github.io/SJSUParkingMonitor/",
    },
    {
        id: "satellite",
        name: "Satellite Tracker",
        year: "2025",
        dates: "2025",
        role: "React · Three.js · Data",
        description:
            "Visualize interpolated balloon positions overlaid on EONET wildfire locations, built with React, Three.js and a serverless proxy.",
        archive: "FZ·SAT·2025",
        url: "https://windborne-nu.vercel.app/",
    },
    {
        id: "balalaika",
        name: "SF Balalaika Ensemble",
        year: "2026",
        dates: "2026–",
        role: "HTML · CSS · JavaScript",
        description:
            "A website for the San Francisco Balalaika Ensemble, a local folk music group I play in. Built in raw HTML/CSS/JavaScript, to make it as easy as possible to update and host.",
        archive: "FZ·BAL·2026",
        url: "https://sfbalalaika.org",
    },
    {
        id: "assets",
        name: "Asset System GUI",
        year: "2023",
        dates: "2023",
        role: "Python · Tkinter · Database",
        description:
            "The Center for High Throughput Computing tracked about 1,000 hosts in bespoke YAML. I built a Tkinter interface to interact with it easily.",
        archive: "FZ·AST·2023",
        restricted: true,
    },
];
