/**
 * Renders one cell of the contact sheet. Website captures get a warm two-colour
 * treatment; everything else is drawn natively so it stays sharp at any zoom.
 */
import type { Project } from "../projects";
import { coordinateAt, SPANISH_VOWELS, type Cell } from "./sheetData";

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
        case "phonetic": {
            /**
             * A vowel chart in the conventional orientation: F2 along the top
             * running high-to-low left to right, F1 down the left side. That
             * puts close front /i/ at the top left and open /a/ at the bottom,
             * matching how the vowel space is always drawn.
             */
            const X0 = 22;
            const X1 = 96;
            const Y0 = 14;
            const Y1 = 46;
            const F2_HIGH = 2700;
            const F2_LOW = 800;
            const F1_LOW = 250;
            const F1_HIGH = 900;
            const xOf = (f2: number) => X0 + ((F2_HIGH - f2) * (X1 - X0)) / (F2_HIGH - F2_LOW);
            const yOf = (f1: number) => Y0 + ((f1 - F1_LOW) * (Y1 - Y0)) / (F1_HIGH - F1_LOW);

            const plot = SPANISH_VOWELS.map((vowel) => ({
                ipa: vowel.ipa,
                x: xOf((vowel.f2[0] + vowel.f2[1]) / 2),
                y: yOf((vowel.f1[0] + vowel.f1[1]) / 2),
            }));

            return (
                <div className="fiche-body fiche-phonetic">
                    <p className="fiche-title">{title}</p>
                    {/* A plot, so it must not be stretched to fit the cell: the
                        dots have to stay round and the triangle true. */}
                    <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                        <path className="fiche-axis" d={`M ${X0} ${Y1} L ${X0} ${Y0} L ${X1} ${Y0}`} />

                        {[2500, 2000, 1500, 1000].map((f2) => (
                            <g key={`f2-${f2}`}>
                                <line className="fiche-axis" x1={xOf(f2)} y1={Y0} x2={xOf(f2)} y2={Y0 - 2} />
                                <text className="fiche-tick" x={xOf(f2)} y={Y0 - 4} textAnchor="middle">
                                    {f2}
                                </text>
                            </g>
                        ))}
                        {[300, 500, 700, 900].map((f1) => (
                            <g key={`f1-${f1}`}>
                                <line className="fiche-axis" x1={X0} y1={yOf(f1)} x2={X0 - 2} y2={yOf(f1)} />
                                <text className="fiche-tick" x={X0 - 3.5} y={yOf(f1) + 1.4} textAnchor="end">
                                    {f1}
                                </text>
                            </g>
                        ))}

                        <polygon points={plot.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} />
                        {plot.map((point) => (
                            <g key={point.ipa}>
                                <circle cx={point.x} cy={point.y} r="2.4" />
                                <text x={point.x + 3.5} y={point.y + 2.6}>{point.ipa}</text>
                            </g>
                        ))}

                        {/* Each title sits with its own axis: F2 above the top
                            scale, F1 turned along the left one. */}
                        <text className="fiche-tick" x={(X0 + X1) / 2} y={4} textAnchor="middle">
                            F2 (Hz)
                        </text>
                        <text
                            className="fiche-tick"
                            x={7}
                            y={(Y0 + Y1) / 2}
                            textAnchor="middle"
                            transform={`rotate(-90 7 ${(Y0 + Y1) / 2})`}
                        >
                            F1 (Hz)
                        </text>
                    </svg>
                    <p className="fiche-foot">{lines.join(" · ")}</p>
                </div>
            );
        }

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
            // A performance notice: the engagement set, then when.
            return (
                <div className="fiche-body fiche-program">
                    <p className="fiche-title">{title}</p>
                    <strong>{lines[0]}</strong>
                    <p className="fiche-foot">{lines.slice(1).join(" · ")}</p>
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
                    <span className={`fiche-duotone ${cell.fit === "contain" ? "is-contain" : ""}`}>
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
