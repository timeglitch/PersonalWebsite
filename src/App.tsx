import { useEffect, useState } from "react";
import "./App.css";
import { MicroficheViewer, clusters } from "./microfiche";
import { projects } from "./projects";

const LINKS = [
    { label: "Résumé", href: "https://docs.google.com/document/d/1Ngmw-ZuhaUzupvgZQvM-1YMePI2_ZzQVlHGfEHZp_2Q/edit?usp=sharing" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/frankjzhang/" },
    { label: "GitHub", href: "https://github.com/timeglitch" },
];

function App() {
    const [activeIndex, setActiveIndex] = useState(0);
    /**
     * Bumped on every index click. A drag leaves the lens away from the project
     * the list already calls active, so clicking that same entry must re-frame
     * it — which a state value that does not change cannot express.
     */
    const [focusToken, setFocusToken] = useState(0);
    /** Latched once the opening key press has happened. */
    const [engaged, setEngaged] = useState(false);
    /** Phones give the whole screen to the film; the index slides over it. */
    const [indexOpen, setIndexOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [soundOn, setSoundOn] = useState(true);
    const activeProject = projects[activeIndex];

    /**
     * The site presses its own first key on load. The sheet is parked off its
     * mark until this fires, so the travel that answers is the same move a
     * visitor's own click makes — which is the point: it shows that the index
     * drives the sheet, rather than leaving the opening drift unexplained.
     */
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setEngaged(true);
            setFocusToken((token) => token + 1);
        }, 340);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <main className="portfolio-shell">
            <header className="masthead">
                <a className="monogram" href="#top" aria-label="Frank Zhang, home">FZ</a>
                <p>Things I&apos;ve Built</p>
                {/* The masthead is empty on a phone and the drawer is a scroll
                    away, so the links sit where they are always reachable. */}
                <nav className="masthead-links" aria-label="External links">
                    {LINKS.map((link) => (
                        <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                            {link.label}
                        </a>
                    ))}
                </nav>
                <button
                    className={`sound-toggle ${soundOn ? "is-on" : ""}`}
                    type="button"
                    aria-pressed={soundOn}
                    aria-label={`Sound ${soundOn ? "on" : "off"}`}
                    onClick={() => setSoundOn((value) => !value)}
                >
                    <span aria-hidden="true">{soundOn ? "◖))" : "◖×"}</span>
                    <span className="sound-label">Sound {soundOn ? "on" : "off"}</span>
                </button>
            </header>

            <button
                className={`index-toggle ${indexOpen ? "is-open" : ""}`}
                type="button"
                aria-expanded={indexOpen}
                onClick={() => setIndexOpen((open) => !open)}
            >
                {indexOpen ? "Close" : "Index"}
            </button>

            <div className="desktop-layout">
                <div className={`left-column ${indexOpen ? "is-open" : ""}`}>
                    <section className="intro" id="top" aria-labelledby="page-title">
                        <h1 id="page-title">Frank<br />Zhang</h1>
                        <div className="intro-copy">
                            <p className="eyebrow">Bay Area, California</p>
                            <p className="dek">I write software to solve problems.</p>
                            <nav className="contact-links" aria-label="External links">
                                {LINKS.map((link) => (
                                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                                        {link.label} ↗
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </section>

                    <section className="project-index" aria-labelledby="work-title">
                    <div className="section-rule">
                        <h2 id="work-title">Projects</h2>
                        <span>{String(projects.length).padStart(2, "0")} entries</span>
                    </div>
                    <ol onMouseLeave={() => setHoveredIndex(null)}>
                        {projects.map((project, index) => (
                            <li
                                key={project.id}
                                className={index === activeIndex && engaged ? "active" : ""}
                                style={{ zIndex: index + 1 }}
                            >
                                <span className="key-shadow" aria-hidden="true" />
                                <button
                                    type="button"
                                    /* Hover only marks the destination on the sheet; travel needs a click. */
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onFocus={() => setHoveredIndex(index)}
                                    onBlur={() => setHoveredIndex(null)}
                                    onClick={(event) => {
                                        // A second Enter on the key already held
                                        // down opens the project. Only from the
                                        // keyboard — a mouse click on the active
                                        // key still re-frames the sheet, which is
                                        // how you get back after dragging away.
                                        // A keyboard-driven click reports no count.
                                        if (event.detail === 0 && index === activeIndex && project.url) {
                                            window.open(project.url, "_blank", "noopener,noreferrer");
                                            return;
                                        }
                                        setActiveIndex(index);
                                        setFocusToken((token) => token + 1);
                                        setIndexOpen(false);
                                    }}
                                    aria-label={`Show ${project.name}`}
                                    aria-current={index === activeIndex}
                                >
                                    <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
                                    <span className="project-name">{project.name}</span>
                                    <span className="project-coordinate" aria-hidden="true">{clusters[index].coordinate}</span>
                                    <span className="project-year">{project.year}</span>
                                </button>
                                <article className="mobile-project-detail">
                                    <p className="project-role">{project.role}</p>
                                    <p>{project.description}</p>
                                    {project.url ? (
                                        <a href={project.url} target="_blank" rel="noreferrer">Visit project ↗</a>
                                    ) : (
                                        <p className="project-restricted">Private project / documentation on request</p>
                                    )}
                                </article>
                            </li>
                        ))}
                    </ol>
                    </section>
                </div>

                <article className="project-viewer" aria-live="polite">
                    <MicroficheViewer
                        activeIndex={activeIndex}
                        onActiveChange={setActiveIndex}
                        focusToken={focusToken}
                        hoveredIndex={hoveredIndex}
                        soundOn={soundOn}
                    />

                    {/* The sheet itself prints the name, dates and description, so
                        the caption exists only for screen readers. */}
                    <p className="visually-hidden">
                        {activeProject.name}. {activeProject.role}. {activeProject.description}{" "}
                        {activeProject.url ?? "Private project, documentation on request."}
                    </p>
                </article>
            </div>

            <footer>
                <span>Frank Zhang © {new Date().getFullYear()}</span>
                <a href="mailto:me@frankzhang.org">Contact me@frankzhang.org</a>
            </footer>
        </main>
    );
}

export default App;
