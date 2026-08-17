/**
 * The microfiche viewer: a finite two-dimensional contact sheet seen through a
 * lens. Selecting a project pans and zooms the lens to that project's cluster;
 * the sheet can also be dragged, scrubbed and stepped through directly.
 *
 * The view is held in a ref and written straight to the DOM so that dragging
 * and travelling never re-render the ~30 cells on the sheet.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import SheetCell from "./SheetCell";
import {
    cells,
    clusters,
    nearestClusterIndex,
    projects,
    SHEET,
    type ProjectId,
} from "./sheetData";
import { useTransportAudio } from "./useTransportAudio";
import "./microfiche.css";

type Props = {
    activeIndex: number;
    onActiveChange: (index: number) => void;
    hoveredIndex: number | null;
    soundOn: boolean;
};

type View = { x: number; y: number; zoom: number };

/** Pointer travel, in px, past which a gesture counts as a drag rather than a click. */
const DRAG_THRESHOLD = 7;
/** Extra sheet units kept around a cluster so neighbouring material stays visible. */
const CLUSTER_MARGIN = 1.45;
/** Blank film the lens may show past the printed area, so clusters near an
 *  edge can still be centred. The sheet stays finite — this is its margin. */
const SHEET_BLEED = 3;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.05;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function MicroficheViewer({
    activeIndex,
    onActiveChange,
    hoveredIndex,
    soundOn,
}: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    /** Lens-sized wrapper that carries the motion filter, so the blur never
     *  has to rasterise the whole sheet. */
    const filmRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const blurRef = useRef<SVGFEGaussianBlurElement>(null);

    const viewRef = useRef<View>({ x: 0, y: 0, zoom: 0.5 });
    const sizeRef = useRef({ width: 0, height: 0 });
    const frameRef = useRef<number | null>(null);
    /** The index the viewer itself last settled on, so its own snaps don't re-trigger travel. */
    const settledRef = useRef(activeIndex);
    const [ready, setReady] = useState(false);
    const [travelling, setTravelling] = useState(false);

    const transport = useTransportAudio(soundOn);
    const reducedMotionRef = useRef(false);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotionRef.current = query.matches;
        const sync = (event: MediaQueryListEvent) => {
            reducedMotionRef.current = event.matches;
        };
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, []);

    /** Zoom that fits a cluster's bounds inside the lens with a little room around it. */
    const zoomForCluster = useCallback((index: number) => {
        const { width, height } = sizeRef.current;
        if (!width || !height) return 0.5;
        const { bounds } = clusters[index];
        const fitX = width / ((bounds.w + CLUSTER_MARGIN * 2) * SHEET.unit);
        const fitY = height / ((bounds.h + CLUSTER_MARGIN * 2) * SHEET.unit);
        return clamp(Math.min(fitX, fitY), MIN_ZOOM, MAX_ZOOM);
    }, []);

    /** Keep the lens over the sheet; `softness` allows rubber-banding while dragging. */
    const clampView = useCallback((view: View, softness = 0): View => {
        const { width, height } = sizeRef.current;
        const halfW = width / (2 * view.zoom * SHEET.unit);
        const halfH = height / (2 * view.zoom * SHEET.unit);

        const limit = (value: number, half: number, extent: number) => {
            const min = half - SHEET_BLEED;
            const max = extent - half + SHEET_BLEED;
            if (min >= max) return extent / 2;
            if (value < min) return softness ? min - (min - value) * softness : min;
            if (value > max) return softness ? max + (value - max) * softness : max;
            return value;
        };

        return {
            zoom: view.zoom,
            x: limit(view.x, halfW, SHEET.width),
            y: limit(view.y, halfH, SHEET.height),
        };
    }, []);

    const applyView = useCallback(() => {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const { x, y, zoom } = viewRef.current;
        const { width, height } = sizeRef.current;
        sheet.style.transform =
            `translate3d(${width / 2}px, ${height / 2}px, 0) scale(${zoom}) ` +
            `translate3d(${-x * SHEET.unit}px, ${-y * SHEET.unit}px, 0)`;
    }, []);

    /** Directional blur + contrast, driven by how fast the sheet is moving on screen. */
    const applyMotion = useCallback((screenVx: number, screenVy: number) => {
        const blur = blurRef.current;
        const film = filmRef.current;
        if (!blur || !film) return 0;
        const bx = clamp(Math.abs(screenVx) * 0.16, 0, 13);
        const by = clamp(Math.abs(screenVy) * 0.16, 0, 13);
        blur.setAttribute("stdDeviation", `${bx.toFixed(2)} ${by.toFixed(2)}`);
        const speed = Math.hypot(screenVx, screenVy);
        film.style.setProperty("--motion-contrast", String(1 + clamp(speed * 0.0035, 0, 0.22)));
        // The filter is only attached while moving; at rest the sheet renders
        // unrasterised so the captures and type stay crisp.
        film.classList.toggle("has-motion", speed > 0.4);
        return speed;
    }, []);

    const clearMotion = useCallback(() => {
        blurRef.current?.setAttribute("stdDeviation", "0 0");
        const film = filmRef.current;
        if (!film) return;
        film.style.setProperty("--motion-contrast", "1");
        film.classList.remove("has-motion");
    }, []);

    const cancelFrame = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
    }, []);

    /** Animate the lens to a cluster. Travel time grows with distance. */
    const travelTo = useCallback(
        (index: number, options: { silent?: boolean } = {}) => {
            const { width } = sizeRef.current;
            if (!width) return;
            cancelFrame();

            const from = { ...viewRef.current };
            const target = clampView({
                x: clusters[index].focus.x,
                y: clusters[index].focus.y,
                zoom: zoomForCluster(index),
            });

            const distance = Math.hypot(target.x - from.x, target.y - from.y);
            settledRef.current = index;

            if (reducedMotionRef.current || distance < 0.01) {
                // Reduced motion swaps the long pan for a short fade and a snap.
                viewRef.current = target;
                applyView();
                clearMotion();
                setTravelling(false);
                if (distance >= 0.01) {
                    if (!options.silent) transport.lock();
                    const film = filmRef.current;
                    if (film) {
                        // Restart the fade by forcing a reflow between removals.
                        film.classList.remove("is-cut");
                        film.getBoundingClientRect();
                        film.classList.add("is-cut");
                    }
                }
                return;
            }

            const duration = clamp(500 + distance * 36, 500, 1600);
            // Longer journeys pull the lens back further so more of the sheet passes by.
            const dip = clamp(distance / 55, 0, 0.24);
            const start = performance.now();

            setTravelling(true);
            if (!options.silent) transport.start();

            let previous = { x: from.x, y: from.y };

            const step = (now: number) => {
                const t = clamp((now - start) / duration, 0, 1);
                const eased = easeInOut(t);
                const zoom = (from.zoom + (target.zoom - from.zoom) * eased) * (1 - dip * Math.sin(Math.PI * eased));
                const next = {
                    x: from.x + (target.x - from.x) * eased,
                    y: from.y + (target.y - from.y) * eased,
                    zoom,
                };
                viewRef.current = next;
                applyView();

                const screenVx = (next.x - previous.x) * SHEET.unit * zoom;
                const screenVy = (next.y - previous.y) * SHEET.unit * zoom;
                previous = { x: next.x, y: next.y };
                const speed = applyMotion(screenVx, screenVy);
                if (!options.silent) {
                    transport.setIntensity(clamp(speed / 26, 0, 1) * clamp(0.45 + distance / 30, 0, 1));
                }

                if (t < 1) {
                    frameRef.current = requestAnimationFrame(step);
                    return;
                }
                frameRef.current = null;
                viewRef.current = target;
                applyView();
                clearMotion();
                setTravelling(false);
                if (!options.silent) {
                    transport.stop();
                    transport.lock();
                }
            };

            frameRef.current = requestAnimationFrame(step);
        },
        [applyMotion, applyView, cancelFrame, clampView, clearMotion, transport, zoomForCluster],
    );

    /** Settle on whichever cluster the lens is closest to and tell the left column. */
    const snapToNearest = useCallback(() => {
        const { x, y } = viewRef.current;
        const index = nearestClusterIndex(x, y);
        travelTo(index);
        if (index !== activeIndex) onActiveChange(index);
    }, [activeIndex, onActiveChange, travelTo]);

    // Measure the lens and keep the current cluster framed through resizes.
    useLayoutEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const observer = new ResizeObserver((entries) => {
            const box = entries[0].contentRect;
            const first = sizeRef.current.width === 0;
            sizeRef.current = { width: box.width, height: box.height };
            if (first) {
                const index = settledRef.current;
                viewRef.current = clampView({
                    x: clusters[index].focus.x,
                    y: clusters[index].focus.y,
                    zoom: zoomForCluster(index),
                });
                applyView();
                setReady(true);
            } else if (frameRef.current === null) {
                viewRef.current = clampView({ ...viewRef.current, zoom: zoomForCluster(settledRef.current) });
                applyView();
            }
        });

        observer.observe(stage);
        return () => observer.disconnect();
    }, [applyView, clampView, zoomForCluster]);

    // Travel when the active project changes from outside (the left column).
    useEffect(() => {
        if (!ready || activeIndex === settledRef.current) return;
        travelTo(activeIndex);
    }, [activeIndex, ready, travelTo]);

    useEffect(() => cancelFrame, [cancelFrame]);

    // ── Direct manipulation ────────────────────────────────────────────────
    const dragRef = useRef({
        active: false,
        moved: false,
        captured: false,
        pointerId: -1,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        lastTime: 0,
        vx: 0,
        vy: 0,
    });
    /**
     * Pointer capture retargets the follow-up `click` to the capturing element,
     * so the cell under the press is remembered here at pointerdown instead.
     */
    const pressedRef = useRef<HTMLElement | null>(null);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        cancelFrame();
        transport.stop();
        setTravelling(false);
        const drag = dragRef.current;
        drag.active = true;
        drag.moved = false;
        drag.captured = false;
        drag.pointerId = event.pointerId;
        drag.startX = drag.lastX = event.clientX;
        drag.startY = drag.lastY = event.clientY;
        drag.lastTime = performance.now();
        drag.vx = drag.vy = 0;
        pressedRef.current = event.target as HTMLElement;
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag.active || event.pointerId !== drag.pointerId) return;

        const dx = event.clientX - drag.lastX;
        const dy = event.clientY - drag.lastY;
        const now = performance.now();
        const dt = Math.max(1, now - drag.lastTime);

        if (
            !drag.moved &&
            Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_THRESHOLD
        ) {
            drag.moved = true;
            // Capture only once it is a real drag, so plain clicks keep their
            // natural target and the pointer can leave the lens mid-gesture.
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.captured = true;
            transport.start();
        }

        if (drag.moved) {
            const { zoom } = viewRef.current;
            viewRef.current = clampView(
                {
                    ...viewRef.current,
                    x: viewRef.current.x - dx / (SHEET.unit * zoom),
                    y: viewRef.current.y - dy / (SHEET.unit * zoom),
                },
                0.32,
            );
            applyView();
            const speed = applyMotion(-dx, -dy);
            transport.setIntensity(clamp(speed / 30, 0, 1));
        }

        // Exponential smoothing keeps a flick's velocity without a stray last frame.
        drag.vx = drag.vx * 0.7 + (dx / dt) * 0.3;
        drag.vy = drag.vy * 0.7 + (dy / dt) * 0.3;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        drag.lastTime = now;
    };

    /** Restrained glide after a flick, then settle on the nearest cluster. */
    const runInertia = useCallback(() => {
        const drag = dragRef.current;
        const { zoom } = viewRef.current;
        let vx = -drag.vx / (SHEET.unit * zoom);
        let vy = -drag.vy / (SHEET.unit * zoom);

        if (reducedMotionRef.current || Math.hypot(vx, vy) < 0.0006) {
            transport.stop();
            snapToNearest();
            return;
        }

        let last = performance.now();
        const step = (now: number) => {
            const dt = Math.min(34, now - last);
            last = now;
            const decay = 0.9 ** (dt / 16.67);
            vx *= decay;
            vy *= decay;

            viewRef.current = clampView(
                {
                    ...viewRef.current,
                    x: viewRef.current.x + vx * dt,
                    y: viewRef.current.y + vy * dt,
                },
                0.18,
            );
            applyView();

            const screenVx = vx * dt * SHEET.unit * viewRef.current.zoom;
            const screenVy = vy * dt * SHEET.unit * viewRef.current.zoom;
            const speed = applyMotion(screenVx, screenVy);
            transport.setIntensity(clamp(speed / 30, 0, 1));

            if (Math.hypot(vx, vy) > 0.0006) {
                frameRef.current = requestAnimationFrame(step);
                return;
            }
            frameRef.current = null;
            clearMotion();
            transport.stop();
            snapToNearest();
        };

        frameRef.current = requestAnimationFrame(step);
    }, [applyMotion, applyView, clampView, clearMotion, snapToNearest, transport]);

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag.active || event.pointerId !== drag.pointerId) return;
        drag.active = false;
        if (drag.captured && event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drag.captured = false;
        if (drag.moved) runInertia();
    };

    /**
     * A click only counts when the pointer stayed put. Clicking the centred
     * primary capture opens the live site; anything else centres its project.
     */
    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (dragRef.current.moved) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const target = pressedRef.current ?? (event.target as HTMLElement);
        pressedRef.current = null;
        const cellNode = target.closest<HTMLElement>("[data-cell]");
        if (!cellNode) return;
        const cell = cells.find((entry) => entry.id === cellNode.dataset.cell);
        if (!cell) return;

        const activeProjectId: ProjectId = projects[activeIndex].id;
        const isCentredPrimary =
            cell.kind === "capture" && cell.primary === true && cell.project === activeProjectId;

        if (isCentredPrimary) {
            // The real anchor handles its own activation; don't open the site twice.
            if (target.closest("a")) return;
            const url = projects[activeIndex].url;
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            return;
        }

        event.preventDefault();
        const index = cell.project
            ? projects.findIndex((project) => project.id === cell.project)
            : nearestClusterIndex(cell.x + cell.w / 2, cell.y + cell.h / 2);
        if (index >= 0 && index !== activeIndex) onActiveChange(index);
    };

    // Wheel and trackpad scrub across nearby cells, then settle.
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        let settle: number | undefined;

        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            cancelFrame();
            const { zoom } = viewRef.current;
            viewRef.current = clampView(
                {
                    ...viewRef.current,
                    x: viewRef.current.x + event.deltaX / (SHEET.unit * zoom),
                    y: viewRef.current.y + event.deltaY / (SHEET.unit * zoom),
                },
                0.22,
            );
            applyView();
            transport.start();
            const speed = applyMotion(event.deltaX, event.deltaY);
            transport.setIntensity(clamp(speed / 40, 0, 1));

            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
                clearMotion();
                transport.stop();
                snapToNearest();
            }, 220);
        };

        stage.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            stage.removeEventListener("wheel", onWheel);
            window.clearTimeout(settle);
        };
    }, [applyMotion, applyView, cancelFrame, clampView, clearMotion, snapToNearest, transport]);

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = (delta: number) => {
            event.preventDefault();
            const next = (activeIndex + delta + projects.length) % projects.length;
            onActiveChange(next);
        };

        if (event.key === "ArrowRight" || event.key === "ArrowDown") step(1);
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") step(-1);
        else if (event.key === "Enter") {
            const url = projects[activeIndex].url;
            if (url) {
                event.preventDefault();
                window.open(url, "_blank", "noopener,noreferrer");
            }
        }
    };

    const activeProjectId = projects[activeIndex].id;
    // Hovering the project that is already centred has nothing to point at.
    const hintedProjectId =
        hoveredIndex !== null && hoveredIndex !== activeIndex ? projects[hoveredIndex].id : null;

    return (
        <div
            className={`fiche-window ${travelling ? "is-travelling" : ""} ${ready ? "is-ready" : ""}`}
            ref={stageRef}
            role="application"
            aria-roledescription="Microfiche viewer"
            aria-label={`Microfiche sheet, showing ${projects[activeIndex].name}. Use arrow keys to move between projects.`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={onClick}
            onKeyDown={onKeyDown}
        >
            {/* Directional blur, driven from the animation loop. */}
            <svg className="fiche-filter" aria-hidden="true" focusable="false">
                <filter id="fiche-transport-blur" x="-6%" y="-6%" width="112%" height="112%">
                    <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" />
                </filter>
            </svg>

            <div className="fiche-film" ref={filmRef}>
                <div className="fiche-sheet" ref={sheetRef}>
                    <div className="fiche-grid" aria-hidden="true" />
                    {cells.map((cell) => (
                        <SheetCell
                            key={cell.id}
                            cell={cell}
                            project={projects.find((project) => project.id === cell.project)}
                            active={cell.project === activeProjectId}
                            hinted={hintedProjectId !== null && cell.project === hintedProjectId}
                        />
                    ))}
                </div>
            </div>

            <div className="fiche-lens" aria-hidden="true" />
        </div>
    );
}
