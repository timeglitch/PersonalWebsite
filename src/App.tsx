import { useEffect, useState } from "react";
import "./App.css";
import { MicroficheViewer, clusters } from "./microfiche";
import { projects } from "./projects";

function App() {
    const [activeIndex, setActiveIndex] = useState(0);
    /**
     * Bumped on every index click. A drag leaves the lens away from the project
     * the list already calls active, so clicking that same entry must re-frame
     * it — which a state value that does not change cannot express.
     */
    const [focusToken, setFocusToken] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [soundOn, setSoundOn] = useState(() =>
        window.matchMedia("(min-width: 901px)").matches,
    );
    const activeProject = projects[activeIndex];

    useEffect(() => {
        const desktopQuery = window.matchMedia("(min-width: 901px)");
        const syncSoundWithViewport = (event: MediaQueryListEvent) => {
            setSoundOn(event.matches);
        };

        desktopQuery.addEventListener("change", syncSoundWithViewport);
        return () => {
            desktopQuery.removeEventListener("change", syncSoundWithViewport);
        };
    }, []);

    return (
        <main className="portfolio-shell">
            <header className="masthead">
                <a className="monogram" href="#top" aria-label="Frank Zhang, home">FZ</a>
                <p>Things I&apos;ve Built</p>
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

            <div className="desktop-layout">
                <div className="left-column">
                    <section className="intro" id="top" aria-labelledby="page-title">
                        <h1 id="page-title">Frank<br />Zhang</h1>
                        <div className="intro-copy">
                            <p className="eyebrow">Software engineer · Bay Area, CA</p>
                            <p className="dek">I write software to solve problems.</p>
                            <nav className="contact-links" aria-label="External links">
                                <a href="https://docs.google.com/document/d/1Ngmw-ZuhaUzupvgZQvM-1YMePI2_ZzQVlHGfEHZp_2Q/edit?usp=sharing" target="_blank" rel="noreferrer">Résumé ↗</a>
                                <a href="https://www.linkedin.com/in/frankjzhang/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
                                <a href="https://github.com/timeglitch" target="_blank" rel="noreferrer">GitHub ↗</a>
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
                                className={index === activeIndex ? "active" : ""}
                                style={{ zIndex: index + 1 }}
                            >
                                <span className="key-shadow" aria-hidden="true" />
                                <button
                                    type="button"
                                    /* Hover only marks the destination on the sheet; travel needs a click. */
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onFocus={() => setHoveredIndex(index)}
                                    onBlur={() => setHoveredIndex(null)}
                                    onClick={() => {
                                        setActiveIndex(index);
                                        setFocusToken((token) => token + 1);
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
                    <div className="viewer-chrome">
                        <span>Sheet 01 · {clusters[activeIndex].coordinate}</span>
                        <span className="transport" aria-hidden="true">◀ ● ▶</span>
                        <span>{activeProject.archive}</span>
                    </div>

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
