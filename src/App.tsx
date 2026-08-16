import { useRef, useState } from "react";
import "./App.css";

type Project = {
    name: string;
    year: string;
    role: string;
    description: string;
    url?: string;
};

const projects: Project[] = [
    {
        name: "Vocalize",
        year: "2025",
        role: "React · TypeScript · Audio",
        description:
            "Help people learn vowel sounds for Spanish using live audio processing and visualizations. A novel application for accessible biofeedback in language learning.",
        url: "https://vocalize-web-ten.vercel.app/",
    },
    {
        name: "SJSU Parking Tracker",
        year: "2024",
        role: "React · Python",
        description:
            "A tracker for parking availability at San Jose State University, built with React and a Python backend.",
        url: "https://timeglitch.github.io/SJSUParkingMonitor/",
    },
    {
        name: "Satellite Tracker",
        year: "2024",
        role: "React · Three.js · Data",
        description:
            "Visualize interpolated satellite data overlaid on EONET wildfire locations, built with React, Three.js and a serverless proxy.",
        url: "https://windborne-nu.vercel.app/",
    },
    {
        name: "SF Balalaika Ensemble",
        year: "2023",
        role: "HTML · CSS · JavaScript",
        description:
            "A website for the San Francisco Balalaika Ensemble, a local folk music group I play in. Built in raw HTML/CSS/JavaScript, to make it as easy as possible to update and host.",
        url: "https://sfbalalaika.org",
    },
    {
        name: "Asset System GUI",
        year: "2023",
        role: "Python · Tkinter · Database",
        description:
            "A graphical user interface for Center for High Throughput Computing assets, built with Python and Tkinter on top of a custom database.",
    },
];

function App() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [soundOn, setSoundOn] = useState(false);
    const audioContext = useRef<AudioContext | null>(null);
    const activeProject = projects[activeIndex];

    const playTransportClick = () => {
        if (!soundOn) return;
        const context = audioContext.current ?? new AudioContext();
        audioContext.current = context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(82, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(48, context.currentTime + 0.035);
        gain.gain.setValueAtTime(0.025, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.045);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.05);
    };

    const selectProject = (index: number) => {
        if (index === activeIndex) return;
        setActiveIndex(index);
        playTransportClick();
    };

    return (
        <main className="portfolio-shell">
            <header className="masthead">
                <a className="monogram" href="#top" aria-label="Frank Zhang, home">FZ</a>
                <p>Selected work / 2023—25</p>
                <button
                    className={`sound-toggle ${soundOn ? "is-on" : ""}`}
                    type="button"
                    aria-pressed={soundOn}
                    onClick={() => setSoundOn((value) => !value)}
                >
                    <span aria-hidden="true">{soundOn ? "◖))" : "◖×"}</span>
                    Sound {soundOn ? "on" : "off"}
                </button>
            </header>

            <section className="intro" id="top" aria-labelledby="page-title">
                <div className="issue-mark" aria-hidden="true">No. 01</div>
                <h1 id="page-title">Frank<br />Zhang</h1>
                <div className="intro-copy">
                    <p className="eyebrow">Software engineer · Bay Area, CA</p>
                    <p className="dek">I write software to solve problems—making useful, expressive things for the web and beyond.</p>
                    <nav className="contact-links" aria-label="External links">
                        <a href="https://github.com/timeglitch" target="_blank" rel="noreferrer">GitHub ↗</a>
                        <a href="https://www.linkedin.com/in/frankjzhang/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
                        <a href="https://docs.google.com/document/d/1Ngmw-ZuhaUzupvgZQvM-1YMePI2_ZzQVlHGfEHZp_2Q/edit?usp=sharing" target="_blank" rel="noreferrer">Résumé ↗</a>
                    </nav>
                </div>
            </section>

            <section className="work" aria-labelledby="work-title">
                <div className="project-index">
                    <div className="section-rule">
                        <h2 id="work-title">Projects</h2>
                        <span>{String(projects.length).padStart(2, "0")} entries</span>
                    </div>
                    <ol>
                        {projects.map((project, index) => (
                            <li key={project.name} className={index === activeIndex ? "active" : ""}>
                                <button
                                    type="button"
                                    onMouseEnter={() => selectProject(index)}
                                    onFocus={() => selectProject(index)}
                                    onClick={() => selectProject(index)}
                                    aria-label={`Show ${project.name}`}
                                >
                                    <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
                                    <span className="project-name">{project.name}</span>
                                    <span className="project-year">{project.year}</span>
                                </button>
                                <article className="mobile-project-detail">
                                    <p className="project-role">{project.role}</p>
                                    <p>{project.description}</p>
                                    {project.url && <a href={project.url} target="_blank" rel="noreferrer">Visit project ↗</a>}
                                </article>
                            </li>
                        ))}
                    </ol>
                </div>

                <article className="project-viewer" aria-live="polite">
                    <div className="viewer-chrome">
                        <span>Frame {String(activeIndex + 1).padStart(2, "0")}</span>
                        <span className="transport" aria-hidden="true">◀ ● ▶</span>
                        <span>{activeProject.year}</span>
                    </div>
                    <div className={`viewer-window project-art art-${activeIndex + 1}`} key={activeProject.name}>
                        <span className="art-index">{String(activeIndex + 1).padStart(2, "0")}</span>
                        <div className="art-crosshair" aria-hidden="true" />
                        <p>{activeProject.role}</p>
                        <strong>{activeProject.name}</strong>
                        <span className="art-note">Selected work · {activeProject.year}</span>
                    </div>
                    <div className="viewer-caption" key={`${activeProject.name}-caption`}>
                        <div><p className="project-role">{activeProject.role}</p><h3>{activeProject.name}</h3></div>
                        <div>
                            <p>{activeProject.description}</p>
                            {activeProject.url && <a href={activeProject.url} target="_blank" rel="noreferrer">Open full project ↗</a>}
                        </div>
                    </div>
                </article>
            </section>

            <footer>
                <span>Frank Zhang © {new Date().getFullYear()}</span>
                <span>Built with curiosity and code.</span>
            </footer>
        </main>
    );
}

export default App;
