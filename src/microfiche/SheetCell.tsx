/**
 * Renders one cell of the contact sheet. Website captures get a warm two-colour
 * treatment; everything else is drawn natively so it stays sharp at any zoom.
 */
import type { Cell, Project } from "./sheetData";
import { coordinateAt } from "./sheetData";

type Props = {
    cell: Cell;
    project?: Project;
    /** True when this cell belongs to the project currently centred. */
    active: boolean;
    /** True while its project is hovered in the left-hand list. */
    hinted: boolean;
};

function Artifact({ cell }: { cell: Extract<Cell, { kind: "artifact" }> }) {
    const { variant, title, lines = [] } = cell;

    switch (variant) {
        case "phonetic":
            return (
                <div className="fiche-body fiche-phonetic">
                    <p className="fiche-title">{title}</p>
                    <svg viewBox="0 0 100 58" preserveAspectRatio="none" aria-hidden="true">
                        <polygon points="10,6 90,6 74,50 26,34" />
                        {[
                            { x: 12, y: 9, label: "i" },
                            { x: 24, y: 24, label: "e" },
                            { x: 46, y: 40, label: "a" },
                            { x: 74, y: 25, label: "o" },
                            { x: 88, y: 9, label: "u" },
                        ].map((point) => (
                            <g key={point.label}>
                                <circle cx={point.x} cy={point.y} r="2.4" />
                                <text x={point.x + 4} y={point.y + 3}>{point.label}</text>
                            </g>
                        ))}
                    </svg>
                    <p className="fiche-foot">F2 ← → · F1 ↑ ↓</p>
                </div>
            );

        case "waveform":
            return (
                <div className="fiche-body fiche-waveform">
                    <p className="fiche-title">{title}</p>
                    <svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
                        {Array.from({ length: 60 }, (_, i) => {
                            // A steady vowel: strong periodic core with a soft attack and decay.
                            const envelope = Math.sin((i / 59) * Math.PI) ** 0.6;
                            const height = (2 + Math.abs(Math.sin(i * 1.9)) * 16) * envelope;
                            return (
                                <rect
                                    key={i}
                                    x={i * 2}
                                    y={20 - height}
                                    width="1.1"
                                    height={height * 2}
                                />
                            );
                        })}
                    </svg>
                </div>
            );

        case "code":
            return (
                <div className="fiche-body fiche-code">
                    <p className="fiche-title">{title}</p>
                    <pre>{lines.join("\n")}</pre>
                </div>
            );

        case "parking-data":
            return (
                <div className="fiche-body fiche-data">
                    <p className="fiche-title">{title}</p>
                    <ul>
                        {lines.map((line) => {
                            const percent = Number(line.match(/(\d+)%/)?.[1] ?? 0);
                            return (
                                <li key={line}>
                                    <span>{line.replace(/\s\d+%$/, "")}</span>
                                    <span className="fiche-bar" style={{ ["--fill" as string]: `${percent}%` }} />
                                    <span>{percent}%</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            );

        case "map":
            return (
                <div className="fiche-body fiche-map">
                    <p className="fiche-title">{title}</p>
                    <svg viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">
                        {[8, 22, 36, 50, 64, 78, 92].map((x) => (
                            <line key={`v${x}`} x1={x} y1="0" x2={x - 6} y2="52" />
                        ))}
                        {[9, 21, 33, 45].map((y) => (
                            <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y - 4} />
                        ))}
                        <rect className="fiche-map-block" x="36" y="21" width="28" height="12" />
                        <circle className="fiche-map-pin" cx="50" cy="27" r="3" />
                    </svg>
                </div>
            );

        case "telemetry":
        case "reference":
        case "repertoire":
        case "timestamp":
            return (
                <div className="fiche-body fiche-record">
                    <p className="fiche-title">{title}</p>
                    <ul>
                        {lines.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ul>
                </div>
            );

        case "coordinates":
            return (
                <div className="fiche-body fiche-coordinates">
                    <p className="fiche-title">{title}</p>
                    <p className="fiche-coordinate-value">{lines.join("  ·  ")}</p>
                </div>
            );

        case "program":
            return (
                <div className="fiche-body fiche-program">
                    <p className="fiche-title">{title}</p>
                    <ol>
                        {lines.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ol>
                </div>
            );

        case "inventory":
            return (
                <div className="fiche-body fiche-inventory">
                    <p className="fiche-title">{title}</p>
                    <dl>
                        {lines.map((line) => {
                            const [term, ...rest] = line.split(" · ");
                            return (
                                <div key={line}>
                                    <dt>{term}</dt>
                                    <dd>{rest.join(" · ") || "—"}</dd>
                                </div>
                            );
                        })}
                    </dl>
                </div>
            );

        case "restricted":
            return (
                <div className="fiche-body fiche-restricted">
                    <span className="fiche-restricted-rule" aria-hidden="true" />
                    {/* An archival withheld mark, so the plate reads as deliberately
                        blank rather than as a cell that failed to load. */}
                    <span className="fiche-restricted-mark" aria-hidden="true">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                            <rect x="0.5" y="0.5" width="99" height="99" />
                            <line x1="0.5" y1="0.5" x2="99.5" y2="99.5" />
                            <line x1="99.5" y1="0.5" x2="0.5" y2="99.5" />
                        </svg>
                        <span>Image withheld</span>
                    </span>
                    <span className="fiche-restricted-foot">
                        <span className="fiche-title">Restricted</span>
                        <strong>{title}</strong>
                        <span className="fiche-restricted-note">{lines.join(" / ")}</span>
                    </span>
                </div>
            );

        case "divider":
            return (
                <div className="fiche-body fiche-divider">
                    <strong>{title}</strong>
                    <p>{lines.join(" · ")}</p>
                </div>
            );

        case "test-pattern":
            return (
                <div className="fiche-body fiche-test">
                    <p className="fiche-title">{title}</p>
                    <svg viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true">
                        {Array.from({ length: 6 }, (_, i) => (
                            <rect key={i} x={i * 10} y="0" width="10" height="16" opacity={0.12 + i * 0.17} />
                        ))}
                        {Array.from({ length: 14 }, (_, i) => (
                            <rect key={`b${i}`} x={i * 4.2} y="22" width={1.4 + i * 0.12} height="18" />
                        ))}
                    </svg>
                </div>
            );

        case "stamp":
            return (
                <div className="fiche-body fiche-stamp">
                    <strong>{title}</strong>
                    <p>{lines.join(" · ")}</p>
                </div>
            );

        case "label":
            return (
                <div className="fiche-body fiche-label">
                    <strong>{title}</strong>
                    <p>{lines.join(" · ")}</p>
                </div>
            );

        case "blank":
        default:
            return <div className="fiche-body fiche-blank" aria-hidden="true" />;
    }
}

export default function SheetCell({ cell, project, active, hinted }: Props) {
    const coordinate = coordinateAt(cell.x, cell.y);
    const isPrimaryCapture = cell.kind === "capture" && cell.primary === true;

    return (
        <div
            className={[
                "fiche-cell",
                `is-${cell.kind}`,
                active ? "is-active" : "",
                hinted ? "is-hinted" : "",
                isPrimaryCapture ? "is-primary" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            data-cell={cell.id}
            style={{
                left: `calc(var(--unit) * ${cell.x})`,
                top: `calc(var(--unit) * ${cell.y})`,
                width: `calc(var(--unit) * ${cell.w})`,
                height: `calc(var(--unit) * ${cell.h})`,
                transform: cell.tilt ? `rotate(${cell.tilt}deg)` : undefined,
            }}
        >
            {cell.kind === "capture" && (
                <figure className="fiche-capture">
                    <span className="fiche-duotone">
                        <img src={cell.src} alt={cell.label} draggable={false} loading="lazy" />
                    </span>
                    <figcaption>
                        <span>{cell.label}</span>
                        <span>{coordinate}</span>
                    </figcaption>
                    {isPrimaryCapture && project?.url && (
                        <a
                            className="fiche-open"
                            href={project.url}
                            target="_blank"
                            rel="noreferrer"
                            // The sheet swallows drags; only genuine clicks reach the anchor.
                            onDragStart={(event) => event.preventDefault()}
                        >
                            Open live site ↗
                        </a>
                    )}
                </figure>
            )}

            {cell.kind === "cover" && project && (
                <div className="fiche-body fiche-cover">
                    <p className="fiche-title">{project.archive}</p>
                    <strong>{project.name}</strong>
                    <p className="fiche-cover-meta">
                        <span>{project.dates}</span>
                        <span>{coordinate}</span>
                    </p>
                    <p className="fiche-cover-role">{project.role}</p>
                </div>
            )}

            {cell.kind === "clipping" && (
                <div className="fiche-body fiche-clipping">
                    <h4>{cell.headline}</h4>
                    <div className="fiche-columns">
                        {cell.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            )}

            {cell.kind === "artifact" && <Artifact cell={cell} />}

            <span className="fiche-coordinate" aria-hidden="true">{coordinate}</span>
        </div>
    );
}
